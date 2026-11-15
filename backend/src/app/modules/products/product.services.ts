import status from "http-status";
import AppError from "../../errors/AppError";
import { sendImageToCloudinary } from "../../utils/sendImageToCloudinary";
import { CategoryModel } from "../categories/category.model";
import { TProduct } from "./product.interface";
import { ProductModel } from "./product.model";

type TActor = { userId: string; role: string };

const createProduct = async (file: Express.Multer.File | undefined, payload: TProduct, actor: TActor) => {
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

    // Super admins publish straight away; admin uploads wait for a super admin's approval
    const isSuper = actor.role === "super_admin";
    const result = await ProductModel.create({
        ...payload,
        image: secure_url,
        status: payload.quantity === 0 ? "outofstock" : payload.status,
        approvalStatus: isSuper ? "approved" : "pending",
        createdBy: actor.userId,
        approvedBy: isSuper ? actor.userId : null,
        approvedAt: isSuper ? new Date() : null,
    });

    await CategoryModel.findByIdAndUpdate(payload.category, { $inc: { productCount: 1 } });
    return result;
};

// public storefront: only approved, visible products
const getAllProducts = async () => {
    // category is populated so the storefront can filter by category name / id
    return ProductModel.find({ isDeleted: false, approvalStatus: "approved", status: { $ne: "inactive" } })
        .populate("category", "name")
        .sort({ sortOrder: 1, createdAt: -1 });
};

// admin: everything that is not soft-deleted, any status
const getAllProductsForAdmin = async () => {
    return ProductModel.find({ isDeleted: false }).populate("category", "name").sort({ createdAt: -1 });
};

const getSingleProduct = async (id: string) => {
    const result = await ProductModel.findOne({ _id: id, isDeleted: false, approvalStatus: "approved" }).populate("category", "name");
    if (!result) throw new AppError(status.NOT_FOUND, "Product not found");
    return result;
};

const updateProduct = async (id: string, payload: Partial<TProduct>, actor: TActor) => {
    const current = await ProductModel.findOne({ _id: id, isDeleted: false });
    if (!current) throw new AppError(status.NOT_FOUND, "Product not found");

    const update: Partial<TProduct> = { ...payload };
    // approval is never set from the request body
    delete update.approvalStatus;
    delete update.approvedBy;
    delete update.approvedAt;

    // an admin's change needs a fresh super admin approval before members see it
    if (actor.role !== "super_admin") {
        update.approvalStatus = "pending";
        update.approvedBy = null;
        update.approvedAt = null;
    }

    // keep status and stock consistent
    if (payload.quantity !== undefined) {
        if (payload.quantity === 0) update.status = "outofstock";
        else if (current.status === "outofstock" && payload.status === undefined) update.status = "active";
    }

    return ProductModel.findByIdAndUpdate(id, update, { new: true, runValidators: true });
};

// Super admin: approve (publish) or reject a product added by an admin
const decideProductApproval = async (id: string, decision: "approved" | "rejected", actor: TActor) => {
    if (actor.role !== "super_admin") throw new AppError(status.FORBIDDEN, "Only a super admin can approve products");
    const result = await ProductModel.findOneAndUpdate(
        { _id: id, isDeleted: false },
        {
            approvalStatus: decision,
            approvedBy: decision === "approved" ? actor.userId : null,
            approvedAt: decision === "approved" ? new Date() : null,
        },
        { new: true }
    );
    if (!result) throw new AppError(status.NOT_FOUND, "Product not found");
    return result;
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
    decideProductApproval,
    getAllProducts,
    getAllProductsForAdmin,
    getSingleProduct,
    updateProduct,
    deleteProduct,
};
