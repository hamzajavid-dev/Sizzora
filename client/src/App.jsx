import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
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
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import ErrorBoundary from './components/ErrorBoundary';
import ChatWidget from './components/ChatWidget';
import { AnimatePresence, motion } from 'framer-motion';

// Separate component to use useLocation hook
const AnimatedRoutes = () => {
    const location = useLocation();
    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route path="/" element={<PageTransition><Home /></PageTransition>} />
                <Route path="/menu" element={<PageTransition><Menu /></PageTransition>} />
                <Route path="/cart" element={<PageTransition><Cart /></PageTransition>} />
                <Route path="/product/:id" element={<PageTransition><ProductDetails /></PageTransition>} />

                {/* Protected Admin Route */}
                <Route element={<ProtectedRoute adminOnly={true} />}>
                    <Route path="/admin" element={<PageTransition><AdminDashboard /></PageTransition>} />
                </Route>

                <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
                <Route path="/contact/suggestions" element={<PageTransition><Suggestions /></PageTransition>} />
                <Route path="/contact/complaints" element={<PageTransition><Complaints /></PageTransition>} />
                <Route path="/about" element={<PageTransition><div className="pt-32 text-white text-center min-h-screen flex items-center justify-center bg-stone-900"><h1 className="text-4xl font-bold">About Page Coming Soon</h1></div></PageTransition>} />
                <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
                <Route path="/signup" element={<PageTransition><Signup /></PageTransition>} />
                <Route path="/account" element={<PageTransition><Account /></PageTransition>} />
            </Routes>
        </AnimatePresence>
    );
};

const PageTransition = ({ children }) => (
    <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.3 }}
    >
        {children}
    </motion.div>
);

function App() {
    return (
        <AuthProvider>
            <CartProvider>
                <Router>
                    <ScrollToTop />
                    <div className="app-shell min-h-screen font-sans flex flex-col">
                        <Navbar />
                        <main className="flex-grow">
                            <ErrorBoundary>
                                <AnimatedRoutes />
                            </ErrorBoundary>
                        </main>
                        <Footer />
                        <ChatWidget />
                    </div>
                </Router>
            </CartProvider>
        </AuthProvider>
    )
}

export default App;
