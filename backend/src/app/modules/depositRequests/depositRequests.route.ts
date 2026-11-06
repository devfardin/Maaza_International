import express from "express";
import validationRequest from "../../middlewares/validateRequest";
import { DepositRequestController } from "./depositRequests.controller";
import { DepositRequestValidations } from "./depositRequests.validations";
import auth from "../../middlewares/auth";
import { USER_ROLE } from "../users/user.constant";

const router = express.Router();

// submit a new deposit request
router.post(
    "/create-deposit-request",
    auth(USER_ROLE.user),
    validationRequest(DepositRequestValidations.createDepositRequestValidation),
    DepositRequestController.createDepositRequest
);

// get all deposit requests (admin)
router.get(
    "/", auth(USER_ROLE.admin, USER_ROLE.super_admin),
    DepositRequestController.getAllDepositRequests
);

// get deposit requests by user ID
router.get(
    "/user/:userId",
    DepositRequestController.getDepositRequestsByUser
);

// approve or reject a deposit request (admin)
router.patch(
    "/:id/status",
    validationRequest(DepositRequestValidations.updateDepositRequestStatusValidation),
    DepositRequestController.updateDepositRequestStatus
);

export const DepositRequestRoutes = router;
