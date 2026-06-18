import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY!);

export const sendStaffWelcomeEmail = async (
  email: string,
  name: string,
  password: string,
  outletName: string,
  role: string
) => {
  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: email,
    subject: `Welcome to ${outletName}`,
    html: `
      <p>Hi ${name},</p>
      <p>You've been added as <strong>${role}</strong> at ${outletName}.</p>
      <p>Your login details:</p>
      <p>Email: ${email}<br/>Password: ${password}</p>
      <p>You can change your password anytime after logging in.</p>
    `,
  });
};