import status from "http-status";
import catchAsync from "../../utils/catchAsync";
import { TaskServices } from "./tasks.services";
import sendResponse from "../../utils/sendResponse";

// create task
const createTask = catchAsync(
    async (req, res) => {
        const payload = req.body;
        const result = await TaskServices.createTask(payload);
        sendResponse(res, {
            statusCode: status.OK,
            success: true,
            message: "Task created successfully",
            data: result,
        });
    }
);

// get all task
const getAllTasks = catchAsync(
    async (req, res) => {
        const result = await TaskServices.getAllTasks();
        sendResponse(res, {
            statusCode: status.OK,
            success: true,
            message: "Tasks fetched successfully",
            data: result,
        });
    }
)
// get single task
const getSingleTask = catchAsync(
    async (req, res) => {
        const { id } = req.params;
        const result = await TaskServices.getSingleTask(id);
        sendResponse(res, {
            statusCode: status.OK,
            success: true,
            message: "Task fetched successfully",
            data: result,
        })
    }
);

// update task
const updateTask = catchAsync(
    async (req, res) => {
        const { id } = req.params;
        const payload = req.body;
        const result = await TaskServices.updateTask(id, payload);
        sendResponse(res, {
            statusCode: status.OK,
            success: true,
            message: "Task updated successfully",
            data: result,
        })
    }
)
// delete task
const deleteTask = catchAsync(
    async (req, res) => {
        const { id } = req.params;
        const result = await TaskServices.deleteTask(id);
        sendResponse(res, {
            statusCode: status.OK,
            success: true,
            message: "Task deleted successfully",
            data: result,
        })
    }
)

export const TaskControllers = {
    createTask,
    getAllTasks,
    getSingleTask,
    updateTask,
    deleteTask,
};
