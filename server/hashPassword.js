const bcrypt = require("bcryptjs");

const plainPassword = "totor373"; // Mot de passe en clair
bcrypt.hash(plainPassword, 10, (err, hashedPassword) => {
  if (err) {
    console.error("Erreur lors du hachage :", err);
  } else {
    console.log("Nouveau mot de passe haché :", hashedPassword);
  }
});
