const nodemailer = require("nodemailer");

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    const transporter = createTransporter();
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await transporter.sendMail({
      from: `"SHOEX Store" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Password Reset Request — SHOEX",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc143c;">Password Reset</h2>
          <p>You requested a password reset. Click the link below:</p>
          <a href="${resetUrl}"
             style="background: #dc143c; color: white; padding: 12px 24px;
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
          <p style="color: #666; margin-top: 16px;">
            This link expires in 1 hour. If you didn't request this, ignore this email.
          </p>
        </div>
      `,
    });

    console.log(`✅ Password reset email sent to ${email}`);
  } catch (error) {
    console.error("❌ Email send error:", error.message);
    throw error;
  }
};

const sendTeamOnboardingEmail = async (email, name, password, role) => {
  try {
    const transporter = createTransporter();

    await transporter.sendMail({
      from: `"SHOEX Store" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Welcome to SHOEX Admin Team",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc143c;">Welcome to SHOEX, ${name}!</h2>
          <p>Your admin account has been created. Here are your credentials:</p>
          <div style="background: #f5f5f5; padding: 16px; border-radius: 8px;">
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Password:</strong> ${password}</p>
            <p><strong>Role:</strong> ${role}</p>
          </div>
          <p style="margin-top: 16px;">
            Login at:
            <a href="${process.env.FRONTEND_URL}/login">${process.env.FRONTEND_URL}/login</a>
          </p>
          <p style="color: #666;">Please change your password after first login.</p>
        </div>
      `,
    });

    console.log(`✅ Onboarding email sent to ${email}`);
  } catch (error) {
    console.error("❌ Email send error:", error.message);
  }
};

module.exports = { sendPasswordResetEmail, sendTeamOnboardingEmail };