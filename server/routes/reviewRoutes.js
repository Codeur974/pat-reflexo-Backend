const express = require("express");
const router = express.Router();
const { getReviews, syncReviewsFromResalib } = require("../controllers/reviewController");

// Route publique pour récupérer les avis
router.get("/", getReviews);

// Route pour synchroniser les avis depuis Resalib (à protéger plus tard)
router.post("/sync", syncReviewsFromResalib);

module.exports = router;
