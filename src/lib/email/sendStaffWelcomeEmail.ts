import { transporter } from "@/lib/email/mailer";

export async function sendStaffWelcomeEmail(
  email:      string,
  name:       string,
  password:   string,
  outletName: string,
  role:       string
) {
  await transporter.sendMail({
    from:    `"POS System" <${process.env.EMAIL_FROM}>`,
    to:      email,
    subject: `Your Staff Account is Ready — ${outletName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Welcome to ${outletName}!</h2>
        <p>Hi ${name},</p>
        <p>Your staff account has been created. Here are your login details:</p>
        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Password:</strong> ${password}</p>
          <p><strong>Role:</strong> ${role}</p>
          <p><strong>Outlet:</strong> ${outletName}</p>
          <p><strong>Login URL:</strong> <a href="${process.env.APP_URL}/login">${process.env.APP_URL}/login</a></p>
        </div>
        <p style="color: #ef4444;"><strong>Please change your password after first login.</strong></p>
        <p>— The POS Team</p>
      </div>
    `,
  });
}