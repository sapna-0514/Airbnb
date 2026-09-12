const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const storeController = require("../controllers/storeController");

// Public routes
router.get("/", storeController.getIndex);
router.get("/homes", storeController.getHomes);
router.get("/homes/:homeID", storeController.getHomeDetails);
router.post("/homes/:homeID/review", requireAuth, storeController.postReview);

// Protected routes
router.get("/bookings", requireAuth, storeController.getBookings);
router.post("/bookings/delete/:bookingId", requireAuth, storeController.postCancelBooking);

router.get("/favourite", requireAuth, storeController.getFavouriteList);
router.post("/favourite", requireAuth, storeController.postAddtoFavourite);
router.post("/favourite/delete/:homeId", requireAuth, storeController.posRemoveFromFavourite);

router.get("/reserve/:homeId", requireAuth, storeController.getReserve);
router.post("/reserve", requireAuth, storeController.postReserve);

module.exports = router;
