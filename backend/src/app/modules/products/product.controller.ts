import status from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ProductService } from "./product.services";
import { AdminActivityServices } from "../adminActivity/adminActivity.services";

// create a product
const createProduct = catchAsync(
    async (req, res) => {
        const { ...payload } = req.body;
        const result = await ProductService.createProduct(req.file, payload, req.user!);
        await AdminActivityServices.record(req.user!, "product_created", `Created product ${result?.name ?? ""}`, { type: "product", id: result?._id });
        sendResponse(res, {
            statusCode: status.OK,
            success: true,
            message: "Product created successfully",
            data: result
        });
    });

// get all products
const getAllProducts = catchAsync(
    async (req, res) => {
        const result = await ProductService.getAllProducts();
        sendResponse(res, {
            statusCode: status.OK,
            success: true,
            message: "Products fetched successfully",
            data: result
        });
    }
);

// admin: list every non-deleted product (any status)
const getAllProductsForAdmin = catchAsync(
    async (req, res) => {
        const result = await ProductService.getAllProductsForAdmin();
        sendResponse(res, {
            statusCode: status.OK,
            success: true,
            message: "Products fetched successfully",
            data: result
        });
    }
);

// get single product
const getSingleProduct = catchAsync(
    async (req, res) => {
        const { id } = req.params;
        const result = await ProductService.getSingleProduct(id);
        sendResponse(res, {
            statusCode: status.OK,
            success: true,
            message: "Product fetched successfully",
            data: result
        });
    }
);

// update product
const updateProduct = catchAsync(
    async (req, res) => {
        const { id } = req.params;
        const { ...payload } = req.body;
        const result = await ProductService.updateProduct(id, payload, req.user!);
        await AdminActivityServices.record(req.user!, "product_updated", `Updated product ${result?.name ?? id}`, { type: "product", id });
        sendResponse(res, {
            statusCode: status.OK,
            success: true,
            message: "Product updated successfully",
            data: result
        });
    });

// super admin: approve or reject a product
const decideApproval = catchAsync(
    async (req, res) => {
        const { id } = req.params;
        const decision = req.body.approvalStatus === "rejected" ? "rejected" : "approved";
        const result = await ProductService.decideProductApproval(id, decision, req.user!);
        await AdminActivityServices.record(req.user!, "product_approval", `${decision === "approved" ? "Approved" : "Rejected"} product ${result?.name ?? id}`, { type: "product", id });
        sendResponse(res, {
            statusCode: status.OK,
            success: true,
            message: decision === "approved" ? "Product approved and published" : "Product rejected",
            data: result
        });
    });

// delete product
const deleteProduct = catchAsync(
    async (req, res) => {
        const { id } = req.params;
        const result = await ProductService.deleteProduct(id);
        await AdminActivityServices.record(req.user!, "product_deleted", `Deleted product ${result?.name ?? id}`, { type: "product", id });
        sendResponse(res, {
            statusCode: status.OK,
            success: true,
            message: "Product deleted successfully",
            data: result
        });
    });

export const ProductController = {
    createProduct,
    getAllProducts,
    getAllProductsForAdmin,
    getSingleProduct,
    updateProduct,
    decideApproval,
    deleteProduct
}