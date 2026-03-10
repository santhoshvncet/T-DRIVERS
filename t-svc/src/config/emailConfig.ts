import dotenv from "dotenv"
import {
  TransactionalEmailsApiApiKeys,
  TransactionalEmailsApi,
} from '@getbrevo/brevo';

dotenv.config();

const apiInstance = new TransactionalEmailsApi();

apiInstance.setApiKey(
  TransactionalEmailsApiApiKeys.apiKey,
  process.env.SEND_GRID_API!
);
const sender = {
    // name: "Need Support Assistance - T Drivers",
    // email: "sathoshv23@gmail.com"
    //temporarly implmented collegeraasta
    name: "Tdrivers",
    email: "info.tdrivers@gmail.com"
}



export interface EmailData {
  to: { email: string; name: string }[];
  subject: string;
  htmlContent: string;
  textContent: string;
}


export const sendEmail  = async (emailData: EmailData) => {
try {
    const response = await apiInstance.sendTransacEmail({
        sender,
      ...emailData,
    })
console.log("Email sent:", response.body.messageId);

    return response    
} catch (error) {
  console.log("here is the error", error)
    throw error;   
}
};
const RECEIVER_EMAIL = "aiswaryaj667@gmail.com"; // or any other email

export const sendContactFormEmail = async (name: string, email: string, message: string) => {
  try {
    const htmlContent = `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong></p>
      <p>${message}</p>
    `;

    const textContent = `
New Contact Form Submission:
- Name: ${name}
- Email: ${email}
- Message: ${message}
`;


    const response = await apiInstance.sendTransacEmail({
      sender,
      to: [{ email: RECEIVER_EMAIL, name: "Admin" }],

      subject: `New Contact Form Message from ${name}`,
      htmlContent,
      textContent,
    });

    return response;
  } catch (error) {
    console.error("Brevo Email Error:", error);
    throw error;
  }
};