// The 64 districts of Bangladesh, grouped by division, with approximate centre coordinates.
// Used for the member location picker (profile) and the admin location map.
export type TDistrict = { name: string; division: string; lat: number; lng: number };

export const BD_DISTRICTS: readonly TDistrict[] = [
    // Barishal
    { name: 'Barguna', division: 'Barishal', lat: 22.15, lng: 90.12 },
    { name: 'Barishal', division: 'Barishal', lat: 22.70, lng: 90.35 },
    { name: 'Bhola', division: 'Barishal', lat: 22.69, lng: 90.65 },
    { name: 'Jhalokati', division: 'Barishal', lat: 22.64, lng: 90.20 },
    { name: 'Patuakhali', division: 'Barishal', lat: 22.36, lng: 90.33 },
    { name: 'Pirojpur', division: 'Barishal', lat: 22.58, lng: 89.97 },
    // Chattogram
    { name: 'Bandarban', division: 'Chattogram', lat: 22.19, lng: 92.22 },
    { name: 'Brahmanbaria', division: 'Chattogram', lat: 23.96, lng: 91.11 },
    { name: 'Chandpur', division: 'Chattogram', lat: 23.23, lng: 90.67 },
    { name: 'Chattogram', division: 'Chattogram', lat: 22.36, lng: 91.78 },
    { name: "Cox's Bazar", division: 'Chattogram', lat: 21.44, lng: 92.00 },
    { name: 'Cumilla', division: 'Chattogram', lat: 23.46, lng: 91.18 },
    { name: 'Feni', division: 'Chattogram', lat: 23.02, lng: 91.40 },
    { name: 'Khagrachhari', division: 'Chattogram', lat: 23.12, lng: 91.97 },
    { name: 'Lakshmipur', division: 'Chattogram', lat: 22.94, lng: 90.84 },
    { name: 'Noakhali', division: 'Chattogram', lat: 22.87, lng: 91.10 },
    { name: 'Rangamati', division: 'Chattogram', lat: 22.63, lng: 92.18 },
    // Dhaka
    { name: 'Dhaka', division: 'Dhaka', lat: 23.81, lng: 90.41 },
    { name: 'Faridpur', division: 'Dhaka', lat: 23.61, lng: 89.84 },
    { name: 'Gazipur', division: 'Dhaka', lat: 23.99, lng: 90.42 },
    { name: 'Gopalganj', division: 'Dhaka', lat: 23.01, lng: 89.83 },
    { name: 'Kishoreganj', division: 'Dhaka', lat: 24.43, lng: 90.78 },
    { name: 'Madaripur', division: 'Dhaka', lat: 23.16, lng: 90.19 },
    { name: 'Manikganj', division: 'Dhaka', lat: 23.86, lng: 90.00 },
    { name: 'Munshiganj', division: 'Dhaka', lat: 23.54, lng: 90.53 },
    { name: 'Narayanganj', division: 'Dhaka', lat: 23.62, lng: 90.50 },
    { name: 'Narsingdi', division: 'Dhaka', lat: 23.92, lng: 90.72 },
    { name: 'Rajbari', division: 'Dhaka', lat: 23.76, lng: 89.64 },
    { name: 'Shariatpur', division: 'Dhaka', lat: 23.22, lng: 90.35 },
    { name: 'Tangail', division: 'Dhaka', lat: 24.25, lng: 89.92 },
    // Khulna
    { name: 'Bagerhat', division: 'Khulna', lat: 22.65, lng: 89.79 },
    { name: 'Chuadanga', division: 'Khulna', lat: 23.64, lng: 88.84 },
    { name: 'Jashore', division: 'Khulna', lat: 23.17, lng: 89.21 },
    { name: 'Jhenaidah', division: 'Khulna', lat: 23.54, lng: 89.17 },
    { name: 'Khulna', division: 'Khulna', lat: 22.85, lng: 89.54 },
    { name: 'Kushtia', division: 'Khulna', lat: 23.90, lng: 89.12 },
    { name: 'Magura', division: 'Khulna', lat: 23.49, lng: 89.42 },
    { name: 'Meherpur', division: 'Khulna', lat: 23.76, lng: 88.63 },
    { name: 'Narail', division: 'Khulna', lat: 23.17, lng: 89.50 },
    { name: 'Satkhira', division: 'Khulna', lat: 22.72, lng: 89.07 },
    // Mymensingh
    { name: 'Jamalpur', division: 'Mymensingh', lat: 25.07, lng: 89.94 },
    { name: 'Mymensingh', division: 'Mymensingh', lat: 24.75, lng: 90.41 },
    { name: 'Netrokona', division: 'Mymensingh', lat: 24.87, lng: 90.73 },
    { name: 'Sherpur', division: 'Mymensingh', lat: 25.02, lng: 90.01 },
    // Rajshahi
    { name: 'Bogura', division: 'Rajshahi', lat: 24.85, lng: 89.37 },
    { name: 'Chapai Nawabganj', division: 'Rajshahi', lat: 24.60, lng: 88.27 },
    { name: 'Joypurhat', division: 'Rajshahi', lat: 25.10, lng: 89.02 },
    { name: 'Naogaon', division: 'Rajshahi', lat: 24.79, lng: 88.94 },
    { name: 'Natore', division: 'Rajshahi', lat: 24.42, lng: 89.00 },
    { name: 'Pabna', division: 'Rajshahi', lat: 24.00, lng: 89.24 },
    { name: 'Rajshahi', division: 'Rajshahi', lat: 24.37, lng: 88.60 },
    { name: 'Sirajganj', division: 'Rajshahi', lat: 24.46, lng: 89.70 },
    // Rangpur
    { name: 'Dinajpur', division: 'Rangpur', lat: 25.63, lng: 88.64 },
    { name: 'Gaibandha', division: 'Rangpur', lat: 25.33, lng: 89.53 },
    { name: 'Kurigram', division: 'Rangpur', lat: 25.81, lng: 89.64 },
    { name: 'Lalmonirhat', division: 'Rangpur', lat: 25.92, lng: 89.45 },
    { name: 'Nilphamari', division: 'Rangpur', lat: 25.93, lng: 88.85 },
    { name: 'Panchagarh', division: 'Rangpur', lat: 26.34, lng: 88.55 },
    { name: 'Rangpur', division: 'Rangpur', lat: 25.74, lng: 89.25 },
    { name: 'Thakurgaon', division: 'Rangpur', lat: 26.03, lng: 88.46 },
    // Sylhet
    { name: 'Habiganj', division: 'Sylhet', lat: 24.37, lng: 91.42 },
    { name: 'Moulvibazar', division: 'Sylhet', lat: 24.48, lng: 91.78 },
    { name: 'Sunamganj', division: 'Sylhet', lat: 25.07, lng: 91.41 },
    { name: 'Sylhet', division: 'Sylhet', lat: 24.89, lng: 91.87 },
];

export const DISTRICT_NAMES = BD_DISTRICTS.map((d) => d.name) as [string, ...string[]];
