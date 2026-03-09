const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/bookingController");

router.get("/active-slots", ctrl.getActiveSlots);
router.post("/book-slot", ctrl.bookSlot);
router.get("/my-bookings", ctrl.getMyBookings);

module.exports = router;
