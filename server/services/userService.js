const User = require("../database/models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const mongoose = require("mongoose");

module.exports.createUser = async (serviceData) => {
  try {
    console.log("Données transmises au modèle :", serviceData);

    // Vérifiez si l'email existe déjà (si fourni)
    if (serviceData.email) {
      console.log(
        "Vérification de l'existence de l'email :",
        serviceData.email
      );
      const user = await User.findOne({ email: serviceData.email });
      if (user) {
        console.error("Erreur : Email déjà existant :", serviceData.email);
        throw new Error("Email already exists");
      }
    }

    // Générer un identifiant unique basé sur le nom de famille
    let uniqueIdentifier;
    let isUnique = false;

    while (!isUnique) {
      const randomNumber = Math.floor(Math.random() * (1000 - 10 + 1)) + 10;
      uniqueIdentifier = `${serviceData.lastName}${randomNumber}`;
      console.log("Tentative d'identifiant unique :", uniqueIdentifier);
      const existingUser = await User.findOne({ userName: uniqueIdentifier });
      if (!existingUser) {
        isUnique = true;
        console.log("Identifiant unique validé :", uniqueIdentifier);
      }
    }

    // Créez un nouvel utilisateur
    const newUser = new User({
      email: serviceData.email || null,
      password: serviceData.password,
      firstName: serviceData.firstName,
      lastName: serviceData.lastName,
      userName: uniqueIdentifier,
      phoneNumber: serviceData.phoneNumber,
      address: serviceData.address,
      role: serviceData.role,
      dateOfBirth: serviceData.dateOfBirth,
      isFirstLogin: true,
    });

    console.log("Nouvel utilisateur créé :", newUser);

    // Sauvegardez l'utilisateur
    await newUser.save();
    console.log("Utilisateur sauvegardé avec succès :", newUser);

    // Retournez l'utilisateur créé avec le mot de passe temporaire et l'identifiant unique
    return {
      user: newUser,
      temporaryPassword: serviceData.plainPassword,
      uniqueIdentifier: uniqueIdentifier,
    };
  } catch (error) {
    console.error("Error in createUser - userService.js:", error.message);
    throw new Error(error.message);
  }
};
module.exports.loginUser = async (userData) => {
  const { userName, password } = userData;

  console.log("Données reçues pour la connexion :", userData);

  // Rechercher l'utilisateur dans la base de données par userName
  const user = await User.findOne({ userName });
  console.log("Utilisateur trouvé :", user);

  if (!user) {
    console.error("Erreur : Utilisateur non trouvé !");
    throw new Error("User not found!");
  }

  // Vérifier le mot de passe
  console.log("Mot de passe fourni :", password);
  console.log("Mot de passe stocké :", user.password);

  const isPasswordValid = await bcrypt.compare(password, user.password);
  console.log("Validation du mot de passe :", isPasswordValid);

  if (!isPasswordValid) {
    console.error("Erreur : Mot de passe invalide !");
    throw new Error("Invalid password!");
  }

  // Générer un token JWT
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.SECRET_KEY,
    { expiresIn: "1h" }
  );
  console.log("Token JWT généré :", token);

  return { token, role: user.role };
};

module.exports.getUserById = async (userId) => {
  try {
    console.log("Recherche de l'utilisateur par ID :", userId);

    // Vérifiez si l'ID est valide
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error("Erreur : Format d'ID invalide :", userId);
      throw new Error("Invalid user ID format");
    }

    // Convertir l'ID en ObjectId avec 'new'
    const objectId = new mongoose.Types.ObjectId(userId);

    // Rechercher l'utilisateur par ID
    const user = await User.findById(objectId);
    console.log("Utilisateur récupéré :", user);

    if (!user) {
      console.error("Erreur : Utilisateur introuvable !");
      throw new Error("User not found!");
    }

    return user.toObject();
  } catch (error) {
    console.error("Error in getUserById - userService.js:", error.message);
    throw new Error(error.message);
  }
};

module.exports.updateUserById = async (userId, userData) => {
  try {
    console.log("Mise à jour de l'utilisateur :", userId, userData);

    // Vérifiez si le champ email est présent dans les données à mettre à jour
    if (userData.email) {
      console.log("Vérification de l'email :", userData.email);
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser && existingUser._id.toString() !== userId) {
        console.error("Erreur : Email déjà utilisé par un autre utilisateur !");
        throw new Error("Cet email est déjà utilisé par un autre utilisateur.");
      }
    }

    // Vérifiez si le mot de passe est présent dans les données à mettre à jour
    if (userData.password) {
      console.log("Hachage du nouveau mot de passe...");
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(userData.password, salt);
      console.log("Mot de passe haché :", userData.password);
    }

    // Mettre à jour l'utilisateur dans la base de données
    const updatedUser = await User.findByIdAndUpdate(userId, userData, {
      new: true, // Retourne l'utilisateur mis à jour
      runValidators: true, // Valide les données avant la mise à jour
    });

    if (!updatedUser) {
      console.error("Erreur : Utilisateur introuvable !");
      throw new Error("Utilisateur introuvable.");
    }

    console.log("Utilisateur mis à jour avec succès :", updatedUser);
    return updatedUser;
  } catch (error) {
    console.error("Error in updateUserById - userService.js", error.message);
    throw error;
  }
};

module.exports.getAllUsers = async () => {
  try {
    console.log("Récupération de tous les utilisateurs avec le rôle 'user'...");
    const users = await User.find({ role: "user" }, "firstName lastName");
    console.log("Utilisateurs récupérés :", users);
    return users;
  } catch (error) {
    console.error("Error in getAllUsers - userService.js:", error.message);
    throw new Error(error.message);
  }
};

module.exports.deleteUser = async (userId) => {
  try {
    console.log("Suppression de l'utilisateur avec l'ID :", userId);
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      console.error("Erreur : Utilisateur introuvable !");
      throw new Error("User not found");
    }

    console.log("Utilisateur supprimé avec succès :", deletedUser);
    return deletedUser;
  } catch (error) {
    console.error("Error in deleteUser - userService.js:", error.message);
    throw error;
  }
};
module.exports.getUserByUsername = async (username) => {
  try {
    return await User.findOne({ userName: username });
  } catch (error) {
    console.error("Error in getUserByUsername:", error.message);
    throw new Error("Error fetching user by username");
  }
};
module.exports.getUserByEmail = async (email) => {
  try {
    return await User.findOne({ email });
  } catch (error) {
    console.error("Error in getUserByEmail:", error.message);
    throw new Error("Error fetching user by email");
  }
};
