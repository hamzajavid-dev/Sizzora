import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { getImageUrl } from '../utils/imageUtils';

// Fallback placeholder image
const getPlaceholderImage = () => 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop';

const CategoryCard = ({ category }) => (
    <Link to={`/menu?category=${category.name}`} className="block group">
        <div className="relative overflow-hidden rounded-full aspect-square border-4 border-stone-800 group-hover:border-primary transition-colors shadow-xl">
            <img
                src={getImageUrl(category.image) || getPlaceholderImage()}
                onError={(e) => { e.target.onerror = null; e.target.src = getPlaceholderImage(); }}
                alt={category.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <h3 className="text-xl md:text-2xl font-bold text-white uppercase tracking-wider drop-shadow-md group-hover:scale-110 transition-transform">{category.name}</h3>
            </div>
        </div>
    </Link>
);

const Home = () => {
    const [categories, setCategories] = useState([]);
    const [trendingProducts, setTrendingProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await axios.get('/api/categories');
                setCategories(res.data);
            } catch (err) {
                console.error('Error fetching categories:', err);
            }
        };

        const fetchTrending = async () => {
            try {
                const res = await axios.get('/api/products/trending');
                setTrendingProducts(res.data);
            } catch (err) {
                console.error('Error fetching trending products:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
        fetchTrending();
    }, []);

    // Auto-advance image slider
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % 4);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return <div className="min-h-screen bg-stone-900 flex items-center justify-center text-primary text-2xl font-bold">Loading Sizzora...</div>;
    }

    return (
        <div className="min-h-screen bg-stone-900 text-white pt-24">
            {/* Hero Section */}
            <section className="relative px-4 pb-20 pt-10 overflow-hidden">
                <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
                            TASTE THE <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary filter drop-shadow-lg">EXTRAORDINARY</span>
                        </h1>
                        <p className="text-gray-300 text-lg md:text-xl mb-8 max-w-lg leading-relaxed">
                            Experience culinary perfection with our handcrafted dishes, made from the finest ingredients and delivered with passion.
                        </p>
                        <div className="flex gap-4">
                            <Link to="/menu" className="bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary text-stone-900 font-extrabold px-8 py-4 rounded-full text-lg shadow-[0_0_20px_rgba(254,183,5,0.4)] hover:shadow-[0_0_30px_rgba(254,183,5,0.6)] transition-all transform hover:-translate-y-1 animate-pulse">
                                Order Now
                            </Link>
                            <Link to="/about" className="bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-stone-900 font-bold px-8 py-4 rounded-full text-lg transition-all">
                                Learn More
                            </Link>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, rotate: 10 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-full blur-[100px] opacity-20 animate-pulse"></div>
                        <img src="https://images.unsplash.com/photo-1544025162-d76694265947?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Hero Dish" className="relative z-10 w-full max-w-md mx-auto rounded-full shadow-2xl border-4 border-stone-800 rotate-12 hover:rotate-0 transition-all duration-700" />
                    </motion.div>
                </div>
            </section>

            {/* Our Menu - Dynamic Categories */}
            <section className="py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-end mb-12">
                        <motion.h2
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="text-4xl font-extrabold text-white"
                        >
                            Explore Our <span className="text-primary">Menu</span>
                        </motion.h2>
                        <Link to="/menu" className="text-secondary font-bold hover:text-primary transition-colors flex items-center gap-2">
                            View Full Menu <FaChevronRight />
                        </Link>
                    </div>

                    <Swiper
                        modules={[Navigation, Pagination]}
                        spaceBetween={20}
                        slidesPerView={1}
                        navigation={{
                            nextEl: '.swiper-button-next-custom',
                            prevEl: '.swiper-button-prev-custom',
                        }}
                        breakpoints={{
                            640: { slidesPerView: 2 },
                            768: { slidesPerView: 3 },
                            1024: { slidesPerView: 4 },
                        }}
                        className="pb-12 px-4"
                    >
                        {categories.map(cat => (
                            <SwiperSlide key={cat._id}>
                                <CategoryCard category={cat} />
                            </SwiperSlide>
                        ))}
                    </Swiper>

                    <div className="flex justify-center gap-4 mt-6">
                        <button className="swiper-button-prev-custom bg-stone-800 hover:bg-primary hover:text-stone-900 text-white p-3 rounded-full transition-all border border-stone-700"><FaChevronLeft /></button>
                        <button className="swiper-button-next-custom bg-stone-800 hover:bg-primary hover:text-stone-900 text-white p-3 rounded-full transition-all border border-stone-700"><FaChevronRight /></button>
                    </div>
                </div>
            </section>

            {/* Trending Dishes Section */}
            <section className="py-20 px-4 bg-stone-800/30">
                <div className="max-w-7xl mx-auto">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl font-extrabold text-center mb-12"
                    >
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Trending Now</span>
                    </motion.h2>

                    {trendingProducts.length === 0 ? (
                        <p className="text-center text-gray-400">No trending dishes at the moment.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {trendingProducts.map((product) => (
                                <motion.div
                                    key={product._id}
                                    whileHover={{ y: -10 }}
                                    className="bg-stone-800 rounded-2xl overflow-hidden shadow-lg border border-stone-700 hover:border-primary/50 transition-all flex flex-col h-full"
                                >
                                    <div className="h-48 overflow-hidden relative">
                                        <img src={getImageUrl(product.image)} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" />
                                        <div className="absolute top-2 right-2 bg-gradient-to-r from-secondary to-accent text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">HOT</div>
                                    </div>
                                    <div className="p-6 flex flex-col flex-grow">
                                        <h3 className="text-xl font-bold mb-2 text-white">{product.name}</h3>
                                        <p className="text-gray-400 text-sm mb-4 line-clamp-2 flex-grow">{product.description}</p>
                                        <div className="flex justify-between items-center mt-auto">
                                            <span className="text-primary font-bold text-lg">${product.price.toFixed(2)}</span>
                                            <Link to={`/product/${product._id}`} className="text-sm font-bold text-secondary hover:text-white transition-colors uppercase tracking-wide border border-secondary/30 hover:bg-secondary/20 px-4 py-2 rounded-lg">Order Now</Link>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Why Choose Us Section */}
            <section className="py-20 px-4">
                <div className="max-w-7xl mx-auto text-center">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl font-extrabold mb-16"
                    >
                        Why Choose <span className="text-primary">Sizzora?</span>
                    </motion.h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <div className="p-6 bg-stone-800/50 rounded-2xl border border-stone-700/50 hover:border-primary/30 transition-colors">
                            <div className="w-16 h-16 mx-auto bg-primary/20 rounded-full flex items-center justify-center mb-6">
                                <span className="text-3xl">🚀</span>
                            </div>
                            <h3 className="text-xl font-bold mb-4 text-white">Fastest Delivery</h3>
                            <p className="text-gray-400">We ensure your food arrives hot and fresh, faster than you expect.</p>
                        </div>
                        <div className="p-6 bg-stone-800/50 rounded-2xl border border-stone-700/50 hover:border-primary/30 transition-colors">
                            <div className="w-16 h-16 mx-auto bg-primary/20 rounded-full flex items-center justify-center mb-6">
                                <span className="text-3xl">🥗</span>
                            </div>
                            <h3 className="text-xl font-bold mb-4 text-white">Fresh Ingredients</h3>
                            <p className="text-gray-400">We use only the finest, locally sourced ingredients for our dishes.</p>
                        </div>
                        <div className="p-6 bg-stone-800/50 rounded-2xl border border-stone-700/50 hover:border-primary/30 transition-colors">
                            <div className="w-16 h-16 mx-auto bg-primary/20 rounded-full flex items-center justify-center mb-6">
                                <span className="text-3xl">💎</span>
                            </div>
                            <h3 className="text-xl font-bold mb-4 text-white">Premium Quality</h3>
                            <p className="text-gray-400">Experience 5-star dining quality at affordable prices.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Image Showcase Section - Fading Slider */}
            <section className="py-20 px-4 bg-gradient-to-b from-stone-900 via-stone-800 to-stone-900">
                <div className="max-w-6xl mx-auto">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="text-4xl font-bold text-center mb-12"
                    >
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Experience Excellence</span>
                    </motion.h2>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="relative rounded-3xl overflow-hidden shadow-2xl shadow-primary/20 border-4 border-primary/30 group"
                    >
                        {/* Image Slider */}
                        <div className="relative w-full aspect-video">
                            {[
                                'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&h=675&fit=crop',
                                'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=1200&h=675&fit=crop',
                                'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=1200&h=675&fit=crop',
                                'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&h=675&fit=crop'
                            ].map((img, index) => (
                                <img
                                    key={index}
                                    src={img}
                                    alt={`Showcase ${index + 1}`}
                                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                                        }`}
                                />
                            ))}
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 via-transparent to-transparent pointer-events-none"></div>
                        <div className="absolute bottom-6 left-6 right-6">
                            <p className="text-white/90 text-lg font-medium drop-shadow-lg">Crafting unforgettable culinary experiences, one dish at a time</p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Newsletter Section */}
            <section className="py-24 px-4 bg-primary/10 relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary/20 rounded-full blur-3xl"></div>

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <h2 className="text-4xl font-extrabold mb-6 text-white">Subscribe to our Newsletter</h2>
                    <p className="text-gray-300 mb-8 text-lg">Get exclusive offers, new menu updates, and 20% off your first order!</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto">
                        <input type="email" placeholder="Enter your email" className="flex-grow px-6 py-4 rounded-full bg-stone-900 border border-stone-700 text-white focus:border-primary focus:outline-none" />
                        <button className="bg-gradient-to-r from-primary to-secondary text-stone-900 font-bold px-8 py-4 rounded-full hover:scale-105 transition-transform shadow-lg">Subscribe</button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;