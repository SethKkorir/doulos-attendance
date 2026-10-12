import React from 'react';
import { Search, Bell, Sun, Moon, ChevronDown, Menu } from 'lucide-react';
import NotificationCenter from './NotificationCenter';

/**
 * Shared Doulos Design System: Topbar
 * - Search input pill
 * - Theme toggle (Light/Dark mode)
 * - Notification Center
 * - Identity block (Avatar + Name + Portfolio/Role + Profile trigger)
 * - Mobile hamburger trigger
 */

export const Topbar = ({
    searchValue = '',
    onSearchChange,
    searchPlaceholder = 'Search...',
    onToggleMobileMenu,
    notifications = [],
    isNotificationOpen = false,
    onToggleNotifications,
    onMarkAllNotificationsRead,
    onClearNotification,
    isDarkMode = false,
    onToggleTheme,
    user = {},
    onProfileClick,
    actions,
    className = ''
}) => {
    const username = user.username || localStorage.getItem('username') || 'Luke Asote';
    const role = user.role || localStorage.getItem('role') || 'admin';
    const isDoulosUser = (username || '').toLowerCase().includes('doulos');

    return (
        <header className={`ds-topbar ${className}`}>
            {/* Mobile Hamburger & Search Pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, maxWidth: '420px' }}>
                {onToggleMobileMenu && (
                    <button
                        type="button"
                        className="ds-icon-btn ds-mobile-menu-btn"
                        onClick={onToggleMobileMenu}
                        style={{ display: 'none' }}
                        aria-label="Open navigation menu"
                    >
                        <Menu size={18} />
                    </button>
                )}

                {onSearchChange && (
                    <div className="ds-search-box">
                        <Search size={16} color="var(--ds-text-placeholder, #94A3B8)" />
                        <input
                            type="text"
                            className="ds-search-input"
                            placeholder={searchPlaceholder}
                            value={searchValue}
                            onChange={e => onSearchChange(e.target.value)}
                        />
                    </div>
                )}
            </div>

            {/* Right side actions: Extra actions, Theme, Notifications, Identity */}
            <div className="ds-topbar-actions">
                {actions}

                {/* Theme Toggle Button */}
                {onToggleTheme && (
                    <button
                        type="button"
                        className="ds-icon-btn"
                        onClick={onToggleTheme}
                        title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        aria-label="Toggle theme"
                    >
                        {isDarkMode ? <Sun size={17} color="#FBBF24" /> : <Moon size={17} />}
                    </button>
                )}

                {/* Notifications Popover */}
                <NotificationCenter
                    notifications={notifications}
                    isOpen={isNotificationOpen}
                    onToggle={onToggleNotifications}
                    onMarkAllRead={onMarkAllNotificationsRead}
                    onClearNotification={onClearNotification}
                />

                {/* Identity Profile Block */}
                <div
                    className="ds-identity-block"
                    onClick={onProfileClick}
                    title="Account Settings"
                >
                    <div
                        className="ds-identity-avatar"
                        style={{
                            overflow: 'hidden',
                            padding: isDoulosUser ? '2px' : 0,
                            backgroundColor: isDoulosUser ? '#FFFFFF' : undefined
                        }}
                    >
                        {isDoulosUser ? (
                            <img src="/logo.png" alt="Doulos" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        ) : (
                            (username || role).charAt(0).toUpperCase()
                        )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--ds-text-primary, #0F172A)', lineHeight: 1.2 }}>
                            {username}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--ds-text-muted, #64748B)', fontWeight: 600 }}>
                            {['superadmin', 'SuperAdmin'].includes(role) ? 'G1 Coordinator' :
                             role === 'developer' ? 'Lead Systems' :
                             role === 'trainer' ? 'G5 Training Directorate' :
                             role.startsWith('g') ? role.toUpperCase() : 'Administrator'}
                        </span>
                    </div>

                    <ChevronDown size={14} color="var(--ds-text-muted, #64748B)" />
                </div>
            </div>
        </header>
    );
};

export default Topbar;
