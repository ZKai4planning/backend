// import { brevoClient } from "../config/brevo";
// import {
//   BrevoSendEmailPayload,
//   BrevoSendEmailResponse,
// } from "../types/brevo.types";

// export const sendOtpEmail = async (
//   email: string,
//   otp: string
// ): Promise<BrevoSendEmailResponse> => {
//   const payload: BrevoSendEmailPayload = {
//     to: [{ email }],
//     templateId: 1, 
//     params: { otp },
//     sender: {
//       email: "info@ai4planning.com",
//       name: "Ai4Planning",
//     },
//   };

//   try {
//     const { data } = await brevoClient.post("/smtp/email", payload);
//     return data;
//   } catch (error: any) {
//     console.log("========== BREVO ERROR ==========");
//     console.log("Status:", error.response?.status);
//     console.log("Data:", JSON.stringify(error.response?.data, null, 2));
//     console.log("================================");

//     throw new Error("Failed to send OTP email");
//   }
// }



import { brevoClient } from "../config/brevo";
import { log } from "../utils/log";
import {
  BrevoSendEmailPayload,
  BrevoSendEmailResponse,
} from "../types/brevo.types";

const logger = log("EmailService");

export const sendOtpEmail = async (
  email: string,
  otp: string
): Promise<BrevoSendEmailResponse> => {

  logger.info(`Sending OTP email to ${email}`);

  const payload: BrevoSendEmailPayload = {
    to: [{ email }],
    templateId: 1,
    params: { otp },
    sender: {
      email: "info@ai4planning.com",
      name: "Ai4Planning",
    },
  };

  try {
    const { data } = await brevoClient.post("/smtp/email", payload);

    logger.info(`OTP email sent successfully to ${email}`);
    logger.debug(`Brevo messageId: ${data.messageId}`);

    return data;

  } catch (error: any) {
    logger.error("Brevo email send failed", error);

    // Optional deep debug
    logger.debug(
      `Brevo response: ${JSON.stringify(error.response?.data)}`
    );

    throw new Error("Failed to send OTP email");
  }
};


// export const sendPasswordRequestNotificationToAdmins = async (
//   adminEmails: string[],
//   employeeEmail: string
// ): Promise<BrevoSendEmailResponse> => {
//   logger.info(`Sending password request notification for ${employeeEmail}`);

//   const payload: BrevoSendEmailPayload = {
//     to: adminEmails.map((email) => ({ email })),
//     templateId: 2,
//     params: {
//       employeeEmail,
//     },
//     sender: {
//       email: "info@ai4planning.com",
//       name: "Ai4Planning",
//     },
//   };

//   try {
//     const { data } = await brevoClient.post("/smtp/email", payload);

//     logger.info("Admin notification email sent");
//     return data;
//   } catch (error: any) {
//     logger.error("Admin notification email failed", error);
//     throw new Error("Failed to send admin notification email");
//   }
// };

// export const sendNewPasswordEmail = async (
//   email: string,
//   newPassword: string
// ): Promise<BrevoSendEmailResponse> => {
//   logger.info(`Sending new password email to ${email}`);

//   const payload: BrevoSendEmailPayload = {
//     to: [{ email }],
//     templateId: 3,
//     params: {
//       password: newPassword,
//     },
//     sender: {
//       email: "info@ai4planning.com",
//       name: "Ai4Planning",
//     },
//   };

//   try {
//     const { data } = await brevoClient.post("/smtp/email", payload);

//     logger.info(`New password email sent to ${email}`);
//     return data;
//   } catch (error: any) {
//     logger.error("New password email failed", error);
//     throw new Error("Failed to send new password email");
//   }
// };

// export const sendPasswordRequestRejectedEmail = async (
//   email: string,
//   reason?: string
// ): Promise<BrevoSendEmailResponse> => {
//   logger.info(`Sending rejection email to ${email}`);

//   const payload: BrevoSendEmailPayload = {
//     to: [{ email }],
//     templateId: 4,
//     params: {
//       reason: reason || "No reason provided",
//     },
//     sender: {
//       email: "info@ai4planning.com",
//       name: "Ai4Planning",
//     },
//   };

//   try {
//     const { data } = await brevoClient.post("/smtp/email", payload);

//     logger.info(`Rejection email sent to ${email}`);
//     return data;
//   } catch (error: any) {
//     logger.error("Rejection email failed", error);
//     throw new Error("Failed to send rejection email");
//   }
// };

export const sendEmployeeWelcomeEmail = async (
  email: string,
  defaultPassword: string,
  name?: string
): Promise<BrevoSendEmailResponse> => {
  logger.info(`Sending employee welcome email to ${email}`);

  const payload = {
    to: [{ email }],
    subject: "Your Account Has Been Created",
    htmlContent: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Welcome to Ai4Planning 🎉</h2>
        
        <p>Hello ${name || "User"},</p>
        
        <p>Your account has been successfully created by the administrator.</p>
        
        <p><strong>Login Email:</strong> ${email}</p>
        
        <p><strong>Temporary Password:</strong></p>
        <h1 style="color: #4CAF50;">${defaultPassword}</h1>
        
        <p style="margin-top: 20px;">
          ⚠️ For security reasons, please change your password immediately after logging in.
        </p>

        <p>If you did not expect this account, please contact your administrator.</p>
        
        <br/>
        <p>Best regards,<br/>Ai4Planning Team</p>
      </div>
    `,
    sender: {
      email: "info@ai4planning.com",
      name: "Ai4Planning",
    },
  };

  try {
    const { data } = await brevoClient.post("/smtp/email", payload);
    logger.info(`Employee welcome email sent to ${email}`);
    return data;
  } catch (error: any) {
    logger.error("Employee welcome email failed", error);
    throw new Error("Failed to send employee welcome email");
  }
};


export const sendPasswordRequestNotificationToAdmins = async (
  adminEmails: string[],
  employeeEmail: string
): Promise<BrevoSendEmailResponse> => {
  logger.info(`Sending password request notification for ${employeeEmail}`);

  const payload = {
    to: adminEmails.map((email) => ({ email })),
    subject: "Employee Password Reset Request",
    htmlContent: `
      <div style="font-family: Arial, sans-serif;">
        <h2>Password Reset Request</h2>
        <p>An employee has requested a password reset.</p>
        <p><strong>Employee Email:</strong> ${employeeEmail}</p>
        <p>Please login to the admin panel to review.</p>
      </div>
    `,
    sender: {
      email: "info@ai4planning.com",
      name: "Ai4Planning",
    },
  };

  try {
    const { data } = await brevoClient.post("/smtp/email", payload);
    logger.info("Admin notification email sent");
    return data;
  } catch (error: any) {
    logger.error("Admin notification email failed", error);
    throw new Error("Failed to send admin notification email");
  }
};

export const sendPasswordResetApprovedEmail = async (
  email: string,
  defaultPassword: string
): Promise<BrevoSendEmailResponse> => {
  logger.info(`Sending password reset approval email to ${email}`);

  const payload = {
    to: [{ email }],
    subject: "Password Reset Approved",
    htmlContent: `
      <div style="font-family: Arial, sans-serif;">
        <h2>Password Reset Approved</h2>
        <p>Your password reset request has been approved by the admin.</p>
        <p>Please login using the default password below:</p>
        <p><strong>Default Password:</strong></p>
        <h1 style="color: #4CAF50;">${defaultPassword}</h1>
        <p>Please change your password immediately after login.</p>
      </div>
    `,
    sender: {
      email: "info@ai4planning.com",
      name: "Ai4Planning",
    },
  };

  try {
    const { data } = await brevoClient.post("/smtp/email", payload);
    logger.info(`Password reset approval email sent to ${email}`);
    return data;
  } catch (error: any) {
    logger.error("Password reset approval email failed", error);
    throw new Error("Failed to send password reset approval email");
  }
};

export const sendPasswordRequestRejectedEmail = async (
  email: string,
  reason?: string
): Promise<BrevoSendEmailResponse> => {
  logger.info(`Sending rejection email to ${email}`);

  const payload = {
    to: [{ email }],
    subject: "Password Reset Request Rejected",
    htmlContent: `
      <div style="font-family: Arial, sans-serif;">
        <h2>Request Rejected</h2>
        <p>Your password reset request has been rejected.</p>
        <p><strong>Reason:</strong> ${reason || "No reason provided"}</p>
        <p>If this is unexpected, please contact your administrator.</p>
      </div>
    `,
    sender: {
      email: "info@ai4planning.com",
      name: "Ai4Planning",
    },
  };

  try {
    const { data } = await brevoClient.post("/smtp/email", payload);
    logger.info(`Rejection email sent to ${email}`);
    return data;
  } catch (error: any) {
    logger.error("Rejection email failed", error);
    throw new Error("Failed to send rejection email");
  }
};
