import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import '../../styles/adminDesignSystem.css';

/**
 * Shared Doulos Design System: AdminLayout
 * The master layout shell for SuperAdmin, Admin, Operator, and G-Council dashboards:
 * - Dynamic configurable Sidebar (with mobile drawer support)
 * - Main content area with signature floating surface card
 * - Integrated Topbar (search, notifications, theme toggle, identity)
 * - Notification and Toast handling
 */

export const AdminLayout = ({
    navigation = [],
    activeTab,
    onSelectTab,
    onLogout,
    user = {},
    campusSelector,
    // Topbar props
    searchValue,
    onSearchChange,
    searchPlaceholder,
    notifications = [],
    onMarkAllNotificationsRead,
    onClearNotification,
    isDarkMode = false,
    onToggleTheme,
    onProfileClick,
    topbarActions,
    // Content children
    children,
    className = ''
}) => {
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [notificationOpen, setNotificationOpen] = useState(false);

    return (
        <div className={`ds-admin-shell ${className}`}>
            {/* Sidebar Navigation */}
            <Sidebar
                navigation={navigation}
                activeTab={activeTab}
                onSelectTab={onSelectTab}
                onLogout={onLogout}
                user={user}
                campusSelector={campusSelector}
                isMobileOpen={mobileNavOpen}
                onCloseMobile={() => setMobileNavOpen(false)}
            />

            {/* Main Content Area: Floating Surface Card */}
            <main className="ds-main-area">
                <div className="ds-surface-card">
                    {/* Topbar inside the Surface Card */}
                    <Topbar
                        searchValue={searchValue}
                        onSearchChange={onSearchChange}
                        searchPlaceholder={searchPlaceholder}
                        onToggleMobileMenu={() => setMobileNavOpen(true)}
                        notifications={notifications}
                        isNotificationOpen={notificationOpen}
                        onToggleNotifications={() => setNotificationOpen(!notificationOpen)}
                        onMarkAllNotificationsRead={onMarkAllNotificationsRead}
                        onClearNotification={onClearNotification}
                        isDarkMode={isDarkMode}
                        onToggleTheme={onToggleTheme}
                        user={user}
                        onProfileClick={onProfileClick}
                        actions={topbarActions}
                    />

                    {/* Page Content Viewport */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
