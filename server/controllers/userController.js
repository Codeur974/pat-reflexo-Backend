const userService = require("../services/userService");
const mongoose = require("mongoose");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../database/models/userModel");
const createTransporter = require("../utils/emailTransporter");

module.exports.firstLoginUpdate = async (req, res) => {
  try {
    const userId = req.user.id; // ID extrait du token JWT

    // Vérifiez si l'utilisateur effectue sa première connexion
    const user = await userService.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.isFirstLogin) {
      return res
        .status(400)
        .json({ message: "First login update is not allowed" });
    }

    // Vérifiez que le mot de passe est fourni
    if (!req.body.password) {
      return res
        .status(400)
        .json({ message: "Password is required for first login" });
    }

    // Limitez les champs modifiables à `password` et `userName`
    const allowedUpdates = {
      password: req.body.password,
      userName: req.body.userName, // Permet de modifier l'identifiant unique
    };

    // Mettez à jour les informations de l'utilisateur
    const updatedUser = await userService.updateUserById(userId, {
      ...allowedUpdates,
      isFirstLogin: false, // Marquez la première connexion comme terminée
    });

    return res.status(200).json({
      status: "success",
      message: "User information updated successfully",
      user: {
        id: updatedUser._id,
        userName: updatedUser.userName,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phoneNumber: updatedUser.phoneNumber,
        address: updatedUser.address,
        role: updatedUser.role,
        dateOfBirth: updatedUser.dateOfBirth,
        isFirstLogin: updatedUser.isFirstLogin,
      },
    });
  } catch (error) {
    console.error("Error in firstLoginUpdate:", error.message);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};
module.exports.createUser = async (req, res) => {
  try {
    // Log pour vérifier les données reçues
    console.log("Requête reçue dans createUser :", req.body);

    // Validation des données d'entrée
    const {
      firstName,
      lastName,
      email,
      password,
      phoneNumber,
      address,
      role,
      dateOfBirth,
    } = req.body;

    if (!firstName || !lastName || !phoneNumber || !address || !dateOfBirth) {
      return res.status(400).json({
        status: "error",
        message:
          "Tous les champs requis doivent être fournis : firstName, lastName, email, phoneNumber, address.",
      });
    }

    // Générer un mot de passe temporaire si le champ password est vide
    const passwordToUse =
      password || `${firstName}${Math.floor(Math.random() * 1000)}`;
    console.log("Mot de passe transmis au service :", passwordToUse);

    // Appeler le service pour créer l'utilisateur
    const responseFromService = await userService.createUser({
      firstName,
      lastName,
      email,
      password: passwordToUse, // Passez le mot de passe temporaire ou celui fourni
      phoneNumber,
      address,
      role,
      dateOfBirth,
      plainPassword: passwordToUse, // Ajoutez le mot de passe temporaire pour le retourner dans la réponse
    });

    // Supprimez le mot de passe haché de l'objet utilisateur retourné
    const userResponse = responseFromService.user.toObject();
    delete userResponse.password;

    // Retourner une réponse avec le mot de passe temporaire si généré
    return res.status(201).json({
      status: "success",
      message: "User successfully created",
      body: {
        user: userResponse,
        temporaryPassword: passwordToUse,
        uniqueIdentifier: responseFromService.uniqueIdentifier,
      },
    });
  } catch (error) {
    console.error("Error in createUser - userController.js", error);
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};
// Authentifier un utilisateur
module.exports.loginUser = async (req, res) => {
  let response = {};

  try {
    const { username, email, password } = req.body;

    // Vérifiez que le mot de passe est fourni
    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    let user;

    // Vérifiez si un username ou un email est fourni
    if (username) {
      console.log("Tentative de connexion avec username :", username);
      user = await userService.getUserByUsername(username);
    } else if (email) {
      console.log("Tentative de connexion avec email :", email);
      user = await userService.getUserByEmail(email);
    } else {
      return res.status(400).json({ message: "Username or email is required" });
    }

    // Vérifiez si l'utilisateur existe
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Vérifiez le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Générer un token JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.SECRET_KEY,
      { expiresIn: "1h" }
    );

    response.status = 200;
    response.message = "User successfully logged in";
    response.body = { token, role: user.role };
  } catch (error) {
    console.error("Error in loginUser - userController.js", error);
    response.status = 500;
    response.message = "Internal server error";
  }

  return res.status(response.status).send(response);
};

// Supprimer un utilisateur
module.exports.deleteUser = async (req, res) => {
  let response = {};

  try {
    const userId = req.params.id; // Récupération de l'ID depuis req.params
    await userService.deleteUser(userId);
    response.status = 200; // Statut 200 pour une suppression réussie
    response.message = "User successfully deleted";
  } catch (error) {
    console.error("Error in deleteUser - userController.js", error);
    response.status = error.status || 404; // Statut 404 si l'utilisateur n'est pas trouvé
    response.message = error.message;
  }

  return res.status(response.status).send(response);
};

// Récupérer un utilisateur par ID

module.exports.getUserById = async (req, res) => {
  let response = {};

  try {
    const userId = req.params.id; // Récupération de l'ID depuis req.params

    // Vérifiez si l'ID est valide
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid user ID format",
      });
    }

    // Appeler le service pour récupérer l'utilisateur
    const responseFromService = await userService.getUserById(userId);
    response.status = 200; // Statut 200 pour une récupération réussie
    response.message = "Successfully retrieved user data";
    response.body = responseFromService;
  } catch (error) {
    console.error("Error in getUserById - userController.js", error);
    response.status = error.status || 404; // Statut 404 si l'utilisateur n'est pas trouvé
    response.message = error.message;
  }

  return res.status(response.status).send(response);
};
module.exports.getAllUsers = async (req, res) => {
  let response = {};

  try {
    // Appelle le service pour récupérer uniquement les utilisateurs avec le rôle "user"
    const responseFromService = await userService.getAllUsers();
    response.status = 200; // Statut 200 pour une récupération réussie
    response.message = "Successfully retrieved all users";
    response.body = responseFromService; // Contient uniquement firstName et lastName
  } catch (error) {
    console.error("Error in getAllUsers - userController.js", error);
    response.status = error.status || 500; // Statut 500 pour une erreur interne
    response.message = error.message;
  }

  return res.status(response.status).send(response);
};
// Mettre à jour un utilisateur par ID
module.exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id; // ID extrait du token JWT

    // Limitez les champs modifiables
    const allowedUpdates = {
      email: req.body.email,
      password: req.body.password,
      address: req.body.address,
      phoneNumber: req.body.phoneNumber,
    };

    // Appelle le service pour mettre à jour l'utilisateur
    const updatedUser = await userService.updateUserById(
      userId,
      allowedUpdates
    );

    if (!updatedUser) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error in updateUserProfile:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// Demande de réinitialisation de mot de passe
module.exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: "error",
        message: "L'adresse email est requise",
      });
    }

    // Chercher l'utilisateur
    const user = await User.findOne({ email });

    if (!user) {
      // Pour la sécurité, on renvoie toujours un succès même si l'email n'existe pas
      return res.status(200).json({
        status: "success",
        message: "Si un compte existe avec cet email, vous recevrez un lien de réinitialisation",
      });
    }

    // Générer un token de réinitialisation
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    // Sauvegarder le token et la date d'expiration (1 heure)
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 heure
    await user.save();

    // Créer le lien de réinitialisation
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

    // Créer le contenu HTML de l'email
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
            .message {
              background: white;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              border-left: 4px solid #5fd7b0;
            }
            .button {
              display: inline-block;
              padding: 15px 30px;
              background: linear-gradient(135deg, #5fd7b0, #4fc3f7);
              color: white !important;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🔑 Réinitialisation de mot de passe</h1>
          </div>
          <div class="content">
            <div class="message">
              <p>Bonjour,</p>
              <p>Vous avez demandé à réinitialiser votre mot de passe pour votre compte Réflex'Bien-être.</p>
              <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
              </div>
              <p style="margin-top: 20px; font-size: 14px; color: #666;">
                Ou copiez ce lien dans votre navigateur :<br>
                <a href="${resetUrl}" style="color: #0288d1; word-break: break-all;">${resetUrl}</a>
              </p>
              <p style="margin-top: 20px; color: #ff6b6b; font-weight: bold;">
                ⚠️ Ce lien expire dans 1 heure.
              </p>
              <p style="margin-top: 20px; font-size: 14px; color: #666;">
                Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet email.
              </p>
            </div>
            <div class="footer">
              <p>Réflex'Bien-être - Patricia Sermande</p>
              <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Envoyer l'email
    const transporter = createTransporter();
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Réinitialisation de votre mot de passe - Réflex'Bien-être",
      html: htmlContent,
    });

    res.status(200).json({
      status: "success",
      message: "Si un compte existe avec cet email, vous recevrez un lien de réinitialisation",
    });
  } catch (error) {
    console.error("Error in requestPasswordReset:", error);
    res.status(500).json({
      status: "error",
      message: "Erreur lors de l'envoi de l'email",
    });
  }
};

// Réinitialiser le mot de passe avec le token
module.exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        status: "error",
        message: "Le token et le nouveau mot de passe sont requis",
      });
    }

    // Hasher le token reçu pour le comparer
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Trouver l'utilisateur avec ce token et vérifier qu'il n'est pas expiré
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        status: "error",
        message: "Le lien de réinitialisation est invalide ou a expiré",
      });
    }

    // Mettre à jour le mot de passe
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.status(200).json({
      status: "success",
      message: "Votre mot de passe a été réinitialisé avec succès",
    });
  } catch (error) {
    console.error("Error in resetPassword:", error);
    res.status(500).json({
      status: "error",
      message: "Erreur lors de la réinitialisation du mot de passe",
    });
  }
};
