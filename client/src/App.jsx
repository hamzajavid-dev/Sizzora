import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Cart from './pages/Cart';
import ProductDetails from './pages/ProductDetails';
import AdminDashboard from './pages/AdminDashboard';
import Contact from './pages/Contact';
import Suggestions from './pages/Suggestions';
import Complaints from './pages/Complaints';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Account from './pages/Account';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';

function App() {
    return (
        <AuthProvider>
            <CartProvider>
                <Router>
                    <div className="bg-stone-900 min-h-screen font-sans flex flex-col">
                        <Navbar />
                        <main className="flex-grow">
                            <Routes>
                                <Route path="/" element={<Home />} />
                                <Route path="/menu" element={<Menu />} />
                                <Route path="/cart" element={<Cart />} />
                                <Route path="/product/:id" element={<ProductDetails />} />
                                <Route path="/admin" element={<AdminDashboard />} />
                                <Route path="/contact" element={<Contact />} />
                                <Route path="/contact/suggestions" element={<Suggestions />} />
                                <Route path="/contact/complaints" element={<Complaints />} />
                                <Route path="/about" element={<div className="pt-20 text-white text-center">About Page Coming Soon</div>} />
                                <Route path="/login" element={<Login />} />
                                <Route path="/signup" element={<Signup />} />
                                <Route path="/account" element={<Account />} />
                            </Routes>
                        </main>
                        <Footer />
                    </div>
                </Router>
            </CartProvider>
        </AuthProvider>
    )
}

export default App;
