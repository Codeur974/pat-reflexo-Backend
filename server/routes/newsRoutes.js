const express = require("express");
const router = express.Router();
const newsController = require("../controllers/newsController");
const upload = require("../middleware/upload");

router.get("/", newsController.getAllNews);
router.get("/:id", newsController.getNewsById);

router.post(
  "/",
  upload.fields([
    { name: "cover", maxCount: 1 },
    { name: "files", maxCount: 100 },
  ]),
  newsController.createNews
);
router.delete("/:id", newsController.deleteNews);
router.put(
  "/:id",
  upload.fields([
    { name: "cover", maxCount: 1 },
    { name: "files", maxCount: 100 },
  ]),
  newsController.updateNews
);

router.delete("/:newsId/file", newsController.deleteFileFromNews);
router.patch("/:newsId/file-description", newsController.updateFileDescription);

module.exports = router;
