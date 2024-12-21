const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

// Initialize Express app
const app = express();
const port = process.env.PORT || 5000;

// Middleware setup
app.use(cors()); // Enable CORS for all requests
app.use(express.json()); // Parse JSON payloads

// MongoDB connection URI (move credentials to .env for security)
const uri = "mongodb+srv://IntervalServer:dIO0ppukF9Lfh0wJ@cluster0.sju0f.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Database and collection variables
let db, ResortDataCollection;

// Run MongoDB connection logic
async function connectToDatabase() {
  try {
    await client.connect();
    db = client.db("Interval");
    ResortDataCollection = db.collection("AllResorts");

    console.log("Connected to MongoDB and collections initialized.");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

// Routes
// Health check route
app.get('/', (req, res) => {
  res.send('Interval Server is running');
});

// Route to fetch all resort data without pagination
app.get('/resort-data', async (req, res) => {
  try {
    const resorts = await ResortDataCollection.find().toArray();
    res.status(200).send(resorts);
  } catch (error) {
    console.error("Error fetching all resort data:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// Start the server
app.listen(port, async () => {
  await connectToDatabase();
  console.log(`Server is running on port ${port}`);
});
