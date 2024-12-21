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



// Fetch all resort data
app.get('/users', async (req, res) => {
  try {
    await getDatabase(); // Ensure the database is connected
    const resorts = await UserDataCollection.find().toArray();
    res.status(200).send(resorts);
  } catch (error) {
    console.error("Error fetching resort data:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});



// Posting Users data to MongoDB database
app.post("/users", async (req, res) => {
     try {
       const { name, email } = req.body;

       if (!name || !email) {
         return res.status(400).send("Name and email are required");
       }

       // Check if user with the same email already exists
       const existingUser = await UserDataCollection.findOne({ email });
       if (existingUser) {
         return res.status(409).send("User with this email already exists");
       }

       console.log(req.body); // Logs posted user data for debugging (optional)
       const result = await UserDataCollection.insertOne(req.body);

       res.status(201).send({
         message: "User successfully added",
         userId: result.insertedId,
       });
     } catch (error) {
       console.error("Error adding user data:", error.message);
       res.status(500).send("Internal Server Error");
     }
   });


   // Update user role to admin
   app.patch("/update-user", async (req, res) => {
     const { email, isAdmin } = req.body;

     try {
       // Ensure that email and isAdmin are provided
       if (!email || typeof isAdmin !== "boolean") {
         console.error(
           "Validation failed: Email or isAdmin status is missing"
         );
         return res.status(400).send("Email and isAdmin status are required");
       }

       // Debugging: Log the email and isAdmin
       console.log(`Updating user: ${email}, isAdmin: ${isAdmin}`);

       // Update user role
       const result = await UserDataCollection.updateOne(
         { email: email },
         { $set: { isAdmin: isAdmin } }
       );

       // Debugging: Log the result of the update operation
       console.log(`Update result: ${JSON.stringify(result)}`);

       if (result.modifiedCount === 0) {
         console.error("User not found or role not updated");
         return res.status(404).send("User not found or role not updated");
       }

       res.send({ success: true, message: "User role updated successfully" });
     } catch (error) {
       console.error("Error updating user role:", error);
       res.status(500).send("Internal Server Error");
     }
   });



   // Update or add user info (any incoming data)
   app.patch("/update-user-info", async (req, res) => {
     const { email, age, securityDeposit, idNumber } = req.body;

     try {
       const result = await UserDataCollection.updateOne(
         { email: email },
         { $set: { age, securityDeposit, idNumber } }
       );

       if (result.modifiedCount === 0) {
         return res.status(404).json({
           success: false,
           message: "User not found or information not updated.",
         });
       }

       res.json({
         success: true,
         message: "User information updated successfully.",
       });
     } catch (error) {
       console.error("Error updating user info:", error);
       res
         .status(500)
         .json({ success: false, message: "Internal Server Error" });
     }
   });



// Fetch all resort data
app.get('/resort-data', async (req, res) => {
  try {
    await getDatabase(); // Ensure the database is connected
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
