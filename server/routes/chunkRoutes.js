const express = require("express");
const upload = require("../middleware/upload");
const controller = require("../controllers/chunkController");

const router = express.Router();

router.post("/preview", upload.single("file"), controller.preview);
router.post("/import", upload.single("file"), controller.importChunk);
router.get("/", controller.listChunks);
router.get("/:id", controller.getChunk);
router.put("/:id", controller.updateChunk);
router.delete("/:id", controller.deleteChunk);

module.exports = router;
