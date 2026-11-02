import { TTask } from "./tasks.interface";
import { TaskModel } from "./tasks.model";

// create task
const createTask = async(payload: TTask) => {
    const result = await TaskModel.create(payload);
    return result;
}
// get all task
const getAllTasks = async() => {
    const result = await TaskModel.find();
    return result;
}
// get single task
const getSingleTask = async(id: string) => {
    const result = await TaskModel.findById(id);
    return result;
}
// update task
const updateTask = async(id: string, payload: Partial<TTask>) => {
    const result = await TaskModel.findByIdAndUpdate(id, payload, { new: true });
    return result;
}
// delete task
const deleteTask = async(id: string) => {
    const result = await TaskModel.findByIdAndDelete(id);
    return result;
}
export const TaskServices = {
    createTask,
    getAllTasks,
    getSingleTask,
    updateTask,
    deleteTask,
};