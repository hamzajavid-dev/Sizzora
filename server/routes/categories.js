const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const auth = require('../middleware/auth');
const { verifyAdmin } = auth;
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const syncKnowledge = require('../utils/syncKnowledge');

// Configure Multer Storage (shared config pattern)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, 'cat-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Get all categories
router.get('/', async (req, res) => {
    try {
        const categories = await Category.find().sort({ order: 1, createdAt: -1 });
        res.json(categories);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Reorder Categories
router.put('/reorder', verifyAdmin, async (req, res) => {
    try {
        const { orderedIds } = req.body;
        const operations = orderedIds.map((id, index) => ({
            updateOne: {
                filter: { _id: id },
                update: { $set: { order: index } }
            }
        }));
        
        await Category.bulkWrite(operations);
        res.json({ message: 'Categories reordered successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create Category
router.post('/', verifyAdmin, upload.single('image'), async (req, res) => {
    try {
        const { name, image: imageBody } = req.body;
        let imagePath = imageBody || '';
        if (req.file) {
            imagePath = `/uploads/${req.file.filename}`;
        }
        
        const category = new Category({ name, image: imagePath });
        await category.save();
        syncKnowledge();
        res.status(201).json(category);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Update Category
router.put('/:id', verifyAdmin, async (req, res) => {
    try {
        const { name, image } = req.body;
        const category = await Category.findByIdAndUpdate(
            req.params.id,
            { name, image },
            { new: true }
        );
        syncKnowledge();
        res.json(category);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Delete Category
router.delete('/:id', verifyAdmin, async (req, res) => {
    try {
        await Category.findByIdAndDelete(req.params.id);
        syncKnowledge();
        res.json({ message: 'Category deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
