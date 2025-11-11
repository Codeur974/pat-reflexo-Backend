const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      match: [/.+@.+\..+/, "Veuillez entrer une adresse email valide"],
    },
    password: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    userName: {
      type: String,
      unique: true,
      sparse: true, // Permet d'avoir des valeurs nulles tout en maintenant l'unicité
    },
    address: {
      type: String,
      required: true,
      default: "Non spécifié",
    },
    phoneNumber: {
      type: String,
      required: true,
      default: "0000000000",
      match: [
        /^\d{10}$/,
        "Veuillez entrer un numéro de téléphone valide (10 chiffres)",
      ],
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    dateOfBirth: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return !isNaN(Date.parse(value));
        },
        message: "Veuillez entrer une date valide au format YYYY-MM-DD",
      },
    },
    isFirstLogin: {
      type: Boolean,
      default: true,
    },
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toObject: {
      transform: (doc, ret, options) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Middleware pour hacher le mot de passe avant de sauvegarder
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  console.log("Mot de passe avant hachage :", this.password);

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log("Mot de passe après hachage :", this.password);
    next();
  } catch (error) {
    next(error);
  }
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
