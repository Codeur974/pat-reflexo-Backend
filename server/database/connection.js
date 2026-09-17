const mongoose = require("mongoose");
const Slot = require("./models/slotModel");

const databaseUrl =
  process.env.DATABASE_URL || "mongodb://localhost/reflexbienetreDB";

module.exports = async () => {
  try {
    await mongoose.connect(databaseUrl); // Supprimez les options dépréciées
    console.log("✅ Database successfully connected");
    // Aligne les index Mongo sur le schéma (retire l'ancien index unique date+time
    // qui empêchait d'ouvrir une 2e place sur un même créneau)
    await Slot.syncIndexes();
  } catch (error) {
    console.error(`❌ Database Connectivity Error: ${error.message}`);
    process.exit(1); // Arrête le processus en cas d'échec critique
  }
};
