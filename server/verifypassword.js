const bcrypt = require("bcryptjs");

const plainPassword = "Celia97470@"; // Mot de passe en clair
const hashedPassword =
  "$2b$10$3nmVqTEcON49ghnZ6L61su/s9gJWFonCcrr63O7xC1EQx3z/n9P/W"; // Mot de passe haché depuis la base de données

bcrypt.compare(plainPassword, hashedPassword, (err, result) => {
  if (err) {
    console.error("Erreur lors de la comparaison :", err);
  } else {
    console.log("Le mot de passe est valide :", result); // true ou false
  }
});
