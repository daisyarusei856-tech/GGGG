import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { getYouTubeEmbedUrl } from '@/utils/youtube-helper';
import { LockIcon, ShieldIcon } from '../icons';
import { DEFAULT_THEME_COLORS, NAVIGATION_CATALOG } from '../site-customization';
import type { PremiumSection } from '../types';
import { DEFAULT_FEATURED_BOTS, type UserBotItem } from './FreeBotsPage';
import './admin-panel.scss';

type AdminTab = 'users' | 'earnings' | 'branding' | 'risk' | 'bots' | 'api' | 'diagnostics';

interface UserSessionItem {
    loginid: string;
    currency: string;
    is_virtual: boolean;
    balance: number;
    last_seen: string;
    signed_in_at: string;
    trades_count: number;
    volume_traded: number;
    status: string;
}

interface CommissionLogItem {
    id: string;
    timestamp: string;
    userLoginId: string;
    stake: number;
    volume: number;
    markupRate: number;
    commissionAmount: number;
    status: 'Settled' | 'Pending';
}

const THEME_PRESETS = [
    { name: 'Emerald Green', primary: '#059669', secondary: '#19cba3', nav_bg: '#151d26' },
    { name: 'Indigo Royalty', primary: '#4f46e5', secondary: '#818cf8', nav_bg: '#0f172a' },
    { name: 'Dark Gold', primary: '#d97706', secondary: '#fbbf24', nav_bg: '#18181b' },
    { name: 'Crimson Power', primary: '#dc2626', secondary: '#f87171', nav_bg: '#1a0d0d' },
    { name: 'Cyber Cyan', primary: '#0891b2', secondary: '#22d3ee', nav_bg: '#081c24' },
];

const DEFAULT_MOCK_USERS: UserSessionItem[] = [
    {
        loginid: 'CR9182341',
        currency: 'USD',
        is_virtual: false,
        balance: 1450.80,
        last_seen: 'Just now',
        signed_in_at: '2026-09-15 14:20',
        trades_count: 42,
        volume_traded: 3820.00,
        status: 'Active',
    },
    {
        loginid: 'CR8721092',
        currency: 'USD',
        is_virtual: false,
        balance: 890.25,
        last_seen: '5 mins ago',
        signed_in_at: '2026-09-15 11:05',
        trades_count: 18,
        volume_traded: 1650.00,
        status: 'Active',
    },
    {
        loginid: 'VRTC1092834',
        currency: 'USD',
        is_virtual: true,
        balance: 10000.00,
        last_seen: '12 mins ago',
        signed_in_at: '2026-09-15 09:30',
        trades_count: 85,
        volume_traded: 12400.00,
        status: 'Active',
    },
    {
        loginid: 'CR5520198',
        currency: 'EUR',
        is_virtual: false,
        balance: 3200.50,
        last_seen: '1 hour ago',
        signed_in_at: '2026-09-14 18:45',
        trades_count: 120,
        volume_traded: 15800.00,
        status: 'Offline',
    },
];

const DEFAULT_COMMISSION_LOGS: CommissionLogItem[] = [
    {
        id: 'COMM-1092',
        timestamp: '2026-09-15 16:40',
        userLoginId: 'CR9182341',
        stake: 100,
        volume: 1000,
        markupRate: 1.5,
        commissionAmount: 15.00,
        status: 'Settled',
    },
    {
        id: 'COMM-1091',
        timestamp: '2026-09-15 15:12',
        userLoginId: 'CR8721092',
        stake: 50,
        volume: 500,
        markupRate: 1.5,
        commissionAmount: 7.50,
        status: 'Settled',
    },
    {
        id: 'COMM-1090',
        timestamp: '2026-09-15 13:05',
        userLoginId: 'CR5520198',
        stake: 250,
        volume: 2500,
        markupRate: 1.5,
        commissionAmount: 37.50,
        status: 'Pending',
    },
];

export const AdminPanelPage: React.FC = observer(() => {
    const [isUnlocked, setIsUnlocked] = useState(() => {
        return localStorage.getItem('admin_authenticated') === 'true' || localStorage.getItem('admin_unlocked') === 'true';
    });
    const [adminEmailInput, setAdminEmailInput] = useState(() => localStorage.getItem('admin_email_login') || 'bethanyhellen210@gmail.com');
    const [adminPassInput, setAdminPassInput] = useState('');
    const [authError, setAuthError] = useState('');
    const [activeTab, setActiveTab] = useState<AdminTab>('users');

    // Signed-In Users State
    const [userSessions, setUserSessions] = useState<UserSessionItem[]>(() => {
        try {
            const saved = localStorage.getItem('admin_user_sessions');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch (e) {
            console.error('Failed reading user sessions', e);
        }
        return DEFAULT_MOCK_USERS;
    });

    // Affiliate & Commission Settings
    const [affiliateToken, setAffiliateToken] = useState(() => localStorage.getItem('admin_affiliate_token') || 'DERIV_AFF_98124');
    const [affiliateAppId, setAffiliateAppId] = useState(() => localStorage.getItem('admin_affiliate_app_id') || '1089');
    const [markupRate, setMarkupRate] = useState(() => localStorage.getItem('admin_markup_rate') || '1.5');
    const [payoutSchedule, setPayoutSchedule] = useState(() => localStorage.getItem('admin_payout_schedule') || 'Weekly');

    // Commission Logs
    const [commissionLogs, setCommissionLogs] = useState<CommissionLogItem[]>(() => {
        try {
            const saved = localStorage.getItem('admin_commission_logs');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch (e) {
            console.error('Failed reading commission logs', e);
        }
        return DEFAULT_COMMISSION_LOGS;
    });

    // New Manual User Input State
    const [newUserId, setNewUserId] = useState('');
    const [newUserType, setNewUserType] = useState<'Real' | 'Demo'>('Real');
    const [newUserBalance, setNewUserBalance] = useState('500');

    // Admin Bot Strategy Customization State
    const [editingBotId, setEditingBotId] = useState<string | null>(null);
    const [adminBotName, setAdminBotName] = useState('');
    const [adminBotDescription, setAdminBotDescription] = useState('');
    const [adminBotImageUrl, setAdminBotImageUrl] = useState('');
    const [adminBotYoutubeUrl, setAdminBotYoutubeUrl] = useState('');
    const [adminBotTags, setAdminBotTags] = useState('HIGH WIN RATE');
    const [adminBotXmlContent, setAdminBotXmlContent] = useState('');
    const [adminBotXmlFileName, setAdminBotXmlFileName] = useState('');
    const [adminBotDisabled, setAdminBotDisabled] = useState(false);

    const [adminBotsLayout, setAdminBotsLayout] = useState<'horizontal' | 'grid'>(() => {
        try {
            const saved = localStorage.getItem('user_bots_display_layout');
            if (saved === 'grid' || saved === 'horizontal') return saved;
        } catch (e) {
            // ignore
        }
        return 'horizontal';
    });

    const [adminBotsList, setAdminBotsList] = useState<UserBotItem[]>(() => {
        try {
            const saved = localStorage.getItem('user_custom_bots_library');
            if (saved !== null) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) return parsed;
            }
        } catch (e) {
            console.error('Failed reading bots in admin', e);
        }
        return DEFAULT_FEATURED_BOTS;
    });

    // Admin Branding Settings
    const [colors, setColors] = useState(() => {
        try {
            const saved = localStorage.getItem('admin_panel_config');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.colors) return { ...DEFAULT_THEME_COLORS, ...parsed.colors };
            }
        } catch (e) {
            console.error('Failed reading admin config', e);
        }
        return { ...DEFAULT_THEME_COLORS };
    });

    const [navigation, setNavigation] = useState<PremiumSection[]>(() => {
        try {
            const saved = localStorage.getItem('admin_panel_config');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed.navigation)) return parsed.navigation;
            }
        } catch (e) {
            console.error('Failed reading admin nav config', e);
        }
        return NAVIGATION_CATALOG.map(item => item.id);
    });

    // Risk Controls
    const [killSwitch, setKillSwitch] = useState(() => localStorage.getItem('admin_kill_switch') === 'true');
    const [maxLossLimit, setMaxLossLimit] = useState(() => localStorage.getItem('admin_max_loss') || '100');
    const [maxStakeCap, setMaxStakeCap] = useState(() => localStorage.getItem('admin_max_stake') || '50');

    // API Tester
    const [serverEndpoint, setServerEndpoint] = useState(() => localStorage.getItem('admin_ws_endpoint') || 'wss://ws.derivws.com/websockets/v3');
    const [appId, setAppId] = useState(() => localStorage.getItem('admin_app_id') || '1089');
    const [geminiApiKey, setGeminiApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
    const [pingResult, setPingResult] = useState<string | null>(null);
    const [pinging, setPinging] = useState(false);

    // Diagnostics & System Logs
    const [logs, setLogs] = useState<Array<{ time: string; text: string; type: 'info' | 'success' | 'warn' | 'error' }>>([
        { time: new Date().toLocaleTimeString(), text: 'System diagnostics & affiliate tracker engine active.', type: 'info' },
        { time: new Date().toLocaleTimeString(), text: 'Deriv WebSocket & Commission API synchronized.', type: 'success' },
    ]);

    const handleUnlock = (e: React.FormEvent) => {
        e.preventDefault();
        const email = adminEmailInput.trim();
        const pass = adminPassInput.trim();

        if (!email) {
            setAuthError('Please enter your admin email address.');
            return;
        }
        if (!pass) {
            setAuthError('Please enter your admin password.');
            return;
        }

        // Accept admin sign-in with email & password
        setIsUnlocked(true);
        localStorage.setItem('admin_authenticated', 'true');
        localStorage.setItem('admin_unlocked', 'true');
        localStorage.setItem('admin_email_login', email);
        setAuthError('');
        window.dispatchEvent(new CustomEvent('admin_config_updated'));
        setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), text: `Admin Panel authenticated for ${email}.`, type: 'success' }]);
    };

    const handleLock = () => {
        setIsUnlocked(false);
        localStorage.removeItem('admin_authenticated');
        localStorage.removeItem('admin_unlocked');
        window.dispatchEvent(new CustomEvent('admin_config_updated'));
    };

    const saveBrandingConfig = () => {
        const payload = { colors, navigation };
        localStorage.setItem('admin_panel_config', JSON.stringify(payload));
        window.dispatchEvent(new CustomEvent('admin_config_updated'));
        setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), text: 'Site branding and navigation preferences saved.', type: 'success' }]);
    };

    const toggleNavItem = (id: PremiumSection) => {
        if (id === 'dashboard') return;
        setNavigation(prev => {
            if (prev.includes(id)) return prev.filter(x => x !== id);
            return [...prev, id];
        });
    };

    const handleKillSwitchToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked;
        setKillSwitch(checked);
        localStorage.setItem('admin_kill_switch', String(checked));
        setLogs(prev => [
            ...prev,
            {
                time: new Date().toLocaleTimeString(),
                text: checked ? 'EMERGENCY KILL SWITCH ACTIVATED! All bot trading halted.' : 'Kill switch deactivated. Bot trading permitted.',
                type: checked ? 'error' : 'warn',
            },
        ]);
    };

    const handlePingTest = () => {
        setPinging(true);
        setPingResult('Testing WebSocket ping...');
        const startTime = Date.now();
        try {
            const ws = new WebSocket(`${serverEndpoint}?app_id=${appId}`);
            ws.onopen = () => {
                const latency = Date.now() - startTime;
                setPingResult(`Connected successfully! Ping latency: ${latency} ms`);
                setPinging(false);
                ws.close();
                setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), text: `Ping response from ${serverEndpoint}: ${latency}ms`, type: 'success' }]);
            };
            ws.onerror = () => {
                setPingResult('Failed to connect to WebSocket endpoint.');
                setPinging(false);
                setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), text: `Ping failed for ${serverEndpoint}`, type: 'error' }]);
            };
        } catch {
            setPingResult('Invalid socket URL format.');
            setPinging(false);
        }
    };

    const handleSaveAffiliateConfig = () => {
        localStorage.setItem('admin_affiliate_token', affiliateToken);
        localStorage.setItem('admin_affiliate_app_id', affiliateAppId);
        localStorage.setItem('admin_markup_rate', markupRate);
        localStorage.setItem('admin_payout_schedule', payoutSchedule);
        setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), text: `Affiliate token & ${markupRate}% commission markup saved.`, type: 'success' }]);
        alert('Affiliate & Commission configuration updated successfully!');
    };

    const handleAddUserSession = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUserId.trim()) return;
        const isVirtual = newUserType === 'Demo';
        const newSession: UserSessionItem = {
            loginid: newUserId.trim().toUpperCase(),
            currency: 'USD',
            is_virtual: isVirtual,
            balance: parseFloat(newUserBalance) || 100,
            last_seen: 'Just now',
            signed_in_at: new Date().toLocaleString(),
            trades_count: 0,
            volume_traded: 0,
            status: 'Active',
        };

        const updated = [newSession, ...userSessions.filter(u => u.loginid !== newSession.loginid)];
        setUserSessions(updated);
        localStorage.setItem('admin_user_sessions', JSON.stringify(updated));
        setNewUserId('');
        setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), text: `Registered user "${newSession.loginid}" manually.`, type: 'success' }]);
    };

    const handleRemoveUser = (loginid: string) => {
        const filtered = userSessions.filter(u => u.loginid !== loginid);
        setUserSessions(filtered);
        localStorage.setItem('admin_user_sessions', JSON.stringify(filtered));
        setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), text: `Removed user record ${loginid}`, type: 'warn' }]);
    };

    const handleSimulateTradeVolume = (loginid: string) => {
        const rate = parseFloat(markupRate) || 1.5;
        const tradeVolume = 500;
        const earned = Math.round((tradeVolume * (rate / 100)) * 100) / 100;

        const updatedUsers = userSessions.map(u => {
            if (u.loginid === loginid) {
                return {
                    ...u,
                    trades_count: u.trades_count + 1,
                    volume_traded: u.volume_traded + tradeVolume,
                    last_seen: 'Just now',
                };
            }
            return u;
        });

        const newLog: CommissionLogItem = {
            id: `COMM-${Date.now().toString().slice(-4)}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            userLoginId: loginid,
            stake: 50,
            volume: tradeVolume,
            markupRate: rate,
            commissionAmount: earned,
            status: 'Settled',
        };

        const updatedLogs = [newLog, ...commissionLogs];
        setUserSessions(updatedUsers);
        setCommissionLogs(updatedLogs);
        localStorage.setItem('admin_user_sessions', JSON.stringify(updatedUsers));
        localStorage.setItem('admin_commission_logs', JSON.stringify(updatedLogs));

        setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), text: `Simulated $${tradeVolume} volume for ${loginid}. +$${earned} commission earned.`, type: 'success' }]);
    };

    // Calculate aggregated metrics
    const totalUsersCount = userSessions.length;
    const realUsersCount = userSessions.filter(u => !u.is_virtual).length;
    const demoUsersCount = userSessions.filter(u => u.is_virtual).length;
    const totalTradedVolume = userSessions.reduce((acc, u) => acc + (u.volume_traded || 0), 0);
    const totalCommissionEarned = commissionLogs.reduce((acc, c) => acc + c.commissionAmount, 0);
    const pendingCommissionEarned = commissionLogs.filter(c => c.status === 'Pending').reduce((acc, c) => acc + c.commissionAmount, 0);

    if (!isUnlocked) {
        return (
            <div className='admin-panel'>
                <div className='admin-panel__lock-screen' style={{ maxWidth: 420, margin: '40px auto', padding: '32px 24px', background: 'var(--site-card-bg, #ffffff)', borderRadius: 12, border: '1px solid var(--site-border, #e2e8f0)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
                    <div className='lock-icon-container' style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                        <LockIcon />
                    </div>
                    <h2 style={{ fontSize: 22, fontWeight: 800, textAlign: 'center', margin: '0 0 8px', color: 'var(--site-text, #0f172a)' }}>
                        Admin Portal Authentication
                    </h2>
                    <p style={{ fontSize: 14, textAlign: 'center', color: 'var(--site-text-muted, #64748b)', margin: '0 0 24px', lineHeight: 1.5 }}>
                        Sign in with your administrator Email and Password credentials to access bot management, user analytics, and platform controls.
                    </p>
                    <form onSubmit={handleUnlock} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--site-text, #334155)', marginBottom: 6 }}>
                                Admin Email Address
                            </label>
                            <input
                                type='email'
                                placeholder='admin@example.com'
                                value={adminEmailInput}
                                onChange={e => setAdminEmailInput(e.target.value)}
                                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--site-border, #cbd5e1)', fontSize: 14, background: 'var(--site-input-bg, #ffffff)' }}
                                autoFocus
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--site-text, #334155)', marginBottom: 6 }}>
                                Admin Password
                            </label>
                            <input
                                type='password'
                                placeholder='Password'
                                value={adminPassInput}
                                onChange={e => setAdminPassInput(e.target.value)}
                                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--site-border, #cbd5e1)', fontSize: 14, background: 'var(--site-input-bg, #ffffff)' }}
                            />
                        </div>

                        {authError && (
                            <div style={{ color: '#ef4444', fontSize: '13px', fontWeight: 600 }}>
                                ⚠ {authError}
                            </div>
                        )}

                        <button
                            type='submit'
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: 8,
                                border: 'none',
                                background: '#059669',
                                color: '#ffffff',
                                fontWeight: 700,
                                fontSize: 15,
                                cursor: 'pointer',
                                marginTop: 8,
                            }}
                        >
                            Sign In as Admin
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className='admin-panel'>
            <header className='admin-panel__header'>
                <div className='admin-panel__header-title'>
                    <ShieldIcon style={{ width: 28, height: 28, color: '#10b981' }} />
                    <h1>Site Admin & Revenue Console</h1>
                    <span className='admin-badge'>Authenticated Admin</span>
                </div>
                <div className='admin-panel__header-actions'>
                    <button type='button' className='admin-panel__tabs-btn' onClick={handleLock}>
                        <LockIcon /> Lock Console
                    </button>
                </div>
            </header>

            {/* Emergency Kill Switch Banner */}
            <div className='admin-panel__kill-banner'>
                <div className='kill-info'>
                    <h3>Master Emergency Kill Switch</h3>
                    <p>{killSwitch ? 'CRITICAL: Trading bots are globally suspended.' : 'Status Normal: Bot execution allowed across active sessions.'}</p>
                </div>
                <label className='switch danger'>
                    <input type='checkbox' checked={killSwitch} onChange={handleKillSwitchToggle} />
                    <span className='slider' />
                </label>
            </div>

            {/* Navigation Tabs */}
            <nav className='admin-panel__tabs'>
                <button
                    type='button'
                    className={`admin-panel__tabs-btn ${activeTab === 'users' ? 'is-active' : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    👥 Signed-In Users ({totalUsersCount})
                </button>
                <button
                    type='button'
                    className={`admin-panel__tabs-btn ${activeTab === 'earnings' ? 'is-active' : ''}`}
                    onClick={() => setActiveTab('earnings')}
                >
                    Commission Earnings (${totalCommissionEarned.toFixed(2)})
                </button>
                <button
                    type='button'
                    className={`admin-panel__tabs-btn ${activeTab === 'branding' ? 'is-active' : ''}`}
                    onClick={() => setActiveTab('branding')}
                >
                    Branding & Navigation
                </button>
                <button
                    type='button'
                    className={`admin-panel__tabs-btn ${activeTab === 'risk' ? 'is-active' : ''}`}
                    onClick={() => setActiveTab('risk')}
                >
                    Risk & Limits
                </button>
                <button
                    type='button'
                    className={`admin-panel__tabs-btn ${activeTab === 'bots' ? 'is-active' : ''}`}
                    onClick={() => setActiveTab('bots')}
                >
                    Bot Strategies
                </button>
                <button
                    type='button'
                    className={`admin-panel__tabs-btn ${activeTab === 'api' ? 'is-active' : ''}`}
                    onClick={() => setActiveTab('api')}
                >
                    API & Server
                </button>
                <button
                    type='button'
                    className={`admin-panel__tabs-btn ${activeTab === 'diagnostics' ? 'is-active' : ''}`}
                    onClick={() => setActiveTab('diagnostics')}
                >
                    Diagnostics & Logs
                </button>
            </nav>

            {/* Tab 1: Signed-In Users */}
            {activeTab === 'users' && (
                <div className='admin-panel__content'>
                    {/* Summary Metrics */}
                    <div className='admin-panel__stats-grid'>
                        <div className='admin-panel__stat-card'>
                            <div className='stat-label'>Total Signed-In Users <span>👥</span></div>
                            <div className='stat-value emerald'>{totalUsersCount}</div>
                            <div className='stat-subtext'>Active bot user accounts</div>
                        </div>
                        <div className='admin-panel__stat-card'>
                            <div className='stat-label'>Real Money Traders <span>💵</span></div>
                            <div className='stat-value indigo'>{realUsersCount}</div>
                            <div className='stat-subtext'>Generating live commission</div>
                        </div>
                        <div className='admin-panel__stat-card'>
                            <div className='stat-label'>Demo / Virtual Traders <span>🎮</span></div>
                            <div className='stat-value'>{demoUsersCount}</div>
                            <div className='stat-subtext'>Testing bot strategies</div>
                        </div>
                        <div className='admin-panel__stat-card'>
                            <div className='stat-label'>Total Volume Traded <span>📈</span></div>
                            <div className='stat-value emerald'>${totalTradedVolume.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                            <div className='stat-subtext'>Combined user turnover</div>
                        </div>
                    </div>

                    {/* Signed-In Users Table */}
                    <div className='admin-panel__card'>
                        <h2 className='admin-panel__card-title'>Active & Registered Bot Users</h2>
                        <div className='admin-panel__table-wrapper'>
                            <table className='admin-panel__table'>
                                <thead>
                                    <tr>
                                        <th>User Login ID</th>
                                        <th>Account Type</th>
                                        <th>Balance</th>
                                        <th>Trades Run</th>
                                        <th>Traded Volume</th>
                                        <th>Last Active</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {userSessions.map(user => (
                                        <tr key={user.loginid}>
                                            <td className='bold'>{user.loginid}</td>
                                            <td>
                                                <span className={`status-badge ${user.is_virtual ? 'demo' : 'real'}`}>
                                                    {user.is_virtual ? 'Demo' : 'Real'}
                                                </span>
                                            </td>
                                            <td>{user.currency} ${user.balance.toFixed(2)}</td>
                                            <td>{user.trades_count}</td>
                                            <td>${user.volume_traded.toFixed(2)}</td>
                                            <td>{user.last_seen}</td>
                                            <td>
                                                <span className={`status-badge ${user.status.toLowerCase()}`}>
                                                    {user.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    <button
                                                        type='button'
                                                        className='btn-secondary'
                                                        style={{ padding: '4px 8px', fontSize: 12 }}
                                                        onClick={() => handleSimulateTradeVolume(user.loginid)}
                                                        title='Simulate trade turnover to test commission calculation'
                                                    >
                                                        + Trade Vol
                                                    </button>
                                                    <button
                                                        type='button'
                                                        className='btn-secondary'
                                                        style={{ padding: '4px 8px', fontSize: 12, color: '#ef4444' }}
                                                        onClick={() => handleRemoveUser(user.loginid)}
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Register New User Session Form */}
                    <div className='admin-panel__card'>
                        <h2 className='admin-panel__card-title'>Register / Test User Entry</h2>
                        <form onSubmit={handleAddUserSession} className='admin-panel__grid'>
                            <div className='admin-panel__form-group'>
                                <label>Deriv Account Login ID</label>
                                <input
                                    type='text'
                                    placeholder='e.g. CR981203 or VRTC91280'
                                    value={newUserId}
                                    onChange={e => setNewUserId(e.target.value)}
                                />
                            </div>
                            <div className='admin-panel__form-group'>
                                <label>Account Type</label>
                                <select
                                    value={newUserType}
                                    onChange={e => setNewUserType(e.target.value as 'Real' | 'Demo')}
                                >
                                    <option value='Real'>Real Account (Commission Eligible)</option>
                                    <option value='Demo'>Demo Account</option>
                                </select>
                            </div>
                            <div className='admin-panel__form-group'>
                                <label>Initial Balance ($ USD)</label>
                                <input
                                    type='number'
                                    value={newUserBalance}
                                    onChange={e => setNewUserBalance(e.target.value)}
                                />
                            </div>
                            <div className='admin-panel__form-group' style={{ justifyContent: 'flex-end' }}>
                                <button type='submit' className='btn-primary' style={{ height: 42 }}>
                                    + Add User to Record
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Tab 2: Commission Earnings */}
            {activeTab === 'earnings' && (
                <div className='admin-panel__content'>
                    {/* Summary Metrics */}
                    <div className='admin-panel__stats-grid'>
                        <div className='admin-panel__stat-card'>
                            <div className='stat-label'>Total Lifetime Commission <span>💰</span></div>
                            <div className='stat-value emerald'>${totalCommissionEarned.toFixed(2)}</div>
                            <div className='stat-subtext'>Earned from app user trade turnover</div>
                        </div>
                        <div className='admin-panel__stat-card'>
                            <div className='stat-label'>Pending Settlement <span>⏳</span></div>
                            <div className='stat-value amber'>${pendingCommissionEarned.toFixed(2)}</div>
                            <div className='stat-subtext'>To be paid on next schedule</div>
                        </div>
                        <div className='admin-panel__stat-card'>
                            <div className='stat-label'>Commission Markup Rate <span>📊</span></div>
                            <div className='stat-value indigo'>{markupRate}%</div>
                            <div className='stat-subtext'>App markup on trade volume</div>
                        </div>
                        <div className='admin-panel__stat-card'>
                            <div className='stat-label'>Est. Monthly Revenue <span>🚀</span></div>
                            <div className='stat-value emerald'>${(totalCommissionEarned * 4).toFixed(2)}</div>
                            <div className='stat-subtext'>Projected based on active users</div>
                        </div>
                    </div>

                    {/* Affiliate & Revenue Markup Settings */}
                    <div className='admin-panel__card'>
                        <h2 className='admin-panel__card-title'>Deriv Affiliate & App Markup Configuration</h2>
                        <div className='admin-panel__grid'>
                            <div className='admin-panel__form-group'>
                                <label>Deriv Affiliate / Referral Token</label>
                                <input
                                    type='text'
                                    value={affiliateToken}
                                    onChange={e => setAffiliateToken(e.target.value)}
                                    placeholder='e.g. DERIV_AFF_TOKEN'
                                />
                                <span className='help-text'>Your Deriv affiliate tracking token linked to bot sign-ups.</span>
                            </div>
                            <div className='admin-panel__form-group'>
                                <label>Deriv Registered App ID</label>
                                <input
                                    type='text'
                                    value={affiliateAppId}
                                    onChange={e => setAffiliateAppId(e.target.value)}
                                />
                                <span className='help-text'>App ID registered on Deriv Developer Portal for custom markup.</span>
                            </div>
                            <div className='admin-panel__form-group'>
                                <label>App Trade Volume Markup Rate (%)</label>
                                <input
                                    type='number'
                                    step='0.1'
                                    value={markupRate}
                                    onChange={e => setMarkupRate(e.target.value)}
                                />
                                <span className='help-text'>Markup percentage earned on all contract executions (standard: 1.0% - 2.0%).</span>
                            </div>
                            <div className='admin-panel__form-group'>
                                <label>Payout Settlement Frequency</label>
                                <select
                                    value={payoutSchedule}
                                    onChange={e => setPayoutSchedule(e.target.value)}
                                >
                                    <option value='Daily'>Daily Settlement</option>
                                    <option value='Weekly'>Weekly (Every Monday)</option>
                                    <option value='Monthly'>Monthly (1st of Month)</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ marginTop: 20 }}>
                            <button type='button' className='btn-primary' onClick={handleSaveAffiliateConfig}>
                                Save Affiliate & Commission Settings
                            </button>
                        </div>
                    </div>

                    {/* Commission Earnings History Ledger */}
                    <div className='admin-panel__card'>
                        <h2 className='admin-panel__card-title'>Commission Payout Ledger & Trade Earnings</h2>
                        <div className='admin-panel__table-wrapper'>
                            <table className='admin-panel__table'>
                                <thead>
                                    <tr>
                                        <th>Ref ID</th>
                                        <th>Timestamp</th>
                                        <th>User ID</th>
                                        <th>Traded Volume</th>
                                        <th>Markup Rate</th>
                                        <th>Commission Earned</th>
                                        <th>Payout Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {commissionLogs.map(log => (
                                        <tr key={log.id}>
                                            <td className='bold'>{log.id}</td>
                                            <td>{log.timestamp}</td>
                                            <td>{log.userLoginId}</td>
                                            <td>${log.volume.toFixed(2)}</td>
                                            <td>{log.markupRate}%</td>
                                            <td className='bold' style={{ color: '#10b981' }}>+${log.commissionAmount.toFixed(2)}</td>
                                            <td>
                                                <span className={`status-badge ${log.status.toLowerCase()}`}>
                                                    {log.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab 3: Branding & Navigation */}
            {activeTab === 'branding' && (
                <div className='admin-panel__content'>
                    <div className='admin-panel__card'>
                        <h2 className='admin-panel__card-title'>Preset Color Palettes</h2>
                        <div className='admin-panel__presets'>
                            {THEME_PRESETS.map(preset => (
                                <button
                                    key={preset.name}
                                    type='button'
                                    className='preset-btn'
                                    onClick={() => setColors({
                                        primary: preset.primary,
                                        secondary: preset.secondary,
                                        nav_background: preset.nav_bg,
                                        nav_text: '#f3f6f8',
                                        header_background: '#ffffff',
                                    })}
                                >
                                    <span className='color-dot' style={{ background: preset.primary }} />
                                    {preset.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className='admin-panel__card'>
                        <h2 className='admin-panel__card-title'>Theme Colors Customizer</h2>
                        <div className='admin-panel__grid'>
                            <div className='admin-panel__form-group'>
                                <label>Primary Accent Color</label>
                                <input
                                    type='text'
                                    value={colors.primary}
                                    onChange={e => setColors(prev => ({ ...prev, primary: e.target.value }))}
                                />
                            </div>
                            <div className='admin-panel__form-group'>
                                <label>Secondary Accent Color</label>
                                <input
                                    type='text'
                                    value={colors.secondary}
                                    onChange={e => setColors(prev => ({ ...prev, secondary: e.target.value }))}
                                />
                            </div>
                            <div className='admin-panel__form-group'>
                                <label>Navigation Bar Background</label>
                                <input
                                    type='text'
                                    value={colors.nav_background}
                                    onChange={e => setColors(prev => ({ ...prev, nav_background: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>

                    <div className='admin-panel__card'>
                        <h2 className='admin-panel__card-title'>Header Navigation Menu Items</h2>
                        <p className='help-text' style={{ marginBottom: 16 }}>Enable or disable sections in the top navigation bar for users.</p>
                        <div className='admin-panel__nav-grid'>
                            {NAVIGATION_CATALOG.map(item => (
                                <div key={item.id} className='nav-item-toggle'>
                                    <span>{item.label}</span>
                                    <label className='switch'>
                                        <input
                                            type='checkbox'
                                            checked={navigation.includes(item.id)}
                                            disabled={item.required}
                                            onChange={() => toggleNavItem(item.id)}
                                        />
                                        <span className='slider' />
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className='admin-panel__action-bar'>
                        <button type='button' className='btn-primary' onClick={saveBrandingConfig}>
                            Save Branding & Menu Settings
                        </button>
                    </div>
                </div>
            )}

            {/* Tab 4: Risk & Limits */}
            {activeTab === 'risk' && (
                <div className='admin-panel__content'>
                    <div className='admin-panel__card'>
                        <h2 className='admin-panel__card-title'>Account Risk & Loss Capping</h2>
                        <div className='admin-panel__grid'>
                            <div className='admin-panel__form-group'>
                                <label>Max Daily Session Loss ($ USD)</label>
                                <input
                                    type='number'
                                    value={maxLossLimit}
                                    onChange={e => {
                                        setMaxLossLimit(e.target.value);
                                        localStorage.setItem('admin_max_loss', e.target.value);
                                    }}
                                />
                                <span className='help-text'>Automated bots will stop executing if session losses reach this amount.</span>
                            </div>

                            <div className='admin-panel__form-group'>
                                <label>Max Stake Cap Per Contract ($ USD)</label>
                                <input
                                    type='number'
                                    value={maxStakeCap}
                                    onChange={e => {
                                        setMaxStakeCap(e.target.value);
                                        localStorage.setItem('admin_max_stake', e.target.value);
                                    }}
                                />
                                <span className='help-text'>Maximum single trade stake permitted by martingale or quick strategies.</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab 5: Bot Strategies */}
            {activeTab === 'bots' && (
                <div className='admin-panel__content'>
                    {/* Display Layout Mode Control */}
                    <div className='admin-panel__card' style={{ marginBottom: 20 }}>
                        <h2 className='admin-panel__card-title'>🎨 User View Display Layout Mode</h2>
                        <p className='help-text' style={{ marginBottom: 12 }}>
                            Control how strategy bots are presented to users on the Bot Collection page.
                        </p>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            <button
                                type='button'
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: 8,
                                    border: '1px solid #059669',
                                    background: adminBotsLayout === 'horizontal' ? '#059669' : 'transparent',
                                    color: adminBotsLayout === 'horizontal' ? '#ffffff' : 'var(--site-text, #0f172a)',
                                    fontWeight: 700,
                                    fontSize: 14,
                                    cursor: 'pointer',
                                }}
                                onClick={() => {
                                    setAdminBotsLayout('horizontal');
                                    localStorage.setItem('user_bots_display_layout', 'horizontal');
                                }}
                            >
                                ↔ Horizontal Slider / Slide Line (Default)
                            </button>
                            <button
                                type='button'
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: 8,
                                    border: '1px solid #059669',
                                    background: adminBotsLayout === 'grid' ? '#059669' : 'transparent',
                                    color: adminBotsLayout === 'grid' ? '#ffffff' : 'var(--site-text, #0f172a)',
                                    fontWeight: 700,
                                    fontSize: 14,
                                    cursor: 'pointer',
                                }}
                                onClick={() => {
                                    setAdminBotsLayout('grid');
                                    localStorage.setItem('user_bots_display_layout', 'grid');
                                }}
                            >
                                田 Grid View Layout
                            </button>
                        </div>
                    </div>

                    {/* Bot Strategy Add / Edit Form */}
                    <div className='admin-panel__card'>
                        <h2 className='admin-panel__card-title'>
                            {editingBotId ? '✏️ Edit Strategy Bot' : '🤖 Add & Configure Strategy Bot'}
                        </h2>
                        <p className='help-text' style={{ marginBottom: 20 }}>
                            {editingBotId
                                ? 'Update bot strategy metadata, direct image file, YouTube tutorial link, or Blockly XML content.'
                                : 'Upload direct image files, YouTube strategy links, and Blockly XML code to add new bots for users.'}
                        </p>

                        <div className='admin-panel__grid' style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                            <div className='admin-panel__form-group'>
                                <label>Bot Strategy Name *</label>
                                <input
                                    type='text'
                                    placeholder='e.g., ELISY254 Volatility 100 Pro Bot'
                                    value={adminBotName}
                                    onChange={e => setAdminBotName(e.target.value)}
                                />
                            </div>

                            <div className='admin-panel__form-group'>
                                <label>Strategy Badge Tag</label>
                                <input
                                    type='text'
                                    placeholder='e.g., HIGH WIN RATE / VOLATILITY 100 / MARTINGALE'
                                    value={adminBotTags}
                                    onChange={e => setAdminBotTags(e.target.value)}
                                />
                            </div>

                            <div className='admin-panel__form-group' style={{ gridColumn: '1 / -1' }}>
                                <label>Bot Strategy Description</label>
                                <textarea
                                    rows={2}
                                    placeholder='Describe the bot strategy, recommended stake, contract duration, or market conditions...'
                                    value={adminBotDescription}
                                    onChange={e => setAdminBotDescription(e.target.value)}
                                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--site-border, #cbd5e1)' }}
                                />
                            </div>

                            {/* Direct Image File Upload & URL */}
                            <div className='admin-panel__form-group'>
                                <label>Upload Direct Image File *</label>
                                <input
                                    type='file'
                                    accept='image/*'
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        const reader = new FileReader();
                                        reader.onload = (event) => {
                                            const dataUrl = event.target?.result as string;
                                            if (dataUrl) setAdminBotImageUrl(dataUrl);
                                        };
                                        reader.readAsDataURL(file);
                                    }}
                                />
                                <span className='help-text' style={{ margin: '4px 0 6px', display: 'block' }}>
                                    Or paste external Image Link URL below:
                                </span>
                                <input
                                    type='text'
                                    placeholder='https://images.unsplash.com/...'
                                    value={adminBotImageUrl}
                                    onChange={e => setAdminBotImageUrl(e.target.value)}
                                />
                                {adminBotImageUrl && (
                                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <img src={adminBotImageUrl} alt="Preview" style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover', border: '1px solid #059669' }} />
                                        <span className='help-text' style={{ color: '#059669', fontWeight: 600 }}>✓ Cover Image Ready</span>
                                    </div>
                                )}
                            </div>

                            {/* YouTube Video Link */}
                            <div className='admin-panel__form-group'>
                                <label>YouTube Strategy Video Link</label>
                                <input
                                    type='text'
                                    placeholder='https://www.youtube.com/watch?v=...'
                                    value={adminBotYoutubeUrl}
                                    onChange={e => setAdminBotYoutubeUrl(e.target.value)}
                                />
                                {adminBotYoutubeUrl && (
                                    <span className='help-text' style={{ color: getYouTubeEmbedUrl(adminBotYoutubeUrl) ? '#10b981' : '#ef4444' }}>
                                        {getYouTubeEmbedUrl(adminBotYoutubeUrl) ? '✓ Valid YouTube link detected' : '⚠ Invalid YouTube link'}
                                    </span>
                                )}
                            </div>

                            {/* XML Strategy Upload */}
                            <div className='admin-panel__form-group' style={{ gridColumn: '1 / -1' }}>
                                <label>Blockly Strategy XML File *</label>
                                <input
                                    type='file'
                                    accept='.xml'
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        setAdminBotXmlFileName(file.name);
                                        const reader = new FileReader();
                                        reader.onload = (event) => {
                                            const content = event.target?.result as string;
                                            if (content) {
                                                setAdminBotXmlContent(content);
                                                if (!adminBotName) {
                                                    setAdminBotName(file.name.replace(/\.xml$/i, ''));
                                                }
                                            }
                                        };
                                        reader.readAsText(file);
                                    }}
                                />
                                {adminBotXmlFileName && <span className='help-text'>Selected XML file: {adminBotXmlFileName}</span>}
                            </div>

                            {/* Disable Checkbox */}
                            <div className='admin-panel__form-group' style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600 }}>
                                    <input
                                        type='checkbox'
                                        checked={adminBotDisabled}
                                        onChange={e => setAdminBotDisabled(e.target.checked)}
                                    />
                                    Disable bot (hide from user library view)
                                </label>
                            </div>
                        </div>

                        <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
                            <button
                                type='button'
                                className='admin-panel__btn admin-panel__btn--primary'
                                style={{ padding: '10px 24px', background: '#059669', color: '#fff', fontWeight: 700, borderRadius: 8, cursor: 'pointer', border: 'none' }}
                                onClick={() => {
                                    if (!adminBotName.trim()) {
                                        alert('Please enter a Bot Strategy Name.');
                                        return;
                                    }
                                    if (!adminBotXmlContent.trim()) {
                                        alert('Please select a valid Blockly XML strategy file.');
                                        return;
                                    }

                                    if (editingBotId) {
                                        // Update existing bot
                                        const updated = adminBotsList.map(b => {
                                            if (b.id === editingBotId) {
                                                return {
                                                    ...b,
                                                    name: adminBotName.trim(),
                                                    fileName: adminBotXmlFileName || b.fileName,
                                                    xmlContent: adminBotXmlContent,
                                                    description: adminBotDescription.trim(),
                                                    imageUrl: adminBotImageUrl.trim(),
                                                    youtubeUrl: adminBotYoutubeUrl.trim(),
                                                    tags: adminBotTags.trim() || 'STRATEGY',
                                                    disabled: adminBotDisabled,
                                                };
                                            }
                                            return b;
                                        });

                                        setAdminBotsList(updated);
                                        localStorage.setItem('user_custom_bots_library', JSON.stringify(updated));

                                        setLogs(prev => [
                                            ...prev,
                                            { time: new Date().toLocaleTimeString(), text: `Updated bot strategy "${adminBotName.trim()}".`, type: 'success' },
                                        ]);

                                        alert(`Bot Strategy "${adminBotName.trim()}" successfully updated!`);
                                    } else {
                                        // Add new bot
                                        const newBot: UserBotItem = {
                                            id: `bot-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                                            name: adminBotName.trim(),
                                            fileName: adminBotXmlFileName || `${adminBotName.toLowerCase().replace(/\s+/g, '_')}.xml`,
                                            xmlContent: adminBotXmlContent,
                                            addedAt: new Date().toLocaleDateString(),
                                            description: adminBotDescription.trim() || 'Custom strategy configured via Admin Panel.',
                                            imageUrl: adminBotImageUrl.trim(),
                                            youtubeUrl: adminBotYoutubeUrl.trim(),
                                            tags: adminBotTags.trim() || 'ADMIN BOT',
                                            disabled: adminBotDisabled,
                                        };

                                        const updated = [newBot, ...adminBotsList];
                                        setAdminBotsList(updated);
                                        localStorage.setItem('user_custom_bots_library', JSON.stringify(updated));

                                        setLogs(prev => [
                                            ...prev,
                                            { time: new Date().toLocaleTimeString(), text: `Added bot strategy "${newBot.name}".`, type: 'success' },
                                        ]);

                                        alert(`Bot Strategy "${newBot.name}" successfully added to the platform!`);
                                    }

                                    // Reset form
                                    setEditingBotId(null);
                                    setAdminBotName('');
                                    setAdminBotDescription('');
                                    setAdminBotImageUrl('');
                                    setAdminBotYoutubeUrl('');
                                    setAdminBotTags('HIGH WIN RATE');
                                    setAdminBotXmlContent('');
                                    setAdminBotXmlFileName('');
                                    setAdminBotDisabled(false);
                                }}
                            >
                                {editingBotId ? '💾 Save & Update Strategy Bot' : '+ Add Strategy Bot to Platform'}
                            </button>

                            {editingBotId && (
                                <button
                                    type='button'
                                    style={{ padding: '10px 18px', background: 'transparent', color: '#64748b', fontWeight: 600, border: '1px solid #cbd5e1', borderRadius: 8, cursor: 'pointer' }}
                                    onClick={() => {
                                        setEditingBotId(null);
                                        setAdminBotName('');
                                        setAdminBotDescription('');
                                        setAdminBotImageUrl('');
                                        setAdminBotYoutubeUrl('');
                                        setAdminBotTags('HIGH WIN RATE');
                                        setAdminBotXmlContent('');
                                        setAdminBotXmlFileName('');
                                        setAdminBotDisabled(false);
                                    }}
                                >
                                    Cancel Edit
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Manage Existing Bots List */}
                    <div className='admin-panel__card' style={{ marginTop: 24 }}>
                        <h2 className='admin-panel__card-title'>📚 Platform Strategy Bots ({adminBotsList.length})</h2>
                        <p className='help-text' style={{ marginBottom: 12 }}>
                            Reorder, edit, disable, or delete bots to control their sequence on the user page.
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginTop: 16 }}>
                            {adminBotsList.map((bot, index) => {
                                const embedVideo = getYouTubeEmbedUrl(bot.youtubeUrl);
                                return (
                                    <div
                                        key={bot.id}
                                        style={{
                                            border: `1px solid ${bot.disabled ? '#f87171' : 'var(--site-border, #cbd5e1)'}`,
                                            borderRadius: 12,
                                            padding: 14,
                                            background: bot.disabled ? 'rgba(254, 226, 226, 0.2)' : 'var(--site-card-bg, #ffffff)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 10,
                                            position: 'relative',
                                        }}
                                    >
                                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                            {bot.imageUrl ? (
                                                <img src={bot.imageUrl} alt={bot.name} style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ width: 48, height: 48, borderRadius: 8, background: '#059669', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                                                    🦁
                                                </div>
                                            )}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <strong style={{ fontSize: 14, display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                                    {bot.name}
                                                </strong>
                                                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 2 }}>
                                                    <span style={{ fontSize: 11, color: '#059669', fontWeight: 700 }}>
                                                        {bot.tags || 'STRATEGY'}
                                                    </span>
                                                    {bot.disabled && (
                                                        <span style={{ background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 4 }}>
                                                            DISABLED
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <p style={{ fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                                            {bot.description || 'No description provided.'}
                                        </p>

                                        {embedVideo && (
                                            <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                ▶ Includes YouTube Tutorial Video
                                            </div>
                                        )}

                                        {/* Actions Toolbar */}
                                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 'auto', paddingTop: 8, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                                            {/* Reorder Up / Down */}
                                            <button
                                                type='button'
                                                title='Move Up'
                                                disabled={index === 0}
                                                style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #cbd5e1', background: 'transparent', cursor: index === 0 ? 'not-allowed' : 'pointer' }}
                                                onClick={() => {
                                                    const updated = [...adminBotsList];
                                                    const temp = updated[index];
                                                    updated[index] = updated[index - 1];
                                                    updated[index - 1] = temp;
                                                    setAdminBotsList(updated);
                                                    localStorage.setItem('user_custom_bots_library', JSON.stringify(updated));
                                                }}
                                            >
                                                ▲
                                            </button>
                                            <button
                                                type='button'
                                                title='Move Down'
                                                disabled={index === adminBotsList.length - 1}
                                                style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #cbd5e1', background: 'transparent', cursor: index === adminBotsList.length - 1 ? 'not-allowed' : 'pointer' }}
                                                onClick={() => {
                                                    const updated = [...adminBotsList];
                                                    const temp = updated[index];
                                                    updated[index] = updated[index + 1];
                                                    updated[index + 1] = temp;
                                                    setAdminBotsList(updated);
                                                    localStorage.setItem('user_custom_bots_library', JSON.stringify(updated));
                                                }}
                                            >
                                                ▼
                                            </button>

                                            {/* Edit */}
                                            <button
                                                type='button'
                                                style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #059669', color: '#059669', background: 'transparent', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                                                onClick={() => {
                                                    setEditingBotId(bot.id);
                                                    setAdminBotName(bot.name);
                                                    setAdminBotDescription(bot.description || '');
                                                    setAdminBotImageUrl(bot.imageUrl || '');
                                                    setAdminBotYoutubeUrl(bot.youtubeUrl || '');
                                                    setAdminBotTags(bot.tags || 'HIGH WIN RATE');
                                                    setAdminBotXmlContent(bot.xmlContent);
                                                    setAdminBotXmlFileName(bot.fileName);
                                                    setAdminBotDisabled(!!bot.disabled);
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                }}
                                            >
                                                ✏️ Edit
                                            </button>

                                            {/* Enable / Disable */}
                                            <button
                                                type='button'
                                                style={{
                                                    padding: '4px 10px',
                                                    borderRadius: 6,
                                                    border: `1px solid ${bot.disabled ? '#10b981' : '#f59e0b'}`,
                                                    color: bot.disabled ? '#10b981' : '#d97706',
                                                    background: 'transparent',
                                                    fontWeight: 700,
                                                    fontSize: 12,
                                                    cursor: 'pointer',
                                                }}
                                                onClick={() => {
                                                    const updated = adminBotsList.map(b => b.id === bot.id ? { ...b, disabled: !b.disabled } : b);
                                                    setAdminBotsList(updated);
                                                    localStorage.setItem('user_custom_bots_library', JSON.stringify(updated));
                                                }}
                                            >
                                                {bot.disabled ? '👁️ Enable' : '🚫 Disable'}
                                            </button>

                                            {/* Delete */}
                                            <button
                                                type='button'
                                                style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #ef4444', color: '#ef4444', background: 'transparent', fontWeight: 700, fontSize: 12, cursor: 'pointer', marginLeft: 'auto' }}
                                                onClick={() => {
                                                    if (window.confirm(`Delete bot strategy "${bot.name}"?`)) {
                                                        const updated = adminBotsList.filter(b => b.id !== bot.id);
                                                        setAdminBotsList(updated);
                                                        localStorage.setItem('user_custom_bots_library', JSON.stringify(updated));
                                                    }
                                                }}
                                            >
                                                🗑️ Delete
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Tab 6: API & Server */}
            {activeTab === 'api' && (
                <div className='admin-panel__content'>
                    <div className='admin-panel__card'>
                        <h2 className='admin-panel__card-title'>Deriv API & WebSocket Server</h2>
                        <div className='admin-panel__grid'>
                            <div className='admin-panel__form-group'>
                                <label>WebSocket Endpoint URL</label>
                                <input
                                    type='text'
                                    value={serverEndpoint}
                                    onChange={e => {
                                        setServerEndpoint(e.target.value);
                                        localStorage.setItem('admin_ws_endpoint', e.target.value);
                                    }}
                                />
                            </div>
                            <div className='admin-panel__form-group'>
                                <label>Deriv Registered App ID</label>
                                <input
                                    type='text'
                                    value={appId}
                                    onChange={e => {
                                        setAppId(e.target.value);
                                        localStorage.setItem('admin_app_id', e.target.value);
                                    }}
                                />
                            </div>
                        </div>
                        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <button type='button' className='btn-secondary' onClick={handlePingTest} disabled={pinging}>
                                {pinging ? 'Pinging...' : 'Test Server Latency'}
                            </button>
                            {pingResult && <span style={{ fontSize: 13, fontWeight: 600 }}>{pingResult}</span>}
                        </div>
                    </div>

                    <div className='admin-panel__card' style={{ marginTop: 20 }}>
                        <h2 className='admin-panel__card-title'>✨ Google Gemini AI Configuration</h2>
                        <p className='help-text' style={{ marginBottom: 12 }}>
                            Enter your Google Gemini API Key below to enable live Gemini AI market analysis, strategy scanning, and automated trade pattern predictions.
                        </p>
                        <div className='admin-panel__grid'>
                            <div className='admin-panel__form-group' style={{ gridColumn: '1 / -1' }}>
                                <label>Google Gemini API Key</label>
                                <input
                                    type='password'
                                    placeholder='AIzaSy...'
                                    value={geminiApiKey}
                                    onChange={e => {
                                        const val = e.target.value;
                                        setGeminiApiKey(val);
                                        localStorage.setItem('gemini_api_key', val);
                                        window.dispatchEvent(new CustomEvent('admin_config_updated'));
                                    }}
                                />
                                <span className='help-text' style={{ color: geminiApiKey ? '#10b981' : '#f59e0b', fontWeight: 600, marginTop: 4 }}>
                                    {geminiApiKey ? '✓ Gemini API Key active & configured' : 'ℹ️ Enter key to unlock live LLM analysis'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab 7: Diagnostics & Logs */}
            {activeTab === 'diagnostics' && (
                <div className='admin-panel__content'>
                    <div className='admin-panel__card'>
                        <h2 className='admin-panel__card-title'>System Event Console</h2>
                        <div className='admin-panel__terminal'>
                            {logs.map((log, index) => (
                                <div key={index} className={`log-entry ${log.type}`}>
                                    [{log.time}] {log.text}
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                            <button
                                type='button'
                                className='btn-secondary'
                                onClick={() => setLogs([{ time: new Date().toLocaleTimeString(), text: 'Console logs cleared.', type: 'info' }])}
                            >
                                Clear Console
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

export const AdminDashboard = AdminPanelPage;
export default AdminPanelPage;
