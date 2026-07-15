import nodemailer from "nodemailer";
import dns from "dns";

// Force IPv4 resolution to prevent ENETUNREACH errors on platforms like Render 
// that might have IPv6 interfaces without internet routing
dns.setDefaultResultOrder('ipv4first');


const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "465", 10),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendResetPasswordEmail(to: string, resetLink: string) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("[Email Service] SMTP credentials not configured. Email not sent.");
    console.warn(`[Email Service] Mock Reset Link: ${resetLink}`);
    return;
  }

  const mailOptions = {
    from: `"Smart Expense" <${process.env.SMTP_USER}>`,
    to,
    subject: "Reset Your Password - Smart Expense",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4F46E5;">Password Reset</h2>
        <p>We received a request to reset your password for your Smart Expense account.</p>
        <p>Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p>If you didn't request a password reset, you can safely ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
        <p style="color: #666; font-size: 12px;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="color: #666; font-size: 12px; word-break: break-all;">${resetLink}</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}
