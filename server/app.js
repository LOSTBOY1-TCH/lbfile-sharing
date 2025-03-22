const express = require("express");
const multer = require("multer");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.static(path.join(__dirname, "../public"))); // Serve static frontend files

// Multer Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "uploads")); // Save files to 'uploads' folder
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`); // Unique filenames
    }
});
const upload = multer({ storage });

// In-memory storage for files (replace with a database for persistence)
const filesData = [];

// Serve the frontend
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Upload File
app.post("/upload", upload.single("file"), (req, res) => {
    const { uploader } = req.body;
    const file = req.file;

    if (!file) {
        return res.status(400).json({ message: "No file uploaded." });
    }

    const fileData = {
        name: file.originalname,
        downloads: 0,
        link: `/uploads/${file.filename}`,
        uploader: uploader || "Anonymous"
    };

    filesData.push(fileData); // Add file metadata to the array
    res.status(200).json({ message: "File uploaded successfully!", file: fileData });
});

// Fetch All Uploaded Files
app.get("/files", (req, res) => {
    res.status(200).json({ files: filesData });
});

// Download File
app.get("/download/:filename", (req, res) => {
    const filename = req.params.filename;
    const file = filesData.find(f => f.link.includes(filename));

    if (!file) {
        return res.status(404).json({ message: "File not found." });
    }

    file.downloads += 1; // Increment download count
    res.download(path.join(__dirname, "uploads", filename)); // Send file to client
});

// Start the Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});