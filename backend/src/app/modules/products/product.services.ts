import status from "http-status";
import AppError from "../../errors/AppError";
import { sendImageToCloudinary } from "../../utils/sendImageToCloudinary";
import { CategoryModel } from "../categories/category.model";
import { TProduct } from "./product.interface";
import { ProductModel } from "./product.model";

const createProduct = async (file: Express.Multer.File | undefined, payload: TProduct) => {
    if (!file) {
        throw new AppError(status.BAD_REQUEST, "Product image is required");
    }

    const isExist = await ProductModel.findOne({ name: payload.name, isDeleted: false });
    if (isExist) {
        throw new AppError(status.CONFLICT, "Product already exists");
    }

    const category = await CategoryModel.findById(payload.category);
    if (!category) {
        throw new AppError(status.NOT_FOUND, "Category does not exist");
    }

    const imageName = `${payload.name.split(" ").join("_")}_${Date.now()}`;
    const { secure_url } = await sendImageToCloudinary(imageName, file.path);

    const result = await ProductModel.create({
        ...payload,
        image: secure_url,
        status: payload.quantity === 0 ? "outofstock" : payload.status,
    });

    await CategoryModel.findByIdAndUpdate(payload.category, { $inc: { productCount: 1 } });
    return result;
};

// public storefront: only visible products
const getAllProducts = async () => {
    return ProductModel.find({ isDeleted: false, status: { $ne: "inactive" } }).sort({ sortOrder: 1, createdAt: -1 });
};

// admin: everything that is not soft-deleted, any status
const getAllProductsForAdmin = async () => {
    return ProductModel.find({ isDeleted: false }).populate("category", "name").sort({ createdAt: -1 });
};

const getSingleProduct = async (id: string) => {
    const result = await ProductModel.findOne({ _id: id, isDeleted: false });
    if (!result) throw new AppError(status.NOT_FOUND, "Product not found");
    return result;
};

const updateProduct = async (id: string, payload: Partial<TProduct>) => {
    const current = await ProductModel.findOne({ _id: id, isDeleted: false });
    if (!current) throw new AppError(status.NOT_FOUND, "Product not found");

    const update: Partial<TProduct> = { ...payload };

    // keep status and stock consistent
    if (payload.quantity !== undefined) {
        if (payload.quantity === 0) update.status = "outofstock";
        else if (current.status === "outofstock" && payload.status === undefined) update.status = "active";
    }

    return ProductModel.findByIdAndUpdate(id, update, { new: true, runValidators: true });
};

const deleteProduct = async (id: string) => {
    const result = await ProductModel.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { isDeleted: true },
        { new: true }
    );
    if (!result) throw new AppError(status.NOT_FOUND, "Product not found");
    await CategoryModel.findByIdAndUpdate(result.category, { $inc: { productCount: -1 } });
    return result;
};

export const ProductService = {
    createProduct,
    getAllProducts,
    getAllProductsForAdmin,
    getSingleProduct,
    updateProduct,
    deleteProduct,
};
