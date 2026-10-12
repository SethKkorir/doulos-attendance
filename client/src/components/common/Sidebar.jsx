import React from 'react';
import { LogOut, ChevronDown, Sparkles } from 'lucide-react';
import Logo from '../Logo';
import { renderIcon } from './iconHelper';

/**
 * Shared Doulos Design System: Sidebar
 * Receives navigation configuration dynamically:
 * - navigation: Array of {
 *     title?: string (group header),
 *     items: Array<{ id, label, icon: LucideIcon, badge?: string|number, onClick?: () => void }>
 *   }
 * - activeTab: Current active route id
 * - onSelectTab: Callback when selecting an item
 * - onLogout: Sign out handler
 * - user: { username, role, campus }
 */

export const Sidebar = ({
    navigation = [],
    activeTab,
    onSelectTab,
    onLogout,
    user = {},
    campusSelector,
    isMobileOpen = false,
    onCloseMobile,
    className = ''
}) => {
    const username = user.username || localStorage.getItem('username') || 'Doulos Admin';
    const role = user.role || localStorage.getItem('role') || 'admin';
    const campus = user.campus || localStorage.getItem('campus') || 'Athi River';

    return (
        <>
            {/* Mobile Backdrop */}
            {isMobileOpen && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(15, 23, 42, 0.6)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 55
                    }}
                    onClick={onCloseMobile}
                />
            )}

            <aside className={`ds-sidebar ${isMobileOpen ? 'mobile-open' : ''} ${className}`}>
                {/* Brand Header */}
                <div className="ds-sidebar-brand">
                    <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        backgroundColor: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '3px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                        flexShrink: 0
                    }}>
                        <img
                            src="/logo.png"
                            alt="Doulos Logo"
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = '<span style="font-weight:900;color:#1E3A8A;font-size:16px;">D</span>';
                            }}
                        />
                    </div>
                    <div>
                        <div className="ds-sidebar-brand-title">DOULOS</div>
                        <div className="ds-sidebar-brand-sub">Management System</div>
                    </div>
                </div>

                {/* Optional Campus Switcher Slot */}
                {campusSelector && (
                    <div style={{ marginBottom: '1rem', padding: '0 0.25rem' }}>
                        {campusSelector}
                    </div>
                )}

                {/* Dynamic Grouped Navigation List */}
                <div className="ds-nav-list">
                    {navigation.map((group, gIdx) => {
                        // If group is an array of items without a title
                        const isFlat = Array.isArray(group);
                        const items = isFlat ? group : group.items || [];
                        const title = !isFlat ? group.title : null;

                        return (
                            <div key={group.title || `group-${gIdx}`} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                {title && (
                                    <div className="ds-nav-group-label">
                                        {title}
                                    </div>
                                )}
                                {items.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = activeTab === item.id;

                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            className={`ds-nav-item ${isActive ? 'active' : ''}`}
                                            onClick={() => {
                                                if (item.onClick) {
                                                    item.onClick();
                                                } else if (onSelectTab) {
                                                    onSelectTab(item.id);
                                                }
                                                if (onCloseMobile) onCloseMobile();
                                            }}
                                        >
                                            {renderIcon(Icon, 18, { style: { flexShrink: 0 } })}
                                            <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {item.label}
                                            </span>
                                            {item.badge !== undefined && item.badge !== null && (
                                                <span style={{
                                                    fontSize: '0.68rem',
                                                    fontWeight: 800,
                                                    padding: '0.15rem 0.5rem',
                                                    borderRadius: '999px',
                                                    backgroundColor: isActive ? '#1D4ED8' : 'rgba(255, 255, 255, 0.15)',
                                                    color: '#FFFFFF'
                                                }}>
                                                    {item.badge}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>

                {/* User & Sign Out Footer */}
                <div style={{
                    marginTop: 'auto',
                    paddingTop: '1rem',
                    borderTop: '1px solid var(--ds-sidebar-border, rgba(255, 255, 255, 0.08))'
                }}>
                    <button
                        type="button"
                        onClick={onLogout}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            width: '100%',
                            padding: '0.65rem 0.95rem',
                            borderRadius: 'var(--ds-radius-pill, 999px)',
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#FFFFFF',
                            fontSize: '0.84rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'}
                    >
                        <LogOut size={16} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
