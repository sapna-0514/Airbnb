const nodemailer = require("nodemailer");

/**
 * Sends an email using SMTP credentials from environment variables.
 * Falls back gracefully (logs instead of throwing) if email is not
 * configured, so the rest of the app keeps working in local/dev setups.
 */
async function sendEmail({ to, subject, html }) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn(
      "[sendEmail] EMAIL_USER / EMAIL_PASSWORD not configured - skipping real send."
    );
    console.warn(`[sendEmail] Would have sent "${subject}" to ${to}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    html,
  });
}

module.exports = sendEmail;
