import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaTimes, FaPaperPlane, FaTrash, FaChevronLeft,
    FaHeadset, FaArchive, FaExpand, FaCompress, FaMinus, FaImage,
} from 'react-icons/fa';
import { MdSupportAgent } from 'react-icons/md';
import { RiRobot2Fill, RiSparklingFill } from 'react-icons/ri';
import ErrorBoundary from './ErrorBoundary';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';

const MIN_WIDGET_WIDTH = 340;
const MIN_WIDGET_HEIGHT = 480;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/* ─── Size presets ─────────────────────────────────────────── */
const SIZES = {
    normal: { width: 380, height: 560 },
    large:  { width: 520, height: 700 },
    full:   { width: 760, height: 860 },
};

/* ─── Heat strings rising from the burger launcher ──────────── */
const HeatStrings = () => {
    const waves = [
        { x: 18, path: 'M 18,60 C 14,45 22,32 16,18 S 20,6 18,0',   dur: 1.8, delay: 0,    color: '#f97316', w: 1.6 },
        { x: 30, path: 'M 30,60 C 26,42 34,28 28,14 S 32,4  30,0',   dur: 2.1, delay: 0.35, color: '#fbbf24', w: 1.2 },
        { x: 42, path: 'M 42,60 C 38,44 46,30 40,16 S 44,5  42,0',   dur: 1.6, delay: 0.15, color: '#f97316', w: 2.0 },
        { x: 54, path: 'M 54,60 C 50,43 58,29 52,15 S 56,4  54,0',   dur: 2.3, delay: 0.5,  color: '#fb923c', w: 1.1 },
        { x: 66, path: 'M 66,60 C 62,46 70,33 64,19 S 68,7  66,0',   dur: 1.9, delay: 0.25, color: '#fbbf24', w: 1.4 },
    ];
    return (
        <svg
            aria-hidden
            className="absolute pointer-events-none"
            style={{ bottom: '85%', left: '50%', transform: 'translateX(-50%)', width: 84, height: 64, overflow: 'visible' }}
            viewBox="0 0 84 64"
        >
            {waves.map((s, i) => (
                <motion.path
                    key={i}
                    d={s.path}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={s.w}
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0, y: 0 }}
                    animate={{
                        pathLength: [0, 0.8, 1, 0.8, 0],
                        opacity:    [0, 0.9, 0.7, 0.5, 0],
                        y:          [4, 0, -4, -8, -14],
                    }}
                    transition={{
                        duration: s.dur,
                        repeat: Infinity,
                        delay: s.delay,
                        ease: 'easeOut',
                    }}
                />
            ))}
        </svg>
    );
};

/* ─── Ember sparkles in AI panel background ─────────────────── */
const Sparkles = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden>
        {[...Array(14)].map((_, i) => {
            const colors = ['#feb705','#f74407','#fb923c','#fbbf24','#810431'];
            return (
                <motion.div key={i}
                    className="absolute rounded-full"
                    style={{
                        width: 2+(i%3), height: 2+(i%3),
                        top:`${6+(i*17)%88}%`, left:`${4+(i*23)%92}%`,
                        background: colors[i % colors.length],
                        boxShadow: `0 0 4px ${colors[i % colors.length]}88`,
                    }}
                    animate={{ opacity:[0.15,0.75,0.15], scale:[1,1.8,1] }}
                    transition={{ duration: 2+(i%3), repeat:Infinity, delay: i*0.18 }}
                />
            );
        })}
    </div>
);

/* ─── Fiery AI avatar orb ────────────────────────────────────── */
const AiOrb = ({ size = 28 }) => (
    <div className="relative shrink-0 flex items-center justify-center" style={{ width: size, height: size }}>
        <motion.div className="absolute rounded-full"
            style={{ inset:-7, background:'radial-gradient(circle, rgba(247,68,7,0.55) 0%, rgba(254,183,5,0.2) 60%, transparent 80%)', filter:'blur(7px)' }}
            animate={{ scale:[1,1.5,1], opacity:[0.55,1,0.55] }}
            transition={{ duration:2, repeat:Infinity }}
        />
        <div className="relative w-full h-full rounded-full flex items-center justify-center shadow-[0_0_18px_rgba(247,68,7,0.6)]"
            style={{ background:'linear-gradient(135deg, #feb705 0%, #f74407 60%, #810431 100%)' }}>
            <RiRobot2Fill size={size * 0.52} className="text-white drop-shadow" />
        </div>
    </div>
);

/* ─── Chat type badge colour map ────────────────────────────── */
const typeBadge = (type) => ({
    order:      'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    complaint:  'bg-red-600/15    text-red-400    border-red-500/30',
    suggestion: 'bg-amber-500/15  text-amber-400  border-amber-500/30',
})[type] || 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30';

const QUICK_AI_PROMPTS = [
    'Show today\'s best deals',
    'Recommend 2 spicy items',
    'I want to place an order',
];

const BrandTextMark = ({ size = 28, rounded = 'rounded-full' }) => (
    <div
        className={`${rounded} flex items-center justify-center text-white font-semibold ring-1 ring-amber-300/30 shadow-[0_6px_14px_rgba(0,0,0,0.35)] px-3`}
        style={{
            minWidth: size,
            height: size,
            background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 50%, #7c2d12 100%)',
            fontFamily: 'Playfair Display, serif',
            letterSpacing: '0.04em',
        }}
    >
        Sizzora
    </div>
);

const BrandDot = ({ size = 22 }) => (
    <div
        className="rounded-full ring-1 ring-amber-300/30 shadow-[0_4px_10px_rgba(0,0,0,0.3)]"
        style={{
            width: size,
            height: size,
            background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 55%, #7c2d12 100%)',
        }}
    />
);

/* ═══════════════════════════════════════════════════════════════
   Main component
═══════════════════════════════════════════════════════════════ */
const ChatWidget = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    const [isOpen,       setIsOpen]       = useState(false);
    const [isMinimized,  setIsMinimized]  = useState(false);
    const [sizeKey,      setSizeKey]      = useState('normal');
    const [customSize,   setCustomSize]   = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isResizing,   setIsResizing]   = useState(false);
    const [dockSide,     setDockSide]     = useState('right');
    const [chats,        setChats]        = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [message,      setMessage]      = useState('');
    const [unreadCount,  setUnreadCount]  = useState(0);
    const [showBtn,      setShowBtn]      = useState(false);
    const [activeTab,    setActiveTab]    = useState('active');
    const [aiMessages,   setAiMessages]   = useState([{
        sender: 'ai',
        content: "Hey! I'm Sizzora AI. Ask me anything about our menu, deals, or your order 🔥",
        createdAt: new Date(),
    }]);
    const [isAiTyping,   setIsAiTyping]   = useState(false);
    const [isTyping,     setIsTyping]     = useState(false);
    const [aiImage,      setAiImage]      = useState(null); // { preview, url } after upload

    const messagesEndRef  = useRef(null);
    const typingTimeout   = useRef(null);
    const socketRef       = useRef(null);
    const resizeStateRef  = useRef(null);
    const imageInputRef   = useRef(null);
    const [portalRoot,    setPortalRoot]  = useState(null);

    const size = SIZES[sizeKey];
    const cycleSize = () => {
        setCustomSize(null);
        setSizeKey(k => k === 'normal' ? 'large' : k === 'large' ? 'full' : 'normal');
    };

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

    /* handlers */
    const getSessionId = () => {
        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        if (user?._id) return `${user._id}-${today}`;
        const key = 'sizzora_ai_session';
        const stored = localStorage.getItem(key);
        if (stored) {
            const [id, date] = stored.split('|');
            if (date === today) return id;
        }
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
            const r = await axios.post('/api/orders/chatbot-upload', form, {
                headers: { 'x-chatbot-secret': 'sizzora-chatbot-secret-2026' },
            });
            setAiImage({ preview, url: r.data.imageUrl, uploading: false });
        } catch {
            setAiImage({ preview, url: null, uploading: false, error: true });
        }
    };

    const sendAiMsg = async () => {
        if (!message.trim() && !aiImage) return;
        const txt = message; setMessage('');
        const imgSnapshot = aiImage; setAiImage(null);
        if (imageInputRef.current) imageInputRef.current.value = '';

        const userContent = txt + (imgSnapshot?.url ? `\n[Image attached]` : '');
        const msgs = [...aiMessages, { sender: isAdmin?'admin':'user', content: userContent, imagePreview: imgSnapshot?.preview, createdAt:new Date() }];
        setAiMessages(msgs); setIsAiTyping(true);
        try {
            const payload = {
                message: txt || (imgSnapshot ? 'I uploaded an image.' : ''),
                sessionId: user?.id || user?._id || getSessionId(),
                userId: user?.id || user?._id || '',
                userName: user?.name || 'Customer',
                userPhone: user?.phone || '',
                userAddress: user?.address || '',
                imageUrl: imgSnapshot?.url || '',
            };

            const r = await axios.post('/api/chat/ai', payload);
            const reply = r.data?.reply || r.data?.message || r.data?.output || r.data?.text || (typeof r.data === 'string' ? r.data : null);
            setAiMessages([...msgs, { sender:'ai', content: reply || 'Got it!', createdAt:new Date() }]);
        } catch (error) {
            const fallback = error?.response?.data?.message || error?.response?.data?.error || "Sorry, I'm having trouble right now. Try again in a moment!";
            setAiMessages([...msgs, { sender:'ai', content: fallback, createdAt:new Date() }]);
        } finally { setIsAiTyping(false); }
    };

    const sendMsg = async () => {
        if (!message.trim() || !selectedChat) return;
        if (selectedChat.isBlocked && !isAdmin) { alert('You are blocked'); return; }
        socketRef.current?.emit('stop_typing', { room:selectedChat._id });
        clearTimeout(typingTimeout.current);
        try {
            const r = await axios.post(`/api/chat/${selectedChat._id}/message`, { sender:isAdmin?'admin':'user', message:message.trim() });
            setSelectedChat(r.data); setMessage('');
            const fresh = isAdmin ? (await axios.get('/api/chat/all')).data : (await axios.get(`/api/chat/user/${user.id}`)).data;
            setChats(fresh);
        } catch (e) { alert(e.response?.data?.error||'Failed'); }
    };

    const deleteMsg = async id => {
        try { const r = await axios.delete(`/api/chat/${selectedChat._id}/message/${id}?sender=${isAdmin?'admin':'user'}`); setSelectedChat(r.data); } catch(e){ alert(e.response?.data?.error||'Failed'); }
    };
    const deleteHistory = async () => {
        if (!isAdmin||!selectedChat||!confirm('Delete entire chat history?')) return;
        try { await axios.delete(`/api/chat/${selectedChat._id}/history`); setChats((await axios.get('/api/chat/all')).data); setSelectedChat(null); } catch { alert('Failed'); }
    };
    const archiveChat = async (e,chat) => {
        e.stopPropagation();
        try { await axios.put(`/api/chat/${chat._id}/archive`,{isArchived:!chat.isArchived}); setChats(p=>p.map(c=>c._id===chat._id?{...c,isArchived:!chat.isArchived}:c)); } catch { alert('Failed'); }
    };
    const deleteChat = async (e,id) => {
        e.stopPropagation();
        if (!confirm('Delete permanently?')) return;
        setChats(p=>p.filter(c=>c._id!==id)); if (selectedChat?._id===id) setSelectedChat(null);
        try { await axios.delete(`/api/chat/${id}`); setChats((await axios.get('/api/chat/all')).data); }
        catch(e){ if(e.response?.status!==404){ alert('Failed'); setChats((await axios.get('/api/chat/all')).data); } }
    };
    const toggleBlock = async () => {
        try { const r = await axios.put(`/api/chat/${selectedChat._id}/block`,{isBlocked:!selectedChat.isBlocked}); setSelectedChat(r.data.chat); setChats((await axios.get('/api/chat/all')).data); } catch { alert('Failed'); }
    };
    const selectChat = async chat => {
        setSelectedChat(chat);
        try {
            await axios.put(`/api/chat/${chat._id}/read`,{reader:isAdmin?'admin':'user'});
            if (isAdmin) { setChats((await axios.get('/api/chat/all')).data); setUnreadCount((await axios.get('/api/chat/unread/admin')).data.count); }
            else { const d=(await axios.get(`/api/chat/user/${user.id}`)).data; setChats(d); setUnreadCount(d.reduce((s,c)=>s+c.unreadUserCount,0)); }
        } catch(e){ console.error(e); }
    };

    const baseOffset = 20;
    const isRightDock = dockSide === 'right';
    const resolvedSize = customSize || size;

    useEffect(() => {
        if (!isResizing) return;

        const onMove = (e) => {
            const state = resizeStateRef.current;
            if (!state) return;

            const maxWidth = Math.max(MIN_WIDGET_WIDTH, window.innerWidth - 30);
            const maxHeight = Math.max(MIN_WIDGET_HEIGHT, window.innerHeight - 80);

            let nextWidth = state.width;
            let nextHeight = state.height;

            const xDelta = e.clientX - state.startX;
            const yDelta = e.clientY - state.startY;

            if (state.axis.includes('x')) {
                if (state.dockSide === 'right') {
                    nextWidth = state.width - xDelta;
                } else {
                    nextWidth = state.width + xDelta;
                }
            }

            if (state.axis.includes('y')) {
                nextHeight = state.height + yDelta;
            }

            setCustomSize({
                width: clamp(nextWidth, MIN_WIDGET_WIDTH, maxWidth),
                height: clamp(nextHeight, MIN_WIDGET_HEIGHT, maxHeight),
            });
        };

        const onUp = () => {
            resizeStateRef.current = null;
            setIsResizing(false);
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);

        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
    }, [isResizing]);

    if (!user || !portalRoot) return null;

    const visibleChats = chats.filter(c => isAdmin ? (activeTab==='active' ? !c.isArchived : c.isArchived) : true);

    const startResize = (axis, e) => {
        e.preventDefault();
        if (isFullscreen || isMinimized) return;
        resizeStateRef.current = {
            axis,
            startX: e.clientX,
            startY: e.clientY,
            width: resolvedSize.width,
            height: resolvedSize.height,
            dockSide,
        };
        setIsResizing(true);
    };

    const windowStyle = isFullscreen
        ? {
            pointerEvents: 'auto',
            position: 'fixed',
            top: 18,
            bottom: 18,
            left: 18,
            right: 18,
            width: 'auto',
            height: isMinimized ? 56 : 'auto',
            transition: 'all 0.28s cubic-bezier(.4,0,.2,1)',
            background: '#111118',
        }
        : {
            pointerEvents: 'auto',
            position: 'fixed',
            bottom: baseOffset,
            right: isRightDock ? baseOffset : 'auto',
            left: isRightDock ? 'auto' : baseOffset,
            width: `min(calc(100vw - 24px), ${resolvedSize.width}px)`,
            height: isMinimized ? 56 : `min(calc(100vh - 120px), ${resolvedSize.height}px)`,
            transition: isResizing ? 'none' : 'all 0.28s cubic-bezier(.4,0,.2,1)',
            background: '#111118',
        };

    /* ── Typing dots ── */
    const TypingDots = ({ color = 'bg-stone-400' }) => (
        <div className="flex gap-1 px-1 py-0.5">
            {[0,150,300].map(d => <div key={d} className={`w-1.5 h-1.5 ${color} rounded-full animate-bounce`} style={{animationDelay:`${d}ms`}} />)}
        </div>
    );

    const content = (
        <div style={{pointerEvents:'none', position:'fixed', inset:0}}>

            {/* ── Launcher ─────────────────────────────────────── */}
            <AnimatePresence>
                {!isOpen && showBtn && (
                    <motion.div
                        key="launcher"
                        initial={{scale:0,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0,opacity:0}}
                        className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6"
                        style={{ pointerEvents:'auto', width:72, height:72 }}
                    >
                        <HeatStrings />
                        <motion.div
                            aria-hidden
                            className="absolute inset-0 rounded-2xl"
                            style={{ background: 'radial-gradient(circle, rgba(247,68,7,0.45) 0%, rgba(247,68,7,0) 65%)' }}
                            animate={{ scale: [1, 1.35, 1], opacity: [0.75, 0.2, 0.75] }}
                            transition={{ duration: 2.2, repeat: Infinity }}
                        />
                        <motion.button
                            whileHover={{scale:1.08, rotate:-2}} whileTap={{scale:0.93}}
                            onClick={() => setIsOpen(true)}
                            className="group w-full h-full rounded-2xl shadow-2xl overflow-hidden ring-2 ring-amber-500/70 hover:ring-amber-300 transition-all relative border border-white/30"
                        >
                            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(254,183,5,0.2),rgba(247,68,7,0.35),rgba(129,4,49,0.45))]" />
                            <div className="absolute inset-[5px] rounded-xl bg-black/30 backdrop-blur-sm flex items-center justify-center">
                                <BrandTextMark size={46} rounded="rounded-xl" />
                            </div>
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 shadow border border-stone-900">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </motion.button>
                        <motion.p
                            className="absolute left-1/2 top-[calc(100%+10px)] -translate-x-1/2 text-[11px] font-semibold px-2.5 py-1 rounded-full text-amber-100 bg-black/55 border border-amber-500/35 whitespace-nowrap"
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            Ask Sizzora
                        </motion.p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Main window ──────────────────────────────────── */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="win"
                        initial={{opacity:0,scale:0.88,y:24}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.88,y:24}}
                        transition={{type:'spring',stiffness:380,damping:28}}
                        style={windowStyle}
                        className="flex flex-col rounded-2xl shadow-[0_12px_60px_rgba(0,0,0,0.8)] border border-[#feb705]/20 overflow-hidden"
                    >
                        {/* ── Header — gold accent top border ── */}
                        <div className="shrink-0 relative flex items-center gap-2.5 px-3 py-2 border-b border-[#feb705]/15"
                            style={{ background:'linear-gradient(135deg,#18120a 0%,#1a1118 100%)' }}>
                            {/* gold accent line at very top */}
                            <div className="absolute top-0 left-0 right-0 h-[2px]"
                                style={{ background:'linear-gradient(90deg, transparent, #feb705, #f74407, transparent)' }} />
                            <div className="shrink-0">
                                <BrandTextMark size={36} rounded="rounded-xl" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-bold text-sm leading-tight truncate">
                                    {selectedChat ? selectedChat.chatTitle : isAdmin ? 'Support Inbox' : 'Sizzora Support'}
                                </p>
                                <p className="text-[11px] leading-tight" style={{ color:'#feb70599' }}>
                                    {selectedChat
                                        ? (selectedChat.isBlocked ? '🔴 Blocked' : '🟢 Active')
                                        : activeTab === 'ai' ? '🔥 AI powered' : "We're here to help"}
                                </p>
                            </div>
                            <div className="flex items-center gap-0.5 shrink-0">
                                {!isMinimized && (
                                    <button
                                        onClick={() => setDockSide((s) => (s === 'right' ? 'left' : 'right'))}
                                        title={isRightDock ? 'Dock left' : 'Dock right'}
                                        className="w-7 h-7 hidden sm:flex items-center justify-center rounded-lg text-stone-600 hover:text-[#feb705] hover:bg-white/5 transition-all text-[10px] font-bold"
                                    >
                                        {isRightDock ? 'L' : 'R'}
                                    </button>
                                )}
                                {!isMinimized && (
                                    <button onClick={cycleSize} title={sizeKey==='full'?'Shrink':'Expand'}
                                        className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-600 hover:text-[#feb705] hover:bg-white/5 transition-all">
                                        {sizeKey==='full' ? <FaCompress size={11}/> : <FaExpand size={11}/>}
                                    </button>
                                )}
                                {!isMinimized && (
                                    <button
                                        onClick={() => setIsFullscreen((prev) => !prev)}
                                        title={isFullscreen ? 'Exit full screen' : 'Full screen'}
                                        className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-600 hover:text-[#feb705] hover:bg-white/5 transition-all"
                                    >
                                        {isFullscreen ? <FaCompress size={11} /> : <FaExpand size={11} />}
                                    </button>
                                )}
                                <button onClick={() => setIsMinimized(m=>!m)}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-600 hover:text-[#feb705] hover:bg-white/5 transition-all">
                                    <FaMinus size={11}/>
                                </button>
                                <button onClick={() => {setIsOpen(false);setSelectedChat(null);setIsMinimized(false);setIsFullscreen(false);}}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-600 hover:text-[#f74407] hover:bg-white/5 transition-all">
                                    <FaTimes size={13}/>
                                </button>
                            </div>
                        </div>

                        {/* ── Body ── */}
                        {!isMinimized && (
                            <>
                                {/* Tabs */}
                                {!selectedChat && (
                                    <div className="shrink-0 flex gap-1 p-1.5 border-b border-white/5"
                                        style={{ background:'#0e0d11' }}>
                                        <button onClick={() => setActiveTab('active')}
                                            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeTab==='active' ? 'text-stone-900' : 'text-stone-500 hover:text-white hover:bg-white/5'}`}
                                            style={activeTab==='active' ? { background:'linear-gradient(135deg,#feb705,#f74407)' } : {}}>
                                            <FaHeadset size={11}/> {isAdmin ? 'Active' : 'Support'}
                                        </button>
                                        {isAdmin && (
                                            <button onClick={() => setActiveTab('archived')}
                                                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeTab==='archived' ? 'text-stone-900' : 'text-stone-500 hover:text-white hover:bg-white/5'}`}
                                                style={activeTab==='archived' ? { background:'linear-gradient(135deg,#feb705,#f74407)' } : {}}>
                                                <FaArchive size={10}/> Archived
                                            </button>
                                        )}
                                        <button onClick={() => setActiveTab('ai')}
                                            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeTab==='ai' ? 'text-white' : 'text-stone-500 hover:text-white hover:bg-white/5'}`}
                                            style={activeTab==='ai' ? { background:'linear-gradient(135deg,#810431,#f74407)' } : {}}>
                                            <RiSparklingFill size={13}/> AI Chat
                                        </button>
                                    </div>
                                )}

                                {/* ══ AI CHAT ══ */}
                                {!selectedChat && activeTab==='ai' ? (
                                    <div className="flex flex-col flex-1 min-h-0 relative">
                                        {/* warm ember background */}
                                        <div className="absolute inset-0 pointer-events-none"
                                            style={{ background:'linear-gradient(180deg,#150800 0%,#110a0a 50%,#111118 100%)' }} />
                                        <Sparkles />

                                        {/* AI hero banner */}
                                        <div className="relative shrink-0 flex items-center gap-3 px-4 py-4 border-b"
                                            style={{ borderColor:'rgba(247,68,7,0.2)' }}>
                                            <AiOrb size={44} />
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <p className="text-white font-bold text-sm tracking-wide">Sizzora AI</p>
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold border"
                                                        style={{ background:'rgba(247,68,7,0.15)', borderColor:'rgba(247,68,7,0.35)', color:'#fb923c' }}>
                                                        BETA
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <motion.div className="w-1.5 h-1.5 bg-green-400 rounded-full"
                                                        animate={{ opacity:[1,0.3,1] }} transition={{ duration:1.6, repeat:Infinity }} />
                                                    <p className="text-green-400/90 text-[11px]">Online · Instant replies</p>
                                                </div>
                                            </div>
                                            <motion.div className="ml-auto"
                                                animate={{ rotate:[0,15,-15,0], scale:[1,1.15,1] }}
                                                transition={{ duration:3, repeat:Infinity, ease:'easeInOut' }}>
                                                <RiSparklingFill size={20} style={{ color:'#feb70580' }}/>
                                            </motion.div>
                                        </div>

                                        {/* messages */}
                                        <div className="relative flex-1 overflow-y-auto p-3 space-y-3">
                                            {aiMessages.map((msg, i) => {
                                                const mine = msg.sender !== 'ai';
                                                return (
                                                    <motion.div key={i} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:0.2}}
                                                        className={`flex items-end gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
                                                        {!mine && <AiOrb size={28} />}
                                                        <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm shadow-md ${mine ? 'rounded-br-sm font-medium text-stone-900' : 'rounded-bl-sm text-stone-100'}`}
                                                            style={mine
                                                                ? { background:'linear-gradient(135deg,#feb705,#f74407)' }
                                                                : { background:'#1e1208', border:'1px solid rgba(247,68,7,0.2)' }}>
                                                            {msg.imagePreview && (
                                                                <img src={msg.imagePreview} alt="attachment" className="mb-1.5 rounded-lg max-h-32 object-cover w-full"/>
                                                            )}
                                                            <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                                            <p className={`text-[10px] mt-1 ${mine?'text-stone-700':'text-stone-500'}`}>
                                                                {new Date(msg.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                                                            </p>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                            {isAiTyping && (
                                                <motion.div initial={{opacity:0}} animate={{opacity:1}} className="flex items-end gap-2">
                                                    <AiOrb size={28}/>
                                                    <div className="rounded-2xl rounded-bl-sm px-3 py-2.5"
                                                        style={{ background:'#1e1208', border:'1px solid rgba(247,68,7,0.2)' }}>
                                                        <TypingDots color="bg-orange-400"/>
                                                    </div>
                                                </motion.div>
                                            )}
                                            <div ref={messagesEndRef}/>
                                        </div>

                                        {/* AI input */}
                                        <div className="relative shrink-0 p-3 border-t" style={{ borderColor:'rgba(247,68,7,0.15)', background:'rgba(21,8,0,0.6)' }}>
                                            <div className="flex flex-wrap gap-1.5 mb-2">
                                                {QUICK_AI_PROMPTS.map((prompt) => (
                                                    <button
                                                        key={prompt}
                                                        onClick={() => setMessage(prompt)}
                                                        className="text-[10px] px-2 py-1 rounded-full border border-amber-500/30 text-amber-200 hover:text-white hover:border-amber-300 hover:bg-amber-500/15 transition-colors"
                                                    >
                                                        {prompt}
                                                    </button>
                                                ))}
                                            </div>
                                            {/* Image preview */}
                                            {aiImage && (
                                                <div className="relative inline-block mb-2">
                                                    <img src={aiImage.preview} alt="upload preview" className="h-16 w-16 rounded-lg object-cover border border-amber-500/40"/>
                                                    {aiImage.uploading && (
                                                        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 text-[9px] text-white">Uploading…</div>
                                                    )}
                                                    {aiImage.error && (
                                                        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-red-900/70 text-[9px] text-white">Failed</div>
                                                    )}
                                                    <button onClick={() => { setAiImage(null); if (imageInputRef.current) imageInputRef.current.value = ''; }}
                                                        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[9px]">✕</button>
                                                </div>
                                            )}
                                            <div className="flex gap-2 items-center rounded-xl border px-3 py-1 transition-colors"
                                                style={{ background:'#1e1208', borderColor:'rgba(247,68,7,0.25)' }}>
                                                <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden"/>
                                                <button onClick={() => imageInputRef.current?.click()}
                                                    className="text-amber-400 hover:text-amber-200 transition-colors shrink-0"
                                                    title="Attach image">
                                                    <FaImage size={15}/>
                                                </button>
                                                <input
                                                    type="text" value={message} onChange={e=>setMessage(e.target.value)}
                                                    onKeyPress={e=>e.key==='Enter'&&sendAiMsg()}
                                                    placeholder="Ask Sizzora AI anything…"
                                                    className="flex-1 bg-transparent text-white text-sm py-2 outline-none"
                                                    style={{ caretColor:'#feb705' }}
                                                />
                                                <button onClick={sendAiMsg} disabled={!message.trim() && !aiImage}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-900 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow shrink-0"
                                                    style={{ background:'linear-gradient(135deg,#feb705,#f74407)' }}>
                                                    <FaPaperPlane size={12}/>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                /* ══ CHAT LIST ══ */
                                ) : !selectedChat ? (
                                    <div className="flex-1 overflow-y-auto p-2 space-y-1.5" style={{ background:'#111118' }}>
                                        {visibleChats.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-12">
                                                <div className="w-14 h-14 rounded-2xl overflow-hidden ring-1 ring-stone-700 opacity-50 bg-black/25 flex items-center justify-center">
                                                    <BrandTextMark size={40} rounded="rounded-xl" />
                                                </div>
                                                <p className="text-stone-500 text-sm">{isAdmin ? `No ${activeTab} chats.` : 'No chats available.'}</p>
                                            </div>
                                        ) : visibleChats.map(chat => (
                                            <motion.div key={chat._id} onClick={() => selectChat(chat)}
                                                className="group flex items-start gap-2.5 p-3 rounded-xl cursor-pointer transition-all border"
                                                style={{ background:'#1a1520', borderColor:'rgba(255,255,255,0.05)' }}
                                                whileHover={{ x: 3, borderColor:'rgba(254,183,5,0.3)', background:'#1f1825' }}>
                                                <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 ring-1 ring-[#feb705]/30 bg-black/25 flex items-center justify-center">
                                                    <BrandDot size={22} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-1 mb-0.5">
                                                        <p className="text-white font-semibold text-sm truncate">{chat.chatTitle}</p>
                                                        {((isAdmin&&chat.unreadAdminCount>0)||(!isAdmin&&chat.unreadUserCount>0)) && (
                                                            <span className="text-stone-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                                                                style={{ background:'linear-gradient(135deg,#feb705,#f74407)' }}>
                                                                {isAdmin ? chat.unreadAdminCount : chat.unreadUserCount}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {isAdmin && <p className="text-stone-500 text-xs truncate mb-1">{chat.userName} · {chat.userEmail}</p>}
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${typeBadge(chat.chatType)}`}>
                                                            {(chat.chatType||'general').charAt(0).toUpperCase()+(chat.chatType||'general').slice(1)}
                                                        </span>
                                                        {isAdmin && (
                                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button onClick={e=>archiveChat(e,chat)} title={chat.isArchived?'Unarchive':'Archive'} className="p-1 rounded hover:bg-white/5">
                                                                    <FaArchive className={chat.isArchived?'text-green-400':'text-yellow-500'} size={11}/>
                                                                </button>
                                                                {chat.isArchived && (
                                                                    <button onClick={e=>deleteChat(e,chat._id)} title="Delete" className="p-1 rounded hover:bg-white/5">
                                                                        <FaTrash className="text-red-400" size={11}/>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {chat.messages?.length > 0 && (
                                                        <p className="text-stone-500 text-xs truncate mt-1">{chat.messages[chat.messages.length-1]?.message}</p>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>

                                /* ══ MESSAGE VIEW ══ */
                                ) : (
                                    <div className="flex flex-col flex-1 min-h-0" style={{ background:'#111118' }}>
                                        {/* sub-header */}
                                        <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-b"
                                            style={{ background:'#0e0d11', borderColor:'rgba(255,255,255,0.06)' }}>
                                            <button onClick={()=>setSelectedChat(null)}
                                                className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-500 hover:bg-white/5 transition-all"
                                                onMouseEnter={e=>(e.currentTarget.style.color='#feb705')}
                                                onMouseLeave={e=>(e.currentTarget.style.color='')}>
                                                <FaChevronLeft size={12}/>
                                            </button>
                                            <p className="text-white text-sm font-semibold flex-1 truncate">{selectedChat.chatTitle}</p>
                                            {isAdmin && (
                                                <div className="flex items-center gap-1">
                                                    <button onClick={toggleBlock}
                                                        className={`text-[10px] px-2 py-0.5 rounded-lg font-semibold border ${selectedChat.isBlocked ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                                                        {selectedChat.isBlocked ? 'Unblock' : 'Block'}
                                                    </button>
                                                    <button onClick={deleteHistory}
                                                        className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-600 hover:text-red-400 hover:bg-white/5 transition-all">
                                                        <FaTrash size={11}/>
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* messages */}
                                        <div className="flex-1 overflow-y-auto p-3 space-y-3">
                                            {selectedChat.isBlocked && !isAdmin && (
                                                <div className="bg-red-900/20 border border-red-500/30 text-red-400 p-2 rounded-lg text-xs text-center">
                                                    You are blocked from sending messages
                                                </div>
                                            )}
                                            {selectedChat.messages.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center h-full gap-2 text-center py-8">
                                                    <MdSupportAgent size={36} style={{ color:'#feb70530' }}/>
                                                    <p className="text-stone-600 text-sm">No messages yet. Say hello!</p>
                                                </div>
                                            ) : selectedChat.messages.map((msg, i) => {
                                                const mine = msg.sender === (isAdmin?'admin':'user');
                                                return (
                                                    <div key={i} className={`flex items-end gap-2 ${mine?'flex-row-reverse':''}`}>
                                                        {!mine && (
                                                            <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 ring-1 ring-white/10 bg-black/20 flex items-center justify-center">
                                                                <BrandDot size={14} />
                                                            </div>
                                                        )}
                                                        <div className="group relative max-w-[75%]">
                                                            <div className={`px-3 py-2 rounded-2xl text-sm shadow ${mine ? 'rounded-br-sm font-medium text-stone-900' : 'rounded-bl-sm text-stone-100'}`}
                                                                style={mine
                                                                    ? { background:'linear-gradient(135deg,#feb705,#f74407)' }
                                                                    : { background:'#1a1520', border:'1px solid rgba(255,255,255,0.07)' }}>
                                                                <p className="leading-relaxed">{msg.message}</p>
                                                                <p className={`text-[10px] mt-1 ${mine?'text-stone-700':'text-stone-500'}`}>
                                                                    {new Date(msg.timestamp).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                                                                </p>
                                                            </div>
                                                            {(isAdmin||msg.sender==='user') && (
                                                                <button onClick={()=>deleteMsg(msg._id)}
                                                                    className="absolute -top-2 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow">
                                                                    <FaTrash size={8}/>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {isTyping && (
                                                <div className="flex items-end gap-2">
                                                    <div className="w-7 h-7 rounded-full overflow-hidden ring-1 ring-white/10 bg-black/20 flex items-center justify-center">
                                                        <BrandDot size={14} />
                                                    </div>
                                                    <div className="rounded-2xl rounded-bl-sm px-3 py-2.5"
                                                        style={{ background:'#1a1520', border:'1px solid rgba(255,255,255,0.07)' }}>
                                                        <TypingDots color="bg-amber-400"/>
                                                    </div>
                                                </div>
                                            )}
                                            <div ref={messagesEndRef}/>
                                        </div>

                                        {/* input */}
                                        <div className="shrink-0 p-3 border-t" style={{ background:'#0e0d11', borderColor:'rgba(255,255,255,0.06)' }}>
                                            <div className={`flex gap-2 items-center rounded-xl border px-3 py-1 transition-colors ${selectedChat.isBlocked&&!isAdmin ? 'opacity-60' : ''}`}
                                                style={{ background:'#1a1520', borderColor: selectedChat.isBlocked&&!isAdmin ? 'rgba(239,68,68,0.3)' : 'rgba(254,183,5,0.2)' }}>
                                                <input
                                                    type="text" value={message}
                                                    onChange={e=>{setMessage(e.target.value);emitTyping();}}
                                                    onKeyPress={e=>e.key==='Enter'&&sendMsg()}
                                                    placeholder={selectedChat.isBlocked&&!isAdmin ? 'Messaging disabled' : 'Type a message…'}
                                                    disabled={selectedChat.isBlocked&&!isAdmin}
                                                    className="flex-1 bg-transparent text-white text-sm py-2 outline-none placeholder-stone-600 disabled:cursor-not-allowed"
                                                    style={{ caretColor:'#feb705' }}
                                                />
                                                <button onClick={sendMsg} disabled={(selectedChat.isBlocked&&!isAdmin)||!message.trim()}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-900 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow shrink-0"
                                                    style={{ background:'linear-gradient(135deg,#feb705,#f74407)' }}>
                                                    <FaPaperPlane size={12}/>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {!isFullscreen && !isMinimized && (
                            <>
                                <div
                                    onMouseDown={(e) => startResize('x', e)}
                                    className={`absolute top-[56px] bottom-0 ${isRightDock ? 'left-0 cursor-ew-resize' : 'right-0 cursor-ew-resize'} w-2 bg-transparent`}
                                />
                                <div
                                    onMouseDown={(e) => startResize('y', e)}
                                    className="absolute left-0 right-0 bottom-0 h-2 cursor-ns-resize bg-transparent"
                                />
                                <div
                                    onMouseDown={(e) => startResize('xy', e)}
                                    className={`absolute bottom-0 ${isRightDock ? 'left-0 cursor-nesw-resize' : 'right-0 cursor-nwse-resize'} w-4 h-4`}
                                >
                                    <div className="absolute inset-0 m-auto w-2.5 h-2.5 border-b border-r border-amber-400/70" />
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
