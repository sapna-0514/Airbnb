const mongoose = require("mongoose");
const Home = require("./Home");

const reviewSchema = new mongoose.Schema(
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
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
      default: "",
    },
  },
  { timestamps: true }
);

// One review per user per home, and fast "reviews for this home" lookups
reviewSchema.index({ home: 1, user: 1 }, { unique: true });
reviewSchema.index({ home: 1, createdAt: -1 });

// Keep Home.rating in sync with the average of its reviews.
reviewSchema.statics.recalculateHomeRating = async function recalculateHomeRating(
  homeId
) {
  const stats = await this.aggregate([
    { $match: { home: homeId } },
    {
      $group: {
        _id: "$home",
        avgRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Home.findByIdAndUpdate(homeId, {
      rating: Math.round(stats[0].avgRating * 10) / 10,
    });
    return {
      avgRating: stats[0].avgRating.toFixed(1),
      totalReviews: stats[0].totalReviews,
    };
  }

  await Home.findByIdAndUpdate(homeId, { rating: 0 });
  return { avgRating: 0, totalReviews: 0 };
};

reviewSchema.post("save", function afterSave() {
  this.constructor.recalculateHomeRating(this.home);
});

reviewSchema.post("findOneAndDelete", function afterDelete(doc) {
  if (doc) doc.constructor.recalculateHomeRating(doc.home);
});

module.exports = mongoose.model("Review", reviewSchema);
