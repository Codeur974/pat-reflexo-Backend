const nodemailer = require("nodemailer");

// Configuration du transporteur email (adapter selon votre service)
const createTransporter = () => {
  const isGmail = process.env.EMAIL_SERVICE === "gmail";
  const port = Number(process.env.SMTP_PORT) || (isGmail ? 465 : 587);
  const secure =
    typeof process.env.SMTP_SECURE !== "undefined"
      ? process.env.SMTP_SECURE === "true"
      : port === 465;

  // Debug: afficher la config (sans le mot de passe complet)
  console.log("Email config:", {
    service: isGmail ? "gmail" : "autre",
    user: process.env.EMAIL_USER,
    passLength: process.env.EMAIL_PASSWORD?.length,
    port,
    secure
  });

  const baseConfig = isGmail
    ? {
        service: "gmail",
        host: "smtp.gmail.com",
      }
    : {
        host: process.env.SMTP_HOST || "smtp.gmail.com",
      };

  return nodemailer.createTransport({
    ...baseConfig,
    port,
    secure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

module.exports = createTransporter;
