import React, { useState } from 'react';
import { Bell, Check, X, ShieldAlert, Clock, UserCheck, Trash2 } from 'lucide-react';

/**
 * Shared Doulos Design System: NotificationCenter
 * - Bell trigger with unread indicator badge
 * - Dropdown popover list of administrative alerts & audit events
 */

export const NotificationCenter = ({
    notifications = [],
    onMarkAllRead,
    onClearNotification,
    isOpen = false,
    onToggle,
    className = ''
}) => {
    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div style={{ position: 'relative' }} className={className}>
            {/* Bell Trigger Button */}
            <button
                type="button"
                className="ds-icon-btn"
                onClick={onToggle}
                title="Notifications"
                aria-label="View notifications"
            >
                <Bell size={18} />
                {unreadCount > 0 && <span className="ds-icon-badge" />}
            </button>

            {/* Dropdown Popover */}
            {isOpen && (
                <div
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        right: 0,
                        width: '320px',
                        backgroundColor: 'var(--ds-surface, #FFFFFF)',
                        borderRadius: 'var(--ds-radius-lg, 16px)',
                        boxShadow: 'var(--ds-shadow-modal, 0 12px 32px rgba(15, 23, 42, 0.15))',
                        border: '1px solid var(--ds-border, #E2E8F0)',
                        zIndex: 100,
                        overflow: 'hidden'
                    }}
                >
                    <div style={{
                        padding: '0.85rem 1rem',
                        borderBottom: '1px solid var(--ds-border-subtle, #F1F5F9)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: 'var(--ds-surface-subtle, #F8FAFC)'
                    }}>
                        <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--ds-text-primary)' }}>
                            Notifications {unreadCount > 0 && `(${unreadCount})`}
                        </div>
                        {unreadCount > 0 && onMarkAllRead && (
                            <button
                                type="button"
                                onClick={onMarkAllRead}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--ds-primary, #1D4ED8)',
                                    fontSize: '0.74rem',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                }}
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                        {notifications.length === 0 ? (
                            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--ds-text-muted)', fontSize: '0.82rem' }}>
                                No new notifications. All systems clear.
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div
                                    key={n.id}
                                    style={{
                                        padding: '0.75rem 1rem',
                                        borderBottom: '1px solid var(--ds-border-subtle, #F1F5F9)',
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '0.75rem',
                                        backgroundColor: n.read ? 'transparent' : 'rgba(29, 78, 216, 0.03)'
                                    }}
                                >
                                    <div style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        backgroundColor: n.read ? 'transparent' : 'var(--ds-primary, #1D4ED8)',
                                        marginTop: '5px',
                                        flexShrink: 0
                                    }} />

                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--ds-text-primary)' }}>
                                            {n.title}
                                        </div>
                                        <div style={{ fontSize: '0.76rem', color: 'var(--ds-text-secondary)', marginTop: '0.15rem' }}>
                                            {n.message}
                                        </div>
                                        <div style={{ fontSize: '0.68rem', color: 'var(--ds-text-muted)', marginTop: '0.35rem' }}>
                                            {n.time || 'Just now'}
                                        </div>
                                    </div>

                                    {onClearNotification && (
                                        <button
                                            type="button"
                                            onClick={() => onClearNotification(n.id)}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: 'var(--ds-text-muted)',
                                                cursor: 'pointer',
                                                padding: '2px'
                                            }}
                                        >
                                            <X size={13} />
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;
