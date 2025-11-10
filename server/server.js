const express = require("express");
const dotEnv = require("dotenv");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const yaml = require("yamljs");
const dbConnection = require("./database/connection");
const bcrypt = require("bcrypt");
const User = require("./database/models/userModel"); // Assurez-vous que le chemin est correct

const createDefaultAdmin = async () => {
  try {
    // Vérifiez si un administrateur existe déjà
    const adminExists = await User.findOne({ role: "admin" });
    if (adminExists) {
      console.log("Un administrateur existe déjà.");
      return;
    }

    // Créez un administrateur par défaut
    const hashedPassword = await bcrypt.hash(
      process.env.DEFAULT_ADMIN_PASSWORD,
      10
    ); // Remplacez par un mot de passe sécurisé
    const admin = new User({
      firstName: "Patricia",
      lastName: "Sermande",
      password: hashedPassword,
      role: "admin",
      address: "123 impasse sucrère appt2 97470 Saint-Benoît",
      email: "patriciasermande@gmail.com",
      phoneNumber: "0692057275",
    });

    await admin.save();
    console.log("Administrateur par défaut créé avec succès !");
    console.log("Mot de passe haché pour l'administrateur :", hashedPassword);
  } catch (error) {
    console.error(
      "Erreur lors de la création de l'administrateur par défaut :",
      error.message
    );
  }
};

// Appelez la fonction lors de l'initialisation du serveur
createDefaultAdmin();
// Charger les variables d'environnement
dotEnv.config();

// Validation des variables d'environnement
if (!process.env.DATABASE_URL || !process.env.SECRET_KEY) {
  console.error("❌ Missing required environment variables.");
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 4000;

// Connexion à la base de données
dbConnection();

// Gérer les problèmes de CORS
app.use(cors());

// Middleware pour les payloads JSON et URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Documentation API Swagger
if (process.env.NODE_ENV !== "production") {
  const swaggerDocs = yaml.load("./swagger.yaml");
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
}

// Routes personnalisées
app.use("/api/v1/user", require("./routes/userRoutes"));
app.use("/api/v1/works", require("./routes/workRoutes"));
app.use("/api/v1/news", require("./routes/newsRoutes"));
app.use("/api/v1/contact", require("./routes/contactRoutes"));
app.use("/api/v1/reviews", require("./routes/reviewRoutes"));

// Route par défaut
app.get("/", (req, res) => {
  res.send("Hello from my Express server v2!");
});

// Middleware global pour gérer les erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    status: "error",
    message: err.message || "Internal Server Error",
  });
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`✅ Server listening on http://localhost:${PORT}`);
});
const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
