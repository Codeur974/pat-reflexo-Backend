const nodemailer = require("nodemailer");

// Configuration du transporteur email - défaut: port 587 + STARTTLS
const createTransporter = () => {
  const isGmail = process.env.EMAIL_SERVICE === "gmail";

  // Défaut: 587 avec STARTTLS (plus fiable que 465)
  const secure = process.env.SMTP_SECURE === "true";
  const port = Number(process.env.SMTP_PORT) || 587;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port,
    secure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

module.exports = createTransporter;
