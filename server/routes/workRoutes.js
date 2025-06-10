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
    { name: "files", maxCount: 10 },
  ]),
  workController.createWork
);
router.delete("/:id", workController.deleteWork);
router.put(
  "/:id",
  upload.fields([
    { name: "cover", maxCount: 1 },
    { name: "files", maxCount: 10 },
  ]),
  workController.updateWork
);

module.exports = router;
