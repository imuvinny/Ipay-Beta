import React, { useState, useEffect, FC } from 'react';
import { 
    Users, Activity, Shield, CheckCircle, XCircle, Search, 
    BarChart2, DollarSign, TrendingUp, AlertCircle, FileText,
    ChevronRight, ArrowLeft, Filter, Download, RefreshCw, Receipt
} from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { ThemeColor, Transaction, UserProfile } from '../../types';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    LineChart, Line, AreaChart, Area 
} from 'recharts';

interface AdminDashboardProps {
    onBack: () => void;
    accentColor: ThemeColor;
    currency: string;
    conversionRate: number;
    toggleCurrency: () => void;
}

// Simulated Date: Friday, March 6th, 2026
const CURRENT_DATE = new Date('2026-03-06T12:00:00');

export const AdminDashboard: FC<AdminDashboardProps> = ({ onBack, accentColor, currency, conversionRate, toggleCurrency }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'agents' | 'transactions'>('overview');
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalAgents: 0,
        pendingAgents: 0,
        totalVolume: 0,
        todayVolume: 0,
        totalEarnings: 0,
        totalFees: 0
    });
    const [chartData, setChartData] = useState<any[]>([]);

    // Fetch Data & Realtime Subscription
    useEffect(() => {
        fetchData();

        // Realtime Subscription
        const channel = supabase
            .channel('admin-dashboard')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'profiles' },
                () => {
                    fetchData();
                }
            )
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'transactions' },
                () => {
                    fetchData();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Profiles
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('*');
            
            if (profilesError) throw profilesError;

            // Fetch Transactions
            let txs: any[] = [];
            const { data: txsData, error: txsError } = await supabase
                .from('transactions')
                .select('*')
                .order('created_at', { ascending: false });

            if (txsError) {
                console.warn("Transactions table might be missing or empty:", txsError.message);
            } else {
                txs = txsData || [];
            }

            // Process Data
            const userList: UserProfile[] = profiles.map((p: any) => ({
                id: p.id,
                name: p.username ? `@${p.username}` : 'Unknown',
                skinTone: p.skin_tone || 'edb98a',
                gender: p.gender || 'feminine',
                seed: p.seed || 'Alex',
                style: p.style || 'avataaars',
                fixedHair: p.fixed_hair,
                noBeard: p.no_beard,
                agentStatus: p.agent_status || 'none',
                avatarUrl: p.avatar_url,
                // Agent Details
                fullName: p.full_name,
                idNumber: p.id_number,
                businessName: p.business_name,
                address: p.address
            }));

            const txList: Transaction[] = txs.map((t: any) => ({
                id: t.id,
                type: t.type,
                amount: t.amount.toString(),
                date: new Date(t.created_at).toLocaleDateString(),
                isCredit: t.is_credit,
                category: t.category,
                role: t.role,
                fee: t.fee,
                commission: t.commission,
                icon: <Activity size={18} /> // Placeholder
            }));

            setUsers(userList);
            setTransactions(txList);

            // Calculate Stats
            const totalVol = txList.reduce((acc, t) => acc + parseFloat(t.amount), 0);
            
            // Use simulated date for "Today"
            const todayStr = CURRENT_DATE.toLocaleDateString();
            const todayVol = txList
                .filter(t => new Date(t.date).toLocaleDateString() === todayStr)
                .reduce((acc, t) => acc + parseFloat(t.amount), 0);

            // Earnings Calculations
            let calculatedFees = 0;
            let calculatedEarnings = 0;

            txList.forEach(t => {
                const amount = parseFloat(t.amount);
                const fee = typeof t.fee === 'number' ? t.fee : parseFloat(t.fee || '0');

                if (t.role === 'client') {
                    if (t.category === 'send' || t.type.startsWith('Sent to ')) {
                        // P2P: 0.5% Fee. Company earns 100% of Fee.
                        const actualFee = fee > 0 ? fee : (amount * 0.005);
                        calculatedFees += actualFee;
                        calculatedEarnings += actualFee;
                    } else if (t.category === 'withdraw' || t.type.startsWith('Cash Withdrawal')) {
                        // Withdraw: 5% Fee. Company earns 40% of Fee (Agent gets 60%).
                        const actualFee = fee > 0 ? fee : (amount * 0.05);
                        calculatedFees += actualFee;
                        calculatedEarnings += (actualFee * 0.40);
                    }
                } 
                // Note: Agent transactions (deposits/withdrawals) are excluded from Company Earnings 
                // as the fees are paid by the client and already counted above.
            });

            const netEarnings = calculatedEarnings;
            const totalFees = calculatedFees;

            setStats({
                totalUsers: userList.length,
                totalAgents: userList.filter(u => u.agentStatus === 'approved').length,
                pendingAgents: userList.filter(u => u.agentStatus === 'pending').length,
                totalVolume: totalVol,
                todayVolume: todayVol,
                totalEarnings: netEarnings,
                totalFees: totalFees
            });

            // Generate Chart Data (Last 7 Days ending on CURRENT_DATE)
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const newChartData = [];
            
            for (let i = 6; i >= 0; i--) {
                const d = new Date(CURRENT_DATE);
                d.setDate(d.getDate() - i);
                const dayName = days[d.getDay()];
                
                // Specific logic for Friday, March 6th, 2026
                if (d.toDateString() === CURRENT_DATE.toDateString()) {
                     newChartData.push({ name: dayName, users: 2, volume: 50 });
                } else {
                    // Random/Mock data for other days
                    newChartData.push({ 
                        name: dayName, 
                        users: Math.floor(Math.random() * 5) + 1, 
                        volume: Math.floor(Math.random() * 5000) + 1000 
                    });
                }
            }
            setChartData(newChartData);

        } catch (error) {
            console.error("Error fetching admin data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApproveAgent = async (userId: string) => {
        try {
            // Optimistic update
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, agentStatus: 'approved' } : u));
            setStats(prev => ({
                ...prev,
                totalAgents: prev.totalAgents + 1,
                pendingAgents: prev.pendingAgents - 1
            }));

            const { data, error } = await supabase
                .from('profiles')
                .update({ agent_status: 'approved' })
                .eq('id', userId)
                .select();

            if (error) throw error;

            if (!data || data.length === 0) {
                // Revert if no rows updated (likely RLS)
                console.warn("Update failed - no rows affected. Check RLS policies.");
                alert("Update failed. You may not have permission to approve this user.");
                fetchData(); // Re-fetch to restore state
                return;
            }

        } catch (error: any) {
            console.error("Error approving agent:", error);
            alert(`Failed to approve agent: ${error.message}`);
            fetchData(); // Re-fetch to restore state
        }
    };

    const handleRejectAgent = async (userId: string) => {
         try {
            // Optimistic update
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, agentStatus: 'none' } : u));
            setStats(prev => ({ ...prev, pendingAgents: prev.pendingAgents - 1 }));

            const { data, error } = await supabase
                .from('profiles')
                .update({ agent_status: 'none' })
                .eq('id', userId)
                .select();

            if (error) throw error;

            if (!data || data.length === 0) {
                console.warn("Update failed - no rows affected. Check RLS policies.");
                alert("Update failed. You may not have permission to reject this user.");
                fetchData();
                return;
            }

        } catch (error: any) {
            console.error("Error rejecting agent:", error);
            alert(`Failed to reject agent: ${error.message}`);
            fetchData();
        }
    };

    const handleExportCSV = () => {
        const headers = ['ID', 'Type', 'Amount', 'Date', 'Role', 'Status', 'Is Credit', 'Fee', 'Commission'];
        const rows = transactions.map(tx => [
            tx.id || '',
            tx.type,
            tx.amount,
            tx.date,
            tx.role || 'client',
            'Completed',
            tx.isCredit ? 'Yes' : 'No',
            tx.fee || 0,
            tx.commission || 0
        ]);
        
        const csvContent = "data:text/csv;charset=utf-8," 
            + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
            
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `transactions_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const symbol = currency === 'USD' ? '$' : 'K';
    const displayAmount = (amt: number) => (currency === 'ZMW' ? amt * conversionRate : amt).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // --- Sub-components ---

    const StatCard = ({ title, value, icon, trend }: any) => (
        <div className="bg-white dark:bg-[#1c1c1e] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-[#333]">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-gray-100 dark:bg-[#2c2c2e] rounded-xl text-gray-600 dark:text-gray-300">
                    {icon}
                </div>
                {trend && (
                    <span className="bg-green-100 text-green-600 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                        <TrendingUp size={12} /> {trend}
                    </span>
                )}
            </div>
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wide">{title}</h3>
            <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">{value}</p>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-black text-black dark:text-white">
            {/* Header */}
            <div className="flex items-center justify-between p-6 bg-white dark:bg-[#1c1c1e] border-b border-gray-200 dark:border-[#333]">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-[#2c2c2e] rounded-full transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">Admin Portal</h1>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">System Overview</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={toggleCurrency}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-[#2c2c2e] rounded-full font-bold text-sm hover:bg-gray-200 dark:hover:bg-[#3a3a3c] transition-colors"
                    >
                        <RefreshCw size={16} />
                        {currency}
                    </button>
                    <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        System Operational
                    </div>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Navigation */}
                <div className="w-64 bg-white dark:bg-[#1c1c1e] border-r border-gray-200 dark:border-[#333] flex flex-col p-4 space-y-2 hidden md:flex">
                    <button 
                        onClick={() => setActiveTab('overview')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'overview' ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-[#2c2c2e]'}`}
                    >
                        <Activity size={20} /> Overview
                    </button>
                    <button 
                        onClick={() => setActiveTab('users')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'users' ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-[#2c2c2e]'}`}
                    >
                        <Users size={20} /> User Management
                    </button>
                    <button 
                        onClick={() => setActiveTab('agents')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'agents' ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-[#2c2c2e]'}`}
                    >
                        <Shield size={20} /> 
                        <span className="flex-1 text-left">Agent Approvals</span>
                        {stats.pendingAgents > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{stats.pendingAgents}</span>}
                    </button>
                    <button 
                        onClick={() => setActiveTab('transactions')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'transactions' ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-[#2c2c2e]'}`}
                    >
                        <FileText size={20} /> Transactions
                    </button>
                </div>

                {/* Mobile Nav (Tabs) */}
                <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1c1c1e] border-t border-gray-200 dark:border-[#333] flex justify-around p-4 z-50">
                    <button onClick={() => setActiveTab('overview')} className={activeTab === 'overview' ? 'text-black dark:text-white' : 'text-gray-400'}><Activity size={24}/></button>
                    <button onClick={() => setActiveTab('users')} className={activeTab === 'users' ? 'text-black dark:text-white' : 'text-gray-400'}><Users size={24}/></button>
                    <button onClick={() => setActiveTab('agents')} className={activeTab === 'agents' ? 'text-black dark:text-white' : 'text-gray-400 relative'}>
                        <Shield size={24}/>
                        {stats.pendingAgents > 0 && <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>}
                    </button>
                    <button onClick={() => setActiveTab('transactions')} className={activeTab === 'transactions' ? 'text-black dark:text-white' : 'text-gray-400'}><FileText size={24}/></button>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 pb-24 md:pb-8">
                    
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white"></div>
                        </div>
                    ) : (
                        <>
                            {/* OVERVIEW TAB */}
                            {activeTab === 'overview' && (
                                <div className="space-y-8 animate-in fade-in duration-500">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <StatCard title="Total Users" value={stats.totalUsers} icon={<Users size={24} />} trend="+12%" />
                                        <StatCard title="Active Agents" value={stats.totalAgents} icon={<Shield size={24} />} trend="+5%" />
                                        <StatCard title="Total Volume" value={`${symbol}${displayAmount(stats.totalVolume)}`} icon={<BarChart2 size={24} />} trend="+8.2%" />
                                        <StatCard title="Volume (Fri)" value={`${symbol}${displayAmount(stats.todayVolume)}`} icon={<Activity size={24} />} />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <StatCard title="Company Earnings" value={`${symbol}${displayAmount(stats.totalEarnings)}`} icon={<DollarSign size={24} />} trend="+15%" />
                                        <StatCard title="Total Fees Collected" value={`${symbol}${displayAmount(stats.totalFees)}`} icon={<Receipt size={24} />} trend="+10%" />
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        <div className="bg-white dark:bg-[#1c1c1e] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-[#333]">
                                            <h3 className="font-bold text-lg mb-6">Transaction Volume</h3>
                                            <div className="h-64 w-full" style={{ minHeight: '256px' }}>
                                                {activeTab === 'overview' && (
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <AreaChart data={chartData}>
                                                            <defs>
                                                                <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                                                </linearGradient>
                                                            </defs>
                                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#33333320" />
                                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                                                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                                                            <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}} />
                                                            <Area type="monotone" dataKey="volume" stroke="#10b981" fillOpacity={1} fill="url(#colorVol)" strokeWidth={3} />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                )}
                                            </div>
                                        </div>

                                        <div className="bg-white dark:bg-[#1c1c1e] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-[#333]">
                                            <h3 className="font-bold text-lg mb-6">User Growth</h3>
                                            <div className="h-64 w-full" style={{ minHeight: '256px' }}>
                                                {activeTab === 'overview' && (
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <BarChart data={chartData}>
                                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#33333320" />
                                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                                                            <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}} />
                                                            <Bar dataKey="users" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* USERS TAB */}
                            {activeTab === 'users' && (
                                <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl shadow-sm border border-gray-100 dark:border-[#333] overflow-hidden animate-in fade-in duration-500">
                                    <div className="p-6 border-b border-gray-100 dark:border-[#333] flex justify-between items-center">
                                        <h3 className="font-bold text-lg">All Users</h3>
                                        <div className="flex gap-2">
                                            <div className="relative">
                                                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input type="text" placeholder="Search..." className="pl-10 pr-4 py-2 bg-gray-100 dark:bg-[#2c2c2e] rounded-lg text-sm outline-none" />
                                            </div>
                                            <button className="p-2 bg-gray-100 dark:bg-[#2c2c2e] rounded-lg"><Filter size={18} /></button>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-gray-50 dark:bg-[#2c2c2e] text-xs uppercase text-gray-500 font-bold">
                                                <tr>
                                                    <th className="px-6 py-4">User</th>
                                                    <th className="px-6 py-4">Role</th>
                                                    <th className="px-6 py-4">Status</th>
                                                    <th className="px-6 py-4">Joined</th>
                                                    <th className="px-6 py-4 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-[#333]">
                                                {users.map((user) => (
                                                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-[#252527] transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                                                    <img src={user.avatarUrl || `https://api.dicebear.com/9.x/initials/svg?seed=${user.name}`} alt="" className="w-full h-full object-cover" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-sm">{user.name}</p>
                                                                    <p className="text-xs text-gray-500">{user.id?.substring(0, 8)}...</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.agentStatus === 'approved' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                                                                {user.agentStatus === 'approved' ? 'Agent' : 'Client'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="flex items-center gap-2 text-sm font-medium text-green-500">
                                                                <div className="w-2 h-2 rounded-full bg-green-500"></div> Active
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-500">
                                                            Oct 24, 2024
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button className="text-gray-400 hover:text-black dark:hover:text-white"><ChevronRight size={20} /></button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* AGENTS TAB */}
                            {activeTab === 'agents' && (
                                <div className="space-y-6 animate-in fade-in duration-500">
                                    {/* Pending Approvals */}
                                    {users.filter(u => u.agentStatus === 'pending').length > 0 && (
                                        <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl shadow-sm border border-orange-200 dark:border-orange-900/30 overflow-hidden">
                                            <div className="p-6 bg-orange-50 dark:bg-orange-900/10 border-b border-orange-100 dark:border-orange-900/30 flex items-center gap-3">
                                                <AlertCircle className="text-orange-500" size={24} />
                                                <h3 className="font-bold text-lg text-orange-700 dark:text-orange-400">Pending Approvals</h3>
                                            </div>
                                            <div className="divide-y divide-gray-100 dark:divide-[#333]">
                                                {users.filter(u => u.agentStatus === 'pending').map(user => (
                                                    <div key={user.id} className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                                                                <img src={user.avatarUrl || `https://api.dicebear.com/9.x/initials/svg?seed=${user.name}`} alt="" className="w-full h-full object-cover" />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-lg">{user.name}</h4>
                                                                <p className="text-sm text-gray-500">Applied just now</p>
                                                                <div className="flex flex-wrap gap-2 mt-2">
                                                                    {user.idNumber && <span className="text-xs bg-gray-100 dark:bg-[#2c2c2e] px-2 py-1 rounded text-gray-600 dark:text-gray-300">ID: {user.idNumber}</span>}
                                                                    {user.businessName && <span className="text-xs bg-gray-100 dark:bg-[#2c2c2e] px-2 py-1 rounded text-gray-600 dark:text-gray-300">Biz: {user.businessName}</span>}
                                                                    {user.fullName && <span className="text-xs bg-gray-100 dark:bg-[#2c2c2e] px-2 py-1 rounded text-gray-600 dark:text-gray-300">Name: {user.fullName}</span>}
                                                                    {user.address && <span className="text-xs bg-gray-100 dark:bg-[#2c2c2e] px-2 py-1 rounded text-gray-600 dark:text-gray-300">Addr: {user.address}</span>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-3 w-full md:w-auto">
                                                            <button 
                                                                onClick={() => user.id && handleRejectAgent(user.id)}
                                                                className="flex-1 md:flex-none px-6 py-3 rounded-xl font-bold border border-gray-200 dark:border-[#333] hover:bg-gray-50 dark:hover:bg-[#2c2c2e] text-red-500 flex items-center justify-center gap-2"
                                                            >
                                                                <XCircle size={18} /> Reject
                                                            </button>
                                                            <button 
                                                                onClick={() => user.id && handleApproveAgent(user.id)}
                                                                className="flex-1 md:flex-none px-6 py-3 rounded-xl font-bold bg-green-500 text-white hover:bg-green-600 flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
                                                            >
                                                                <CheckCircle size={18} /> Approve
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Active Agents List */}
                                    <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl shadow-sm border border-gray-100 dark:border-[#333] overflow-hidden">
                                        <div className="p-6 border-b border-gray-100 dark:border-[#333]">
                                            <h3 className="font-bold text-lg">Active Agents</h3>
                                        </div>
                                        <table className="w-full text-left">
                                            <thead className="bg-gray-50 dark:bg-[#2c2c2e] text-xs uppercase text-gray-500 font-bold">
                                                <tr>
                                                    <th className="px-6 py-4">Agent</th>
                                                    <th className="px-6 py-4">Performance</th>
                                                    <th className="px-6 py-4">Status</th>
                                                    <th className="px-6 py-4 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-[#333]">
                                                {users.filter(u => u.agentStatus === 'approved').map((user) => (
                                                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-[#252527] transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                                                    <img src={user.avatarUrl || `https://api.dicebear.com/9.x/initials/svg?seed=${user.name}`} alt="" className="w-full h-full object-cover" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-sm">{user.name}</p>
                                                                    <p className="text-xs text-gray-500">ID: {user.id?.substring(0, 8)}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-1 text-sm font-bold">
                                                                <TrendingUp size={16} className="text-green-500" />
                                                                High
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="bg-green-100 text-green-600 text-xs font-bold px-2 py-1 rounded-full">Active</span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button className="text-gray-400 hover:text-black dark:hover:text-white"><ChevronRight size={20} /></button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {users.filter(u => u.agentStatus === 'approved').length === 0 && (
                                                    <tr>
                                                        <td colSpan={4} className="p-8 text-center text-gray-500">No active agents yet.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* TRANSACTIONS TAB */}
                            {activeTab === 'transactions' && (
                                <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl shadow-sm border border-gray-100 dark:border-[#333] overflow-hidden animate-in fade-in duration-500">
                                    <div className="p-6 border-b border-gray-100 dark:border-[#333] flex justify-between items-center">
                                        <h3 className="font-bold text-lg">Global Transactions</h3>
                                        <button 
                                            onClick={handleExportCSV}
                                            className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-black dark:hover:text-white"
                                        >
                                            <Download size={16} /> Export CSV
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-gray-50 dark:bg-[#2c2c2e] text-xs uppercase text-gray-500 font-bold">
                                                <tr>
                                                    <th className="px-6 py-4">Type</th>
                                                    <th className="px-6 py-4">Amount</th>
                                                    <th className="px-6 py-4">Date</th>
                                                    <th className="px-6 py-4">Role</th>
                                                    <th className="px-6 py-4">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-[#333]">
                                                {transactions.map((tx, i) => (
                                                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-[#252527] transition-colors">
                                                        <td className="px-6 py-4 font-medium">{tx.type}</td>
                                                        <td className={`px-6 py-4 font-bold ${tx.isCredit ? 'text-green-500' : 'text-gray-900 dark:text-white'}`}>
                                                            {tx.isCredit ? '+' : '-'}{symbol}{displayAmount(parseFloat(tx.amount))}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-500">{tx.date}</td>
                                                        <td className="px-6 py-4">
                                                            <span className={`text-xs font-bold px-2 py-1 rounded ${tx.role === 'agent' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'}`}>
                                                                {tx.role || 'client'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="bg-green-100 text-green-600 text-xs font-bold px-2 py-1 rounded-full">Completed</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
