import React, { useState, useEffect } from 'react';
import { 
    Users, Activity, Sparkles, RefreshCw, Trash2, Search, 
    Calendar, MapPin, Download, FileText, CheckCircle, ChevronDown, Award
} from 'lucide-react';

const typeColors = {
    Douloid:  { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.15)' },
    Recruit:  { color: '#25AAE1', bg: 'rgba(37,170,225,0.08)',  border: 'rgba(37,170,225,0.15)' },
    Visitor:  { color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.15)' },
    Exempted: { color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.15)' },
};

const ActivitiesTab = ({ 
    members = [], 
    fetchMembers, 
    isGuest, 
    setMsg, 
    currentSemester, 
    api 
}) => {
    const [subTab, setSubTab] = useState('groups'); // groups, watering
    const [groupCount, setGroupCount] = useState(3);
    const [customNamesInput, setCustomNamesInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Filters & Search
    const [searchTerm, setSearchTerm] = useState('');
    const [campusFilter, setCampusFilter] = useState('All');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [dayFilter, setDayFilter] = useState('All');

    // Grouping calculations
    const activeMembers = members.filter(m => m.status === 'Active');
    const groupedMembers = activeMembers.filter(m => m.groupName);
    const ungroupedMembers = activeMembers.filter(m => !m.groupName);

    // Get unique group names
    const groupNames = Array.from(new Set(activeMembers.map(m => m.groupName).filter(Boolean))).sort();

    // Watering days calculations
    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const wateringStats = weekdays.map(day => {
        const committed = activeMembers.filter(m => m.wateringDays?.includes(day));
        return {
            day,
            count: committed.length,
            members: committed
        };
    });

    const handleAutoGenerate = async (e) => {
        e.preventDefault();
        if (isGuest) return setMsg({ type: 'error', text: 'Action disabled in Guest Mode.' });

        const confirmMsg = `This will automatically redistribute all ${activeMembers.length} active members into ${groupCount} groups fairly (Douloids, Recruits, and Visitors balanced evenly). Proceed?`;
        if (!window.confirm(confirmMsg)) return;

        setIsGenerating(true);
        try {
            const customNames = customNamesInput
                .split('\n')
                .map(n => n.trim())
                .filter(Boolean);

            const res = await api.post('/members/auto-generate-groups', {
                groupCount: parseInt(groupCount),
                groupNames: customNames.length > 0 ? customNames : null
            });

            setMsg({ type: 'success', text: res.data.message });
            fetchMembers();
            setCustomNamesInput('');
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to auto-generate groups' });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleClearGroups = async () => {
        if (isGuest) return setMsg({ type: 'error', text: 'Action disabled in Guest Mode.' });
        if (!window.confirm('⚠️ WARNING: This will permanently delete all fellowship group assignments. Proceed?')) return;

        try {
            const res = await api.post('/members/clear-all-groups');
            setMsg({ type: 'success', text: res.data.message });
            fetchMembers();
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to reset groups' });
        }
    };

    const handleMemberGroupChange = async (memberId, newGroupName) => {
        if (isGuest) return setMsg({ type: 'error', text: 'Action disabled in Guest Mode.' });
        
        try {
            await api.patch(`/members/${memberId}`, { groupName: newGroupName || null });
            setMsg({ type: 'success', text: 'Group assignment updated successfully!' });
            fetchMembers();
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to update group assignment' });
        }
    };

    // --- REPORT EXPORTERS (PRINT PDF) ---
    const handlePrintGroupsPDF = () => {
        const printHtml = `
            <html>
                <head>
                    <title>Doulos Directory - Fellowship Groups</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap');
                        @page { size: A4; margin: 15mm; }
                        body { 
                            font-family: 'Plus Jakarta Sans', sans-serif;
                            margin: 0; padding: 0; background: #ffffff;
                            color: #0f172a; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
                        }
                        .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #25AAE1; padding-bottom: 12px; margin-bottom: 25px; }
                        .logo-container { display: flex; align-items: center; gap: 15px; }
                        .logo-img { width: 65px; height: 65px; object-fit: contain; }
                        .header-title h1 { margin: 0; font-size: 1.8rem; font-weight: 900; color: #021525; letter-spacing: -0.5px; }
                        .header-title p { margin: 3px 0 0 0; font-size: 0.85rem; color: #25AAE1; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; }
                        .meta-info { text-align: right; font-size: 0.8rem; color: #64748b; font-weight: 600; line-height: 1.4; }
                        .meta-info strong { color: #0f172a; }
                        .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px; }
                        .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px; text-align: center; }
                        .summary-card h3 { margin: 0 0 5px 0; font-size: 0.7rem; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-weight: 800; }
                        .summary-card div { font-size: 1.6rem; font-weight: 900; color: #25AAE1; }
                        .group-section { margin-bottom: 35px; page-break-inside: avoid; }
                        .group-title { font-size: 1.15rem; font-weight: 900; color: #ffffff; background: #021525; padding: 8px 15px; border-radius: 8px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; }
                        .group-count { font-size: 0.85rem; font-weight: 700; background: rgba(37, 170, 225, 0.2); color: #25AAE1; padding: 2px 10px; border-radius: 20px; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
                        th { background: #f1f5f9; color: #475569; font-weight: 800; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; padding: 10px 12px; text-align: left; border-bottom: 2px solid #cbd5e1; }
                        td { padding: 9px 12px; font-size: 0.8rem; border-bottom: 1px solid #e2e8f0; color: #334155; }
                        .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.3px; }
                        .badge-douloid { background: rgba(251, 191, 36, 0.1); color: #b45309; }
                        .badge-recruit { background: rgba(37, 170, 225, 0.1); color: #0369a1; }
                        .badge-visitor { background: rgba(167, 139, 250, 0.1); color: #6d28d9; }
                        .badge-exempted { background: rgba(248, 113, 113, 0.1); color: #b91c1c; }
                        .footer { width: 100%; border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 30px; display: flex; justify-content: space-between; font-size: 0.7rem; color: #94a3b8; font-weight: 600; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="logo-container">
                            <img src="${window.location.origin}/logo.png" class="logo-img" alt="Doulos" />
                            <div class="header-title">
                                <h1>Fellowship Groups Directory</h1>
                                <p>Active Class Placements</p>
                            </div>
                        </div>
                        <div class="meta-info">
                            Semester: <strong>${currentSemester}</strong><br/>
                            Generated: <strong>${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                        </div>
                    </div>

                    <div class="summary-grid">
                        <div class="summary-card">
                            <h3>Total Assigned Members</h3>
                            <div>${groupedMembers.length}</div>
                        </div>
                        <div class="summary-card">
                            <h3>Total Active Groups</h3>
                            <div>${groupNames.length}</div>
                        </div>
                        <div class="summary-card">
                            <h3>Average Group Size</h3>
                            <div>${groupNames.length > 0 ? Math.round(groupedMembers.length / groupNames.length) : 0}</div>
                        </div>
                    </div>

                    ${groupNames.map(name => {
                        const membersInGroup = activeMembers.filter(m => m.groupName === name);
                        return `
                            <div class="group-section">
                                <div class="group-title">
                                    <span>${name.toUpperCase()}</span>
                                    <span class="group-count">${membersInGroup.length} Assigned</span>
                                </div>
                                <table>
                                    <thead>
                                        <tr>
                                            <th style="width: 40%">Student Name</th>
                                            <th style="width: 25%">Admission Number</th>
                                            <th style="width: 20%">Campus</th>
                                            <th style="width: 15%">Category</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${membersInGroup.map(m => `
                                            <tr>
                                                <td style="font-weight: 700; color: #0f172a">${m.name}</td>
                                                <td style="font-family: monospace; font-weight: 600">${m.studentRegNo}</td>
                                                <td>${m.campus}</td>
                                                <td>
                                                    <span class="badge badge-${m.memberType?.toLowerCase()}">${m.memberType}</span>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        `;
                    }).join('')}

                    <div class="footer">
                        <span>Doulos Leaders In Service System Directory Report</span>
                        <span>Page 1 of 1</span>
                    </div>
                    
                    <script>
                        window.onload = () => {
                            setTimeout(() => { window.print(); }, 500);
                        };
                    </script>
                </body>
            </html>
        `;
        const win = window.open('', '_blank');
        win.document.write(printHtml);
        win.document.close();
    };

    const handlePrintWateringPDF = () => {
        const printHtml = `
            <html>
                <head>
                    <title>Doulos Report - Freedom Base Tree Watering</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap');
                        @page { size: A4; margin: 15mm; }
                        body { 
                            font-family: 'Plus Jakarta Sans', sans-serif;
                            margin: 0; padding: 0; background: #ffffff;
                            color: #0f172a; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
                        }
                        .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #10b981; padding-bottom: 12px; margin-bottom: 25px; }
                        .logo-container { display: flex; align-items: center; gap: 15px; }
                        .logo-img { width: 65px; height: 65px; object-fit: contain; }
                        .header-title h1 { margin: 0; font-size: 1.8rem; font-weight: 900; color: #021525; letter-spacing: -0.5px; }
                        .header-title p { margin: 3px 0 0 0; font-size: 0.85rem; color: #10b981; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; }
                        .meta-info { text-align: right; font-size: 0.8rem; color: #64748b; font-weight: 600; line-height: 1.4; }
                        .meta-info strong { color: #0f172a; }
                        
                        .heatmap { display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; margin-bottom: 35px; }
                        .heatmap-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; text-align: center; background: #f8fafc; }
                        .heatmap-card.critical { border-color: #fca5a5; background: #fef2f2; }
                        .heatmap-card.critical .count { color: #ef4444; }
                        .heatmap-card.good { border-color: #86efac; background: #f0fdf4; }
                        .heatmap-card.good .count { color: #10b981; }
                        .heatmap-card.warning { border-color: #fde047; background: #fefce8; }
                        .heatmap-card.warning .count { color: #d97706; }
                        
                        .day-name { font-size: 0.65rem; font-weight: 900; text-transform: uppercase; color: #64748b; margin-bottom: 3px; }
                        .count { font-size: 1.4rem; font-weight: 900; }
                        
                        .section-title { font-size: 1.1rem; font-weight: 900; color: #021525; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin: 30px 0 15px 0; }
                        
                        table { width: 100%; border-collapse: collapse; margin-bottom: 25px; page-break-inside: avoid; }
                        th { background: #f1f5f9; color: #475569; font-weight: 800; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; padding: 10px 12px; text-align: left; border-bottom: 2px solid #cbd5e1; }
                        td { padding: 9px 12px; font-size: 0.8rem; border-bottom: 1px solid #e2e8f0; color: #334155; }
                        .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.3px; }
                        .badge-douloid { background: rgba(251, 191, 36, 0.1); color: #b45309; }
                        .badge-recruit { background: rgba(37, 170, 225, 0.1); color: #0369a1; }
                        .badge-visitor { background: rgba(167, 139, 250, 0.1); color: #6d28d9; }
                        .badge-exempted { background: rgba(248, 113, 113, 0.1); color: #b91c1c; }
                        .footer { width: 100%; border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 30px; display: flex; justify-content: space-between; font-size: 0.7rem; color: #94a3b8; font-weight: 600; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="logo-container">
                            <img src="${window.location.origin}/logo.png" class="logo-img" alt="Doulos" />
                            <div class="header-title">
                                <h1>Tree Watering Schedule</h1>
                                <p>Freedom Base Commitment Report</p>
                            </div>
                        </div>
                        <div class="meta-info">
                            Semester: <strong>${currentSemester}</strong><br/>
                            Generated: <strong>${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                        </div>
                    </div>

                    <h2 class="section-title" style="margin-top: 0;">Weekly Coverage Overview</h2>
                    <div class="heatmap">
                        ${wateringStats.map(s => {
                            const statusClass = s.count === 0 ? 'critical' : s.count >= 5 ? 'good' : 'warning';
                            return `
                                <div class="heatmap-card ${statusClass}">
                                    <div class="day-name">${s.day.slice(0, 3)}</div>
                                    <div class="count">${s.count}</div>
                                    <div style="font-size: 0.6rem; opacity: 0.6; font-weight: 700;">Waterers</div>
                                </div>
                            `;
                        }).join('')}
                    </div>

                    <h2 class="section-title">Schedule Commitments Directory</h2>
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 35%">Student Name</th>
                                <th style="width: 25%">Admission Number</th>
                                <th style="width: 15%">Category</th>
                                <th style="width: 25%">Watering Commitments</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${activeMembers.map(m => `
                                <tr>
                                    <td style="font-weight: 700; color: #0f172a">${m.name}</td>
                                    <td style="font-family: monospace; font-weight: 600">${m.studentRegNo}</td>
                                    <td>
                                        <span class="badge badge-${m.memberType?.toLowerCase()}">${m.memberType}</span>
                                    </td>
                                    <td style="font-weight: 700; color: #10b981">
                                        ${m.wateringDays?.length > 0 ? m.wateringDays.join(', ') : '<span style="color:#94a3b8; font-weight:600;">None (Not Committed)</span>'}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <div class="footer">
                        <span>Doulos Tree Watering Freedom Base Commitments Sheet</span>
                        <span>Page 1 of 1</span>
                    </div>
                    
                    <script>
                        window.onload = () => {
                            setTimeout(() => { window.print(); }, 500);
                        };
                    </script>
                </body>
            </html>
        `;
        const win = window.open('', '_blank');
        win.document.write(printHtml);
        win.document.close();
    };

    // --- CSV EXPORTERS ---
    const handleExportGroupsCSV = () => {
        try {
            const headers = ['Name', 'Registration Number', 'Campus', 'Category', 'Assigned Group'];
            const csvContent = [
                headers.join(','),
                ...activeMembers.map(m => [
                    `"${m.name || 'Unknown'}"`,
                    `"${m.studentRegNo}"`,
                    `"${m.campus}"`,
                    `"${m.memberType || 'Visitor'}"`,
                    `"${m.groupName || 'None (Unassigned)'}"`
                ].join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.setAttribute('download', `Doulos_Fellowship_Groups_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setMsg({ type: 'success', text: 'CSV Groups directory export started!' });
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to export groups directory CSV' });
        }
    };

    const handleExportWateringCSV = () => {
        try {
            const headers = ['Name', 'Registration Number', 'Campus', 'Category', 'Watering Commitments'];
            const csvContent = [
                headers.join(','),
                ...activeMembers.map(m => [
                    `"${m.name || 'Unknown'}"`,
                    `"${m.studentRegNo}"`,
                    `"${m.campus}"`,
                    `"${m.memberType || 'Visitor'}"`,
                    `"${m.wateringDays?.length > 0 ? m.wateringDays.join(' | ') : 'None'}"`
                ].join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.setAttribute('download', `Doulos_Watering_Commitments_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setMsg({ type: 'success', text: 'CSV Watering commitments export started!' });
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to export watering commitments CSV' });
        }
    };

    // Filtering logic
    const filteredMembers = activeMembers.filter(m => {
        const cleanSearch = searchTerm.toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanName = m.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanReg = m.studentRegNo.toLowerCase().replace(/[^a-z0-9]/g, '');

        const matchesSearch = !searchTerm || cleanName.includes(cleanSearch) || cleanReg.includes(cleanSearch);
        const matchesCampus = campusFilter === 'All' || m.campus === campusFilter;
        const matchesCategory = categoryFilter === 'All' || m.memberType === categoryFilter;
        const matchesDay = dayFilter === 'All' || m.wateringDays?.includes(dayFilter);

        return matchesSearch && matchesCampus && matchesCategory && matchesDay;
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', animation: 'fadeIn 0.5s' }}>
            
            {/* Navigation Header */}
            <div className="glass-card-premium" style={{ padding: '1rem 1.5rem', background: 'rgba(9, 29, 46, 0.4)', border: '1px solid rgba(29, 166, 217, 0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.35rem', background: 'rgba(2, 21, 37, 0.4)', padding: '0.35rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <button 
                        onClick={() => setSubTab('groups')}
                        style={{
                            padding: '0.5rem 1.25rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer',
                            background: subTab === 'groups' ? 'rgba(37, 170, 225, 0.2)' : 'transparent',
                            color: subTab === 'groups' ? '#25AAE1' : 'rgba(255,255,255,0.6)',
                            fontSize: '0.8rem', fontWeight: 800, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.4rem'
                        }}
                    >
                        <Users size={15} /> Fellowship Groups
                    </button>
                    <button 
                        onClick={() => setSubTab('watering')}
                        style={{
                            padding: '0.5rem 1.25rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer',
                            background: subTab === 'watering' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                            color: subTab === 'watering' ? '#10b981' : 'rgba(255,255,255,0.6)',
                            fontSize: '0.8rem', fontWeight: 800, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.4rem'
                        }}
                    >
                        <Activity size={15} /> Freedom Base Watering
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {subTab === 'groups' ? (
                        <>
                            <button className="btn" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'white' }} onClick={handlePrintGroupsPDF}>
                                <FileText size={14} /> Print PDF
                            </button>
                            <button className="btn" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(37, 170, 225, 0.1)', border: '1px solid rgba(37, 170, 225, 0.2)', color: '#25AAE1' }} onClick={handleExportGroupsCSV}>
                                <Download size={14} /> Export CSV
                            </button>
                        </>
                    ) : (
                        <>
                            <button className="btn" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'white' }} onClick={handlePrintWateringPDF}>
                                <FileText size={14} /> Print PDF
                            </button>
                            <button className="btn" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#10b981' }} onClick={handleExportWateringCSV}>
                                <Download size={14} /> Export CSV
                            </button>
                        </>
                    )}
                </div>
            </div>

            {subTab === 'groups' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                    {/* Auto Grouping Generator Dashboard Card */}
                    <div className="glass-card-premium" style={{ padding: '2rem', background: '#0d111b', borderLeft: '4px solid #25AAE1' }}>
                        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1, minWidth: '280px' }}>
                                <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white' }}>
                                    <Sparkles size={20} color="#25AAE1" /> Stratified Group Auto-Generator
                                </h3>
                                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', marginTop: '0.5rem', lineHeight: 1.5 }}>
                                    Distributes all active class members fairly into groups. Shuffles and stratifies members round-robin to ensure an equal leadership ratio of **Douloids**, **Recruits**, and **Visitors** in each group.
                                </p>
                                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                                    <div style={{ textAlign: 'center', padding: '0.85rem 1.25rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '0.75rem' }}>
                                        <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Active</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#25AAE1', marginTop: '0.15rem' }}>{activeMembers.length}</div>
                                    </div>
                                    <div style={{ textAlign: 'center', padding: '0.85rem 1.25rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '0.75rem' }}>
                                        <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assigned</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#4ade80', marginTop: '0.15rem' }}>{groupedMembers.length}</div>
                                    </div>
                                    <div style={{ textAlign: 'center', padding: '0.85rem 1.25rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '0.75rem' }}>
                                        <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ungrouped</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fb7185', marginTop: '0.15rem' }}>{ungroupedMembers.length}</div>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleAutoGenerate} style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '0.85rem', background: 'rgba(2, 21, 37, 0.3)', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid rgba(255,255,255,0.04)', flexShrink: 0 }}>
                                <div className="form-group-premium">
                                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>Number of Groups</label>
                                    <input type="number" className="modern-input" min={1} max={15} value={groupCount} onChange={e => setGroupCount(e.target.value)} required style={{ width: '100%', marginTop: '0.35rem' }} />
                                </div>
                                <div className="form-group-premium">
                                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>Custom Group Names (Optional)</label>
                                    <textarea className="modern-input" style={{ width: '100%', minHeight: '60px', height: '60px', fontSize: '0.75rem', marginTop: '0.35rem', resize: 'none' }} placeholder="Type one name per line...&#10;e.g. Group Alpha&#10;Group Beta" value={customNamesInput} onChange={e => setCustomNamesInput(e.target.value)} />
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                    {groupNames.length > 0 && (
                                        <button type="button" onClick={handleClearGroups} className="btn" style={{ flex: 1, padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '0.78rem', fontWeight: 800 }}>
                                            <Trash2 size={14} /> Clear
                                        </button>
                                    )}
                                    <button type="submit" disabled={isGenerating} className="btn btn-primary" style={{ flex: 2, padding: '0.75rem', fontSize: '0.78rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                                        {isGenerating ? <RefreshCw className="animate-spin" size={14} /> : <Sparkles size={14} />}
                                        Generate groups
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Group Visual Cards */}
                    {groupNames.length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
                            {groupNames.map(name => {
                                const count = activeMembers.filter(m => m.groupName === name).length;
                                return (
                                    <div key={name} className="glass-card-premium interactive" style={{ padding: '1.5rem', background: '#0d111b', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(37, 170, 225, 0.1)', border: '1px solid rgba(37, 170, 225, 0.2)', display: 'flex', alignItems: 'center', justify_content: 'center', color: '#25AAE1', fontSize: '1.2rem', fontWeight: 900 }}>
                                            {name.replace('Group ', '').charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: 'white' }}>{name}</h4>
                                            <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{count} members assigned</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                    {/* Weekly Coverage Grid Heatmap */}
                    <div className="glass-card-premium" style={{ padding: '2rem', background: '#0d111b' }}>
                        <div style={{ fontSize: '0.62rem', fontWeight: 900, color: '#10b981', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Coverage Status</div>
                        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.35rem', fontWeight: 900 }}>Weekly Watering Heatmap</h3>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.85rem' }}>
                            {wateringStats.map(s => {
                                const isCritical = s.count === 0;
                                const isGood = s.count >= 4;
                                return (
                                    <div key={s.day} style={{
                                        padding: '1rem 0.5rem', borderRadius: '0.75rem', textAlign: 'center',
                                        background: isCritical ? 'rgba(239, 68, 68, 0.05)' : isGood ? 'rgba(16, 185, 129, 0.05)' : 'rgba(234, 179, 8, 0.05)',
                                        border: '1px solid',
                                        borderColor: isCritical ? 'rgba(239, 68, 68, 0.15)' : isGood ? 'rgba(16, 185, 129, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                                    }}>
                                        <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.day.slice(0, 3)}</div>
                                        <div style={{
                                            fontSize: '1.5rem', fontWeight: 900, marginTop: '0.35rem',
                                            color: isCritical ? '#ef4444' : isGood ? '#10b981' : '#eab308'
                                        }}>{s.count}</div>
                                        <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.2rem', fontWeight: 700 }}>
                                            {isCritical ? 'CRITICAL ⚠️' : isGood ? 'STABLE ✓' : 'LOW COVER'}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Members List Directory & Directory Filters */}
            <div className="glass-card-premium" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: '400px', border: '1px solid rgba(29, 166, 217, 0.15)' }}>
                <div style={{ padding: '1.5rem', background: 'rgba(2, 21, 37, 0.4)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative', flex: '1 1 240px' }}>
                            <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                            <input
                                placeholder="Search student name or admission number..."
                                className="modern-input"
                                style={{ paddingLeft: '2.5rem', width: '100%', height: '40px', fontSize: '0.85rem' }}
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
                            <select className="modern-input" style={{ height: '40px', fontSize: '0.8rem', padding: '0 1rem', cursor: 'pointer', background: 'rgba(0,0,0,0.3)' }} value={campusFilter} onChange={e => setCampusFilter(e.target.value)}>
                                <option value="All">All Campuses</option>
                                <option value="Athi River">Athi River</option>
                                <option value="Valley Road">Valley Road</option>
                            </select>

                            <select className="modern-input" style={{ height: '40px', fontSize: '0.8rem', padding: '0 1rem', cursor: 'pointer', background: 'rgba(0,0,0,0.3)' }} value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                                <option value="All">All Categories</option>
                                <option value="Douloid">Douloids</option>
                                <option value="Recruit">Recruits</option>
                                <option value="Visitor">Visitors</option>
                                <option value="Exempted">Exempted</option>
                            </select>

                            {subTab === 'watering' && (
                                <select className="modern-input" style={{ height: '40px', fontSize: '0.8rem', padding: '0 1rem', cursor: 'pointer', background: 'rgba(0,0,0,0.3)' }} value={dayFilter} onChange={e => setDayFilter(e.target.value)}>
                                    <option value="All">All Watering Days</option>
                                    {weekdays.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            )}
                        </div>
                    </div>
                </div>

                <div style={{ overflowX: 'auto', flex: 1 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                <th style={{ padding: '1rem', fontSize: '0.72rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>Student Name</th>
                                <th style={{ padding: '1rem', fontSize: '0.72rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>Admission Number</th>
                                <th style={{ padding: '1rem', fontSize: '0.72rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>Campus</th>
                                <th style={{ padding: '1rem', fontSize: '0.72rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>Category</th>
                                {subTab === 'groups' ? (
                                    <th style={{ padding: '1rem', fontSize: '0.72rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>Assigned Fellowship Group</th>
                                ) : (
                                    <th style={{ padding: '1rem', fontSize: '0.72rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>Watering Commitment</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMembers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                                        No members match your criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredMembers.map(m => {
                                    const tc = typeColors[m.memberType || 'Visitor'];
                                    return (
                                        <tr key={m._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background-color 0.2s' }} className="table-row-hover">
                                            <td style={{ padding: '1rem', fontWeight: 800, color: 'white' }}>{m.name}</td>
                                            <td style={{ padding: '1rem', fontFamily: 'monospace', fontWeight: 700, color: '#94a3b8' }}>{m.studentRegNo}</td>
                                            <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{m.campus}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{
                                                    padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.62rem', fontWeight: 900,
                                                    background: tc.bg, color: tc.color, border: `1px solid ${tc.border}`, textTransform: 'uppercase'
                                                }}>{m.memberType}</span>
                                            </td>
                                            {subTab === 'groups' ? (
                                                <td style={{ padding: '1rem' }} onClick={e => e.stopPropagation()}>
                                                    <div style={{ position: 'relative', width: '200px' }}>
                                                        <select
                                                            className="modern-input"
                                                            style={{
                                                                width: '100%', height: '34px', fontSize: '0.78rem', fontWeight: 700,
                                                                background: m.groupName ? 'rgba(37,170,225,0.05)' : 'rgba(255,255,255,0.02)',
                                                                borderColor: m.groupName ? 'rgba(37,170,225,0.25)' : 'rgba(255,255,255,0.08)',
                                                                color: m.groupName ? '#25AAE1' : 'white',
                                                                cursor: 'pointer', padding: '0 0.5rem'
                                                            }}
                                                            value={m.groupName || ''}
                                                            onChange={e => handleMemberGroupChange(m._id, e.target.value)}
                                                        >
                                                            <option value="" style={{ background: '#090d16', color: 'rgba(255,255,255,0.4)' }}>Unassigned (None)</option>
                                                            {groupNames.map(g => <option key={g} value={g} style={{ background: '#090d16', color: 'white' }}>{g}</option>)}
                                                            {/* Allow typing custom on-the-fly */}
                                                            <option value="NEW_GROUP_PROMPT" style={{ background: '#090d16', color: '#fbbf24' }}>+ Assign Custom Name...</option>
                                                        </select>
                                                        
                                                        {/* Handler for adding custom group names inline */}
                                                        <select style={{ display: 'none' }} onChange={async (e) => {
                                                            if (e.target.value === 'NEW_GROUP_PROMPT') {
                                                                const custom = window.prompt(`Enter custom fellowship group name for ${m.name}:`);
                                                                if (custom && custom.trim()) {
                                                                    await handleMemberGroupChange(m._id, custom.trim());
                                                                }
                                                            }
                                                        }} ref={el => {
                                                            if (el) {
                                                                const parent = el.previousSibling;
                                                                if (parent) {
                                                                    parent.onchange = async (evt) => {
                                                                        if (evt.target.value === 'NEW_GROUP_PROMPT') {
                                                                            const custom = window.prompt(`Enter custom fellowship group name for ${m.name}:`);
                                                                            if (custom && custom.trim()) {
                                                                                await handleMemberGroupChange(m._id, custom.trim());
                                                                            } else {
                                                                                evt.target.value = m.groupName || '';
                                                                            }
                                                                        } else {
                                                                            await handleMemberGroupChange(m._id, evt.target.value);
                                                                        }
                                                                    };
                                                                }
                                                            }
                                                        }} />
                                                    </div>
                                                </td>
                                            ) : (
                                                <td style={{ padding: '1rem', fontSize: '0.82rem', fontWeight: 800, color: m.wateringDays?.length > 0 ? '#10b981' : 'rgba(255,255,255,0.3)' }}>
                                                    {m.wateringDays?.length > 0 ? m.wateringDays.join(', ') : 'None (No Commitment)'}
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <style>{`
                .table-row-hover:hover { background-color: rgba(255, 255, 255, 0.02) !important; }
                select.modern-input { appearance: none; -webkit-appearance: none; }
            `}</style>
        </div>
    );
};

export default ActivitiesTab;
