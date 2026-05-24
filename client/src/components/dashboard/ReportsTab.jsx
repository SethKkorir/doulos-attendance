import React, { useState, useEffect } from 'react';
import { 
    FileSpreadsheet, FileText, Users, Download, ShieldAlert, TrendingUp, 
    PieChart as PieIcon, Award, DollarSign, Calendar, RefreshCw, Activity, 
    MapPin, CheckCircle, AlertTriangle, ArrowRight, HelpCircle
} from 'lucide-react';

const typeColors = {
    Douloid:  { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.15)' },
    Recruit:  { color: '#25AAE1', bg: 'rgba(37,170,225,0.08)',  border: 'rgba(37,170,225,0.15)' },
    Visitor:  { color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.15)' },
    Exempted: { color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.15)' },
};

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const ReportsTab = ({ 
    meetings = [], 
    members = [], 
    onDownloadCSV, 
    onDownloadCumulativeCSV, 
    isGuest, 
    api, 
    setMsg 
}) => {
    const [activeTab, setActiveTab] = useState('overview'); // overview, groups, watering, honors, finance, cumulative
    const [filterCampus, setFilterCampus] = useState('All');
    const [filterSemester, setFilterSemester] = useState('Current');
    
    // Finance specific state
    const [financeStats, setFinanceStats] = useState(null);
    const [loadingFinance, setLoadingFinance] = useState(false);

    // Helpers to resolve semesters
    const getSemester = (date) => {
        const d = new Date(date);
        const month = d.getMonth(); 
        const year = d.getFullYear();
        if (month <= 4) return `Jan Semester ${year}`;
        if (month <= 7) return `May Semester ${year}`;
        return `Sept Semester ${year}`;
    };

    const currentSemester = getSemester(new Date());
    const semesters = Array.from(new Set(meetings.map(m => getSemester(m.date))));
    if (!semesters.includes(currentSemester)) semesters.push(currentSemester);

    // Filters check
    const filteredMeetings = meetings.filter(m => {
        const semesterMatch = filterSemester === 'All' ||
            (filterSemester === 'Current' ? getSemester(m.date) === currentSemester : getSemester(m.date) === filterSemester);
        const campusMatch = filterCampus === 'All' || m.campus === filterCampus;
        return semesterMatch && campusMatch;
    });

    const activeMembers = members.filter(m => m.status === 'Active');
    const filteredMembers = activeMembers.filter(m => {
        const campusMatch = filterCampus === 'All' || m.campus === filterCampus;
        return campusMatch;
    });

    // Stats calculations
    const totalAttendanceCount = filteredMeetings.reduce((acc, m) => acc + (m.attendees || 0), 0);
    const averageAttendance = filteredMeetings.length > 0 ? (totalAttendanceCount / filteredMeetings.length).toFixed(1) : 0;

    // Fetch finance stats dynamically
    useEffect(() => {
        const fetchFinanceStats = async () => {
            if (activeTab === 'finance') {
                setLoadingFinance(true);
                try {
                    if (isGuest) {
                        setFinanceStats({
                            overall: [
                                { _id: 'approved', total: 15400, count: 45 },
                                { _id: 'pending', total: 2200, count: 5 },
                                { _id: 'rejected', total: 500, count: 2 }
                            ],
                            modeStats: [
                                { _id: 'MPESA', total: 12000, count: 30 },
                                { _id: 'Cash', total: 3400, count: 15 }
                            ],
                            monthlyStats: [
                                { _id: 'January', total: 7200 },
                                { _id: 'February', total: 8200 }
                            ]
                        });
                    } else {
                        const res = await api.get('/payments/stats');
                        setFinanceStats(res.data);
                    }
                } catch (err) {
                    console.error("Failed to fetch finance statistics for reports:", err);
                } finally {
                    setLoadingFinance(false);
                }
            }
        };
        fetchFinanceStats();
    }, [activeTab, api, isGuest]);

    // 1. --- DYNAMIC BRANDED A4 PDF ENGINES ---
    const handlePrintOverviewPDF = () => {
        const printHtml = `
            <html>
                <head>
                    <title>Doulos Semester Check-in & Analytics Report</title>
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
                        .header-title h1 { margin: 0; font-size: 1.6rem; font-weight: 900; color: #021525; letter-spacing: -0.5px; }
                        .header-title p { margin: 3px 0 0 0; font-size: 0.8rem; color: #25AAE1; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; }
                        .meta-info { text-align: right; font-size: 0.8rem; color: #64748b; font-weight: 600; line-height: 1.4; }
                        .meta-info strong { color: #0f172a; }
                        .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px; }
                        .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px; text-align: center; }
                        .summary-card h3 { margin: 0 0 5px 0; font-size: 0.7rem; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-weight: 800; }
                        .summary-card div { font-size: 1.6rem; font-weight: 900; color: #25AAE1; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 25px; page-break-inside: avoid; }
                        th { background: #f1f5f9; color: #475569; font-weight: 800; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; padding: 10px 12px; text-align: left; border-bottom: 2px solid #cbd5e1; }
                        td { padding: 9px 12px; font-size: 0.8rem; border-bottom: 1px solid #e2e8f0; color: #334155; }
                        .footer { width: 100%; border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 30px; display: flex; justify-content: space-between; font-size: 0.7rem; color: #94a3b8; font-weight: 600; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="logo-container">
                            <img src="${window.location.origin}/logo.png" class="logo-img" alt="Doulos" />
                            <div class="header-title">
                                <h1>Semester Analytics & Trends</h1>
                                <p>Check-in Performance Summary</p>
                            </div>
                        </div>
                        <div class="meta-info">
                            Semester: <strong>${filterSemester === 'Current' ? currentSemester : filterSemester}</strong><br/>
                            Campus Filter: <strong>${filterCampus}</strong><br/>
                            Generated: <strong>${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                        </div>
                    </div>

                    <div class="summary-grid">
                        <div class="summary-card">
                            <h3>Total Sessions Attended</h3>
                            <div>${totalAttendanceCount}</div>
                        </div>
                        <div class="summary-card">
                            <h3>Total Active Class Sessions</h3>
                            <div>${filteredMeetings.length}</div>
                        </div>
                        <div class="summary-card">
                            <h3>Average Check-ins Rate</h3>
                            <div>${averageAttendance} students/session</div>
                        </div>
                    </div>

                    <h2 style="font-size: 1.1rem; font-weight: 900; margin-bottom: 12px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px;">Class Sessions Roster</h2>
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 25%">Session Date</th>
                                <th style="width: 40%">Session Title</th>
                                <th style="width: 20%">Campus Location</th>
                                <th style="width: 15%">Attendees</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredMeetings.map(m => `
                                <tr>
                                    <td style="font-family: monospace; font-weight: 700; color: #021525">${new Date(m.date).toLocaleDateString()}</td>
                                    <td style="font-weight: 700;">${m.name}</td>
                                    <td>${m.campus}</td>
                                    <td style="font-weight: 800; color: #25AAE1">${m.attendees || 0} checked</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <div class="footer">
                        <span>Doulos Leaders In Service Systems - Analytics Report</span>
                        <span>Page 1 of 1</span>
                    </div>
                    <script>
                        window.onload = () => { setTimeout(() => { window.print(); }, 500); };
                    </script>
                </body>
            </html>
        `;
        const win = window.open('', '_blank');
        win.document.write(printHtml);
        win.document.close();
    };

    const handlePrintFellowshipPDF = () => {
        const groups = Array.from(new Set(filteredMembers.map(m => m.groupName).filter(Boolean))).sort();
        const printHtml = `
            <html>
                <head>
                    <title>Doulos Fellowship Groups Audit Sheet</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap');
                        @page { size: A4; margin: 15mm; }
                        body { 
                            font-family: 'Plus Jakarta Sans', sans-serif;
                            margin: 0; padding: 0; background: #ffffff;
                            color: #0f172a; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
                        }
                        .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #3b82f6; padding-bottom: 12px; margin-bottom: 25px; }
                        .logo-container { display: flex; align-items: center; gap: 15px; }
                        .logo-img { width: 65px; height: 65px; object-fit: contain; }
                        .header-title h1 { margin: 0; font-size: 1.6rem; font-weight: 900; color: #021525; letter-spacing: -0.5px; }
                        .header-title p { margin: 3px 0 0 0; font-size: 0.8rem; color: #3b82f6; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; }
                        .meta-info { text-align: right; font-size: 0.8rem; color: #64748b; font-weight: 600; line-height: 1.4; }
                        .meta-info strong { color: #0f172a; }
                        .group-section { margin-bottom: 35px; page-break-inside: avoid; }
                        .group-title { font-size: 1.05rem; font-weight: 900; color: #ffffff; background: #1e3a8a; padding: 8px 15px; border-radius: 8px; margin-bottom: 12px; display: flex; justify-content: space-between; }
                        .group-badge { font-size: 0.75rem; background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 20px; font-weight: 700; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
                        th { background: #f1f5f9; color: #475569; font-weight: 800; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; padding: 10px 12px; text-align: left; border-bottom: 2px solid #cbd5e1; }
                        td { padding: 9px 12px; font-size: 0.8rem; border-bottom: 1px solid #e2e8f0; color: #334155; }
                        .footer { width: 100%; border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 30px; display: flex; justify-content: space-between; font-size: 0.7rem; color: #94a3b8; font-weight: 600; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="logo-container">
                            <img src="${window.location.origin}/logo.png" class="logo-img" alt="Doulos" />
                            <div class="header-title">
                                <h1>Fellowship Groups Audit</h1>
                                <p>Groups Attendance & Roster Sheets</p>
                            </div>
                        </div>
                        <div class="meta-info">
                            Semester: <strong>${filterSemester === 'Current' ? currentSemester : filterSemester}</strong><br/>
                            Campus Filter: <strong>${filterCampus}</strong><br/>
                            Generated: <strong>${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                        </div>
                    </div>

                    ${groups.length === 0 ? '<p style="text-align:center; padding: 3rem; color: #64748b;">No fellowship groups registered yet.</p>' : groups.map(group => {
                        const membersInGroup = filteredMembers.filter(m => m.groupName === group);
                        const totalGroupCheckins = membersInGroup.reduce((acc, m) => acc + (m.totalAttended || 0), 0);
                        const maxPossible = membersInGroup.length * filteredMeetings.length;
                        const groupAvgPct = maxPossible > 0 ? ((totalGroupCheckins / maxPossible) * 100).toFixed(0) : 0;
                        
                        return `
                            <div class="group-section">
                                <div class="group-title">
                                    <span>${group.toUpperCase()}</span>
                                    <span class="group-badge">${membersInGroup.length} Students | Avg. ${groupAvgPct}% Attended</span>
                                </div>
                                <table>
                                    <thead>
                                        <tr>
                                            <th style="width: 40%">Student Name</th>
                                            <th style="width: 25%">Admission No.</th>
                                            <th style="width: 20%">Campus Location</th>
                                            <th style="width: 15%">Check-ins</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${membersInGroup.map(m => `
                                            <tr>
                                                <td style="font-weight: 700; color: #0f172a">${m.name}</td>
                                                <td style="font-family: monospace; font-weight: 600">${m.studentRegNo}</td>
                                                <td>${m.campus}</td>
                                                <td style="font-weight: 800; color: #3b82f6">${m.totalAttended || 0} / ${filteredMeetings.length} sessions</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        `;
                    }).join('')}

                    <div class="footer">
                        <span>Doulos Leaders In Service Systems - Fellowship Audit Sheet</span>
                        <span>Page 1 of 1</span>
                    </div>
                    <script>
                        window.onload = () => { setTimeout(() => { window.print(); }, 500); };
                    </script>
                </body>
            </html>
        `;
        const win = window.open('', '_blank');
        win.document.write(printHtml);
        win.document.close();
    };

    const handlePrintWateringPDF = () => {
        const wateringStats = weekdays.map(day => {
            const committed = filteredMembers.filter(m => m.wateringDays?.includes(day));
            return { day, count: committed.length, members: committed };
        });

        const printHtml = `
            <html>
                <head>
                    <title>Doulos Tree Watering Commitments Report</title>
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
                        .header-title h1 { margin: 0; font-size: 1.6rem; font-weight: 900; color: #021525; letter-spacing: -0.5px; }
                        .header-title p { margin: 3px 0 0 0; font-size: 0.8rem; color: #10b981; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; }
                        .meta-info { text-align: right; font-size: 0.8rem; color: #64748b; font-weight: 600; line-height: 1.4; }
                        .meta-info strong { color: #0f172a; }
                        .heatmap { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; margin-bottom: 30px; }
                        .heatmap-card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; text-align: center; background: #f8fafc; }
                        .day-title { font-size: 0.65rem; font-weight: 900; text-transform: uppercase; color: #64748b; margin-bottom: 3px; }
                        .count-lbl { font-size: 1.3rem; font-weight: 900; color: #10b981; }
                        .day-section { margin-bottom: 25px; page-break-inside: avoid; }
                        .day-header { font-size: 1rem; font-weight: 900; color: #ffffff; background: #064e3b; padding: 6px 12px; border-radius: 6px; margin-bottom: 10px; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
                        th { background: #f1f5f9; color: #475569; font-weight: 800; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; padding: 10px 12px; text-align: left; border-bottom: 2px solid #cbd5e1; }
                        td { padding: 9px 12px; font-size: 0.8rem; border-bottom: 1px solid #e2e8f0; color: #334155; }
                        .footer { width: 100%; border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 30px; display: flex; justify-content: space-between; font-size: 0.7rem; color: #94a3b8; font-weight: 600; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="logo-container">
                            <img src="${window.location.origin}/logo.png" class="logo-img" alt="Doulos" />
                            <div class="header-title">
                                <h1>Tree Watering Schedule</h1>
                                <p>Freedom Base Commitment Roster</p>
                            </div>
                        </div>
                        <div class="meta-info">
                            Semester: <strong>${filterSemester === 'Current' ? currentSemester : filterSemester}</strong><br/>
                            Campus Filter: <strong>${filterCampus}</strong><br/>
                            Generated: <strong>${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                        </div>
                    </div>

                    <h2 style="font-size: 1rem; font-weight: 900; margin-bottom: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px;">Coverage Heatmap</h2>
                    <div class="heatmap">
                        ${wateringStats.map(w => `
                            <div class="heatmap-card">
                                <div class="day-title">${w.day.slice(0,3)}</div>
                                <div class="count-lbl">${w.count}</div>
                                <div style="font-size: 0.58rem; color: #64748b; font-weight: 700;">Waterers</div>
                            </div>
                        `).join('')}
                    </div>

                    <h2 style="font-size: 1rem; font-weight: 900; margin-bottom: 12px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px;">Watering Days Directory</h2>
                    ${wateringStats.map(w => `
                        <div class="day-section">
                            <div class="day-header">${w.day.toUpperCase()} (${w.count} Waterers Committed)</div>
                            ${w.count === 0 ? '<p style="font-size:0.75rem; color:#ef4444; font-weight:700; margin: 5px 10px;">⚠️ CRITICAL: Zero students committed for tree-watering on this day.</p>' : `
                            <table>
                                <thead>
                                    <tr>
                                        <th style="width: 40%">Student Name</th>
                                        <th style="width: 25%">Admission No.</th>
                                        <th style="width: 20%">Campus Location</th>
                                        <th style="width: 15%">Category</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${w.members.map(m => `
                                        <tr>
                                            <td style="font-weight: 700; color: #0f172a">${m.name}</td>
                                            <td style="font-family: monospace; font-weight: 600">${m.studentRegNo}</td>
                                            <td>${m.campus}</td>
                                            <td style="font-weight: 800; color: #10b981">${m.memberType}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                            `}
                        </div>
                    `).join('')}

                    <div class="footer">
                        <span>Doulos Leaders In Service Systems - Watering Schedule Report</span>
                        <span>Page 1 of 1</span>
                    </div>
                    <script>
                        window.onload = () => { setTimeout(() => { window.print(); }, 500); };
                    </script>
                </body>
            </html>
        `;
        const win = window.open('', '_blank');
        win.document.write(printHtml);
        win.document.close();
    };

    const handlePrintHonorsPDF = () => {
        const sortedLeaderboard = [...filteredMembers].sort((a,b) => (b.totalAttended || 0) - (a.totalAttended || 0));
        const atRiskMembers = filteredMembers.filter(m => !m.totalAttended || m.totalAttended === 0);

        const printHtml = `
            <html>
                <head>
                    <title>Doulos Class Honors Roll & At-Risk Audit Sheet</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap');
                        @page { size: A4; margin: 15mm; }
                        body { 
                            font-family: 'Plus Jakarta Sans', sans-serif;
                            margin: 0; padding: 0; background: #ffffff;
                            color: #0f172a; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
                        }
                        .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #fbbf24; padding-bottom: 12px; margin-bottom: 25px; }
                        .logo-container { display: flex; align-items: center; gap: 15px; }
                        .logo-img { width: 65px; height: 65px; object-fit: contain; }
                        .header-title h1 { margin: 0; font-size: 1.6rem; font-weight: 900; color: #021525; letter-spacing: -0.5px; }
                        .header-title p { margin: 3px 0 0 0; font-size: 0.8rem; color: #d97706; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; }
                        .meta-info { text-align: right; font-size: 0.8rem; color: #64748b; font-weight: 600; line-height: 1.4; }
                        .meta-info strong { color: #0f172a; }
                        .sec-title { font-size: 1.1rem; font-weight: 900; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; margin: 25px 0 12px 0; color: #021525; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
                        th { background: #f1f5f9; color: #475569; font-weight: 800; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; padding: 10px 12px; text-align: left; border-bottom: 2px solid #cbd5e1; }
                        td { padding: 9px 12px; font-size: 0.8rem; border-bottom: 1px solid #e2e8f0; color: #334155; }
                        .footer { width: 100%; border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 30px; display: flex; justify-content: space-between; font-size: 0.7rem; color: #94a3b8; font-weight: 600; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="logo-container">
                            <img src="${window.location.origin}/logo.png" class="logo-img" alt="Doulos" />
                            <div class="header-title">
                                <h1>Consistency Honors & Check-in Audit</h1>
                                <p>Student Engagement Ledgers</p>
                            </div>
                        </div>
                        <div class="meta-info">
                            Semester: <strong>${filterSemester === 'Current' ? currentSemester : filterSemester}</strong><br/>
                            Campus Filter: <strong>${filterCampus}</strong><br/>
                            Generated: <strong>${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                        </div>
                    </div>

                    <h2 class="sec-title" style="margin-top:0;">Attendance check-in Leaderboard</h2>
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 5%">#</th>
                                <th style="width: 35%">Student Name</th>
                                <th style="width: 25%">Admission No.</th>
                                <th style="width: 20%">Campus Location</th>
                                <th style="width: 15%">Check-in Rate</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sortedLeaderboard.map((m, idx) => {
                                const rate = filteredMeetings.length > 0 ? ((m.totalAttended || 0) / filteredMeetings.length * 100).toFixed(0) : 0;
                                return `
                                    <tr>
                                        <td style="font-weight:800; color:#d97706">${idx + 1}</td>
                                        <td style="font-weight: 700; color: #0f172a">${m.name}</td>
                                        <td style="font-family: monospace; font-weight: 600">${m.studentRegNo}</td>
                                        <td>${m.campus}</td>
                                        <td style="font-weight: 800; color: #d97706">${m.totalAttended || 0} / ${filteredMeetings.length} (${rate}%)</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>

                    <h2 class="sec-title">At-Risk Alerts (0 Check-ins)</h2>
                    ${atRiskMembers.length === 0 ? '<p style="font-size:0.8rem; color:#10b981; font-weight:700;">🟢 Perfect! No students logged with 0 check-ins this semester.</p>' : `
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 40%">Student Name</th>
                                <th style="width: 25%">Admission No.</th>
                                <th style="width: 20%">Campus Location</th>
                                <th style="width: 15%">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${atRiskMembers.map(m => `
                                <tr>
                                    <td style="font-weight: 700; color: #ef4444">${m.name}</td>
                                    <td style="font-family: monospace; font-weight: 600">${m.studentRegNo}</td>
                                    <td>${m.campus}</td>
                                    <td style="font-weight: 800; color: #ef4444">0 Check-ins ⚠️</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    `}

                    <div class="footer">
                        <span>Doulos Leaders In Service Systems - Consistency Ledger Report</span>
                        <span>Page 1 of 1</span>
                    </div>
                    <script>
                        window.onload = () => { setTimeout(() => { window.print(); }, 500); };
                    </script>
                </body>
            </html>
        `;
        const win = window.open('', '_blank');
        win.document.write(printHtml);
        win.document.close();
    };

    const handlePrintFinancePDF = () => {
        if (!financeStats) return alert("Finance logs sync pending...");
        const approvedTotal = financeStats.overall?.find(o => o._id === 'approved')?.total || 0;
        const pendingCount = financeStats.overall?.find(o => o._id === 'pending')?.count || 0;

        const printHtml = `
            <html>
                <head>
                    <title>Doulos Community Contribution Ledger Sheet</title>
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
                        .header-title h1 { margin: 0; font-size: 1.6rem; font-weight: 900; color: #021525; letter-spacing: -0.5px; }
                        .header-title p { margin: 3px 0 0 0; font-size: 0.8rem; color: #10b981; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; }
                        .meta-info { text-align: right; font-size: 0.8rem; color: #64748b; font-weight: 600; line-height: 1.4; }
                        .meta-info strong { color: #0f172a; }
                        .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px; }
                        .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px; text-align: center; }
                        .summary-card h3 { margin: 0 0 5px 0; font-size: 0.7rem; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-weight: 800; }
                        .summary-card div { font-size: 1.5rem; font-weight: 900; color: #10b981; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 25px; page-break-inside: avoid; }
                        th { background: #f1f5f9; color: #475569; font-weight: 800; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; padding: 10px 12px; text-align: left; border-bottom: 2px solid #cbd5e1; }
                        td { padding: 9px 12px; font-size: 0.8rem; border-bottom: 1px solid #e2e8f0; color: #334155; }
                        .footer { width: 100%; border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 30px; display: flex; justify-content: space-between; font-size: 0.7rem; color: #94a3b8; font-weight: 600; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="logo-container">
                            <img src="${window.location.origin}/logo.png" class="logo-img" alt="Doulos" />
                            <div class="header-title">
                                <h1>Finance Contribution Ledger</h1>
                                <p>Semester Collections & Mode Audits</p>
                            </div>
                        </div>
                        <div class="meta-info">
                            Semester: <strong>${filterSemester === 'Current' ? currentSemester : filterSemester}</strong><br/>
                            Generated: <strong>${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                        </div>
                    </div>

                    <div class="summary-grid">
                        <div class="summary-card">
                            <h3>Approved Collections</h3>
                            <div>Ksh ${approvedTotal.toLocaleString()}</div>
                        </div>
                        <div class="summary-card">
                            <h3>Awaiting Verification</h3>
                            <div style="color: #d97706">${pendingCount} records</div>
                        </div>
                        <div class="summary-card">
                            <h3>Contribution Methods Count</h3>
                            <div style="color: #25AAE1">${financeStats.modeStats?.length || 0} channels</div>
                        </div>
                    </div>

                    <h2 style="font-size: 1.05rem; font-weight: 900; margin-bottom: 12px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; color: #021525;">Collections breakdown by Mode</h2>
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 40%">Payment Mode</th>
                                <th style="width: 30%">Total Collections</th>
                                <th style="width: 30%">Transactions Count</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${financeStats.modeStats?.map(m => `
                                <tr>
                                    <td style="font-weight: 700; color: #021525">${m._id}</td>
                                    <td style="font-weight: 800; color: #10b981">Ksh ${m.total.toLocaleString()}</td>
                                    <td style="font-family: monospace; font-weight: 600">${m.count} logs</td>
                                </tr>
                            `).join('') || '<tr><td colspan="3" style="text-align:center;">No payment mode stats found.</td></tr>'}
                        </tbody>
                    </table>

                    <div class="footer">
                        <span>Doulos Leaders In Service Systems - Finance Audit Ledger</span>
                        <span>Page 1 of 1</span>
                    </div>
                    <script>
                        window.onload = () => { setTimeout(() => { window.print(); }, 500); };
                    </script>
                </body>
            </html>
        `;
        const win = window.open('', '_blank');
        win.document.write(printHtml);
        win.document.close();
    };

    // 2. --- DYNAMIC CSV EXPORTERS ---
    const handleExportOverviewCSV = () => {
        try {
            const headers = ['Date', 'Session Title', 'Campus Location', 'Attendees Checked'];
            const csvContent = [
                headers.join(','),
                ...filteredMeetings.map(m => [
                    `"${new Date(m.date).toLocaleDateString()}"`,
                    `"${m.name || 'Session'}"`,
                    `"${m.campus}"`,
                    m.attendees || 0
                ].join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.setAttribute('download', `Doulos_Session_Checkins_Roster_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setMsg({ type: 'success', text: 'Check-in sessions CSV exported successfully!' });
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to export check-in sessions CSV' });
        }
    };

    const handleExportFellowshipCSV = () => {
        try {
            const headers = ['Student Name', 'Registration Number', 'Campus', 'Category', 'Assigned Fellowship Group', 'Total Attendance'];
            const csvContent = [
                headers.join(','),
                ...filteredMembers.map(m => [
                    `"${m.name}"`,
                    `"${m.studentRegNo}"`,
                    `"${m.campus}"`,
                    `"${m.memberType || 'Visitor'}"`,
                    `"${m.groupName || 'Unassigned'}"`,
                    m.totalAttended || 0
                ].join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.setAttribute('download', `Doulos_Fellowship_Groups_Audit_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setMsg({ type: 'success', text: 'Fellowship Groups CSV exported successfully!' });
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to export groups audit CSV' });
        }
    };

    const handleExportHonorsCSV = () => {
        try {
            const headers = ['Student Name', 'Registration Number', 'Campus', 'Category', 'Total Check-ins', 'Check-in Percentage Rate'];
            const csvContent = [
                headers.join(','),
                ...filteredMembers.map(m => {
                    const rate = filteredMeetings.length > 0 ? ((m.totalAttended || 0) / filteredMeetings.length * 100).toFixed(0) : 0;
                    return [
                        `"${m.name}"`,
                        `"${m.studentRegNo}"`,
                        `"${m.campus}"`,
                        `"${m.memberType || 'Visitor'}"`,
                        m.totalAttended || 0,
                        `"${rate}%"`
                    ].join(',');
                })
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.setAttribute('download', `Doulos_Honors_Consistency_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setMsg({ type: 'success', text: 'Honors Consistency CSV exported successfully!' });
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to export consistency CSV' });
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', animation: 'fadeIn 0.5s ease-out' }}>
            
            {/* 3. --- HEADER TAB NAVIGATION --- */}
            <div className="glass-card-premium" style={{ padding: '2rem', background: '#0d111b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{ padding: '1rem', background: 'rgba(37, 170, 225, 0.12)', borderRadius: '1rem', border: '1px solid rgba(37, 170, 225, 0.2)' }}>
                            <FileSpreadsheet size={28} color="#25AAE1" />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: 'white' }}>Reports & Analytics</h2>
                            <p style={{ margin: 0, color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem' }}>Compile, audit, and print premium multi-category Doulos sheets</p>
                        </div>
                    </div>
                    
                    {/* Controls & Filters */}
                    <div style={{ display: 'flex', gap: '0.75rem', background: 'rgba(0,0,0,0.2)', padding: '0.35rem', borderRadius: '0.75rem', flexWrap: 'wrap' }}>
                        <select
                            className="modern-input"
                            style={{ padding: '0.5rem 1rem', width: 'auto', border: 'none', background: 'rgba(255,255,255,0.03)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                            value={filterSemester}
                            onChange={(e) => setFilterSemester(e.target.value)}
                        >
                            <option value="Current">This Semester</option>
                            <option value="All">All Time Semesters</option>
                            {semesters.filter(s => s !== currentSemester).map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                        <select
                            className="modern-input"
                            style={{ padding: '0.5rem 1rem', width: 'auto', border: 'none', background: 'rgba(255,255,255,0.03)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                            value={filterCampus}
                            onChange={(e) => setFilterCampus(e.target.value)}
                        >
                            <option value="All">All Campuses</option>
                            <option value="Athi River">Athi River</option>
                            <option value="Valley Road">Valley Road</option>
                        </select>
                    </div>
                </div>

                {/* Sub Tab Controls */}
                <div style={{ display: 'flex', gap: '0.35rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.25rem', flexWrap: 'wrap' }}>
                    {[
                        { id: 'overview', label: 'Semester Trends', icon: TrendingUp, activeColor: '#25AAE1', bg: 'rgba(37, 170, 225, 0.12)', border: 'rgba(37, 170, 225, 0.2)' },
                        { id: 'groups', label: 'Fellowship Groups', icon: Users, activeColor: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.2)' },
                        { id: 'watering', label: 'Tree Watering', icon: Activity, activeColor: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.2)' },
                        { id: 'honors', label: 'Consistency Honors', icon: Award, activeColor: '#facc15', bg: 'rgba(250, 204, 21, 0.12)', border: 'rgba(250, 204, 21, 0.2)' },
                        { id: 'finance', label: 'Contributions Ledger', icon: DollarSign, activeColor: '#a78bfa', bg: 'rgba(167, 139, 250, 0.12)', border: 'rgba(167, 139, 250, 0.2)' },
                        { id: 'cumulative', label: 'Compile Exports', icon: Download, activeColor: '#4ade80', bg: 'rgba(74, 222, 128, 0.12)', border: 'rgba(74, 222, 128, 0.2)' }
                    ].map(tab => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    padding: '0.55rem 1.1rem',
                                    background: isActive ? tab.bg : 'transparent',
                                    color: isActive ? tab.activeColor : 'var(--color-text-dim, rgba(255,255,255,0.4))',
                                    border: isActive ? `1px solid ${tab.border}` : '1px solid transparent',
                                    fontSize: '0.78rem', fontWeight: 800, borderRadius: '0.5rem', cursor: 'pointer', 
                                    display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.2s'
                                }}
                            >
                                <tab.icon size={14} /> {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 4. --- TAB DIRECTORY RENDERING CONTENT --- */}

            {/* A. OVERVIEW & TRENDS TAB */}
            {activeTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', animation: 'fadeIn 0.3s' }}>
                    
                    {/* Stats KPI Widgets */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
                        <div className="glass-card-premium" style={{ padding: '1.5rem', borderLeft: '4px solid #25AAE1', background: '#0d111b' }}>
                            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-dim, rgba(255,255,255,0.4))', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>TOTAL ATTENDED CHECK-INS</div>
                            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--color-text, white)', marginTop: '0.5rem' }}>{totalAttendanceCount}</div>
                        </div>
                        <div className="glass-card-premium" style={{ padding: '1.5rem', borderLeft: '4px solid #a78bfa', background: '#0d111b' }}>
                            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-dim, rgba(255,255,255,0.4))', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>SESSIONS COUNT</div>
                            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--color-text, white)', marginTop: '0.5rem' }}>{filteredMeetings.length}</div>
                        </div>
                        <div className="glass-card-premium" style={{ padding: '1.5rem', borderLeft: '4px solid #4ade80', background: '#0d111b' }}>
                            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-dim, rgba(255,255,255,0.4))', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>AVERAGE PARTICIPATION RATE</div>
                            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#4ade80', marginTop: '0.5rem' }}>{averageAttendance} <span style={{ fontSize: '0.9rem', color: 'var(--color-text-dim)' }}>students/session</span></div>
                        </div>
                    </div>

                    {/* Comparative Campus breakdown */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                        
                        {/* Custom CSS Bar chart of Session check-ins */}
                        <div className="glass-card-premium" style={{ padding: '2rem', background: '#0d111b', minHeight: '340px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: 'var(--color-text, white)' }}>Check-in Trend History</h3>
                                <p style={{ color: 'var(--color-text-dim, rgba(255,255,255,0.4))', fontSize: '0.8rem', marginTop: '0.2rem' }}>Attendance checked across individual semester classes</p>
                            </div>

                            {filteredMeetings.length === 0 ? (
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-dim)', fontSize: '0.85rem' }}>No session logs available.</div>
                            ) : (
                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'flex-end', 
                                    justifyContent: 'space-between', 
                                    height: '180px', 
                                    gap: '0.5rem', 
                                    padding: '1.5rem 0.5rem 0.5rem 0.5rem',
                                    borderBottom: '1px solid rgba(255,255,255,0.06)'
                                }}>
                                    {filteredMeetings.slice(-8).map((m, idx) => {
                                        // Find max to scale relatively
                                        const maxAttended = Math.max(...filteredMeetings.map(x => x.attendees || 1));
                                        const barHeightPct = ((m.attendees || 0) / maxAttended) * 80 + 5; // offset slightly
                                        return (
                                            <div 
                                                key={m._id || idx} 
                                                style={{ 
                                                    flex: 1, 
                                                    display: 'flex', 
                                                    flexDirection: 'column', 
                                                    alignItems: 'center', 
                                                    height: '100%', 
                                                    justifyContent: 'flex-end',
                                                    position: 'relative'
                                                }}
                                                className="bar-container-hover"
                                            >
                                                {/* Tooltip on hover */}
                                                <div className="chart-bar-tooltip" style={{
                                                    position: 'absolute', bottom: `${barHeightPct + 12}%`, background: '#090d16',
                                                    border: '1px solid rgba(37, 170, 225, 0.3)', color: 'white', borderRadius: '0.35rem',
                                                    padding: '0.3rem 0.5rem', fontSize: '0.62rem', fontWeight: 900, whiteSpace: 'nowrap', zIndex: 10
                                                }}>
                                                    {m.name}: {m.attendees} Checked
                                                </div>

                                                <div style={{ 
                                                    width: '100%', 
                                                    maxHeight: '100%',
                                                    height: `${barHeightPct}%`, 
                                                    background: 'linear-gradient(to top, rgba(37, 170, 225, 0.1) 0%, #25AAE1 100%)', 
                                                    borderRadius: '0.35rem 0.35rem 0 0',
                                                    border: '1px solid rgba(37, 170, 225, 0.25)',
                                                    transition: 'all 0.3s ease',
                                                    cursor: 'pointer'
                                                }} />
                                                <span style={{ fontSize: '0.6rem', color: 'var(--color-text-dim, rgba(255,255,255,0.4))', fontWeight: 800, marginTop: '0.35rem', whiteSpace: 'nowrap' }}>
                                                    {new Date(m.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Campus Breakdown progress bar */}
                        <div className="glass-card-premium" style={{ padding: '2rem', background: '#0d111b', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: 'var(--color-text, white)' }}>Campus Distribution Audit</h3>
                                <p style={{ color: 'var(--color-text-dim, rgba(255,255,255,0.4))', fontSize: '0.8rem', marginTop: '0.2rem' }}>Attendance breakdown between active campus nodes</p>
                            </div>

                            {(() => {
                                const athiTotal = filteredMeetings.filter(m => m.campus === 'Athi River').reduce((acc, m) => acc + (m.attendees || 0), 0);
                                const vrTotal = filteredMeetings.filter(m => m.campus === 'Valley Road').reduce((acc, m) => acc + (m.attendees || 0), 0);
                                const combined = athiTotal + vrTotal || 1;
                                const athiPct = ((athiTotal / combined) * 100).toFixed(0);
                                const vrPct = ((vrTotal / combined) * 100).toFixed(0);

                                return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--color-text, white)' }}>
                                                <span>Athi River Campus</span>
                                                <span style={{ color: '#25AAE1' }}>{athiTotal} Check-ins ({athiPct}%)</span>
                                            </div>
                                            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                <div style={{ width: `${athiPct}%`, height: '100%', background: 'linear-gradient(to right, rgba(37,170,225,0.3) 0%, #25AAE1 100%)', borderRadius: '10px' }} />
                                            </div>
                                        </div>

                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--color-text, white)' }}>
                                                <span>Valley Road Campus</span>
                                                <span style={{ color: '#a78bfa' }}>{vrTotal} Check-ins ({vrPct}%)</span>
                                            </div>
                                            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                <div style={{ width: `${vrPct}%`, height: '100%', background: 'linear-gradient(to right, rgba(167,139,250,0.3) 0%, #a78bfa 100%)', borderRadius: '10px' }} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                                <button onClick={handlePrintOverviewPDF} className="btn btn-primary" style={{ flex: 1, padding: '0.6rem', fontSize: '0.78rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                                    <FileText size={14} /> Print PDF Report
                                </button>
                                <button onClick={handleExportOverviewCSV} className="btn" style={{ flex: 1, padding: '0.6rem', fontSize: '0.78rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'white' }}>
                                    <Download size={14} /> Export CSV
                                </button>
                            </div>
                        </div>

                    </div>

                    {/* Table of Session list */}
                    <div className="glass-card-premium" style={{ padding: '0', overflow: 'hidden', border: '1px solid rgba(29, 166, 217, 0.15)' }}>
                        <div style={{ padding: '1.25rem 1.5rem', background: 'rgba(2, 21, 37, 0.4)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: 'white' }}>Semester Sessions Registry</h3>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                        <th style={{ padding: '0.85rem 1rem', color: 'var(--color-text-dim, rgba(255,255,255,0.4))', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Session Date</th>
                                        <th style={{ padding: '0.85rem 1rem', color: 'var(--color-text-dim, rgba(255,255,255,0.4))', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Session Title</th>
                                        <th style={{ padding: '0.85rem 1rem', color: 'var(--color-text-dim, rgba(255,255,255,0.4))', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Campus Location</th>
                                        <th style={{ padding: '0.85rem 1rem', color: 'var(--color-text-dim, rgba(255,255,255,0.4))', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Attendees Checked</th>
                                        <th style={{ padding: '0.85rem 1rem', color: 'var(--color-text-dim, rgba(255,255,255,0.4))', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredMeetings.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-dim, rgba(255,255,255,0.4))', fontSize: '0.9rem' }}>
                                                No check-in session records found.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredMeetings.map(m => (
                                            <tr key={m._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }} className="table-row-hover">
                                                <td style={{ padding: '1rem', fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-text, white)' }}>{new Date(m.date).toLocaleDateString()}</td>
                                                <td style={{ padding: '1rem', fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-text, white)' }}>{m.name}</td>
                                                <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--color-text-dim, rgba(255,255,255,0.5))' }}>{m.campus}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span style={{ color: '#25AAE1', fontWeight: 900, background: 'rgba(37,170,225,0.1)', border: '1px solid rgba(37,170,225,0.15)', padding: '0.25rem 0.65rem', borderRadius: '0.5rem', fontSize: '0.8rem' }}>{m.attendees || 0}</span>
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                    <button onClick={() => onDownloadCSV(m._id, m.name)} className="btn" style={{ fontSize: '0.75rem', padding: '0.45rem 1rem', background: 'rgba(255,255,255,0.03)', color: 'white', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '0.5rem', fontWeight: 800, cursor: 'pointer' }}>
                                                        Download CSV
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            )}

            {/* B. FELLOWSHIP GROUPS TAB */}
            {activeTab === 'groups' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', animation: 'fadeIn 0.3s' }}>
                    
                    {/* Groups statistics header */}
                    <div className="glass-card-premium" style={{ padding: '2rem', background: '#0d111b', borderLeft: '4px solid #3b82f6' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: 'var(--color-text, white)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Users size={20} color="#3b82f6" /> Fellowship Groups Attendance Audit
                                </h3>
                                <p style={{ color: 'var(--color-text-dim, rgba(255,255,255,0.4))', fontSize: '0.82rem', marginTop: '0.4rem', lineHeight: 1.4 }}>
                                    Calculates the average check-in indices across active fellowship classes. Move, audit, and analyze member rosters below.
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button onClick={handlePrintFellowshipPDF} className="btn btn-primary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.78rem', fontWeight: 800, background: 'linear-gradient(135deg, #3b82f6 0%, #1e3a8a 100%)', border: '1px solid rgba(59, 130, 246, 0.3)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <FileText size={14} /> Print Audit Sheet
                                </button>
                                <button onClick={handleExportFellowshipCSV} className="btn" style={{ padding: '0.6rem 1.2rem', fontSize: '0.78rem', fontWeight: 800, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <Download size={14} /> Export CSV
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Group Grid cards */}
                    {(() => {
                        const groups = Array.from(new Set(filteredMembers.map(m => m.groupName).filter(Boolean))).sort();
                        if (groups.length === 0) {
                            return <div className="glass-card-premium" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-dim)', fontWeight: 600 }}>No fellowship groups assigned yet. Create groups under "Activities & Groups" center first!</div>;
                        }
                        return (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                                {groups.map(group => {
                                    const membersInGroup = filteredMembers.filter(m => m.groupName === group);
                                    const totalGroupCheckins = membersInGroup.reduce((acc, m) => acc + (m.totalAttended || 0), 0);
                                    const maxPossible = membersInGroup.length * filteredMeetings.length;
                                    const groupAvgPct = maxPossible > 0 ? ((totalGroupCheckins / maxPossible) * 100).toFixed(0) : 0;
                                    
                                    return (
                                        <div key={group} className="glass-card-premium" style={{ padding: '1.5rem', background: '#0d111b', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem' }}>
                                                <div>
                                                    <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: 'white' }}>{group}</h4>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-dim, rgba(255,255,255,0.45))', fontWeight: 600 }}>{membersInGroup.length} students assigned</span>
                                                </div>
                                                <div style={{ background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.25)', color: '#3b82f6', padding: '0.3rem 0.65rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 900 }}>
                                                    {groupAvgPct}% Attended
                                                </div>
                                            </div>

                                            {/* Minimalist Roster preview */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, maxHeight: '180px', overflowY: 'auto' }}>
                                                {membersInGroup.map(m => {
                                                    const tc = typeColors[m.memberType || 'Visitor'] || typeColors.Visitor;
                                                    return (
                                                        <div key={m._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.5rem', background: 'rgba(255,255,255,0.01)', borderRadius: '0.35rem', border: '1px solid rgba(255,255,255,0.03)' }}>
                                                            <div>
                                                                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text, white)' }}>{m.name}</span>
                                                                <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--color-text-dim, rgba(255,255,255,0.4))' }}>{m.studentRegNo}</span>
                                                            </div>
                                                            <span style={{ fontSize: '0.62rem', fontWeight: 900, background: tc.bg, color: tc.color, border: `1px solid ${tc.border}`, padding: '0.1rem 0.4rem', borderRadius: '1rem', textTransform: 'uppercase' }}>
                                                                {m.memberType}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })()}

                </div>
            )}

            {/* C. TREE WATERING TAB */}
            {activeTab === 'watering' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', animation: 'fadeIn 0.3s' }}>
                    
                    <div className="glass-card-premium" style={{ padding: '2rem', background: '#0d111b', borderLeft: '4px solid #10b981' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: 'var(--color-text, white)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Activity size={20} color="#10b981" /> Tree Watering Roster & Heatmap Report
                                </h3>
                                <p style={{ color: 'var(--color-text-dim, rgba(255,255,255,0.4))', fontSize: '0.82rem', marginTop: '0.4rem', lineHeight: 1.4 }}>
                                    Displays weekly tree-watering physical coverage status at Freedom Base. Highlights critical days that require reinforcements.
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button onClick={handlePrintWateringPDF} className="btn btn-primary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.78rem', fontWeight: 800, background: 'linear-gradient(135deg, #10b981 0%, #064e3b 100%)', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <FileText size={14} /> Print Commitment Sheet
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Coverage Heatmap & Critical Day Alert */}
                    {(() => {
                        const wateringStats = weekdays.map(day => {
                            const committed = filteredMembers.filter(m => m.wateringDays?.includes(day));
                            return { day, count: committed.length, members: committed };
                        });
                        const criticalDays = wateringStats.filter(w => w.count === 0);

                        return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {/* Alerts */}
                                {criticalDays.length > 0 && (
                                    <div className="glass-card-premium" style={{ padding: '1.25rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', borderLeft: '4px solid #ef4444', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <AlertTriangle size={24} color="#ef4444" style={{ flexShrink: 0 }} />
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 900, color: '#ef4444' }}>CRITICAL WATERING COVERAGE WARNING</h4>
                                            <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: 'var(--color-text-dim, rgba(255,255,255,0.5))', lineHeight: 1.35 }}>
                                                There are **0 students committed** for physical service check-ins on: **{criticalDays.map(c => c.day).join(', ')}**. G9 action is recommended to balance assignments.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Heatmap Grid */}
                                <div className="glass-card-premium" style={{ padding: '2rem', background: '#0d111b' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.85rem' }}>
                                        {wateringStats.map(s => {
                                            const isCritical = s.count === 0;
                                            const isStable = s.count >= 4;
                                            return (
                                                <div key={s.day} style={{
                                                    padding: '1rem 0.5rem', borderRadius: '0.75rem', textAlign: 'center',
                                                    background: isCritical ? 'rgba(239, 68, 68, 0.05)' : isStable ? 'rgba(16, 185, 129, 0.05)' : 'rgba(234, 179, 8, 0.05)',
                                                    border: '1px solid',
                                                    borderColor: isCritical ? 'rgba(239, 68, 68, 0.15)' : isStable ? 'rgba(16, 185, 129, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                                                }}>
                                                    <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--color-text-dim, rgba(255,255,255,0.4))', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.day.slice(0, 3)}</div>
                                                    <div style={{
                                                        fontSize: '1.5rem', fontWeight: 900, marginTop: '0.35rem',
                                                        color: isCritical ? '#ef4444' : isStable ? '#10b981' : '#eab308'
                                                    }}>{s.count}</div>
                                                    <div style={{ fontSize: '0.6rem', color: 'var(--color-text-dim, rgba(255,255,255,0.3))', marginTop: '0.2rem', fontWeight: 700 }}>
                                                        {isCritical ? 'CRITICAL ⚠️' : isStable ? 'STABLE ✓' : 'LOW COVER'}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                </div>
            )}

            {/* D. CONSISTENCY HONORS TAB */}
            {activeTab === 'honors' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', animation: 'fadeIn 0.3s' }}>
                    
                    <div className="glass-card-premium" style={{ padding: '2rem', background: '#0d111b', borderLeft: '4px solid #facc15' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: 'var(--color-text, white)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Award size={20} color="#facc15" /> Consistency Leaderboard & Honors
                                </h3>
                                <p style={{ color: 'var(--color-text-dim, rgba(255,255,255,0.4))', fontSize: '0.82rem', marginTop: '0.4rem', lineHeight: 1.4 }}>
                                    Rank active students by total check-ins descending. Check the separate list below to instantly find students with zero check-ins.
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button onClick={handlePrintHonorsPDF} className="btn btn-primary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.78rem', fontWeight: 800, background: 'linear-gradient(135deg, #facc15 0%, #d97706 100%)', border: '1px solid rgba(250, 204, 21, 0.3)', display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#090d16' }}>
                                    <FileText size={14} /> Print Honors List
                                </button>
                                <button onClick={handleExportHonorsCSV} className="btn" style={{ padding: '0.6rem 1.2rem', fontSize: '0.78rem', fontWeight: 800, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <Download size={14} /> Export CSV
                                </button>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.75rem' }}>
                        
                        {/* Leaderboard */}
                        <div className="glass-card-premium" style={{ padding: '0', overflow: 'hidden', border: '1px solid rgba(250, 204, 21, 0.15)' }}>
                            <div style={{ padding: '1.25rem 1.5rem', background: 'rgba(2, 21, 37, 0.4)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 900, color: 'white' }}>Consistency Leaderboard</h3>
                                <span style={{ fontSize: '0.65rem', color: '#facc15', background: 'rgba(250, 204, 21, 0.1)', padding: '0.15rem 0.45rem', borderRadius: '4px', border: '1px solid rgba(250, 204, 21, 0.15)', fontWeight: 800 }}>SORTED BY CHECK-INS DESC</span>
                            </div>

                            <div style={{ overflowY: 'auto', maxHeight: '420px' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                            <th style={{ padding: '0.85rem 1rem', color: 'var(--color-text-dim, rgba(255,255,255,0.4))', fontSize: '0.68rem', fontWeight: 900 }}>#</th>
                                            <th style={{ padding: '0.85rem 1rem', color: 'var(--color-text-dim, rgba(255,255,255,0.4))', fontSize: '0.68rem', fontWeight: 900 }}>Student Name</th>
                                            <th style={{ padding: '0.85rem 1rem', color: 'var(--color-text-dim, rgba(255,255,255,0.4))', fontSize: '0.68rem', fontWeight: 900 }}>Rate</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(() => {
                                            const sorted = [...filteredMembers].sort((a,b) => (b.totalAttended || 0) - (a.totalAttended || 0));
                                            if (sorted.length === 0) {
                                                return <tr><td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-dim)' }}>Roster empty.</td></tr>;
                                            }
                                            return sorted.map((m, index) => {
                                                const rate = filteredMeetings.length > 0 ? ((m.totalAttended || 0) / filteredMeetings.length * 100).toFixed(0) : 0;
                                                return (
                                                    <tr key={m._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }} className="table-row-hover">
                                                        <td style={{ padding: '0.85rem 1rem', fontWeight: 900, color: '#facc15' }}>{index + 1}</td>
                                                        <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: 'var(--color-text, white)' }}>
                                                            {m.name}
                                                            <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--color-text-dim, rgba(255,255,255,0.4))' }}>{m.studentRegNo}</span>
                                                        </td>
                                                        <td style={{ padding: '0.85rem 1rem', fontWeight: 900, color: '#facc15', fontSize: '0.82rem' }}>
                                                            {m.totalAttended || 0} / {filteredMeetings.length} ({rate}%)
                                                        </td>
                                                    </tr>
                                                );
                                            });
                                        })()}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* At Risk Alert */}
                        <div className="glass-card-premium" style={{ padding: '0', overflow: 'hidden', border: '1px solid rgba(239, 68, 68, 0.15)', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ padding: '1.25rem 1.5rem', background: 'rgba(2, 21, 37, 0.4)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 900, color: 'white' }}>At-Risk Check-in Alerts</h3>
                                <span style={{ fontSize: '0.65rem', color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '0.15rem 0.45rem', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.15)', fontWeight: 800 }}>0 CHECK-INS</span>
                            </div>

                            <div style={{ overflowY: 'auto', flex: 1, maxHeight: '420px' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                            <th style={{ padding: '0.85rem 1rem', color: 'var(--color-text-dim, rgba(255,255,255,0.4))', fontSize: '0.68rem', fontWeight: 900 }}>Student Name</th>
                                            <th style={{ padding: '0.85rem 1rem', color: 'var(--color-text-dim, rgba(255,255,255,0.4))', fontSize: '0.68rem', fontWeight: 900 }}>Campus Location</th>
                                            <th style={{ padding: '0.85rem 1rem', color: 'var(--color-text-dim, rgba(255,255,255,0.4))', fontSize: '0.68rem', fontWeight: 900 }}>Details</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(() => {
                                            const alerts = filteredMembers.filter(m => !m.totalAttended || m.totalAttended === 0);
                                            if (alerts.length === 0) {
                                                return (
                                                    <tr>
                                                        <td colSpan="3" style={{ padding: '4rem 2rem', textAlign: 'center', color: '#10b981', fontWeight: 800, fontSize: '0.85rem' }}>
                                                            🟢 Perfect! No students checked with 0 check-ins this semester.
                                                        </td>
                                                    </tr>
                                                );
                                            }
                                            return alerts.map(m => (
                                                <tr key={m._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }} className="table-row-hover">
                                                    <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#f87171' }}>
                                                        {m.name}
                                                        <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--color-text-dim, rgba(255,255,255,0.4))' }}>{m.studentRegNo}</span>
                                                    </td>
                                                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--color-text-dim, rgba(255,255,255,0.5))' }}>{m.campus}</td>
                                                    <td style={{ padding: '0.85rem 1rem', fontWeight: 900, color: '#f87171', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                                                        0 Attended ⚠️
                                                    </td>
                                                </tr>
                                            ));
                                        })()}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>

                </div>
            )}

            {/* E. FINANCE LEDGER TAB */}
            {activeTab === 'finance' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', animation: 'fadeIn 0.3s' }}>
                    
                    <div className="glass-card-premium" style={{ padding: '2rem', background: '#0d111b', borderLeft: '4px solid #a78bfa' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: 'var(--color-text, white)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <DollarSign size={20} color="#a78bfa" /> Community Collections Ledger Report
                                </h3>
                                <p style={{ color: 'var(--color-text-dim, rgba(255,255,255,0.4))', fontSize: '0.82rem', marginTop: '0.4rem', lineHeight: 1.4 }}>
                                    Compiles transaction balances, verified amounts, and channels statistics from the cloud database.
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button onClick={handlePrintFinancePDF} disabled={loadingFinance || !financeStats} className="btn btn-primary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.78rem', fontWeight: 800, background: 'linear-gradient(135deg, #a78bfa 0%, #6d28d9 100%)', border: '1px solid rgba(167, 139, 250, 0.3)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <FileText size={14} /> Print Audit Ledger
                                </button>
                            </div>
                        </div>
                    </div>

                    {loadingFinance ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-dim)' }}>Syncing Ledger Cloud...</div>
                    ) : !financeStats ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-dim)' }}>Ledger offline. Ensure payment services are connected.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                            {/* Summary Cards */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
                                <div className="glass-card-premium" style={{ padding: '1.5rem', borderLeft: '4px solid #4ade80', background: '#0d111b' }}>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-dim, rgba(255,255,255,0.4))', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>TOTAL APPROVED COLLECTIONS</div>
                                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#4ade80', marginTop: '0.5rem' }}>
                                        Ksh {(financeStats.overall?.find(o => o._id === 'approved')?.total || 0).toLocaleString()}
                                    </div>
                                </div>
                                <div className="glass-card-premium" style={{ padding: '1.5rem', borderLeft: '4px solid #fbbf24', background: '#0d111b' }}>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-dim, rgba(255,255,255,0.4))', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>AWAITING APPROVAL RECORDS</div>
                                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fbbf24', marginTop: '0.5rem' }}>
                                        {financeStats.overall?.find(o => o._id === 'pending')?.count || 0} logs
                                    </div>
                                </div>
                                <div className="glass-card-premium" style={{ padding: '1.5rem', borderLeft: '4px solid #25AAE1', background: '#0d111b' }}>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-dim, rgba(255,255,255,0.4))', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>VERIFIED PAYMENTS COUNT</div>
                                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#25AAE1', marginTop: '0.5rem' }}>
                                        {financeStats.overall?.find(o => o._id === 'approved')?.count || 0} receipts
                                    </div>
                                </div>
                            </div>

                            {/* Custom Mode list */}
                            <div className="glass-card-premium" style={{ padding: '0', overflow: 'hidden', border: '1px solid rgba(167, 139, 250, 0.15)' }}>
                                <div style={{ padding: '1.25rem 1.5rem', background: 'rgba(2, 21, 37, 0.4)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 900, color: 'white' }}>Contribution Channels breakdown</h3>
                                </div>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                            <th style={{ padding: '0.85rem 1rem', color: 'var(--color-text-dim, rgba(255,255,255,0.4))', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase' }}>Payment Channel</th>
                                            <th style={{ padding: '0.85rem 1rem', color: 'var(--color-text-dim, rgba(255,255,255,0.4))', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase' }}>Total Collections</th>
                                            <th style={{ padding: '0.85rem 1rem', color: 'var(--color-text-dim, rgba(255,255,255,0.4))', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase' }}>Transactions count</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {financeStats.modeStats?.length === 0 ? (
                                            <tr><td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-dim)' }}>No ledger records.</td></tr>
                                        ) : (
                                            financeStats.modeStats?.map(m => (
                                                <tr key={m._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }} className="table-row-hover">
                                                    <td style={{ padding: '1rem', fontWeight: 800, color: 'var(--color-text, white)' }}>{m._id}</td>
                                                    <td style={{ padding: '1rem', fontWeight: 900, color: '#4ade80', fontSize: '0.95rem' }}>Ksh {m.total.toLocaleString()}</td>
                                                    <td style={{ padding: '1rem', fontFamily: 'monospace', fontWeight: 700, color: '#94a3b8' }}>{m.count} payments logged</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                </div>
            )}

            {/* F. CUMULATIVE EXPORTS TAB */}
            {activeTab === 'cumulative' && (
                <div className="glass-card-premium" style={{ background: '#0d111b', padding: '4rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', animation: 'fadeIn 0.3s' }}>
                    <div style={{ maxWidth: '450px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{ padding: '1.25rem', background: 'rgba(74, 222, 128, 0.08)', border: '1px solid rgba(74, 222, 128, 0.15)', borderRadius: '50%', color: '#4ade80' }}>
                            <FileSpreadsheet size={40} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.3rem', fontWeight: 900, margin: 0, color: 'white' }}>Cumulative Term Check-in Spreadsheet</h3>
                            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-dim, rgba(255,255,255,0.45))', lineHeight: 1.5, marginTop: '0.5rem' }}>
                                Compile all active check-in data metrics for the selected filters into a single spreadsheet sheet. Calculated check-in ratios are included.
                            </p>
                        </div>
                        <button
                            className="btn btn-primary"
                            style={{
                                background: 'linear-gradient(135deg, #4ade80 0%, #15803d 100%) !important',
                                color: 'white', fontWeight: 800, padding: '0.85rem 2rem', width: '100%', borderRadius: '0.6rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                border: '1px solid rgba(74, 222, 128, 0.3) !important',
                                boxShadow: '0 8px 25px rgba(74, 222, 128, 0.15) !important',
                                cursor: 'pointer'
                            }}
                            onClick={() => {
                                onDownloadCumulativeCSV(members, filterSemester === 'Current' ? currentSemester : filterSemester);
                            }}
                        >
                            <Download size={16} /> Compile & Export Cumulative Spreadsheet
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                .table-row-hover:hover { background-color: rgba(255, 255, 255, 0.02) !important; }
                select.modern-input { appearance: none; -webkit-appearance: none; }
                
                /* Tooltip & bar styles */
                .bar-container-hover:hover .chart-bar-tooltip {
                    opacity: 1;
                    visibility: visible;
                    transform: translateX(-50%) translateY(-5px);
                }
                .chart-bar-tooltip {
                    opacity: 0;
                    visibility: hidden;
                    left: 50%;
                    transform: translateX(-50%) translateY(5px);
                    transition: all 0.2s ease;
                }
            `}</style>
        </div>
    );
};

export default ReportsTab;
