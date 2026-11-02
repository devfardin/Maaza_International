import express from 'express';
import { TaskControllers } from './tasks.controller';


const router = express.Router()

// create router
router.post('/create-task', TaskControllers.createTask);
router.get('/', TaskControllers.getAllTasks);
router.get('/:id', TaskControllers.getSingleTask);
router.patch('/:id', TaskControllers.updateTask);
router.delete('/:id', TaskControllers.deleteTask);


export const TaskRoutes = router;