const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    home: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Home",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Small denormalized snapshot so a booking still displays sensibly
    // even if the underlying home is edited or removed later.
    houseName: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    photoUrl: { type: String, trim: true },
    pricePerNight: { type: Number, required: true, min: 1 },

    checkIn: { type: Date, required: [true, "Check-in date is required"] },
    checkOut: { type: Date, required: [true, "Check-out date is required"] },
    totalNights: { type: Number, required: true, min: 1 },
    totalPrice: { type: Number, required: true, min: 1 },

    status: {
      type: String,
      enum: ["confirmed", "cancelled"],
      default: "confirmed",
    },
  },
  { timestamps: true }
);

// Speeds up "my bookings" and "bookings for this home" lookups,
// and supports overlap checks scoped to a single home.
bookingSchema.index({ user: 1, home: 1 });
bookingSchema.index({ home: 1, checkIn: 1, checkOut: 1 });

bookingSchema.pre("validate", function ensureDateOrder(next) {
  if (this.checkIn && this.checkOut && this.checkIn >= this.checkOut) {
    return next(new Error("Check-out date must be after check-in date"));
  }
  next();
});

module.exports = mongoose.model("Booking", bookingSchema);
