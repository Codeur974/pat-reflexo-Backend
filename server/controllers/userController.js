const userService = require("../services/userService");
const mongoose = require("mongoose");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

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
