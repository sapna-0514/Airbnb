/**
 * Seeds the database with a handful of demo users and homes so the app
 * is immediately explorable after `npm run seed`.
 *
 * Usage: npm run seed
 */
require("dotenv").config();
const connectDB = require("./config/db");
const User = require("./models/User");
const Home = require("./models/Home");
const mongoose = require("mongoose");

const demoUsers = [
  { name: "Aarav Sharma", email: "aarav@example.com", password: "password123" },
  { name: "Priya Verma", email: "priya@example.com", password: "password123" },
];

const demoHomes = [
  {
    houseName: "Cozy Riverside Cottage",
    price: 1200,
    location: "Varanasi",
    description: "A peaceful cottage overlooking the Ganges, perfect for a quiet getaway.",
    photoUrl: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1000",
    photos: [
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1000",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1000",
    ],
  },
  {
    houseName: "Modern Loft in the City",
    price: 2500,
    location: "Mumbai",
    description: "A stylish, fully-furnished loft close to all major attractions.",
    photoUrl: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1000",
    photos: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1000"],
  },
  {
    houseName: "Mountain View Cabin",
    price: 1800,
    location: "Manali",
    description: "Wake up to breathtaking mountain views in this rustic wooden cabin.",
    photoUrl: "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=1000",
    photos: ["https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=1000"],
  },
];

async function seed() {
  await connectDB();

  console.log("Clearing existing demo data...");
  await User.deleteMany({ email: { $in: demoUsers.map((u) => u.email) } });
  await Home.deleteMany({ houseName: { $in: demoHomes.map((h) => h.houseName) } });

  console.log("Creating demo users...");
  const createdUsers = [];
  for (const userData of demoUsers) {
    const user = await User.create(userData);
    createdUsers.push(user);
  }

  console.log("Creating demo homes...");
  for (let i = 0; i < demoHomes.length; i++) {
    const host = createdUsers[i % createdUsers.length];
    await Home.create({ ...demoHomes[i], host: host._id });
  }

  console.log("Seed complete!");
  console.log("Demo login: aarav@example.com / password123");
  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
