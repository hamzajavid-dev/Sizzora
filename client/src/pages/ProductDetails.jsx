import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { FaStar, FaMinus, FaPlus } from 'react-icons/fa';
import { useCart } from '../context/CartContext';

const ProductDetails = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const { addToCart } = useCart();

    // Mock Data
    const mockProduct = { _id: id, name: 'Classic Burger', category: 'Burgers', price: 12.99, description: 'Juicy beef patty with cheese, lettuce, tomato, and our secret sauce on a brioche bun.', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1899&auto=format&fit=crop' };

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await axios.get(`/api/products/${id}`);
                setProduct(res.data);
            } catch (err) {
                console.error(err);
                setProduct(mockProduct);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    if (loading) return <div className="text-white text-center pt-20">Loading...</div>;
    if (!product) return <div className="text-white text-center pt-20">Product Not Found</div>;

    return (
        <div className="min-h-screen bg-gray-900 pt-24 px-4 text-white">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Image */}
                <div className="rounded-xl overflow-hidden shadow-2xl h-[400px] md:h-[500px]">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                </div>

                {/* Content */}
                <div className="flex flex-col justify-center">
                    <span className="text-gold font-semibold uppercase tracking-wider mb-2">{product.category}</span>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">{product.name}</h1>
                    <div className="flex items-center gap-1 mb-6 text-yellow-500">
                        {[...Array(5)].map((_, i) => <FaStar key={i} />)}
                        <span className="text-gray-400 text-sm ml-2">(128 reviews)</span>
                    </div>
                    <p className="text-gray-300 text-lg mb-8 leading-relaxed">{product.description}</p>

                    <div className="flex items-center justify-between mb-8 border-t border-b border-gray-700 py-6">
                        <span className="text-3xl font-bold text-tomato">${(product.price * quantity).toFixed(2)}</span>
                        <div className="flex items-center gap-4 bg-gray-800 rounded-full px-4 py-2">
                            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="text-white hover:text-tomato"><FaMinus /></button>
                            <span className="text-xl font-bold w-8 text-center">{quantity}</span>
                            <button onClick={() => setQuantity(quantity + 1)} className="text-white hover:text-green-500"><FaPlus /></button>
                        </div>
                    </div>

                    <button
                        onClick={() => addToCart(product, quantity)}
                        className="w-full bg-gold hover:bg-yellow-400 text-gray-900 font-bold py-4 rounded-xl text-xl shadow-lg shadow-gold/20 transition-all transform hover:-translate-y-1"
                    >
                        Add to Order
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductDetails;
