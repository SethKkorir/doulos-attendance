import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    Search, Filter, Plus, Download, Upload, UserPlus, Eye, Pencil, 
    Trash2, ExternalLink, Shield, CheckCircle, RefreshCw, X
} from 'lucide-react';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';

import StatusPill from '../common/StatusPill';
import RankBadge from '../common/RankBadge';
import { PrimaryButton, OutlineButton, DarkActionButton } from '../common/Buttons';
import DataTable from '../common/DataTable';
import FilterPanel from '../common/FilterPanel';
import AddRecruitModal from '../common/AddRecruitModal';

export default function MembersTab({
    members = [],
    loadingMembers = false,
    userRole = 'admin',
    isGuest = false,
    fetchMembers,
    setMsg,
    currentSemester = 'MAY-AUG 2026',
    api,
    admins = [],
    fetchAdmins
}) {
    // Active Sub-tab beneath title: 'members' (Douloids & Recruits) | 'admins' (G-Council)
    const [subTab, setSubTab] = useState('members');

    // Search and filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [campusFilter, setCampusFilter] = useState('All');
    const [rankFilter, setRankFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [showAllSemesters, setShowAllSemesters] = useState(false);

    // Modals
    const [isAddRecruitOpen, setIsAddRecruitOpen] = useState(false);
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [viewingMember, setViewingMember] = useState(null);
    const [importLoading, setImportLoading] = useState(false);

    const fileInputRef = useRef(null);

    // Initial fetch on semester scope toggle
    useEffect(() => {
        if (fetchMembers) {
            fetchMembers({ activeThisSemester: !showAllSemesters });
        }
    }, [showAllSemesters]);

    // Derived statistics
    const totalDouloids = useMemo(() => {
        return members.filter(m => m.memberType === 'Douloid' || m.memberType === 'Recruit').length;
    }, [members]);

    const activeThisSemester = useMemo(() => {
        return members.filter(m => m.status === 'Active').length;
    }, [members]);

    // Filtered members list
    const filteredMembers = useMemo(() => {
        return members.filter(m => {
            const query = searchTerm.toLowerCase().trim();
            const matchesSearch = !query || 
                (m.name && m.name.toLowerCase().includes(query)) ||
                (m.studentRegNo && m.studentRegNo.toLowerCase().includes(query)) ||
                (m.phone && m.phone.toLowerCase().includes(query)) ||
                (m.email && m.email.toLowerCase().includes(query));

            const matchesCampus = campusFilter === 'All' || m.campus === campusFilter;
            
            const matchesRank = rankFilter === 'All' || 
                (rankFilter === 'None' ? (!m.douloidRank || m.douloidRank === 'None') : m.douloidRank === rankFilter);

            const matchesStatus = statusFilter === 'All' || 
                (statusFilter === 'Recruit' ? m.memberType === 'Recruit' : m.status === statusFilter);

            return matchesSearch && matchesCampus && matchesRank && matchesStatus;
        });
    }, [members, searchTerm, campusFilter, rankFilter, statusFilter]);

    // Handle instant add recruit callback without page reload
    const handleRecruitAdded = (newMember) => {
        if (fetchMembers) fetchMembers({ activeThisSemester: !showAllSemesters });
    };

    // Real Excel Export conforming to Article 3(8) Register Requirement
    const handleExportExcel = () => {
        try {
            if (filteredMembers.length === 0) {
                setMsg?.({ type: 'error', text: 'No members available to export with current filters.' });
                return;
            }

            const exportData = filteredMembers.map(m => ({
                'Full Name': m.name || 'Unknown',
                'Admission Number': m.studentRegNo || '',
                'Campus': m.campus || 'Athi River',
                'Mobile / Phone': m.phone || m.squadLeaderPhone || 'N/A',
                'Email': m.email || 'N/A',
                'Cadre Rank': m.douloidRank || 'None',
                'Belay Permission': m.belayStatus || 'Not Permitted',
                'Membership Tier': m.memberType || 'Visitor',
                'Status': m.status || 'Active',
                'Total Points': m.totalPoints || 0,
                'Active Semester': m.lastActiveSemester || currentSemester
            }));

            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Member Register');

            // Set column widths
            worksheet['!cols'] = [
                { wch: 22 }, // Name
                { wch: 18 }, // Adm No
                { wch: 14 }, // Campus
                { wch: 18 }, // Mobile
                { wch: 22 }, // Email
                { wch: 20 }, // Cadre Rank
                { wch: 22 }, // Belay
                { wch: 16 }, // Tier
                { wch: 12 }, // Status
                { wch: 14 }, // Points
                { wch: 18 }  // Semester
            ];

            const fileName = `Doulos_Member_Register_Article_3_8_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(workbook, fileName);
            setMsg?.({ type: 'success', text: `Downloaded register as ${fileName} 📊` });
        } catch (err) {
            console.error('Failed to export Excel:', err);
            setMsg?.({ type: 'error', text: 'Failed to generate Excel register.' });
        }
    };

    // Bulk File Importer (Excel, CSV, Word, PDF)
    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (isGuest) {
            setMsg?.({ type: 'error', text: 'Import is disabled in Guest Mode.' });
            return;
        }

        setImportLoading(true);
        const ext = file.name.split('.').pop()?.toLowerCase();

        try {
            if (['xlsx', 'xls', 'csv'].includes(ext)) {
                const reader = new FileReader();
                reader.onload = async (evt) => {
                    try {
                        const bstr = evt.target?.result;
                        const wb = XLSX.read(bstr, { type: 'binary' });
                        const ws = wb.Sheets[wb.SheetNames[0]];
                        const rows = XLSX.utils.sheet_to_json(ws);
                        
                        const parsed = rows.map(r => {
                            const name = r['Full Name'] || r['Name'] || r['name'] || r['studentName'];
                            const reg = r['Admission Number'] || r['Adm No'] || r['studentRegNo'] || r['regNo'];
                            if (!name || !reg) return null;
                            return {
                                name: String(name).trim(),
                                studentRegNo: String(reg).trim().toUpperCase(),
                                campus: r['Campus'] || 'Athi River',
                                memberType: r['Category'] || r['Membership Tier'] || 'Recruit',
                                phone: r['Phone'] || r['Mobile'] || '',
                                email: r['Email'] || ''
                            };
                        }).filter(Boolean);

                        if (parsed.length > 0) {
                            await api.post('/members/import', { members: parsed });
                            setMsg?.({ type: 'success', text: `Imported ${parsed.length} members into registry!` });
                            fetchMembers({ activeThisSemester: !showAllSemesters });
                        } else {
                            setMsg?.({ type: 'error', text: 'No valid name/admission number pairs found in file.' });
                        }
                    } catch (parseErr) {
                        setMsg?.({ type: 'error', text: 'Failed to parse Excel file.' });
                    } finally {
                        setImportLoading(false);
                    }
                };
                reader.readAsBinaryString(file);
            } else {
                setMsg?.({ type: 'error', text: 'Please select an Excel (.xlsx, .xls) or CSV file.' });
                setImportLoading(false);
            }
        } catch (err) {
            setMsg?.({ type: 'error', text: 'Failed to import members: ' + err.message });
            setImportLoading(false);
        } finally {
            e.target.value = '';
        }
    };

    // Edit Member Save
    const handleSaveEdit = async (e) => {
        e.preventDefault();
        if (!editingMember) return;
        if (isGuest) {
            setMsg?.({ type: 'error', text: 'Edit disabled in Guest Mode.' });
            return;
        }

        try {
            await api.patch(`/members/${editingMember._id}`, editingMember);
            setMsg?.({ type: 'success', text: `Updated ${editingMember.name} successfully!` });
            setEditingMember(null);
            fetchMembers({ activeThisSemester: !showAllSemesters });
        } catch (err) {
            setMsg?.({ type: 'error', text: err.response?.data?.message || 'Failed to update member' });
        }
    };

    // Secure Delete / Archive
    const handleDeleteMember = async (member) => {
        if (isGuest) {
            setMsg?.({ type: 'error', text: 'Delete disabled in Guest Mode.' });
            return;
        }

        const confirmDelete = window.confirm(`Are you sure you want to delete/archive ${member.name} (${member.studentRegNo})?`);
        if (!confirmDelete) return;

        try {
            await api.post(`/members/${member._id}/archive`);
            setMsg?.({ type: 'success', text: `${member.name} has been archived.` });
            fetchMembers({ activeThisSemester: !showAllSemesters });
        } catch (err) {
            setMsg?.({ type: 'error', text: err.response?.data?.message || 'Failed to archive member.' });
        }
    };

    // View Member's Student Portal
    const handleViewPortal = (member) => {
        const portalUrl = `/portal?regNo=${encodeURIComponent(member.studentRegNo)}`;
        window.open(portalUrl, '_blank');
    };

    // Member Table Columns definition
    const memberColumns = [
        {
            key: 'photo',
            header: 'Photo',
            width: '64px',
            render: (_, row) => {
                const initial = row.name ? row.name.trim().charAt(0).toUpperCase() : 'M';
                return (
                    <div className="doulos-table-avatar">
                        {initial}
                    </div>
                );
            }
        },
        {
            key: 'name',
            header: 'Member Name',
            render: (_, row) => (
                <div>
                    <div style={{ fontWeight: 700, color: '#2D2D3A', fontSize: '0.9rem' }}>
                        {row.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#8E8B9F', fontWeight: 600 }}>
                        {row.studentRegNo}
                    </div>
                </div>
            )
        },
        {
            key: 'campus',
            header: 'Campus / Mobile',
            render: (_, row) => (
                <div>
                    <div style={{ fontWeight: 600, color: '#4A4560' }}>
                        {row.campus}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#8E8B9F' }}>
                        {row.phone || row.squadLeaderPhone || '—'}
                    </div>
                </div>
            )
        },
        {
            key: 'email',
            header: 'Email / Reg',
            render: (_, row) => (
                <span style={{ fontSize: '0.82rem', color: '#6B6882' }}>
                    {row.email || `${row.studentRegNo.toLowerCase()}@daystar.ac.ke`}
                </span>
            )
        },
        {
            key: 'rank',
            header: 'Rank',
            render: (_, row) => (
                <RankBadge rank={row.douloidRank} />
            )
        },
        {
            key: 'status',
            header: 'Status',
            render: (_, row) => (
                <StatusPill status={row.memberType === 'Recruit' ? 'Recruit' : row.status} />
            )
        },
        {
            key: 'operation',
            header: 'Operation',
            align: 'center',
            width: '110px',
            render: (_, row) => (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.65rem' }}>
                    <button
                        onClick={(e) => { e.stopPropagation(); setViewingMember(row); }}
                        style={{ background: 'none', border: 'none', color: '#7E7A94', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                        title="View Full Profile"
                    >
                        <Eye size={16} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); setEditingMember(row); }}
                        style={{ background: 'none', border: 'none', color: '#7E7A94', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                        title="Edit Member"
                    >
                        <Pencil size={16} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteMember(row); }}
                        style={{ background: 'none', border: 'none', color: '#D9534F', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                        title="Archive Member"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            )
        },
        {
            key: 'action',
            header: 'Action',
            align: 'right',
            width: '120px',
            render: (_, row) => (
                <DarkActionButton onClick={(e) => { e.stopPropagation(); handleViewPortal(row); }}>
                    View Portal
                </DarkActionButton>
            )
        }
    ];

    // Admin Columns definition
    const adminColumns = [
        {
            key: 'avatar',
            header: 'Staff',
            width: '64px',
            render: (_, row) => (
                <div className="doulos-table-avatar" style={{ background: 'linear-gradient(135deg, #4B3F8C 0%, #2E2A4D 100%)', color: "#1E1B39" }}>
                    {row.username ? row.username.charAt(0).toUpperCase() : 'A'}
                </div>
            )
        },
        {
            key: 'username',
            header: 'Username / Name',
            render: (_, row) => (
                <div style={{ fontWeight: 700, color: '#2D2D3A' }}>
                    {row.username}
                </div>
            )
        },
        {
            key: 'role',
            header: 'Portfolio / Role',
            render: (_, row) => (
                <span style={{ 
                    padding: '0.3rem 0.75rem', 
                    borderRadius: 'var(--radius-pill)', 
                    backgroundColor: '#F1EFFF', 
                    color: '#4B3F8C', 
                    fontWeight: 700, 
                    fontSize: '0.75rem' 
                }}>
                    {row.role?.toUpperCase()}
                </span>
            )
        },
        {
            key: 'campus',
            header: 'Campus Jurisdiction',
            render: (_, row) => (
                <span style={{ color: '#4A4560', fontWeight: 600 }}>
                    {row.campus || 'All Campuses'}
                </span>
            )
        },
        {
            key: 'status',
            header: 'System Access',
            render: () => <StatusPill status="Active" />
        }
    ];

    return (
        <div style={{ width: '100%' }}>
            {/* Hidden file input for bulk import */}
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept=".xlsx,.xls,.csv" 
                style={{ display: 'none' }} 
            />

            {/* Sub-tabs & Top-right Counts (Directly beneath topbar) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '0.25rem' }}>
                {/* Reference's Sub Tabs: "Members" / "Admins" (Douloids & Recruits / G-Council) */}
                <div style={{ display: 'flex', gap: '2rem' }}>
                    <button
                        onClick={() => setSubTab('members')}
                        style={{
                            background: 'none',
                            border: 'none',
                            borderBottom: subTab === 'members' ? '2.5px solid var(--color-sidebar-bg)' : '2.5px solid transparent',
                            color: subTab === 'members' ? 'var(--color-sidebar-bg)' : '#8E8B9F',
                            fontSize: '0.96rem',
                            fontWeight: 700,
                            padding: '0.65rem 0.25rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                        }}
                    >
                        Douloids & Recruits
                    </button>
                    <button
                        onClick={() => {
                            setSubTab('admins');
                            if (fetchAdmins) fetchAdmins();
                        }}
                        style={{
                            background: 'none',
                            border: 'none',
                            borderBottom: subTab === 'admins' ? '2.5px solid var(--color-sidebar-bg)' : '2.5px solid transparent',
                            color: subTab === 'admins' ? 'var(--color-sidebar-bg)' : '#8E8B9F',
                            fontSize: '0.96rem',
                            fontWeight: 700,
                            padding: '0.65rem 0.25rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                        }}
                    >
                        G-Council Admins
                    </button>
                </div>

                {/* Top-right Stats */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.82rem', color: '#6B6882' }}>
                    <div>
                        <span style={{ color: '#8E8B9F' }}>Total members: </span>
                        <strong style={{ color: '#2D2D3A', fontWeight: 800 }}>{totalDouloids}</strong>
                    </div>
                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#D1D1DB' }} />
                    <div>
                        <span style={{ color: '#8E8B9F' }}>Active this semester: </span>
                        <strong style={{ color: 'var(--color-sidebar-bg)', fontWeight: 800 }}>{activeThisSemester}</strong>
                    </div>
                </div>
            </div>

            {/* Action Bar Row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <h2 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800, color: '#2D2D3A', letterSpacing: '-0.02em', marginRight: '0.5rem' }}>
                        {subTab === 'members' ? 'Members' : 'G-Council Staff'}
                    </h2>

                    {subTab === 'members' && (
                        <>
                            {/* Primary Button: "Add Recruit" (Visually First) */}
                            <PrimaryButton
                                icon={UserPlus}
                                onClick={() => setIsAddRecruitOpen(true)}
                            >
                                Add Recruit
                            </PrimaryButton>

                            {/* Secondary: Import members */}
                            <OutlineButton
                                icon={Upload}
                                disabled={importLoading}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {importLoading ? 'Importing...' : 'Import members'}
                            </OutlineButton>

                            {/* Secondary: Export members (Excel) */}
                            <OutlineButton
                                icon={Download}
                                onClick={handleExportExcel}
                            >
                                Export register (Excel)
                            </OutlineButton>
                        </>
                    )}
                </div>

                {/* Right side: Search & Filter button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="doulos-search-box" style={{ width: '220px' }}>
                        <Search size={15} color="#9E9EA7" />
                        <input
                            type="text"
                            className="doulos-search-input"
                            placeholder="Search name, reg..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {subTab === 'members' && (
                        <OutlineButton
                            icon={Filter}
                            active={campusFilter !== 'All' || rankFilter !== 'All' || statusFilter !== 'All' || showAllSemesters}
                            onClick={() => setIsFilterPanelOpen(true)}
                        >
                            Filter
                        </OutlineButton>
                    )}
                </div>
            </div>

            {/* Active Filter Chips bar (if filters applied) */}
            {(campusFilter !== 'All' || rankFilter !== 'All' || statusFilter !== 'All' || showAllSemesters) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#8E8B9F', textTransform: 'uppercase' }}>Filtered by:</span>
                    {campusFilter !== 'All' && (
                        <span style={{ fontSize: '0.74rem', background: '#F1EFFF', color: '#4B3F8C', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 600 }}>
                            Campus: {campusFilter}
                        </span>
                    )}
                    {rankFilter !== 'All' && (
                        <span style={{ fontSize: '0.74rem', background: '#F1EFFF', color: '#4B3F8C', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 600 }}>
                            Rank: {rankFilter}
                        </span>
                    )}
                    {statusFilter !== 'All' && (
                        <span style={{ fontSize: '0.74rem', background: '#F1EFFF', color: '#4B3F8C', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 600 }}>
                            Status: {statusFilter}
                        </span>
                    )}
                    {showAllSemesters && (
                        <span style={{ fontSize: '0.74rem', background: '#F1EFFF', color: '#4B3F8C', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 600 }}>
                            All Semesters
                        </span>
                    )}
                    <button
                        onClick={() => {
                            setCampusFilter('All');
                            setRankFilter('All');
                            setStatusFilter('All');
                            setShowAllSemesters(false);
                        }}
                        style={{ background: 'none', border: 'none', color: '#D9534F', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer', padding: '0 0.25rem' }}
                    >
                        Clear all
                    </button>
                </div>
            )}

            {/* Render Main Table */}
            {subTab === 'members' ? (
                <DataTable
                    columns={memberColumns}
                    data={filteredMembers}
                    loading={loadingMembers}
                    emptyMessage="No members match the current filters"
                />
            ) : (
                <DataTable
                    columns={adminColumns}
                    data={admins}
                    loading={loadingMembers}
                    emptyMessage="No G-Council staff records found"
                />
            )}

            {/* Filter Panel Drawer */}
            <FilterPanel
                isOpen={isFilterPanelOpen}
                onClose={() => setIsFilterPanelOpen(false)}
                campusFilter={campusFilter}
                setCampusFilter={setCampusFilter}
                rankFilter={rankFilter}
                setRankFilter={setRankFilter}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                showAllSemesters={showAllSemesters}
                setShowAllSemesters={setShowAllSemesters}
                onReset={() => {
                    setCampusFilter('All');
                    setRankFilter('All');
                    setStatusFilter('All');
                    setShowAllSemesters(false);
                }}
            />

            {/* Add Recruit Modal */}
            <AddRecruitModal
                isOpen={isAddRecruitOpen}
                onClose={() => setIsAddRecruitOpen(false)}
                onMemberAdded={handleRecruitAdded}
                api={api}
                setMsg={setMsg}
                isGuest={isGuest}
            />

            {/* Edit Member Modal */}
            {editingMember && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(46, 42, 77, 0.45)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 1100,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1rem'
                    }}
                    onClick={() => setEditingMember(null)}
                >
                    <div
                        style={{
                            backgroundcolor: "#1E1B39",
                            borderRadius: '16px',
                            padding: '2rem',
                            maxWidth: '480px',
                            width: '100%',
                            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.15)'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Edit Member Profile</h3>
                            <button onClick={() => setEditingMember(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#6B6882', marginBottom: '0.35rem' }}>Full Name</label>
                                <input
                                    type="text"
                                    value={editingMember.name || ''}
                                    onChange={e => setEditingMember({ ...editingMember, name: e.target.value })}
                                    style={{ width: '100%', height: '40px', padding: '0 0.75rem', borderRadius: '8px', border: '1px solid #E5E5EB' }}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#6B6882', marginBottom: '0.35rem' }}>Campus</label>
                                    <select
                                        value={editingMember.campus || 'Athi River'}
                                        onChange={e => setEditingMember({ ...editingMember, campus: e.target.value })}
                                        style={{ width: '100%', height: '40px', padding: '0 0.5rem', borderRadius: '8px', border: '1px solid #E5E5EB' }}
                                    >
                                        <option value="Athi River">Athi River</option>
                                        <option value="Valley Road">Valley Road</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#6B6882', marginBottom: '0.35rem' }}>Status</label>
                                    <select
                                        value={editingMember.status || 'Active'}
                                        onChange={e => setEditingMember({ ...editingMember, status: e.target.value })}
                                        style={{ width: '100%', height: '40px', padding: '0 0.5rem', borderRadius: '8px', border: '1px solid #E5E5EB' }}
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Archived">Archived</option>
                                        <option value="Graduated">Graduated</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#6B6882', marginBottom: '0.35rem' }}>Douloid Rank</label>
                                    <select
                                        value={editingMember.douloidRank || 'None'}
                                        onChange={e => setEditingMember({ ...editingMember, douloidRank: e.target.value })}
                                        style={{ width: '100%', height: '40px', padding: '0 0.5rem', borderRadius: '8px', border: '1px solid #E5E5EB' }}
                                    >
                                        <option value="None">None</option>
                                        <option value="Shadow Douloid">Shadow Douloid</option>
                                        <option value="Basic Douloid">Basic Douloid</option>
                                        <option value="Intermediate Douloid">Intermediate Douloid</option>
                                        <option value="Lead Douloid">Lead Douloid</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#6B6882', marginBottom: '0.35rem' }}>Belay Permission</label>
                                    <select
                                        value={editingMember.belayStatus || 'Not Permitted'}
                                        onChange={e => setEditingMember({ ...editingMember, belayStatus: e.target.value })}
                                        style={{ width: '100%', height: '40px', padding: '0 0.5rem', borderRadius: '8px', border: '1px solid #E5E5EB' }}
                                    >
                                        <option value="Not Permitted">Not Permitted</option>
                                        <option value="Secondary Belayer">Secondary Belayer</option>
                                        <option value="Primary Belayer Certified">Primary Belayer Certified</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#6B6882', marginBottom: '0.35rem' }}>Mobile / Phone</label>
                                <input
                                    type="text"
                                    value={editingMember.phone || ''}
                                    onChange={e => setEditingMember({ ...editingMember, phone: e.target.value })}
                                    style={{ width: '100%', height: '40px', padding: '0 0.75rem', borderRadius: '8px', border: '1px solid #E5E5EB' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                                <OutlineButton onClick={() => setEditingMember(null)} style={{ flex: 1 }}>Cancel</OutlineButton>
                                <PrimaryButton type="submit" style={{ flex: 1.5 }}>Save Changes</PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Member Profile Drawer / Modal */}
            {viewingMember && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(46, 42, 77, 0.45)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 1100,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1rem'
                    }}
                    onClick={() => setViewingMember(null)}
                >
                    <div
                        style={{
                            backgroundcolor: "#1E1B39",
                            borderRadius: '16px',
                            padding: '2rem',
                            maxWidth: '440px',
                            width: '100%',
                            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.15)',
                            textAlign: 'center'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div
                            style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '50%',
                                backgroundColor: '#F1EFFF',
                                color: '#4B3F8C',
                                fontSize: '1.5rem',
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1rem'
                            }}
                        >
                            {viewingMember.name?.charAt(0).toUpperCase()}
                        </div>
                        <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.25rem', fontWeight: 800 }}>{viewingMember.name}</h3>
                        <p style={{ margin: '0 0 1.25rem', color: '#8E8B9F', fontSize: '0.85rem' }}>{viewingMember.studentRegNo} · {viewingMember.campus}</p>

                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <RankBadge rank={viewingMember.douloidRank} />
                            <StatusPill status={viewingMember.memberType === 'Recruit' ? 'Recruit' : viewingMember.status} />
                        </div>

                        <div style={{ backgroundColor: '#F9FAFC', border: '1px solid #EBEBF2', borderRadius: '12px', padding: '1rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem', marginBottom: '1.5rem' }}>
                            <div><strong style={{ color: '#6B6882' }}>Belay Status:</strong> <span style={{ color: '#2D2D3A', fontWeight: 600 }}>{viewingMember.belayStatus || 'Not Permitted'}</span></div>
                            <div><strong style={{ color: '#6B6882' }}>Total Points:</strong> <span style={{ color: '#3CB371', fontWeight: 700 }}>{viewingMember.totalPoints || 0} pts</span></div>
                            <div><strong style={{ color: '#6B6882' }}>Phone:</strong> <span style={{ color: '#2D2D3A' }}>{viewingMember.phone || 'N/A'}</span></div>
                            <div><strong style={{ color: '#6B6882' }}>Assigned Crew:</strong> <span style={{ color: '#4B3F8C', fontWeight: 600 }}>{viewingMember.groupName || 'Unassigned'}</span></div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <OutlineButton onClick={() => setViewingMember(null)} style={{ flex: 1 }}>Close</OutlineButton>
                            <PrimaryButton onClick={() => handleViewPortal(viewingMember)} style={{ flex: 1.5 }}>
                                Open Student Portal
                            </PrimaryButton>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
