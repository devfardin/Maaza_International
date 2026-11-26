import { z } from 'zod';

const saveMyLocationValidation = z.object({
    body: z.object({
        lat: z.number({ message: 'Latitude is required' }).min(-90).max(90),
        lng: z.number({ message: 'Longitude is required' }).min(-180).max(180),
    }),
});

export const LocationValidations = { saveMyLocationValidation };
