const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const hostController = require("../controllers/hostController");

router.get("/host/add-home", requireAuth, hostController.getAddHome);
router.post("/host/add-home", requireAuth, hostController.postAddHome);
router.get("/host-home-list", requireAuth, hostController.getHostHomes);
router.get("/host/edit-home/:homeId", requireAuth, hostController.getEditHome);
router.post("/host/edit-home", requireAuth, hostController.postEditHome);
router.post("/host/delete-home/:homeId", requireAuth, hostController.postDeleteHome);

module.exports = router;
