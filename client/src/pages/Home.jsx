import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import homeVideo from '../assets/homevideo.mp4';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Home = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const videoRef = useRef(null);
    const [videoFading, setVideoFading] = useState(false);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch(`${API_URL}/categories`);
                const data = await res.json();
                setCategories(data);
            } catch (err) {
                console.error('Error fetching categories:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, []);

    // Handle video fade on loop
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleTimeUpdate = () => {
            const timeLeft = video.duration - video.currentTime;
            if (timeLeft <= 0.5 && !videoFading) {
                setVideoFading(true);
            }
        };

        const handleEnded = () => {
            setVideoFading(false);
        };

        const handleSeeked = () => {
            setVideoFading(false);
        };

        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('ended', handleEnded);
        video.addEventListener('seeked', handleSeeked);

        return () => {
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('ended', handleEnded);
            video.removeEventListener('seeked', handleSeeked);
        };
    }, [videoFading]);

    // Fallback placeholder image
    const getPlaceholderImage = () => 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop';

    const CategoryCard = ({ category }) => (
        <motion.div
            whileHover={{ y: -10 }}
            className="bg-stone-800/60 backdrop-blur-sm rounded-2xl overflow-hidden shadow-xl cursor-pointer group border border-primary/20 hover:border-primary/60 transition-all duration-300"
        >
            <Link to={`/menu?category=${category.name}`}>
                <div className="h-56 relative overflow-hidden">
                    <img
                        src={category.image || getPlaceholderImage()}
                        alt={category.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => { e.target.src = getPlaceholderImage(); }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-transparent opacity-80"></div>
                </div>
                <div className="p-6 bg-gradient-to-b from-stone-800/80 to-stone-900/90">
                    <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">{category.name}</h3>
                    <span className="text-secondary font-semibold group-hover:tracking-wider transition-all inline-flex items-center gap-2">
                        View Options <FaChevronRight className="text-sm group-hover:translate-x-1 transition-transform" />
                    </span>
                </div>
            </Link>
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-stone-900 text-white pt-20">
            {/* Hero Section */}
            <div className="relative h-[80vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=2069&auto=format&fit=crop')] bg-cover bg-center opacity-40"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-transparent"></div>

                <div className="relative z-10 text-center px-4">
                    <motion.h1
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.8 }}
                        className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight drop-shadow-lg"
                    >
                        Taste the <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Extraordinary</span>
                    </motion.h1>
                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto"
                    >
                        Experience gourmet dining delivered to your doorstep. Fresh, hot, and delicious.
                    </motion.p>
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                    >
                        <Link to="/menu" className="bg-gradient-to-r from-secondary to-accent hover:from-accent hover:to-secondary text-white font-bold py-4 px-10 rounded-full text-lg transition-all transform hover:scale-105 shadow-xl shadow-secondary/40 border border-white/10 uppercase tracking-wider">
                            Order Now
                        </Link>
                    </motion.div>
                </div>
            </div>

            {/* Our Menu - Dynamic Categories */}
            <section className="py-20 px-4 max-w-7xl mx-auto">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="text-4xl font-bold text-center mb-16"
                >
                    <span className="border-b-4 border-primary pb-2 text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Our Menu</span>
                </motion.h2>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : categories.length === 0 ? (
                    <p className="text-center text-gray-400 text-lg">No categories available yet.</p>
                ) : categories.length <= 4 ? (
                    // Grid layout for 4 or fewer categories
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {categories.map((category) => (
                            <CategoryCard key={category._id} category={category} />
                        ))}
                    </div>
                ) : (
                    // Swiper slider for more than 4 categories
                    <div className="relative px-12">
                        <Swiper
                            modules={[Navigation, Pagination, Autoplay]}
                            spaceBetween={24}
                            slidesPerView={1}
                            navigation={{
                                prevEl: '.swiper-button-prev-custom',
                                nextEl: '.swiper-button-next-custom',
                            }}
                            pagination={{ clickable: true }}
                            autoplay={{ delay: 4000, disableOnInteraction: false }}
                            breakpoints={{
                                640: { slidesPerView: 2 },
                                1024: { slidesPerView: 3 },
                                1280: { slidesPerView: 4 },
                            }}
                            className="pb-12"
                        >
                            {categories.map((category) => (
                                <SwiperSlide key={category._id}>
                                    <CategoryCard category={category} />
                                </SwiperSlide>
                            ))}
                        </Swiper>
                        {/* Custom Navigation Buttons */}
                        <button className="swiper-button-prev-custom absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-primary hover:bg-secondary text-dark p-3 rounded-full shadow-lg transition-all">
                            <FaChevronLeft size={20} />
                        </button>
                        <button className="swiper-button-next-custom absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-primary hover:bg-secondary text-dark p-3 rounded-full shadow-lg transition-all">
                            <FaChevronRight size={20} />
                        </button>
                    </div>
                )}
            </section>

            {/* Video Showcase Section */}
            <section className="py-20 px-4 bg-gradient-to-b from-stone-900 via-stone-800 to-stone-900">
                <div className="max-w-6xl mx-auto">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="text-4xl font-bold text-center mb-12"
                    >
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Watch Our Story</span>
                    </motion.h2>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="relative rounded-3xl overflow-hidden shadow-2xl shadow-primary/20 border-4 border-primary/30 group video-container"
                    >
                        <video
                            ref={videoRef}
                            className={`w-full h-auto aspect-video object-cover transition-opacity duration-500 ${videoFading ? 'opacity-30' : 'opacity-100'}`}
                            autoPlay
                            loop
                            muted
                            playsInline
                        >
                            <source src={homeVideo} type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>
                        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 via-transparent to-transparent pointer-events-none"></div>
                        <div className="absolute bottom-6 left-6 right-6">
                            <p className="text-white/90 text-lg font-medium drop-shadow-lg">Experience the passion behind every dish we create</p>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
};

export default Home;