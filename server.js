const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const Log = require('./models/Log');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(__dirname));

// MongoDB Local Connection
mongoose.connect("mongodb://localhost:27017/fswd", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ Connected to local MongoDB"))
.catch((err) => console.error("❌ MongoDB connection error:", err));

// Log API endpoints
app.post("/api/logs", async (req, res) => {
  try {
    const log = new Log(req.body);
    await log.save();
    res.status(201).send(log);
  } catch (error) {
    res.status(400).send(error);
  }
});

app.get("/api/get-logs", async (req, res) => {
  try {
    const logs = await Log.find().sort({ date: -1 }).limit(100);
    res.send(logs);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.delete("/api/clear-logs", async (req, res) => {
  try {
    await Log.deleteMany({});
    res.send({ message: "Logs cleared successfully" });
  } catch (error) {
    res.status(500).send(error);
  }
});

// Test endpoint
app.get("/api/test-log", async (req, res) => {
  try {
    const testLog = new Log({
      timestamp: new Date().toISOString(),
      message: "TEST LOG ENTRY",
      type: "test"
    });
    await testLog.save();
    res.send("Test log saved successfully!");
  } catch (err) {
    res.status(500).send("Error saving test log");
  }
});

// Serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});