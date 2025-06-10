const Work = require("../database/models/workModel");
const fs = require("fs").promises;
exports.getAllWorks = async (req, res) => {
  try {
    const works = await Work.find();
    res.status(200).json(works);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getWorkById = async (req, res) => {
  try {
    const workId = req.params.id;
    const work = await Work.findById(req.params.id);
    if (!work) {
      return res.status(404).json({ message: "travail non trouvé" });
    }
    res.status(200).json(work);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createWork = async (req, res) => {
  try {
    const { title, date } = req.body;

    const cover = req.files["cover"]
      ? req.files["cover"][0].path.replace(/\\/g, "/")
      : null;

    const files = req.files["files"]
      ? req.files["files"].map((file) => ({
          type: file.mimetype.startsWith("image") ? "image" : "video",
          url: file.path.replace(/\\/g, "/"),
        }))
      : [];
    const newWork = new Work({ title, cover, files, date });
    await newWork.save();
    res.status(201).json(newWork);
  } catch (error) {
    console.error("Erreur lors de la création du travail :", error);
    res.status(500).json({
      message: "Erreur lors de la creation du travail",
      error: error.message,
      stack: error.stack,
    });
  }
};
exports.deleteWork = async (req, res) => {
  const workId = req.params.id;
  const work = await Work.findById(workId);
  if (!work) {
    return res.status(404).json({ message: "travail non trouvé" });
  }
  if (work.cover) {
    try {
      fs.unlink(work.cover);
    } catch (e) {
      console.error("Erreur suppression cover:", work.cover, e.message);
    }
  }
  for (const file of work.files) {
    try {
      await fs.unlink(file.url);
    } catch (e) {
      console.error("Erreur suppression fichier:", file.url, e.message);
    }
  }
  await work.deleteOne();
  res.status(200).json({ message: "travail supprimé avec succès" });
};
exports.updateWork = async (req, res) => {
  try {
    const workId = req.params.id;
    const work = await Work.findById(workId);
    if (!work) {
      return res.status(404).json({ message: "travail non trouvé" });
    }

    // 1. Mise à jour du titre si fourni
    const { title } = req.body;
    console.log("req.body:", req.body);
    console.log("req.files:", req.files);
    if (title) {
      work.title = title;
    }

    // 2. Mise à jour de la cover si une nouvelle image est envoyée
    if (req.files && req.files["cover"] && req.files["cover"].length > 0) {
      // Supprimer l'ancienne cover du disque si elle existe
      if (work.cover) {
        try {
          await fs.unlink(work.cover);
        } catch (e) {
          console.error(
            "Erreur suppression ancienne cover:",
            work.cover,
            e.message
          );
        }
      }
      // Enregistrer le chemin de la nouvelle cover
      work.cover = req.files["cover"][0].path.replace(/\\/g, "/");
    }

    // 3. Remplacement des fichiers (images/vidéos) si de nouveaux sont envoyés
    if (req.files && req.files["files"] && req.files["files"].length > 0) {
      // Supprimer tous les anciens fichiers du disque
      for (const file of work.files) {
        try {
          await fs.unlink(file.url);
        } catch (e) {
          console.error(
            "Erreur suppression ancien fichier:",
            file.url,
            e.message
          );
        }
      }
      // Remplacer le tableau par les nouveaux fichiers
      work.files = req.files["files"].map((file) => ({
        type: file.mimetype.startsWith("image") ? "image" : "video",
        url: file.path.replace(/\\/g, "/"),
      }));
    }

    // 4. Sauvegarder les modifications
    await work.save();
    res.status(200).json(work);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors de la modification du travail" });
  }
};
