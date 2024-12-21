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

// MongoDB connection URI:
const uri = "mongodb+srv://IntervalServer:dIO0ppukF9Lfh0wJ@cluster0.sju0f.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
     serverApi: {
       version: ServerApiVersion.v1,
       strict: true,
       deprecationErrors: true,
     }
   });
   async function run() {
     try {
       // Connect the client to the server	(optional starting in v4.7)
       await client.connect();
       // Send a ping to confirm a successful connection
       await client.db("admin").command({ ping: 1 });
       console.log("Pinged your deployment. You successfully connected to MongoDB!");
     } finally {
       // Ensures that the client will close when you finish/error
       await client.close();
     }
   }



// Routes
// Health check route
app.get('/', (req, res) => {
  res.send('Interval Server is running');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

run().catch(console.dir);