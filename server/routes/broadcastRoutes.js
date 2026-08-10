const express = require("express");
const controller = require("../controllers/broadcastController");

const router = express.Router();

router.get("/", controller.listBroadcasts);
router.get("/:name", controller.getBroadcast);

module.exports = router;
