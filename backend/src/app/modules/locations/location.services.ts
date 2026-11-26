import status from 'http-status';
import AppError from '../../errors/AppError';
import { BD_DISTRICTS } from '../../config/districts';
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

// Called at login: the member's browser position is turned into the nearest district and saved
const saveMemberLocation = async (userId: string, lat: number, lng: number) => {
    if (!inBangladesh(lat, lng)) {
        throw new AppError(status.BAD_REQUEST, 'Your location is outside Bangladesh');
    }
    let nearest = BD_DISTRICTS[0];
    let best = Infinity;
    for (const d of BD_DISTRICTS) {
        const km = distanceKm(lat, lng, d.lat, d.lng);
        if (km < best) {
            best = km;
            nearest = d;
        }
    }
    await UserModel.updateOne({ _id: userId, isDeleted: false }, { district: nearest.name });
    return { district: nearest.name, division: nearest.division };
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
