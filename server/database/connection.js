const mongoose = require("mongoose");

const databaseUrl =
  process.env.DATABASE_URL || "mongodb://localhost/reflexbienetreDB";

module.exports = async () => {
  try {
    await mongoose.connect(databaseUrl); // Supprimez les options dépréciées
    console.log("✅ Database successfully connected");
  } catch (error) {
    console.error(`❌ Database Connectivity Error: ${error.message}`);
    process.exit(1); // Arrête le processus en cas d'échec critique
  }
};
