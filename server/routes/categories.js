const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

// Get all categories
router.get('/', async (req, res) => {
    try {
        const categories = await Category.find().sort({ createdAt: -1 });
        res.json(categories);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create Category
router.post('/', async (req, res) => {
    try {
        const { name, image } = req.body;
        const category = new Category({ name, image: image || '' });
        await category.save();
        res.status(201).json(category);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Update Category
router.put('/:id', async (req, res) => {
    try {
        const { name, image } = req.body;
        const category = await Category.findByIdAndUpdate(
            req.params.id,
            { name, image },
            { new: true }
        );
        res.json(category);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Delete Category
router.delete('/:id', async (req, res) => {
    try {
        await Category.findByIdAndDelete(req.params.id);
        res.json({ message: 'Category deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
