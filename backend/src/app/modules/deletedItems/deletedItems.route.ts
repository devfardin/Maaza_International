import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../users/user.constant';
import { DeletedItemsControllers } from './deletedItems.controller';

const router = express.Router();

// Super admin only: soft-deleted records, and permanent removal
router.get('/', auth(USER_ROLE.super_admin), DeletedItemsControllers.listDeleted);
router.delete('/:kind/:id', auth(USER_ROLE.super_admin), DeletedItemsControllers.permanentlyDelete);

export const DeletedItemsRoutes = router;
