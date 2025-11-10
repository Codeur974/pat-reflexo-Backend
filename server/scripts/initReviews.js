const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Review = require("../database/models/reviewModel");

// Charger les variables d'environnement
dotenv.config({ path: "../../.env" });

const initReviews = async () => {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.DATABASE_URL);
    console.log("✅ Connecté à MongoDB");

    // Supprimer les anciens avis
    await Review.deleteMany({});
    console.log("🗑️  Anciens avis supprimés");

    // Ajouter les avis de Resalib
    const reviews = [
      {
        author: "Ariane S.",
        date: "Juin 2025",
        rating: 5,
        text: "Séance très agréable, échanges en confiance et avec une attestation toute professionnelle",
        source: "resalib",
      },
      {
        author: "Angelina G.",
        date: "Juin 2025",
        rating: 5,
        text: "Aceuille avec de jolies sourires. Satisfaction et apaisement total",
        source: "resalib",
      },
      {
        author: "Eric S.",
        date: "Mai 2025",
        rating: 5,
        text: "Praticienne très pédagogue, qui maitrise ce qu elle fait. Je conseille fortement.",
        source: "resalib",
      },
    ];

    const savedReviews = await Review.insertMany(reviews);
    console.log(`✅ ${savedReviews.length} avis ajoutés avec succès`);

    // Fermer la connexion
    await mongoose.connection.close();
    console.log("👋 Déconnexion de MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur:", error);
    process.exit(1);
  }
};

initReviews();
