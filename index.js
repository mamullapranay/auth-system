// index.js
const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(bodyParser.json());

// Database connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root", // Replace with your MySQL username
  password: "123456", // Replace with your MySQL password
  database: "auth",
});

// Connect to the database
db.connect((err) => {
  if (err) throw err;
  console.log("Connected to database");
});

// User registration
app.post("/register", async (req, res) => {
  const { phone, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const query = "INSERT INTO user (phone, password) VALUES (?, ?)";
  db.query(query, [phone, hashedPassword], (err, result) => {
    if (err) {
      return res.status(500).json({ error: "User registration failed" });
    }
    res.status(201).json({ message: "User registered successfully" });
  });
});

// User login
app.post("/login", (req, res) => {
  const { phone, password } = req.body;
  const query = "SELECT * FROM user WHERE phone = ?";
  db.query(query, [phone], async (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length === 0)
      return res.status(400).json({ error: "User not found" });

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Incorrect password" });

    const token = jwt.sign({ id: user.id, phone: user.phone }, "secret", {
      expiresIn: "1h",
    });
    res.json({ message: "Login successful", token });
  });
});
// Welcome route
app.get("/", (req, res) => {
    res.send("Welcome to the User Authentication API");
  });
// Protected route example (Dashboard)
app.get("/dashboard", authenticateToken, (req, res) => {
  res.json({ message: `Welcome, user ${req.user.id}` });
});

// Middleware to authenticate token
function authenticateToken(req, res, next) {
  const token = req.headers["authorization"];
  if (!token) return res.status(401).json({ error: "Access denied" });

  jwt.verify(token, "secret", (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
}

// Start server
app.listen(8000, () => {
  console.log("Server running on port 8000");
});
