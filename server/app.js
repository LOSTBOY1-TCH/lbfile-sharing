const express = require("express");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose");

// Set up Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// MongoDB Connection
mongoose.connect("mongodb://127.0.0.1:27017/fileSharing", { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("Failed to connect to MongoDB", err));

// Define File Schema
const fileSchema = new mongoose.Schema({
    name: String,
    downloads: { type: Number, default: 0 },
    link: String,
    uploader: { type: String, default: "Anonymous" }
});
const File = mongoose.model("File", fileSchema);

// Multer Configuration for File Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "uploads")); // Save files to 'uploads' folder
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`); // Unique filenames
    }
});
const upload = multer({ storage });

// Serve Frontend
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Upload File Endpoint
app.post("/upload", upload.single("file"), async (req, res) => {
    const { uploader } = req.body;
    const file = req.file;

    if (!file) {
        return res.status(400).json({ message: "No file uploaded." });
    }

    const fileData = new File({
        name: file.originalname,
        link: `https://lbfile-sharing.onrender.com/uploads/${file.filename}`,
        uploader: uploader || "Anonymous"
    });

    try {
        await fileData.save(); // Save file details in MongoDB
        res.status(200).json({ message: "File uploaded successfully!", file: fileData });
    } catch (error) {
        console.error("Error saving file data:", error);
        res.status(500).json({ message: "Failed to upload file." });
    }
});

// Fetch All Files
app.get("/files", async (req, res) => {
    try {
        const files = await File.find().sort({ downloads: -1 }); // Get all files, sorted by download count
        res.status(200).json({ files });
    } catch (error) {
        console.error("Error fetching files:", error);
        res.status(500).json({ message: "Failed to fetch files." });
    }
});

// Download File Endpoint
app.get("/download/:filename", async (req, res) => {
    const { filename } = req.params;

    try {
        const file = await File.findOne({ link: { $regex: filename } }); // Find file by link
        if (!file) {
            return res.status(404).json({ message: "File not found." });
        }

        file.downloads += 1; // Increment download count
        await file.save(); // Save updated download count
        res.download(path.join(__dirname, "uploads", filename)); // Send file for download
    } catch (error) {
        console.error("Error handling file download:", error);
        res.status(500).json({ message: "Failed to download file." });
    }
});

// Start the Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
