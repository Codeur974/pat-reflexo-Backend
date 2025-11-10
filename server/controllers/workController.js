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
    const { title, description, date } = req.body;

    const cover = req.files["cover"]
      ? req.files["cover"][0].path.replace(/\\/g, "/")
      : null;

    const files = req.files["files"]
      ? req.files["files"].map((file) => ({
          type: file.mimetype.startsWith("image") ? "image" : "video",
          url: file.path.replace(/\\/g, "/"),
        }))
      : [];
    const newWork = new Work({ title, description, cover, files, date });
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

    // 1. Mise à jour du titre et description si fournis
    const { title, description, date } = req.body;
    console.log("req.body:", req.body);
    console.log("req.files:", req.files);
    if (title) {
      work.title = title;
    }
    if (description !== undefined) {
      work.description = description;
    }
    if (date) {
      work.date = date;
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

    // 3. Ajout des nouveaux fichiers (images/vidéos) si de nouveaux sont envoyés
    if (req.files && req.files["files"] && req.files["files"].length > 0) {
      // Ajoute les nouveaux fichiers au tableau existant
      const newFiles = req.files["files"].map((file) => ({
        type: file.mimetype.startsWith("image") ? "image" : "video",
        url: file.path.replace(/\\/g, "/"),
      }));
      work.files = work.files.concat(newFiles);
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

// Suppression d'un fichier individuel d'un travail
exports.deleteFileFromWork = async (req, res) => {
  try {
    const { workId } = req.params;
    const { url } = req.query;
    if (!url) {
      return res
        .status(400)
        .json({ message: "URL du fichier à supprimer requise" });
    }
    const work = await Work.findById(workId);
    if (!work) {
      return res.status(404).json({ message: "travail non trouvé" });
    }
    // Cherche le fichier dans le tableau files
    const fileIndex = work.files.findIndex((file) => file.url === url);
    if (fileIndex === -1) {
      return res
        .status(404)
        .json({ message: "Fichier non trouvé dans ce travail" });
    }
    // Supprime le fichier du disque
    try {
      await fs.unlink(url);
    } catch (e) {
      // Si le fichier n'existe plus sur le disque, on continue
      console.error("Erreur suppression fichier:", url, e.message);
    }
    // Retire le fichier du tableau
    work.files.splice(fileIndex, 1);
    await work.save();
    res.status(200).json({ message: "Fichier supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mettre à jour la description d'un fichier
exports.updateFileDescription = async (req, res) => {
  try {
    const { workId } = req.params;
    const { url, description } = req.body;

    if (!url) {
      return res.status(400).json({ message: "URL du fichier requise" });
    }

    const work = await Work.findById(workId);
    if (!work) {
      return res.status(404).json({ message: "Travail non trouvé" });
    }

    // Cherche le fichier dans le tableau files
    const file = work.files.find((f) => f.url === url);
    if (!file) {
      return res.status(404).json({ message: "Fichier non trouvé dans ce travail" });
    }

    // Met à jour la description
    file.description = description || "";
    await work.save();

    res.status(200).json({ message: "Description mise à jour avec succès", work });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
