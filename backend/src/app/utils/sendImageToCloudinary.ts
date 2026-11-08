import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import config from '../config';
import multer from 'multer';

cloudinary.config({
    cloud_name: config.cloudinary_cloud_name,
    api_key: config.cloudinary_api_key,
    api_secret: config.cloudinary_api_secret,
});

export const sendImageToCloudinary = async (imageName: string, path: string): Promise<UploadApiResponse> => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload(path, 
            { public_id: imageName }, 
            (error, result) => {
            if (error) reject(error);
            else resolve(result as UploadApiResponse);
        });
    });
};

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, process.cwd()+'/uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueName = `${file.fieldname}-${Date.now()}`;
        cb(null, uniqueName);
    },
});

export const upload = multer({ storage });
