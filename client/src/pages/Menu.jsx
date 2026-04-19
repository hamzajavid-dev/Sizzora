import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { FaShoppingCart, FaSearch } from 'react-icons/fa';
import { getImageUrl } from '../utils/imageUtils';

const Menu = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState(['All']);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const { addToCart } = useCart();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [productRes, categoryRes] = await Promise.all([
                    axios.get('/api/products'),
                    axios.get('/api/categories')
                ]);

                setProducts(productRes.data);
                const fetchedCats = categoryRes.data.map(c => c.name);
                setCategories(['All', ...fetchedCats]);

            } catch (err) {
                console.error('Error fetching data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredProducts = products.filter(p => {
        const matchesCategory = filter === 'All' || p.category === filter;
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-stone-900 pt-32 pb-24 px-4 md:px-8 text-white">
            {/* Header */}
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-5xl md:text-6xl font-bold mb-4">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Our Menu</span>
                    </h1>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Discover our carefully crafted dishes made with the finest ingredients
                    </p>
                </motion.div>

                {/* Search Bar */}
                <div className="max-w-md mx-auto mb-8">
                    <div className="relative">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search dishes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-stone-800 border border-stone-700 rounded-full py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors"
                        />
                    </div>
                </div>

                {/* Category Filters */}
                <div className="flex justify-center gap-3 mb-12 flex-wrap">
                    {categories.map(cat => (
                        <motion.button
                            key={cat}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setFilter(cat)}
                            className={`px-6 py-2.5 rounded-full font-semibold transition-all duration-300 ${filter === cat
                                ? 'bg-gradient-to-r from-primary to-secondary text-dark shadow-lg shadow-primary/30'
                                : 'bg-stone-800 text-gray-300 hover:bg-stone-700 border border-stone-700'
                                }`}
                        >
                            {cat}
                        </motion.button>
                    ))}
                </div>

                {/* Products Grid */}
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <p className="text-center text-gray-500 py-20 text-lg">No products found.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredProducts.map((product, index) => (
                            <motion.div
                                key={product._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: index * 0.05 }}
                                className="bg-stone-800/60 backdrop-blur-sm rounded-2xl overflow-hidden shadow-xl group border border-stone-700/50 hover:border-primary/50 transition-all duration-300 flex flex-col"
                            >
                                <div className="h-52 overflow-hidden relative">
                                    <img
                                        src={getImageUrl(product.image)}
                                        alt={product.name}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <span className="absolute top-3 right-3 bg-primary text-dark px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                                        ${product.price.toFixed(2)}
                                    </span>
                                </div>
                                <div className="p-5 flex flex-col flex-grow">
                                    <div className="mb-3">
                                        <span className="text-xs text-secondary font-semibold uppercase tracking-wider">{product.category}</span>
                                        <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors">{product.name}</h3>
                                    </div>
                                    <p className="text-gray-400 text-sm mb-4 line-clamp-2 flex-grow">{product.description}</p>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => addToCart(product)}
                                        className="w-full bg-gradient-to-r from-secondary to-accent hover:from-accent hover:to-secondary text-white font-bold py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-secondary/20 mt-auto"
                                    >
                                        <FaShoppingCart /> Add to Cart
                                    </motion.button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Menu;
