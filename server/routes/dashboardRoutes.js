const express = require("express");
const controller = require("../controllers/dashboardController");

const router = express.Router();

router.get("/stats", controller.stats);
router.get("/chunk-performance", controller.chunkPerformance);

module.exports = router;
