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
        <div className="min-h-screen text-white pt-24" style={{backgroundColor:'#0A0806'}}>
            {/* Hero Section */}
            <section className="relative px-4 pb-20 pt-10 overflow-hidden">
                <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <p className="text-primary/70 text-sm font-semibold tracking-[0.28em] uppercase mb-4">— Crafted with Fire &amp; Soul</p>
                        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-[1.05]">
                            Where Every<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-amber-400 to-secondary italic">Bite Lingers.</span>
                        </h1>
                        <p className="text-stone-400 text-lg mb-8 max-w-lg leading-relaxed font-light">
                            Bold flavors, honest ingredients. Sizzora brings the kitchen to your door — no shortcuts, no compromise.
                        </p>
                        <div className="flex gap-4 flex-wrap">
                            <Link to="/menu" className="bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary text-stone-950 font-bold px-8 py-4 rounded-xl text-base shadow-[0_0_28px_rgba(232,150,58,0.35)] hover:shadow-[0_0_40px_rgba(232,150,58,0.5)] transition-all transform hover:-translate-y-0.5">
                                Order Now
                            </Link>
                            <Link to="/about" className="bg-transparent border border-stone-600 text-stone-300 hover:border-primary hover:text-primary font-medium px-8 py-4 rounded-xl text-base transition-all">
                                Our Story
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
            <section className="py-20 px-4" style={{backgroundColor:'rgba(22,18,16,0.5)'}}>
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <p className="text-primary/60 text-xs font-semibold tracking-[0.28em] uppercase mb-3">— What's Hot</p>
                        <h2 className="text-4xl md:text-5xl font-semibold text-white">Trending <span className="italic text-primary">Right Now</span></h2>
                    </motion.div>

                    {trendingProducts.length === 0 ? (
                        <p className="text-center text-stone-500">No trending dishes at the moment.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {trendingProducts.map((product) => (
                                <motion.div
                                    key={product._id}
                                    whileHover={{ y: -6 }}
                                    className="rounded-2xl overflow-hidden shadow-xl border border-stone-800/80 hover:border-primary/40 transition-all flex flex-col h-full" style={{backgroundColor:'#161210'}}
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
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <p className="text-primary/60 text-xs font-semibold tracking-[0.28em] uppercase mb-3">— The Sizzora Difference</p>
                        <h2 className="text-4xl md:text-5xl font-semibold text-white">Why <span className="italic text-primary">Sizzora?</span></h2>
                    </motion.div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0 }} viewport={{ once: true }}
                            className="p-7 rounded-2xl border border-stone-800 hover:border-primary/30 transition-colors group" style={{backgroundColor:'#161210'}}
                        >
                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                                <span className="text-2xl">⚡</span>
                            </div>
                            <h3 className="text-lg font-semibold mb-3 text-white">Fast Delivery</h3>
                            <p className="text-stone-500 text-sm leading-relaxed">Hot, fresh, on time. We don't keep you waiting.</p>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} viewport={{ once: true }}
                            className="p-7 rounded-2xl border border-stone-800 hover:border-primary/30 transition-colors group" style={{backgroundColor:'#161210'}}
                        >
                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                                <span className="text-2xl">🌿</span>
                            </div>
                            <h3 className="text-lg font-semibold mb-3 text-white">Honest Ingredients</h3>
                            <p className="text-stone-500 text-sm leading-relaxed">Locally sourced, no fillers, no shortcuts. Just real food.</p>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} viewport={{ once: true }}
                            className="p-7 rounded-2xl border border-stone-800 hover:border-primary/30 transition-colors group" style={{backgroundColor:'#161210'}}
                        >
                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                                <span className="text-2xl">🔥</span>
                            </div>
                            <h3 className="text-lg font-semibold mb-3 text-white">Cooked to Order</h3>
                            <p className="text-stone-500 text-sm leading-relaxed">Every dish made fresh when you order — never pre-cooked.</p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Image Showcase Section */}
            <section className="py-20 px-4" style={{background:'linear-gradient(180deg,#100A06 0%,#161210 50%,#100A06 100%)'}}>
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <p className="text-primary/60 text-xs font-semibold tracking-[0.28em] uppercase mb-3">— The Experience</p>
                        <h2 className="text-4xl md:text-5xl font-semibold text-white italic">A Feast for the Eyes</h2>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.97 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="relative rounded-2xl overflow-hidden shadow-2xl border border-stone-800/60 group"
                    >
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
                                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
                                />
                            ))}
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                        <div className="absolute bottom-6 left-7">
                            <p className="text-cream/80 text-base font-light tracking-wide drop-shadow-lg italic">Every plate tells a story.</p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Newsletter Section */}
            <section className="py-24 px-4 relative overflow-hidden" style={{backgroundColor:'#100A06'}}>
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-2xl mx-auto text-center relative z-10">
                    <p className="text-primary/60 text-xs font-semibold tracking-[0.28em] uppercase mb-4">— Stay in the Loop</p>
                    <h2 className="text-4xl md:text-5xl font-semibold mb-4 text-white">Get Exclusive <span className="italic text-primary">Offers</span></h2>
                    <p className="text-stone-500 mb-10 text-base">New dishes, seasonal specials, and 20% off your first order — straight to your inbox.</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <input type="email" placeholder="your@email.com" className="flex-grow px-5 py-3.5 rounded-xl border border-stone-700 text-white focus:border-primary focus:outline-none text-sm" style={{backgroundColor:'#161210'}} />
                        <button className="bg-gradient-to-r from-primary to-secondary text-stone-950 font-semibold px-7 py-3.5 rounded-xl hover:opacity-90 transition-opacity shadow-lg text-sm">Subscribe</button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;