import status from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ProductService } from "./product.services";

// create a product
const createProduct = catchAsync(
    async (req, res) => {
        const { ...payload } = req.body;
        const result = await ProductService.createProduct(payload);
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
        const result = await ProductService.updateProduct(id, payload);
        sendResponse(res, {
            statusCode: status.OK,
            success: true,
            message: "Product updated successfully",
            data: result
        });
    });

// delete product
const deleteProduct = catchAsync(
    async (req, res) => {
        const { id } = req.params;
        const result = await ProductService.deleteProduct(id);
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
    getSingleProduct,
    updateProduct,
    deleteProduct
}