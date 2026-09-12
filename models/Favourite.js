const mongoose = require("mongoose");

const favouriteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    home: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Home",
      required: true,
    },
  },
  { timestamps: true }
);

// A user can only favourite a given home once; also speeds up
// "is this home already favourited by this user" checks.
favouriteSchema.index({ user: 1, home: 1 }, { unique: true });

module.exports = mongoose.model("Favourite", favouriteSchema);
