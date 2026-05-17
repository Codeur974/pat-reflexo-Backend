const Work = require("../database/models/workModel");
const { cloudinary } = require("../middleware/upload");

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

    const cover = req.files["cover"] ? req.files["cover"][0].path : null;
    const coverPublicId = req.files["cover"] ? req.files["cover"][0].filename : null;

    const files = req.files["files"]
      ? req.files["files"].map((file) => ({
          type: file.mimetype.startsWith("image") ? "image" : "video",
          url: file.path,
          public_id: file.filename,
        }))
      : [];

    const newWork = new Work({ title, description, cover, coverPublicId, files, date });
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

  if (work.coverPublicId) {
    try {
      await cloudinary.uploader.destroy(work.coverPublicId);
    } catch (e) {
      console.error("Erreur suppression cover Cloudinary:", e.message);
    }
  }

  for (const file of work.files) {
    if (file.public_id) {
      try {
        const resourceType = file.type === "video" ? "video" : "image";
        await cloudinary.uploader.destroy(file.public_id, { resource_type: resourceType });
      } catch (e) {
        console.error("Erreur suppression fichier Cloudinary:", e.message);
      }
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

    const { title, description, date } = req.body;
    if (title) work.title = title;
    if (description !== undefined) work.description = description;
    if (date) work.date = date;

    if (req.files && req.files["cover"] && req.files["cover"].length > 0) {
      if (work.coverPublicId) {
        try {
          await cloudinary.uploader.destroy(work.coverPublicId);
        } catch (e) {
          console.error("Erreur suppression ancienne cover Cloudinary:", e.message);
        }
      }
      work.cover = req.files["cover"][0].path;
      work.coverPublicId = req.files["cover"][0].filename;
    }

    if (req.files && req.files["files"] && req.files["files"].length > 0) {
      const newFiles = req.files["files"].map((file) => ({
        type: file.mimetype.startsWith("image") ? "image" : "video",
        url: file.path,
        public_id: file.filename,
      }));
      work.files = work.files.concat(newFiles);
    }

    await work.save();
    res.status(200).json(work);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la modification du travail" });
  }
};

exports.deleteFileFromWork = async (req, res) => {
  try {
    const { workId } = req.params;
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ message: "URL du fichier à supprimer requise" });
    }
    const work = await Work.findById(workId);
    if (!work) {
      return res.status(404).json({ message: "travail non trouvé" });
    }
    const fileIndex = work.files.findIndex((file) => file.url === url);
    if (fileIndex === -1) {
      return res.status(404).json({ message: "Fichier non trouvé dans ce travail" });
    }

    const file = work.files[fileIndex];
    if (file.public_id) {
      try {
        const resourceType = file.type === "video" ? "video" : "image";
        await cloudinary.uploader.destroy(file.public_id, { resource_type: resourceType });
      } catch (e) {
        console.error("Erreur suppression Cloudinary:", e.message);
      }
    }

    work.files.splice(fileIndex, 1);
    await work.save();
    res.status(200).json({ message: "Fichier supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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

    const file = work.files.find((f) => f.url === url);
    if (!file) {
      return res.status(404).json({ message: "Fichier non trouvé dans ce travail" });
    }

    file.description = description || "";
    await work.save();

    res.status(200).json({ message: "Description mise à jour avec succès", work });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
