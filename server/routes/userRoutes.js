const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const tokenValidation = require("../middleware/tokenValidation");
const { isAdmin } = require("../middleware/tokenValidation");

router.put(
  "/first-login",
  tokenValidation.validateToken, // Middleware pour valider le token JWT
  userController.firstLoginUpdate // Contrôleur pour gérer la mise à jour
);
// Route pour créer un utilisateur
router.post(
  "/admin/users/create",
  tokenValidation.validateToken,
  isAdmin,
  userController.createUser
);

// Route pour authentifier un utilisateur
router.post("/login", userController.loginUser);

router.put(
  "/update-profile",
  tokenValidation.validateToken, // Middleware pour valider le token JWT
  userController.updateUserProfile // Méthode du contrôleur pour mettre à jour le profil du client
);
// Route pour récupérer les informations d'un utilisateur par ID
router.get(
  "/admin/users/:id",
  tokenValidation.validateToken,
  isAdmin,
  userController.getUserById
);

// Route pour récupérer tous les utilisateurs
router.get(
  "/admin/users",
  tokenValidation.validateToken,
  isAdmin,
  userController.getAllUsers
);

// Route pour supprimer un utilisateur par ID
router.delete(
  "/admin/users/:id",
  tokenValidation.validateToken,
  isAdmin,
  userController.deleteUser
);

module.exports = router;
