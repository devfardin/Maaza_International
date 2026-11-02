import express from 'express';
import { TaskControllers } from './tasks.controller';


const router = express.Router()

// create router
router.post('/create-task', TaskControllers.createTask);
router.get('/', TaskControllers.getAllTasks);
router.get('/:id', TaskControllers.getSingleTask);
router.put('/:id', TaskControllers.updateTask);
router.patch('/:id', TaskControllers.deleteTask);


export const TaskRoutes = router;