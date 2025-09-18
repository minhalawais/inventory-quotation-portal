const { MongoClient } = require("mongodb")
const bcrypt = require("bcryptjs")
require('dotenv').config({ path: '.env.local' });
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/inventory_portal"
console.log('Connecting to MongoDB at:', MONGODB_URI)
async function setupDatabase() {
  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()
    console.log("Connected to MongoDB")

    const db = client.db("inventory_portal")

    // Create collections
    await db.createCollection("users")
    await db.createCollection("products")
    await db.createCollection("quotations")

    // Create indexes
    await db.collection("users").createIndex({ email: 1 }, { unique: true })
    await db.collection("products").createIndex({ productId: 1 }, { unique: true })
    await db.collection("quotations").createIndex({ riderId: 1 })

    // Create default admin user
    const hashedPassword = await bcrypt.hash("admin123", 12)

    await db.collection("users").insertOne({
      name: "Admin User",
      email: "admin@inventory.com",
      password: hashedPassword,
      role: "manager",
      contact: "+1234567890",
      createdAt: new Date(),
    })

    // Create sample rider
    const riderPassword = await bcrypt.hash("rider123", 12)

    await db.collection("users").insertOne({
      name: "John Rider",
      email: "rider@inventory.com",
      password: riderPassword,
      role: "rider",
      contact: "+1234567891",
      createdAt: new Date(),
    })

    console.log("Database setup completed successfully!")
    console.log("Default users created:")
    console.log("Manager: admin@inventory.com / admin123")
    console.log("Rider: rider@inventory.com / rider123")
  } catch (error) {
    console.error("Database setup error:", error)
  } finally {
    await client.close()
  }
}

setupDatabase()
