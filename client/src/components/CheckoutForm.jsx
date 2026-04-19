import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaTimes, FaCloudUploadAlt, FaPaperPlane, FaCheck } from 'react-icons/fa';

const CheckoutForm = ({ cart, total, onClose, onSubmit, isSubmitting, user }) => {
    const [formData, setFormData] = useState({
        customerName: user ? user.name : '',
        phoneNumber: user ? user.phone : '',
        shippingAddress: '',
        additionalDetails: ''
    });
    const [image, setImage] = useState(null);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setImage(e.target.files[0]);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!image) {
            alert('Please upload a payment proof screenshot before submitting.');
            return;
        }

        const data = new FormData();
        data.append('customerName', formData.customerName);
        data.append('phoneNumber', formData.phoneNumber);
        data.append('shippingAddress', formData.shippingAddress);
        data.append('additionalDetails', formData.additionalDetails);
        data.append('totalAmount', total);
        data.append('userId', user ? user.id : 'guest_user');
        data.append('items', JSON.stringify(cart.map(item => ({
            product: item._id,
            quantity: item.quantity,
            price: item.price
        }))));

        if (image) {
            data.append('paymentProofImage', image);
        }

        onSubmit(data);
    };

    return (
        <div className="fixed inset-0 bg-stone-900/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-stone-800 rounded-2xl w-full max-w-lg shadow-2xl border border-primary/20 max-h-[90vh] overflow-y-auto relative"
            >
                {/* Header */}
                <div className="sticky top-0 bg-stone-800/95 backdrop-blur z-10 px-6 py-4 border-b border-primary/10 flex justify-between items-center">
                    <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                        Complete Your Order
                    </h2>
                    <button 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-white transition-colors bg-stone-700/50 hover:bg-stone-700 p-2 rounded-full"
                    >
                        <FaTimes />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {!user && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-400 text-sm font-bold mb-2 ml-1">Full Name *</label>
                                <input 
                                    name="customerName" 
                                    required 
                                    value={formData.customerName} 
                                    onChange={handleInputChange} 
                                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all focus:shadow-[0_0_10px_rgba(254,183,5,0.2)]" 
                                    placeholder="John Doe" 
                                />
                            </div>

                            <div>
                                <label className="block text-gray-400 text-sm font-bold mb-2 ml-1">Phone Number *</label>
                                <input 
                                    name="phoneNumber" 
                                    required 
                                    value={formData.phoneNumber} 
                                    onChange={handleInputChange} 
                                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all focus:shadow-[0_0_10px_rgba(254,183,5,0.2)]" 
                                    placeholder="+1 234 567 890" 
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-gray-400 text-sm font-bold mb-2 ml-1">Delivery Address *</label>
                        <textarea 
                            name="shippingAddress" 
                            required 
                            value={formData.shippingAddress} 
                            onChange={handleInputChange} 
                            className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all focus:shadow-[0_0_10px_rgba(254,183,5,0.2)]" 
                            rows="2" 
                            placeholder="Street, Apt, City..." 
                        />
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm font-bold mb-2 ml-1">Payment Proof (Screenshot) *</label>
                       
                        <div className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-300 relative group overflow-hidden ${image ? 'border-primary bg-primary/5' : 'border-stone-600 hover:border-gray-500 hover:bg-stone-700/30'}`}>
                            <input 
                                type="file" 
                                required 
                                accept="image/*" 
                                onChange={handleFileChange} 
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20" 
                            />
                            
                            {image ? (
                                <div className="space-y-2 relative z-10">
                                    <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center text-primary">
                                       <FaCheck />
                                    </div>
                                    <span className="text-white font-bold block truncate max-w-[200px] mx-auto">{image.name}</span>
                                    <span className="text-xs text-gray-400">{(image.size / 1024).toFixed(2)} KB</span>
                                    <p className="text-xs text-primary mt-2">Click to change</p>
                                </div>
                            ) : (
                                <div className="space-y-2 relative z-10">
                                    <div className="mx-auto w-12 h-12 bg-stone-700 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                                        <FaCloudUploadAlt size={24} />
                                    </div>
                                    <span className="text-gray-300 font-medium block">Click to upload payment screenshot</span>
                                    <span className="text-xs text-gray-500">Supports JPG, PNG</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm font-bold mb-2 ml-1">Additional Details (Optional)</label>
                        <textarea 
                            name="additionalDetails" 
                            value={formData.additionalDetails} 
                            onChange={handleInputChange} 
                            className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all focus:shadow-[0_0_10px_rgba(254,183,5,0.2)]" 
                            rows="2" 
                            placeholder="Allergies, door code..." 
                        />
                    </div>

                    {/* Summary Footer */}
                    <div className="pt-4 mt-6 border-t border-stone-700">
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-gray-400">Total Amount</span>
                            <span className="text-3xl font-extrabold text-primary">${total.toFixed(2)}</span>
                        </div>

                        <div className="flex gap-4">
                            <button 
                                type="button" 
                                onClick={onClose} 
                                className="flex-1 px-6 py-3 rounded-xl font-bold border border-stone-600 hover:bg-stone-700 transition-colors text-gray-300"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                disabled={isSubmitting} 
                                className="flex-[2] bg-gradient-to-r from-secondary to-accent hover:from-accent hover:to-secondary text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-secondary/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transform hover:scale-[1.02]"
                            >
                                {isSubmitting ? (
                                    <>Processing...</> 
                                ) : (
                                    <>Confirm Order <FaPaperPlane className="text-sm" /></>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default CheckoutForm;
