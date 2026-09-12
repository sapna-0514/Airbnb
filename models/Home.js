const mongoose = require("mongoose");

const homeSchema = new mongoose.Schema(
  {
    houseName: {
      type: String,
      required: [true, "House name is required"],
      trim: true,
      minlength: [3, "House name must be at least 3 characters"],
      maxlength: [100, "House name cannot exceed 100 characters"],
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
      maxlength: [120, "Location cannot exceed 120 characters"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [1, "Price must be greater than 0"],
      max: [1000000, "Price is unrealistically high"],
    },
    rating: {
      type: Number,
      min: [0, "Rating cannot be below 0"],
      max: [5, "Rating cannot exceed 5"],
      default: 0,
    },
    photoUrl: {
      type: String,
      trim: true,
      default:
        "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1000",
    },
    photos: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
      default: "",
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Speeds up search-by-location and search/sort-by-price
homeSchema.index({ location: 1 });
homeSchema.index({ price: 1 });
homeSchema.index({ host: 1 });
// Supports the free-text portion of the search feature
homeSchema.index({ houseName: "text", location: "text" });

// Virtual populate: a home's bookings/reviews without denormalizing data
homeSchema.virtual("bookings", {
  ref: "Booking",
  localField: "_id",
  foreignField: "home",
});

homeSchema.virtual("reviews", {
  ref: "Review",
  localField: "_id",
  foreignField: "home",
});

/**
 * Build a Mongoose filter object from query-string style search filters.
 * Kept as a static so controllers stay thin.
 */
homeSchema.statics.buildSearchQuery = function buildSearchQuery({
  location,
  minPrice,
  maxPrice,
  title,
} = {}) {
  const query = {};

  if (location && location.trim() !== "") {
    query.location = { $regex: location.trim(), $options: "i" };
  }

  if (title && title.trim() !== "") {
    query.houseName = { $regex: title.trim(), $options: "i" };
  }

  if ((minPrice && minPrice !== "") || (maxPrice && maxPrice !== "")) {
    query.price = {};
    if (minPrice && minPrice !== "") query.price.$gte = Number(minPrice);
    if (maxPrice && maxPrice !== "") query.price.$lte = Number(maxPrice);
  }

  return query;
};

module.exports = mongoose.model("Home", homeSchema);
