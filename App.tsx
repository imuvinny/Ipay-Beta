import React, { useState, useEffect, ReactNode, FC, useRef } from 'react';
import { AdminDashboard } from './src/components/AdminDashboard';
import { 
    ArrowUpRight, ArrowDownLeft, BarChart2, MessageSquare, 
    HandCoins, Landmark, PiggyBank, Award, 
    UserPlus, HelpCircle, ArrowLeft, CheckCircle, ArrowRight,
    Receipt, X, Zap, Briefcase, Droplets, Tv,
    TrendingUp, RefreshCw, Eye, EyeOff, Settings, Sun, Moon, 
    PieChart, Sparkles, CreditCard, Shield, Lock, Copy, Palette,
    LogOut, User, Edit3, Shuffle, AlertCircle,
    Wallet, Activity, History, ArrowDown, Mail, Smartphone, AtSign, ChevronRight, Globe,
    Clock, 
    Camera, Upload, Image as ImageIcon, MoreVertical, Check, CheckCheck, DollarSign, Send, Search, Plus,
    QrCode, Nfc, Scan, MapPin, Map as MapIcon, Navigation
} from 'lucide-react';
import { ThemeMap, ThemeColor, Transaction, UserProfile, AvatarPreset, PendingRequest } from './types';
import { supabase, SUPABASE_URL, SUPABASE_PUBLIC_KEY } from './supabaseClient';
import { uploadAvatar } from './upload';
import { Html5Qrcode } from "html5-qrcode";
import { parsePaymentIntent } from './src/utils/ai';
import { QRCodeCanvas } from 'qrcode.react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet's default icon path issues with webpack/vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// --- Theme & Color Configuration ---
const themes: ThemeMap = {
    green: { base: '#00d554', bg: 'bg-[#00d554]', text: 'text-[#00d554]', accent: 'accent-[#00d554]' },
    pink: { base: '#ec4899', bg: 'bg-pink-500', text: 'text-pink-500', accent: 'accent-pink-500' },
    blue: { base: '#0ea5e9', bg: 'bg-sky-500', text: 'text-sky-500', accent: 'accent-sky-500' },
    purple: { base: '#a855f7', bg: 'bg-purple-500', text: 'text-purple-500', accent: 'accent-purple-500' },
    orange: { base: '#f97316', bg: 'bg-orange-500', text: 'text-orange-500', accent: 'accent-orange-500' },
    cyan: { base: '#06b6d4', bg: 'bg-cyan-500', text: 'text-cyan-500', accent: 'accent-cyan-500' },
};

// --- Helper: Icon Mapping ---
const getIconForCategory = (category: string) => {
    switch (category) {
        case 'send': return <ArrowUpRight size={18} className="text-gray-800 dark:text-white"/>;
        case 'receive': 
        case 'deposit': return <ArrowDownLeft size={18} className="text-gray-800 dark:text-white"/>;
        case 'withdraw': return <ArrowDown size={18} className="text-gray-800 dark:text-white"/>;
        case 'bill': return <Receipt size={18} className="text-gray-800 dark:text-white"/>;
        case 'loan': return <HandCoins size={18} className="text-gray-800 dark:text-white"/>;
        case 'savings': return <PiggyBank size={18} className="text-gray-800 dark:text-white"/>;
        case 'card': return <CreditCard size={18} className="text-gray-800 dark:text-white"/>;
        default: return <Activity size={18} className="text-gray-800 dark:text-white"/>;
    }
};

// --- Helper: Date Formatting ---
const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // If less than 24 hours
    if (diff < 24 * 60 * 60 * 1000) {
        if (diff < 60 * 1000) return 'Just now';
        if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}m ago`;
        return `${Math.floor(diff / (60 * 60 * 1000))}h ago`;
    }
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// --- Avatar Configuration ---
const AVATAR_CONFIG = {
    skinColors: [
        { name: 'pale', hex: '#ffdbb4', apiValue: 'ffdbb4' },
        { name: 'light', hex: '#edb98a', apiValue: 'edb98a' },
        { name: 'yellow', hex: '#f8d25c', apiValue: 'f8d25c' },
        { name: 'tanned', hex: '#fd9841', apiValue: 'fd9841' },
        { name: 'brown', hex: '#d08b5b', apiValue: 'd08b5b' },
        { name: 'darkBrown', hex: '#ae5d29', apiValue: 'ae5d29' },
        { name: 'black', hex: '#614335', apiValue: '614335' }
    ],
    presets: [
        { id: 1, name: 'Dipper', seed: 'Dipper', style: 'avataaars', color: 'edb98a', gender: 'masculine', fixedHair: 'theCaesarAndSidePart' },
        { id: 2, name: 'Mabel', seed: 'Mabel', style: 'avataaars', color: 'edb98a', gender: 'feminine', fixedHair: 'straightStrand' },
        { id: 3, name: 'Stan', seed: 'Stanley', style: 'avataaars', color: 'd08b5b', gender: 'masculine', fixedHair: 'sides', noBeard: false },
        { id: 4, name: 'Wendy', seed: 'Wendy', style: 'avataaars', color: 'edb98a', gender: 'feminine', fixedHair: 'curvy' },
        { id: 5, name: 'Soos', seed: 'Soos', style: 'avataaars', color: 'edb98a', gender: 'masculine', fixedHair: 'shortFlat' },
        { id: 6, name: 'Ford', seed: 'Stanford', style: 'avataaars', color: 'edb98a', gender: 'masculine', fixedHair: 'theCaesar' },
        { id: 7, name: 'Pacifica', seed: 'Pacifica', style: 'avataaars', color: 'edb98a', gender: 'feminine', fixedHair: 'straight01' },
        { id: 8, name: 'Gideon', seed: 'Gideon', style: 'avataaars', color: 'ffdbb4', gender: 'masculine', fixedHair: 'frizzle' },
        { id: 9, name: 'Robbie', seed: 'Robbie', style: 'avataaars', color: 'edb98a', gender: 'masculine', fixedHair: 'shortWaved' },
        { id: 10, name: 'Candy', seed: 'Candy', style: 'avataaars', color: 'f8d25c', gender: 'feminine', fixedHair: 'bob' },
        { id: 11, name: 'Grenda', seed: 'Grenda', style: 'avataaars', color: 'd08b5b', gender: 'feminine', fixedHair: 'bun' },
        { id: 12, name: 'Bill', seed: 'BillCipher', style: 'avataaars', color: 'f8d25c', gender: 'masculine', fixedHair: 'shavedSides', noBeard: true },
    ] as AvatarPreset[],
    hairStyles: {
        masculine: ['shortFlat', 'theCaesar', 'shortDreads1', 'frizzle', 'shortWaved', 'sides', 'theCaesarAndSidePart', 'shortCurly'],
        feminine: ['bob', 'straight01', 'curly', 'miaWallace', 'frida', 'straightStrand', 'bun', 'longButNotTooLong']
    }
};

const getDisplayAvatarUrl = (profile: UserProfile) => {
    // 1. If uploaded URL exists, use it.
    if (profile.avatarUrl) return profile.avatarUrl;

    // 2. If seed exists (from preset or random), generate URL.
    if (profile.seed) {
        const currentStyle = profile.style || 'avataaars';
        let url = `https://api.dicebear.com/9.x/${currentStyle}/svg?seed=${profile.seed}`;
        
        if (currentStyle === 'micah') { 
            url += `&backgroundColor=b6e3f4,c0aede,d1d4f9`; 
        } else {
            let hair = profile.fixedHair;
            if (!hair) {
                 const hairList = profile.gender === 'masculine' ? AVATAR_CONFIG.hairStyles.masculine : AVATAR_CONFIG.hairStyles.feminine;
                 const hairIndex = Math.floor(profile.seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % hairList.length);
                 hair = hairList[hairIndex];
            }
            if (!hair) hair = 'longHairBob';
            url += `&skinColor=${profile.skinTone || 'edb98a'}&top=${hair}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
            if (profile.gender === 'feminine' || profile.noBeard) { url += `&facialHairProbability=0`; }
        }
        return url;
    }

    // 3. Fallback to initials
    return `https://api.dicebear.com/9.x/initials/svg?seed=${profile.name}`;
};

// --- Brand Icons ---
const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <g transform="matrix(1, 0, 0, 1, 27.009001, -39.23856)">
        <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
        <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
        <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.734 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
        <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
        </g>
    </svg>
);

const AppleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M15.0729 14.6579C15.0975 12.1818 17.1528 10.8711 17.2514 10.8143C16.143 9.20667 14.4178 8.96109 13.823 8.93796C12.3533 8.78854 10.9328 9.80287 10.1901 9.80287C9.43167 9.80287 8.25686 8.94931 7.40328 8.96495C6.30567 8.97964 5.29528 9.59962 4.73359 10.5735C3.56514 12.5995 4.43703 15.6133 5.57718 17.2588C6.13609 18.0628 6.79796 18.9664 7.69765 18.936C8.56843 18.9038 8.89203 18.3756 9.96203 18.3756C11.0166 18.3756 11.3164 18.936 12.2131 18.9038C13.1417 18.8726 13.733 18.077 14.2828 17.275C14.9255 16.3377 15.1953 15.4241 15.2076 15.3805C15.1972 15.3758 13.1362 14.5954 13.1362 12.3295M12.9298 7.37395C13.5283 6.64964 13.9317 5.64509 13.823 4.63672C12.9497 4.67177 11.8941 5.2185 11.2689 5.94689C10.7109 6.59281 10.207 7.61803 10.3348 8.60802C11.3106 8.68378 12.3323 8.09361 12.9298 7.37395Z" />
    </svg>
);

// --- Reusable Components ---
interface ActionButtonProps {
    icon?: ReactNode;
    label: string;
    onClick: () => void;
    large?: boolean;
    accentColor: ThemeColor;
}

const ActionButton: FC<ActionButtonProps> = ({ icon, label, onClick, large = false, accentColor }) => {
    if (large) {
        return (
            <button onClick={onClick} className={`flex-1 ${themes[accentColor].bg} text-black font-bold py-4 rounded-full text-lg hover:opacity-90 transition-opacity`}>
                {label}
            </button>
        );
    }
    return (
        <div className="flex flex-col items-center space-y-2">
            <button onClick={onClick} className="bg-gray-200 dark:bg-[#2c2c2e] text-gray-700 dark:text-white w-16 h-16 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-300 dark:hover:bg-[#3a3a3c] transition-all transform hover:scale-105 focus:outline-none focus:ring-2" style={{'--tw-ring-color': themes[accentColor].base} as React.CSSProperties}>
                {icon}
            </button>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-300 text-center">{label}</p>
        </div>
    );
};

interface TransactionItemProps extends Transaction {
    accentColor: ThemeColor;
    currency: string;
    conversionRate: number;
}

const TransactionItem: FC<TransactionItemProps> = ({ icon, type, date, amount, isCredit, accentColor, currency, conversionRate, fee }) => {
    const symbol = currency === 'USD' ? '$' : 'K';
    const displayedAmount = (currency === 'ZMW' ? parseFloat(amount) * conversionRate : parseFloat(amount)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    return (
        <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
                <div className="bg-gray-100 dark:bg-[#2c2c2e] p-3 rounded-full">{icon}</div>
                <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{type}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{date}</p>
                </div>
            </div>
            <div className="text-right">
                <p className={`font-bold ${isCredit ? themes[accentColor].text : 'text-gray-900 dark:text-white'}`}>
                    {isCredit ? '+' : '-'}{symbol}{displayedAmount}
                </p>
                {(fee || 0) > 0 && (
                     <p className="text-[10px] text-gray-400">Fee: {symbol}{(fee * (currency === 'ZMW' ? conversionRate : 1)).toFixed(2)}</p>
                )}
            </div>
        </div>
    );
};

const ScreenHeader: FC<{ title: string; onBack: () => void }> = ({ title, onBack }) => (
    <div className="flex items-center p-4 bg-gray-50 dark:bg-[#1c1c1e] border-b border-gray-200 dark:border-[#3a3a3c] sticky top-0 z-10">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-[#2c2c2e] mr-2"><ArrowLeft size={24} className="text-gray-800 dark:text-white" /></button>
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h1>
    </div>
);

const CurrentTime = () => {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    return (
        <div className="flex flex-col items-end mr-2 hidden sm:flex">
            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {time.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
            <p className="text-xs font-black text-gray-800 dark:text-white tabular-nums">
                {time.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
            </p>
        </div>
    );
};

interface TransactionStatusScreenProps {
    status: 'success' | 'failure';
    title: string;
    message: string;
    onDone: () => void;
    accentColor: ThemeColor;
    children?: ReactNode;
}

const TransactionStatusScreen: FC<TransactionStatusScreenProps> = ({ status, title, message, onDone, accentColor, children }) => {
    const isSuccess = status === 'success';
    // Use red for failure
    const bgColor = isSuccess ? themes[accentColor].bg : 'bg-[#ff3b30]';
    
    return (
        <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 text-center ${bgColor} animate-in fade-in zoom-in duration-300`}>
            {isSuccess 
                ? <CheckCircle size={80} className="text-white mb-6" /> 
                : <X size={80} className="text-white mb-6 border-4 rounded-full p-2" />
            }
            <h2 className="text-3xl font-black mb-2 text-white tracking-tight">{title}</h2>
            <p className="text-white/90 font-medium mb-8 text-lg max-w-xs mx-auto leading-relaxed">{message}</p>
            {children}
            <button 
                onClick={onDone} 
                className="w-full max-w-xs bg-white text-black font-bold py-4 rounded-full hover:scale-105 active:scale-95 transition-all shadow-xl mt-6"
            >
                {isSuccess ? 'Done' : 'Try Again'}
            </button>
        </div>
    );
};

interface FormInputProps {
    label: string;
    type: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    required?: boolean;
    accentColor: ThemeColor;
    maxLength?: number;
    className?: string;
    step?: string;
    max?: number | string;
    error?: string;
}

const FormInput: FC<FormInputProps> = ({ label, type, value, onChange, placeholder, required, accentColor, maxLength, className = '', step, max, error }) => (
    <div className="w-full">
        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
        <input 
            type={type} 
            value={value} 
            onChange={onChange} 
            placeholder={placeholder} 
            required={required} 
            maxLength={maxLength} 
            step={step}
            max={max}
            className={`w-full px-4 py-3 bg-white dark:bg-[#1c1c1e] text-black dark:text-white border ${error ? 'border-red-500' : 'border-gray-300 dark:border-[#3a3a3c]'} rounded-lg focus:ring-2 ${className}`}
            style={{'--tw-ring-color': themes[accentColor].base} as React.CSSProperties} 
        />
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
);

// --- Auth Screen (Login/Signup) ---
const AuthScreen: FC<{ onLogin: () => void; accentColor: ThemeColor }> = ({ onLogin, accentColor }) => {
    // States: 'landing', 'login', 'signup-input', 'signup-tag'
    const [authMode, setAuthMode] = useState<'landing' | 'login' | 'signup-input' | 'signup-tag'>('landing');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    
    // Form States
    const [identifier, setIdentifier] = useState(''); // Phone or Email
    const [password, setPassword] = useState('');
    const [ipayTag, setIpayTag] = useState('');

    const handleSignIn = async () => {
        setErrorMsg(null);
        setSuccessMsg(null);
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: identifier,
                password,
            });
            if (error) throw error;
            if (data.session) {
                onLogin();
            }
        } catch (err: any) {
            setErrorMsg(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async () => {
        setErrorMsg(null);
        setSuccessMsg(null);
        setLoading(true);
        try {
            // Save ipayTag and initial balance to user metadata
            const { data, error } = await supabase.auth.signUp({
                email: identifier,
                password,
                options: { data: { ipayTag, balance: 1250.75 } }
            });
            if (error) throw error;
            
            if (data.user) {
                // Attempt to create profile record for P2P lookups
                // We ignore errors here to not block signup if table is missing/different
                const { error: profileError } = await supabase.from('profiles').upsert({
                    id: data.user.id,
                    username: ipayTag,
                    updated_at: new Date().toISOString(),
                    // Default values to ensure row is valid for Admin Dashboard
                    skin_tone: 'edb98a',
                    gender: 'feminine',
                    seed: 'Alex',
                    style: 'avataaars',
                    agent_status: 'none',
                    fixed_hair: null,
                    no_beard: false
                });
                if (profileError) console.warn('Profile creation failed', profileError);
            }

            if (data.session) {
                // If session exists (e.g. email confirmation disabled), login
                onLogin();
            } else {
                // Email confirmation required - Redirect to Login with Success Message
                setSuccessMsg("Your account has been created. Please check your email and verify your address before logging in.");
                setPassword(''); // Clear password for security/UX
                setAuthMode('login'); 
            }
        } catch (err: any) {
            setErrorMsg(err.message);
        } finally {
            setLoading(false);
        }
    };

    const SocialButton: FC<{ icon: ReactNode, label: string, onClick?: () => void }> = ({ icon, label, onClick }) => (
        <button onClick={onClick} className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-black py-3.5 rounded-full font-bold flex items-center justify-center gap-3 transition-colors active:scale-95 shadow-sm">
            {icon}
            <span className="text-sm tracking-wide">{label}</span>
        </button>
    );

    // --- LANDING VIEW ---
    if (authMode === 'landing') {
        return (
            <div className="fixed inset-0 z-50 flex flex-col bg-white text-black p-6 overflow-hidden justify-between">
                 {/* Aesthetic Backgrounds */}
                <div className={`absolute top-[-10%] right-[-10%] w-[80%] h-[50%] ${themes[accentColor].bg} rounded-full opacity-5 blur-[100px] animate-pulse`}></div>
                <div className={`absolute bottom-[-10%] left-[-10%] w-[80%] h-[50%] bg-blue-600 rounded-full opacity-5 blur-[100px]`}></div>

                <div className="flex-1 flex flex-col items-center justify-center z-10">
                    <div className="relative mb-8">
                        <div className={`absolute inset-0 ${themes[accentColor].bg} blur-2xl opacity-20`}></div>
                        <Zap size={80} className={`${themes[accentColor].text} relative z-10`} fill="currentColor" />
                    </div>
                    <h1 className="text-5xl font-black tracking-tighter mb-2">iPAY</h1>
                    <p className="text-gray-500 font-medium">The future of money is here.</p>
                </div>

                <div className="w-full space-y-4 mb-8 z-10">
                    <button 
                        onClick={() => { setAuthMode('signup-input'); setSuccessMsg(null); setErrorMsg(null); }} 
                        className={`w-full py-4 rounded-full font-black uppercase tracking-widest ${themes[accentColor].bg} text-black shadow-lg shadow-${accentColor}-500/10 hover:brightness-110 active:scale-95 transition-all`}
                    >
                        Sign Up
                    </button>
                    <button 
                        onClick={() => { setAuthMode('login'); setSuccessMsg(null); setErrorMsg(null); }} 
                        className="w-full py-4 rounded-full font-bold bg-black text-white hover:bg-gray-900 active:scale-95 transition-all shadow-lg shadow-black/10"
                    >
                        Log In
                    </button>
                </div>
            </div>
        );
    }

    // --- LOGIN VIEW ---
    if (authMode === 'login') {
        return (
            <div className="fixed inset-0 z-50 flex flex-col bg-white text-black p-6">
                 <button onClick={() => { setAuthMode('landing'); setSuccessMsg(null); setErrorMsg(null); }} className="absolute top-6 left-4 p-2 rounded-full hover:bg-gray-100 transition-colors"><ArrowLeft size={24} className="text-black" /></button>
                
                <div className="mt-20 mb-8">
                    <h2 className="text-3xl font-black mb-2">Welcome Back</h2>
                    <p className="text-gray-500">Enter your details to access your account.</p>
                </div>

                <div className="space-y-4">
                     {successMsg && (
                        <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-100 text-center">
                            <p className="text-sm font-bold">{successMsg}</p>
                        </div>
                     )}

                     <div className="space-y-2">
                        <input 
                            type="text" 
                            value={identifier} 
                            onChange={(e) => setIdentifier(e.target.value)} 
                            className={`w-full bg-transparent border-b-2 border-gray-200 focus:border-${accentColor}-500 py-4 text-2xl font-medium placeholder-gray-300 outline-none transition-colors`}
                            placeholder="Email"
                            style={{borderColor: identifier ? themes[accentColor].base : ''}}
                        />
                        <input 
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            className={`w-full bg-transparent border-b-2 border-gray-200 focus:border-${accentColor}-500 py-4 text-2xl font-medium placeholder-gray-300 outline-none transition-colors`}
                            placeholder="Password"
                        />
                     </div>
                     
                    {errorMsg && (
                        <p className="text-red-500 text-sm font-medium">{errorMsg}</p>
                    )}

                    <button 
                        onClick={handleSignIn} 
                        disabled={loading}
                        className={`w-full py-4 rounded-full font-bold ${themes[accentColor].bg} text-black mt-6 hover:opacity-90 transition-opacity shadow-lg shadow-${accentColor}-500/10 disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>

                    <div className="flex items-center justify-center gap-4 py-4">
                        <div className="h-px bg-gray-200 flex-1"></div>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Or continue with</span>
                        <div className="h-px bg-gray-200 flex-1"></div>
                    </div>

                    <div className="space-y-3">
                        <SocialButton icon={<GoogleIcon />} label="Continue with Google" onClick={onLogin} />
                        <SocialButton icon={<AppleIcon />} label="Continue with Apple" onClick={onLogin} />
                    </div>
                </div>
            </div>
        );
    }

    // --- SIGN UP: INPUT VIEW ---
    if (authMode === 'signup-input') {
        return (
            <div className="fixed inset-0 z-50 flex flex-col bg-white text-black p-6">
                <button onClick={() => { setAuthMode('landing'); setSuccessMsg(null); setErrorMsg(null); }} className="absolute top-6 left-4 p-2 rounded-full hover:bg-gray-100 transition-colors"><X size={24} className="text-black" /></button>
                
                <div className="mt-20 mb-8">
                    <h2 className="text-3xl font-black mb-2">Create Account</h2>
                    <p className="text-gray-500">Enter your email and create a password.</p>
                </div>

                <div className="space-y-6">
                    <input 
                        type="text" 
                        value={identifier} 
                        onChange={(e) => setIdentifier(e.target.value)} 
                        className={`w-full bg-transparent border-b-2 border-gray-200 focus:border-${accentColor}-500 py-4 text-2xl font-medium placeholder-gray-300 outline-none transition-colors`}
                        placeholder="Email"
                        autoFocus
                    />
                    
                    <input 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        className={`w-full bg-transparent border-b-2 border-gray-200 focus:border-${accentColor}-500 py-4 text-2xl font-medium placeholder-gray-300 outline-none transition-colors`}
                        placeholder="Password"
                    />

                    <button 
                        onClick={() => { if(identifier && password) setAuthMode('signup-tag'); }} 
                        disabled={!identifier || !password}
                        className={`w-full py-4 rounded-full font-bold flex items-center justify-center gap-2 ${identifier && password ? themes[accentColor].bg + ' text-black shadow-lg shadow-' + accentColor + '-500/10' : 'bg-gray-100 text-gray-400 cursor-not-allowed'} transition-all`}
                    >
                        Next <ChevronRight size={20} />
                    </button>

                    <div className="flex items-center justify-center gap-4 py-4">
                        <div className="h-px bg-gray-200 flex-1"></div>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Or sign up with</span>
                        <div className="h-px bg-gray-200 flex-1"></div>
                    </div>

                     <div className="space-y-3">
                        <SocialButton icon={<GoogleIcon />} label="Continue with Google" onClick={() => setAuthMode('signup-tag')} />
                        <SocialButton icon={<AppleIcon />} label="Continue with Apple" onClick={() => setAuthMode('signup-tag')} />
                    </div>
                </div>
            </div>
        );
    }

    // --- SIGN UP: TAG CREATION VIEW ---
    if (authMode === 'signup-tag') {
        return (
            <div className="fixed inset-0 z-50 flex flex-col bg-white text-black p-6">
                 <button onClick={() => setAuthMode('signup-input')} className="absolute top-6 left-4 p-2 rounded-full hover:bg-gray-100 transition-colors"><ArrowLeft size={24} className="text-black" /></button>

                <div className="flex-1 flex flex-col justify-center">
                    <div className="mb-8">
                        <h2 className="text-4xl font-black mb-2">Choose your <span className={themes[accentColor].text}>@ipayTag</span></h2>
                        <p className="text-gray-500">Your unique name for getting paid by anyone.</p>
                    </div>

                    <div className="relative">
                        <AtSign className={`absolute left-0 top-1/2 -translate-y-1/2 ${themes[accentColor].text}`} size={32} />
                        <input 
                            type="text" 
                            value={ipayTag} 
                            onChange={(e) => setIpayTag(e.target.value.replace(/\s/g, ''))} 
                            className={`w-full bg-transparent pl-10 border-b-2 border-gray-200 py-4 text-4xl font-bold placeholder-gray-200 outline-none focus:border-${themes[accentColor].base} transition-colors`}
                            placeholder="yourname"
                            autoFocus
                        />
                    </div>
                    {ipayTag.length > 3 && (
                        <div className="mt-4 flex items-center gap-2 text-green-500">
                            <CheckCircle size={16} />
                            <span className="text-sm font-bold">@ipay{ipayTag} is available!</span>
                        </div>
                    )}
                </div>

                <div className="mb-8">
                     {errorMsg && (
                        <p className="text-red-500 text-sm font-medium mb-4 text-center">{errorMsg}</p>
                    )}
                    <button 
                        onClick={handleSignUp} 
                        disabled={loading || ipayTag.length < 3}
                        className={`w-full py-4 rounded-full font-black uppercase tracking-widest ${ipayTag.length >= 3 ? themes[accentColor].bg + ' text-black shadow-lg shadow-' + accentColor + '-500/10' : 'bg-gray-100 text-gray-400 cursor-not-allowed'} transition-all`}
                    >
                        {loading ? 'Creating Account...' : 'Create @ipayTag'}
                    </button>
                    <p className="text-center text-[10px] text-gray-400 mt-4 uppercase tracking-widest font-bold">By continuing, you agree to our Terms of Service.</p>
                </div>
            </div>
        );
    }

    return null;
}

// --- Profile Editor Screen ---
interface ProfileEditorProps {
    onBack: () => void;
    profile: UserProfile;
    setProfile: (p: UserProfile) => void;
    accentColor: ThemeColor;
}

const ProfileEditorScreen: FC<ProfileEditorProps> = ({ onBack, profile, setProfile, accentColor }) => {
    const [localName, setLocalName] = useState(profile.name);
    const [localGender, setLocalGender] = useState(profile.gender || 'feminine');
    const [localSkin, setLocalSkin] = useState(profile.skinTone || 'edb98a'); 
    const [localSeed, setLocalSeed] = useState(profile.seed || 'Alex');
    const [avatarStyle, setAvatarStyle] = useState(profile.style || 'avataaars'); 
    const [localFixedHair, setLocalFixedHair] = useState<string | null>(profile.fixedHair || null);
    const [localNoBeard, setLocalNoBeard] = useState(profile.noBeard || false);
    
    // Image Upload State
    const [localAvatarUrl, setLocalAvatarUrl] = useState<string | undefined>(profile.avatarUrl);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const randomize = () => { setLocalSeed(Math.random().toString(36).substring(7)); setLocalFixedHair(null); setLocalNoBeard(false); setLocalAvatarUrl(undefined); };
    
    const handleSave = () => {
        setProfile({ 
            ...profile, 
            name: localName, 
            gender: localGender, 
            skinTone: localSkin, 
            seed: localSeed, 
            style: avatarStyle, 
            fixedHair: localFixedHair, 
            noBeard: localNoBeard,
            avatarUrl: localAvatarUrl
        });
        onBack();
    };

    const getAvatarUrl = (seed?: string, skin?: string, style?: string, gender?: 'masculine' | 'feminine', fixedHair?: string | null, noBeard?: boolean) => {
        // 1. If arguments are provided (e.g. for preset list), generate URL based on them.
        if (seed) {
            const currentStyle = style || 'avataaars';
            let url = `https://api.dicebear.com/9.x/${currentStyle}/svg?seed=${seed}`;
            if (currentStyle === 'micah') { 
                url += `&backgroundColor=b6e3f4,c0aede,d1d4f9`; 
            } else {
                let hair = fixedHair;
                if (!hair) {
                     const hairList = gender === 'masculine' ? AVATAR_CONFIG.hairStyles.masculine : AVATAR_CONFIG.hairStyles.feminine;
                     const hairIndex = Math.floor(seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % hairList.length);
                     hair = hairList[hairIndex];
                }
                if (!hair) hair = 'longHairBob';
                url += `&skinColor=${skin}&top=${hair}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
                if (gender === 'feminine' || noBeard) { url += `&facialHairProbability=0`; }
            }
            return url;
        }

        // 2. If no arguments (main preview), prioritize uploaded image.
        if (localAvatarUrl) return localAvatarUrl;

        // 3. Fallback to current local state configuration.
        const currentSeed = localSeed;
        const currentSkin = localSkin;
        const currentStyle = avatarStyle;
        const currentGender = localGender;
        const currentFixedHair = localFixedHair;
        const currentNoBeard = localNoBeard;

        let url = `https://api.dicebear.com/9.x/${currentStyle}/svg?seed=${currentSeed}`;
        if (currentStyle === 'micah') { url += `&backgroundColor=b6e3f4,c0aede,d1d4f9`; } 
        else {
            let hair = currentFixedHair;
            if (!hair) {
                 const hairList = currentGender === 'masculine' ? AVATAR_CONFIG.hairStyles.masculine : AVATAR_CONFIG.hairStyles.feminine;
                 const hairIndex = Math.floor(currentSeed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % hairList.length);
                 hair = hairList[hairIndex];
            }
            if (!hair) hair = 'longHairBob';
            url += `&skinColor=${currentSkin}&top=${hair}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
            if (currentGender === 'feminine' || currentNoBeard) { url += `&facialHairProbability=0`; }
        }
        return url;
    };

    const applyPreset = (preset: AvatarPreset) => {
        setLocalSeed(preset.seed); setAvatarStyle(preset.style); setLocalSkin(preset.color); setLocalGender(preset.gender); 
        setLocalFixedHair(preset.fixedHair || null); setLocalNoBeard(preset.noBeard || false);
        setLocalAvatarUrl(undefined); // Reset upload if preset selected
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setUploading(true);
        const file = e.target.files[0];
        
        try {
            // Optimistic preview
            const objectUrl = URL.createObjectURL(file);
            setLocalAvatarUrl(objectUrl);

            // Get User ID
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not authenticated");
            const userId = user.id;

            const { url } = await uploadAvatar({
                fileBlobOrBase64: file,
                userId,
                filename: file.name
            });

            // Success
            setLocalAvatarUrl(url);

        } catch (error) {
            console.error("Error handling file upload:", error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-100 dark:bg-black">
            <ScreenHeader title="Edit Profile" onBack={onBack} />
            <div className="flex-grow p-6 overflow-y-auto space-y-8 no-scrollbar">
                <div className="flex flex-col items-center">
                    <div className="w-40 h-40 rounded-full border-4 border-white dark:border-[#333] shadow-2xl overflow-hidden bg-gray-200 mb-4 relative group">
                        <img 
                            src={getAvatarUrl()} 
                            alt="Avatar Preview" 
                            className="w-full h-full object-cover" 
                            onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/9.x/initials/svg?seed=${localName}`; }} 
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                            <button onClick={randomize} className="text-white bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors" title="Randomize Avatar">
                                <Shuffle size={24} />
                            </button>
                            <button onClick={() => fileInputRef.current?.click()} className="text-white bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors" title="Upload Photo">
                                {uploading ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Camera size={24} />}
                            </button>
                        </div>
                    </div>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        accept="image/*" 
                        className="hidden" 
                    />
                    <button onClick={() => fileInputRef.current?.click()} className="text-sm font-bold text-gray-500 hover:text-gray-800 dark:hover:text-white flex items-center gap-2">
                        <Upload size={16}/> Upload Photo
                    </button>
                </div>
                <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 block">Choose your Character</label>
                    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                        {AVATAR_CONFIG.presets.map(preset => (
                            <button key={preset.id} onClick={() => applyPreset(preset)} className={`flex flex-col items-center gap-2 flex-shrink-0 transition-transform ${localSeed === preset.seed && !localAvatarUrl ? 'scale-105' : 'opacity-70 hover:opacity-100'}`}>
                                <div className={`w-16 h-16 rounded-full overflow-hidden border-2 ${localSeed === preset.seed && !localAvatarUrl ? `border-${accentColor}-500 shadow-lg` : 'border-transparent'}`} style={{borderColor: localSeed === preset.seed && !localAvatarUrl ? themes[accentColor].base : 'transparent'}}>
                                    <img src={getAvatarUrl(preset.seed, preset.color, preset.style, preset.gender, preset.fixedHair, preset.noBeard)} alt={preset.name} className="w-full h-full object-cover"/>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Gamertag / Name</label>
                    <input type="text" value={localName} onChange={e => setLocalName(e.target.value)} className="w-full bg-white dark:bg-[#1c1c1e] text-black dark:text-white p-4 rounded-xl text-lg font-bold border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2" style={{'--tw-ring-color': themes[accentColor].base} as React.CSSProperties} />
                </div>
                <button onClick={handleSave} disabled={uploading} className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest ${uploading ? 'bg-gray-400 cursor-not-allowed' : themes[accentColor].bg} text-black shadow-lg active:scale-95 transition-all mt-4`}>
                    {uploading ? 'Uploading...' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
};

// --- Virtual Card Screen ---
interface VirtualCardScreenProps {
    onBack: () => void;
    accentColor: ThemeColor;
    clientName: string;
    cardSkin: { background: string; pattern: string | null; id: string };
    onSaveSkin: (skin: { background: string; pattern: string | null; id: string }) => void;
}

const VirtualCardScreen: FC<VirtualCardScreenProps> = ({ onBack, accentColor, clientName, cardSkin, onSaveSkin }) => {
    const [isFrozen, setIsFrozen] = useState(false);
    const [showNumber, setShowNumber] = useState(false);
    
    // Local state for previewing skins before saving
    const [previewSkin, setPreviewSkin] = useState(cardSkin);
    
    const [isFlipped, setIsFlipped] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const cardNumber = "4829 1029 4819 2938";
    
    // 3D Tilt State
    const [tilt, setTilt] = useState({ x: 0, y: 0 });
    const cardRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        
        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        const x = clientX - rect.left;
        const y = clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // Max 15 degree tilt
        const tiltX = ((y - centerY) / centerY) * -15; 
        const tiltY = ((x - centerX) / centerX) * 15;
        
        setTilt({ x: tiltX, y: tiltY });
    };

    const handleMouseLeave = () => {
        setTilt({ x: 0, y: 0 });
    };

    // Update preview when prop changes (initial load)
    useEffect(() => {
        setPreviewSkin(cardSkin);
    }, [cardSkin]);

    const generateRandomSkin = () => {
        const colors = [
            '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', 
            '#000000', '#1c1c1e', '#ffffff', '#2dd4bf', '#a3e635', '#fbbf24', '#60a5fa', '#818cf8', '#c084fc'
        ];
        
        const patterns = [
            null, // None
            `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1h2v2H1V1zm4 4h2v2H5V5zm4 4h2v2H9V9zm4 4h2v2h-2v-2zm4 4h2v2h-2v-2z' fill='%23ffffff10' fill-rule='evenodd'/%3E%3C/svg%3E")`, // Dots
            `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff10' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`, // Stripes
            `url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23ffffff15' font-family='monospace' font-weight='bold' font-size='14'%3E$%3C/text%3E%3C/svg%3E")`, // Dollar Signs
            `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z' fill='%23ffffff10'/%3E%3C/svg%3E")`, // Diamonds
            `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h20v20H0V0zm10 17l-5-5h10l-5 5z' fill='%23ffffff10'/%3E%3C/svg%3E")`, // Triangles
            `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff10'%3E%3Cpath d='M50 50c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10s-10-4.477-10-10 4.477-10 10-10zM10 10c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10s-10-4.477-10-10 4.477-10 10-10z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`, // Circles
            `url("data:image/svg+xml,%3Csvg width='52' height='26' viewBox='0 0 52 26' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff10'%3E%3Cpath d='M10 10c0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6h2c0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4v2c-3.314 0-6-2.686-6-6 0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6zm25.464-1.95l8.486 8.486-1.414 1.414-8.486-8.486 1.414-1.414z' /%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` // Waves
        ];

        // 20% Chance for "Lightning Dollar" (Orange/Black + Dollar Pattern)
        if (Math.random() < 0.2) {
             setPreviewSkin({
                background: `linear-gradient(135deg, #f97316 0%, #000000 100%)`,
                pattern: patterns[3], // Dollar
                id: 'lightning-dollar'
            });
            return;
        }

        // 15% Chance for "Matrix" (Black/Green + Dots)
        if (Math.random() < 0.15) {
             setPreviewSkin({
                background: `linear-gradient(180deg, #000000 0%, #064e3b 100%)`,
                pattern: patterns[1], // Dots
                id: 'matrix'
            });
            return;
        }
        
        // 15% Chance for "Cyberpunk" (Pink/Cyan + Stripes)
        if (Math.random() < 0.15) {
             setPreviewSkin({
                background: `linear-gradient(45deg, #ec4899 0%, #06b6d4 100%)`,
                pattern: patterns[2], // Stripes
                id: 'cyberpunk'
            });
            return;
        }

        const c1 = colors[Math.floor(Math.random() * colors.length)];
        const c2 = colors[Math.floor(Math.random() * colors.length)];
        const angle = Math.floor(Math.random() * 360);
        const pattern = patterns[Math.floor(Math.random() * patterns.length)];

        setPreviewSkin({
            background: `linear-gradient(${angle}deg, ${c1}, ${c2})`,
            pattern: pattern,
            id: 'random-' + Date.now()
        });
    };

    const handleSave = () => {
        onSaveSkin(previewSkin);
        setShowSettings(false);
    };

    const handleCopyInfo = () => {
        navigator.clipboard.writeText(cardNumber);
        if (navigator.vibrate) navigator.vibrate(50);
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-black relative">
            <ScreenHeader title="Virtual Card" onBack={onBack} />
            <div className="p-6 flex-grow overflow-y-auto no-scrollbar">
                <div 
                    ref={cardRef}
                    className="w-full aspect-[1.586/1] mb-8 cursor-pointer group perspective-1000 transition-transform duration-300 hover:scale-105 animate-in zoom-in-95 fade-in duration-500" 
                    style={{ perspective: '1000px' }} 
                    onClick={() => {
                        setIsFlipped(!isFlipped);
                        if (navigator.vibrate) navigator.vibrate(50);
                    }}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    onTouchMove={handleMouseMove}
                    onTouchEnd={handleMouseLeave}
                >
                    <div 
                        className={`relative w-full h-full transition-transform ease-out`} 
                        style={{ 
                            transformStyle: 'preserve-3d', 
                            WebkitTransformStyle: 'preserve-3d',
                            transform: `rotateX(${isFlipped ? -tilt.x : tilt.x}deg) rotateY(${isFlipped ? 180 - tilt.y : tilt.y}deg)`,
                            transitionDuration: (tilt.x === 0 && tilt.y === 0) ? '500ms' : '100ms'
                        }}
                    >
                        {/* Front */}
                        <div className={`absolute w-full h-full rounded-2xl p-6 text-white shadow-2xl border border-white/20 ${isFrozen ? 'grayscale' : ''}`} style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(0deg) translateZ(1px)', WebkitTransform: 'rotateY(0deg) translateZ(1px)', background: previewSkin.background }}>
                            {previewSkin.pattern && <div className="absolute inset-0 opacity-50 rounded-2xl" style={{ backgroundImage: previewSkin.pattern }}></div>}
                            <div 
                                className="absolute inset-0 pointer-events-none transition-all duration-200 rounded-2xl" 
                                style={{
                                    background: `radial-gradient(circle at ${50 + tilt.y * 2}% ${50 - tilt.x * 2}%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 60%)`,
                                    transform: 'translateZ(1px)'
                                }}
                            ></div>
                            <div className="relative z-10 flex justify-between items-start mb-8"><Landmark size={32} className="opacity-80" /><span className="font-bold italic text-xl opacity-80">VISA</span></div>
                            <div className="relative z-10 space-y-4">
                                <div className="flex items-center justify-between"><p className="font-mono text-xl tracking-widest text-shadow">{showNumber ? cardNumber : "**** **** **** " + cardNumber.slice(-4)}</p><button onClick={(e) => { e.stopPropagation(); setShowNumber(!showNumber); if (navigator.vibrate) navigator.vibrate(50); }} className="opacity-70 hover:opacity-100 p-2">{showNumber ? <EyeOff size={20}/> : <Eye size={20}/>}</button></div>
                                <div className="flex justify-between items-end"><div><p className="text-xs opacity-70 uppercase mb-1">Card Holder</p><p className="font-medium tracking-wide uppercase">{clientName}</p></div><div><p className="text-xs opacity-70 uppercase mb-1">Expires</p><p className="font-medium">12/28</p></div></div>
                            </div>
                        </div>
                        {/* Back */}
                        <div className={`absolute w-full h-full rounded-2xl p-6 text-white shadow-2xl border border-white/20 ${isFrozen ? 'grayscale' : ''}`} style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg) translateZ(1px)', WebkitTransform: 'rotateY(180deg) translateZ(1px)', background: previewSkin.background }}>
                            {previewSkin.pattern && <div className="absolute inset-0 opacity-50 rounded-2xl" style={{ backgroundImage: previewSkin.pattern }}></div>}
                            <div 
                                className="absolute inset-0 pointer-events-none transition-all duration-200 rounded-2xl" 
                                style={{
                                    background: `radial-gradient(circle at ${50 - tilt.y * 2}% ${50 - tilt.x * 2}%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 60%)`,
                                    transform: 'translateZ(1px)'
                                }}
                            ></div>
                            <div className="relative z-10">
                                <div className="bg-black h-10 w-[calc(100%+3rem)] -mx-6 mb-6 mt-4 opacity-80"></div>
                                <div className="flex items-center justify-between mb-4"><div className="text-xs opacity-70 uppercase">Authorized Signature</div><div className="bg-white text-black px-3 py-1 font-mono font-bold text-lg rounded shadow-inner transform -rotate-1">482</div></div>
                                <div className="absolute bottom-6 right-6 opacity-50"><Landmark size={24} /></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <button onClick={() => setIsFrozen(!isFrozen)} className="bg-white dark:bg-[#1c1c1e] p-4 rounded-xl flex flex-col items-center justify-center space-y-2 hover:bg-gray-50 dark:hover:bg-[#2c2c2e] transition-transform active:scale-95 shadow-sm"><div className={`p-3 rounded-full ${isFrozen ? 'bg-red-100 text-red-500' : 'bg-gray-100 dark:bg-[#2c2c2e] text-gray-600 dark:text-gray-300'}`}>{isFrozen ? <Lock size={24} /> : <Shield size={24} />}</div><span className="text-xs font-bold text-gray-700 dark:text-gray-300">{isFrozen ? 'Unfreeze' : 'Freeze'}</span></button>
                    <button onClick={handleCopyInfo} className="bg-white dark:bg-[#1c1c1e] p-4 rounded-xl flex flex-col items-center justify-center space-y-2 hover:bg-gray-50 dark:hover:bg-[#2c2c2e] transition-transform active:scale-95 shadow-sm"><div className="bg-gray-100 dark:bg-[#2c2c2e] p-3 rounded-full text-gray-600 dark:text-gray-300"><Copy size={24} /></div><span className="text-xs font-bold text-gray-700 dark:text-gray-300">Copy Info</span></button>
                     <button onClick={() => setShowSettings(true)} className="bg-white dark:bg-[#1c1c1e] p-4 rounded-xl flex flex-col items-center justify-center space-y-2 hover:bg-gray-50 dark:hover:bg-[#2c2c2e] transition-transform active:scale-95 shadow-sm"><div className="bg-gray-100 dark:bg-[#2c2c2e] p-3 rounded-full text-gray-600 dark:text-gray-300"><Palette size={24} /></div><span className="text-xs font-bold text-gray-700 dark:text-gray-300">Skin</span></button>
                </div>
            </div>
            {showSettings && (
                <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowSettings(false)}>
                    <div className="bg-white dark:bg-[#1c1c1e] w-full p-6 rounded-t-3xl border-t border-gray-200 dark:border-[#333] transform transition-transform duration-300 ease-out" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6"><div className="flex items-center space-x-2"><Sparkles className={`${themes[accentColor].text}`} size={20} /><h3 className="text-xl font-bold text-gray-800 dark:text-white">Card Skins</h3></div><button onClick={() => setShowSettings(false)} className="p-2 bg-gray-100 dark:bg-[#2c2c2e] rounded-full"><X size={20} className="text-gray-600 dark:text-gray-300" /></button></div>
                        <div className="grid grid-cols-5 gap-4 mb-8">
                            {(Object.keys(themes) as ThemeColor[]).map(color => (
                                <button key={color} onClick={() => setPreviewSkin({ background: `linear-gradient(135deg, ${themes[color].base} 0%, #000000 100%)`, pattern: null, id: color })} className={`w-14 h-14 rounded-full ${themes[color].bg} border-4 transition-transform transform hover:scale-110 active:scale-95 flex items-center justify-center ${previewSkin.id === color ? 'border-white dark:border-gray-400 scale-110 shadow-lg' : 'border-transparent'}`}>{previewSkin.id === color && <CheckCircle size={20} className="text-black/50" />}</button>
                            ))}
                            <button onClick={generateRandomSkin} className="w-14 h-14 rounded-full bg-gray-100 dark:bg-[#2c2c2e] border-4 border-transparent flex items-center justify-center hover:scale-110 transition-transform hover:bg-gray-200 dark:hover:bg-[#3a3a3c]" title="Randomize">
                                <Shuffle size={24} className="text-black dark:text-white" />
                            </button>
                        </div>
                        <button onClick={handleSave} className={`w-full py-4 rounded-xl font-bold text-black ${themes[accentColor].bg} shadow-lg active:scale-95 transition-transform`}>Save Aesthetic</button>
                    </div>
                </div>
            )}
        </div>
    )
};

// --- Client Screens ---
interface SendMoneyScreenProps {
    onBack: () => void;
    addTransaction: (tx: Transaction, fee?: number) => void;
    balanceUSD: number;
    accentColor: ThemeColor;
    currency: string;
    conversionRate: number;
}

const SendMoneyScreen: FC<SendMoneyScreenProps> = ({ onBack, addTransaction, balanceUSD, accentColor, currency, conversionRate }) => {
    const [status, setStatus] = useState<'success' | 'failure' | null>(null);
    const [sendMethod, setSendMethod] = useState<'phone' | 'tag' | 'nfc' | 'qr'>('phone');
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [scanError, setScanError] = useState('');

    // Fee Logic: 1% Charge for P2P
    const FEE_PERCENT = 0.01;

    const handleScanResult = async (decodedText: string) => {
        setIsScanning(false);
        
        // Local Parsing for App QR Codes
        if (decodedText.startsWith('ipay:')) {
            const recipient = decodedText.replace('ipay:', '');
            setRecipient(recipient);
            return;
        }

        // AI Parsing Fallback
        try {
            const result = await parsePaymentIntent(decodedText);
            if (result.recipient) {
                setRecipient(result.recipient);
            }
            if (result.amount) {
                setAmount(result.amount.toString());
            }
            if (result.error) {
                setScanError("Could not understand the scanned data.");
            }
        } catch (error) {
             console.error("AI Parsing failed", error);
             // Fallback: just use the raw text if it looks like a phone/username
             if (decodedText.length < 20) {
                 setRecipient(decodedText);
             } else {
                 setScanError("Could not process QR code.");
             }
        }
    };

    useEffect(() => {
        let scanner: Html5Qrcode | null = null;
        
        if (isScanning && sendMethod === 'qr') {
             // Small delay to ensure DOM element exists
             setTimeout(() => {
                 if (document.getElementById('qr-reader-send')) {
                     scanner = new Html5Qrcode("qr-reader-send");
                     scanner.start(
                         { facingMode: "environment" },
                         { fps: 10, qrbox: 250 },
                         (text) => {
                             handleScanResult(text);
                             scanner?.stop().catch(console.error);
                             scanner?.clear();
                         },
                         (err) => {
                             // ignore errors for better UX
                         }
                     ).catch(err => {
                         console.error("Error starting scanner:", err);
                         setScanError("Camera permission denied or error starting camera.");
                     });
                 }
             }, 100);
        }

        if (isScanning && sendMethod === 'nfc') {
            if ('NDEFReader' in window) {
                // @ts-ignore
                const ndef = new NDEFReader();
                ndef.scan().then(() => {
                    ndef.onreading = (event: any) => {
                        const decoder = new TextDecoder();
                        for (const record of event.message.records) {
                            const text = decoder.decode(record.data);
                            handleScanResult(text);
                        }
                    };
                }).catch((err: any) => {
                    console.error("NFC Error:", err);
                    setScanError("NFC not supported or permission denied.");
                });
            } else {
                setScanError("NFC not supported on this device.");
            }
        }

        return () => {
            if (scanner && scanner.isScanning) {
                scanner.stop().then(() => scanner?.clear()).catch(console.error);
            }
        };
    }, [isScanning, sendMethod]);

    const handleSend = (e: React.FormEvent) => { 
        e.preventDefault(); 
        let amountNum = parseFloat(amount);
        if (recipient && amountNum > 0) { 
            const amountUSD = currency === 'ZMW' ? amountNum / conversionRate : amountNum;
            const feeUSD = amountUSD * FEE_PERCENT;
            const totalDeduction = amountUSD + feeUSD;

            if (totalDeduction > balanceUSD) { 
                setStatus('failure');
            } else { 
                // We pass the fee so the main dashboard can deduct it properly
                addTransaction({ 
                    icon: <ArrowUpRight size={18} className="text-gray-800 dark:text-white"/>, 
                    type: `Sent to ${recipient}`, 
                    date: 'Just now', 
                    amount: amountUSD.toString(), 
                    isCredit: false,
                    fee: feeUSD,
                    category: 'send'
                }, feeUSD); // Pass fee to deduction logic
                setStatus('success');
            }
        } 
    };

    const handleScan = () => {
        setIsScanning(true);
        setScanError('');
    };

    const resetAndBack = () => { setStatus(null); onBack(); };
    if (status) {
        const symbol = currency === 'USD' ? '$' : 'K';
        const displayedAmount = parseFloat(amount).toFixed(2);
        return <div className="flex flex-col h-full bg-gray-50 dark:bg-black"><ScreenHeader title="Send Money" onBack={resetAndBack} /><TransactionStatusScreen status={status} title={status === 'success' ? 'Success!' : 'Transaction Failed'} message={status === 'success' ? `You have successfully sent ${symbol}${displayedAmount} to ${recipient}.` : 'Amount + Fee exceeds your available balance.'} onDone={resetAndBack} accentColor={accentColor} /></div>;
    }
    
    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-black">
            <ScreenHeader title="Send Money" onBack={onBack} />
            
            {/* Method Toggle */}
            <div className="px-6 pt-4">
                <div className="flex bg-gray-200 dark:bg-[#1c1c1e] p-1 rounded-xl">
                    <button onClick={() => { setSendMethod('phone'); setIsScanning(false); }} className={`flex-1 py-2 rounded-lg flex items-center justify-center transition-all ${sendMethod === 'phone' ? 'bg-white dark:bg-[#2c2c2e] shadow-sm text-black dark:text-white' : 'text-gray-500'}`}>
                        <Smartphone size={20} />
                    </button>
                    <button onClick={() => { setSendMethod('tag'); setIsScanning(false); }} className={`flex-1 py-2 rounded-lg flex items-center justify-center transition-all ${sendMethod === 'tag' ? 'bg-white dark:bg-[#2c2c2e] shadow-sm text-black dark:text-white' : 'text-gray-500'}`}>
                        <AtSign size={20} />
                    </button>
                    <button onClick={() => { setSendMethod('nfc'); setIsScanning(false); }} className={`flex-1 py-2 rounded-lg flex items-center justify-center transition-all ${sendMethod === 'nfc' ? 'bg-white dark:bg-[#2c2c2e] shadow-sm text-black dark:text-white' : 'text-gray-500'}`}>
                        <Nfc size={20} />
                    </button>
                    <button onClick={() => { setSendMethod('qr'); setIsScanning(false); }} className={`flex-1 py-2 rounded-lg flex items-center justify-center transition-all ${sendMethod === 'qr' ? 'bg-white dark:bg-[#2c2c2e] shadow-sm text-black dark:text-white' : 'text-gray-500'}`}>
                        <QrCode size={20} />
                    </button>
                </div>
                <p className="text-center text-xs text-gray-500 mt-2 font-medium uppercase tracking-wide">
                    {sendMethod === 'phone' && 'Send to Phone Number'}
                    {sendMethod === 'tag' && 'Send to iPayTag'}
                    {sendMethod === 'nfc' && 'Tap to Pay (NFC)'}
                    {sendMethod === 'qr' && 'Scan QR Code'}
                </p>
            </div>

            <form onSubmit={handleSend} className="p-6 space-y-6 flex-grow">
                {sendMethod === 'phone' && (
                    <FormInput label="Recipient's Phone" type="tel" value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="+260 9..." required accentColor={accentColor} />
                )}
                
                {sendMethod === 'tag' && (
                    <FormInput label="Recipient's iPayTag" type="text" value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="@username" required accentColor={accentColor} />
                )}

                {(sendMethod === 'nfc' || sendMethod === 'qr') && (
                    <div className="flex flex-col items-center justify-center py-8 space-y-4 bg-gray-100 dark:bg-[#1c1c1e] rounded-2xl border-2 border-dashed border-gray-300 dark:border-[#333] min-h-[300px]">
                        {isScanning ? (
                            sendMethod === 'qr' ? (
                                <div id="qr-reader-send" className="w-full max-w-xs"></div>
                            ) : (
                                <div className="animate-pulse flex flex-col items-center">
                                    <div className={`w-16 h-16 rounded-full ${themes[accentColor].bg} flex items-center justify-center mb-4`}>
                                        <Nfc size={32} className="animate-spin" />
                                    </div>
                                    <p className="text-sm font-bold">Listening for NFC...</p>
                                    <p className="text-xs text-gray-500 mt-2">Bring device close</p>
                                </div>
                            )
                        ) : recipient ? (
                            <div className="flex flex-col items-center">
                                <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-2">
                                    <CheckCircle size={32} />
                                </div>
                                <p className="text-sm font-bold text-green-600">Recipient Found</p>
                                <p className="text-xs text-gray-500">{recipient}</p>
                                <button type="button" onClick={() => setRecipient('')} className="text-xs text-red-500 mt-2 underline">Clear</button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <button type="button" onClick={handleScan} className="flex flex-col items-center group">
                                    <div className={`w-20 h-20 rounded-full bg-white dark:bg-[#2c2c2e] flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform mb-4`}>
                                        {sendMethod === 'nfc' ? <Nfc size={40} className="text-gray-400 group-hover:text-black dark:group-hover:text-white" /> : <QrCode size={40} className="text-gray-400 group-hover:text-black dark:group-hover:text-white" />}
                                    </div>
                                    <p className="text-sm font-bold text-gray-500 group-hover:text-black dark:group-hover:text-white">Tap to Scan</p>
                                </button>
                                {scanError && <p className="text-xs text-red-500 mt-4">{scanError}</p>}
                            </div>
                        )}
                    </div>
                )}

                <FormInput label={`Amount (${currency === 'USD' ? '$' : 'K'})`} type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" required accentColor={accentColor} />
                
                <div className="pt-4">
                    <p className="text-xs text-gray-500 mb-2 text-center">Transaction Fee: 1%</p>
                    <button type="submit" disabled={!recipient || !amount} className={`w-full ${themes[accentColor].bg} text-black font-bold py-3 px-4 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed`}>Send Money</button>
                </div>
            </form>
        </div>
    );
};

const ClientWithdrawScreen: FC<{ onBack: () => void; accentColor: ThemeColor; currency: string; addTransaction: any; balanceUSD: number; conversionRate: number }> = ({ onBack, accentColor, currency, addTransaction, balanceUSD, conversionRate }) => {
    const [status, setStatus] = useState<'success' | 'failure' | null>(null);
    const [withdrawMethod, setWithdrawMethod] = useState<'agent' | 'nfc' | 'qr' | 'phone'>('agent');
    const [amount, setAmount] = useState('');
    const [target, setTarget] = useState(''); // Agent ID, Phone, etc.
    const [isScanning, setIsScanning] = useState(false);
    const [scanError, setScanError] = useState('');
    
    // Fee Logic: 5% Charge for Withdrawal
    const FEE_PERCENT = 0.05;

    const handleScanResult = async (decodedText: string) => {
        setIsScanning(false);
        
        // Local Parsing for App QR Codes
        if (decodedText.startsWith('ipay:')) {
            const recipient = decodedText.replace('ipay:', '');
            setTarget(recipient);
            return;
        }

        // AI Parsing Fallback
        try {
            const result = await parsePaymentIntent(decodedText);
            if (result.recipient) {
                setTarget(result.recipient);
            }
            if (result.amount) {
                setAmount(result.amount.toString());
            }
            if (result.error) {
                setScanError("Could not understand the scanned data.");
            }
        } catch (error) {
             console.error("AI Parsing failed", error);
             // Fallback
             if (decodedText.length < 20) {
                 setTarget(decodedText);
             } else {
                 setScanError("Could not process QR code.");
             }
        }
    };

    useEffect(() => {
        let scanner: Html5Qrcode | null = null;
        
        if (isScanning && withdrawMethod === 'qr') {
             // Small delay to ensure DOM element exists
             setTimeout(() => {
                 if (document.getElementById('qr-reader-withdraw')) {
                     scanner = new Html5Qrcode("qr-reader-withdraw");
                     scanner.start(
                         { facingMode: "environment" },
                         { fps: 10, qrbox: 250 },
                         (text) => {
                             handleScanResult(text);
                             scanner?.stop().catch(console.error);
                             scanner?.clear();
                         },
                         (err) => {
                             // ignore errors
                         }
                     ).catch(err => {
                         console.error("Error starting scanner:", err);
                         setScanError("Camera permission denied or error starting camera.");
                     });
                 }
             }, 100);
        }

        if (isScanning && withdrawMethod === 'nfc') {
            if ('NDEFReader' in window) {
                // @ts-ignore
                const ndef = new NDEFReader();
                ndef.scan().then(() => {
                    ndef.onreading = (event: any) => {
                        const decoder = new TextDecoder();
                        for (const record of event.message.records) {
                            const text = decoder.decode(record.data);
                            handleScanResult(text);
                        }
                    };
                }).catch((err: any) => {
                    console.error("NFC Error:", err);
                    setScanError("NFC not supported or permission denied.");
                });
            } else {
                setScanError("NFC not supported on this device.");
            }
        }

        return () => {
            if (scanner && scanner.isScanning) {
                scanner.stop().then(() => scanner?.clear()).catch(console.error);
            }
        };
    }, [isScanning, withdrawMethod]);

    const handleWithdraw = (e: React.FormEvent) => {
        e.preventDefault();
        let amountNum = parseFloat(amount);
        
        if (amountNum > 0) {
            const amountUSD = currency === 'ZMW' ? amountNum / conversionRate : amountNum;
            const feeUSD = amountUSD * FEE_PERCENT;
            const totalDeduction = amountUSD + feeUSD;

            if (totalDeduction > balanceUSD) {
                setStatus('failure');
            } else {
                 addTransaction({
                    icon: <ArrowDown size={18} className="text-gray-800 dark:text-white" />,
                    type: target ? `Cash Withdrawal from ${target}` : "Cash Withdrawal",
                    date: 'Just now',
                    amount: amountUSD.toString(),
                    isCredit: false,
                    fee: feeUSD,
                    category: 'withdraw'
                 }, feeUSD);
                 setStatus('success');
            }
        }
    };

    const handleScan = () => {
        setIsScanning(true);
        setScanError('');
    };

    const resetAndBack = () => { setStatus(null); onBack(); };

    if (status) {
         return (
             <div className="flex flex-col h-full bg-gray-50 dark:bg-black">
                 <ScreenHeader title="Withdraw" onBack={resetAndBack} />
                 <TransactionStatusScreen 
                    status={status} 
                    title={status === 'success' ? 'Success!' : 'Insufficient Funds'} 
                    message={status === 'success' ? `You have withdrawn ${currency === 'USD' ? '$' : 'K'}${parseFloat(amount).toFixed(2)}.` : 'Your balance cannot cover the withdrawal + 5% fee.'} 
                    onDone={resetAndBack} 
                    accentColor={accentColor} 
                />
             </div>
         );
    }

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-black">
            <ScreenHeader title="Withdraw Cash" onBack={onBack} />
            
            {/* Method Toggle */}
            <div className="px-6 pt-4">
                <div className="flex bg-gray-200 dark:bg-[#1c1c1e] p-1 rounded-xl">
                    <button onClick={() => { setWithdrawMethod('agent'); setIsScanning(false); }} className={`flex-1 py-2 rounded-lg flex items-center justify-center transition-all ${withdrawMethod === 'agent' ? 'bg-white dark:bg-[#2c2c2e] shadow-sm text-black dark:text-white' : 'text-gray-500'}`}>
                        <User size={20} />
                    </button>
                    <button onClick={() => { setWithdrawMethod('nfc'); setIsScanning(false); }} className={`flex-1 py-2 rounded-lg flex items-center justify-center transition-all ${withdrawMethod === 'nfc' ? 'bg-white dark:bg-[#2c2c2e] shadow-sm text-black dark:text-white' : 'text-gray-500'}`}>
                        <Nfc size={20} />
                    </button>
                    <button onClick={() => { setWithdrawMethod('qr'); setIsScanning(false); }} className={`flex-1 py-2 rounded-lg flex items-center justify-center transition-all ${withdrawMethod === 'qr' ? 'bg-white dark:bg-[#2c2c2e] shadow-sm text-black dark:text-white' : 'text-gray-500'}`}>
                        <QrCode size={20} />
                    </button>
                    <button onClick={() => { setWithdrawMethod('phone'); setIsScanning(false); }} className={`flex-1 py-2 rounded-lg flex items-center justify-center transition-all ${withdrawMethod === 'phone' ? 'bg-white dark:bg-[#2c2c2e] shadow-sm text-black dark:text-white' : 'text-gray-500'}`}>
                        <Smartphone size={20} />
                    </button>
                </div>
                <p className="text-center text-xs text-gray-500 mt-2 font-medium uppercase tracking-wide">
                    {withdrawMethod === 'agent' && 'Withdraw via Agent iPayTag'}
                    {withdrawMethod === 'nfc' && 'Withdraw via NFC (ATM/Agent)'}
                    {withdrawMethod === 'qr' && 'Withdraw via QR Code'}
                    {withdrawMethod === 'phone' && 'Withdraw to Mobile Money'}
                </p>
            </div>

            <form onSubmit={handleWithdraw} className="p-6 space-y-6 flex-grow">
                {withdrawMethod === 'agent' && (
                    <FormInput label="Agent iPayTag" type="text" value={target} onChange={e => setTarget(e.target.value)} placeholder="@agentname" required accentColor={accentColor} />
                )}

                {withdrawMethod === 'phone' && (
                    <FormInput label="Mobile Money Number" type="tel" value={target} onChange={e => setTarget(e.target.value)} placeholder="+260 9..." required accentColor={accentColor} />
                )}

                {(withdrawMethod === 'nfc' || withdrawMethod === 'qr') && (
                    <div className="flex flex-col items-center justify-center py-8 space-y-4 bg-gray-100 dark:bg-[#1c1c1e] rounded-2xl border-2 border-dashed border-gray-300 dark:border-[#333] min-h-[300px]">
                        {isScanning ? (
                            withdrawMethod === 'qr' ? (
                                <div id="qr-reader-withdraw" className="w-full max-w-xs"></div>
                            ) : (
                                <div className="animate-pulse flex flex-col items-center">
                                    <div className={`w-16 h-16 rounded-full ${themes[accentColor].bg} flex items-center justify-center mb-4`}>
                                        <Nfc size={32} className="animate-spin" />
                                    </div>
                                    <p className="text-sm font-bold">Listening for NFC...</p>
                                    <p className="text-xs text-gray-500 mt-2">Bring device close</p>
                                </div>
                            )
                        ) : target ? (
                            <div className="flex flex-col items-center">
                                <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-2">
                                    <CheckCircle size={32} />
                                </div>
                                <p className="text-sm font-bold text-green-600">Source Verified</p>
                                <p className="text-xs text-gray-500">{target}</p>
                                <button type="button" onClick={() => setTarget('')} className="text-xs text-red-500 mt-2 underline">Clear</button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <button type="button" onClick={handleScan} className="flex flex-col items-center group">
                                    <div className={`w-20 h-20 rounded-full bg-white dark:bg-[#2c2c2e] flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform mb-4`}>
                                        {withdrawMethod === 'nfc' ? <Nfc size={40} className="text-gray-400 group-hover:text-black dark:group-hover:text-white" /> : <QrCode size={40} className="text-gray-400 group-hover:text-black dark:group-hover:text-white" />}
                                    </div>
                                    <p className="text-sm font-bold text-gray-500 group-hover:text-black dark:group-hover:text-white">Tap to Scan</p>
                                </button>
                                {scanError && <p className="text-xs text-red-500 mt-4">{scanError}</p>}
                            </div>
                        )}
                    </div>
                )}

                <FormInput label={`Amount to Withdraw (${currency === 'USD' ? '$' : 'K'})`} type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" required accentColor={accentColor} />
                
                <div className="pt-4">
                    <p className="text-xs text-gray-500 mb-2 text-center">Transaction Fee: 5%</p>
                    <button type="submit" disabled={!amount || (withdrawMethod !== 'nfc' && withdrawMethod !== 'qr' && !target)} className={`w-full ${themes[accentColor].bg} text-black font-bold py-3 px-4 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed`}>Withdraw Now</button>
                </div>
            </form>
        </div>
    );
};

const ClientHistoryScreen: FC<{ onBack: () => void; transactions: Transaction[]; accentColor: ThemeColor; currency: string; conversionRate: number }> = ({ onBack, transactions, accentColor, currency, conversionRate }) => (
    <div className="flex flex-col h-full bg-gray-100 dark:bg-black">
        <ScreenHeader title="All Transactions" onBack={onBack} />
        <div className="flex-grow p-4 overflow-y-auto no-scrollbar">
            <div className="bg-white dark:bg-[#1c1c1e] p-4 rounded-xl divide-y divide-gray-200 dark:divide-[#3a3a3c]">
                {transactions.length > 0 ? transactions.map((t, i) => (
                    <TransactionItem key={i} {...t} accentColor={accentColor} currency={currency} conversionRate={conversionRate}/>
                )) : <div className="text-center text-gray-500 py-8">No history yet</div>}
            </div>
        </div>
    </div>
);


// --- Agent Specific Screens (Updated for Interactivity) ---
interface AgentActionScreenProps {
    onBack: () => void;
    title: string;
    type: string;
    accentColor: ThemeColor;
    onConfirm: (type: string, amount: number, phone: string) => Promise<boolean | string>;
    agentBalance: number;
    currency: string;
    conversionRate: number;
}

const AgentActionScreen: FC<AgentActionScreenProps> = ({ onBack, title, type, accentColor, onConfirm, agentBalance, currency, conversionRate }) => {
    const [step, setStep] = useState(1);
    const [phone, setPhone] = useState('');
    const [amount, setAmount] = useState('');
    const [failureMessage, setFailureMessage] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [scanError, setScanError] = useState('');
    const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);
    const [requestStatus, setRequestStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);

    // Listen for updates to the pending request
    useEffect(() => {
        if (!pendingRequestId) return;

        const channel = supabase
            .channel(`request-${pendingRequestId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'pending_requests',
                    filter: `id=eq.${pendingRequestId}`
                },
                (payload) => {
                    console.log("Request updated:", payload);
                    if (payload.new.status === 'approved') {
                        setRequestStatus('approved');
                        setStep(2); // Success Screen
                    } else if (payload.new.status === 'rejected') {
                        setRequestStatus('rejected');
                        setFailureMessage('Client declined the withdrawal request.');
                        setStep(3); // Failure Screen
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [pendingRequestId]);

    const handleScanResult = (decodedText: string) => {
        setIsScanning(false);
        // Simple parsing for ipay:username or raw text
        const cleanText = decodedText.replace('ipay:', '');
        setPhone(cleanText);
    };

    useEffect(() => {
        let scanner: Html5Qrcode | null = null;
        if (isScanning) {
             setTimeout(() => {
                 if (document.getElementById('qr-reader-agent')) {
                     scanner = new Html5Qrcode("qr-reader-agent");
                     scanner.start(
                         { facingMode: "environment" },
                         { fps: 10, qrbox: 250 },
                         (text) => {
                             handleScanResult(text);
                             scanner?.stop().catch(console.error);
                             scanner?.clear();
                         },
                         (err) => { }
                     ).catch(err => {
                         console.error("Error starting scanner:", err);
                         setScanError("Camera permission denied.");
                     });
                 }
             }, 100);
        }
        return () => {
            if (scanner && scanner.isScanning) {
                scanner.stop().then(() => scanner?.clear()).catch(console.error);
            }
        };
    }, [isScanning]);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        let amt = parseFloat(amount);
        
        // Convert input to USD if currency is ZMW
        if (currency === 'ZMW') {
            amt = amt / conversionRate;
        }
        
        // Validation Logic (Pre-check)
        if (type === 'Deposit') {
            if (amt > agentBalance) {
                setFailureMessage('Insufficient Float Balance');
                setStep(3); // Go to Failure Screen
                return;
            }
        }
        
        // Execute Transaction
        const result = await onConfirm(type, amt, phone);
        
        if (typeof result === 'string') {
            // It's a pending request ID (Withdrawal flow)
            setPendingRequestId(result);
            setRequestStatus('pending');
            // Stay on loading/waiting screen
        } else if (result === true) {
             setStep(2); // Success state
        } else {
            // Determine error message based on type to prevent confusion
            if (type === 'Withdrawal') {
                 setFailureMessage('Transaction Declined: Low Client Funds or User Not Found');
            } else {
                 setFailureMessage('Transaction Failed'); 
            }
            setStep(3); // Go to Failure Screen
        }
    };

    const handleRetry = () => {
        setStep(1);
        setFailureMessage('');
        setPendingRequestId(null);
        setRequestStatus(null);
    }

    // Determine display symbol and converted balance for UI
    const symbol = currency === 'ZMW' ? 'K' : '$';
    const displayedBalance = currency === 'ZMW' ? agentBalance * conversionRate : agentBalance;

    if (step === 2) {
        return (
            <div className="flex flex-col h-full bg-gray-50 dark:bg-black">
                <ScreenHeader title={title} onBack={onBack} />
                <TransactionStatusScreen 
                    status="success" 
                    title="Success!" 
                    message={requestStatus === 'approved' ? "Client approved the withdrawal." : `Successfully processed ${type} of ${symbol}${amount} for ${phone}. Commission earned.`} 
                    onDone={onBack} 
                    accentColor={accentColor} 
                />
            </div>
        );
    }

    if (step === 3) {
        return (
            <div className="flex flex-col h-full bg-gray-50 dark:bg-black">
                <ScreenHeader title={title} onBack={handleRetry} />
                <TransactionStatusScreen 
                    status="failure" 
                    title="Transaction Failed" 
                    message={failureMessage} 
                    onDone={handleRetry} 
                    accentColor={accentColor} 
                />
            </div>
        );
    }

    if (requestStatus === 'pending') {
        return (
            <div className="flex flex-col h-full bg-gray-50 dark:bg-black">
                <ScreenHeader title={title} onBack={onBack} />
                <div className="flex flex-col items-center justify-center flex-grow p-6 text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-black dark:border-white mb-6"></div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Waiting for Client...</h2>
                    <p className="text-gray-500 dark:text-gray-400 max-w-xs">
                        We've sent a request to the client's device. Please ask them to approve the withdrawal.
                    </p>
                    <button onClick={handleRetry} className="mt-8 text-red-500 font-bold">Cancel Request</button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-black">
            <ScreenHeader title={title} onBack={onBack} />
            <div className="p-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex items-start gap-3 mb-2">
                    <AlertCircle size={20} className="text-blue-500 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-blue-600 dark:text-blue-400">Agent Float Available</p>
                        <p className="text-xl font-bold text-gray-800 dark:text-white">{symbol}{displayedBalance.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                    </div>
                </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6 flex-grow pt-2">
                {isScanning ? (
                    <div className="flex flex-col items-center justify-center py-8 space-y-4 bg-gray-100 dark:bg-[#1c1c1e] rounded-2xl border-2 border-dashed border-gray-300 dark:border-[#333] min-h-[300px]">
                        <div id="qr-reader-agent" className="w-full max-w-xs"></div>
                        <button type="button" onClick={() => setIsScanning(false)} className="text-red-500 font-bold mt-4">Cancel Scan</button>
                        {scanError && <p className="text-xs text-red-500 mt-2">{scanError}</p>}
                    </div>
                ) : (
                    <>
                        <div className="relative">
                            <FormInput label="Client Phone / Tag" type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+260 9... or @tag" required accentColor={accentColor} />
                            <button type="button" onClick={() => setIsScanning(true)} className="absolute right-0 top-0 text-blue-500 text-xs font-bold flex items-center gap-1 p-1">
                                <QrCode size={14} /> Scan QR
                            </button>
                        </div>
                        {type !== 'Registration' && (
                            <FormInput 
                                label={`Amount (${symbol})`} 
                                type="number" 
                        step="0.01" 
                        value={amount} 
                        onChange={e => setAmount(e.target.value)} 
                        placeholder="0.00" 
                        required 
                        accentColor={accentColor} 
                    />
                )}
                <div className="pt-4">
                    <button type="submit" className={`w-full ${themes[accentColor].bg} text-black font-bold py-3 px-4 rounded-full hover:opacity-90 transition-opacity`}>
                        Process {type}
                    </button>
                </div>
                </>
            )}
            </form>
        </div>
    );
};

// --- Approval Modal Component ---
const ApprovalModal: FC<{ 
    request: PendingRequest; 
    onApprove: () => void; 
    onReject: () => void; 
    accentColor: ThemeColor;
    currency: string;
    conversionRate: number;
}> = ({ request, onApprove, onReject, accentColor, currency, conversionRate }) => {
    const symbol = currency === 'USD' ? '$' : 'K';
    const displayAmount = (currency === 'ZMW' ? request.amount * conversionRate : request.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#1c1c1e] w-full max-w-sm rounded-3xl p-6 shadow-2xl transform transition-all scale-100">
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center mb-4 animate-pulse">
                        <AlertCircle size={32} />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white mb-1">Withdrawal Request</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Agent <span className="font-bold text-gray-800 dark:text-white">{request.agent_name || 'Unknown'}</span> wants to withdraw funds.
                    </p>
                </div>

                <div className="bg-gray-50 dark:bg-[#2c2c2e] p-4 rounded-2xl mb-8 flex flex-col items-center">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Amount</span>
                    <span className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">{symbol}{displayAmount}</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={onReject}
                        className="py-4 rounded-xl font-bold bg-red-100 text-red-600 hover:bg-red-200 transition-colors flex items-center justify-center gap-2"
                    >
                        <X size={20} strokeWidth={3} /> Decline
                    </button>
                    <button 
                        onClick={onApprove}
                        className={`py-4 rounded-xl font-bold ${themes[accentColor].bg} text-black hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg`}
                    >
                        <Check size={20} strokeWidth={3} /> Approve
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Agent Reports Screen (Advanced Analytics) ---
interface ReportsScreenProps {
    onBack: () => void;
    accentColor: ThemeColor;
    agentTransactions: Transaction[];
    commissionUSD: number;
    currency: string;
    conversionRate: number;
    onWithdrawCommission: () => void;
}

const ReportsScreen: FC<ReportsScreenProps> = ({ onBack, accentColor, agentTransactions, commissionUSD, currency, conversionRate, onWithdrawCommission }) => {
    // 1. Calculate Analytics
    const totalTransactions = agentTransactions.length;
    const depositVolumeUSD = agentTransactions.filter(t => t.type.includes('Deposit')).reduce((acc, t) => acc + parseFloat(t.amount), 0);
    const withdrawVolumeUSD = agentTransactions.filter(t => t.type.includes('Withdraw')).reduce((acc, t) => acc + parseFloat(t.amount), 0);
    const totalVolumeUSD = depositVolumeUSD + withdrawVolumeUSD;
    const avgTicketUSD = totalTransactions > 0 ? totalVolumeUSD / totalTransactions : 0;

    const symbol = currency === 'ZMW' ? 'K' : '$';

    // Display Values
    const displayedTotalVolume = currency === 'ZMW' ? totalVolumeUSD * conversionRate : totalVolumeUSD;
    const displayedAvgTicket = currency === 'ZMW' ? avgTicketUSD * conversionRate : avgTicketUSD;
    const displayedCommission = currency === 'ZMW' ? commissionUSD * conversionRate : commissionUSD;
    
    // Bar Chart Calculation (Volume Split)
    const depositPercent = totalVolumeUSD > 0 ? (depositVolumeUSD / totalVolumeUSD) * 100 : 50;
    const withdrawPercent = totalVolumeUSD > 0 ? (withdrawVolumeUSD / totalVolumeUSD) * 100 : 50;

    // --- Mock Data for Visual Demo of "Volume vs Date" ---
    const trendData = [
        { label: 'M', value: 1200 },
        { label: 'T', value: 1900 },
        { label: 'W', value: 1500 },
        { label: 'T', value: 2800 },
        { label: 'F', value: 2100 },
        { label: 'S', value: 3500 },
        { label: 'S', value: totalVolumeUSD > 0 ? totalVolumeUSD : 4200 } // Use current volume for today if available
    ];
    
    // Scale data for SVG
    const maxVal = Math.max(...trendData.map(d => d.value));
    
    // Generate SVG Points
    const points = trendData.map((d, i) => {
        const x = (i / (trendData.length - 1)) * 100; // X percentage
        const y = 100 - ((d.value / maxVal) * 80); // Y percentage (leave 20% padding at top)
        return `${x},${y}`;
    }).join(' ');

    const fillPath = `${points} 100,100 0,100`;

    return (
        <div className="flex flex-col h-full bg-gray-100 dark:bg-black">
            <ScreenHeader title="Agent Reports" onBack={onBack} />
            <div className="p-6 flex-grow overflow-y-auto space-y-6 no-scrollbar">
                
                {/* Commission Withdrawal Card */}
                <div className={`${themes[accentColor].bg} p-6 rounded-2xl shadow-lg relative overflow-hidden`}>
                    <div className="relative z-10 text-black">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="text-sm font-bold opacity-80 uppercase tracking-wider">Unclaimed Commission</p>
                                <h2 className="text-4xl font-black mt-1">
                                    {symbol}{displayedCommission.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                </h2>
                            </div>
                            <Award size={32} className="opacity-80" />
                        </div>
                        <button 
                            onClick={onWithdrawCommission}
                            disabled={commissionUSD <= 0}
                            className={`mt-4 w-full py-3 bg-black text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity ${commissionUSD <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <Wallet size={18} /> Cash Out to Float
                        </button>
                    </div>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-[#1c1c1e] p-4 rounded-xl shadow-sm">
                        <div className="flex items-center gap-2 mb-2 text-gray-500 dark:text-gray-400">
                            <Activity size={16} /> <span className="text-xs font-bold uppercase">Volume</span>
                        </div>
                        <p className="text-xl font-bold text-gray-800 dark:text-white">{symbol}{displayedTotalVolume.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</p>
                    </div>
                    <div className="bg-white dark:bg-[#1c1c1e] p-4 rounded-xl shadow-sm">
                        <div className="flex items-center gap-2 mb-2 text-gray-500 dark:text-gray-400">
                            <BarChart2 size={16} /> <span className="text-xs font-bold uppercase">Avg Ticket</span>
                        </div>
                        <p className="text-xl font-bold text-gray-800 dark:text-white">{symbol}{displayedAvgTicket.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</p>
                    </div>
                </div>

                {/* Volume vs Date Trend Chart */}
                <div className="bg-white dark:bg-[#1c1c1e] p-5 rounded-xl shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase">Volume Trend (7 Days)</h3>
                        <TrendingUp size={16} className={themes[accentColor].text} />
                    </div>
                    
                    <div className="h-32 w-full relative">
                        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                            {/* Gradient Definition */}
                            <defs>
                                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={themes[accentColor].base} stopOpacity="0.2" />
                                    <stop offset="100%" stopColor={themes[accentColor].base} stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            
                            {/* Area Fill */}
                            <polygon points={fillPath} fill="url(#trendGradient)" />
                            
                            {/* Line */}
                            <polyline 
                                fill="none" 
                                stroke={themes[accentColor].base} 
                                strokeWidth="3" 
                                points={points} 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                            />
                            
                            {/* Dots */}
                            {trendData.map((d, i) => {
                                const x = (i / (trendData.length - 1)) * 100;
                                const y = 100 - ((d.value / maxVal) * 80);
                                return (
                                    <circle key={i} cx={x} cy={y} r="2" fill="white" stroke={themes[accentColor].base} strokeWidth="2" />
                                );
                            })}
                        </svg>
                        
                        {/* X-Axis Labels */}
                        <div className="flex justify-between mt-2 text-xs text-gray-400 font-medium">
                            {trendData.map((d, i) => (
                                <span key={i}>{d.label}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Visual Charts (CSS Based) */}
                <div className="bg-white dark:bg-[#1c1c1e] p-5 rounded-xl shadow-sm">
                    <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase mb-4">Volume Split</h3>
                    <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
                        <div className={`h-full ${themes[accentColor].bg}`} style={{width: `${depositPercent}%`}}></div>
                        <div className="h-full bg-blue-500" style={{width: `${withdrawPercent}%`}}></div>
                    </div>
                    <div className="flex justify-between mt-2 text-xs font-medium">
                        <div className="flex items-center gap-1"><div className={`w-2 h-2 rounded-full ${themes[accentColor].bg}`}></div> Deposits ({depositPercent.toFixed(0)}%)</div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Withdrawals ({withdrawPercent.toFixed(0)}%)</div>
                    </div>
                </div>

                {/* Detailed Commission Ledger */}
                <div>
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-3">Commission Ledger</h3>
                    <div className="bg-white dark:bg-[#1c1c1e] rounded-xl overflow-hidden divide-y divide-gray-100 dark:divide-[#2c2c2e]">
                        {agentTransactions.length > 0 ? agentTransactions.map((t, i) => {
                            const txAmountUSD = parseFloat(t.amount);
                            const displayedTxAmount = currency === 'ZMW' ? txAmountUSD * conversionRate : txAmountUSD;
                            const comm = t.commission || 0;
                            const displayedComm = currency === 'ZMW' ? comm * conversionRate : comm;

                            return (
                                <div key={i} className="p-4 flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-gray-800 dark:text-white text-sm">{t.type}</p>
                                        <p className="text-xs text-gray-500">{t.date} • Vol: {symbol}{displayedTxAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                                    </div>
                                    {displayedComm > 0 && (
                                        <div className="text-right">
                                            <p className={`font-bold ${themes[accentColor].text}`}>+{symbol}{displayedComm.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                                            <p className="text-xs text-gray-400 uppercase tracking-wider">Comm.</p>
                                        </div>
                                    )}
                                </div>
                            );
                        }) : (
                            <div className="p-8 text-center text-gray-500">No transactions recorded yet.</div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};


// --- Agent Registration Screen ---
const AgentRegistrationScreen: FC<{ onBack: () => void; onRegister: (data: any) => void; accentColor: ThemeColor }> = ({ onBack, onRegister, accentColor }) => {
    const [formData, setFormData] = useState({
        fullName: '',
        idNumber: '',
        businessName: '',
        address: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        
        // Simulate API call / Verification
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // In a real app, we would save this to Supabase 'agent_applications' table
        // For now, we call the onRegister callback which should update the profile status
        onRegister(formData);
        setLoading(false);
    };

    return (
        <div className="flex flex-col h-full bg-gray-100 dark:bg-black">
            <ScreenHeader title="Become an Agent" onBack={onBack} />
            <div className="p-6 flex-grow overflow-y-auto no-scrollbar">
                <div className="bg-white dark:bg-[#1c1c1e] p-6 rounded-2xl shadow-sm mb-6">
                    <div className={`w-16 h-16 rounded-full ${themes[accentColor].bg} flex items-center justify-center mb-4 mx-auto`}>
                        <Briefcase size={32} className="text-black" />
                    </div>
                    <h2 className="text-xl font-bold text-center text-gray-800 dark:text-white mb-2">Join the Agency</h2>
                    <p className="text-center text-gray-500 dark:text-gray-400 text-sm">Earn commissions by helping clients deposit and withdraw cash.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <FormInput type="text" label="Full Legal Name" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} placeholder="As on ID" required accentColor={accentColor} />
                    <FormInput type="text" label="ID / Passport Number" value={formData.idNumber} onChange={e => setFormData({...formData, idNumber: e.target.value})} placeholder="XXXX-XXXX-XXXX" required accentColor={accentColor} />
                    <FormInput type="text" label="Business Name (Optional)" value={formData.businessName} onChange={e => setFormData({...formData, businessName: e.target.value})} placeholder="e.g. Lusaka Trading" accentColor={accentColor} />
                    <FormInput type="text" label="Physical Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Street, City" required accentColor={accentColor} />
                    
                    <div className="pt-4">
                        <button type="submit" disabled={loading} className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest ${themes[accentColor].bg} text-black shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2`}>
                            {loading ? 'Submitting...' : 'Submit Application'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Settings Screen ---
const SettingsScreen: FC<{ 
    onBack: () => void; 
    theme: string; 
    setTheme: (t: string) => void; 
    accentColor: ThemeColor; 
    setAccentColor: (c: ThemeColor) => void; 
    onLogout: () => void; 
    setScreen: (s: string) => void;
    view: 'client' | 'agent';
    setView: (v: 'client' | 'agent') => void;
    profile: UserProfile;
}> = ({ onBack, theme, setTheme, accentColor, setAccentColor, onLogout, setScreen, view, setView, profile }) => (
    <div className="flex flex-col flex-1 min-h-full bg-gray-100 dark:bg-black">
        <ScreenHeader title="Settings" onBack={onBack} />
        <div className="p-6 space-y-8 overflow-y-auto no-scrollbar flex-grow">
            {/* Mode Switcher - Prominent */}
            {profile.agentStatus === 'approved' ? (
                <div className={`${themes[accentColor].bg} p-6 rounded-2xl shadow-lg relative overflow-hidden`}>
                    <div className="relative z-10 text-black">
                        <h3 className="text-lg font-black uppercase tracking-wider mb-1">Current Mode</h3>
                        <div className="flex items-center gap-2 mb-4">
                            {view === 'client' ? <User size={32} /> : <Briefcase size={32} />}
                            <span className="text-3xl font-black">{view === 'client' ? 'Client' : 'Agent'}</span>
                        </div>
                        <button 
                            onClick={() => { 
                                const newView = view === 'client' ? 'agent' : 'client';
                                setView(newView);
                                setScreen('home');
                            }}
                            className="w-full py-3 bg-black text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                        >
                            <RefreshCw size={18} /> Switch to {view === 'client' ? 'Agent' : 'Client'} View
                        </button>
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                </div>
            ) : (
                <div className="bg-white dark:bg-[#1c1c1e] p-6 rounded-2xl shadow-sm relative overflow-hidden border border-gray-200 dark:border-[#333]">
                    <div className="relative z-10">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Become an Agent</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Earn commissions by facilitating transactions for others.</p>
                        {profile.agentStatus === 'pending' ? (
                            <div className="w-full py-3 bg-yellow-100 text-yellow-700 rounded-xl font-bold flex items-center justify-center gap-2">
                                <Clock size={18} /> Application Pending
                            </div>
                        ) : (
                            <button 
                                onClick={() => setScreen('agentRegistration')}
                                className={`w-full py-3 ${themes[accentColor].bg} text-black rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity`}
                            >
                                <Briefcase size={18} /> Register as Agent
                            </button>
                        )}
                    </div>
                </div>
            )}

            <div>
                 <h3 className="text-lg font-bold mb-3 text-gray-800 dark:text-white">Profile</h3>
                 <button onClick={() => setScreen('profileEditor')} className="w-full bg-white dark:bg-[#1c1c1e] p-4 rounded-xl flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#2c2c2e] transition-colors">
                    <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500"><User size={20} /></div><div className="text-left"><p className="font-bold text-gray-800 dark:text-white">Edit Profile</p><p className="text-xs text-gray-500">Name, Avatar & Vibe</p></div></div><Edit3 size={18} className="text-gray-400" />
                 </button>
            </div>
            <div>
                <h3 className="text-lg font-bold mb-3 text-gray-800 dark:text-white">Appearance</h3>
                <div className="bg-white dark:bg-[#1c1c1e] rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-800 dark:text-white">Theme</p>
                        <div className="flex items-center bg-gray-200 dark:bg-[#2c2c2e] rounded-full p-1">
                            <button onClick={() => setTheme('light')} className={`px-3 py-1 text-sm font-bold rounded-full transition-colors flex items-center gap-2 ${theme === 'light' ? `${themes[accentColor].bg} text-black` : 'text-gray-600 dark:text-gray-300'}`}><Sun size={16}/> Light</button>
                            <button onClick={() => setTheme('dark')} className={`px-3 py-1 text-sm font-bold rounded-full transition-colors flex items-center gap-2 ${theme === 'dark' ? `${themes[accentColor].bg} text-black` : 'text-gray-300'}`}><Moon size={16}/> Dark</button>
                        </div>
                    </div>
                </div>
            </div>
             <div>
                <h3 className="text-lg font-bold mb-3 text-gray-800 dark:text-white">Accent Color</h3>
                <div className="bg-white dark:bg-[#1c1c1e] rounded-xl p-4">
                    <div className="flex flex-wrap justify-around gap-2">
                        {(Object.keys(themes) as ThemeColor[]).map(color => (
                            <button key={color} onClick={() => setAccentColor(color)} className={`w-10 h-10 rounded-full ${themes[color].bg} transition-transform transform hover:scale-110 ${accentColor === color ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#1c1c1e]' : ''}`} style={{'--tw-ring-color': themes[accentColor].base} as React.CSSProperties} />
                        ))}
                    </div>
                </div>
            </div>
            {profile.role === 'admin' && (
                <div>
                     <h3 className="text-lg font-bold mb-3 text-gray-800 dark:text-white">Admin</h3>
                     <button onClick={() => setScreen('admin')} className="w-full bg-white dark:bg-[#1c1c1e] p-4 rounded-xl flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#2c2c2e] transition-colors">
                        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500"><Shield size={20} /></div><div className="text-left"><p className="font-bold text-gray-800 dark:text-white">Admin Portal</p><p className="text-xs text-gray-500">Manage Users & System</p></div></div><ChevronRight size={18} className="text-gray-400" />
                     </button>
                </div>
            )}
            <div>
                 <h3 className="text-lg font-bold mb-3 text-gray-800 dark:text-white">Account</h3>
                 <button onClick={onLogout} className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors border border-red-500/20"><LogOut size={20} /> Log Out</button>
            </div>
        </div>
    </div>
);


// --- Client Dashboard & Tools ---
const ClientToolsScreen: FC<{ onBack: () => void; accentColor: ThemeColor; setScreen: (s: string) => void }> = ({ onBack, accentColor, setScreen }) => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    const previousMonth = date.toLocaleString('default', { month: 'long' });

    return (
    <div className="flex flex-col flex-1 min-h-full bg-gray-100 dark:bg-black">
        <ScreenHeader title="Dashboard & Tools" onBack={onBack} />
        <div className="p-6 space-y-6 flex-grow">
            <div onClick={() => setScreen('agentMap')} className="bg-white dark:bg-[#1c1c1e] p-6 rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2c2c2e] transition-colors text-center">
                <div className="flex justify-center items-center"><MapPin size={32} className={`${themes[accentColor].text} mb-3`} /></div>
                <h3 className="font-bold text-lg text-gray-800 dark:text-white">Find Agent</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Locate nearby agents on the map.</p>
            </div>
            <div onClick={() => setScreen('spendingStory')} className="bg-white dark:bg-[#1c1c1e] p-6 rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2c2c2e] transition-colors text-center">
                <div className="flex justify-center items-center"><Sparkles size={32} className={`${themes[accentColor].text} mb-3`} /></div>
                <h3 className="font-bold text-lg text-gray-800 dark:text-white">Your {previousMonth} Story</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">See a visual breakdown of your spending habits.</p>
            </div>
            <div onClick={() => setScreen('savingsQuest')} className="bg-white dark:bg-[#1c1c1e] p-6 rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2c2c2e] transition-colors text-center">
                <div className="flex justify-center items-center"><PiggyBank size={32} className={`${themes[accentColor].text} mb-3`} /></div>
                <h3 className="font-bold text-lg text-gray-800 dark:text-white">Savings Quest: Level Up Your Funds</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">See your savings grow with fun challenges and rewards.</p>
            </div>
            <div onClick={() => setScreen('clientQRCode')} className="bg-white dark:bg-[#1c1c1e] p-6 rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2c2c2e] transition-colors text-center">
                <div className="flex justify-center items-center"><QrCode size={32} className={`${themes[accentColor].text} mb-3`} /></div>
                <h3 className="font-bold text-lg text-gray-800 dark:text-white">My QR Code</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Share your code for quick transactions.</p>
            </div>
        </div>
    </div>
    );
};

const ClientQRCodeScreen: FC<{ onBack: () => void; accentColor: ThemeColor; profile: UserProfile }> = ({ onBack, accentColor, profile }) => {
    const qrValue = `ipay:${profile.name.replace('@', '')}`; // e.g., ipay:username

    return (
        <div className="flex flex-col h-full bg-gray-100 dark:bg-black">
            <ScreenHeader title="My QR Code" onBack={onBack} />
            <div className="flex-grow flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-white p-8 rounded-3xl shadow-xl mb-8 relative w-full max-w-xs">
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-200">
                         <img src={getDisplayAvatarUrl(profile)} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                    <div className="mt-8 mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">{profile.name}</h2>
                        <p className="text-gray-500 text-sm font-medium">Scan to pay or withdraw</p>
                    </div>
                    <div className="flex justify-center">
                        <QRCodeCanvas value={qrValue} size={200} level={"H"} />
                    </div>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs font-medium">
                    Show this code to an agent to withdraw cash or receive a deposit.
                </p>
            </div>
        </div>
    );
};

const AgentToolsScreen: FC<{ onBack: () => void; accentColor: ThemeColor; setScreen: (s: string) => void }> = ({ onBack, accentColor, setScreen }) => {
    return (
    <div className="flex flex-col flex-1 min-h-full bg-gray-100 dark:bg-black">
        <ScreenHeader title="Agent Tools" onBack={onBack} />
        <div className="p-6 space-y-6 flex-grow">
            <div onClick={() => setScreen('agentQRCode')} className="bg-white dark:bg-[#1c1c1e] p-6 rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2c2c2e] transition-colors text-center">
                <div className="flex justify-center items-center"><QrCode size={32} className={`${themes[accentColor].text} mb-3`} /></div>
                <h3 className="font-bold text-lg text-gray-800 dark:text-white">Agent QR Code</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Quick withdraw for clients.</p>
            </div>
            <div onClick={() => setScreen('agentReports')} className="bg-white dark:bg-[#1c1c1e] p-6 rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2c2c2e] transition-colors text-center">
                <div className="flex justify-center items-center"><BarChart2 size={32} className={`${themes[accentColor].text} mb-3`} /></div>
                <h3 className="font-bold text-lg text-gray-800 dark:text-white">Performance Reports</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Detailed breakdown of your commissions and volume.</p>
            </div>
             <div className="bg-white dark:bg-[#1c1c1e] p-6 rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2c2c2e] transition-colors text-center opacity-50">
                <div className="flex justify-center items-center"><Briefcase size={32} className={`${themes[accentColor].text} mb-3`} /></div>
                <h3 className="font-bold text-lg text-gray-800 dark:text-white">Agent Resources</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Training materials and marketing assets (Coming Soon).</p>
            </div>
        </div>
    </div>
    );
};

const AgentQRCodeScreen: FC<{ onBack: () => void; accentColor: ThemeColor; profile: UserProfile }> = ({ onBack, accentColor, profile }) => {
    const qrValue = `ipay:${profile.name.replace('@', '')}`; 

    return (
        <div className="flex flex-col h-full bg-gray-100 dark:bg-black">
            <ScreenHeader title="Agent QR Code" onBack={onBack} />
            <div className="flex-grow flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-white p-8 rounded-3xl shadow-xl mb-8 relative w-full max-w-xs">
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-200">
                         <img src={getDisplayAvatarUrl(profile)} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                    <div className="mt-8 mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">{profile.name}</h2>
                        <p className="text-gray-500 text-sm font-medium">Agent Withdrawal Code</p>
                    </div>
                    <div className="flex justify-center">
                        <QRCodeCanvas value={qrValue} size={200} level={"H"} />
                    </div>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs font-medium">
                    Client scans this code to initiate a quick cash withdrawal.
                </p>
            </div>
        </div>
    );
};


interface ClientDashboardProps {
    transactions: Transaction[];
    balanceUSD: number;
    setScreen: (s: string) => void;
    accentColor: ThemeColor;
    currency: string;
    toggleCurrency: () => void;
    conversionRate: number;
    profile: UserProfile;
}

const FullScreenImageModal: FC<{ imageUrl: string | null; onClose: () => void }> = ({ imageUrl, onClose }) => {
    if (!imageUrl) return null;
    return (
        <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <button className="absolute top-6 right-6 text-white p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors" onClick={onClose}>
                <X size={24} />
            </button>
            <img src={imageUrl} alt="Full Screen" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
    );
};

const ClientDashboard: FC<ClientDashboardProps> = ({ transactions, balanceUSD, setScreen, accentColor, currency, toggleCurrency, conversionRate, profile }) => {
    const [balanceVisible, setBalanceVisible] = useState(true);
    const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
    const balanceZMW = balanceUSD * conversionRate;
    
    // Welcome message animation state
    const [welcomeVisible, setWelcomeVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setWelcomeVisible(false);
        }, 3000); // Disappear after 3 seconds
        return () => clearTimeout(timer);
    }, []);

    const getAvatarUrl = () => {
        if (profile.avatarUrl) return profile.avatarUrl;

        const currentStyle = profile.style || 'avataaars';
        let hair = profile.fixedHair; 
        if (!hair && currentStyle === 'avataaars') {
             const hairList = profile.gender === 'masculine' ? AVATAR_CONFIG.hairStyles.masculine : AVATAR_CONFIG.hairStyles.feminine;
             const hairIndex = Math.floor(profile.seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % hairList.length);
             hair = hairList[hairIndex];
        }
        let url = `https://api.dicebear.com/9.x/${currentStyle}/svg?seed=${profile.seed}`;
        if (currentStyle === 'micah') {
             url += `&backgroundColor=b6e3f4,c0aede,d1d4f9`;
        } else {
            url += `&skinColor=${profile.skinTone}&top=${hair}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
            if (profile.gender === 'feminine' || profile.noBeard) {
                url += `&facialHairProbability=0`;
            }
        }
        return url;
    };
    
    const loansIcon = <HandCoins size={24} />; 
    const billsIcon = <Receipt size={24} />; 
    
    return (
        <div className="p-6 flex flex-col h-full bg-gray-100 dark:bg-black text-black dark:text-white">
            <div className="flex justify-between items-center mb-6 h-12 relative">
                <div className="flex items-center gap-3 absolute left-0 top-0 h-full">
                    <div className="w-12 h-12 rounded-full bg-gray-200 border-2 border-white dark:border-[#333] overflow-hidden cursor-pointer" onClick={() => setFullScreenImage(getAvatarUrl())}>
                        <img src={getAvatarUrl()} alt="Avatar" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/9.x/initials/svg?seed=${profile.name}`;}}/>
                    </div>
                    
                    <div className={`transition-all duration-1000 ease-in-out flex flex-col justify-center ${welcomeVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'}`}>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">Welcome back,</p>
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white leading-tight whitespace-nowrap">{profile.name}</h2>
                    </div>
                </div>
                <div className="flex items-center gap-3 absolute right-0 top-1/2 -translate-y-1/2">
                    <CurrentTime />
                    <button onClick={() => setScreen('clientTools')} className="text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white bg-white dark:bg-[#1c1c1e] p-2 rounded-xl shadow-sm"><PieChart size={20}/></button>
                    <button onClick={() => setScreen('settings')} className="text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white bg-white dark:bg-[#1c1c1e] p-2 rounded-xl shadow-sm"><Settings size={20}/></button>
                </div>
            </div>
            
            <div className="flex-grow flex flex-col items-center justify-center text-center">
                 <div onClick={toggleCurrency} className="cursor-pointer group flex items-center justify-center space-x-2"><h1 className={`text-6xl font-bold transition-opacity duration-300 ${balanceVisible ? '' : 'blur-lg'}`}>{currency === 'USD' ? `$${balanceUSD.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : `K${balanceZMW.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}</h1><RefreshCw size={20} className="text-gray-500 group-hover:text-black dark:group-hover:text-white group-hover:rotate-180 transition-all duration-300"/></div>
                 <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Equivalent: {currency === 'ZMW' ? `$${balanceUSD.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : `K${balanceZMW.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}</p>
                 <button onClick={() => setBalanceVisible(!balanceVisible)} className="mt-2 text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white">{balanceVisible ? <EyeOff size={20}/> : <Eye size={20}/>}</button>
            </div>
            <div className="space-y-4 mb-6">
                <div className="grid grid-cols-4 gap-4">
                    <ActionButton icon={<MessageSquare size={24} />} label="Chat" onClick={() => setScreen('chat')} accentColor={accentColor} />
                    <ActionButton icon={billsIcon} label="Pay Bills" onClick={() => setScreen('bills')} accentColor={accentColor} />
                    <ActionButton icon={loansIcon} label="Loans" onClick={() => setScreen('microloans')} accentColor={accentColor} />
                    <ActionButton icon={<CreditCard size={24}/>} label="Card" onClick={() => setScreen('card')} accentColor={accentColor} />
                </div>
                 <div className="flex space-x-4">
                    <ActionButton large label="Withdraw" onClick={() => setScreen('withdraw')} accentColor={accentColor} />
                    <ActionButton large label="Send" onClick={() => setScreen('send')} accentColor={accentColor} />
                </div>
            </div>
            <div>
                <h3 className="font-bold text-lg mb-2">History</h3>
                <div className="bg-white dark:bg-[#1c1c1e] p-4 rounded-xl divide-y divide-gray-200 dark:divide-[#3a3a3c] h-48 overflow-y-auto no-scrollbar">
                    {transactions.length > 0 ? (
                        <>
                            {transactions.slice(0, 5).map((t, i) => <TransactionItem key={i} {...t} accentColor={accentColor} currency={currency} conversionRate={conversionRate}/>)}
                            {transactions.length > 5 && (
                                <button onClick={() => setScreen('history')} className="w-full py-2 text-sm text-gray-500 dark:text-gray-400 font-medium hover:text-gray-800 dark:hover:text-white transition-colors">View More</button>
                            )}
                        </>
                    ) : <div className="text-center text-gray-500 py-8">No history yet</div>}
                </div>
            </div>
            <FullScreenImageModal imageUrl={fullScreenImage} onClose={() => setFullScreenImage(null)} />
        </div>
    );
};

// --- Agent Dashboard ---
interface AgentDashboardProps {
    transactions: Transaction[];
    balanceUSD: number;
    commissionUSD: number;
    setScreen: (s: string) => void;
    accentColor: ThemeColor;
    currency: string;
    toggleCurrency: () => void;
    conversionRate: number;
    profile: UserProfile;
    setProfile: (p: UserProfile) => void;
}

const AgentDashboard: FC<AgentDashboardProps> = ({ transactions, balanceUSD, commissionUSD, setScreen, accentColor, currency, toggleCurrency, conversionRate, profile, setProfile }) => {
    const balanceZMW = balanceUSD * conversionRate;
    const commissionZMW = commissionUSD * conversionRate;
    const [balanceVisible, setBalanceVisible] = useState(true);
    const [isToggling, setIsToggling] = useState(false);

    const handleToggleOnline = async () => {
        setIsToggling(true);
        const newStatus = !profile.isOnline;
        
        try {
            if (newStatus) {
                // Going online: get location
                const setOnlineStatus = async (lat: number, lng: number) => {
                    if (profile.id) {
                        const { error } = await supabase.from('profiles').update({
                            is_online: true,
                            latitude: lat,
                            longitude: lng
                        }).eq('id', profile.id);
                        if (error) {
                            console.warn("Failed to update online status in DB (schema might be missing). Updating local state only.", error);
                        }
                    }
                    setProfile({ ...profile, isOnline: true, latitude: lat, longitude: lng });
                    setIsToggling(false);
                };

                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (position) => setOnlineStatus(position.coords.latitude, position.coords.longitude),
                        (error) => {
                            console.warn("Error getting location:", error);
                            alert("Location access denied or failed. Using fallback location to go online.");
                            setOnlineStatus(-15.3875, 28.3228); // Fallback to Lusaka
                        },
                        { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 }
                    );
                } else {
                    alert("Geolocation is not supported by this browser. Using fallback location.");
                    setOnlineStatus(-15.3875, 28.3228);
                }
            } else {
                // Going offline
                if (profile.id) {
                    const { error } = await supabase.from('profiles').update({
                        is_online: false
                    }).eq('id', profile.id);
                    if (error) {
                        console.warn("Failed to update offline status in DB.", error);
                    }
                }
                setProfile({ ...profile, isOnline: false });
                setIsToggling(false);
            }
        } catch (error) {
            console.error("Error toggling online status:", error);
            setIsToggling(false);
        }
    };

    return (
        <div className="p-6 flex flex-col h-full bg-gray-100 dark:bg-black text-black dark:text-white">
            {/* Header - Matching Client Layout */}
            <div className="flex justify-between items-center mb-6">
                 <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full ${themes[accentColor].bg} flex items-center justify-center text-black font-bold text-xl shadow-lg border-2 border-white dark:border-[#333]`}>AG</div>
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Agent Portal</p>
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white leading-tight">ID: 4829-10</h2>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <CurrentTime />
                    <button onClick={() => setScreen('agentTools')} className="text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white bg-white dark:bg-[#1c1c1e] p-2 rounded-xl shadow-sm transition-colors">
                        <PieChart size={20}/>
                    </button>
                    <button onClick={() => setScreen('settings')} className="text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white bg-white dark:bg-[#1c1c1e] p-2 rounded-xl shadow-sm transition-colors">
                        <Settings size={20}/>
                    </button>
                </div>
            </div>

            {/* Main Balance Display - Professional & Central */}
            <div className="flex-grow flex flex-col items-center justify-center text-center mb-6">
                 <div onClick={toggleCurrency} className="cursor-pointer group flex items-center justify-center space-x-2">
                    <h1 className={`text-5xl font-black tracking-tight transition-opacity duration-300 ${balanceVisible ? '' : 'blur-lg'}`}>
                        {currency === 'USD' ? `$${balanceUSD.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : `K${balanceZMW.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
                    </h1>
                    <RefreshCw size={20} className="text-gray-500 group-hover:text-black dark:group-hover:text-white group-hover:rotate-180 transition-all duration-300"/>
                 </div>
                 <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium tracking-wide uppercase">Total Float Balance</p>
                 <div className="mt-4 bg-white dark:bg-[#1c1c1e] px-4 py-2 rounded-full flex items-center space-x-2 shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2c2c2e] transition-colors" onClick={() => setScreen('agentReports')}>
                    <div className={`w-2 h-2 rounded-full ${themes[accentColor].bg} animate-pulse`}></div>
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Commission: {currency === 'USD' ? `$${commissionUSD.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : `K${commissionZMW.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} &rarr;</span>
                 </div>
            </div>

            {/* Quick Actions Grid - Using ActionButton for consistency */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                 <ActionButton icon={<ArrowDownLeft size={24}/>} label="Deposit" onClick={() => setScreen('agentDeposit')} accentColor={accentColor} />
                 <ActionButton icon={<ArrowUpRight size={24}/>} label="Withdraw" onClick={() => setScreen('agentWithdraw')} accentColor={accentColor} />
                 <ActionButton icon={<Navigation size={24} className={profile.isOnline ? 'text-green-500 animate-pulse' : ''} />} label={profile.isOnline ? "Go Offline" : "Go Online"} onClick={handleToggleOnline} accentColor={accentColor} />
                 <ActionButton icon={<BarChart2 size={24}/>} label="Reports" onClick={() => setScreen('agentReports')} accentColor={accentColor} /> 
            </div>

            {/* Recent Activity Section */}
            <div className="flex-1 overflow-hidden flex flex-col">
                <div className="flex justify-between items-end mb-3">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white">Recent Activity</h3>
                    <button onClick={() => setScreen('agentHistory')} className={`text-xs font-bold ${themes[accentColor].text}`}>View All</button>
                </div>
                 <div className="bg-white dark:bg-[#1c1c1e] p-4 rounded-2xl divide-y divide-gray-100 dark:divide-[#2c2c2e] shadow-sm flex-grow overflow-y-auto no-scrollbar">
                     {transactions.length > 0 ? transactions.slice(0, 5).map((t, i) => (
                         <TransactionItem key={i} {...t} accentColor={accentColor} currency={currency} conversionRate={conversionRate} />
                     )) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
                            <Receipt size={40} strokeWidth={1.5} />
                            <p className="text-sm">No recent transactions</p>
                        </div>
                     )}
                 </div>
            </div>
         </div>
    )
}

// --- Placeholder Screens for Missing Features ---

const BillIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M8 7H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M8 11H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <text x="12" y="17" textAnchor="middle" fontSize="5" fontWeight="900" fill="currentColor" style={{ fontFamily: 'sans-serif' }}>BILL</text>
    </svg>
);

// --- Advanced Chat Screen ---
interface ChatMessage {
    id: string;
    text: string;
    sender: 'me' | 'other';
    type: 'text' | 'payment' | 'payment_failed' | 'split_pending' | 'split_approved' | 'split_rejected';
    amount?: number;
    timestamp: Date;
    read?: boolean;
}

interface ChatContact {
    id: string;
    name: string;
    tag: string;
    avatar: string;
    lastMessage: string;
    lastTime: string;
    unreadCount?: number;
}

const ChatScreen: FC<{ 
    onBack: () => void; 
    accentColor: ThemeColor; 
    addTransaction?: (t: any, fee?: number) => void; 
    balanceUSD?: number; 
    currency?: string; 
    conversionRate?: number; 
    currentUser: any;
}> = ({ onBack, accentColor, addTransaction, balanceUSD = 0, currency = 'USD', conversionRate = 1, currentUser }) => {
    const [activeChat, setActiveChat] = useState<ChatContact | null>(null);
    const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
    const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
    const [inputText, setInputText] = useState('');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [showPlusMenu, setShowPlusMenu] = useState(false);
    const [showSplitModal, setShowSplitModal] = useState(false);
    const [splitAmount, setSplitAmount] = useState('');
    const [splitNote, setSplitNote] = useState('');
    const [selectedSplitFriends, setSelectedSplitFriends] = useState<string[]>([]);

    const [contacts, setContacts] = useState<ChatContact[]>([]);

    useEffect(() => {
        const fetchUsers = async () => {
            if (!searchQuery.trim()) {
                if (!currentUser?.id) return;
                try {
                    const { data: messagesData, error: messagesError } = await supabase
                        .from('messages')
                        .select('sender_id, receiver_id, text, created_at, read')
                        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
                        .order('created_at', { ascending: false });

                    if (messagesError) throw messagesError;

                    if (messagesData && messagesData.length > 0) {
                        const contactIds = new Set<string>();
                        const latestMessages: Record<string, any> = {};
                        const unreadCounts: Record<string, number> = {};

                        messagesData.forEach(msg => {
                            const otherId = msg.sender_id === currentUser.id ? msg.receiver_id : msg.sender_id;
                            contactIds.add(otherId);
                            if (!latestMessages[otherId]) {
                                latestMessages[otherId] = msg;
                            }
                            if (msg.receiver_id === currentUser.id && !msg.read) {
                                unreadCounts[otherId] = (unreadCounts[otherId] || 0) + 1;
                            }
                        });

                        const uniqueIds = Array.from(contactIds).slice(0, 10);
                        
                        if (uniqueIds.length > 0) {
                            const { data: profilesData, error: profilesError } = await supabase
                                .from('profiles')
                                .select('id, full_name, username, avatar_url')
                                .in('id', uniqueIds);

                            if (profilesError) throw profilesError;

                            if (profilesData) {
                                const fetchedContacts: ChatContact[] = profilesData.map(profile => {
                                    const lastMsg = latestMessages[profile.id];
                                    const isMe = lastMsg?.sender_id === currentUser.id;
                                    return {
                                        id: profile.id,
                                        name: profile.full_name || profile.username || 'Unknown User',
                                        tag: profile.username ? `@${profile.username}` : '',
                                        avatar: profile.avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${profile.username || profile.id}&backgroundColor=b6e3f4`,
                                        lastMessage: lastMsg ? (isMe ? `You: ${lastMsg.text}` : lastMsg.text) : 'Tap to chat',
                                        lastTime: lastMsg ? new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
                                        unreadCount: unreadCounts[profile.id] || 0
                                    };
                                });
                                setContacts(fetchedContacts);
                            }
                        } else {
                            setContacts([]);
                        }
                    } else {
                        setContacts([]);
                    }
                } catch (error) {
                    console.error("Error fetching recent contacts:", error);
                    setContacts([]);
                }
                return;
            }

            setIsSearching(true);
            try {
                const cleanQuery = searchQuery.trim().replace('@', '').replace('$', '');
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, full_name, username, avatar_url')
                    .or(`username.ilike.%${cleanQuery}%,full_name.ilike.%${cleanQuery}%`)
                    .limit(10);

                if (error) throw error;

                if (data) {
                    const fetchedContacts: ChatContact[] = data.map(profile => ({
                        id: profile.id,
                        name: profile.full_name || profile.username || 'Unknown User',
                        tag: profile.username ? `@${profile.username}` : '',
                        avatar: profile.avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${profile.username || profile.id}&backgroundColor=b6e3f4`,
                        lastMessage: 'Tap to chat',
                        lastTime: ''
                    }));
                    setContacts(fetchedContacts);
                }
            } catch (error) {
                console.error("Error fetching users:", error);
            } finally {
                setIsSearching(false);
            }
        };

        const debounce = setTimeout(fetchUsers, 300);
        return () => clearTimeout(debounce);
    }, [searchQuery]);

    useEffect(() => {
        const fetchMessages = async () => {
            if (!activeChat || !currentUser?.id) return;

            try {
                const { data, error } = await supabase
                    .from('messages')
                    .select('*')
                    .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${activeChat.id}),and(sender_id.eq.${activeChat.id},receiver_id.eq.${currentUser.id})`)
                    .order('created_at', { ascending: true });

                if (error) throw error;

                if (data) {
                    const fetchedMessages: ChatMessage[] = data.map(msg => ({
                        id: msg.id,
                        text: msg.text || '',
                        sender: msg.sender_id === currentUser.id ? 'me' : 'other',
                        type: msg.type as any,
                        amount: msg.amount,
                        timestamp: new Date(msg.created_at),
                        read: msg.read
                    }));
                    
                    setMessages(prev => ({
                        ...prev,
                        [activeChat.id]: fetchedMessages
                    }));

                    // Mark unread messages as read
                    const unreadMessageIds = data
                        .filter(msg => msg.receiver_id === currentUser.id && !msg.read)
                        .map(msg => msg.id);

                    if (unreadMessageIds.length > 0) {
                        await supabase
                            .from('messages')
                            .update({ read: true })
                            .in('id', unreadMessageIds);
                            
                        // Update local state to reflect read status
                        setMessages(prev => ({
                            ...prev,
                            [activeChat.id]: prev[activeChat.id].map(msg => 
                                unreadMessageIds.includes(msg.id) ? { ...msg, read: true } : msg
                            )
                        }));

                        // Clear unread count in contacts list
                        setContacts(prev => prev.map(c => 
                            c.id === activeChat.id ? { ...c, unreadCount: 0 } : c
                        ));
                    }
                }
            } catch (error) {
                console.error("Error fetching messages:", error);
            }
        };

        fetchMessages();

        // Realtime subscription for messages
        const channel = supabase
            .channel('public:messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${currentUser?.id}`
                },
                async (payload) => {
                    const newMsg = payload.new;
                    
                    // If the message is for the currently active chat, mark it as read and add it
                    if (activeChat && newMsg.sender_id === activeChat.id) {
                        const chatMsg: ChatMessage = {
                            id: newMsg.id,
                            text: newMsg.text || '',
                            sender: 'other',
                            type: newMsg.type as any,
                            amount: newMsg.amount,
                            timestamp: new Date(newMsg.created_at),
                            read: true
                        };
                        
                        setMessages(prev => ({
                            ...prev,
                            [activeChat.id]: [...(prev[activeChat.id] || []), chatMsg]
                        }));

                        // Mark as read in DB
                        await supabase
                            .from('messages')
                            .update({ read: true })
                            .eq('id', newMsg.id);
                    } else {
                        // If it's for another chat, just update the contacts list to show unread
                        // We can trigger a re-fetch of contacts or manually update the state
                        // For simplicity, we'll let the user refresh or we can update the contacts state
                        setContacts(prev => prev.map(c => 
                            c.id === newMsg.sender_id 
                                ? { ...c, unreadCount: (c.unreadCount || 0) + 1, lastMessage: newMsg.text, lastTime: new Date(newMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
                                : c
                        ));
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'messages',
                    filter: `sender_id=eq.${currentUser?.id}`
                },
                (payload) => {
                    const updatedMsg = payload.new;
                    // If our sent message was updated (e.g., marked as read by receiver or split request status changed)
                    if (activeChat && updatedMsg.receiver_id === activeChat.id) {
                        setMessages(prev => ({
                            ...prev,
                            [activeChat.id]: (prev[activeChat.id] || []).map(msg => 
                                msg.id === updatedMsg.id ? { ...msg, read: updatedMsg.read, type: updatedMsg.type as any } : msg
                            )
                        }));
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${currentUser?.id}`
                },
                (payload) => {
                    const updatedMsg = payload.new;
                    // If a message we received was updated (e.g., we approved a split request on another device)
                    if (activeChat && updatedMsg.sender_id === activeChat.id) {
                        setMessages(prev => ({
                            ...prev,
                            [activeChat.id]: (prev[activeChat.id] || []).map(msg => 
                                msg.id === updatedMsg.id ? { ...msg, read: updatedMsg.read, type: updatedMsg.type as any } : msg
                            )
                        }));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [activeChat, currentUser?.id]);

    const handleSplitBill = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(splitAmount);
        if (isNaN(amount) || amount <= 0 || selectedSplitFriends.length === 0 || !currentUser?.id) return;

        const amountInUSD = currency === 'ZMW' ? amount / conversionRate : amount;
        const splitCount = selectedSplitFriends.length + 1; // +1 for yourself
        const amountPerPersonInUSD = amountInUSD / splitCount;
        
        const text = splitNote.trim() || `Split Bill Request`;

        try {
            const inserts = selectedSplitFriends.map(friendId => ({
                sender_id: currentUser.id,
                receiver_id: friendId,
                text: text,
                type: 'split_pending',
                amount: amountPerPersonInUSD
            }));

            const { data, error } = await supabase.from('messages').insert(inserts).select();

            if (error) throw error;

            if (data) {
                setMessages(prev => {
                    const next = { ...prev };
                    data.forEach(msg => {
                        const friendId = msg.receiver_id;
                        const splitMsg: ChatMessage = {
                            id: msg.id,
                            text: msg.text || '',
                            sender: 'me',
                            type: 'split_pending',
                            amount: msg.amount,
                            timestamp: new Date(msg.created_at),
                            read: false
                        };
                        next[friendId] = [...(next[friendId] || []), splitMsg];
                    });
                    return next;
                });
            }
        } catch (error) {
            console.error("Error sending split bill requests:", error);
        }

        setShowSplitModal(false);
        setSplitAmount('');
        setSplitNote('');
        setSelectedSplitFriends([]);
    };

    const toggleSplitFriend = (id: string) => {
        setSelectedSplitFriends(prev => 
            prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
        );
    };

    const handleApproveSplit = async (msg: ChatMessage) => {
        if (!currentUser?.id || !activeChat || !msg.amount) return;
        
        const amountInUSD = msg.amount;
        const feeInUSD = amountInUSD * 0.01; // 1% fee
        const totalDeduction = amountInUSD + feeInUSD;

        if (totalDeduction > balanceUSD) {
            alert("Insufficient balance to approve this split request.");
            return;
        }

        try {
            // 1. Add Transaction
            addTransaction({
                id: Math.random().toString(36).substr(2, 9),
                title: `Split: ${msg.text || 'Bill'}`,
                type: `Sent to ${activeChat.tag || activeChat.name}`,
                date: 'Just now',
                amount: amountInUSD.toString(),
                isCredit: false,
                category: 'transfer',
                fee: feeInUSD
            }, feeInUSD);

            // 2. Update message status to approved
            const { error } = await supabase
                .from('messages')
                .update({ type: 'split_approved' })
                .eq('id', msg.id);

            if (error) throw error;

            // 3. Add a payment message to confirm
            await supabase.from('messages').insert({
                sender_id: currentUser.id,
                receiver_id: activeChat.id,
                text: `Paid ${currency === 'USD' ? '$' : 'K'}${amountInUSD.toFixed(2)} for split`,
                type: 'payment',
                amount: amountInUSD
            });

            // Optimistically update local state
            setMessages(prev => {
                const next = { ...prev };
                if (next[activeChat.id]) {
                    next[activeChat.id] = next[activeChat.id].map(m => 
                        m.id === msg.id ? { ...m, type: 'split_approved' } : m
                    );
                }
                return next;
            });

        } catch (error) {
            console.error("Error approving split:", error);
            alert("Failed to approve split request.");
        }
    };

    const handleRejectSplit = async (msg: ChatMessage) => {
        if (!currentUser?.id || !activeChat) return;

        try {
            const { error } = await supabase
                .from('messages')
                .update({ type: 'split_rejected' })
                .eq('id', msg.id);

            if (error) throw error;

            // Optimistically update local state
            setMessages(prev => {
                const next = { ...prev };
                if (next[activeChat.id]) {
                    next[activeChat.id] = next[activeChat.id].map(m => 
                        m.id === msg.id ? { ...m, type: 'split_rejected' } : m
                    );
                }
                return next;
            });
        } catch (error) {
            console.error("Error rejecting split:", error);
            alert("Failed to reject split request.");
        }
    };

    const handleSendMessage = async () => {
        if (!inputText.trim() || !activeChat || !currentUser?.id) return;
        
        const text = inputText;
        setInputText('');

        try {
            const { data, error } = await supabase.from('messages').insert({
                sender_id: currentUser.id,
                receiver_id: activeChat.id,
                text: text,
                type: 'text'
            }).select().single();

            if (error) throw error;

            if (data) {
                const newMessage: ChatMessage = {
                    id: data.id,
                    text: data.text || '',
                    sender: 'me',
                    type: 'text',
                    timestamp: new Date(data.created_at),
                    read: false
                };

                setMessages(prev => ({
                    ...prev,
                    [activeChat.id]: [...(prev[activeChat.id] || []), newMessage]
                }));
            }
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const handleSendPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeChat || !addTransaction || !currentUser?.id) return;

        const amount = parseFloat(paymentAmount);
        if (isNaN(amount) || amount <= 0) return;

        const amountInUSD = currency === 'ZMW' ? amount / conversionRate : amount;
        const feeInUSD = amountInUSD * 0.01; // 1% fee
        const totalDeduction = amountInUSD + feeInUSD;

        if (totalDeduction > balanceUSD) {
            try {
                const { data, error } = await supabase.from('messages').insert({
                    sender_id: currentUser.id,
                    receiver_id: activeChat.id,
                    text: `Failed ${currency === 'USD' ? '$' : 'K'}${amount.toFixed(2)}`,
                    type: 'payment_failed',
                    amount: amountInUSD
                }).select().single();

                if (error) throw error;

                if (data) {
                    const failedMessage: ChatMessage = {
                        id: data.id,
                        text: data.text || '',
                        sender: 'me',
                        type: 'payment_failed',
                        amount: data.amount,
                        timestamp: new Date(data.created_at),
                        read: false
                    };

                    setMessages(prev => ({
                        ...prev,
                        [activeChat.id]: [...(prev[activeChat.id] || []), failedMessage]
                    }));
                }
            } catch (error) {
                console.error("Error saving failed payment message:", error);
            }
            
            setShowPaymentModal(false);
            setPaymentAmount('');
            return;
        }

        // 1. Deduct Balance
        addTransaction({
            icon: <Send size={18} />,
            type: `Sent to ${activeChat.tag || activeChat.name}`,
            date: 'Just now',
            amount: amountInUSD.toString(),
            isCredit: false,
            category: 'transfer',
            fee: feeInUSD
        }, feeInUSD);

        // 2. Add Payment Message
        try {
            const { data, error } = await supabase.from('messages').insert({
                sender_id: currentUser.id,
                receiver_id: activeChat.id,
                text: `Sent ${currency === 'USD' ? '$' : 'K'}${amount.toFixed(2)}`,
                type: 'payment',
                amount: amountInUSD
            }).select().single();

            if (error) throw error;

            if (data) {
                const payMessage: ChatMessage = {
                    id: data.id,
                    text: data.text || '',
                    sender: 'me',
                    type: 'payment',
                    amount: data.amount,
                    timestamp: new Date(data.created_at),
                    read: false
                };

                setMessages(prev => ({
                    ...prev,
                    [activeChat.id]: [...(prev[activeChat.id] || []), payMessage]
                }));
            }
        } catch (error) {
            console.error("Error saving payment message:", error);
        }

        setShowPaymentModal(false);
        setPaymentAmount('');
    };

    const filteredContacts = searchQuery.trim() ? contacts : contacts.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.tag.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // --- Sub-components for Chat ---

    if (activeChat) {
        const chatMsgs = messages[activeChat.id] || [];
        
        return (
            <div className="absolute inset-0 flex flex-col bg-gray-100 dark:bg-black z-10">
                {/* Chat Header */}
                <div className="bg-white dark:bg-[#1c1c1e] p-4 flex items-center gap-3 shadow-sm z-20">
                    <button onClick={() => setActiveChat(null)} className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-[#2c2c2e] rounded-full"><ArrowLeft size={20} className="text-gray-600 dark:text-white"/></button>
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden cursor-pointer" onClick={() => setFullScreenImage(activeChat.avatar)}>
                        <img src={activeChat.avatar} alt={activeChat.name} className="w-full h-full" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-gray-800 dark:text-white leading-tight">{activeChat.name}</h3>
                        <p className="text-xs text-gray-500">{activeChat.tag}</p>
                    </div>
                    <button className="p-2 bg-gray-100 dark:bg-[#2c2c2e] rounded-full text-gray-600 dark:text-white"><MoreVertical size={20}/></button>
                </div>

                {/* Messages Area */}
                <div className="flex-grow p-4 space-y-4 overflow-y-auto no-scrollbar bg-gray-50 dark:bg-black">
                    {chatMsgs.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[75%] p-3 rounded-2xl ${
                                msg.sender === 'me' 
                                    ? msg.type === 'payment_failed' ? 'bg-red-500 text-white rounded-tr-none' : `${themes[accentColor].bg} text-black rounded-tr-none` 
                                    : 'bg-white dark:bg-[#1c1c1e] text-gray-800 dark:text-white rounded-tl-none shadow-sm'
                            }`}>
                                {msg.type === 'payment' ? (
                                    <div className="flex flex-col items-center min-w-[120px]">
                                        <p className="text-xs font-bold opacity-70 mb-1 uppercase">Payment Sent</p>
                                        <h2 className="text-2xl font-black">{msg.amount ? `${currency === 'USD' ? '$' : 'K'}${currency === 'ZMW' ? (msg.amount * conversionRate).toFixed(2) : msg.amount.toFixed(2)}` : msg.text.replace('Sent ', '').replace('Paid ', '')}</h2>
                                        <div className="mt-2 bg-black/10 dark:bg-white/10 p-1 rounded-full"><Check size={12}/></div>
                                    </div>
                                ) : msg.type === 'payment_failed' ? (
                                    <div className="flex flex-col items-center min-w-[120px]">
                                        <p className="text-xs font-bold opacity-70 mb-1 uppercase">Payment Failed</p>
                                        <h2 className="text-2xl font-black">{msg.amount ? `${currency === 'USD' ? '$' : 'K'}${currency === 'ZMW' ? (msg.amount * conversionRate).toFixed(2) : msg.amount.toFixed(2)}` : msg.text.replace('Failed ', '')}</h2>
                                        <div className="mt-2 bg-white/20 p-1 rounded-full"><X size={12}/></div>
                                    </div>
                                ) : msg.type === 'split_pending' ? (
                                    <div className="flex flex-col items-center min-w-[160px] p-2">
                                        <p className="text-xs font-bold opacity-70 mb-1 uppercase">Split Request</p>
                                        <h2 className="text-2xl font-black">{msg.amount ? `${currency === 'USD' ? '$' : 'K'}${currency === 'ZMW' ? (msg.amount * conversionRate).toFixed(2) : msg.amount.toFixed(2)}` : ''}</h2>
                                        {msg.text && <p className="text-sm mt-2 opacity-90 text-center">{msg.text}</p>}
                                        {msg.sender === 'other' ? (
                                            <div className="flex gap-2 mt-4 w-full">
                                                <button onClick={() => handleApproveSplit(msg)} className={`flex-1 ${themes[accentColor].bg} text-black py-2 rounded-lg text-xs font-bold hover:opacity-90 transition-opacity`}>Approve</button>
                                                <button onClick={() => handleRejectSplit(msg)} className="flex-1 bg-gray-200 dark:bg-[#2c2c2e] text-gray-800 dark:text-white py-2 rounded-lg text-xs font-bold hover:bg-gray-300 dark:hover:bg-[#3c3c3e] transition-colors">Reject</button>
                                            </div>
                                        ) : (
                                            <div className="mt-3 text-xs font-bold opacity-70 flex items-center gap-1"><Clock size={12}/> Pending</div>
                                        )}
                                    </div>
                                ) : msg.type === 'split_approved' ? (
                                    <div className="flex flex-col items-center min-w-[160px] p-2">
                                        <p className="text-xs font-bold opacity-70 mb-1 uppercase">Split Approved</p>
                                        <h2 className="text-2xl font-black">{msg.amount ? `${currency === 'USD' ? '$' : 'K'}${currency === 'ZMW' ? (msg.amount * conversionRate).toFixed(2) : msg.amount.toFixed(2)}` : ''}</h2>
                                        {msg.text && <p className="text-sm mt-2 opacity-90 text-center">{msg.text}</p>}
                                        <div className="mt-3 text-xs font-bold opacity-70 flex items-center gap-1"><CheckCheck size={12}/> Paid</div>
                                    </div>
                                ) : msg.type === 'split_rejected' ? (
                                    <div className="flex flex-col items-center min-w-[160px] p-2">
                                        <p className="text-xs font-bold opacity-70 mb-1 uppercase">Split Rejected</p>
                                        <h2 className="text-2xl font-black line-through opacity-50">{msg.amount ? `${currency === 'USD' ? '$' : 'K'}${currency === 'ZMW' ? (msg.amount * conversionRate).toFixed(2) : msg.amount.toFixed(2)}` : ''}</h2>
                                        {msg.text && <p className="text-sm mt-2 opacity-90 text-center">{msg.text}</p>}
                                        <div className="mt-3 text-xs font-bold opacity-70 flex items-center gap-1 text-red-500"><X size={12}/> Rejected</div>
                                    </div>
                                ) : (
                                    <p className="text-sm">{msg.text}</p>
                                )}
                                <div className="flex items-center justify-end gap-1 mt-1">
                                    <p className="text-[10px] opacity-50 text-right">{msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                    {msg.sender === 'me' && (
                                        <span className="opacity-70">
                                            {msg.read ? <CheckCheck size={12} /> : <Check size={12} />}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Input Area */}
                <div className="p-3 bg-white dark:bg-[#1c1c1e] border-t border-gray-200 dark:border-[#2c2c2e] flex items-center gap-2">
                    <button onClick={() => setShowPaymentModal(true)} className={`w-12 h-12 flex-shrink-0 rounded-full ${themes[accentColor].bg} text-black flex items-center justify-center transition-transform hover:scale-105 font-black text-2xl shadow-md`}>
                        {currency === 'USD' ? '$' : 'K'}
                    </button>
                    <button onClick={() => { setShowSplitModal(true); setSelectedSplitFriends([activeChat.id]); }} className="w-12 h-12 flex-shrink-0 rounded-full bg-[#00d554] text-black flex items-center justify-center transition-transform hover:scale-105 shadow-md" title="Split Bill">
                        <BillIcon size={20} />
                    </button>
                    <div className="flex-1 bg-gray-100 dark:bg-[#2c2c2e] rounded-full px-4 py-2 flex items-center">
                        <input 
                            type="text" 
                            value={inputText} 
                            onChange={e => setInputText(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Message..." 
                            className="bg-transparent flex-1 outline-none text-sm text-gray-800 dark:text-white placeholder-gray-500"
                        />
                    </div>
                    <button onClick={handleSendMessage} disabled={!inputText.trim()} className={`w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center transition-transform hover:scale-105 shadow-md ${inputText.trim() ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-[#2c2c2e] text-gray-400'}`}>
                        <Send size={20} strokeWidth={2.5} />
                    </button>
                </div>

                {/* Split Bill Modal */}
                {showSplitModal && (
                    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-[#1c1c1e] w-full max-w-sm rounded-3xl p-6 animate-in slide-in-from-bottom-10">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-xl text-gray-800 dark:text-white">Split the Bill</h3>
                                <button onClick={() => setShowSplitModal(false)} className="p-2 bg-gray-100 dark:bg-[#2c2c2e] rounded-full"><X size={20} className="text-gray-600 dark:text-white"/></button>
                            </div>
                            
                            <form onSubmit={handleSplitBill}>
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-500 mb-2">Total Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-400">{currency === 'USD' ? '$' : 'K'}</span>
                                        <input 
                                            type="number" 
                                            value={splitAmount}
                                            onChange={e => setSplitAmount(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full bg-gray-100 dark:bg-[#2c2c2e] rounded-xl py-3 pl-10 pr-4 text-2xl font-bold text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                                            autoFocus
                                        />
                                    </div>
                                </div>
                                
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-500 mb-2">Note (Optional)</label>
                                    <input 
                                        type="text" 
                                        value={splitNote}
                                        onChange={e => setSplitNote(e.target.value)}
                                        placeholder="e.g. money for pizza 🍕"
                                        className="w-full bg-gray-100 dark:bg-[#2c2c2e] rounded-xl py-3 px-4 text-sm font-medium text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-500 mb-2">Split with</label>
                                    <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                                        {contacts.map(contact => (
                                            <div key={contact.id} onClick={() => toggleSplitFriend(contact.id)} className={`flex items-center p-2 rounded-xl cursor-pointer border ${selectedSplitFriends.includes(contact.id) ? '' : 'border-transparent hover:bg-gray-50 dark:hover:bg-[#2c2c2e]'}`} style={{ backgroundColor: selectedSplitFriends.includes(contact.id) ? themes[accentColor].base + '20' : 'transparent', borderColor: selectedSplitFriends.includes(contact.id) ? themes[accentColor].base : 'transparent' }}>
                                                <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden mr-3">
                                                    <img src={contact.avatar} alt={contact.name} className="w-full h-full" />
                                                </div>
                                                <span className="flex-1 font-medium text-gray-800 dark:text-white">{contact.name}</span>
                                                {selectedSplitFriends.includes(contact.id) && <CheckCircle size={18} className={themes[accentColor].text} fill="currentColor" color="white" />}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {splitAmount && selectedSplitFriends.length > 0 && (
                                    <div className="mb-6 p-4 bg-gray-50 dark:bg-[#2c2c2e] rounded-xl flex justify-between items-center">
                                        <span className="text-sm text-gray-500">Per person</span>
                                        <span className="text-xl font-bold text-gray-800 dark:text-white">
                                            {currency === 'USD' ? '$' : 'K'}{(parseFloat(splitAmount) / (selectedSplitFriends.length + 1)).toFixed(2)}
                                        </span>
                                    </div>
                                )}

                                <button type="submit" disabled={!splitAmount || selectedSplitFriends.length === 0} className={`w-full ${themes[accentColor].bg} text-black font-bold py-4 rounded-xl text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed`}>
                                    Send Requests
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Payment Modal */}
                {showPaymentModal && (
                    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-[#1c1c1e] w-full max-w-sm rounded-3xl p-6 animate-in slide-in-from-bottom-10">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-xl text-gray-800 dark:text-white">Send Money</h3>
                                <button onClick={() => setShowPaymentModal(false)} className="p-2 bg-gray-100 dark:bg-[#2c2c2e] rounded-full"><X size={20} className="text-gray-600 dark:text-white"/></button>
                            </div>
                            
                            <div className="flex flex-col items-center mb-6">
                                <div className="w-16 h-16 rounded-full bg-gray-200 mb-3 overflow-hidden">
                                    <img src={activeChat.avatar} alt={activeChat.name} className="w-full h-full" />
                                </div>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">Sending to</p>
                                <h4 className="font-bold text-lg text-gray-800 dark:text-white">{activeChat.name}</h4>
                                <p className={`text-sm font-bold ${themes[accentColor].text}`}>{activeChat.tag}</p>
                            </div>

                            <form onSubmit={handleSendPayment}>
                                <div className="relative mb-6">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">{currency === 'USD' ? '$' : 'K'}</span>
                                    <input 
                                        type="number" 
                                        value={paymentAmount}
                                        onChange={e => setPaymentAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full bg-gray-100 dark:bg-[#2c2c2e] rounded-2xl py-4 pl-10 pr-4 text-3xl font-bold text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                                        autoFocus
                                    />
                                </div>
                                <button type="submit" className={`w-full ${themes[accentColor].bg} text-black font-bold py-4 rounded-xl text-lg hover:opacity-90 transition-opacity`}>
                                    Send Now
                                </button>
                            </form>
                        </div>
                    </div>
                )}
                
                <FullScreenImageModal imageUrl={fullScreenImage} onClose={() => setFullScreenImage(null)} />
            </div>
        );
    }

    // --- Main List View ---
    return (
        <div className="flex flex-col h-full bg-gray-100 dark:bg-black">
            <ScreenHeader title="Chat" onBack={onBack} />
            
            {/* Search Bar */}
            <div className="px-4 pb-2">
                <div className="bg-white dark:bg-[#1c1c1e] rounded-xl flex items-center px-4 py-3 shadow-sm">
                    <Search size={20} className="text-gray-400 mr-3" />
                    <input 
                        type="text" 
                        placeholder="Search people or tags..." 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="bg-transparent flex-1 outline-none text-gray-800 dark:text-white placeholder-gray-500"
                    />
                </div>
            </div>

            {/* Chat List */}
            <div className="flex-grow p-4 space-y-2 overflow-y-auto no-scrollbar">
                {filteredContacts.map((contact) => (
                    <div key={contact.id} onClick={() => setActiveChat(contact)} className="flex items-center gap-4 bg-white dark:bg-[#1c1c1e] p-4 rounded-xl shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2c2c2e] transition-colors">
                        <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                                <img src={contact.avatar} alt={contact.name} className="w-full h-full" />
                            </div>
                            {contact.unreadCount && contact.unreadCount > 0 ? (
                                <div className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 rounded-full border-2 border-white dark:border-[#1c1c1e] flex items-center justify-center text-[8px] text-white font-bold">{contact.unreadCount}</div>
                            ) : (
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-[#1c1c1e]"></div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-1">
                                <h3 className={`text-gray-800 dark:text-white truncate ${contact.unreadCount && contact.unreadCount > 0 ? 'font-black' : 'font-bold'}`}>{contact.name}</h3>
                                <span className={`text-xs whitespace-nowrap ${contact.unreadCount && contact.unreadCount > 0 ? 'text-blue-500 font-bold' : 'text-gray-400'}`}>{contact.lastTime}</span>
                            </div>
                            <p className={`text-sm truncate flex items-center gap-1 ${contact.unreadCount && contact.unreadCount > 0 ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-500 dark:text-gray-400'}`}>
                                {messages[contact.id] && messages[contact.id][messages[contact.id].length-1]?.sender === 'me' && <span className="text-xs font-normal">You: </span>}
                                {messages[contact.id] ? messages[contact.id][messages[contact.id].length-1]?.text : contact.lastMessage}
                            </p>
                        </div>
                    </div>
                ))}
                
                {filteredContacts.length === 0 && (
                    <div className="text-center py-10 text-gray-500">
                        <p>No users found.</p>
                        <p className="text-sm mt-2">Try searching for an iPay tag.</p>
                    </div>
                )}
            </div>

            {/* FAB for New Chat with Menu */}
            <div className="absolute bottom-6 right-6 flex flex-col items-end space-y-3">
                {showPlusMenu && (
                    <div className="flex flex-col items-end space-y-3 animate-in slide-in-from-bottom-5 fade-in duration-200">
                        <button className="flex items-center gap-2 bg-white dark:bg-[#1c1c1e] px-4 py-2 rounded-full shadow-lg text-gray-700 dark:text-white font-medium hover:bg-gray-50 dark:hover:bg-[#2c2c2e]">
                            <span className="text-sm">Request</span>
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><ArrowDownLeft size={16}/></div>
                        </button>
                         <button className="flex items-center gap-2 bg-white dark:bg-[#1c1c1e] px-4 py-2 rounded-full shadow-lg text-gray-700 dark:text-white font-medium hover:bg-gray-50 dark:hover:bg-[#2c2c2e]">
                            <span className="text-sm">Contact</span>
                            <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center"><User size={16}/></div>
                        </button>
                    </div>
                )}
                <button onClick={() => setShowPlusMenu(!showPlusMenu)} className={`w-14 h-14 rounded-full ${themes[accentColor].bg} text-black shadow-lg flex items-center justify-center hover:scale-110 transition-transform ${showPlusMenu ? 'rotate-45' : ''}`}>
                    <Plus size={28} />
                </button>
            </div>
        </div>
    );
};

const BillsScreen: FC<{ onBack: () => void; accentColor: ThemeColor; addTransaction: any; balanceUSD: number; currency: string; conversionRate: number }> = ({ onBack, accentColor, addTransaction, balanceUSD, currency, conversionRate }) => {
    const [status, setStatus] = useState<'success' | 'failure' | null>(null);
    const FEE_PERCENT = 0.01;

    const handlePayBill = (billName: string, amount: number) => {
        const fee = amount * FEE_PERCENT;
        const total = amount + fee;

        if (total > balanceUSD) {
            setStatus('failure');
            return;
        }

        addTransaction({
            icon: <Receipt size={18} />,
            type: `Paid ${billName}`,
            date: 'Just now',
            amount: amount.toString(),
            isCredit: false,
            fee: fee,
            category: 'bill'
        }, fee);
        setStatus('success');
    }

    if (status) {
         return <div className="flex flex-col h-full bg-gray-50 dark:bg-black"><ScreenHeader title="Pay Bills" onBack={() => setStatus(null)} /><TransactionStatusScreen status={status} title={status === 'success' ? 'Success!' : 'Payment Failed'} message={status === 'success' ? `Bill paid successfully.` : 'Insufficient funds for bill + fee.'} onDone={() => setStatus(null)} accentColor={accentColor} /></div>;
    }

    const bills = [
        { name: 'Zesco', icon: <Zap size={24} />, color: 'bg-yellow-500', gradient: 'from-yellow-400 to-orange-500', amount: 50.00 },
        { name: 'Water', icon: <Droplets size={24} />, color: 'bg-blue-500', gradient: 'from-blue-400 to-cyan-500', amount: 35.00 },
        { name: 'Internet', icon: <Globe size={24} />, color: 'bg-purple-500', gradient: 'from-purple-400 to-pink-500', amount: 80.00 },
        { name: 'DSTV', icon: <Tv size={24} />, color: 'bg-red-500', gradient: 'from-red-400 to-pink-600', amount: 45.00 },
    ];

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-black">
            <ScreenHeader title="Pay Bills" onBack={onBack} />
            <div className="p-6 overflow-y-auto no-scrollbar space-y-8">
                 {/* Hero Card */}
                 <div className={`relative overflow-hidden p-8 rounded-[2rem] shadow-2xl ${themes[accentColor].bg} text-black`}>
                    <div className="relative z-10">
                        <p className="text-sm font-bold opacity-70 uppercase tracking-widest mb-1">Total Due</p>
                        <h2 className="text-5xl font-black tracking-tighter">$210.00</h2>
                        <div className="mt-4 flex items-center gap-2 bg-black/10 w-fit px-3 py-1 rounded-full backdrop-blur-sm">
                            <AlertCircle size={14} />
                            <p className="text-xs font-bold">Due by Feb 28</p>
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
                 </div>

                 {/* Categories Grid */}
                 <div>
                    <h3 className="font-bold text-xl text-gray-800 dark:text-white mb-4 px-2">Select Category</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {bills.map((bill, i) => (
                            <div key={i} onClick={() => handlePayBill(bill.name, bill.amount)} className="relative overflow-hidden bg-white dark:bg-[#1c1c1e] p-5 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group active:scale-95 border border-transparent hover:border-gray-100 dark:hover:border-[#333]">
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${bill.gradient} flex items-center justify-center mb-4 text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                    {bill.icon}
                                </div>
                                <h4 className="font-bold text-lg text-gray-800 dark:text-white leading-tight">{bill.name}</h4>
                                <p className="text-sm text-gray-400 font-medium mt-1">${bill.amount.toFixed(2)}</p>
                                
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">
                                    <div className="bg-gray-100 dark:bg-[#2c2c2e] p-2 rounded-full">
                                        <ArrowUpRight size={16} className="text-gray-800 dark:text-white"/>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                 </div>
                 
                 {/* Quick Pay Section */}
                 <div className="bg-white dark:bg-[#1c1c1e] p-6 rounded-3xl shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-800 dark:text-white">Quick Pay</h3>
                        <button className={`text-xs font-bold ${themes[accentColor].text}`}>View All</button>
                    </div>
                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                        {[1,2,3].map((_, i) => (
                            <div key={i} className="flex flex-col items-center gap-2 min-w-[60px]">
                                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-[#2c2c2e] flex items-center justify-center text-gray-400">
                                    <Plus size={20} />
                                </div>
                                <div className="w-12 h-2 bg-gray-100 dark:bg-[#2c2c2e] rounded-full"></div>
                            </div>
                        ))}
                    </div>
                 </div>
            </div>
        </div>
    );
};

const MicroloansScreen: FC<{ onBack: () => void; accentColor: ThemeColor }> = ({ onBack, accentColor }) => (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-black">
        <ScreenHeader title="Microloans" onBack={onBack} />
        <div className="p-6 overflow-y-auto no-scrollbar space-y-6">
             {/* Credit Score Card */}
             <div className="bg-white dark:bg-[#1c1c1e] p-8 rounded-[2.5rem] shadow-xl text-center relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 opacity-50"></div>
                
                <div className="flex justify-between items-center mb-6">
                    <div className="text-left">
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Credit Score</p>
                        <p className="text-xs text-gray-300 mt-1">Updated just now</p>
                    </div>
                    <div className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <TrendingUp size={12} />
                        <span>+12 pts</span>
                    </div>
                </div>
                
                <div className="relative w-64 h-32 mx-auto mb-2">
                    {/* SVG Gauge */}
                    <svg viewBox="0 0 200 100" className="w-full h-full overflow-visible">
                        {/* Background Track */}
                        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="currentColor" strokeWidth="12" strokeLinecap="round" className="text-gray-100 dark:text-[#2c2c2e]" />
                        
                        {/* Progress Arc (720/850 approx 85%) */}
                        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#scoreGradient)" strokeWidth="12" strokeLinecap="round" strokeDasharray="251.2" strokeDashoffset="60" className="transition-all duration-1000 ease-out" />
                        
                        <defs>
                            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#ef4444" />
                                <stop offset="50%" stopColor="#eab308" />
                                <stop offset="100%" stopColor="#22c55e" />
                            </linearGradient>
                        </defs>
                    </svg>
                    
                    {/* Score Text */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/4 flex flex-col items-center">
                        <h2 className="text-6xl font-black text-gray-800 dark:text-white tracking-tighter">720</h2>
                        <p className="text-green-500 font-bold text-sm mt-1">Excellent</p>
                    </div>
                </div>
                
                <p className="text-xs text-gray-400 mt-8 max-w-xs mx-auto leading-relaxed">
                    Your credit score is in the top 15% of users! You qualify for premium rates.
                </p>
             </div>

             {/* Loan Offers */}
             <div>
                <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="font-bold text-xl text-gray-800 dark:text-white">Available Offers</h3>
                    <button className={`text-xs font-bold ${themes[accentColor].text}`}>See All</button>
                </div>

                {/* Hero Offer */}
                <div className={`relative overflow-hidden p-6 rounded-[2rem] shadow-lg ${themes[accentColor].bg} text-black mb-4 group cursor-pointer transition-all hover:scale-[1.02] hover:shadow-xl`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                    
                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md shadow-sm">
                            <Zap size={24} className="text-black" />
                        </div>
                        <span className="bg-black/10 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md border border-black/5">Instant Approval</span>
                    </div>
                    
                    <div className="relative z-10">
                        <p className="text-sm font-bold opacity-70 mb-1 uppercase tracking-wider">Payday Advance</p>
                        <h4 className="text-4xl font-black mb-6 tracking-tight">$500.00</h4>
                        
                        <div className="flex items-center justify-between text-sm font-bold bg-white/40 p-1 pl-4 rounded-xl backdrop-blur-md border border-white/20">
                            <span>Repay in 30 days</span>
                            <div className="bg-black text-white p-3 rounded-lg">
                                <ArrowRight size={16} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Secondary Offer */}
                <div className="bg-white dark:bg-[#1c1c1e] p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-[#2c2c2e] flex items-center justify-between group cursor-not-allowed opacity-70 hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-5">
                        <div className="bg-gray-50 dark:bg-[#2c2c2e] p-4 rounded-2xl text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                            <Briefcase size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-800 dark:text-white text-lg">Business Loan</h4>
                            <p className="text-sm text-gray-500">Unlock at 750 score</p>
                        </div>
                    </div>
                    <Lock size={20} className="text-gray-300 dark:text-gray-600" />
                </div>
             </div>

             {/* Active Loans */}
             <div>
                <h3 className="font-bold text-xl text-gray-800 dark:text-white mb-4 px-2">Active Loans</h3>
                <div className="bg-white dark:bg-[#1c1c1e] p-8 rounded-[2rem] flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-100 dark:border-[#2c2c2e]">
                    <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4 text-green-500">
                        <CheckCircle size={32} />
                    </div>
                    <h4 className="font-bold text-gray-800 dark:text-white text-lg">Debt Free!</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-[200px]">You don't have any active loans at the moment.</p>
                </div>
             </div>
        </div>
    </div>
);

const SpendingStoryScreen: FC<{ onBack: () => void; accentColor: ThemeColor; transactions: Transaction[]; currency: string; conversionRate: number }> = ({ onBack, accentColor, transactions, currency, conversionRate }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    const previousMonth = date.toLocaleString('default', { month: 'long' });

    // Calculate stats
    const symbol = currency === 'USD' ? '$' : 'K';
    
    // Filter to expenses only (isCredit === false)
    const expenses = transactions.filter(t => !t.isCredit);
    
    const totalSpent = expenses.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const displayTotal = (currency === 'ZMW' ? totalSpent * conversionRate : totalSpent).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const categories = expenses.reduce((acc, t) => {
        const cat = t.category || 'Other';
        acc[cat] = (acc[cat] || 0) + parseFloat(t.amount);
        return acc;
    }, {} as Record<string, number>);

    const topCategoryEntry: [string, number] = (Object.entries(categories) as [string, number][]).sort((a, b) => b[1] - a[1])[0] || ['Nothing', 0];
    
    const categoryNames: Record<string, string> = {
        'send': 'Sending Money',
        'withdraw': 'Cash Withdrawals',
        'transfer': 'Transfers',
        'bill': 'Paying Bills',
        'savings': 'Savings Quests',
        'activity': 'General Activities',
        'Other': 'Miscellaneous'
    };

    const topCategoryName = categoryNames[topCategoryEntry[0]] || topCategoryEntry[0];
    const topCategoryAmount = (currency === 'ZMW' ? (topCategoryEntry[1] as number) * conversionRate : (topCategoryEntry[1] as number)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const biggestTransaction = [...expenses].sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))[0];
    const biggestAmount = biggestTransaction ? (currency === 'ZMW' ? parseFloat(biggestTransaction.amount) * conversionRate : parseFloat(biggestTransaction.amount)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';

    const slides = [
        {
            bg: "bg-gradient-to-br from-purple-600 to-blue-600",
            content: (
                <>
                    <h1 className="text-6xl font-black mb-4 tracking-tighter">Your {previousMonth}</h1>
                    <h2 className="text-4xl font-bold opacity-90">Wrapped 🎁</h2>
                    <p className="mt-8 text-lg font-medium">It was a vibe. Let's recap your spending.</p>
                </>
            )
        },
        {
            bg: "bg-[#1DB954]", // Spotify Green-ish
            content: (
                <>
                    <span className="text-8xl mb-6 animate-bounce">💸</span>
                    <h2 className="text-3xl font-bold mb-2">Total Damage</h2>
                    <p className="text-xl font-medium opacity-90">You spent {symbol}{displayTotal}</p>
                    <p className="mt-8 text-sm opacity-75">Money comes and goes, right?</p>
                </>
            )
        },
        {
            bg: "bg-orange-500",
            content: (
                <>
                    <span className="text-8xl mb-6">🏆</span>
                    <h2 className="text-3xl font-bold mb-2">Top Category</h2>
                    <p className="text-xl font-medium opacity-90">{symbol}{topCategoryAmount} on {topCategoryName}</p>
                    <p className="mt-8 text-sm opacity-75">We all have our priorities.</p>
                </>
            )
        },
        {
            bg: "bg-pink-500",
            content: (
                <>
                    <span className="text-8xl mb-6">😱</span>
                    <h2 className="text-3xl font-bold mb-2">Biggest Splurge</h2>
                    <p className="text-xl font-medium opacity-90">{symbol}{biggestAmount} for {biggestTransaction?.type || 'Something'}</p>
                    <p className="mt-8 text-sm opacity-75">Worth every penny.</p>
                </>
            )
        },
        {
            bg: "bg-black",
            content: (
                <>
                    <h2 className="text-2xl font-bold mb-6 uppercase tracking-widest text-gray-400">Your Money Mood</h2>
                    <span className="text-9xl mb-6 block">💅</span>
                    <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-500">Material Gworl</h1>
                    <p className="mt-8 text-lg text-gray-300">"I see it, I like it, I want it, I got it."</p>
                </>
            )
        }
    ];

    useEffect(() => {
        const timer = setTimeout(() => {
            if (currentSlide < slides.length - 1) {
                setCurrentSlide(c => c + 1);
            } else {
                // Optional: Auto-close on finish? 
                // onBack(); 
            }
        }, 4000);
        return () => clearTimeout(timer);
    }, [currentSlide, slides.length]);

    const handleNext = () => {
        if (currentSlide < slides.length - 1) setCurrentSlide(c => c + 1);
        else onBack();
    };

    const handlePrev = () => {
        if (currentSlide > 0) setCurrentSlide(c => c - 1);
    };

    return (
        <div className={`fixed inset-0 z-[100] flex flex-col text-white transition-colors duration-500 ease-in-out ${slides[currentSlide].bg}`} onClick={handleNext}>
            {/* Progress Bar */}
            <div className="absolute top-0 left-0 w-full flex gap-1 p-2 z-50 safe-top">
                {slides.map((_, i) => (
                    <div key={i} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                        <div 
                            className={`h-full bg-white ${i < currentSlide ? 'w-full' : 'w-0'}`}
                            style={i === currentSlide ? { animation: 'progress 4s linear forwards' } : {}}
                        />
                    </div>
                ))}
            </div>

            <style>{`
                @keyframes progress {
                    from { width: 0%; }
                    to { width: 100%; }
                }
            `}</style>

            <button onClick={(e) => { e.stopPropagation(); onBack(); }} className="absolute top-6 right-4 z-50 p-2 bg-black/20 rounded-full hover:bg-black/40 backdrop-blur-sm"><X size={24}/></button>
            
            {/* Navigation Zones */}
            <div className="absolute inset-y-0 left-0 w-1/3 z-40" onClick={(e) => { e.stopPropagation(); handlePrev(); }}></div>
            <div className="absolute inset-y-0 right-0 w-1/3 z-40" onClick={(e) => { e.stopPropagation(); handleNext(); }}></div>

            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 animate-in fade-in zoom-in duration-500 key={currentSlide}">
                {slides[currentSlide].content}
            </div>
            
            <div className="absolute bottom-8 w-full text-center text-xs font-bold uppercase tracking-widest opacity-50">
                Tap to continue
            </div>
        </div>
    );
};

// --- Savings Quest Screen (GAMIFIED) ---
const SavingsQuestScreen: FC<{ onBack: () => void; accentColor: ThemeColor; addTransaction: any; balanceUSD: number; currency: string; conversionRate: number }> = ({ onBack, accentColor, addTransaction, balanceUSD, currency, conversionRate }) => {
    const [goal, setGoal] = useState({ 
        name: 'The Next Level Laptop', 
        target: 1500, 
        saved: 850, 
        level: 3 
    });
    const [depositAmount, setDepositAmount] = useState('');
    const [status, setStatus] = useState<'deposit' | 'complete' | 'failure' | null>(null);

    const progressPercent = Math.min(100, (goal.saved / goal.target) * 100);
    const remaining = goal.target - goal.saved;

    const handleDeposit = (e: React.FormEvent) => {
        e.preventDefault();
        const amountNum = parseFloat(depositAmount);
        if (amountNum > 0) {
            const amountUSD = currency === 'ZMW' ? amountNum / conversionRate : amountNum;
            if (amountUSD > balanceUSD) {
                setStatus('failure');
                return;
            }

            const newSaved = goal.saved + amountUSD;
            const isGoalComplete = newSaved >= goal.target;

            addTransaction({ 
                icon: <PiggyBank size={18}/>, 
                type: `Savings Deposit: ${goal.name}`, 
                date: 'Just now', 
                amount: amountUSD.toString(), 
                isCredit: false,
                category: 'savings'
            }); 
            
            setGoal(prev => ({
                ...prev,
                saved: newSaved,
                level: isGoalComplete ? prev.level + 1 : prev.level // Level up on completion
            }));
            
            setStatus(isGoalComplete ? 'complete' : 'deposit');
            setDepositAmount('');
        }
    };

    const resetAndBack = () => { setStatus(null); onBack(); };

    if (status === 'deposit' || status === 'complete' || status === 'failure') {
        const title = status === 'complete' ? 'GOAL CONQUERED!' : (status === 'failure' ? 'Transaction Failed' : 'Deposit Successful!');
        const message = status === 'complete' 
            ? `You hit your target of $${goal.target}! Time to claim your reward and set a new quest.`
            : (status === 'failure' 
                ? 'Insufficient funds to complete this deposit.' 
                : `You added $${depositAmount} to your quest and earned 100 XP! ${remaining > 0 ? `$${remaining.toFixed(2)} to go!` : 'Goal Complete!'}`);

        return (
            <div className="flex flex-col h-full bg-gray-50 dark:bg-black">
                <ScreenHeader title="Savings Quest" onBack={resetAndBack} />
                <TransactionStatusScreen 
                    status={status === 'failure' ? 'failure' : 'success'} 
                    title={title} 
                    message={message} 
                    onDone={resetAndBack} 
                    accentColor={accentColor} 
                >
                    {status === 'complete' && (
                        <Award size={60} className="text-white mb-4 animate-bounce" />
                    )}
                </TransactionStatusScreen>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col h-full bg-gray-100 dark:bg-black">
            <ScreenHeader title="Savings Quest" onBack={onBack} />
            <div className="p-6 flex-grow overflow-y-auto no-scrollbar">
                {/* Gamified Header */}
                <div className={`bg-white dark:bg-[#1c1c1e] p-6 rounded-3xl shadow-xl flex justify-between items-center mb-6 border-b-4`} style={{borderColor: themes[accentColor].base}}>
                    <div>
                        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Current Level</p>
                        <p className={`text-4xl font-extrabold ${themes[accentColor].text}`}>Level {goal.level}</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <PiggyBank size={48} className={`${themes[accentColor].text}`} />
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-1">Quest Master</p>
                    </div>
                </div>

                {/* Goal Details */}
                <div className="bg-white dark:bg-[#1c1c1e] p-6 rounded-2xl shadow-lg space-y-4">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">{goal.name}</h3>
                    
                    <div className="flex justify-between text-sm font-semibold">
                        <span className="text-gray-600 dark:text-gray-400">Target: ${goal.target.toFixed(2)}</span>
                        <span className={`${themes[accentColor].text}`}>Saved: ${goal.saved.toFixed(2)}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 dark:bg-[#2c2c2e] rounded-full h-3">
                        <div 
                            className={`h-3 rounded-full transition-all duration-500`} 
                            style={{ width: `${progressPercent}%`, backgroundColor: themes[accentColor].base }}
                        />
                    </div>
                    
                    <div className="text-center pt-2">
                        {remaining > 0 ? (
                            <p className="text-xl font-extrabold text-gray-800 dark:text-white">${remaining.toFixed(2)} left!</p>
                        ) : (
                            <p className={`text-xl font-extrabold ${themes[accentColor].text}`}>Goal Achieved!</p>
                        )}
                    </div>
                </div>

                {/* Deposit Form */}
                <form onSubmit={handleDeposit} className="mt-6 space-y-4">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">Quick Deposit</h3>
                    <FormInput 
                        label={`Amount to Save (${currency === 'USD' ? '$' : 'K'})`}
                        type="number" 
                        step="1.00" 
                        value={depositAmount} 
                        onChange={e => setDepositAmount(e.target.value)} 
                        placeholder="e.g., 50.00" 
                        required 
                        accentColor={accentColor} 
                        className="text-lg"
                    />
                    <button 
                        type="submit" 
                        className={`w-full ${themes[accentColor].bg} text-black font-bold py-3 rounded-xl hover:opacity-90 transition-opacity`}
                        disabled={remaining <= 0}
                    >
                        {remaining <= 0 ? 'Goal Complete - Set New Quest' : 'Deposit Now & Earn XP'}
                    </button>
                </form>

            </div>
        </div>
    );
};

// --- Agent Map Screen ---
const AgentMapScreen: FC<{ onBack: () => void; accentColor: ThemeColor }> = ({ onBack, accentColor }) => {
    const [agents, setAgents] = useState<UserProfile[]>([]);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get user's location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const loc: [number, number] = [position.coords.latitude, position.coords.longitude];
                    setUserLocation(loc);
                },
                (error) => {
                    console.warn("Error getting location:", error);
                    // Fallback to a default location (e.g., Lusaka) if denied
                    const loc: [number, number] = [-15.3875, 28.3228];
                    setUserLocation(loc);
                },
                { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 }
            );
        } else {
            const loc: [number, number] = [-15.3875, 28.3228];
            setUserLocation(loc);
        }

        // Subscribe to real-time agent presence
        const channel = supabase.channel('online_agents');

        channel.on('presence', { event: 'sync' }, () => {
            const newState = channel.presenceState();
            const onlineAgents: UserProfile[] = [];
            for (const key in newState) {
                const presences = newState[key] as any[];
                if (presences.length > 0) {
                    const presence = presences[0];
                    onlineAgents.push({
                        id: presence.id,
                        name: presence.name,
                        latitude: presence.latitude,
                        longitude: presence.longitude,
                        avatarUrl: presence.avatarUrl,
                        skinTone: presence.skinTone,
                        gender: presence.gender,
                        seed: presence.seed,
                        style: presence.style,
                        fixedHair: presence.fixedHair,
                        noBeard: presence.noBeard,
                        isOnline: true,
                    });
                }
            }
            
            setAgents(onlineAgents);
            setLoading(false);
        });

        channel.subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Custom marker icon for agents
    const agentIcon = L.divIcon({
        className: 'custom-agent-marker',
        html: `<div style="background-color: ${themes[accentColor].base}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg></div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
    });

    // Custom marker icon for user
    const userIcon = L.divIcon({
        className: 'custom-user-marker',
        html: `<div style="background-color: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        popupAnchor: [0, -10]
    });

    return (
        <div className="flex flex-col h-full bg-gray-100 dark:bg-black relative">
            <div className="absolute top-4 left-4 z-[1000]">
                <button onClick={onBack} className="p-3 bg-white dark:bg-[#1c1c1e] rounded-full shadow-lg hover:bg-gray-50 dark:hover:bg-[#2c2c2e] transition-colors">
                    <ArrowLeft size={24} className="text-gray-800 dark:text-white" />
                </button>
            </div>
            
            <div className="absolute top-4 right-4 z-[1000] bg-white dark:bg-[#1c1c1e] px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-sm font-bold text-gray-800 dark:text-white">{agents.length} Agents Online</span>
            </div>

            <div className="flex-grow relative z-0">
                {!userLocation || loading ? (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-[#1c1c1e]">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
                    </div>
                ) : (
                    <MapContainer 
                        center={userLocation} 
                        zoom={14} 
                        style={{ height: '100%', width: '100%' }}
                        zoomControl={false}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        />
                        
                        {/* User Location Marker */}
                        <Marker position={userLocation} icon={userIcon}>
                            <Popup>
                                <div className="text-center font-bold">You are here</div>
                            </Popup>
                        </Marker>

                        {/* Agent Markers */}
                        {agents.map(agent => (
                            agent.latitude && agent.longitude && (
                                <Marker 
                                    key={agent.id} 
                                    position={[agent.latitude, agent.longitude]}
                                    icon={agentIcon}
                                >
                                    <Popup className="custom-popup">
                                        <div className="text-center p-1">
                                            <p className="font-bold text-lg mb-1">@{agent.name}</p>
                                            <p className="text-xs text-gray-500 mb-3">iPAY Agent</p>
                                            <button 
                                                className={`w-full py-2 px-4 rounded-lg text-white font-bold text-sm ${themes[accentColor].bg}`}
                                                onClick={() => {
                                                    // In a real app, this might open a chat or directions
                                                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${agent.latitude},${agent.longitude}`, '_blank');
                                                }}
                                            >
                                                Get Directions
                                            </button>
                                        </div>
                                    </Popup>
                                </Marker>
                            )
                        ))}
                    </MapContainer>
                )}
            </div>
        </div>
    );
};

// --- Main App ---
export default function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false); // Auth State
    const [view, setView] = useState<'client' | 'agent'>('client');
    const [screen, setScreen] = useState('home');
    const [theme, setTheme] = useState('dark');
    const [accentColor, setAccentColor] = useState<ThemeColor>('green'); // Default to Green for Cash App style
    const [currentUser, setCurrentUser] = useState<any>(null);
    
    const [currency, setCurrency] = useState('USD');
    const [conversionRate, setConversionRate] = useState(25.0); 
    const toggleCurrency = () => { setCurrency(c => c === 'USD' ? 'ZMW' : 'USD'); };

    // Fetch Real-Time Currency Rate
    useEffect(() => {
        const fetchRate = async () => {
            try {
                const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
                const data = await response.json();
                if (data && data.rates && data.rates.ZMW) {
                    setConversionRate(data.rates.ZMW);
                }
            } catch (error) {
                console.error("Failed to fetch currency rate:", error);
                // Fallback to 27.5 if API fails
                setConversionRate(27.5);
            }
        };

        fetchRate();
        
        // Refresh every 10 minutes
        const interval = setInterval(fetchRate, 600000);
        return () => clearInterval(interval);
    }, []);
    
    const [userProfile, setUserProfile] = useState<UserProfile>({ 
        name: "Alex Morgan", 
        skinTone: "edb98a", 
        gender: "feminine", 
        seed: "Alex", 
        style: "avataaars", 
        fixedHair: null, 
        noBeard: false,
        cardSkin: {
            background: `linear-gradient(135deg, #10b981 0%, #000000 100%)`, // Default Green
            pattern: null,
            id: 'green'
        }
    });

    // Client State
    const [clientBalanceUSD, setClientBalanceUSD] = useState(1000.00);
    const [clientTransactions, setClientTransactions] = useState<Transaction[]>([]);
    
    // Agent State
    const [agentBalanceUSD, setAgentBalanceUSD] = useState(5000.00);
    const [agentCommissionUSD, setAgentCommissionUSD] = useState(145.50);
    const [agentTransactions, setAgentTransactions] = useState<Transaction[]>([]);

    const [incomingRequest, setIncomingRequest] = useState<PendingRequest | null>(null);
    const [requestActionStatus, setRequestActionStatus] = useState<'success' | 'failure' | null>(null);

    const agentPresenceChannelRef = useRef<any>(null);

    // Manage Agent Presence
    useEffect(() => {
        if (view === 'agent' && userProfile?.isOnline && userProfile?.id) {
            if (!agentPresenceChannelRef.current) {
                const channel = supabase.channel('online_agents', {
                    config: {
                        presence: {
                            key: userProfile.id,
                        },
                    },
                });

                channel.subscribe(async (status) => {
                    if (status === 'SUBSCRIBED') {
                        await channel.track({
                            id: userProfile.id,
                            name: userProfile.name,
                            latitude: userProfile.latitude,
                            longitude: userProfile.longitude,
                            avatarUrl: userProfile.avatarUrl,
                            skinTone: userProfile.skinTone,
                            gender: userProfile.gender,
                            seed: userProfile.seed,
                            style: userProfile.style,
                            fixedHair: userProfile.fixedHair,
                            noBeard: userProfile.noBeard,
                        });
                    }
                });
                agentPresenceChannelRef.current = channel;
            } else {
                const channel = agentPresenceChannelRef.current;
                if (channel.state === 'joined') {
                    channel.track({
                        id: userProfile.id,
                        name: userProfile.name,
                        latitude: userProfile.latitude,
                        longitude: userProfile.longitude,
                        avatarUrl: userProfile.avatarUrl,
                        skinTone: userProfile.skinTone,
                        gender: userProfile.gender,
                        seed: userProfile.seed,
                        style: userProfile.style,
                        fixedHair: userProfile.fixedHair,
                        noBeard: userProfile.noBeard,
                    });
                }
            }
        } else if (!userProfile?.isOnline && agentPresenceChannelRef.current) {
            agentPresenceChannelRef.current.unsubscribe();
            agentPresenceChannelRef.current = null;
        }
    }, [view, userProfile?.isOnline, userProfile?.latitude, userProfile?.longitude, userProfile?.id]);

    useEffect(() => {
        // Check active session on mount
        supabase.auth.getSession().then(({ data: { session } }) => {
            setIsAuthenticated(!!session);
            setCurrentUser(session?.user ?? null);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setIsAuthenticated(!!session);
            setCurrentUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Real-time Subscription & Initialization Effect
    useEffect(() => {
        if (currentUser?.id) {
            initializeUser(currentUser);

            // Subscribe to real-time changes for this user's transactions
            const channel = supabase
                .channel('realtime-transactions')
                .on(
                    'postgres_changes',
                    {
                        event: '*', // Listen to ALL events (INSERT, UPDATE, DELETE)
                        schema: 'public',
                        table: 'transactions',
                        filter: `user_id=eq.${currentUser.id}`
                    },
                    (payload) => {
                        console.log('Real-time transaction update received:', payload);
                        // When a new transaction comes in (e.g. received money), refresh
                        fetchTransactions(currentUser.id);
                    }
                )
                .subscribe();

            // Subscribe to real-time changes for this user's profile (e.g. Agent Approval, Balance Updates)
            const profileChannel = supabase
                .channel('realtime-profile')
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'profiles',
                        filter: `id=eq.${currentUser.id}`
                    },
                    (payload) => {
                        const newProfile = payload.new as any;
                        if (newProfile) {
                            setUserProfile(prev => ({
                                ...prev,
                                agentStatus: newProfile.agent_status || prev.agentStatus,
                                // Sync other fields that might change via Admin
                                name: newProfile.username ? `@${newProfile.username}` : prev.name,
                                avatarUrl: newProfile.avatar_url || prev.avatarUrl,
                            }));

                            // Real-time Balance Updates
                            if (newProfile.commission_balance !== undefined && newProfile.commission_balance !== null) {
                                setAgentCommissionUSD(parseFloat(newProfile.commission_balance));
                            }
                            if (newProfile.float_balance !== undefined && newProfile.float_balance !== null) {
                                setAgentBalanceUSD(parseFloat(newProfile.float_balance));
                            }
                        }
                    }
                )
                .subscribe();

            // Subscribe to pending requests (Client Side)
            const requestsChannel = supabase
                .channel('realtime-requests')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'pending_requests',
                        filter: `client_id=eq.${currentUser.id}`
                    },
                    (payload) => {
                        console.log('New withdrawal request received:', payload);
                        if (payload.new.status === 'pending') {
                            setIncomingRequest(payload.new as PendingRequest);
                        }
                    }
                )
                .subscribe();

            // Polling Fallback (Every 5 seconds)
            const pollInterval = setInterval(async () => {
                const { data, error } = await supabase
                    .from('pending_requests')
                    .select('*')
                    .eq('client_id', currentUser.id)
                    .eq('status', 'pending')
                    .limit(1);
                
                if (data && data.length > 0) {
                    // Only update if we don't already have one to avoid flicker
                    setIncomingRequest(prev => prev ? prev : data[0]);
                }
            }, 5000);

            return () => {
                supabase.removeChannel(channel);
                supabase.removeChannel(profileChannel);
                supabase.removeChannel(requestsChannel);
                clearInterval(pollInterval);
            };
        }
    }, [currentUser?.id]);

    const initializeUser = async (user: any) => {
        console.log("Initializing user:", user.id);
        // Set email and role
        const email = user.email;
        const role = email?.endsWith('@ipay.com') || email === 'vincentlewa6@gmail.com' ? 'admin' : 'user';
        setUserProfile(prev => ({ ...prev, email, role }));

        // 1. Fetch latest profile from DB (Source of Truth)
        const { data: dbProfile, error: dbError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        console.log("DB Profile Fetch Result:", { dbProfile, dbError });

        if (dbProfile) {
            setUserProfile(prev => ({
                ...prev,
                name: dbProfile.username ? `@${dbProfile.username}` : prev.name,
                avatarUrl: (dbProfile.avatar_url && !dbProfile.avatar_url.startsWith('blob:')) ? dbProfile.avatar_url : prev.avatarUrl,
                skinTone: dbProfile.skin_tone || prev.skinTone,
                gender: dbProfile.gender || prev.gender,
                seed: dbProfile.seed || prev.seed,
                style: dbProfile.style || prev.style,
                fixedHair: dbProfile.fixed_hair || prev.fixedHair,
                noBeard: dbProfile.no_beard || prev.noBeard,
                agentStatus: dbProfile.agent_status || prev.agentStatus,
                // Agent Details
                fullName: dbProfile.full_name || prev.fullName,
                idNumber: dbProfile.id_number || prev.idNumber,
                businessName: dbProfile.business_name || prev.businessName,
                address: dbProfile.address || prev.address
            }));
            
            // Initialize Balances if they exist
            if (dbProfile.commission_balance !== undefined && dbProfile.commission_balance !== null) {
                setAgentCommissionUSD(parseFloat(dbProfile.commission_balance));
            }
            if (dbProfile.float_balance !== undefined && dbProfile.float_balance !== null) {
                setAgentBalanceUSD(parseFloat(dbProfile.float_balance));
            }
        }

        const meta = user.user_metadata;
        if (meta) {
            if (meta.ipayTag) {
                // If DB profile was missing or incomplete, we might still want to use metadata or sync it
                if (!dbProfile) {
                     setUserProfile(prev => ({ ...prev, name: `@${meta.ipayTag}` }));
                }
                
                // Ensure profile exists for P2P lookups and Admin Dashboard (Self-healing for existing users)
                // Only upsert if we didn't find a profile, or if we want to ensure fields are synced.
                // To avoid overwriting the DB with old metadata, we should only upsert if DB profile is missing.
                if (!dbProfile) {
                    const { error: profileError } = await supabase.from('profiles').upsert({
                        id: user.id,
                        username: meta.ipayTag,
                        updated_at: new Date().toISOString(),
                        // Sync metadata values if available, otherwise use defaults
                        skin_tone: userProfile.skinTone || 'edb98a',
                        gender: userProfile.gender || 'feminine',
                        seed: userProfile.seed || 'Alex',
                        style: userProfile.style || 'avataaars',
                        agent_status: userProfile.agentStatus || 'none',
                        fixed_hair: userProfile.fixedHair || null,
                        no_beard: userProfile.noBeard || false,
                        avatar_url: meta.avatarUrl || null
                    }, { onConflict: 'id' });
                    if (profileError) console.warn('Profile sync failed', profileError);
                }
            }
            if (meta.balance !== undefined) {
                // We use calculated balance from transactions as source of truth now, 
                // but this is a good fallback for initial render
                setClientBalanceUSD(meta.balance);
            }
            // Self-healing: If metadata has an avatar but DB doesn't (or differs), update DB to match metadata
            // This fixes issues where avatar updates might have failed to persist to DB but succeeded in Auth Metadata
            // CRITICAL FIX: Ignore 'blob:' URLs which are temporary and should never be persisted
            if (meta.avatarUrl && !meta.avatarUrl.startsWith('blob:') && (!dbProfile || dbProfile.avatar_url !== meta.avatarUrl)) {
                console.log("Syncing avatar from metadata to DB...", meta.avatarUrl);
                setUserProfile(prev => ({ ...prev, avatarUrl: meta.avatarUrl }));
                
                // Update DB asynchronously to ensure persistence
                await supabase.from('profiles').upsert({
                    id: user.id,
                    avatar_url: meta.avatarUrl,
                    updated_at: new Date().toISOString(),
                    // Ensure other fields are not lost if this is a new insert
                    username: meta.ipayTag || userProfile.name.replace('@', ''),
                    agent_status: userProfile.agentStatus || 'none'
                }, { onConflict: 'id' });
            }
            // Add persistence loading for theme and accentColor
            if (meta.theme) {
                setTheme(meta.theme);
            }
            if (meta.accentColor) {
                setAccentColor(meta.accentColor);
            }
            // Load Card Skin
            if (meta.cardSkin) {
                setUserProfile(prev => ({ ...prev, cardSkin: meta.cardSkin }));
            }
            // Load Agent Status & Details (Fallback if not in DB)
            if (meta.agentStatus && (!dbProfile || !dbProfile.agent_status)) {
                setUserProfile(prev => ({ 
                    ...prev, 
                    agentStatus: meta.agentStatus,
                    fullName: meta.fullName,
                    idNumber: meta.idNumber,
                    businessName: meta.businessName,
                    address: meta.address
                }));
            }
        }
        await fetchTransactions(user.id);
    }

    // Polling fallback for Agent Status (in case Realtime is disabled/flaky)
    useEffect(() => {
        if (!isAuthenticated || userProfile.agentStatus !== 'pending') return;

        const pollInterval = setInterval(async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: dbProfile } = await supabase
                    .from('profiles')
                    .select('agent_status')
                    .eq('id', user.id)
                    .single();
                
                if (dbProfile && dbProfile.agent_status !== userProfile.agentStatus) {
                    setUserProfile(prev => ({ ...prev, agentStatus: dbProfile.agent_status }));
                }
            }
        }, 3000); // Poll every 3 seconds

        return () => clearInterval(pollInterval);
    }, [isAuthenticated, userProfile.agentStatus]);

    const fetchTransactions = async (userId: string) => {
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (!error && data) {
            const fetchedClientTx: Transaction[] = [];
            const fetchedAgentTx: Transaction[] = [];
            
            // Calculate balances (Base + Transactions)
            let calculatedClientBalance = 1250.75; 
            let calculatedAgentBalance = 5000.00;

            data.forEach((row: any) => {
                const tx: Transaction = {
                    id: row.id,
                    icon: getIconForCategory(row.category || 'activity'),
                    type: row.type,
                    date: formatDate(row.created_at),
                    amount: row.amount.toString(),
                    isCredit: row.is_credit,
                    fee: row.fee,
                    commission: row.commission,
                    category: row.category,
                    role: row.role
                };
                
                const amt = parseFloat(tx.amount);

                if (row.role === 'agent') {
                    fetchedAgentTx.push(tx);
                    // Update calculated agent balance
                    if (tx.isCredit) {
                        calculatedAgentBalance += amt;
                    } else {
                        calculatedAgentBalance -= amt;
                    }
                    // Add commission if any
                    if (tx.commission) {
                        calculatedAgentBalance += parseFloat(tx.commission.toString());
                    }
                } else {
                    fetchedClientTx.push(tx);
                    // Update calculated balance
                    if (tx.isCredit) {
                        calculatedClientBalance += amt;
                    } else {
                        calculatedClientBalance -= (amt + (tx.fee || 0));
                    }
                }
            });
            setClientTransactions(fetchedClientTx);
            setAgentTransactions(fetchedAgentTx);
            
            // Override metadata balance with calculated balance to include P2P receipts
            setClientBalanceUSD(calculatedClientBalance);
            setAgentBalanceUSD(calculatedAgentBalance);
        }
    };

    const updateSupabaseBalance = async (newBalance: number) => {
        await supabase.auth.updateUser({ data: { balance: newBalance } });
    }

    // New handlers for persisting settings
    const updateTheme = async (newTheme: string) => {
        setTheme(newTheme);
        if (isAuthenticated) {
            await supabase.auth.updateUser({ data: { theme: newTheme } });
        }
    }

    const updateAccentColor = async (newColor: ThemeColor) => {
        setAccentColor(newColor);
        if (isAuthenticated) {
            await supabase.auth.updateUser({ data: { accentColor: newColor } });
        }
    }

    // Function to handle full profile updates including avatarUrl persistence
    const handleProfileUpdate = async (updatedProfile: UserProfile) => {
        console.log("Updating profile...", updatedProfile);
        setUserProfile(updatedProfile);
        
        if (isAuthenticated) {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                
                if (!user) {
                    console.error("No authenticated user found during profile update");
                    return;
                }

                // Sanitize avatarUrl: Never save blob URLs to DB/Auth
                const avatarUrlToSave = (updatedProfile.avatarUrl && updatedProfile.avatarUrl.startsWith('blob:')) 
                    ? (userProfile.avatarUrl && !userProfile.avatarUrl.startsWith('blob:') ? userProfile.avatarUrl : null)
                    : updatedProfile.avatarUrl;

                // Update Auth Metadata
                const { error: authError } = await supabase.auth.updateUser({
                    data: {
                        ipayTag: updatedProfile.name.replace('@', ''),
                        skinTone: updatedProfile.skinTone,
                        gender: updatedProfile.gender,
                        seed: updatedProfile.seed,
                        style: updatedProfile.style,
                        fixedHair: updatedProfile.fixedHair,
                        noBeard: updatedProfile.noBeard,
                        avatarUrl: avatarUrlToSave,
                        cardSkin: updatedProfile.cardSkin,
                        agentStatus: updatedProfile.agentStatus,
                        fullName: updatedProfile.fullName,
                        idNumber: updatedProfile.idNumber,
                        businessName: updatedProfile.businessName,
                        address: updatedProfile.address
                    }
                });
                
                if (authError) {
                    console.error("Auth metadata update failed:", authError);
                } else {
                    console.log("Auth metadata updated successfully");
                }

                // Sync to Public Profiles Table for Admin/P2P
                // We explicitly include all fields to ensure the row is complete
                const { data, error: dbError } = await supabase.from('profiles').upsert({
                    id: user.id,
                    username: updatedProfile.name.replace('@', ''),
                    avatar_url: avatarUrlToSave,
                    agent_status: updatedProfile.agentStatus || 'none',
                    updated_at: new Date().toISOString(),
                    // Store other profile fields if needed by admin dashboard
                    skin_tone: updatedProfile.skinTone,
                    gender: updatedProfile.gender,
                    seed: updatedProfile.seed,
                    style: updatedProfile.style,
                    fixed_hair: updatedProfile.fixedHair,
                    no_beard: updatedProfile.noBeard,
                    // Agent Application Details
                    full_name: updatedProfile.fullName,
                    id_number: updatedProfile.idNumber,
                    business_name: updatedProfile.businessName,
                    address: updatedProfile.address
                }, { onConflict: 'id' }).select();

                if (dbError) {
                    console.error("DB profile update failed:", dbError);
                } else {
                    console.log("DB profile updated successfully:", data);
                }
            } catch (err) {
                console.error("Unexpected error in handleProfileUpdate:", err);
            }
        }
    };

    const handleCardSkinUpdate = async (newSkin: { background: string; pattern: string | null; id: string }) => {
        const updatedProfile = { ...userProfile, cardSkin: newSkin };
        setUserProfile(updatedProfile);
        if (isAuthenticated) {
            await supabase.auth.updateUser({
                data: {
                    cardSkin: newSkin
                }
            });
        }
    };

    const addClientTransaction = async (tx: Transaction, fee = 0) => { 
        let newBalance = clientBalanceUSD;
        if (!tx.isCredit) { 
            // Deduct total (Amount + Fee)
            newBalance = clientBalanceUSD - (parseFloat(tx.amount) + fee);
        } else { 
            newBalance = clientBalanceUSD + parseFloat(tx.amount);
        }
        
        // Optimistic update removed to prevent duplicates with Realtime
        // setClientBalanceUSD(newBalance);
        // setClientTransactions(prev => [tx, ...prev]); 
        
        // Persist to Supabase if authenticated
        if (isAuthenticated) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await updateSupabaseBalance(newBalance);
                await supabase.from('transactions').insert({
                    user_id: user.id,
                    type: tx.type,
                    amount: parseFloat(tx.amount),
                    is_credit: tx.isCredit,
                    category: tx.category || 'activity',
                    fee: fee,
                    role: 'client'
                });

                // P2P Transfer Logic: If sending money, try to credit the recipient
                if (!tx.isCredit && tx.type.startsWith('Sent to ')) {
                    // Strip 'Sent to ' and any '@' symbol to get the clean username
                    const recipientTag = tx.type.replace('Sent to ', '').trim().replace('@', '');
                    
                    // 1. Find recipient ID from profiles
                    const { data: profiles } = await supabase
                        .from('profiles')
                        .select('id')
                        .eq('username', recipientTag)
                        .limit(1);
                    
                    if (profiles && profiles.length > 0) {
                        const recipientId = profiles[0].id;
                        // 2. Insert credit transaction for recipient
                        await supabase.from('transactions').insert({
                            user_id: recipientId,
                            type: `Received from ${userProfile.name}`,
                            amount: parseFloat(tx.amount),
                            is_credit: true,
                            category: 'receive',
                            role: 'client'
                        });
                    }
                }

                // Agent Withdrawal Logic: If withdrawing cash, credit the agent (Agent receives digital money)
                if (!tx.isCredit && tx.type.startsWith('Cash Withdrawal from ')) {
                    const agentTag = tx.type.replace('Cash Withdrawal from ', '').trim().replace('@', '');
                    
                    // 1. Find agent ID from profiles
                    const { data: profiles } = await supabase
                        .from('profiles')
                        .select('id')
                        .eq('username', agentTag)
                        .limit(1);
                    
                    if (profiles && profiles.length > 0) {
                        const agentId = profiles[0].id;
                        
                        // Calculate Commission (5% fee, Agent gets 60%)
                        const feeAmount = parseFloat(tx.amount) * 0.05;
                        const commissionAmount = feeAmount * 0.60;

                        // 2. Insert credit transaction for agent
                        await supabase.from('transactions').insert({
                            user_id: agentId,
                            type: `Client Withdrawal: @${userProfile.name.replace('@', '')}`,
                            amount: parseFloat(tx.amount), // Agent receives the full amount
                            is_credit: true,
                            category: 'withdraw', // Explicitly mark as withdraw for dashboard logic
                            role: 'agent',
                            fee: feeAmount,
                            commission: commissionAmount
                        });

                        // 3. Update Agent Balance via RPC
                        await supabase.rpc('update_agent_balance', {
                            agent_id: agentId,
                            amount: parseFloat(tx.amount),
                            commission: commissionAmount,
                            is_withdrawal: true
                        });
                    }
                }
            }
        }
    };

    // --- AGENT LOGIC: INTERACTIVE HANDLER ---
    const handleAgentAction = async (type: string, amount: number, phone: string): Promise<boolean | string> => {
        // 1. Validate Client Exists First
        const clientTag = phone.replace('@', '').trim();
        let clientId: string | null = null;
        let clientName: string = clientTag;

        if (isAuthenticated) {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, username, full_name') // Fetch name for better UI if needed
                .ilike('username', clientTag)
                .limit(1);
            
            if (profiles && profiles.length > 0) {
                clientId = profiles[0].id;
                // Use the actual username from DB to be clean
                clientName = profiles[0].username || clientTag;
            } else {
                // Client not found - abort to prevent "ghost" transactions
                console.error("Client not found:", clientTag);
                return false; 
            }
        }

        if (type === 'Deposit') {
            const commission = amount * 0.001;
            if (agentBalanceUSD < amount) return false;

            // Local State Update
            setAgentBalanceUSD(prev => prev - amount); 
            setAgentCommissionUSD(prev => prev + commission);
            
            const txType = `Agent Deposit to: @${clientName}`;

            setAgentTransactions(prev => [{ icon: <ArrowDownLeft size={18}/>, type: txType, date: 'Just now', amount: amount.toString(), isCredit: false, commission: commission, category: 'deposit', role: 'agent' }, ...prev]);
            
            // DB Persistence
            if (isAuthenticated && clientId) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    // 1. Agent Log
                    await supabase.from('transactions').insert({
                        user_id: user.id,
                        type: txType,
                        amount: amount,
                        is_credit: false, // Float decreases
                        category: 'deposit',
                        commission: commission,
                        role: 'agent'
                    });

                    // 2. Credit Client Account (Real-time)
                    await supabase.from('transactions').insert({
                        user_id: clientId,
                        type: `Agent Deposit: ${userProfile.name}`,
                        amount: amount,
                        is_credit: true,
                        category: 'deposit',
                        role: 'client',
                        fee: 0
                    });

                    // 3. Update Agent Balance via RPC
                    await supabase.rpc('update_agent_balance', {
                        agent_id: user.id,
                        amount: amount,
                        commission: commission,
                        is_withdrawal: false
                    });
                }
            }
            return true;

        } else if (type === 'Withdrawal') {
            // NEW FLOW: Create Pending Request
            if (isAuthenticated && clientId) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data, error } = await supabase
                        .from('pending_requests')
                        .insert({
                            agent_id: user.id,
                            client_id: clientId,
                            amount: amount,
                            agent_name: userProfile.name, // Current Agent Name
                            client_name: clientName,
                            status: 'pending'
                        })
                        .select()
                        .single();

                    if (error) {
                        console.error("Error creating pending request:", error);
                        return false;
                    }
                    
                    // Return the Request ID to the UI so it can listen for updates
                    return data.id;
                }
            }
            return false;
        }
        return false;
    };

    // --- CLIENT LOGIC: Handle Approval/Rejection ---
    const handleRequestResponse = async (approved: boolean) => {
        if (!incomingRequest) return;

        const { id, amount, agent_id, agent_name } = incomingRequest;
        const fee = amount * 0.05;
        const agentCommission = fee * 0.60;

        try {
            if (approved) {
                // 1. Check Balance
                if (clientBalanceUSD < (amount + fee)) {
                    setRequestActionStatus('failure');
                    // Still reject the request in DB so agent knows
                    await supabase.from('pending_requests').update({ status: 'rejected' }).eq('id', id);
                    setIncomingRequest(null);
                    return;
                }

                // 2. Execute Transactions
                // Debit Client
                await supabase.from('transactions').insert({
                    user_id: currentUser.id,
                    type: `Cash Withdrawal at Agent: ${agent_name}`,
                    amount: amount,
                    is_credit: false,
                    category: 'withdraw',
                    role: 'client',
                    fee: fee
                });

                // Credit Agent
                await supabase.from('transactions').insert({
                    user_id: agent_id,
                    type: `Client Withdrawal: @${userProfile.name.replace('@', '')}`,
                    amount: amount,
                    is_credit: true,
                    category: 'withdraw',
                    role: 'agent',
                    fee: fee,
                    commission: agentCommission
                });

                // Update Agent Balance via RPC (Withdrawal: Float Increases, Commission Increases)
                await supabase.rpc('update_agent_balance', {
                    agent_id: agent_id,
                    amount: amount,
                    commission: agentCommission,
                    is_withdrawal: true
                });

                // 3. Update Request Status
                await supabase.from('pending_requests').update({ status: 'approved' }).eq('id', id);
                
                setRequestActionStatus('success');
            } else {
                // Reject
                await supabase.from('pending_requests').update({ status: 'rejected' }).eq('id', id);
                setRequestActionStatus('failure'); // Or just close? User asked for Red Failure Screen
            }
        } catch (error) {
            console.error("Error processing request:", error);
            setRequestActionStatus('failure');
        }
        setIncomingRequest(null);
    };

    const handleWithdrawCommission = async () => {
        if (agentCommissionUSD > 0) {
            const amountToCashOut = agentCommissionUSD;
            
            // Local Update
            setAgentBalanceUSD(prev => prev + amountToCashOut);
            setAgentCommissionUSD(0);
            
            // DB Update
            if (isAuthenticated && currentUser) {
                const { error } = await supabase.rpc('cash_out_commission', { agent_id: currentUser.id });
                
                if (error) {
                    console.error("Error cashing out commission:", error);
                    // Revert local state if error? Or just let it be for now.
                } else {
                    // Log Transaction
                    await supabase.from('transactions').insert({
                        user_id: currentUser.id,
                        type: 'Commission Cash Out',
                        amount: amountToCashOut,
                        is_credit: true, // Float increases
                        category: 'transfer',
                        role: 'agent'
                    });
                }
            }
        }
    };

    const handleLogin = () => setIsAuthenticated(true);
    const handleLogout = async () => { 
        await supabase.auth.signOut();
        setIsAuthenticated(false); 
        setScreen('home'); 
    };
    
    const handleAgentRegistration = (data: any) => {
        // Update profile to pending status with application details
        const updatedProfile = { 
            ...userProfile, 
            agentStatus: 'pending' as const,
            fullName: data.fullName,
            idNumber: data.idNumber,
            businessName: data.businessName,
            address: data.address
        };
        handleProfileUpdate(updatedProfile);
        setScreen('settings');
    };

    // Type checking for screen map - using ReactNode
    const screenMap: Record<string, ReactNode> = { 
        'admin': <AdminDashboard onBack={() => setScreen('settings')} accentColor={accentColor} currency={currency} conversionRate={conversionRate} toggleCurrency={toggleCurrency} />,
        'auth': <AuthScreen onLogin={handleLogin} accentColor={accentColor} />,
        'settings': <SettingsScreen onBack={() => setScreen('home')} theme={theme} setTheme={updateTheme} accentColor={accentColor} setAccentColor={updateAccentColor} onLogout={handleLogout} setScreen={setScreen} view={view} setView={setView} profile={userProfile} />,
        'agentRegistration': <AgentRegistrationScreen onBack={() => setScreen('settings')} onRegister={handleAgentRegistration} accentColor={accentColor} />,
        'profileEditor': <ProfileEditorScreen onBack={() => setScreen('settings')} profile={userProfile} setProfile={handleProfileUpdate} accentColor={accentColor} />,
        'send': <SendMoneyScreen onBack={() => setScreen('home')} addTransaction={addClientTransaction} balanceUSD={clientBalanceUSD} accentColor={accentColor} currency={currency} conversionRate={conversionRate} />, 
        'withdraw': <ClientWithdrawScreen onBack={() => setScreen('home')} addTransaction={addClientTransaction} balanceUSD={clientBalanceUSD} accentColor={accentColor} currency={currency} conversionRate={conversionRate} />,
        'history': <ClientHistoryScreen onBack={() => setScreen('home')} transactions={clientTransactions} accentColor={accentColor} currency={currency} conversionRate={conversionRate} />,
        'clientTools': <ClientToolsScreen onBack={() => setScreen('home')} accentColor={accentColor} setScreen={setScreen} />,
        'clientQRCode': <ClientQRCodeScreen onBack={() => setScreen('clientTools')} accentColor={accentColor} profile={userProfile} />,
        'spendingStory': <SpendingStoryScreen onBack={() => setScreen('clientTools')} accentColor={accentColor} transactions={clientTransactions} currency={currency} conversionRate={conversionRate} />,
        'savingsQuest': <SavingsQuestScreen onBack={() => setScreen('clientTools')} accentColor={accentColor} addTransaction={addClientTransaction} balanceUSD={clientBalanceUSD} currency={currency} conversionRate={conversionRate} />,
        'card': <VirtualCardScreen onBack={() => setScreen('home')} accentColor={accentColor} clientName={userProfile.name} cardSkin={userProfile.cardSkin || { background: `linear-gradient(135deg, ${themes[accentColor].base} 0%, #000000 100%)`, pattern: null, id: 'default' }} onSaveSkin={handleCardSkinUpdate} />,
        'chat': <ChatScreen onBack={() => setScreen('home')} accentColor={accentColor} addTransaction={addClientTransaction} balanceUSD={clientBalanceUSD} currency={currency} conversionRate={conversionRate} currentUser={currentUser} />,
        'bills': <BillsScreen onBack={() => setScreen('home')} accentColor={accentColor} addTransaction={addClientTransaction} balanceUSD={clientBalanceUSD} currency={currency} conversionRate={conversionRate} />,
        'microloans': <MicroloansScreen onBack={() => setScreen('home')} accentColor={accentColor} />,
        // Agent Screens - Pass handler
        'agentDeposit': <AgentActionScreen onBack={() => setScreen('home')} title="Deposit to Client" type="Deposit" accentColor={accentColor} onConfirm={handleAgentAction} agentBalance={agentBalanceUSD} currency={currency} conversionRate={conversionRate} />,
        'agentWithdraw': <AgentActionScreen onBack={() => setScreen('home')} title="Client Withdrawal" type="Withdrawal" accentColor={accentColor} onConfirm={handleAgentAction} agentBalance={agentBalanceUSD} currency={currency} conversionRate={conversionRate} />,
        'agentRegister': <AgentActionScreen onBack={() => setScreen('home')} title="Register New User" type="Registration" accentColor={accentColor} onConfirm={async () => true} agentBalance={agentBalanceUSD} currency={currency} conversionRate={conversionRate} />,
        'agentReports': <ReportsScreen onBack={() => setScreen('home')} accentColor={accentColor} agentTransactions={agentTransactions} commissionUSD={agentCommissionUSD} currency={currency} conversionRate={conversionRate} onWithdrawCommission={handleWithdrawCommission} />,
        'agentTools': <AgentToolsScreen onBack={() => setScreen('home')} accentColor={accentColor} setScreen={setScreen} />,
        'agentQRCode': <AgentQRCodeScreen onBack={() => setScreen('agentTools')} accentColor={accentColor} profile={userProfile} />,
        'agentMap': <AgentMapScreen onBack={() => setScreen('home')} accentColor={accentColor} />,
        'agentHistory': <ClientHistoryScreen onBack={() => setScreen('home')} transactions={agentTransactions} accentColor={accentColor} currency={currency} conversionRate={conversionRate} />,
    };

    const homeScreen = view === 'client' 
        ? <ClientDashboard transactions={clientTransactions} balanceUSD={clientBalanceUSD} setScreen={setScreen} accentColor={accentColor} currency={currency} toggleCurrency={toggleCurrency} conversionRate={conversionRate} profile={userProfile}/> 
        : <AgentDashboard transactions={agentTransactions} balanceUSD={agentBalanceUSD} commissionUSD={agentCommissionUSD} setScreen={setScreen} accentColor={accentColor} currency={currency} toggleCurrency={toggleCurrency} conversionRate={conversionRate} profile={userProfile} setProfile={setUserProfile} />;

    const currentScreenComponent = !isAuthenticated ? screenMap['auth'] : (screen === 'home' ? homeScreen : (screenMap[screen] || homeScreen));

    useEffect(() => {
        // Update body background color based on theme
        document.body.style.backgroundColor = theme === 'dark' ? '#000000' : '#f3f4f6'; // black or gray-100
    }, [theme]);

    return (
        <div className={`${theme} min-h-screen font-sans bg-gray-100 dark:bg-black text-black dark:text-white flex flex-col`}>
            <div className="flex-grow overflow-y-auto no-scrollbar relative flex flex-col bg-gray-100 dark:bg-black">
                {currentScreenComponent}
            </div>

            {/* Client Approval Modal */}
            {incomingRequest && (
                <ApprovalModal 
                    request={incomingRequest} 
                    onApprove={() => handleRequestResponse(true)} 
                    onReject={() => handleRequestResponse(false)} 
                    accentColor={accentColor}
                    currency={currency}
                    conversionRate={conversionRate}
                />
            )}

            {/* Client Action Status (Success/Failure) */}
            {requestActionStatus && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <TransactionStatusScreen 
                        status={requestActionStatus} 
                        title={requestActionStatus === 'success' ? 'Withdrawal Successful' : 'Withdrawal Declined'} 
                        message={requestActionStatus === 'success' ? 'Funds have been withdrawn from your account.' : 'You declined the withdrawal request.'} 
                        onDone={() => setRequestActionStatus(null)} 
                        accentColor={accentColor} 
                    />
                </div>
            )}
        </div>
    );
}