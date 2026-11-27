import status from 'http-status';
import AppError from '../../errors/AppError';
import { BD_DISTRICTS } from '../../config/districts';
import config from '../../config';
import { UserModel } from '../users/user.model';

// The district list used by the admin location map
const getDistricts = () => BD_DISTRICTS.map(({ name, division }) => ({ name, division }));

// Rough bounding box of Bangladesh; positions outside it are not saved
const inBangladesh = (lat: number, lng: number) => lat >= 20.5 && lat <= 26.7 && lng >= 88 && lng <= 92.8;

// Great-circle distance in km
const distanceKm = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Google spells some Bangladesh districts differently from our list
const DISTRICT_ALIASES: Record<string, string> = {
    chittagong: 'Chattogram',
    comilla: 'Cumilla',
    bogra: 'Bogura',
    jessore: 'Jashore',
    barisal: 'Barishal',
    'chapai nawabganj': 'Chapai Nawabganj',
    "cox's bazar": "Cox's Bazar",
    'coxs bazar': "Cox's Bazar",
    'maulvibazar': 'Moulvibazar',
    'moulvi bazar': 'Moulvibazar',
    nawabganj: 'Chapai Nawabganj',
};
const canonicalDistrict = (raw: string): string | undefined => {
    const key = raw.replace(/\s+district$/i, '').trim().toLowerCase();
    const alias = DISTRICT_ALIASES[key] ?? key;
    return BD_DISTRICTS.find((d) => d.name.toLowerCase() === alias.toLowerCase())?.name;
};

// Exact district from Google reverse geocoding (administrative_area_level_2). Returns undefined on any failure.
const districtFromGoogle = async (lat: number, lng: number): Promise<string | undefined> => {
    const key = config.google_maps_api_key;
    if (!key) return undefined;
    try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&result_type=administrative_area_level_2&key=${key}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
        const body = (await res.json()) as { status: string; results: { address_components: { long_name: string; types: string[] }[] }[] };
        if (body.status !== 'OK' || !body.results.length) return undefined;
        for (const comp of body.results[0].address_components) {
            if (comp.types.includes('administrative_area_level_2')) return canonicalDistrict(comp.long_name);
        }
    } catch {
        // network or quota problem: fall back below
    }
    return undefined;
};

// Nearest district centre (fallback when Google is not available)
const nearestDistrict = (lat: number, lng: number) => {
    let nearest = BD_DISTRICTS[0];
    let best = Infinity;
    for (const d of BD_DISTRICTS) {
        const km = distanceKm(lat, lng, d.lat, d.lng);
        if (km < best) {
            best = km;
            nearest = d;
        }
    }
    return nearest;
};

// Called at login: the member's browser position becomes their district and is saved
const saveMemberLocation = async (userId: string, lat: number, lng: number) => {
    if (!inBangladesh(lat, lng)) {
        throw new AppError(status.BAD_REQUEST, 'Your location is outside Bangladesh');
    }
    const googleName = await districtFromGoogle(lat, lng);
    const district = googleName
        ? BD_DISTRICTS.find((d) => d.name === googleName)!
        : nearestDistrict(lat, lng);
    await UserModel.updateOne({ _id: userId, isDeleted: false }, { district: district.name });
    return { district: district.name, division: district.division, source: googleName ? 'google' : 'nearest' };
};

// Members per district (and per division), with map coordinates. Admins only.
const getSummary = async () => {
    const rows = await UserModel.aggregate([
        { $match: { role: 'user', isDeleted: false, district: { $nin: ['', null] } } },
        { $group: { _id: '$district', count: { $sum: 1 } } },
    ]);
    const countByDistrict = new Map<string, number>(rows.map((r) => [r._id as string, r.count as number]));

    const districts = BD_DISTRICTS.map((d) => ({
        name: d.name,
        division: d.division,
        lat: d.lat,
        lng: d.lng,
        count: countByDistrict.get(d.name) ?? 0,
    }));

    const divisionTotals = new Map<string, number>();
    for (const d of districts) divisionTotals.set(d.division, (divisionTotals.get(d.division) ?? 0) + d.count);
    const divisions = [...divisionTotals.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

    const totalWithLocation = districts.reduce((sum, d) => sum + d.count, 0);
    const totalMembers = await UserModel.countDocuments({ role: 'user', isDeleted: false });

    return {
        totalMembers,
        withLocation: totalWithLocation,
        withoutLocation: Math.max(0, totalMembers - totalWithLocation),
        districts: districts.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
        divisions,
    };
};

export const LocationServices = { getDistricts, saveMemberLocation, getSummary };
