const express = require("express");
const router = express.Router();
const workController = require("../controllers/workController");
const upload = require("../middleware/upload");

router.get("/", workController.getAllWorks);
router.get("/:id", workController.getWorkById);

router.post(
  "/",
  upload.fields([
    { name: "cover", maxCount: 1 },
    { name: "files", maxCount: 100 },
  ]),
  workController.createWork
);
router.delete("/:id", workController.deleteWork);
router.put(
  "/:id",
  upload.fields([
    { name: "cover", maxCount: 1 },
    { name: "files", maxCount: 100 },
  ]),
  workController.updateWork
);

// Supprimer un fichier individuel d'un travail
router.delete("/:workId/file", workController.deleteFileFromWork);

// Mettre à jour la description d'un fichier
router.patch("/:workId/file-description", workController.updateFileDescription);

module.exports = router;
