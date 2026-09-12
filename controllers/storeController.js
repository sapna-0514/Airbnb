const Home = require("../models/Home");
const Booking = require("../models/Booking");
const Review = require("../models/Review");
const Favourite = require("../models/Favourite");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");

exports.getIndex = catchAsync(async (req, res) => {
  const homes = await Home.find().sort({ createdAt: -1 }).limit(8);
  res.render("store/index", {
    regesteredhome: homes,
    pageTitle: "Airbnb Home",
    currentpage: "index",
  });
});

exports.getHomes = catchAsync(async (req, res) => {
  const filters = {
    location: req.query.location || "",
    title: req.query.title || "",
    minPrice: req.query.minPrice || "",
    maxPrice: req.query.maxPrice || "",
    sort: req.query.sort || "",
  };

  const query = Home.buildSearchQuery(filters);

  let sortOption = { createdAt: -1 };
  if (filters.sort === "rating") sortOption = { rating: -1 };
  else if (filters.sort === "priceLow") sortOption = { price: 1 };
  else if (filters.sort === "priceHigh") sortOption = { price: -1 };

  const homes = await Home.find(query).sort(sortOption);

  res.render("store/home-list", {
    regesteredhome: homes,
    pageTitle: "Homes List",
    currentpage: "Home",
    filters,
  });
});

exports.getHomeDetails = catchAsync(async (req, res) => {
  const home = await Home.findById(req.params.homeID).populate("host", "name email");
  if (!home) return res.redirect("/homes");

  const reviews = await Review.find({ home: home._id })
    .populate("user", "name")
    .sort({ createdAt: -1 });

  const ratingInfo = {
    avgRating: home.rating || 0,
    totalReviews: reviews.length,
  };

  let alreadyReviewed = false;
  if (req.user) {
    const existing = await Review.findOne({ home: home._id, user: req.user._id });
    alreadyReviewed = !!existing;
  }

  res.render("store/home-detail", {
    home,
    reviews,
    ratingInfo,
    alreadyReviewed,
    query: req.query,
    pageTitle: home.houseName,
    currentpage: "Home",
  });
});

exports.postReview = catchAsync(async (req, res, next) => {
  const homeId = req.params.homeID;
  const { rating, comment } = req.body;

  const home = await Home.findById(homeId);
  if (!home) return next(new AppError("Listing not found.", 404));

  const existingReview = await Review.findOne({ home: homeId, user: req.user._id });
  if (existingReview) {
    return res.redirect(`/homes/${homeId}?error=already_reviewed`);
  }

  await Review.create({
    home: homeId,
    user: req.user._id,
    rating: Number(rating),
    comment,
  });

  res.redirect(`/homes/${homeId}`);
});

exports.getBookings = catchAsync(async (req, res) => {
  // Scoped to the logged-in user only - the original app returned every
  // booking in the database regardless of who was signed in.
  const bookings = await Booking.find({ user: req.user._id })
    .populate("home", "houseName location photoUrl")
    .sort({ createdAt: -1 });

  res.render("store/bookings", {
    bookings,
    pageTitle: "My Bookings",
    currentpage: "bookings",
  });
});

exports.getReserve = catchAsync(async (req, res) => {
  const home = await Home.findById(req.params.homeId);
  if (!home) return res.redirect("/homes");

  const bookings = await Booking.find({ home: home._id, status: "confirmed" });
  const bookedDates = bookings.map((b) => ({ checkIn: b.checkIn, checkOut: b.checkOut }));

  res.render("store/reserve", {
    home,
    bookedDates: JSON.stringify(bookedDates),
    pageTitle: "Reserve Home",
    currentpage: "bookings",
    errorMessage: null,
  });
});

exports.postReserve = catchAsync(async (req, res) => {
  const { homeId, checkIn, checkOut } = req.body;

  const home = await Home.findById(homeId);
  if (!home) return res.redirect("/homes");

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rerender = (errorMessage) =>
    res.status(400).render("store/reserve", {
      pageTitle: "Reserve Home",
      currentpage: "bookings",
      errorMessage,
      home,
      bookedDates: "[]",
    });

  if (checkInDate < today) return rerender("Check-in date cannot be in the past.");
  if (checkInDate >= checkOutDate) return rerender("Check-out date must be after check-in date.");

  const totalNights = Math.round((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
  if (totalNights < 1) return rerender("Minimum booking is 1 night.");

  const existingBookings = await Booking.find({ home: home._id, status: "confirmed" });
  const conflict = existingBookings.some((b) => {
    return checkInDate < b.checkOut && checkOutDate > b.checkIn;
  });
  if (conflict) return rerender("This home is already booked for the selected dates.");

  const totalPrice = totalNights * home.price;

  await Booking.create({
    home: home._id,
    user: req.user._id,
    houseName: home.houseName,
    location: home.location,
    photoUrl: home.photoUrl,
    pricePerNight: home.price,
    checkIn: checkInDate,
    checkOut: checkOutDate,
    totalNights,
    totalPrice,
  });

  res.redirect("/bookings");
});

exports.postCancelBooking = catchAsync(async (req, res, next) => {
  const booking = await Booking.findById(req.params.bookingId);
  if (!booking) return res.redirect("/bookings");

  // Ownership check: users may only cancel their own bookings
  if (booking.user.toString() !== req.user._id.toString()) {
    return next(new AppError("You are not allowed to cancel this booking.", 403));
  }

  await booking.deleteOne();
  res.redirect("/bookings");
});

exports.getFavouriteList = catchAsync(async (req, res) => {
  const favourites = await Favourite.find({ user: req.user._id }).populate("home");
  const favouriteHomes = favourites.map((f) => f.home).filter(Boolean);

  res.render("store/favourite-list", {
    favouriteHomes,
    pageTitle: "My Favourites",
    currentpage: "favourite",
  });
});

exports.postAddtoFavourite = catchAsync(async (req, res) => {
  const homeId = req.body.id;

  await Favourite.findOneAndUpdate(
    { user: req.user._id, home: homeId },
    { user: req.user._id, home: homeId },
    { upsert: true, setDefaultsOnInsert: true }
  );

  res.redirect("/favourite");
});

exports.posRemoveFromFavourite = catchAsync(async (req, res) => {
  await Favourite.findOneAndDelete({ user: req.user._id, home: req.params.homeId });
  res.redirect("/favourite");
});
