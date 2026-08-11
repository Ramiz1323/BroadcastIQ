const express = require("express");
const controller = require("../controllers/reportController");

const router = express.Router();

router.post("/preview", controller.previewReport);
router.get("/export/csv", controller.exportCsv);
router.get("/export/excel", controller.exportExcel);
router.get("/", controller.listReports);
router.post("/", controller.createReport);
router.put("/:id", controller.updateReport);
router.delete("/:id", controller.deleteReport);
router.post("/:id/run", controller.runReport);

module.exports = router;
