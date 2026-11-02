import status from "http-status";
import AppError from "../../errors/AppError";
import { TCategory } from "./category.interface";
import { CategoryModel } from "./category.model";

// Create a new category
const createCategory = async (payload: TCategory) => {
    const isExist = await CategoryModel.findOne({ name: payload.name });
    if (isExist) {
        throw new AppError(status.CONFLICT, 'Category already exists');
    }
    const result = await CategoryModel.create(payload);
    return result;
}

// Get all categories
const getAllCategories = async () => {
    const result = await CategoryModel.find();
    return result;
}

// Get single category
const getSingleCategory = async (id: string) => {
    const result = await CategoryModel.findById(id);
    return result;
}

// Update category
const updateCategory = async (id: string, payload: TCategory) => { 
    const result = await CategoryModel.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true
    });
    return result;
}

// Delete category
const deleteCategory = async (id: string) => {
    const result = await CategoryModel.findByIdAndDelete(id);
    return result;
}

export const CategoryServices = {
    createCategory,
    getAllCategories,
    getSingleCategory,
    updateCategory,
    deleteCategory
}