const { MongoClient } = require("mongodb")
require('dotenv').config({ path: '.env.local' });
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/inventory_portal"

const sampleProducts = [
  {
    group: "Hosiery",
    subGroup: "HS SHIRT MICRO INTERLOCK",
    productId: "1503",
    name: "T Shirt H/S NK UA Round Neck M L XL",
    quantity: 200,
    price: 345,
    imagePath: "/placeholder.svg?height=300&width=300",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    group: "Hosiery",
    subGroup: "HS SHIRT COTTON",
    productId: "1504",
    name: "Cotton T-Shirt Full Sleeve",
    quantity: 150,
    price: 425,
    imagePath: "/placeholder.svg?height=300&width=300",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    group: "Garments",
    subGroup: "FORMAL SHIRTS",
    productId: "2001",
    name: "Formal Shirt White Cotton",
    quantity: 75,
    price: 850,
    imagePath: "/placeholder.svg?height=300&width=300",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    group: "Garments",
    subGroup: "CASUAL PANTS",
    productId: "2002",
    name: "Casual Chino Pants Navy Blue",
    quantity: 5, // Low stock for testing
    price: 1200,
    imagePath: "/placeholder.svg?height=300&width=300",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    group: "Accessories",
    subGroup: "BELTS",
    productId: "3001",
    name: "Leather Belt Brown",
    quantity: 8, // Low stock for testing
    price: 650,
    imagePath: "/placeholder.svg?height=300&width=300",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

async function seedProducts() {
  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()
    console.log("Connected to MongoDB")

    const db = client.db("inventory_portal")
    const products = db.collection("products")

    // Clear existing products
    await products.deleteMany({})

    // Insert sample products
    const result = await products.insertMany(sampleProducts)

    console.log(`${result.insertedCount} products inserted successfully!`)
  } catch (error) {
    console.error("Seeding error:", error)
  } finally {
    await client.close()
  }
}

seedProducts()
