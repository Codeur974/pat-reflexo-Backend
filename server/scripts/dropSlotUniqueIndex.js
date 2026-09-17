const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Slot = require("../database/models/slotModel");

// Charger les variables d'environnement
dotenv.config({ path: "../../.env" });

// À lancer une seule fois (en local ou sur Render via son shell) pour retirer
// l'ancien index unique date+time sur la collection slots. Cet index empêchait
// d'ouvrir une 2e place sur un même créneau (fonctionnalité "collègue vient aider").
const dropSlotUniqueIndex = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log("✅ Connecté à MongoDB");

    const indexes = await Slot.collection.indexes();
    const oldIndex = indexes.find(
      (idx) => idx.unique && idx.key && idx.key.date === 1 && idx.key.time === 1
    );

    if (!oldIndex) {
      console.log("ℹ️  Pas d'index unique date+time trouvé, rien à faire.");
    } else {
      await Slot.collection.dropIndex(oldIndex.name);
      console.log(`🗑️  Index "${oldIndex.name}" supprimé.`);
    }

    await Slot.syncIndexes();
    console.log("✅ Index de la collection slots alignés sur le schéma.");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur:", error);
    process.exit(1);
  }
};

dropSlotUniqueIndex();
