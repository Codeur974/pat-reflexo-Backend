const express = require("express");
const dotEnv = require("dotenv");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const yaml = require("yamljs");
const dbConnection = require("./database/connection");
const bcrypt = require("bcryptjs");
const User = require("./database/models/userModel");
const path = require("path");

// 1) Charger les variables d'environnement AVANT tout
dotEnv.config();

// 2) Vérifier les variables nécessaires
if (!process.env.DATABASE_URL || !process.env.SECRET_KEY) {
  console.error(
    "❌ Missing required environment variables (DATABASE_URL or SECRET_KEY)."
  );
  process.exit(1);
}

if (!process.env.DEFAULT_ADMIN_PASSWORD) {
  console.warn(
    "⚠️ DEFAULT_ADMIN_PASSWORD is not set. Default admin won't be created."
  );
}

// 3) Création de l'admin par défaut (appelée après connexion DB)
const createDefaultAdmin = async () => {
  try {
    if (!process.env.DEFAULT_ADMIN_PASSWORD) {
      return;
    }

    const adminExists = await User.findOne({ role: "admin" });
    if (adminExists) {
      console.log("Un administrateur existe déjà.");
      return;
    }

    const hashedPassword = await bcrypt.hash(
      process.env.DEFAULT_ADMIN_PASSWORD,
      10
    );

    const admin = new User({
      firstName: "Patricia",
      lastName: "Sermande",
      password: hashedPassword,
      role: "admin",
      address: "123 impasse sucrère appt2 97470 Saint-Benoît",
      email: "reflexbe974@gmail.com",
      phoneNumber: "0692057275",
      dateOfBirth: new Date("1979-01-26"),
    });

    await admin.save();
    console.log("✅ Administrateur par défaut créé avec succès !");
  } catch (error) {
    console.error(
      "Erreur lors de la création de l'administrateur par défaut :",
      error.message
    );
  }
};

const app = express();
const PORT = process.env.PORT || 4000;

// 4) Middlewares globaux
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://reflex-bien-esep1jj8s-erics-projects-b65f9e82.vercel.app",
  process.env.FRONTEND_URL,
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.indexOf(origin) !== -1 ||
        origin.includes("vercel.app")
      ) {
        callback(null, true);
      } else {
        console.log("CORS blocked:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Fichiers statiques (uploads) - AVANT les routes
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// 5) Documentation API Swagger (uniquement hors prod)
if (process.env.NODE_ENV !== "production") {
  const swaggerDocs = yaml.load(path.join(__dirname, "swagger.yaml"));
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
}

// 6) Routes API
app.use("/api/v1/user", require("./routes/userRoutes"));
app.use("/api/v1/works", require("./routes/workRoutes"));
app.use("/api/v1/news", require("./routes/newsRoutes"));
app.use("/api/v1/contact", require("./routes/contactRoutes"));
app.use("/api/v1/reviews", require("./routes/reviewRoutes"));

// 7) Route de test
app.get("/", (req, res) => {
  res.send("Hello from Reflex Bien-Être API 🚀");
});

// 8) Middleware global d'erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    status: "error",
    message: err.message || "Internal Server Error",
  });
});

// 9) Bootstrap : connexion DB + admin + lancement serveur
const startServer = async () => {
  try {
    await dbConnection(); // dbConnection doit utiliser process.env.DATABASE_URL
    console.log("✅ Base de données connectée");

    await createDefaultAdmin();

    app.listen(PORT, () => {
      console.log(`✅ Server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Erreur au démarrage du serveur :", error);
    process.exit(1);
  }
};

startServer();
