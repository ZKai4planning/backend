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
