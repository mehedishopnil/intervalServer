const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

// Initialize Express app
const app = express();
const port = process.env.PORT || 5000;

// Middleware setup
app.use(cors());
app.use(express.json()); // Parse JSON payloads

// MongoDB connection URI
const uri = `mongodb+srv://IntervalServer:${process.env.DB_PASS}@cluster0.sju0f.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with options
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Database and collection variables
let db, ResortDataCollection, UserDataCollection;

// Lazy connection function
async function getDatabase() {
  if (!db) {
    await client.connect();

    db = client.db("Interval");
    ResortDataCollection = db.collection("AllResorts");
    UserDataCollection = db.collection("users");

    console.log("MongoDB connected lazily.");
  }
}

// Routes
// Health check route
app.get('/', (req, res) => {
  res.send('Interval Server is running');
});

// Fetch all users
app.get('/users', async (req, res) => {
  try {
    await getDatabase();
    const users = await UserDataCollection.find().toArray();
    res.status(200).send(users);
  } catch (error) {
    console.error("Error fetching users data:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// Check if user exists by email
app.get('/users', async (req, res) => {
  const email = req.query.email;
  if (!email) {
    return res.status(400).send({ message: "Email query parameter is required" });
  }

  try {
    await getDatabase();
    const user = await UserDataCollection.findOne({ email });
    res.status(200).send(user ? [user] : []); // Return an array for compatibility
  } catch (error) {
    console.error("Error checking user email:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// Create a new user
app.post('/users', async (req, res) => {
  const { name, userId, email, membership, telephone } = req.body;

  if (!email || !name) {
    return res.status(400).send({ message: "Name and email are required" });
  }

  try {
    await getDatabase();
    const newUser = { name, userId, email, membership, telephone };
    const result = await UserDataCollection.insertOne(newUser);
    res.status(201).send(result);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// Fetch all resort data
app.get('/resort-data', async (req, res) => {
  try {
    await getDatabase();
    const resorts = await ResortDataCollection.find().toArray();
    res.status(200).send(resorts);
  } catch (error) {
    console.error("Error fetching resort data:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
