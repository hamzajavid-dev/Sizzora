const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

const initialProducts = [
    {
        name: 'Classic Burger',
        category: 'Burgers',
        price: 12.99,
        description: 'Juicy beef patty with cheese, lettuce, tomato, and our secret sauce on a brioche bun.',
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1899&auto=format&fit=crop'
    },
    {
        name: 'Margherita Pizza',
        category: 'Pizzas',
        price: 14.50,
        description: 'Fresh basil, mozzarella, and our signature tomato sauce on a crispy thin crust.',
        image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=2069&auto=format&fit=crop'
    },
    {
        name: 'Cola',
        category: 'Drinks',
        price: 2.50,
        description: 'Ice-cold refreshing cola.',
        image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=2070&auto=format&fit=crop'
    }
];

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sizzora')
    .then(async () => {
        console.log('MongoDB Connected for Seeding');

        // Check if products exist
        const count = await Product.countDocuments();
        if (count === 0) {
            await Product.insertMany(initialProducts);
            console.log('Initial products seeded successfully!');
        } else {
            console.log('Products already exist, skipping seed.');
        }

        mongoose.disconnect();
    })
    .catch(err => {
        console.error(err);
        mongoose.disconnect();
    });
