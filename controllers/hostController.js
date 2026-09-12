const Home = require("../models/Home");
const Booking = require("../models/Booking");
const Favourite = require("../models/Favourite");
const Review = require("../models/Review");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");

exports.getAddHome = (req, res) => {
  res.render("host/edit-home", {
    pageTitle: "Add Home to Airbnb",
    currentpage: "addhome",
    editing: false,
    home: null,
    errorMessage: null,
  });
};

exports.postAddHome = catchAsync(async (req, res) => {
  const { houseName, price, location, description, photoUrl } = req.body;

  let photos = req.body.photos || [];
  if (typeof photos === "string") photos = [photos];
  photos = photos.filter((p) => p && p.trim() !== "");

  await Home.create({
    houseName,
    price,
    location,
    description,
    photoUrl: photoUrl || undefined,
    photos,
    host: req.user._id,
  });

  res.redirect("/host-home-list");
});

exports.getHostHomes = catchAsync(async (req, res) => {
  const homes = await Home.find({ host: req.user._id })
    .populate({
      path: "bookings",
      populate: { path: "user", select: "name email" },
    })
    .sort({ createdAt: -1 });

  res.render("host/host-home-list", {
    regesteredhome: homes,
    pageTitle: "Host Homes List",
    currentpage: "host-homes",
  });
});

exports.getEditHome = catchAsync(async (req, res, next) => {
  const home = await Home.findById(req.params.homeId);
  if (!home) return res.redirect("/host-home-list");

  // Ownership check: only the host who created the listing may edit it
  if (home.host.toString() !== req.user._id.toString()) {
    return next(new AppError("You are not allowed to edit this listing.", 403));
  }

  res.render("host/edit-home", {
    home,
    pageTitle: "Edit Your Home",
    currentpage: "host-homes",
    editing: req.query.editing === "true",
    errorMessage: null,
  });
});

exports.postEditHome = catchAsync(async (req, res, next) => {
  const { id, houseName, price, location, description, photoUrl } = req.body;

  const home = await Home.findById(id);
  if (!home) return next(new AppError("Listing not found.", 404));

  if (home.host.toString() !== req.user._id.toString()) {
    return next(new AppError("You are not allowed to edit this listing.", 403));
  }

  let photos = req.body.photos || [];
  if (typeof photos === "string") photos = [photos];
  photos = photos.filter((p) => p && p.trim() !== "");

  home.houseName = houseName;
  home.price = price;
  home.location = location;
  home.description = description;
  if (photoUrl) home.photoUrl = photoUrl;
  home.photos = photos;

  await home.save();
  res.redirect("/host-home-list");
});

exports.postDeleteHome = catchAsync(async (req, res, next) => {
  const home = await Home.findById(req.params.homeId);
  if (!home) return res.redirect("/host-home-list");

  if (home.host.toString() !== req.user._id.toString()) {
    return next(new AppError("You are not allowed to delete this listing.", 403));
  }

  await Promise.all([
    home.deleteOne(),
    Favourite.deleteMany({ home: home._id }),
    Booking.deleteMany({ home: home._id }),
    Review.deleteMany({ home: home._id }),
  ]);

  res.redirect("/host-home-list");
});
