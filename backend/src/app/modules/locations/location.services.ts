import { BD_DISTRICTS } from '../../config/districts';
import { UserModel } from '../users/user.model';

// The district list used by the profile picker
const getDistricts = () => BD_DISTRICTS.map(({ name, division }) => ({ name, division }));

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

export const LocationServices = { getDistricts, getSummary };
