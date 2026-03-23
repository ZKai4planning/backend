import { Router } from "express";
import {
    requestPasswordReset,
    getPasswordRequests,
    approvePasswordRequest,
    rejectPasswordRequest,
} from "../../modules/employee-users/password-request.controller";

const router = Router();

/**
 * ===============================
 * Employee APIs
 * ===============================
 */

// Raise password reset request
router.post(
    "/",
    /*
      #swagger.tags = ["Employee Password Request"]
      #swagger.summary = "Employee raises password reset request"
  
      #swagger.parameters['body'] = {
        in: 'body',
        required: true,
        schema: {
          email: "employee@example.com"
        }
      }
    */
    requestPasswordReset
);

/**
 * ===============================
 * Admin APIs
 * ===============================
 */

// Get all requests
router.get(
    "/",
    /*
    #swagger.tags = ["Employee Password Request"]
    #swagger.summary = "Get password reset requests with pagination"

    #swagger.parameters['status'] = {
      in: 'query',
      type: 'string',
      enum: ['pending', 'approved', 'rejected']
    }

    #swagger.parameters['page'] = {
      in: 'query',
      type: 'number',
      example: 1
    }

    #swagger.parameters['limit'] = {
      in: 'query',
      type: 'number',
      example: 10
    }
  */
    getPasswordRequests
);

// Approve request
router.post(
    "/:requestId/approve",
    /*
      #swagger.tags = ["Employee Password Request"]
      #swagger.summary = "Approve password reset request"
  
      #swagger.parameters['requestId'] = {
        in: 'path',
        required: true,
        type: 'string'
      }
    */
    approvePasswordRequest
);

// Reject request
router.post(
    "/:requestId/reject",
    /*
      #swagger.tags = ["Employee Password Request"]
      #swagger.summary = "Reject password reset request"
  
      #swagger.parameters['requestId'] = {
        in: 'path',
        required: true,
        type: 'string'
      }
    */
    rejectPasswordRequest
);

export default router;