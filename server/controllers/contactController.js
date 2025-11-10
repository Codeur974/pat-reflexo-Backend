const createTransporter = require("../utils/emailTransporter");

exports.sendContactEmail = async (req, res) => {
  try {
    const { name, email, phone, type, message } = req.body;

    // Validation des champs requis
    if (!name || !email || !message || !type) {
      return res.status(400).json({
        status: "error",
        message: "Tous les champs obligatoires doivent être remplis.",
      });
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        status: "error",
        message: "L'adresse email n'est pas valide.",
      });
    }

    const transporter = createTransporter();

    // Email HTML avec le style de votre site
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #5fd7b0, #4fc3f7);
              padding: 30px;
              border-radius: 10px 10px 0 0;
              text-align: center;
            }
            .header h1 {
              color: white;
              margin: 0;
              font-size: 24px;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .field {
              margin-bottom: 20px;
              padding: 15px;
              background: white;
              border-radius: 8px;
              border-left: 4px solid #5fd7b0;
            }
            .field-label {
              font-weight: bold;
              color: #3d9b86;
              font-size: 14px;
              text-transform: uppercase;
              margin-bottom: 5px;
            }
            .field-value {
              color: #5a7a8f;
              font-size: 16px;
            }
            .message-box {
              background: white;
              padding: 20px;
              border-radius: 8px;
              border-left: 4px solid #4fc3f7;
              margin-top: 20px;
            }
            .badge {
              display: inline-block;
              padding: 5px 15px;
              background: ${type === "entreprise" ? "#007bff" : "#5fd7b0"};
              color: white;
              border-radius: 20px;
              font-size: 12px;
              font-weight: bold;
              text-transform: uppercase;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>💆 Nouveau message de contact</h1>
          </div>
          <div class="content">
            <div style="text-align: center; margin-bottom: 20px;">
              <span class="badge">${type === "entreprise" ? "Entreprise" : "Particulier"}</span>
            </div>

            <div class="field">
              <div class="field-label">Nom</div>
              <div class="field-value">${name}</div>
            </div>

            <div class="field">
              <div class="field-label">Email</div>
              <div class="field-value"><a href="mailto:${email}" style="color: #0288d1;">${email}</a></div>
            </div>

            ${phone ? `
            <div class="field">
              <div class="field-label">Téléphone</div>
              <div class="field-value"><a href="tel:${phone}" style="color: #0288d1;">${phone}</a></div>
            </div>
            ` : ""}

            <div class="message-box">
              <div class="field-label">Message</div>
              <div class="field-value" style="white-space: pre-wrap;">${message}</div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Configuration de l'email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.CONTACT_EMAIL || process.env.EMAIL_USER,
      replyTo: email,
      subject: `Nouveau message de ${type === "entreprise" ? "entreprise" : "particulier"} - ${name}`,
      html: htmlContent,
    };

    // Envoi de l'email
    await transporter.sendMail(mailOptions);

    res.status(200).json({
      status: "success",
      message: "Votre message a été envoyé avec succès !",
    });
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email:", error);
    res.status(500).json({
      status: "error",
      message: "Erreur lors de l'envoi du message. Veuillez réessayer.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
