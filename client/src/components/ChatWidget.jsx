import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaTimes, FaPaperPlane, FaTrash, FaChevronLeft,
    FaHeadset, FaArchive, FaExpand, FaCompress, FaMinus, FaImage,
    FaCompass, FaShoppingCart, FaTag, FaMotorcycle,
} from 'react-icons/fa';
import { MdSupportAgent } from 'react-icons/md';
import { RiRobot2Fill, RiSparklingFill } from 'react-icons/ri';
import ErrorBoundary from './ErrorBoundary';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';

/* ─── Constants ─────────────────────────────────────────────── */
const MIN_WIDGET_WIDTH  = 340;
const MIN_WIDGET_HEIGHT = 480;
const clamp = (v, mn, mx) => Math.min(mx, Math.max(mn, v));

const SIZES = {
    normal: { width: 380, height: 560 },
    large:  { width: 520, height: 700 },
    full:   { width: 760, height: 860 },
};

const FOOD_EMOJIS = ['🍕','🍔','🍟','🌮','🍗'];

const AI_MODES = [
    { id: 'explore', label: 'Explore', icon: FaCompass,      hint: 'Browse the menu' },
    { id: 'order',   label: 'Order',   icon: FaShoppingCart, hint: 'Place an order' },
    { id: 'deals',   label: 'Deals',   icon: FaTag,          hint: 'Best value today' },
    { id: 'track',   label: 'Track',   icon: FaMotorcycle,   hint: 'Track your order' },
];

const QUICK_PROMPTS = [
    { label: '🔥 Best deals',    text: "Show me today's best deals" },
    { label: '🍔 Burgers',       text: 'Show me all burger options' },
    { label: '🌶 Spicy picks',   text: 'Recommend 2 spicy items' },
    { label: '⚡ Combos',        text: 'What combo deals do you have?' },
    { label: '🛒 Place order',   text: 'I want to place an order' },
];

const PLACEHOLDERS = [
    'What are you craving? 🍔',
    'Ask about meal deals…',
    'Try: spicy pizza 🍕',
    'Something sweet? 🍩',
    "Today's specials…",
];

/* ─── Chat badge ─────────────────────────────────────────────── */
const typeBadge = (t) => ({
    order:      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    complaint:  'bg-red-500/10    text-red-400    border-red-500/20',
    suggestion: 'bg-amber-500/10  text-amber-400  border-amber-500/20',
})[t] || 'bg-stone-500/10 text-stone-400 border-stone-500/20';

/* ─── AI response formatter ──────────────────────────────────── */
const parseInline = (str) => {
    const parts = str.split(/(\*\*[^*]+\*\*)/g);
    if (parts.length === 1) return str;
    return parts.map((p, i) =>
        /^\*\*[^*]+\*\*$/.test(p)
            ? <strong key={i} className="font-semibold text-white">{p.slice(2, -2)}</strong>
            : p
    );
};

const formatAiResponse = (text) => {
    if (!text) return null;
    return text.split('\n').filter(l => l.trim()).map((line, i) => {
        const t = line.trim();
        if (/^\d+\.\s/.test(t)) {
            const m = t.match(/^(\d+)\.\s(.+)$/);
            if (m) return (
                <div key={i} className="flex items-start gap-2 py-0.5">
                    <span className="mt-0.5 w-4 h-4 shrink-0 rounded-full flex items-center justify-center text-[9px] font-bold text-black bg-amber-400">{m[1]}</span>
                    <span>{parseInline(m[2])}</span>
                </div>
            );
        }
        if (/^[-•]\s/.test(t)) return (
            <div key={i} className="flex items-start gap-2 py-0.5">
                <span className="mt-2 w-1 h-1 shrink-0 rounded-full bg-amber-500/60"/>
                <span>{parseInline(t.replace(/^[-•]\s/, ''))}</span>
            </div>
        );
        if (/^\*\*.+\*\*$/.test(t)) return <p key={i} className="font-semibold text-amber-300 mt-2 mb-0.5">{t.replace(/\*\*/g,'')}</p>;
        if (/^---+$/.test(t))         return <hr key={i} className="border-white/8 my-2"/>;
        return <p key={i} className="py-0.5 leading-relaxed">{parseInline(t)}</p>;
    });
};

/* ─── AI avatar ──────────────────────────────────────────────── */
const AiAvatar = ({ size = 28, thinking = false }) => {
    const [idx, setIdx] = useState(0);
    useEffect(() => {
        if (!thinking) return;
        const t = setInterval(() => setIdx(i => (i+1) % FOOD_EMOJIS.length), 650);
        return () => clearInterval(t);
    }, [thinking]);
    return (
        <div className="shrink-0 rounded-full flex items-center justify-center"
            style={{ width: size, height: size, background: 'linear-gradient(145deg,#2a1f0a,#1a1208)', border: '1px solid rgba(245,158,11,0.3)' }}>
            {thinking
                ? <span style={{ fontSize: size * 0.5, lineHeight: 1 }}>{FOOD_EMOJIS[idx]}</span>
                : <RiRobot2Fill size={size * 0.5} className="text-amber-400" />
            }
        </div>
    );
};

/* ─── Typing indicator ───────────────────────────────────────── */
const TypingDots = () => (
    <div className="flex gap-1 px-0.5">
        {[0,140,280].map(d => (
            <div key={d} className="w-1.5 h-1.5 bg-amber-400/50 rounded-full animate-bounce" style={{ animationDelay:`${d}ms` }}/>
        ))}
    </div>
);

/* ═══════════════════════════════════════════════════════════════
   ChatWidget
═══════════════════════════════════════════════════════════════ */
const ChatWidget = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    const [isOpen,          setIsOpen]          = useState(false);
    const [isMinimized,     setIsMinimized]     = useState(false);
    const [sizeKey,         setSizeKey]         = useState('normal');
    const [customSize,      setCustomSize]      = useState(null);
    const [isFullscreen,    setIsFullscreen]    = useState(false);
    const [isResizing,      setIsResizing]      = useState(false);
    const [dockSide,        setDockSide]        = useState('right');
    const [chats,           setChats]           = useState([]);
    const [selectedChat,    setSelectedChat]    = useState(null);
    const [message,         setMessage]         = useState('');
    const [unreadCount,     setUnreadCount]     = useState(0);
    const [showBtn,         setShowBtn]         = useState(false);
    const [activeTab,       setActiveTab]       = useState('active');
    const [aiMessages,      setAiMessages]      = useState([{
        sender: 'ai',
        content: "Hi! I'm Sizzora AI — ask me about the menu, deals, or place an order 🍔",
        createdAt: new Date(),
    }]);
    const [isAiTyping,      setIsAiTyping]      = useState(false);
    const [isTyping,        setIsTyping]        = useState(false);
    const [aiImage,         setAiImage]         = useState(null);
    const [aiMode,          setAiMode]          = useState('explore');
    const [placeholderIdx,  setPlaceholderIdx]  = useState(0);
    const [portalRoot,      setPortalRoot]      = useState(null);

    const messagesEndRef = useRef(null);
    const typingTimeout  = useRef(null);
    const socketRef      = useRef(null);
    const resizeStateRef = useRef(null);
    const imageInputRef  = useRef(null);

    const size         = SIZES[sizeKey];
    const resolvedSize = customSize || size;
    const isRightDock  = dockSide === 'right';
    const baseOffset   = 20;

    const cycleSize = () => { setCustomSize(null); setSizeKey(k => k==='normal'?'large':k==='large'?'full':'normal'); };

    /* portal */
    useEffect(() => {
        let el = document.getElementById('chat-widget-portal');
        if (!el) {
            el = document.createElement('div');
            el.id = 'chat-widget-portal';
            Object.assign(el.style, { position:'fixed', top:0, left:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:9999 });
            document.body.appendChild(el);
        }
        setPortalRoot(el);
    }, []);

    /* socket */
    useEffect(() => {
        if (!user) return;
        const url = window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin;
        socketRef.current = io(url, { withCredentials: true });
        socketRef.current.on('receive_message', updated => {
            setSelectedChat(p => p?._id === updated._id ? updated : p);
            setChats(p => {
                const i = p.findIndex(c => c._id === updated._id);
                if (i !== -1) { const n = [...p]; n[i] = updated; return n.sort((a,b) => new Date(b.lastMessageAt)-new Date(a.lastMessageAt)); }
                return [updated, ...p];
            });
        });
        socketRef.current.on('display_typing', () => setIsTyping(true));
        socketRef.current.on('hide_typing',    () => setIsTyping(false));
        return () => socketRef.current?.disconnect();
    }, [user]);

    useEffect(() => {
        if (selectedChat && socketRef.current) {
            socketRef.current.emit('join_chat', selectedChat._id);
            setIsTyping(false);
        }
    }, [selectedChat]);

    const emitTyping = () => {
        if (!selectedChat || !socketRef.current) return;
        socketRef.current.emit('typing', { room: selectedChat._id, user: isAdmin ? 'admin' : user.id });
        clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => socketRef.current.emit('stop_typing', { room: selectedChat._id }), 2000);
    };

    /* fetch chats */
    useEffect(() => {
        if (!user) return;
        const load = async () => {
            try {
                if (isAdmin) {
                    const data = (await axios.get('/api/chat/all')).data;
                    setChats(Array.isArray(data) ? data : data.chats || []);
                    setUnreadCount((await axios.get('/api/chat/unread/admin')).data.count);
                } else {
                    let data = (await axios.get(`/api/chat/user/${user.id}`)).data;
                    data = Array.isArray(data) ? data : data.chats || [];
                    if (!data.length) {
                        const cr = await axios.post('/api/chat/create', { userId:user.id, userName:user.name||'User', userEmail:user.email, chatType:'general', chatTitle:'General Support' });
                        data = [cr.data];
                    }
                    setChats(data);
                    setUnreadCount(data.reduce((s,c) => s + c.unreadUserCount, 0));
                }
                setShowBtn(true);
            } catch (e) { console.error(e); }
        };
        load();
        const iv = setInterval(load, 3000);
        return () => clearInterval(iv);
    }, [user, isAdmin]);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior:'smooth' }); }, [selectedChat?.messages, aiMessages]);

    useEffect(() => {
        const t = setInterval(() => setPlaceholderIdx(i => (i+1) % PLACEHOLDERS.length), 3200);
        return () => clearInterval(t);
    }, []);

    /* resize */
    useEffect(() => {
        if (!isResizing) return;
        const onMove = (e) => {
            const s = resizeStateRef.current;
            if (!s) return;
            const maxW = Math.max(MIN_WIDGET_WIDTH,  window.innerWidth  - 30);
            const maxH = Math.max(MIN_WIDGET_HEIGHT, window.innerHeight - 80);
            const dx = e.clientX - s.startX;
            const dy = e.clientY - s.startY;
            let w = s.width, h = s.height;
            if (s.axis.includes('x')) w = s.dockSide==='right' ? s.width - dx : s.width + dx;
            if (s.axis === 'top' || s.axis === 'xtop') h = s.height - dy; // dragging top edge up → grow
            else if (s.axis.includes('y'))              h = s.height + dy;
            setCustomSize({ width: clamp(w, MIN_WIDGET_WIDTH, maxW), height: clamp(h, MIN_WIDGET_HEIGHT, maxH) });
        };
        const onUp = () => { resizeStateRef.current = null; setIsResizing(false); };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup',   onUp);
        return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    }, [isResizing]);

    if (!user || !portalRoot) return null;

    const startResize = (axis, e) => {
        e.preventDefault();
        if (isFullscreen || isMinimized) return;
        resizeStateRef.current = { axis, startX: e.clientX, startY: e.clientY, width: resolvedSize.width, height: resolvedSize.height, dockSide };
        setIsResizing(true);
    };

    const visibleChats = chats.filter(c => isAdmin ? (activeTab==='active' ? !c.isArchived : c.isArchived) : true);

    /* handlers */
    const getSessionId = () => {
        const today = new Date().toISOString().slice(0, 10);
        if (user?.id) return `${user.id}-${today}`;
        const key = 'sizzora_ai_session';
        const stored = localStorage.getItem(key);
        if (stored) { const [id, date] = stored.split('|'); if (date === today) return id; }
        const gid = 'guest-' + Math.random().toString(36).slice(2);
        localStorage.setItem(key, `${gid}|${today}`);
        return gid;
    };

    const handleImageSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const preview = URL.createObjectURL(file);
        setAiImage({ preview, url: null, uploading: true });
        try {
            const form = new FormData();
            form.append('image', file);
            const r = await axios.post('/api/orders/chatbot-upload', form, { withCredentials: true });
            setAiImage({ preview, url: r.data.imageUrl, uploading: false });
        } catch { setAiImage({ preview, url: null, uploading: false, error: true }); }
    };

    const sendAiMsg = async () => {
        if (!message.trim() && !aiImage) return;
        const txt = message; setMessage('');
        const img = aiImage; setAiImage(null);
        if (imageInputRef.current) imageInputRef.current.value = '';
        const userContent = txt + (img?.url ? '\n[Image attached]' : '');
        const msgs = [...aiMessages, { sender: isAdmin?'admin':'user', content: userContent, imagePreview: img?.preview, createdAt: new Date() }];
        setAiMessages(msgs); setIsAiTyping(true);
        try {
            const r = await axios.post('/api/chat/ai', {
                message: txt || (img ? 'I uploaded an image.' : ''),
                sessionId: user?.id || getSessionId(),
                userId: user?.id || '',
                userName: user?.name || 'Customer',
                userPhone: user?.phone || '',
                userAddress: user?.address || '',
                imageUrl: img?.url || '',
            });
            const reply = r.data?.reply || r.data?.message || r.data?.output || r.data?.text || (typeof r.data==='string' ? r.data : null);
            setAiMessages([...msgs, { sender:'ai', content: reply || 'Got it!', createdAt: new Date() }]);
        } catch (err) {
            const fb = err?.response?.data?.message || err?.response?.data?.error || "Sorry, I'm having trouble. Try again in a moment!";
            setAiMessages([...msgs, { sender:'ai', content: fb, createdAt: new Date() }]);
        } finally { setIsAiTyping(false); }
    };

    const sendMsg = async () => {
        if (!message.trim() || !selectedChat) return;
        if (selectedChat.isBlocked && !isAdmin) { alert('You are blocked'); return; }
        socketRef.current?.emit('stop_typing', { room: selectedChat._id });
        clearTimeout(typingTimeout.current);
        try {
            const r = await axios.post(`/api/chat/${selectedChat._id}/message`, { sender:isAdmin?'admin':'user', message:message.trim() });
            setSelectedChat(r.data); setMessage('');
            const fresh = isAdmin ? (await axios.get('/api/chat/all')).data : (await axios.get(`/api/chat/user/${user.id}`)).data;
            setChats(fresh);
        } catch (e) { alert(e.response?.data?.error||'Failed'); }
    };

    const deleteMsg = async id => {
        try { const r = await axios.delete(`/api/chat/${selectedChat._id}/message/${id}?sender=${isAdmin?'admin':'user'}`); setSelectedChat(r.data); }
        catch(e) { alert(e.response?.data?.error||'Failed'); }
    };
    const deleteHistory = async () => {
        if (!isAdmin||!selectedChat||!confirm('Delete entire chat history?')) return;
        try { await axios.delete(`/api/chat/${selectedChat._id}/history`); setChats((await axios.get('/api/chat/all')).data); setSelectedChat(null); }
        catch { alert('Failed'); }
    };
    const archiveChat = async (e, chat) => {
        e.stopPropagation();
        try { await axios.put(`/api/chat/${chat._id}/archive`,{isArchived:!chat.isArchived}); setChats(p=>p.map(c=>c._id===chat._id?{...c,isArchived:!chat.isArchived}:c)); }
        catch { alert('Failed'); }
    };
    const deleteChat = async (e, id) => {
        e.stopPropagation();
        if (!confirm('Delete permanently?')) return;
        setChats(p=>p.filter(c=>c._id!==id)); if (selectedChat?._id===id) setSelectedChat(null);
        try { await axios.delete(`/api/chat/${id}`); setChats((await axios.get('/api/chat/all')).data); }
        catch(e) { if(e.response?.status!==404){ alert('Failed'); setChats((await axios.get('/api/chat/all')).data); } }
    };
    const toggleBlock = async () => {
        try { const r = await axios.put(`/api/chat/${selectedChat._id}/block`,{isBlocked:!selectedChat.isBlocked}); setSelectedChat(r.data.chat); setChats((await axios.get('/api/chat/all')).data); }
        catch { alert('Failed'); }
    };
    const selectChat = async chat => {
        setSelectedChat(chat);
        try {
            await axios.put(`/api/chat/${chat._id}/read`,{reader:isAdmin?'admin':'user'});
            if (isAdmin) { setChats((await axios.get('/api/chat/all')).data); setUnreadCount((await axios.get('/api/chat/unread/admin')).data.count); }
            else { const d=(await axios.get(`/api/chat/user/${user.id}`)).data; setChats(d); setUnreadCount(d.reduce((s,c)=>s+c.unreadUserCount,0)); }
        } catch(e) { console.error(e); }
    };

    /* window style */
    const windowStyle = isFullscreen
        ? { pointerEvents:'auto', position:'fixed', top:18, bottom:18, left:18, right:18, width:'auto', height: isMinimized ? 52 : 'auto', transition:'all 0.25s ease', background:'#0f0e0c' }
        : { pointerEvents:'auto', position:'fixed', bottom: baseOffset,
            right: isRightDock ? baseOffset : 'auto',
            left:  isRightDock ? 'auto' : baseOffset,
            width: `min(calc(100vw - 24px), ${resolvedSize.width}px)`,
            height: isMinimized ? 52 : `min(calc(100vh - 100px), ${resolvedSize.height}px)`,
            transition: isResizing ? 'none' : 'all 0.25s ease',
            background:'#0f0e0c' };

    /* ─── palette ────────────────────────────────────────────── */
    const C = {
        bg:       '#0f0e0c',
        surface:  '#181512',
        border:   'rgba(255,255,255,0.07)',
        borderAm: 'rgba(245,158,11,0.18)',
        amber:    '#f59e0b',
        amberDk:  '#d97706',
        textSec:  '#a09188',
    };

    const amberGrad = `linear-gradient(135deg,${C.amber},${C.amberDk})`;

    /* ─── render ─────────────────────────────────────────────── */
    const content = (
        <div style={{ pointerEvents:'none', position:'fixed', inset:0 }}>

            {/* ── Launcher ─────────────────────────────────────── */}
            <AnimatePresence>
                {!isOpen && showBtn && (
                    <motion.div
                        key="btn"
                        initial={{ scale:0, opacity:0 }}
                        animate={{ scale:1, opacity:1 }}
                        exit={{ scale:0, opacity:0 }}
                        transition={{ type:'spring', stiffness:420, damping:26 }}
                        className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6"
                        style={{ pointerEvents:'auto', width:56, height:56 }}
                    >
                        {/* single slow pulse ring */}
                        <motion.div
                            aria-hidden
                            className="absolute rounded-full pointer-events-none"
                            style={{ inset:-8, border:`1px solid ${C.amber}40` }}
                            animate={{ scale:[1,1.35,1], opacity:[0.5,0,0.5] }}
                            transition={{ duration:3, repeat:Infinity, ease:'easeInOut' }}
                        />
                        <motion.button
                            whileHover={{ scale:1.08 }}
                            whileTap={{ scale:0.92 }}
                            onClick={() => setIsOpen(true)}
                            className="relative w-full h-full rounded-full flex items-center justify-center"
                            style={{ background: C.surface, border:`1.5px solid ${C.borderAm}`, boxShadow:`0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px ${C.borderAm}` }}
                        >
                            <span className="text-xl select-none">🔥</span>
                            {unreadCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[17px] h-[17px] flex items-center justify-center px-1 shadow">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Chat window ──────────────────────────────────── */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="win"
                        initial={{ opacity:0, y:16, scale:0.96 }}
                        animate={{ opacity:1, y:0,  scale:1    }}
                        exit={{ opacity:0, y:16, scale:0.96 }}
                        transition={{ type:'spring', stiffness:400, damping:30 }}
                        style={{ ...windowStyle, boxShadow:'0 24px 64px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06)' }}
                        className="flex flex-col rounded-2xl overflow-hidden"
                    >
                        {/* ── Header ──────────────────────────────── */}
                        <div
                            className="shrink-0 flex items-center gap-2.5 px-3 py-2.5"
                            style={{ background: C.surface, borderBottom:`1px solid ${C.borderAm}` }}
                        >
                            {/* brand mark */}
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                style={{ background: C.bg, border:`1px solid ${C.borderAm}` }}>
                                <span className="text-base leading-none">🔥</span>
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-semibold text-white leading-none truncate">
                                    {selectedChat ? selectedChat.chatTitle
                                        : isAdmin ? 'Support Inbox'
                                        : activeTab === 'ai' ? 'Sizzora AI'
                                        : 'Sizzora Support'}
                                </p>
                                <div className="flex items-center gap-1.5 mt-1">
                                    {activeTab === 'ai' && !selectedChat ? (
                                        <>
                                            <motion.div className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                                                animate={{ opacity:[1,0.3,1] }} transition={{ duration:2, repeat:Infinity }}/>
                                            <span className="text-[10px] text-emerald-400/80">
                                                {isAiTyping ? 'Thinking…' : 'Online'}
                                            </span>
                                        </>
                                    ) : (
                                        <span className="text-[10px]" style={{ color: C.textSec }}>
                                            {selectedChat ? (selectedChat.isBlocked ? 'Blocked' : 'Active') : "We're here to help"}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* controls */}
                            <div className="flex items-center gap-0.5 shrink-0">
                                {!isMinimized && (
                                    <button onClick={() => setDockSide(s => s==='right'?'left':'right')} title="Switch side"
                                        className="w-7 h-7 hidden sm:flex items-center justify-center rounded-md text-[10px] font-bold transition-colors"
                                        style={{ color: C.textSec }}
                                        onMouseEnter={e => e.currentTarget.style.color = C.amber}
                                        onMouseLeave={e => e.currentTarget.style.color = C.textSec}>
                                        {isRightDock ? 'L' : 'R'}
                                    </button>
                                )}
                                {!isMinimized && (
                                    <button onClick={cycleSize} title="Resize"
                                        className="w-7 h-7 flex items-center justify-center rounded-md transition-colors"
                                        style={{ color: C.textSec }}
                                        onMouseEnter={e => e.currentTarget.style.color = C.amber}
                                        onMouseLeave={e => e.currentTarget.style.color = C.textSec}>
                                        {sizeKey==='full' ? <FaCompress size={10}/> : <FaExpand size={10}/>}
                                    </button>
                                )}
                                {!isMinimized && (
                                    <button onClick={() => setIsFullscreen(p => !p)} title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                                        className="w-7 h-7 flex items-center justify-center rounded-md transition-colors"
                                        style={{ color: C.textSec }}
                                        onMouseEnter={e => e.currentTarget.style.color = C.amber}
                                        onMouseLeave={e => e.currentTarget.style.color = C.textSec}>
                                        {isFullscreen ? <FaCompress size={10}/> : <FaExpand size={10}/>}
                                    </button>
                                )}
                                <button onClick={() => setIsMinimized(m => !m)}
                                    className="w-7 h-7 flex items-center justify-center rounded-md transition-colors"
                                    style={{ color: C.textSec }}
                                    onMouseEnter={e => e.currentTarget.style.color = C.amber}
                                    onMouseLeave={e => e.currentTarget.style.color = C.textSec}>
                                    <FaMinus size={10}/>
                                </button>
                                <button onClick={() => { setIsOpen(false); setSelectedChat(null); setIsMinimized(false); setIsFullscreen(false); }}
                                    className="w-7 h-7 flex items-center justify-center rounded-md transition-colors"
                                    style={{ color: C.textSec }}
                                    onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                                    onMouseLeave={e => e.currentTarget.style.color = C.textSec}>
                                    <FaTimes size={12}/>
                                </button>
                            </div>
                        </div>

                        {/* ── Body ─────────────────────────────────── */}
                        {!isMinimized && (
                            <>
                                {/* Tab bar */}
                                {!selectedChat && (
                                    <div className="shrink-0 flex gap-1 px-2 py-2"
                                        style={{ background: C.bg, borderBottom:`1px solid ${C.border}` }}>
                                        {[
                                            { id:'active',   label: isAdmin ? 'Active'    : 'Support', icon: FaHeadset,      show: true  },
                                            { id:'archived', label: 'Archived',                        icon: FaArchive,      show: isAdmin },
                                            { id:'ai',       label: 'AI Chat',                         icon: RiSparklingFill, show: true  },
                                        ].filter(t => t.show).map(tab => {
                                            const active = activeTab === tab.id;
                                            const Icon = tab.icon;
                                            return (
                                                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium transition-all"
                                                    style={active
                                                        ? { background: amberGrad, color:'#111' }
                                                        : { color: C.textSec }
                                                    }
                                                    onMouseEnter={e => { if(!active) e.currentTarget.style.color = '#d6d0c8'; }}
                                                    onMouseLeave={e => { if(!active) e.currentTarget.style.color = C.textSec; }}>
                                                    <Icon size={10}/>{tab.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* ══ AI CHAT ══════════════════════════ */}
                                {!selectedChat && activeTab==='ai' ? (
                                    <div className="flex flex-col flex-1 min-h-0" style={{ background: C.bg }}>

                                        {/* AI sub-header */}
                                        <div className="shrink-0 flex items-center gap-3 px-3 py-2.5"
                                            style={{ background: C.surface, borderBottom:`1px solid ${C.border}` }}>
                                            <AiAvatar size={36} thinking={isAiTyping}/>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[12px] font-semibold text-white">Food Concierge</p>
                                                <p className="text-[10px] mt-0.5" style={{ color: C.textSec }}>
                                                    {isAiTyping ? 'Finding the best for you…' : 'Ask me anything about the menu'}
                                                </p>
                                            </div>
                                            <RiSparklingFill size={14} style={{ color:`${C.amber}50`, flexShrink:0 }}/>
                                        </div>

                                        {/* Mode pills */}
                                        <div className="shrink-0 flex gap-1 px-2 py-2"
                                            style={{ borderBottom:`1px solid ${C.border}` }}>
                                            {AI_MODES.map(m => {
                                                const active = aiMode === m.id;
                                                const Icon = m.icon;
                                                return (
                                                    <button key={m.id} onClick={() => setAiMode(m.id)} title={m.hint}
                                                        className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-[10px] font-medium transition-all"
                                                        style={active
                                                            ? { background:`${C.amber}18`, color: C.amber, border:`1px solid ${C.amber}35` }
                                                            : { color: C.textSec, border:'1px solid transparent' }
                                                        }
                                                        onMouseEnter={e => { if(!active) e.currentTarget.style.color = '#c8bfb2'; }}
                                                        onMouseLeave={e => { if(!active) e.currentTarget.style.color = C.textSec; }}>
                                                        <Icon size={9}/>{m.label}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Messages */}
                                        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
                                            {aiMessages.map((msg, i) => {
                                                const mine = msg.sender !== 'ai';
                                                return (
                                                    <motion.div key={i}
                                                        initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                                                        transition={{ duration:0.2 }}
                                                        className={`flex items-end gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
                                                        {!mine && <AiAvatar size={26}/>}
                                                        <div
                                                            className={`max-w-[80%] rounded-2xl text-[13px] ${mine ? 'rounded-br-sm text-black font-medium' : 'rounded-bl-sm text-stone-200'}`}
                                                            style={mine
                                                                ? { background: amberGrad, padding:'9px 13px' }
                                                                : { background: C.surface, border:`1px solid ${C.border}`, padding:'9px 13px' }}>
                                                            {msg.imagePreview && (
                                                                <img src={msg.imagePreview} alt="" className="mb-2 rounded-lg max-h-32 object-cover w-full"/>
                                                            )}
                                                            <div className="leading-relaxed">
                                                                {mine ? msg.content : (formatAiResponse(msg.content) || msg.content)}
                                                            </div>
                                                            <p className="text-[9px] mt-1.5 opacity-55">
                                                                {new Date(msg.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                                                            </p>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                            {isAiTyping && (
                                                <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="flex items-end gap-2">
                                                    <AiAvatar size={26} thinking/>
                                                    <div className="rounded-2xl rounded-bl-sm px-3 py-2.5"
                                                        style={{ background: C.surface, border:`1px solid ${C.border}` }}>
                                                        <TypingDots/>
                                                    </div>
                                                </motion.div>
                                            )}
                                            <div ref={messagesEndRef}/>
                                        </div>

                                        {/* Input area */}
                                        <div className="shrink-0 px-3 py-3"
                                            style={{ borderTop:`1px solid ${C.border}`, background: C.surface }}>
                                            {/* Quick chips */}
                                            <div className="flex gap-1.5 mb-2.5 overflow-x-auto" style={{ scrollbarWidth:'none' }}>
                                                {QUICK_PROMPTS.map(p => (
                                                    <button key={p.text} onClick={() => setMessage(p.text)}
                                                        className="shrink-0 text-[10px] px-2.5 py-1 rounded-full transition-colors whitespace-nowrap"
                                                        style={{ background:`${C.amber}0d`, border:`1px solid ${C.amber}25`, color:`${C.amber}cc` }}
                                                        onMouseEnter={e => { e.currentTarget.style.background=`${C.amber}18`; e.currentTarget.style.borderColor=`${C.amber}50`; }}
                                                        onMouseLeave={e => { e.currentTarget.style.background=`${C.amber}0d`; e.currentTarget.style.borderColor=`${C.amber}25`; }}>
                                                        {p.label}
                                                    </button>
                                                ))}
                                            </div>
                                            {/* Image preview */}
                                            {aiImage && (
                                                <div className="relative inline-block mb-2">
                                                    <img src={aiImage.preview} alt="" className="h-14 w-14 rounded-lg object-cover"/>
                                                    {aiImage.uploading && <div className="absolute inset-0 rounded-lg bg-black/60 flex items-center justify-center text-[9px] text-white">Uploading</div>}
                                                    {aiImage.error    && <div className="absolute inset-0 rounded-lg bg-red-900/70 flex items-center justify-center text-[9px] text-white">Failed</div>}
                                                    <button onClick={() => { setAiImage(null); if(imageInputRef.current) imageInputRef.current.value=''; }}
                                                        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[9px]">✕</button>
                                                </div>
                                            )}
                                            {/* Input row */}
                                            <div className="flex items-center gap-2 rounded-xl px-3 py-2"
                                                style={{ background: C.bg, border:`1px solid ${C.borderAm}` }}>
                                                <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden"/>
                                                <button onClick={() => imageInputRef.current?.click()}
                                                    className="shrink-0 transition-colors"
                                                    style={{ color:`${C.amber}70` }}
                                                    onMouseEnter={e => e.currentTarget.style.color = C.amber}
                                                    onMouseLeave={e => e.currentTarget.style.color = `${C.amber}70`}>
                                                    <FaImage size={13}/>
                                                </button>
                                                <input
                                                    type="text" value={message} onChange={e => setMessage(e.target.value)}
                                                    onKeyPress={e => e.key==='Enter' && sendAiMsg()}
                                                    placeholder={PLACEHOLDERS[placeholderIdx]}
                                                    className="flex-1 bg-transparent text-[13px] text-white outline-none py-0.5 placeholder-stone-500"
                                                    style={{ caretColor: C.amber }}
                                                />
                                                <button onClick={sendAiMsg} disabled={!message.trim() && !aiImage}
                                                    className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-black transition-opacity disabled:opacity-30"
                                                    style={{ background: amberGrad }}>
                                                    <FaPaperPlane size={10}/>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                /* ══ CHAT LIST ══════════════════════ */
                                ) : !selectedChat ? (
                                    <div className="flex-1 overflow-y-auto p-2 space-y-1" style={{ background: C.bg }}>
                                        {visibleChats.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-full gap-2 py-12">
                                                <span className="text-4xl opacity-20">🔥</span>
                                                <p className="text-[13px]" style={{ color: C.textSec }}>
                                                    {isAdmin ? `No ${activeTab} chats.` : 'No chats yet.'}
                                                </p>
                                            </div>
                                        ) : visibleChats.map(chat => (
                                            <motion.div key={chat._id} onClick={() => selectChat(chat)}
                                                className="group flex items-start gap-2.5 p-3 rounded-xl cursor-pointer transition-colors"
                                                style={{ background: C.surface }}
                                                whileHover={{ backgroundColor: '#201d18' }}>
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm"
                                                    style={{ background: C.bg, border:`1px solid ${C.border}` }}>
                                                    🔥
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2 mb-0.5">
                                                        <p className="text-[12px] font-semibold text-white truncate">{chat.chatTitle}</p>
                                                        {((isAdmin&&chat.unreadAdminCount>0)||(!isAdmin&&chat.unreadUserCount>0)) && (
                                                            <span className="text-[9px] font-bold text-black px-1.5 py-0.5 rounded-full shrink-0"
                                                                style={{ background: amberGrad }}>
                                                                {isAdmin ? chat.unreadAdminCount : chat.unreadUserCount}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {isAdmin && <p className="text-[10px] truncate mb-1" style={{ color: C.textSec }}>{chat.userName} · {chat.userEmail}</p>}
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className={`text-[9px] px-1.5 py-0.5 rounded-md border ${typeBadge(chat.chatType)}`}>
                                                            {(chat.chatType||'general').charAt(0).toUpperCase()+(chat.chatType||'general').slice(1)}
                                                        </span>
                                                        {isAdmin && (
                                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button onClick={e => archiveChat(e,chat)} title={chat.isArchived?'Unarchive':'Archive'} className="p-1 rounded">
                                                                    <FaArchive className={chat.isArchived?'text-emerald-400':'text-amber-500'} size={10}/>
                                                                </button>
                                                                {chat.isArchived && (
                                                                    <button onClick={e => deleteChat(e,chat._id)} title="Delete" className="p-1 rounded">
                                                                        <FaTrash className="text-red-400" size={10}/>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {chat.messages?.length > 0 && (
                                                        <p className="text-[10px] truncate mt-1" style={{ color: C.textSec }}>
                                                            {chat.messages[chat.messages.length-1]?.message}
                                                        </p>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>

                                /* ══ MESSAGE VIEW ══════════════════ */
                                ) : (
                                    <div className="flex flex-col flex-1 min-h-0" style={{ background: C.bg }}>
                                        {/* sub-header */}
                                        <div className="shrink-0 flex items-center gap-2 px-3 py-2.5"
                                            style={{ background: C.surface, borderBottom:`1px solid ${C.border}` }}>
                                            <button onClick={() => setSelectedChat(null)}
                                                className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors shrink-0"
                                                style={{ color: C.textSec }}
                                                onMouseEnter={e => e.currentTarget.style.color = C.amber}
                                                onMouseLeave={e => e.currentTarget.style.color = C.textSec}>
                                                <FaChevronLeft size={11}/>
                                            </button>
                                            <p className="text-[12px] font-semibold text-white flex-1 truncate">{selectedChat.chatTitle}</p>
                                            {isAdmin && (
                                                <div className="flex items-center gap-1">
                                                    <button onClick={toggleBlock}
                                                        className="text-[10px] px-2 py-0.5 rounded-md font-medium border transition-colors"
                                                        style={selectedChat.isBlocked
                                                            ? { background:'rgba(34,197,94,0.08)', color:'#4ade80', borderColor:'rgba(34,197,94,0.2)' }
                                                            : { background:'rgba(239,68,68,0.08)', color:'#f87171', borderColor:'rgba(239,68,68,0.2)' }}>
                                                        {selectedChat.isBlocked ? 'Unblock' : 'Block'}
                                                    </button>
                                                    <button onClick={deleteHistory}
                                                        className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
                                                        style={{ color: C.textSec }}
                                                        onMouseEnter={e => e.currentTarget.style.color='#f87171'}
                                                        onMouseLeave={e => e.currentTarget.style.color=C.textSec}>
                                                        <FaTrash size={10}/>
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Messages */}
                                        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
                                            {selectedChat.isBlocked && !isAdmin && (
                                                <div className="text-[11px] text-red-400 text-center py-2 rounded-lg"
                                                    style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)' }}>
                                                    You are blocked from sending messages
                                                </div>
                                            )}
                                            {selectedChat.messages.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center h-full gap-2 py-8">
                                                    <MdSupportAgent size={32} style={{ color:`${C.amber}25` }}/>
                                                    <p className="text-[12px]" style={{ color: C.textSec }}>No messages yet. Say hello!</p>
                                                </div>
                                            ) : selectedChat.messages.map((msg, i) => {
                                                const mine = msg.sender === (isAdmin?'admin':'user');
                                                return (
                                                    <div key={i} className={`flex items-end gap-2 ${mine?'flex-row-reverse':''}`}>
                                                        {!mine && (
                                                            <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs"
                                                                style={{ background: C.surface, border:`1px solid ${C.border}` }}>🔥</div>
                                                        )}
                                                        <div className="group relative max-w-[76%]">
                                                            <div className={`px-3 py-2 rounded-2xl text-[13px] ${mine ? 'rounded-br-sm text-black font-medium' : 'rounded-bl-sm text-stone-200'}`}
                                                                style={mine
                                                                    ? { background: amberGrad }
                                                                    : { background: C.surface, border:`1px solid ${C.border}` }}>
                                                                <p className="leading-relaxed">{msg.message}</p>
                                                                <p className="text-[9px] mt-1 opacity-55">
                                                                    {new Date(msg.timestamp).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                                                                </p>
                                                            </div>
                                                            {(isAdmin||msg.sender==='user') && (
                                                                <button onClick={() => deleteMsg(msg._id)}
                                                                    className="absolute -top-2 right-0 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow">
                                                                    <FaTrash size={7}/>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {isTyping && (
                                                <div className="flex items-end gap-2">
                                                    <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs"
                                                        style={{ background: C.surface, border:`1px solid ${C.border}` }}>🔥</div>
                                                    <div className="rounded-2xl rounded-bl-sm px-3 py-2.5"
                                                        style={{ background: C.surface, border:`1px solid ${C.border}` }}>
                                                        <TypingDots/>
                                                    </div>
                                                </div>
                                            )}
                                            <div ref={messagesEndRef}/>
                                        </div>

                                        {/* Input */}
                                        <div className="shrink-0 px-3 py-3"
                                            style={{ borderTop:`1px solid ${C.border}`, background: C.surface }}>
                                            <div className={`flex items-center gap-2 rounded-xl px-3 py-2 transition-opacity ${selectedChat.isBlocked&&!isAdmin?'opacity-50':''}`}
                                                style={{ background: C.bg, border:`1px solid ${selectedChat.isBlocked&&!isAdmin ? 'rgba(239,68,68,0.25)' : C.borderAm}` }}>
                                                <input
                                                    type="text" value={message}
                                                    onChange={e => { setMessage(e.target.value); emitTyping(); }}
                                                    onKeyPress={e => e.key==='Enter' && sendMsg()}
                                                    placeholder={selectedChat.isBlocked&&!isAdmin ? 'Messaging disabled' : 'Type a message…'}
                                                    disabled={selectedChat.isBlocked&&!isAdmin}
                                                    className="flex-1 bg-transparent text-[13px] text-white outline-none py-0.5 placeholder-stone-500 disabled:cursor-not-allowed"
                                                    style={{ caretColor: C.amber }}
                                                />
                                                <button onClick={sendMsg} disabled={(selectedChat.isBlocked&&!isAdmin)||!message.trim()}
                                                    className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-black transition-opacity disabled:opacity-30"
                                                    style={{ background: amberGrad }}>
                                                    <FaPaperPlane size={10}/>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {/* ── Resize handles ────────────────────────── */}
                        {!isFullscreen && !isMinimized && (
                            <>
                                {/* Top edge — grow upward */}
                                <div onMouseDown={e => startResize('top', e)}
                                    className="absolute top-0 left-6 right-6 h-1.5 cursor-ns-resize" style={{ zIndex:10 }}/>
                                {/* Top corners */}
                                <div onMouseDown={e => startResize('xtop', e)}
                                    className={`absolute top-0 ${isRightDock?'left-0':'right-0'} w-4 h-4 cursor-nesw-resize`} style={{ zIndex:10 }}/>
                                {/* Side */}
                                <div onMouseDown={e => startResize('x', e)}
                                    className={`absolute top-14 bottom-0 ${isRightDock?'left-0':'right-0'} w-1.5 cursor-ew-resize`}/>
                                {/* Bottom */}
                                <div onMouseDown={e => startResize('y', e)}
                                    className="absolute left-0 right-0 bottom-0 h-1.5 cursor-ns-resize"/>
                                {/* Bottom corner */}
                                <div onMouseDown={e => startResize('xy', e)}
                                    className={`absolute bottom-0 ${isRightDock?'left-0':'right-0'} w-4 h-4 ${isRightDock?'cursor-nesw-resize':'cursor-nwse-resize'}`}>
                                    <div className="absolute bottom-1 right-1 w-2 h-2 border-b border-r"
                                        style={{ borderColor:`${C.amber}50` }}/>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    return ReactDOM.createPortal(<ErrorBoundary>{content}</ErrorBoundary>, portalRoot);
};

export default ChatWidget;
