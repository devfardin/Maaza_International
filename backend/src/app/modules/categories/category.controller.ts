import status from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { TCategory } from "./category.interface";
import { CategoryServices } from "./category.services";

const createCategory = catchAsync(
  async (req, res) => {
    const payload: TCategory = req.body;
    const result = await CategoryServices.createCategory(payload);
    sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Category created successfully',
    data: result,
  });
  });

// Get all categories
const getAllCategories = catchAsync(
  async (req, res) => {
    const result = await CategoryServices.getAllCategories();
    sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Categories retrieved successfully',
    data: result,
  });
  });

// Get single category
const getSingleCategory = catchAsync(
  async (req, res) => { 
    const { id } = req.params;
    const result = await CategoryServices.getSingleCategory(id);
    sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Category retrieved successfully',
    data: result,
  });
  }
);

// Update category
const updateCategory = catchAsync(
  async (req, res) => {
    const { id } = req.params;
    const payload: TCategory = req.body;
    const result = await CategoryServices.updateCategory(id, payload);
    sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Category updated successfully',
    data: result,
  });
  }
);

// Delete category
const deleteCategory = catchAsync(
  async (req, res) => {
    const { id } = req.params;
    const result = await CategoryServices.deleteCategory(id);
    sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Category deleted successfully',
    data: result,
  });
  }
)


export const CategoryController = {
  createCategory,
  getAllCategories,
  getSingleCategory,
  updateCategory,
  deleteCategory
}