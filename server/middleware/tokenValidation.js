const jwt = require("jsonwebtoken");

module.exports.validateToken = (req, res, next) => {
  try {
    // Vérification de la présence de l'en-tête Authorization
    if (!req.headers.authorization) {
      console.error("Authorization header is missing");
      return res.status(401).json({
        status: "error",
        message: "Authorization header is missing",
      });
    }

    // Extraction du token après "Bearer"
    const authHeader = req.headers.authorization;
    if (!authHeader.startsWith("Bearer ")) {
      console.error("Invalid token format");
      return res.status(401).json({
        status: "error",
        message: "Invalid token format",
      });
    }

    const userToken = authHeader.split(" ")[1]; // Récupère le token après "Bearer "
    const secretKey = process.env.SECRET_KEY || "default-secret-key";

    // Log pour vérifier la clé secrète utilisée
    console.log("SECRET_KEY:", secretKey);

    // Vérification et décodage du token
    const decodedToken = jwt.verify(userToken, secretKey);

    // Log pour vérifier le contenu du token décodé
    console.log("Decoded Token:", decodedToken);

    // Ajout des informations du token décodé à la requête
    req.user = decodedToken;

    // Vérification supplémentaire pour s'assurer que l'ID utilisateur est présent
    if (!req.user.id) {
      console.error("User ID is missing in the token");
      return res.status(401).json({
        status: "error",
        message: "User ID is missing in the token",
      });
    }

    return next();
  } catch (error) {
    console.error("Error in tokenValidation.js:", error.message);

    // Gestion des erreurs spécifiques
    let message = "Unauthorized";
    if (error.name === "TokenExpiredError") {
      message = "Token has expired";
    } else if (error.name === "JsonWebTokenError") {
      message = "Invalid token";
    }

    return res.status(401).json({
      status: "error",
      message,
    });
  }
};
module.exports.isAdmin = (req, res, next) => {
  try {
    // Vérifiez si le rôle est présent dans le token décodé
    if (!req.user || req.user.role !== "admin") {
      console.error("Accès refusé : L'utilisateur n'est pas un administrateur");
      return res.status(403).json({
        status: "error",
        message: "Accès refusé : Administrateurs uniquement",
      });
    }

    console.log("Accès autorisé : L'utilisateur est un administrateur");
    next(); // Passe au contrôleur si l'utilisateur est un administrateur
  } catch (error) {
    console.error("Erreur dans le middleware isAdmin :", error.message);
    return res.status(500).json({
      status: "error",
      message: "Erreur interne du serveur",
    });
  }
};
