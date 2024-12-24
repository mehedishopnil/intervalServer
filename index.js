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

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`Incoming ${req.method} request to ${req.url}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log("Request body:", req.body);
  }
  next();
});

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
    try {
      await client.connect();
      db = client.db("Interval");
      ResortDataCollection = db.collection("AllResorts");
      UserDataCollection = db.collection("users");
      console.log("MongoDB connected lazily.");
    } catch (error) {
      console.error("Error connecting to MongoDB:", error);
      throw new Error("Database connection failed");
    }
  }
}

// Routes
// Health check route
app.get('/', (req, res) => {
  res.send('Interval Server is running');
});

// Fetch all users
app.get('/all-users', async (req, res) => {
  try {
    await getDatabase();
    const users = await UserDataCollection.find().toArray();
    res.status(200).send(users);
  } catch (error) {
    console.error("Error fetching users data:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// Posting Users data to MongoDB database
app.post("/users", async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).send({ message: "Name and email are required" });
    }

    await getDatabase();

    // Check if user with the same email already exists
    const existingUser = await UserDataCollection.findOne({ email });
    if (existingUser) {
      return res.status(409).send({ message: "User with this email already exists" });
    }

    console.log(req.body); // Logs posted user data for debugging (optional)
    const result = await UserDataCollection.insertOne(req.body);

    res.status(201).send({
      message: "User successfully added",
      userId: result.insertedId,
    });
  } catch (error) {
    console.error("Error adding user data:", error.message);
    res.status(500).send({ message: "Internal Server Error", error: error.message });
  }
});

// GET endpoint to fetch user data by email
app.get("/users/email", async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: "Email query parameter is required" });
  }

  try {
    const user = await UserDataCollection.findOne({ email: email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).send({ message: "Internal Server Error", error: error.message });
  }
});


// Add this route to handle posting resort data
app.post('/add-resort', async (req, res) => {
  try {
    const resortData = req.body;

    // Validate that the body is not empty
    if (!resortData || Object.keys(resortData).length === 0) {
      return res.status(400).send({ message: "Resort data cannot be empty" });
    }

    await getDatabase();

    // Insert the resort data into the MongoDB collection
    const newResort = {
      ...resortData, // Spread the incoming data
      createdAt: new Date(), // Add a timestamp for when the data is added
    };

    const result = await ResortDataCollection.insertOne(newResort);

    res.status(201).send({
      message: "Resort data successfully added",
      resortId: result.insertedId,
    });
  } catch (error) {
    console.error("Error adding resort data:", error.message);
    res.status(500).send({ message: "Internal Server Error", error: error.message });
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

// Catch-all route for undefined routes
app.all("*", (req, res) => {
  res.status(404).send({ message: "Route not found" });
});

// Handle graceful shutdown of MongoDB connection
process.on("SIGINT", () => {
  client.close();
  console.log("MongoDB connection closed");
  process.exit();
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
