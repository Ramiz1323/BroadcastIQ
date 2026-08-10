const express = require("express");
const controller = require("../controllers/deliveryController");

const router = express.Router();

router.get("/facets", controller.facets);
router.get("/", controller.listDeliveries);
router.get("/:id", controller.getDelivery);

module.exports = router;
