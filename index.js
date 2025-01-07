const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(`Incoming ${req.method} request to ${req.url}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log("Request body:", req.body);
  }
  next();
});

const uri = `mongodb+srv://IntervalServer:${process.env.DB_PASS}@cluster0.sju0f.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db, ResortDataCollection, UserDataCollection;

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
    console.error("Error fetching users:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// Add user
app.post('/users', async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).send({ message: "Name and email are required" });
    }
    await getDatabase();
    const existingUser = await UserDataCollection.findOne({ email });
    if (existingUser) {
      return res.status(409).send({ message: "User with this email already exists" });
    }
    const result = await UserDataCollection.insertOne(req.body);
    res.status(201).send({
      message: "User successfully added",
      userId: result.insertedId,
    });
  } catch (error) {
    console.error("Error adding user:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// Fetch user by email
app.get('/users/:email?', async (req, res) => {
  try {
    const email = req.params.email || req.query.email;
    if (!email) {
      return res.status(400).send({ message: "Email is required" });
    }
    await getDatabase();
    const user = await UserDataCollection.findOne({ email });
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    res.status(200).send(user);
  } catch (error) {
    console.error("Error fetching user by email:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// Add resort
app.post('/add-resort', async (req, res) => {
  try {
    const resortData = req.body;
    if (!resortData || Object.keys(resortData).length === 0) {
      return res.status(400).send({ message: "Resort data cannot be empty" });
    }
    await getDatabase();
    const result = await ResortDataCollection.insertOne({ ...resortData, createdAt: new Date() });
    res.status(201).send({
      message: "Resort data successfully added",
      resortId: result.insertedId,
    });
  } catch (error) {
    console.error("Error adding resort:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// Fetch all resorts
app.get('/resort-data', async (req, res) => {
  try {
    await getDatabase();
    const resorts = await ResortDataCollection.find().toArray();
    res.status(200).send(resorts);
  } catch (error) {
    console.error("Error fetching resorts:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// Catch-all route
app.all('*', (req, res) => {
  res.status(404).send({ message: "Route not found" });
});

// Graceful shutdown
process.on("SIGINT", () => {
  client.close();
  console.log("MongoDB connection closed");
  process.exit();
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
