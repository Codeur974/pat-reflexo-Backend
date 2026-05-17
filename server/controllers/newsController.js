const News = require("../database/models/newsModel");
const { cloudinary } = require("../middleware/upload");

exports.getAllNews = async (req, res) => {
  try {
    const news = await News.find();
    res.status(200).json(news);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getNewsById = async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) {
      return res.status(404).json({ message: "annonce non trouvée" });
    }
    res.status(200).json(news);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createNews = async (req, res) => {
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

    const newNews = new News({ title, description, cover, coverPublicId, files, date });
    await newNews.save();
    res.status(201).json(newNews);
  } catch (error) {
    console.error("Erreur lors de la création de l'annonce :", error);
    res.status(500).json({
      message: "Erreur lors de la creation de l'annonce",
      error: error.message,
      stack: error.stack,
    });
  }
};

exports.deleteNews = async (req, res) => {
  const newsId = req.params.id;
  const news = await News.findById(newsId);
  if (!news) {
    return res.status(404).json({ message: "annonce non trouvée" });
  }

  if (news.coverPublicId) {
    try {
      await cloudinary.uploader.destroy(news.coverPublicId);
    } catch (e) {
      console.error("Erreur suppression cover Cloudinary:", e.message);
    }
  }

  for (const file of news.files) {
    if (file.public_id) {
      try {
        const resourceType = file.type === "video" ? "video" : "image";
        await cloudinary.uploader.destroy(file.public_id, { resource_type: resourceType });
      } catch (e) {
        console.error("Erreur suppression fichier Cloudinary:", e.message);
      }
    }
  }

  await news.deleteOne();
  res.status(200).json({ message: "annonce supprimée avec succès" });
};

exports.updateNews = async (req, res) => {
  try {
    const newsId = req.params.id;
    const news = await News.findById(newsId);
    if (!news) {
      return res.status(404).json({ message: "annonce non trouvée" });
    }

    const { title, description, date } = req.body;
    if (title) news.title = title;
    if (description !== undefined) news.description = description;
    if (date) news.date = date;

    if (req.files && req.files["cover"] && req.files["cover"].length > 0) {
      if (news.coverPublicId) {
        try {
          await cloudinary.uploader.destroy(news.coverPublicId);
        } catch (e) {
          console.error("Erreur suppression ancienne cover Cloudinary:", e.message);
        }
      }
      news.cover = req.files["cover"][0].path;
      news.coverPublicId = req.files["cover"][0].filename;
    }

    if (req.files && req.files["files"] && req.files["files"].length > 0) {
      const newFiles = req.files["files"].map((file) => ({
        type: file.mimetype.startsWith("image") ? "image" : "video",
        url: file.path,
        public_id: file.filename,
      }));
      news.files = news.files.concat(newFiles);
    }

    await news.save();
    res.status(200).json(news);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la modification de l'annonce" });
  }
};

exports.deleteFileFromNews = async (req, res) => {
  try {
    const { newsId } = req.params;
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ message: "URL du fichier à supprimer requise" });
    }
    const news = await News.findById(newsId);
    if (!news) {
      return res.status(404).json({ message: "annonce non trouvée" });
    }
    const fileIndex = news.files.findIndex((file) => file.url === url);
    if (fileIndex === -1) {
      return res.status(404).json({ message: "Fichier non trouvé dans cette annonce" });
    }

    const file = news.files[fileIndex];
    if (file.public_id) {
      try {
        const resourceType = file.type === "video" ? "video" : "image";
        await cloudinary.uploader.destroy(file.public_id, { resource_type: resourceType });
      } catch (e) {
        console.error("Erreur suppression Cloudinary:", e.message);
      }
    }

    news.files.splice(fileIndex, 1);
    await news.save();
    res.status(200).json({ message: "Fichier supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateFileDescription = async (req, res) => {
  try {
    const { newsId } = req.params;
    const { url, description } = req.body;

    if (!url) {
      return res.status(400).json({ message: "URL du fichier requise" });
    }

    const news = await News.findById(newsId);
    if (!news) {
      return res.status(404).json({ message: "Annonce non trouvée" });
    }

    const file = news.files.find((f) => f.url === url);
    if (!file) {
      return res.status(404).json({ message: "Fichier non trouvé dans cette annonce" });
    }

    file.description = description || "";
    await news.save();

    res.status(200).json({ message: "Description mise à jour avec succès", news });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
