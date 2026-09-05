const express = require("express");
const router = express.Router();
const slotController = require("../controllers/slotController");
const { validateToken, isAdmin } = require("../middleware/tokenValidation");

// Routes publiques
router.get("/", slotController.getPublicSlots);
router.post("/:id/book", slotController.bookSlot);

// Routes admin
router.post("/", validateToken, isAdmin, slotController.createDay);
router.get("/pending", validateToken, isAdmin, slotController.getPendingSlots);
router.get("/confirmed", validateToken, isAdmin, slotController.getConfirmedSlots);
router.delete("/:id", validateToken, isAdmin, slotController.deleteSlot);
router.patch("/:id/confirm", validateToken, isAdmin, slotController.confirmSlot);
router.patch("/:id/refuse", validateToken, isAdmin, slotController.refuseSlot);

module.exports = router;
