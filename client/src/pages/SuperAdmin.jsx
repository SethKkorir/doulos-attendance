import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Activity, Clock, Radio, FileText,
    Users, Award, Mail, ShieldCheck, Key,
    Database, DownloadCloud, RefreshCw, Server,
    Megaphone, AlertTriangle, Bell, MapPin, Calendar,
    Bookmark, Sliders, Cpu, ShieldAlert, FileCheck,
    Code, Plus, Trash2, CheckCircle, Copy, ExternalLink,
    Eye, Zap, Lock, Shield, ArrowRight, UploadCloud,
    Search, Filter, Check, X, Info
} from 'lucide-react';
import api from '../api';
import Logo from '../components/Logo';
import SystemObservabilityTab from '../components/dashboard/SystemObservabilityTab';
import {
    AdminLayout, PageHeader, Card, StatCard, Button,
    DataTable, StatusPill, Modal, ConfirmDialog,
    FormGroup, Input, Select, Alert, Toast
} from '../components/common';
import '../styles/adminDesignSystem.css';

// 9 Constitutional Positions Definition
const G9_POSITIONS = [
    { code: 'G1', title: 'Student Coordinator', defaultScope: 'Organization-wide / Both Campuses', campusLocked: false },
    { code: 'G2', title: 'Assistant Student Coordinator', defaultScope: 'Organization-wide / Both Campuses', campusLocked: false },
    { code: 'G3', title: 'Spiritual Coordinator (Athi River)', defaultScope: 'Athi River', campusLocked: true },
    { code: 'G4', title: 'Spiritual Coordinator (Valley Road)', defaultScope: 'Valley Road', campusLocked: true },
    { code: 'G5', title: 'Training Coordinator (Athi River)', defaultScope: 'Athi River', campusLocked: true },
    { code: 'G6', title: 'Training Coordinator (Valley Road)', defaultScope: 'Valley Road', campusLocked: true },
    { code: 'G7', title: 'Finance & Equipment Coordinator', defaultScope: 'Organization-wide / Both Campuses', campusLocked: false },
    { code: 'G8', title: 'Freedom Base Coordinator', defaultScope: 'Organization-wide / Both Campuses', campusLocked: false },
    { code: 'G9', title: 'Special Projects & Liaison Coordinator', defaultScope: 'Organization-wide / Both Campuses', campusLocked: false }
];

const SuperAdmin = () => {
    const navigate = useNavigate();
    const currentUsername = localStorage.getItem('username') || 'SuperAdmin';
    const currentUserRole = localStorage.getItem('role') || 'superadmin';

    // Active Navigation Tab
    const [activeTab, setActiveTab] = useState('dashboard');
    const [unauthorized, setUnauthorized] = useState(false);
    const [loading, setLoading] = useState(false);
    const [toastMessage, setToastMessage] = useState(null);

    // Platform Governance State (Strictly preserving existing backend contract)
    const [status, setStatus] = useState({
        recoveryMode: false,
        manualMaintenance: false,
        targetClusterUri: '',
        currentCluster: 'New (Temporary)',
        activeUsers: 0,
        activeMembers: 0,
        g9Count: 0,
        dbConnected: true,
        maintenanceSchedule: null,
        serverHealth: {
            server: 'Operational',
            database: 'Connected',
            auth: 'Operational',
            attendance: 'Operational',
            workers: 'Operational'
        }
    });

    // Cloud Backups & Staff List States (Existing Functionality Preserved)
    const [cloudBackups, setCloudBackups] = useState([]);
    const [loadingBackups, setLoadingBackups] = useState(false);
    const [staffList, setStaffList] = useState([]);
    const [loadingStaff, setLoadingStaff] = useState(false);
    const [merging, setMerging] = useState(false);
    const [backingUp, setBackingUp] = useState(false);

    // New System Governance States
    const [invitations, setInvitations] = useState([]);
    const [loadingInvitations, setLoadingInvitations] = useState(false);
    const [auditLogs, setAuditLogs] = useState([]);
    const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);
    const [branding, setBranding] = useState(null);

    // Modal States
    const [isCreateAccountOpen, setIsCreateAccountOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isScheduleMaintenanceOpen, setIsScheduleMaintenanceOpen] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', variant: 'danger', onConfirm: () => {} });

    // Forms State
    const [createForm, setCreateForm] = useState({
        username: '',
        password: '',
        campus: 'Athi River',
        role: 'admin',
        email: '',
        position: ''
    });

    const [inviteForm, setInviteForm] = useState({
        email: '',
        role: 'admin',
        position: 'G1 — Student Coordinator',
        campus: 'All Campuses (Global)'
    });

    const [scheduleForm, setScheduleForm] = useState({
        startDate: new Date().toISOString().split('T')[0],
        startTime: '22:00',
        endDate: new Date().toISOString().split('T')[0],
        endTime: '23:59',
        reason: 'Database and server platform maintenance',
        message: 'The Doulos platform will be temporarily unavailable while scheduled maintenance is performed.',
        affectedScope: 'All Campuses and Services'
    });

    // Search and Filter States for Users
    const [userSearch, setUserSearch] = useState('');
    const [userRoleFilter, setUserRoleFilter] = useState('ALL');

    // ==========================================
    // INITIALIZATION & AUTH VERIFICATION
    // ==========================================
    useEffect(() => {
        const verifyAndLoad = async () => {
            const role = localStorage.getItem('role');
            const token = localStorage.getItem('token');
            const username = localStorage.getItem('username');

            const isAuthorized = token && (
                ['admin', 'superadmin', 'developer', 'SuperAdmin'].includes(role) ||
                username === 'supersuperadmin'
            );

            if (!isAuthorized) {
                setUnauthorized(true);
                return;
            }

            try {
                await Promise.all([
                    fetchStatus(),
                    fetchStaffList(),
                    fetchCloudBackups(),
                    fetchInvitations(),
                    fetchAuditLogs(),
                    fetchBranding()
                ]);
            } catch (err) {
                console.error("Super Admin data initialization error:", err);
            }
        };

        verifyAndLoad();
    }, []);

    // ==========================================
    // API CALLS (PRESERVING EXISTING ENDPOINTS)
    // ==========================================
    const fetchStatus = async () => {
        try {
            const res = await api.get('/system/system-status');
            setStatus(prev => ({ ...prev, ...res.data }));
            setUnauthorized(false);
        } catch (err) {
            console.error("System Offline or Unauthorized", err);
            if (err.response?.status === 401 || err.response?.status === 403) {
                setUnauthorized(true);
            }
        }
    };

    const fetchStaffList = async () => {
        setLoadingStaff(true);
        try {
            const res = await api.get('/auth/users');
            setStaffList(res.data);
        } catch (err) {
            console.error("Failed to load staff list", err);
        } finally {
            setLoadingStaff(false);
        }
    };

    const fetchCloudBackups = async () => {
        setLoadingBackups(true);
        try {
            const res = await api.get('/system/cloud-backups');
            setCloudBackups(res.data);
        } catch (err) {
            console.error("Failed to load cloud backups", err);
        } finally {
            setLoadingBackups(false);
        }
    };

    const fetchInvitations = async () => {
        setLoadingInvitations(true);
        try {
            const res = await api.get('/auth/invitations');
            setInvitations(res.data);
        } catch (err) {
            console.warn("Invitations endpoint unavailable or error:", err.message);
        } finally {
            setLoadingInvitations(false);
        }
    };

    const fetchAuditLogs = async () => {
        setLoadingAuditLogs(true);
        try {
            const res = await api.get('/system/audit-logs');
            setAuditLogs(res.data);
        } catch (err) {
            console.warn("Audit logs endpoint unavailable or error:", err.message);
        } finally {
            setLoadingAuditLogs(false);
        }
    };

    const fetchBranding = async () => {
        try {
            const res = await api.get('/system/branding');
            setBranding(res.data);
        } catch (err) {
            console.warn("Branding endpoint unavailable:", err.message);
        }
    };

    // Helper: Record Audit Log Event
    const recordAuditLog = async (action, target, details, result = 'SUCCESS') => {
        try {
            await api.post('/system/audit-logs', { action, target, details, result });
            fetchAuditLogs();
        } catch (e) {
            // Silently continue if audit endpoint is not yet connected
        }
    };

    // Helper: Toast Trigger
    const showToast = (text, type = 'success') => {
        setToastMessage({ text, type });
        setTimeout(() => setToastMessage(null), 4000);
    };

    // ==========================================
    // ACTION HANDLERS (PRESERVED FUNCTIONALITY)
    // ==========================================
    const handleSaveConfig = async (overrideStatus) => {
        setLoading(true);
        const dataToSave = overrideStatus || status;
        try {
            await api.post('/system/system-config', dataToSave);
            showToast('System configuration & cluster bridge updated successfully.', 'success');
            recordAuditLog('CONFIG_UPDATED', 'System Configuration', 'Updated target cluster URI or flags.');
            fetchStatus();
        } catch (err) {
            showToast('Failed to update system configuration: ' + (err.response?.data?.message || err.message), 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleManualBackup = async () => {
        setBackingUp(true);
        showToast('Initiating cloud backup dump...', 'info');
        try {
            const res = await api.post('/system/manual-backup');
            showToast(res.data.message || 'Cloud backup generated and stored successfully!', 'success');
            recordAuditLog('BACKUP_CREATED', 'GitHub / Cloud', 'Triggered manual cloud snapshot backup.');
            fetchCloudBackups();
        } catch (err) {
            showToast('Cloud backup failed. You can still use Download Snapshot (.JSON) to save locally.', 'error');
        } finally {
            setBackingUp(false);
        }
    };

    const handleDownloadBackup = async () => {
        setLoading(true);
        showToast('Preparing registry snapshot dump...', 'info');
        try {
            const res = await api.get('/system/full-dump');
            const backupData = {
                timestamp: new Date().toISOString(),
                ...res.data
            };
            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Doulos_Platform_Snapshot_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast('Registry snapshot successfully exported and downloaded.', 'success');
            recordAuditLog('SNAPSHOT_DOWNLOADED', 'Platform Snapshot', 'Exported full JSON snapshot dump.');
        } catch (err) {
            showToast('Snapshot export failed: ' + (err.response?.data?.message || err.message), 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleRestoreCloudBackup = (fileName) => {
        setConfirmDialog({
            open: true,
            title: 'Critical Database Recovery Warning',
            message: `⚠️ CRITICAL: You are about to restore the active database from cloud snapshot "${fileName}". This will completely replace existing student records, check-ins, and settings. Are you certain you wish to proceed?`,
            variant: 'danger',
            confirmText: 'Yes, Overwrite & Restore',
            onConfirm: async () => {
                setConfirmDialog(prev => ({ ...prev, open: false }));
                setLoading(true);
                showToast(`Restoring active database from snapshot: ${fileName}...`, 'info');
                try {
                    const res = await api.post('/system/restore-cloud-backup', { fileName });
                    recordAuditLog('DATABASE_RESTORED', fileName, 'Restored database from cloud snapshot.');
                    alert(`SUCCESS: Database successfully recovered!\n\n${res.data.message}`);
                    window.location.reload();
                } catch (err) {
                    showToast('Cloud restore failed: ' + (err.response?.data?.message || err.message), 'error');
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const handleRestoreLocalFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const backupData = JSON.parse(event.target.result);
                if (!backupData.members || !backupData.meetings || !backupData.attendance) {
                    alert('Invalid backup structure: Snapshot must contain members, meetings, and attendance.');
                    return;
                }

                setConfirmDialog({
                    open: true,
                    title: 'Overwrite Active Database from Local Snapshot',
                    message: `⚠️ CRITICAL: You are about to wipe and re-inject data from "${file.name}". Stored members: ${backupData.members.length}. Proceed with overwrite?`,
                    variant: 'danger',
                    confirmText: 'Wipe & Re-inject Database',
                    onConfirm: async () => {
                        setConfirmDialog(prev => ({ ...prev, open: false }));
                        setLoading(true);
                        showToast('Injecting snapshot into active database...', 'info');
                        try {
                            const res = await api.post('/system/restore-db', backupData);
                            recordAuditLog('DATABASE_RESTORED', file.name, `Restored ${backupData.members.length} members from JSON.`);
                            alert(`SUCCESS: Database recovered! ${res.data.counts?.members} members injected.`);
                            window.location.reload();
                        } catch (err) {
                            showToast('Restore failed: ' + (err.response?.data?.message || err.message), 'error');
                        } finally {
                            setLoading(false);
                            e.target.value = '';
                        }
                    }
                });
            } catch (err) {
                showToast('Failed to parse snapshot JSON file.', 'error');
                e.target.value = '';
            }
        };
        reader.readAsText(file);
    };

    const handleRunMerge = async () => {
        if (!status.targetClusterUri) {
            alert('Please provide the Target Main Cluster URI first.');
            return;
        }

        if (!status.recoveryMode) {
            alert('Master Merge is only permissible while System Recovery Mode is ACTIVE.');
            return;
        }

        setConfirmDialog({
            open: true,
            title: 'Confirm Master Cluster Merge',
            message: 'CRITICAL: You are about to merge temporary student data into the specified main cluster URI. This operation is permanent.',
            variant: 'danger',
            confirmText: 'Execute Master Merge',
            onConfirm: async () => {
                setConfirmDialog(prev => ({ ...prev, open: false }));
                setMerging(true);
                showToast('Master merge initiated. Merging cluster records...', 'info');
                try {
                    const res = await api.post('/system/merge-clusters', { targetUri: status.targetClusterUri });
                    showToast(res.data.message || 'Cluster merge completed successfully!', 'success');
                    recordAuditLog('CLUSTER_MERGED', status.targetClusterUri, 'Merged temporary cluster into target cluster.');
                } catch (err) {
                    showToast('Merge process failed: ' + (err.response?.data?.message || err.message), 'error');
                } finally {
                    setMerging(false);
                }
            }
        });
    };

    const handleEmergencyOfflineToggle = () => {
        const nextState = !status.manualMaintenance;
        setConfirmDialog({
            open: true,
            title: nextState ? 'Confirm Emergency System Offline' : 'Bring Platform Online',
            message: nextState
                ? '⚠️ Taking the system offline will block student attendance check-ins and member access with a maintenance screen. Super Admin and Developers will maintain access. Proceed?'
                : 'Bring the platform back online for all authorized students and members?',
            variant: nextState ? 'danger' : 'primary',
            confirmText: nextState ? 'Take Offline Now' : 'Bring Online',
            onConfirm: async () => {
                setConfirmDialog(prev => ({ ...prev, open: false }));
                const updated = { ...status, manualMaintenance: nextState };
                setStatus(updated);
                await handleSaveConfig(updated);
                recordAuditLog(
                    nextState ? 'SYSTEM_TAKEN_OFFLINE' : 'SYSTEM_BROUGHT_ONLINE',
                    'Doulos Platform',
                    nextState ? 'Emergency offline triggered.' : 'Platform restored to operational.'
                );
            }
        });
    };

    // User Registration & Deletion
    const handleRegisterStaff = async (e) => {
        e.preventDefault();
        try {
            await api.post('/auth/register', {
                username: createForm.username.trim(),
                password: createForm.password.trim(),
                campus: createForm.campus,
                role: createForm.role
            });

            // If email or position was specified, update them
            if (createForm.email || createForm.position) {
                const refreshed = await api.get('/auth/users');
                const createdUser = refreshed.data.find(u => u.username.toLowerCase() === createForm.username.trim().toLowerCase());
                if (createdUser) {
                    await api.patch(`/auth/users/${createdUser._id}`, {
                        email: createForm.email,
                        position: createForm.position
                    });
                }
            }

            showToast(`Registered account "${createForm.username}" as ${createForm.role}.`, 'success');
            recordAuditLog('USER_CREATED', createForm.username, `Role: ${createForm.role}, Campus: ${createForm.campus}`);
            setIsCreateAccountOpen(false);
            setCreateForm({ username: '', password: '', campus: 'Athi River', role: 'admin', email: '', position: '' });
            fetchStaffList();
        } catch (err) {
            showToast('Registration failed: ' + (err.response?.data?.message || err.message), 'error');
        }
    };

    const handleDeleteStaff = (id, usernameToDelete) => {
        if (currentUsername.toLowerCase() === usernameToDelete.toLowerCase()) {
            showToast('Access Denied: You cannot delete your own logged-in account!', 'error');
            return;
        }

        setConfirmDialog({
            open: true,
            title: 'Delete Staff Account',
            message: `Are you sure you want to permanently delete the staff account "${usernameToDelete}"? This action cannot be reversed.`,
            variant: 'danger',
            confirmText: 'Delete Account',
            onConfirm: async () => {
                setConfirmDialog(prev => ({ ...prev, open: false }));
                try {
                    await api.delete(`/auth/users/${id}`);
                    showToast(`Staff account "${usernameToDelete}" deleted successfully.`, 'success');
                    recordAuditLog('USER_DELETED', usernameToDelete, 'Removed account from platform.');
                    fetchStaffList();
                } catch (err) {
                    showToast('Failed to delete staff account: ' + (err.response?.data?.message || err.message), 'error');
                }
            }
        });
    };

    const handleUpdateUserStatus = async (id, username, newStatus) => {
        try {
            await api.patch(`/auth/users/${id}/status`, { status: newStatus });
            showToast(`Account "${username}" status set to ${newStatus}.`, 'success');
            recordAuditLog('USER_STATUS_CHANGED', username, `Status changed to ${newStatus}`);
            fetchStaffList();
        } catch (err) {
            showToast('Failed to update status: ' + (err.response?.data?.message || err.message), 'error');
        }
    };

    // Account Invitation
    const handleSendInvitation = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/invitations', {
                email: inviteForm.email.trim(),
                role: inviteForm.role,
                position: inviteForm.position,
                campus: inviteForm.campus
            });
            showToast(res.data.message || 'Invitation created and dispatched!', 'success');
            recordAuditLog('USER_INVITED', inviteForm.email, `Role: ${inviteForm.role}, Position: ${inviteForm.position}`);
            setIsInviteModalOpen(false);
            setInviteForm({ email: '', role: 'admin', position: 'G1 — Student Coordinator', campus: 'All Campuses (Global)' });
            fetchInvitations();
        } catch (err) {
            showToast('Failed to send invitation: ' + (err.response?.data?.message || err.message), 'error');
        }
    };

    const handleRevokeInvitation = async (id, email) => {
        try {
            await api.post(`/auth/invitations/${id}/revoke`);
            showToast(`Revoked invitation for ${email}.`, 'success');
            recordAuditLog('INVITATION_REVOKED', email, 'Revoked pending invitation.');
            fetchInvitations();
        } catch (err) {
            showToast('Failed to revoke invitation: ' + (err.response?.data?.message || err.message), 'error');
        }
    };

    // Maintenance Scheduling
    const handleSaveSchedule = async (e) => {
        e.preventDefault();
        const startISO = new Date(`${scheduleForm.startDate}T${scheduleForm.startTime}`).toISOString();
        const endISO = new Date(`${scheduleForm.endDate}T${scheduleForm.endTime}`).toISOString();

        const schedulePayload = {
            start: startISO,
            end: endISO,
            reason: scheduleForm.reason,
            message: scheduleForm.message,
            affectedScope: scheduleForm.affectedScope,
            status: 'SCHEDULED',
            scheduledBy: currentUsername,
            scheduledAt: new Date().toISOString()
        };

        const updated = {
            ...status,
            maintenanceSchedule: schedulePayload
        };
        setStatus(updated);
        await handleSaveConfig(updated);
        setIsScheduleMaintenanceOpen(false);
        showToast('Maintenance scheduled successfully.', 'success');
        recordAuditLog('MAINTENANCE_SCHEDULED', 'System Downtime', `Scheduled for ${scheduleForm.startDate} ${scheduleForm.startTime}`);
    };

    const handleCancelSchedule = async () => {
        const updated = { ...status, maintenanceSchedule: null };
        setStatus(updated);
        await handleSaveConfig(updated);
        showToast('Scheduled maintenance window cancelled.', 'success');
        recordAuditLog('MAINTENANCE_CANCELLED', 'System Downtime', 'Cancelled scheduled maintenance.');
    };

    // Format helper for backups
    const formatBackupDate = (name) => {
        try {
            const clean = name.replace('snapshot_', '').replace('.json', '');
            const parts = clean.split('T');
            if (parts.length === 2) {
                const datePart = parts[0];
                const timePart = parts[1].replace(/-/g, ':');
                const d = new Date(`${datePart}T${timePart}Z`);
                if (!isNaN(d.getTime())) {
                    return d.toLocaleString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                        hour: '2-digit', minute: '2-digit', hour12: true
                    });
                }
            }
            return name;
        } catch (e) {
            return name;
        }
    };

    // Navigation Structure (Section 2 of Prompt)
    const navigationGroups = [
        {
            title: undefined,
            items: [
                { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }
            ]
        },
        {
            title: 'SYSTEM',
            items: [
                { id: 'system-health', label: 'System Health', icon: Activity },
                { id: 'maintenance', label: 'Maintenance & Downtime', icon: Clock },
                { id: 'observability', label: 'Observability', icon: Radio },
                { id: 'audit-log', label: 'Audit Log', icon: FileText }
            ]
        },
        {
            title: 'ACCESS & IDENTITY',
            items: [
                { id: 'users', label: 'Users', icon: Users, badge: staffList.length || undefined },
                { id: 'g9-leadership', label: 'G9 Leadership', icon: Award },
                { id: 'invitations', label: 'Invitations', icon: Mail, badge: invitations.filter(i => i.status === 'INVITED').length || undefined },
                { id: 'roles-permissions', label: 'Roles & Permissions', icon: ShieldCheck },
                { id: 'access-logs', label: 'Access Logs', icon: Key }
            ]
        },
        {
            title: 'DATA & RECOVERY',
            items: [
                { id: 'backups', label: 'Backups', icon: Database, badge: cloudBackups.length || undefined },
                { id: 'snapshots', label: 'Snapshots', icon: DownloadCloud },
                { id: 'restore', label: 'Restore', icon: RefreshCw },
                { id: 'cluster-db', label: 'Cluster / Database', icon: Server }
            ]
        },
        {
            title: 'COMMUNICATION',
            items: [
                { id: 'announcements', label: 'System Announcements', icon: Megaphone },
                { id: 'maintenance-notices', label: 'Maintenance Notices', icon: AlertTriangle },
                { id: 'notifications-config', label: 'Notifications', icon: Bell }
            ]
        },
        {
            title: 'CONFIGURATION',
            items: [
                { id: 'campuses', label: 'Campuses', icon: MapPin },
                { id: 'academic-years', label: 'Academic Years', icon: Calendar },
                { id: 'semesters', label: 'Semesters', icon: Bookmark },
                { id: 'system-settings', label: 'System Settings', icon: Sliders },
                { id: 'integrations', label: 'Integrations', icon: Cpu }
            ]
        },
        {
            title: 'SECURITY',
            items: [
                { id: 'security-events', label: 'Security Events', icon: ShieldAlert },
                { id: 'audit-trail', label: 'Audit Trail', icon: FileCheck },
                { id: 'developer-access', label: 'Developer Access', icon: Code }
            ]
        }
    ];

    // Filtered users for Users view
    const filteredUsers = useMemo(() => {
        return staffList.filter(u => {
            const matchesSearch = !userSearch ||
                u.username?.toLowerCase().includes(userSearch.toLowerCase()) ||
                u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
                u.campus?.toLowerCase().includes(userSearch.toLowerCase());
            const matchesRole = userRoleFilter === 'ALL' || u.role?.toLowerCase() === userRoleFilter.toLowerCase();
            return matchesSearch && matchesRole;
        });
    }, [staffList, userSearch, userRoleFilter]);

    // G9 Position Matching
    const g9Roster = useMemo(() => {
        return G9_POSITIONS.map(pos => {
            // Find user assigned to this post by position or matching username
            const assignedUser = staffList.find(u => {
                const p = (u.position || '').toLowerCase();
                const r = (u.role || '').toLowerCase();
                const un = (u.username || '').toLowerCase();
                const targetCode = pos.code.toLowerCase();
                return p.startsWith(targetCode) || r === targetCode || un === targetCode;
            });

            // Find pending invitation for this post
            const pendingInvite = invitations.find(i => {
                const p = (i.position || '').toLowerCase();
                return i.status === 'INVITED' && p.startsWith(pos.code.toLowerCase());
            });

            let accountStatus = 'UNASSIGNED';
            if (assignedUser) {
                accountStatus = assignedUser.status || 'ACTIVE';
            } else if (pendingInvite) {
                accountStatus = 'INVITED';
            }

            return {
                ...pos,
                user: assignedUser,
                invite: pendingInvite,
                status: accountStatus
            };
        });
    }, [staffList, invitations]);

    // Unauthorized Access Guard
    if (unauthorized) {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                <div style={{ maxWidth: '440px', width: '100%', backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '36px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', border: '1px solid #E2E8F0' }}>
                    <div style={{ width: '64px', height: '64px', backgroundColor: '#FEF2F2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
                        <ShieldAlert size={36} color="#EF4444" />
                    </div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>Super Admin Authorization Required</h2>
                    <p style={{ color: '#64748B', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '24px' }}>
                        The System Governance Command Centre requires an active Super Administrator or authorized Developer account.
                    </p>
                    <Button variant="primary" style={{ width: '100%' }} onClick={() => navigate('/admin')}>
                        Return to Admin Sign In
                    </Button>
                </div>
            </div>
        );
    }

    // Determine current platform maintenance status badge
    const platformStatusBadge = status.manualMaintenance
        ? { label: 'EMERGENCY OFFLINE', variant: 'danger' }
        : status.maintenanceSchedule?.status === 'MAINTENANCE'
        ? { label: 'IN MAINTENANCE', variant: 'warning' }
        : status.maintenanceSchedule
        ? { label: 'MAINTENANCE SCHEDULED', variant: 'warning' }
        : { label: 'OPERATIONAL', variant: 'success' };

    return (
        <AdminLayout
            navigation={navigationGroups}
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            onLogout={() => {
                localStorage.clear();
                navigate('/admin');
            }}
            user={{
                username: currentUsername,
                role: currentUserRole,
                campus: 'Global / Multi-Campus'
            }}
            searchPlaceholder="Search system resources, users, configs..."
        >
            {/* Toast Notifications */}
            {toastMessage && (
                <div style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 9999 }}>
                    <Toast
                        message={toastMessage.text}
                        variant={toastMessage.type === 'error' ? 'error' : toastMessage.type === 'info' ? 'info' : 'success'}
                        onClose={() => setToastMessage(null)}
                    />
                </div>
            )}

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={confirmDialog.open}
                title={confirmDialog.title}
                message={confirmDialog.message}
                variant={confirmDialog.variant}
                confirmText={confirmDialog.confirmText}
                onConfirm={confirmDialog.onConfirm}
                onCancel={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
            />

            {/* Main SuperAdmin Content Area */}
            <div style={{ padding: '24px 32px' }}>

                {/* Maintenance Offline Banner */}
                {status.manualMaintenance && (
                    <div style={{ marginBottom: '24px' }}>
                        <Alert
                            variant="error"
                            title="PLATFORM IS CURRENTLY OFFLINE (MAINTENANCE MODE)"
                            message="All student portals, check-in scanners, and standard member access are blocked by the maintenance screen. Super Admin and Developers maintain governance access."
                            action={
                                <Button size="sm" variant="danger" onClick={handleEmergencyOfflineToggle}>
                                    Bring System Online
                                </Button>
                            }
                        />
                    </div>
                )}

                {/* System Recovery Mode Banner */}
                {status.recoveryMode && (
                    <div style={{ marginBottom: '24px' }}>
                        <Alert
                            variant="warning"
                            title="SYSTEM RECOVERY MODE IS ACTIVE"
                            message="The platform is in High-Assurance Recovery State. Master cluster merge, emergency dump injection, and schema synchronization are unlocked."
                        />
                    </div>
                )}

                {/* ========================================================
                    VIEW 1: SUPER ADMIN COMMAND CENTRE (DASHBOARD)
                ======================================================== */}
                {activeTab === 'dashboard' && (
                    <div>
                        <PageHeader
                            title="System Command Centre"
                            subtitle={`Good morning, ${currentUsername} — Platform overview and system governance`}
                            actions={
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => {
                                            fetchStatus();
                                            fetchStaffList();
                                            fetchCloudBackups();
                                            showToast('Telemetry refreshed.', 'info');
                                        }}
                                    >
                                        <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh Telemetry
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="primary"
                                        icon={Plus}
                                        onClick={() => setIsCreateAccountOpen(true)}
                                    >
                                        Create Account
                                    </Button>
                                </div>
                            }
                        />

                        {/* Top KPI Cards (Section 3 of Prompt) */}
                        <div className="ds-stats-grid" style={{ marginBottom: '24px' }}>
                            <StatCard
                                title="SYSTEM STATUS"
                                value={status.manualMaintenance ? "Maintenance" : "Operational"}
                                icon={Activity}
                                color={status.manualMaintenance ? "danger" : "success"}
                                badge={platformStatusBadge.label}
                                badgeVariant={platformStatusBadge.variant}
                                description="Platform gateway & core APIs"
                            />
                            <StatCard
                                title="ACTIVE USERS"
                                value={status.activeUsers || staffList.length}
                                icon={Users}
                                color="primary"
                                description="Provisioned staff & leadership"
                            />
                            <StatCard
                                title="G9 ACCOUNTS"
                                value={`${status.g9Count || g9Roster.filter(g => g.status === 'ACTIVE').length} / 9`}
                                icon={Award}
                                color="purple"
                                description="Constitutional leadership seats"
                            />
                            <StatCard
                                title="SERVER HEALTH"
                                value={status.serverHealth?.server || "Operational"}
                                icon={Server}
                                color={status.dbConnected ? "success" : "warning"}
                                description={`Database: ${status.dbConnected ? "Connected" : "Degraded"}`}
                            />
                        </div>

                        {/* Section: System Health Checklist (Section 3 of Prompt) */}
                        <Card title="System Health & Infrastructure Verification" style={{ marginBottom: '24px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', padding: '8px 0' }}>
                                {[
                                    { name: 'Server Runtime', status: status.serverHealth?.server || 'Operational', healthy: true },
                                    { name: 'Database (MongoDB Atlas)', status: status.dbConnected ? 'Connected' : 'Degraded', healthy: status.dbConnected },
                                    { name: 'Authentication Engine', status: status.serverHealth?.auth || 'Operational', healthy: true },
                                    { name: 'Attendance & Geofencing', status: status.serverHealth?.attendance || 'Operational', healthy: true },
                                    { name: 'Background Workers & Cron', status: status.serverHealth?.workers || 'Operational', healthy: true }
                                ].map((srv, idx) => (
                                    <div key={idx} style={{
                                        padding: '16px',
                                        borderRadius: '12px',
                                        backgroundColor: '#F8FAFC',
                                        border: '1px solid #E2E8F0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                    }}>
                                        <div>
                                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B' }}>{srv.name}</div>
                                            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>{srv.status}</div>
                                        </div>
                                        <div style={{
                                            width: '10px',
                                            height: '10px',
                                            borderRadius: '50%',
                                            backgroundColor: srv.healthy ? '#16A34A' : '#DC2626',
                                            boxShadow: srv.healthy ? '0 0 8px rgba(22, 163, 74, 0.4)' : '0 0 8px rgba(220, 38, 38, 0.4)'
                                        }} />
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* Section: Quick Actions (Section 4 of Prompt) */}
                        <Card title="Administrative Quick Actions" style={{ marginBottom: '24px' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                                <Button
                                    variant="primary"
                                    icon={Plus}
                                    onClick={() => setIsCreateAccountOpen(true)}
                                >
                                    Create Account
                                </Button>
                                <Button
                                    variant="secondary"
                                    icon={Mail}
                                    onClick={() => setIsInviteModalOpen(true)}
                                >
                                    Invite G9 Leader
                                </Button>
                                <Button
                                    variant="secondary"
                                    icon={Clock}
                                    onClick={() => setIsScheduleMaintenanceOpen(true)}
                                >
                                    Schedule Maintenance
                                </Button>
                                <Button
                                    variant="secondary"
                                    icon={Zap}
                                    disabled={backingUp}
                                    onClick={handleManualBackup}
                                >
                                    {backingUp ? "Generating Backup..." : "Run Backup"}
                                </Button>
                                <Button
                                    variant="secondary"
                                    icon={Radio}
                                    onClick={() => setActiveTab('observability')}
                                >
                                    View System Errors
                                </Button>
                                <Button
                                    variant={status.manualMaintenance ? "success" : "danger"}
                                    icon={AlertTriangle}
                                    onClick={handleEmergencyOfflineToggle}
                                >
                                    {status.manualMaintenance ? "Bring Online" : "Take System Offline"}
                                </Button>
                            </div>
                        </Card>

                        {/* Grid: Recent Platform Audits & Cloud Backups */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                            {/* Cloud Backups Snapshot */}
                            <Card
                                title="Cloud Backup Registry"
                                headerAction={
                                    <Button size="xs" variant="secondary" onClick={() => setActiveTab('backups')}>
                                        View All ({cloudBackups.length})
                                    </Button>
                                }
                            >
                                {cloudBackups.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '32px 16px', color: '#64748B' }}>
                                        <Database size={32} style={{ margin: '0 auto 12px auto', opacity: 0.3 }} />
                                        <p style={{ margin: 0, fontSize: '0.85rem' }}>No cloud snapshots recorded yet.</p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {cloudBackups.slice(0, 4).map((backup, idx) => (
                                            <div key={idx} style={{
                                                padding: '12px 16px',
                                                borderRadius: '10px',
                                                backgroundColor: '#F8FAFC',
                                                border: '1px solid #E2E8F0',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between'
                                            }}>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0F172A' }}>
                                                        {formatBackupDate(backup.name)}
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748B', fontFamily: 'monospace' }}>
                                                        {backup.name} &bull; {backup.size ? `${(backup.size / 1024).toFixed(1)} KB` : 'N/A'}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <a
                                                        href={backup.downloadUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="ds-btn ds-btn-xs ds-btn-secondary"
                                                    >
                                                        Download
                                                    </a>
                                                    <Button
                                                        size="xs"
                                                        variant="danger"
                                                        onClick={() => handleRestoreCloudBackup(backup.name)}
                                                    >
                                                        Restore
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Card>

                            {/* Recent Governance Audits */}
                            <Card
                                title="Platform Audit Trail"
                                headerAction={
                                    <Button size="xs" variant="secondary" onClick={() => setActiveTab('audit-log')}>
                                        View Log ({auditLogs.length})
                                    </Button>
                                }
                            >
                                {auditLogs.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '32px 16px', color: '#64748B' }}>
                                        <FileCheck size={32} style={{ margin: '0 auto 12px auto', opacity: 0.3 }} />
                                        <p style={{ margin: 0, fontSize: '0.85rem' }}>No recent administrative audits.</p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {auditLogs.slice(0, 4).map((log, idx) => (
                                            <div key={idx} style={{
                                                padding: '12px 16px',
                                                borderRadius: '10px',
                                                backgroundColor: '#F8FAFC',
                                                border: '1px solid #E2E8F0',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between'
                                            }}>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0F172A' }}>
                                                        {log.action}
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                                                        {log.actor} &bull; {log.target || log.details || 'System'}
                                                    </div>
                                                </div>
                                                <StatusPill
                                                    label={new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    variant="neutral"
                                                    size="sm"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Card>
                        </div>
                    </div>
                )}

                {/* ========================================================
                    VIEW 2: SYSTEM HEALTH
                ======================================================== */}
                {activeTab === 'system-health' && (
                    <div>
                        <PageHeader
                            title="System Health & Infrastructure"
                            subtitle="Real-time availability, server performance, database connectivity, and telemetry"
                            actions={
                                <Button size="sm" variant="secondary" onClick={fetchStatus}>
                                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
                                </Button>
                            }
                        />

                        <div className="ds-stats-grid" style={{ marginBottom: '24px' }}>
                            <StatCard
                                title="NODE RUNTIME"
                                value="Online"
                                icon={Activity}
                                color="success"
                                description="Process uptime & memory active"
                            />
                            <StatCard
                                title="DATABASE ENGINE"
                                value={status.dbConnected ? "Connected" : "Degraded"}
                                icon={Database}
                                color={status.dbConnected ? "success" : "danger"}
                                description="MongoDB Atlas Cluster"
                            />
                            <StatCard
                                title="ACTIVE SESSIONS"
                                value={status.activeUsers || 0}
                                icon={Users}
                                color="primary"
                                description="Authenticated leadership"
                            />
                            <StatCard
                                title="RECOVERY MODE"
                                value={status.recoveryMode ? "ENABLED" : "STANDBY"}
                                icon={Shield}
                                color={status.recoveryMode ? "warning" : "neutral"}
                                description="High-assurance guardrails"
                            />
                        </div>

                        <Card title="Active Cluster Topology" style={{ marginBottom: '24px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Current Active Cluster</div>
                                        <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', marginTop: '4px' }}>
                                            {status.currentCluster || "MongoDB Cluster"}
                                        </div>
                                    </div>
                                    <StatusPill label={status.dbConnected ? "Connected" : "Disconnected"} variant={status.dbConnected ? "success" : "danger"} />
                                </div>

                                <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '8px' }}>
                                        Target Main Cluster URI (Bridge)
                                    </div>
                                    <textarea
                                        value={status.targetClusterUri || ''}
                                        onChange={(e) => setStatus({ ...status, targetClusterUri: e.target.value })}
                                        placeholder="mongodb+srv://..."
                                        className="ds-input"
                                        style={{ width: '100%', minHeight: '70px', fontFamily: 'monospace', fontSize: '0.8rem' }}
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                                        <Button size="sm" variant="primary" onClick={() => handleSaveConfig()}>
                                            Save Target Cluster URI
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* ========================================================
                    VIEW 3: MAINTENANCE & DOWNTIME (SECTION 13 OF PROMPT)
                ======================================================== */}
                {activeTab === 'maintenance' && (
                    <div>
                        <PageHeader
                            title="Maintenance & Downtime Governance"
                            subtitle="Schedule maintenance windows, take system offline in emergency, and configure recovery banners"
                            actions={
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        icon={Clock}
                                        onClick={() => setIsScheduleMaintenanceOpen(true)}
                                    >
                                        Schedule Maintenance
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant={status.manualMaintenance ? "success" : "danger"}
                                        icon={AlertTriangle}
                                        onClick={handleEmergencyOfflineToggle}
                                    >
                                        {status.manualMaintenance ? "Bring System Online" : "Take System Offline Now"}
                                    </Button>
                                </div>
                            }
                        />

                        {/* Status Card */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '24px' }}>
                            <Card title="Current Platform Status">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                                    <div style={{
                                        width: '48px', height: '48px', borderRadius: '12px',
                                        backgroundColor: status.manualMaintenance ? '#FEE2E2' : '#DCFCE7',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <Activity size={24} color={status.manualMaintenance ? '#DC2626' : '#16A34A'} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                                            {status.manualMaintenance ? "System Offline (Emergency)" : "Platform Operational"}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                                            {status.manualMaintenance
                                                ? "Student access blocked with 503 maintenance screen"
                                                : "All campus portals and check-in services normal"}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Recovery Mode Safeguard</span>
                                    <Button
                                        size="xs"
                                        variant={status.recoveryMode ? "warning" : "secondary"}
                                        onClick={() => {
                                            const updated = { ...status, recoveryMode: !status.recoveryMode };
                                            setStatus(updated);
                                            handleSaveConfig(updated);
                                        }}
                                    >
                                        {status.recoveryMode ? "Recovery Mode Active" : "Enable Recovery Mode"}
                                    </Button>
                                </div>
                            </Card>

                            <Card title="Active or Scheduled Maintenance Window">
                                {status.maintenanceSchedule ? (
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                            <div>
                                                <StatusPill label={status.maintenanceSchedule.status} variant="warning" size="sm" />
                                                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0F172A', marginTop: '6px' }}>
                                                    {status.maintenanceSchedule.reason || "Scheduled Platform Maintenance"}
                                                </div>
                                            </div>
                                            <Button size="xs" variant="secondary" onClick={handleCancelSchedule}>
                                                Cancel Schedule
                                            </Button>
                                        </div>

                                        <div style={{ fontSize: '0.8rem', color: '#475569', backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '8px', marginBottom: '12px', border: '1px solid #E2E8F0' }}>
                                            <div><strong>Starts:</strong> {new Date(status.maintenanceSchedule.start).toLocaleString()}</div>
                                            <div><strong>Ends:</strong> {new Date(status.maintenanceSchedule.end).toLocaleString()}</div>
                                            <div style={{ marginTop: '6px' }}><strong>Message:</strong> "{status.maintenanceSchedule.message}"</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '24px 16px', color: '#64748B' }}>
                                        <Clock size={32} style={{ margin: '0 auto 8px auto', opacity: 0.3 }} />
                                        <p style={{ margin: 0, fontSize: '0.85rem' }}>No upcoming maintenance scheduled.</p>
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            style={{ marginTop: '12px' }}
                                            onClick={() => setIsScheduleMaintenanceOpen(true)}
                                        >
                                            Schedule Window
                                        </Button>
                                    </div>
                                )}
                            </Card>
                        </div>
                    </div>
                )}

                {/* ========================================================
                    VIEW 4: OBSERVABILITY (SECTION 15 OF PROMPT)
                ======================================================== */}
                {activeTab === 'observability' && (
                    <div>
                        <PageHeader
                            title="Platform Observability"
                            subtitle="Telemetry, live check-in stream, QR rotation counter, and failure observatory"
                        />
                        <SystemObservabilityTab
                            api={api}
                            members={[]}
                            setMsg={(m) => showToast(m?.text || String(m), m?.type || 'info')}
                            currentSemester={branding?.currentSemester || "SEP-DEC 2026"}
                        />
                    </div>
                )}

                {/* ========================================================
                    VIEW 5: AUDIT LOG (SECTION 16 OF PROMPT)
                ======================================================== */}
                {activeTab === 'audit-log' && (
                    <div>
                        <PageHeader
                            title="System Audit Log"
                            subtitle="Immutable record of administrative operations, configurations, and recovery actions"
                            actions={
                                <Button size="sm" variant="secondary" onClick={fetchAuditLogs}>
                                    <RefreshCw size={14} className={loadingAuditLogs ? "animate-spin" : ""} /> Refresh Log
                                </Button>
                            }
                        />

                        <Card>
                            <DataTable
                                columns={[
                                    { header: 'TIMESTAMP', accessor: 'timestamp', render: (val) => new Date(val).toLocaleString() },
                                    { header: 'ACTOR', accessor: 'actor', render: (val) => <span style={{ fontWeight: 700 }}>{val}</span> },
                                    { header: 'ACTION', accessor: 'action', render: (val) => <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{val}</span> },
                                    { header: 'TARGET', accessor: 'target' },
                                    { header: 'DETAILS', accessor: 'details' },
                                    {
                                        header: 'RESULT', accessor: 'result', render: (val) => (
                                            <StatusPill
                                                label={val || 'SUCCESS'}
                                                variant={val === 'FAILURE' ? 'danger' : val === 'WARNING' ? 'warning' : 'success'}
                                                size="sm"
                                            />
                                        )
                                    }
                                ]}
                                data={auditLogs}
                                loading={loadingAuditLogs}
                                emptyMessage="No audit logs recorded yet."
                            />
                        </Card>
                    </div>
                )}

                {/* ========================================================
                    VIEW 6: USERS (SECTION 7 & 10 OF PROMPT)
                ======================================================== */}
                {activeTab === 'users' && (
                    <div>
                        <PageHeader
                            title="Platform User Management"
                            subtitle="Provisioned administrative, developer, and leadership accounts"
                            actions={
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <Button size="sm" variant="secondary" onClick={fetchStaffList}>
                                        <RefreshCw size={14} className={loadingStaff ? "animate-spin" : ""} /> Sync
                                    </Button>
                                    <Button size="sm" variant="primary" icon={Plus} onClick={() => setIsCreateAccountOpen(true)}>
                                        Create Account
                                    </Button>
                                </div>
                            }
                        />

                        {/* Search and Role Filter Bar */}
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '240px' }}>
                                <Input
                                    value={userSearch}
                                    onChange={(e) => setUserSearch(e.target.value)}
                                    placeholder="Search by username, email, campus..."
                                    icon={Search}
                                />
                            </div>
                            <div style={{ width: '180px' }}>
                                <Select
                                    value={userRoleFilter}
                                    onChange={(e) => setUserRoleFilter(e.target.value)}
                                    options={[
                                        { value: 'ALL', label: 'All Roles' },
                                        { value: 'superadmin', label: 'SuperAdmin' },
                                        { value: 'admin', label: 'Admin' },
                                        { value: 'developer', label: 'Developer' }
                                    ]}
                                />
                            </div>
                        </div>

                        <Card>
                            <DataTable
                                columns={[
                                    {
                                        header: 'ACCOUNT',
                                        accessor: 'username',
                                        render: (val, row) => (
                                            <div>
                                                <div style={{ fontWeight: 800, color: '#0F172A' }}>{val}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{row.email || 'No email attached'}</div>
                                            </div>
                                        )
                                    },
                                    { header: 'CAMPUS JURISDICTION', accessor: 'campus' },
                                    {
                                        header: 'ROLE',
                                        accessor: 'role',
                                        render: (val) => (
                                            <StatusPill
                                                label={val.toUpperCase()}
                                                variant={val === 'superadmin' ? 'purple' : val === 'developer' ? 'info' : 'primary'}
                                                size="sm"
                                            />
                                        )
                                    },
                                    {
                                        header: 'STATUS',
                                        accessor: 'status',
                                        render: (val, row) => {
                                            const currentStatus = val || 'ACTIVE';
                                            const isProtected = ['superadmin', 'supersuperadmin'].includes(row.username.toLowerCase()) || row.role === 'superadmin';
                                            return (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <StatusPill
                                                        label={currentStatus}
                                                        variant={currentStatus === 'ACTIVE' ? 'success' : currentStatus === 'SUSPENDED' ? 'warning' : 'danger'}
                                                        size="sm"
                                                    />
                                                    {!isProtected && (
                                                        <select
                                                            value={currentStatus}
                                                            onChange={(e) => handleUpdateUserStatus(row._id, row.username, e.target.value)}
                                                            className="ds-input"
                                                            style={{ fontSize: '0.75rem', padding: '4px 8px', height: '28px' }}
                                                        >
                                                            <option value="ACTIVE">ACTIVE</option>
                                                            <option value="SUSPENDED">SUSPENDED</option>
                                                            <option value="DISABLED">DISABLED</option>
                                                        </select>
                                                    )}
                                                </div>
                                            );
                                        }
                                    },
                                    {
                                        header: 'LAST LOGIN',
                                        accessor: 'lastLogin',
                                        render: (val) => val ? new Date(val).toLocaleDateString() : 'Never'
                                    },
                                    {
                                        header: 'ACTIONS',
                                        accessor: '_id',
                                        align: 'right',
                                        render: (id, row) => {
                                            const isProtected = ['superadmin', 'supersuperadmin'].includes(row.username.toLowerCase()) || row.role === 'superadmin';
                                            return (
                                                <Button
                                                    size="xs"
                                                    variant="danger"
                                                    disabled={isProtected}
                                                    onClick={() => handleDeleteStaff(id, row.username)}
                                                >
                                                    {isProtected ? 'PROTECTED' : 'Delete'}
                                                </Button>
                                            );
                                        }
                                    }
                                ]}
                                data={filteredUsers}
                                loading={loadingStaff}
                                emptyMessage="No users matching filter criteria."
                            />
                        </Card>
                    </div>
                )}

                {/* ========================================================
                    VIEW 7: G9 LEADERSHIP PROVISIONING (SECTION 8 OF PROMPT)
                ======================================================== */}
                {activeTab === 'g9-leadership' && (
                    <div>
                        <PageHeader
                            title="G9 Constitutional Leadership Governance"
                            subtitle="Provisioning and account management for the nine constitutional G-Council positions"
                            actions={
                                <Button size="sm" variant="primary" icon={Mail} onClick={() => setIsInviteModalOpen(true)}>
                                    Invite G9 Leader
                                </Button>
                            }
                        />

                        <Card title="The Nine Constitutional Seats">
                            <DataTable
                                columns={[
                                    {
                                        header: 'POSITION / SEAT',
                                        accessor: 'code',
                                        render: (code, row) => (
                                            <div>
                                                <div style={{ fontWeight: 800, color: '#0F172A' }}>{code} — {row.title}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Scope: {row.defaultScope}</div>
                                            </div>
                                        )
                                    },
                                    {
                                        header: 'ASSIGNED USER',
                                        accessor: 'user',
                                        render: (user, row) => {
                                            if (user) {
                                                return (
                                                    <div>
                                                        <div style={{ fontWeight: 700, color: '#0F172A' }}>{user.username}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{user.email || 'No email registered'}</div>
                                                    </div>
                                                );
                                            }
                                            if (row.invite) {
                                                return (
                                                    <div>
                                                        <span style={{ color: '#D97706', fontWeight: 600, fontSize: '0.85rem' }}>Invited: {row.invite.email}</span>
                                                    </div>
                                                );
                                            }
                                            return <span style={{ color: '#94A3B8', fontStyle: 'italic', fontSize: '0.85rem' }}>Unassigned</span>;
                                        }
                                    },
                                    {
                                        header: 'ACCOUNT STATUS',
                                        accessor: 'status',
                                        render: (status) => (
                                            <StatusPill
                                                label={status}
                                                variant={status === 'ACTIVE' ? 'success' : status === 'INVITED' ? 'warning' : status === 'SUSPENDED' ? 'danger' : 'neutral'}
                                                size="sm"
                                            />
                                        )
                                    },
                                    {
                                        header: 'LAST LOGIN',
                                        accessor: 'user',
                                        render: (user) => user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : '—'
                                    },
                                    {
                                        header: 'ACTIONS',
                                        accessor: 'code',
                                        align: 'right',
                                        render: (code, row) => (
                                            <Button
                                                size="xs"
                                                variant="secondary"
                                                onClick={() => {
                                                    setInviteForm({
                                                        email: '',
                                                        role: 'admin',
                                                        position: `${row.code} — ${row.title}`,
                                                        campus: row.defaultScope.includes('Athi') ? 'Athi River' : row.defaultScope.includes('Valley') ? 'Valley Road' : 'All Campuses (Global)'
                                                    });
                                                    setIsInviteModalOpen(true);
                                                }}
                                            >
                                                {row.status === 'UNASSIGNED' ? 'Provision / Invite' : 'Reassign / Reinvite'}
                                            </Button>
                                        )
                                    }
                                ]}
                                data={g9Roster}
                            />
                        </Card>
                    </div>
                )}

                {/* ========================================================
                    VIEW 8: INVITATIONS (SECTION 9 OF PROMPT)
                ======================================================== */}
                {activeTab === 'invitations' && (
                    <div>
                        <PageHeader
                            title="Account Invitations"
                            subtitle="Secure email invitations for platform leadership and administrators"
                            actions={
                                <Button size="sm" variant="primary" icon={Plus} onClick={() => setIsInviteModalOpen(true)}>
                                    Send New Invitation
                                </Button>
                            }
                        />

                        <Card>
                            <DataTable
                                columns={[
                                    { header: 'RECIPIENT EMAIL', accessor: 'email', render: (val) => <span style={{ fontWeight: 700 }}>{val}</span> },
                                    { header: 'POSITION / SCOPE', accessor: 'position', render: (val, row) => `${val || 'Admin'} (${row.campus})` },
                                    { header: 'ROLE', accessor: 'role', render: (val) => <StatusPill label={val.toUpperCase()} variant="primary" size="sm" /> },
                                    {
                                        header: 'STATUS',
                                        accessor: 'status',
                                        render: (val) => (
                                            <StatusPill
                                                label={val}
                                                variant={val === 'ACCEPTED' ? 'success' : val === 'INVITED' ? 'warning' : 'danger'}
                                                size="sm"
                                            />
                                        )
                                    },
                                    { header: 'EXPIRES', accessor: 'expiresAt', render: (val) => new Date(val).toLocaleDateString() },
                                    {
                                        header: 'ACTIONS',
                                        accessor: '_id',
                                        align: 'right',
                                        render: (id, row) => (
                                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                                {row.status === 'INVITED' && (
                                                    <>
                                                        <Button
                                                            size="xs"
                                                            variant="secondary"
                                                            icon={Copy}
                                                            onClick={() => {
                                                                const link = `${window.location.origin}/accept-invite/${row.token}`;
                                                                navigator.clipboard.writeText(link);
                                                                showToast('Invitation link copied to clipboard.', 'info');
                                                            }}
                                                        >
                                                            Copy Link
                                                        </Button>
                                                        <Button
                                                            size="xs"
                                                            variant="danger"
                                                            onClick={() => handleRevokeInvitation(id, row.email)}
                                                        >
                                                            Revoke
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        )
                                    }
                                ]}
                                data={invitations}
                                loading={loadingInvitations}
                                emptyMessage="No invitations created yet."
                            />
                        </Card>
                    </div>
                )}

                {/* ========================================================
                    VIEW 9: DATA & RECOVERY / BACKUPS / RESTORE / CLUSTER
                    (SECTION 17 & 18 OF PROMPT - 100% PRESERVED)
                ======================================================== */}
                {['backups', 'snapshots', 'restore', 'cluster-db'].includes(activeTab) && (
                    <div>
                        <PageHeader
                            title="Data & Disaster Recovery Governance"
                            subtitle="Preserved database snapshot engine, automated cloud backups, and cluster bridges"
                            actions={
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={fetchCloudBackups}
                                    >
                                        <RefreshCw size={14} className={loadingBackups ? "animate-spin" : ""} /> Sync Backups
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="primary"
                                        icon={Zap}
                                        disabled={backingUp}
                                        onClick={handleManualBackup}
                                    >
                                        {backingUp ? "Generating..." : "Run Cloud Backup"}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        icon={DownloadCloud}
                                        onClick={handleDownloadBackup}
                                    >
                                        Download Snapshot (.JSON)
                                    </Button>
                                </div>
                            }
                        />

                        {/* Subtabs Header */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
                            {[
                                { id: 'backups', label: 'Cloud Backups', icon: Database },
                                { id: 'snapshots', label: 'Snapshot Management', icon: DownloadCloud },
                                { id: 'restore', label: 'Restore Center', icon: RefreshCw },
                                { id: 'cluster-db', label: 'Cluster & Master Merge', icon: Server }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`ds-btn ds-btn-sm ${activeTab === tab.id ? 'ds-btn-primary' : 'ds-btn-secondary'}`}
                                >
                                    <tab.icon size={14} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Backups Subview */}
                        {activeTab === 'backups' && (
                            <Card title="Cloud Backup Registry">
                                <DataTable
                                    columns={[
                                        { header: 'DATE & TIME', accessor: 'name', render: (val) => formatBackupDate(val) },
                                        { header: 'SNAPSHOT FILE', accessor: 'name', render: (val) => <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{val}</span> },
                                        { header: 'FILE SIZE', accessor: 'size', render: (val) => val ? `${(val / 1024).toFixed(1)} KB` : 'N/A' },
                                        {
                                            header: 'ACTIONS',
                                            accessor: 'name',
                                            align: 'right',
                                            render: (name, row) => (
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                    <a
                                                        href={row.downloadUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="ds-btn ds-btn-xs ds-btn-secondary"
                                                    >
                                                        Download
                                                    </a>
                                                    <Button
                                                        size="xs"
                                                        variant="danger"
                                                        onClick={() => handleRestoreCloudBackup(name)}
                                                    >
                                                        Restore Snapshot
                                                    </Button>
                                                </div>
                                            )
                                        }
                                    ]}
                                    data={cloudBackups}
                                    loading={loadingBackups}
                                    emptyMessage="No cloud backups found."
                                />
                            </Card>
                        )}

                        {/* Snapshots Subview */}
                        {activeTab === 'snapshots' && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                                <Card title="Export Platform Snapshot">
                                    <p style={{ color: '#64748B', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '20px' }}>
                                        Exports a full JSON registry dump of members, attendance check-ins, meetings, and system configurations directly to your local PC.
                                    </p>
                                    <Button variant="primary" icon={DownloadCloud} onClick={handleDownloadBackup}>
                                        Download Full Snapshot (.JSON)
                                    </Button>
                                </Card>

                                <Card title="Upload & Inject Local Snapshot">
                                    <p style={{ color: '#64748B', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '20px' }}>
                                        Upload a previously exported `.json` snapshot file to completely recover the database. Requires double confirmation.
                                    </p>
                                    <input
                                        type="file"
                                        id="superadmin-db-file-upload"
                                        accept=".json"
                                        onChange={handleRestoreLocalFile}
                                        style={{ display: 'none' }}
                                    />
                                    <Button
                                        variant="danger"
                                        icon={UploadCloud}
                                        onClick={() => document.getElementById('superadmin-db-file-upload').click()}
                                    >
                                        Select & Restore Local .JSON File
                                    </Button>
                                </Card>
                            </div>
                        )}

                        {/* Restore Center Subview */}
                        {activeTab === 'restore' && (
                            <Card title="Restoration Safety Governance">
                                <Alert
                                    variant="warning"
                                    title="Restoration Safety Rules"
                                    message="Restoring from a snapshot replaces existing active records with snapshot contents. All restoration actions are auditable and strictly restricted to Super Administrators and Developers."
                                />
                                <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                                        <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 800 }}>Cloud Snapshot Restore</h4>
                                        <p style={{ margin: '0 0 12px 0', fontSize: '0.8rem', color: '#64748B' }}>
                                            Select any registered GitHub cloud snapshot from the Backups tab to restore into the database.
                                        </p>
                                        <Button size="sm" variant="secondary" onClick={() => setActiveTab('backups')}>
                                            Go to Cloud Backups ({cloudBackups.length})
                                        </Button>
                                    </div>

                                    <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                                        <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 800 }}>Local JSON Restore</h4>
                                        <p style={{ margin: '0 0 12px 0', fontSize: '0.8rem', color: '#64748B' }}>
                                            Restore from an offline JSON backup on your machine.
                                        </p>
                                        <Button size="sm" variant="danger" onClick={() => document.getElementById('superadmin-db-file-upload').click()}>
                                            Upload Snapshot File
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* Cluster & Master Merge Subview */}
                        {activeTab === 'cluster-db' && (
                            <Card title="Cluster Bridge & Master Merge">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                            Target Main Cluster MongoDB URI
                                        </label>
                                        <textarea
                                            value={status.targetClusterUri}
                                            onChange={(e) => setStatus({ ...status, targetClusterUri: e.target.value })}
                                            placeholder="mongodb+srv://..."
                                            className="ds-input"
                                            style={{ width: '100%', minHeight: '80px', fontFamily: 'monospace', fontSize: '0.8rem' }}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                                        <div>
                                            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F172A' }}>System Recovery Mode</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Master Merge can only execute while Recovery Mode is active.</div>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant={status.recoveryMode ? "warning" : "secondary"}
                                            onClick={() => {
                                                const updated = { ...status, recoveryMode: !status.recoveryMode };
                                                setStatus(updated);
                                                handleSaveConfig(updated);
                                            }}
                                        >
                                            {status.recoveryMode ? "Active" : "Disabled"}
                                        </Button>
                                    </div>

                                    <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Button size="sm" variant="secondary" onClick={() => handleSaveConfig()}>
                                            Save Configuration
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="danger"
                                            disabled={merging || !status.recoveryMode}
                                            onClick={handleRunMerge}
                                        >
                                            {merging ? "Executing Merge..." : "Start Master Sync & Merge"}
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>
                )}

                {/* ========================================================
                    VIEW 10: CONFIGURATION (SECTION 19 OF PROMPT)
                ======================================================== */}
                {['campuses', 'academic-years', 'semesters', 'system-settings', 'integrations'].includes(activeTab) && (
                    <div>
                        <PageHeader
                            title="Platform Configuration"
                            subtitle="Manage campuses, academic calendars, semester themes, and core integrations"
                        />

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
                            <Card title="Current Semester & Branding">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ padding: '12px 16px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>ACTIVE SEMESTER</div>
                                        <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                                            {branding?.currentSemester || "SEP-DEC 2026"}
                                        </div>
                                    </div>
                                    <div style={{ padding: '12px 16px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>SEMESTER THEME</div>
                                        <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1D4ED8', marginTop: '2px' }}>
                                            "{branding?.semesterTheme || "True Friendship"}"
                                        </div>
                                    </div>
                                    <div style={{ padding: '12px 16px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>THEME VERSE</div>
                                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#475569', marginTop: '2px' }}>
                                            {branding?.semesterVerse || "John 15:12-15"}
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <Card title="Constitutional Campus Jurisdictions">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {[
                                        { name: 'Athi River Campus', code: 'MAIN', members: 'Primary Operations' },
                                        { name: 'Valley Road Campus (Nairobi)', code: 'VR', members: 'Town Campus' },
                                        { name: 'Both Campuses (Global)', code: 'ALL', members: 'Executive Jurisdiction' }
                                    ].map((camp, idx) => (
                                        <div key={idx} style={{ padding: '12px 16px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F172A' }}>{camp.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{camp.members}</div>
                                            </div>
                                            <StatusPill label={camp.code} variant="primary" size="sm" />
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {/* ========================================================
                    VIEW 11: SECURITY & DEVELOPER ACCESS (SECTION 12 & 25)
                ======================================================== */}
                {['security-events', 'audit-trail', 'developer-access'].includes(activeTab) && (
                    <div>
                        <PageHeader
                            title="Security & Developer Access Policy"
                            subtitle="Role isolation, technical access boundaries, and sensitive data protections"
                        />

                        <Card title="Developer Access Safeguard Policy" style={{ marginBottom: '24px' }}>
                            <Alert
                                variant="info"
                                title="Constitutional Protection of Pastoral and Private Ministry Data"
                                message="The Developer role is strictly technical. Developers have access to system observability, server health, error diagnostics, and platform metadata, but do NOT automatically receive access to private spiritual reflections, prayers, pastoral notes, care requests, or financial records."
                            />

                            <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                                <div style={{ padding: '16px', backgroundColor: '#F0FDF4', borderRadius: '10px', border: '1px solid #BBF7D0' }}>
                                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#166534', marginBottom: '8px' }}>
                                        ✓ DEVELOPER AUTHORIZED ACCESS
                                    </div>
                                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: '#15803D', lineHeight: 1.6 }}>
                                        <li>System Health Telemetry (CPU, RAM, Uptime)</li>
                                        <li>Observability & Failure Streams</li>
                                        <li>System Error Logs & QR Rotation</li>
                                        <li>Maintenance Windows & Technical Config</li>
                                        <li>Database Connection Diagnostics</li>
                                    </ul>
                                </div>

                                <div style={{ padding: '16px', backgroundColor: '#FEF2F2', borderRadius: '10px', border: '1px solid #FECACA' }}>
                                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#991B1B', marginBottom: '8px' }}>
                                        ✕ DEVELOPER RESTRICTED DOMAINS
                                    </div>
                                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: '#B91C1C', lineHeight: 1.6 }}>
                                        <li>Private Spiritual Reflections & Prayers</li>
                                        <li>Pastoral Care & Counseling Records</li>
                                        <li>Disciplinary Directorate Dossiers</li>
                                        <li>Financial Ledgers & Requisition Details</li>
                                        <li>Confidential Leadership Evaluations</li>
                                    </ul>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* ========================================================
                    VIEW 12: COMMUNICATION (SECTION 20 OF PROMPT)
                ======================================================== */}
                {['announcements', 'maintenance-notices', 'notifications-config'].includes(activeTab) && (
                    <div>
                        <PageHeader
                            title="System Communication Centre"
                            subtitle="Platform-wide announcements, maintenance notice banners, and dispatch configurations"
                        />

                        <Card title="System Announcements">
                            <p style={{ color: '#64748B', fontSize: '0.85rem' }}>
                                Announcements broadcast from the Super Admin appear on member and leader portals.
                            </p>
                            <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', marginTop: '16px' }}>
                                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F172A' }}>System Announcement Dispatch</div>
                                <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '4px' }}>
                                    Connected to Doulos broadcast notification worker.
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

            </div>

            {/* ========================================================
                MODAL 1: CREATE ACCOUNT (STAFF / SUPERADMIN)
            ======================================================== */}
            <Modal
                isOpen={isCreateAccountOpen}
                onClose={() => setIsCreateAccountOpen(false)}
                title="Create Platform Account"
                subtitle="Direct provisioning with initial credentials"
            >
                <form onSubmit={handleRegisterStaff} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <FormGroup label="Username" required>
                        <Input
                            value={createForm.username}
                            onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                            placeholder="e.g. jdoe"
                            required
                        />
                    </FormGroup>

                    <FormGroup label="Password" required>
                        <Input
                            type="password"
                            value={createForm.password}
                            onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                            placeholder="Initial password"
                            required
                        />
                    </FormGroup>

                    <FormGroup label="Email Address">
                        <Input
                            type="email"
                            value={createForm.email}
                            onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                            placeholder="user@daystar.ac.ke"
                        />
                    </FormGroup>

                    <FormGroup label="Campus Jurisdiction">
                        <Select
                            value={createForm.campus}
                            onChange={(e) => setCreateForm({ ...createForm, campus: e.target.value })}
                            options={[
                                { value: 'Athi River', label: 'Athi River Campus' },
                                { value: 'Valley Road', label: 'Valley Road Campus' },
                                { value: 'All', label: 'All Campuses (Global)' }
                            ]}
                        />
                    </FormGroup>

                    <FormGroup label="System Role">
                        <Select
                            value={createForm.role}
                            onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                            options={[
                                { value: 'admin', label: 'Admin (Council / Staff)' },
                                { value: 'superadmin', label: 'SuperAdmin' },
                                { value: 'developer', label: 'Developer (Technical Observability)' }
                            ]}
                        />
                    </FormGroup>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                        <Button type="button" variant="secondary" onClick={() => setIsCreateAccountOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary">
                            Create Account
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* ========================================================
                MODAL 2: INVITE ACCOUNT / G9 LEADER (EMAIL ONBOARDING)
            ======================================================== */}
            <Modal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                title="Send Secure Account Invitation"
                subtitle="User will receive an email to securely set their password"
            >
                <form onSubmit={handleSendInvitation} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <FormGroup label="Recipient Email Address" required>
                        <Input
                            type="email"
                            value={inviteForm.email}
                            onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                            placeholder="leader@daystar.ac.ke"
                            required
                        />
                    </FormGroup>

                    <FormGroup label="Position / Office" required>
                        <Select
                            value={inviteForm.position}
                            onChange={(e) => setInviteForm({ ...inviteForm, position: e.target.value })}
                            options={G9_POSITIONS.map(p => ({
                                value: `${p.code} — ${p.title}`,
                                label: `${p.code} — ${p.title}`
                            })).concat([
                                { value: 'Admin (Operations)', label: 'Admin (Operations)' },
                                { value: 'Developer', label: 'Developer (Technical)' },
                                { value: 'SuperAdmin', label: 'SuperAdmin' }
                            ])}
                        />
                    </FormGroup>

                    <FormGroup label="Campus / Jurisdiction">
                        <Select
                            value={inviteForm.campus}
                            onChange={(e) => setInviteForm({ ...inviteForm, campus: e.target.value })}
                            options={[
                                { value: 'All Campuses (Global)', label: 'All Campuses (Global)' },
                                { value: 'Athi River', label: 'Athi River Campus' },
                                { value: 'Valley Road', label: 'Valley Road Campus' }
                            ]}
                        />
                    </FormGroup>

                    <FormGroup label="Platform Role">
                        <Select
                            value={inviteForm.role}
                            onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                            options={[
                                { value: 'admin', label: 'Admin' },
                                { value: 'superadmin', label: 'SuperAdmin' },
                                { value: 'developer', label: 'Developer' }
                            ]}
                        />
                    </FormGroup>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                        <Button type="button" variant="secondary" onClick={() => setIsInviteModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" icon={Mail}>
                            Dispatch Invitation
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* ========================================================
                MODAL 3: SCHEDULE MAINTENANCE
            ======================================================== */}
            <Modal
                isOpen={isScheduleMaintenanceOpen}
                onClose={() => setIsScheduleMaintenanceOpen(false)}
                title="Schedule System Maintenance Window"
                subtitle="Users will receive a notice banner prior to the maintenance window"
            >
                <form onSubmit={handleSaveSchedule} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <FormGroup label="Start Date" required>
                            <Input
                                type="date"
                                value={scheduleForm.startDate}
                                onChange={(e) => setScheduleForm({ ...scheduleForm, startDate: e.target.value })}
                                required
                            />
                        </FormGroup>
                        <FormGroup label="Start Time" required>
                            <Input
                                type="time"
                                value={scheduleForm.startTime}
                                onChange={(e) => setScheduleForm({ ...scheduleForm, startTime: e.target.value })}
                                required
                            />
                        </FormGroup>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <FormGroup label="End Date" required>
                            <Input
                                type="date"
                                value={scheduleForm.endDate}
                                onChange={(e) => setScheduleForm({ ...scheduleForm, endDate: e.target.value })}
                                required
                            />
                        </FormGroup>
                        <FormGroup label="End Time" required>
                            <Input
                                type="time"
                                value={scheduleForm.endTime}
                                onChange={(e) => setScheduleForm({ ...scheduleForm, endTime: e.target.value })}
                                required
                            />
                        </FormGroup>
                    </div>

                    <FormGroup label="Maintenance Reason" required>
                        <Input
                            value={scheduleForm.reason}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, reason: e.target.value })}
                            placeholder="e.g. Database cluster upgrade"
                            required
                        />
                    </FormGroup>

                    <FormGroup label="User Notice Message" required>
                        <textarea
                            value={scheduleForm.message}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, message: e.target.value })}
                            className="ds-input"
                            style={{ width: '100%', minHeight: '60px' }}
                            required
                        />
                    </FormGroup>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                        <Button type="button" variant="secondary" onClick={() => setIsScheduleMaintenanceOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary">
                            Save Schedule
                        </Button>
                    </div>
                </form>
            </Modal>

        </AdminLayout>
    );
};

export default SuperAdmin;
