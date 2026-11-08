import { is } from "zod/locales";
import { TProduct } from "./product.interface";
import { ProductModel } from "./product.model";
import { CategoryModel } from "../categories/category.model";
import { sendImageToCloudinary } from "../../utils/sendImageToCloudinary";

// create a product
const createProduct = async (file: any, payload: TProduct) => {
    const isExist = await ProductModel.findOne({ name: payload.name });
    if (isExist) {
        throw new Error("Product already exists");
    }
    // check category are exit
    const iscatExit = await CategoryModel.findOne({ _id: payload.category });
    if (!iscatExit) {
        throw new Error("Category does not exist");
    }
    const path = file?.path;
    const imageName = `${payload?.name?.split(' ').join('_')}_${Date.now()}`;

    // send image to cloudinary
    const { secure_url } = await sendImageToCloudinary(imageName, path);
    
    payload.image = secure_url as string;

    const result = await ProductModel.create(payload);
    if (result) {
        // update category productcont value
        await CategoryModel.findByIdAndUpdate(payload.category, {
            $inc: { productCount: 1 }
        })
    }
    return result;
}
// get all products
const getAllProducts = async () => {
    const result = await ProductModel.find();
    return result;
}
// get single product
const getSingleProduct = async (id: string) => {
    const result = await ProductModel.findById(id);
    return result;
}
// update product
const updateProduct = async (id: string, payload: Partial<TProduct>) => {
    const result = await ProductModel.findByIdAndUpdate(id, payload, { new: true });
    return result;
}

// delete product
const deleteProduct = async (id: string) => {
    const result = await ProductModel.findByIdAndUpdate(id,
        { isDeleted: true },
        { new: true, runValidators: true }
    );
    return result;
}

export const ProductService = {
    createProduct,
    getAllProducts,
    getSingleProduct,
    updateProduct,
    deleteProduct
}