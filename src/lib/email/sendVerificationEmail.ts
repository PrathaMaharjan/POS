import { Resend } from "resend";
import dotenv from "dotenv"
dotenv.config()
const resend = new Resend(process.env.RESEND_API_KEY!);

export const sendVerificationEmail = async (
  email: string,
  rawtoken: string,
) => {
    // console.log("hi")
  // const veriffyUrl = `${process.env.APP_URL}/api/auth/verify-email?token=${rawtoken}`;
  // console.log("verify route ",veriffyUrl)
const veriffyUrl = `${process.env.APP_URL}/api/auth/verify-email?token=${rawtoken}`;
  await resend.emails.send({
    from: process.env.EMAIL_FROM!, // e.g. "POS System <noreply@yourdomain.com>"
    to: email,
    subject: "Verify your email address",
    html: `
      <p>Welcome! Please verify your email to activate your account.</p>
      <p><a href="${veriffyUrl}">Click here to verify your email</a></p>
      <p>This link expires in 24 hours.</p>
    `,
  });
};
