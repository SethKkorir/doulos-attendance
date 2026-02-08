import { useState, useEffect } from 'react';
import api from '../api';
import QRCode from 'react-qr-code';
import {
    Plus, Calendar, Clock, MapPin, Download, QrCode as QrIcon, Users,
    BarChart3, Activity, Trash2, Search, Link as LinkIcon, ExternalLink,
    ShieldAlert as Ghost, Sun, Moon, Pencil, Trophy, GraduationCap, RotateCcw,
    FileSpreadsheet, ChevronDown, UploadCloud
} from 'lucide-react';
import * as XLSX from 'xlsx';
import Logo from '../components/Logo';
import BackgroundGallery from '../components/BackgroundGallery';
import ValentineRain from '../components/ValentineRain';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';

const AdminDashboard = () => {
    const [meetings, setMeetings] = useState([]);
    const [showCreate, setShowCreate] = useState(false);
    const [selectedMeeting, setSelectedMeeting] = useState(null); // For QR Modal
    const [editingMeeting, setEditingMeeting] = useState(null); // For Edit Modal
    const [formData, setFormData] = useState({
        name: 'Weekly Doulos',
        date: new Date().toISOString().split('T')[0],
        campus: 'Athi River',
        startTime: '20:30',
        endTime: '23:00',
        requiredFields: [
            { label: 'Full Name', key: 'studentName', required: true },
            { label: 'Admission Number', key: 'studentRegNo', required: true }
        ],
        questionOfDay: '',
        isTestMeeting: false,
        secretRoomCode: '',
        location: {
            latitude: null,
            longitude: null,
            radius: 200,
            name: ''
        }
    });
    const [msg, setMsg] = useState(null);
    const [viewingAttendance, setViewingAttendance] = useState(null); // Meeting object
    const [activeTab, setActiveTab] = useState('meetings'); // 'meetings', 'members', or 'reports'
    const [userRole, setUserRole] = useState(localStorage.getItem('role') || 'admin');
    const [members, setMembers] = useState([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('theme') !== 'light');
    const [quickRegNo, setQuickRegNo] = useState('');
    const [quickCheckInLoading, setQuickCheckInLoading] = useState(false);
    const [memberSearch, setMemberSearch] = useState('');
    const [importLoading, setImportLoading] = useState(false);
    const [memberCampusFilter, setMemberCampusFilter] = useState('All');
    const [memberTypeFilter, setMemberTypeFilter] = useState('All');
    const [editingMember, setEditingMember] = useState(null);
    const [memberInsights, setMemberInsights] = useState(null);
    const [loadingInsights, setLoadingInsights] = useState(false);
    const [showAddMenu, setShowAddMenu] = useState(false);

    useEffect(() => {
        if (!isDarkMode) {
            document.body.classList.add('light-mode');
            localStorage.setItem('theme', 'light');
        } else {
            document.body.classList.remove('light-mode');
            localStorage.setItem('theme', 'dark');
        }
    }, [isDarkMode]);

    // --- IDLE TIMER (AUTO LOCK) ---
    useEffect(() => {
        let timeout;

        const resetTimer = () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                // Auto lock after 5 minutes of inactivity
                localStorage.clear();
                window.location.href = '/admin';
            }, 5 * 60 * 1000); // 5 minutes
        };

        // Events to listen for activity
        const events = ['mousemove', 'keydown', 'click', 'scroll'];
        events.forEach(event => window.addEventListener(event, resetTimer));

        // Start timer initially
        resetTimer();

        return () => {
            clearTimeout(timeout);
            events.forEach(event => window.removeEventListener(event, resetTimer));
        };
    }, []);

    const fetchMeetings = async () => {
        try {
            const res = await api.get('/meetings');
            // Sort: Active first, then Date descending
            const sorted = res.data.sort((a, b) => {
                if (a.isActive === b.isActive) {
                    return new Date(b.date) - new Date(a.date);
                }
                return a.isActive ? -1 : 1;
            });
            setMeetings(sorted);
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to sync with server' });
        }
    };

    const addField = () => {
        setFormData({
            ...formData,
            requiredFields: [...formData.requiredFields, { label: '', key: '', required: true }]
        });
    };

    const updateField = (index, field, value) => {
        const newFields = [...formData.requiredFields];
        newFields[index][field] = value;
        // Auto-generate key from label if key is empty
        if (field === 'label' && !newFields[index].key) {
            newFields[index].key = value.toLowerCase().replace(/\s+/g, '_');
        }
        setFormData({ ...formData, requiredFields: newFields });
    };

    const removeField = (index) => {
        if (formData.requiredFields.length > 1) {
            const newFields = formData.requiredFields.filter((_, i) => i !== index);
            setFormData({ ...formData, requiredFields: newFields });
        }
    };

    useEffect(() => {
        let timer;
        if (msg) {
            timer = setTimeout(() => setMsg(null), 4000);
        }
        return () => clearTimeout(timer);
    }, [msg]);

    const fetchMembers = async () => {
        setLoadingMembers(true);
        try {
            const res = await api.get('/members', {
                params: {
                    campus: memberCampusFilter,
                    memberType: memberTypeFilter
                }
            });
            setMembers(res.data);
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to fetch members directory' });
        } finally {
            setLoadingMembers(false);
        }
    };

    useEffect(() => {
        fetchMeetings();
    }, []);

    useEffect(() => {
        if (activeTab === 'members') fetchMembers();
    }, [activeTab, memberCampusFilter, memberTypeFilter]);

    const handleCSVUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setImportLoading(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target.result;
            const lines = text.split('\n');
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

            const data = lines.slice(1).map(line => {
                const values = line.split(',');
                if (values.length < headers.length) return null;
                const obj = {};
                headers.forEach((header, i) => {
                    obj[header] = values[i]?.trim();
                });
                return obj;
            }).filter(d => d && d.name && (d.studentregno || d.regno));

            // Map keys to match our model
            const members = data.map(d => ({
                name: d.name,
                studentRegNo: d.studentregno || d.regno,
                memberType: d.type || d.membertype || 'Visitor',
                campus: d.campus || 'Athi River'
            }));

            try {
                await api.post('/members/import', { members });
                setMsg({ type: 'success', text: `Imported ${members.length} members successfully!` });
                fetchMembers();
            } catch (err) {
                setMsg({ type: 'error', text: 'Import failed: ' + (err.response?.data?.message || 'Check CSV format') });
            } finally {
                setImportLoading(false);
            }
        };
        reader.readAsText(file);
    };

    const handleSyncRegistry = async () => {
        if (!window.confirm('This will create registry profiles for everyone in your attendance history. Proceed?')) return;
        setImportLoading(true);
        try {
            const res = await api.post('/members/sync');
            setMsg({ type: 'success', text: res.data.message });
            fetchMembers();
        } catch (err) {
            setMsg({ type: 'error', text: 'Sync failed' });
        } finally {
            setImportLoading(false);
        }
    };

    const handleGraduateAll = async () => {
        const password = window.prompt('SECURITY CHECK: Please enter your admin password to confirm graduating ALL recruits:');
        if (!password) return;

        setImportLoading(true);
        try {
            const res = await api.post('/members/graduate-all', { confirmPassword: password });
            setMsg({ type: 'success', text: res.data.message });
            fetchMembers();
        } catch (err) {
            setMsg({ type: 'error', text: 'Graduation failed: ' + (err.response?.data?.message || 'Server error') });
        } finally {
            setImportLoading(false);
        }
    };

    const handleResetAllPoints = async () => {
        if (!window.confirm('CRITICAL: This will reset points for ALL members (except test accounts) back to 0. This cannot be undone. Proceed?')) return;
        setImportLoading(true);
        try {
            const res = await api.post('/members/reset-all-points');
            setMsg({ type: 'success', text: res.data.message });
            fetchMembers();
        } catch (err) {
            setMsg({ type: 'error', text: 'Reset failed' });
        } finally {
            setImportLoading(false);
        }
    };

    const handleDeleteMember = async (id, name) => {
        const password = window.prompt(`SECURITY CHECK: Please enter your admin password to CONFIRM DELETING ${name}:`);
        if (!password) return;

        setImportLoading(true);
        try {
            const res = await api.post(`/members/${id}/delete-secure`, { confirmPassword: password });
            setMsg({ type: 'success', text: res.data.message });
            setEditingMember(null);
            fetchMembers();
        } catch (err) {
            setMsg({ type: 'error', text: 'Deletion failed: ' + (err.response?.data?.message || 'Server error') });
        } finally {
            setImportLoading(false);
        }
    };

    const handleDeleteMeeting = async (id, name) => {
        const password = window.prompt(`SECURITY CHECK: Enter admin password to PERMANENTLY DELETE "${name}" and all its attendance records:`);
        if (!password) return;

        setImportLoading(true);
        try {
            const res = await api.post(`/meetings/${id}/delete-secure`, { confirmPassword: password });
            setMsg({ type: 'success', text: res.data.message });
            fetchMeetings();
        } catch (err) {
            setMsg({ type: 'error', text: 'Deletion failed: ' + (err.response?.data?.message || 'Server error') });
        } finally {
            setImportLoading(false);
        }
    };

    const handleSetupTestAccount = async () => {
        const regNo = window.prompt('Enter student registration number to set as dedicated TESTER:', '00-0000');
        if (!regNo) return;
        setImportLoading(true);
        try {
            const res = await api.post('/members/setup-test-account', { regNo });
            setMsg({ type: 'success', text: res.data.message });
            fetchMembers();
        } catch (err) {
            setMsg({ type: 'error', text: 'Setup failed' });
        } finally {
            setImportLoading(false);
        }
    };

    const fetchMemberInsights = async (regNo) => {
        setLoadingInsights(true);
        try {
            const res = await api.get(`/attendance/student/${regNo}`);
            setMemberInsights(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingInsights(false);
        }
    };

    const handleQuickCheckIn = async (meetingId, regNoOverride = null) => {
        const reg = regNoOverride || quickRegNo;
        if (!reg) return;

        setQuickCheckInLoading(true);
        try {
            await api.post('/attendance/manual', {
                meetingId,
                studentRegNo: reg
            });
            setMsg({ type: 'success', text: `Checked in ${reg} successfully!` });
            setQuickRegNo('');
            fetchMeetings(); // Refresh counts
            if (activeTab === 'members') fetchMembers();
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Manual check-in failed' });
        } finally {
            setQuickCheckInLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setMsg(null);
        try {
            await api.post('/meetings', formData);
            setMsg({ type: 'success', text: 'Meeting Created!' });
            setShowCreate(false);
            fetchMeetings();
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to create' });
        }
    };

    const downloadReport = async (meetingId, meetingName) => {
        try {
            const res = await api.get(`/attendance/${meetingId}`);
            const data = res.data;
            if (data.length === 0) {
                setMsg({ type: 'error', text: 'No attendance recorded yet.' });
                return;
            }

            // Get all unique keys from responses
            const allKeys = new Set();
            data.forEach(r => {
                const responses = r.responses instanceof Map ? Object.fromEntries(r.responses) : r.responses;
                Object.keys(responses || {}).forEach(k => allKeys.add(k));
            });
            const headers = Array.from(allKeys);

            const rows = data.map(r => {
                const responses = r.responses instanceof Map ? Object.fromEntries(r.responses) : r.responses;
                const timestamp = new Date(r.timestamp).toLocaleString();
                const memberType = r.memberType || 'Visitor';
                return `<tr><td>${timestamp}</td><td><strong>${memberType}</strong></td>${headers.map(h => `<td>${responses[h] || '-'}</td>`).join('')}</tr>`;
            });

            const headerCells = ['Time', 'Category', ...headers].map(h => `<th style="text-align: left; padding: 12px; border-bottom: 2px solid #032540; color: #032540;">${h.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</th>`).join('');

            const reportHtml = `
                <html>
                <head>
                    <title>${meetingName} - Attendance Report</title>
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; padding: 40px; }
                        .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #1976d2; padding-bottom: 20px; margin-bottom: 30px; }
                        .logo { height: 80px; }
                        .title-section { text-align: right; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th { background-color: #f5f5f5; }
                        td { padding: 10px; border-bottom: 1px solid #eee; font-size: 14px; }
                        .footer { margin-top: 50px; font-size: 12px; color: #666; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
                        @media print { .no-print { display: none; } }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <img src="${window.location.origin}/logo.png" class="logo" />
                        <div class="title-section">
                            <h1 style="margin: 0; color: #032540;">Attendance Report</h1>
                            <p style="margin: 5px 0; color: #666;">${meetingName}</p>
                            <p style="margin: 0; font-size: 0.9em;">Generated on: ${new Date().toLocaleString()}</p>
                        </div>
                    </div>
                    
                    <button class="no-print" onclick="window.print()" style="margin-bottom: 20px; padding: 10px 20px; background: #25AAE1; color: white; border: none; border-radius: 5px; cursor: pointer;">Print to PDF</button>

                    <table>
                        <thead><tr>${headerCells}</tr></thead>
                        <tbody>${rows.join('')}</tbody>
                    </table>

                    <div class="footer">
                        Doulos Solidarity &bull; Daystar University &bull; Official Attendance Record
                    </div>
                </body>
                </html>
    `;

            const win = window.open('', '_blank');
            win.document.write(reportHtml);
            win.document.close();
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to generate report' });
        }
    };

    const downloadCSV = async (meetingId, meetingName) => {
        try {
            const res = await api.get(`/attendance/${meetingId}`);
            const data = res.data;
            if (data.length === 0) {
                setMsg({ type: 'error', text: 'No attendance recorded yet.' });
                return;
            }

            const allKeys = new Set();
            data.forEach(r => {
                const responses = r.responses instanceof Map ? Object.fromEntries(r.responses) : r.responses;
                Object.keys(responses || {}).forEach(k => allKeys.add(k));
            });
            const headers = ['Timestamp', 'Category', ...Array.from(allKeys)];

            const csvContent = [
                headers.join(','),
                ...data.map(r => {
                    const responses = r.responses instanceof Map ? Object.fromEntries(r.responses) : r.responses;
                    const timestamp = new Date(r.timestamp).toLocaleString();
                    const category = r.memberType || 'Visitor';
                    return [
                        `"${timestamp}"`,
                        `"${category}"`,
                        ...Array.from(allKeys).map(h => `"${(responses[h] || '-').toString().replace(/"/g, '""')}"`)
                    ].join(',');
                })
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.setAttribute('download', `${meetingName}_Attendance.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setMsg({ type: 'success', text: 'CSV Export Started' });
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to download CSV' });
        }
    };

    const downloadCumulativeCSV = (filteredMembers, semesterName) => {
        try {
            const headers = ['Name', 'Registration Number', 'Category', 'Campus', 'Total Attendance'];
            const csvContent = [
                headers.join(','),
                ...filteredMembers.map(m => [
                    `"${m.name || 'Unknown'}"`,
                    `"${m.studentRegNo}"`,
                    `"${m.memberType || 'Visitor'}"`,
                    `"${m.campus}"`,
                    m.totalAttended
                ].join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.setAttribute('download', `Cumulative_Report_${semesterName.replace(/\s+/g, '_')}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setMsg({ type: 'success', text: 'Cumulative Export Started' });
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to export cumulative CSV' });
        }
    };

    const downloadRegistryCSV = () => {
        try {
            const headers = ['Name', 'Registration Number', 'Points', 'Campus', 'Category'];
            const csvContent = [
                headers.join(','),
                ...members.map(m => [
                    `"${m.name || 'Unknown'}"`,
                    `"${m.studentRegNo}"`,
                    m.totalPoints || 0,
                    `"${m.campus}"`,
                    `"${m.memberType || 'Visitor'}"`
                ].join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.setAttribute('download', `Doulos_Member_Registry_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setMsg({ type: 'success', text: 'Registry Export Started' });
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to export registry' });
        }
    };

    // --- SMART FILE IMPORT LOGIC ---
    const handleFileImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setImportLoading(true);
        const fileType = file.name.split('.').pop().toLowerCase();

        try {
            if (fileType === 'xlsx' || fileType === 'xls' || fileType === 'csv') {
                handleExcelImport(file);
            } else if (fileType === 'docx' || fileType === 'doc') {
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer });
                processExtractedText(result.value);
            } else if (fileType === 'pdf') {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                let fullText = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => item.str).join(' ');
                    fullText += pageText + '\n';
                }
                processExtractedText(fullText);
            } else {
                setMsg({ type: 'error', text: 'Unsupported file format. Please use PDF, Word, or Excel files.' });
                setImportLoading(false);
            }
        } catch (err) {
            console.error(err);
            setMsg({ type: 'error', text: 'Failed to process file: ' + (err.message || 'Unknown error') });
            setImportLoading(false);
        } finally {
            e.target.value = '';
        }
    };

    const handleExcelImport = (file) => {
        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);
                processImportedData(data, 'excel');
            } catch (err) {
                setMsg({ type: 'error', text: 'Failed to parse Excel file' });
                setImportLoading(false);
            }
        };
        reader.readAsBinaryString(file);
    };

    const processExtractedText = (text) => {
        const lines = text.split(/\r?\n/);
        const membersFound = [];

        // Regex for Admission Number (e.g., 22-1234, 221234, 22 1234)
        const regNoRegex = /(\d{2})[- ]?(\d{4})/g;

        lines.forEach(line => {
            let match;
            while ((match = regNoRegex.exec(line)) !== null) {
                const stdRegNo = `${match[1]}-${match[2]}`;
                const lowerLine = line.toLowerCase();

                // Campus heuristics
                let campus = 'Athi River';
                if (lowerLine.includes('valley') || lowerLine.includes('nairobi')) campus = 'Valley Road';

                // Member type heuristics
                let memberType = 'Visitor';
                if (lowerLine.includes('douloid')) memberType = 'Douloid';
                else if (lowerLine.includes('recruit')) memberType = 'Recruit';
                else if (lowerLine.includes('exempt')) memberType = 'Exempted';

                // Name extraction (remove reg no and keywords, assume rest is name)
                let nameCandidate = line.replace(match[0], '')
                    .replace(/athi river|valley road|douloid|recruit|visitor|exempted/gi, '')
                    .replace(/[,\t|-]/g, ' ')
                    .trim()
                    .replace(/\s+/g, ' ');

                if (nameCandidate.length > 2) {
                    membersFound.push({
                        name: nameCandidate,
                        studentRegNo: stdRegNo,
                        campus,
                        memberType
                    });
                }
            }
        });

        processImportedData(membersFound, 'text');
    };

    const processImportedData = async (data, source) => {
        let formattedMembers = [];

        if (source === 'excel') {
            formattedMembers = data.map(row => {
                const getVal = (possibleKeys) => {
                    const key = Object.keys(row).find(k => possibleKeys.includes(k.toLowerCase().trim()));
                    return key ? row[key] : null;
                };

                const name = getVal(['name', 'full name', 'student name', 'fullname']);
                const rawReg = getVal(['adm', 'adm no', 'admission', 'admission number', 'reg', 'reg no', 'registration', 'registration number']);

                if (!name || !rawReg) return null;

                let studentRegNo = '';
                let clean = String(rawReg).replace(/[^0-9]/g, '');
                if (clean.length > 2) studentRegNo = clean.slice(0, 2) + '-' + clean.slice(2);
                else studentRegNo = clean;

                let type = getVal(['category', 'type', 'member type', 'role']) || 'Visitor';
                if (type.toLowerCase().includes('douloid')) type = 'Douloid';
                else if (type.toLowerCase().includes('recruit')) type = 'Recruit';
                else if (type.toLowerCase().includes('visitor')) type = 'Visitor';

                const campus = getVal(['campus', 'location']) || 'Athi River';

                return { name, studentRegNo, memberType: type, campus };
            }).filter(m => m !== null);
        } else {
            formattedMembers = data;
        }

        if (formattedMembers.length === 0) {
            setMsg({ type: 'error', text: 'No valid members found in file.' });
            setImportLoading(false);
            return;
        }

        try {
            await api.post('/members/import', { members: formattedMembers });
            setMsg({ type: 'success', text: `Imported ${formattedMembers.length} members successfully!` });
            fetchMembers();
            setShowAddMenu(false);
        } catch (error) {
            setMsg({ type: 'error', text: 'Import failed: ' + (error.response?.data?.message || error.message) });
        } finally {
            setImportLoading(false);
        }
    };

    const handlePrintQR = () => {
        if (!selectedMeeting) return;

        // Find the QR code SVG. 
        // Note: The on-screen version is blurred, but the SVG data itself is valid.
        // We will print it cleanly without the blur styles.
        const qrSvg = document.querySelector('.qr-modal-content svg');
        if (!qrSvg) return;

        // Create a clean version of the SVG for printing (removing parent filters if any)
        const qrDataUrl = "data:image/svg+xml;base64," + btoa(new XMLSerializer().serializeToString(qrSvg));
        const meeting = selectedMeeting;

        const printHtml = `
            <html>
                <head>
                    <title>Doulos QR - ${meeting.name}</title>
                    <style>
                        @page {
                            size: A4;
                            margin: 0;
                        }
                        body { 
                            font-family: 'Inter', system-ui, -apple-system, sans-serif;
                            margin: 0;
                            padding: 0;
                            background: black; /* Print background */
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        .page {
                            width: 210mm;
                            height: 297mm;
                            position: relative;
                            background: radial-gradient(circle at top right, #1e293b 0%, #0f172a 100%);
                            color: white;
                            overflow: hidden;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            text-align: center;
                        }
                        /* Decorative Background Elements */
                        .glow-orb {
                            position: absolute;
                            border-radius: 50%;
                            filter: blur(80px);
                            opacity: 0.4;
                            z-index: 0;
                        }
                        .orb-1 { top: -100px; right: -100px; width: 400px; height: 400px; background: #3b82f6; }
                        .orb-2 { bottom: -100px; left: -100px; width: 500px; height: 500px; background: #8b5cf6; }

                        .content {
                            position: relative;
                            z-index: 10;
                            width: 100%;
                            height: 100%;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: space-between; /* Space out header, QR, footer */
                            padding: 25mm;
                            box-sizing: border-box;
                        }

                        .header {
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            gap: 15px;
                        }
                        
                        .brand {
                            font-size: 1.2rem;
                            font-weight: 900;
                            letter-spacing: 4px;
                            text-transform: uppercase;
                            color: rgba(255,255,255,0.5);
                            border-bottom: 1px solid rgba(255,255,255,0.2);
                            padding-bottom: 10px;
                            margin-bottom: 10px;
                        }

                        .meeting-name { 
                            font-size: 4rem; 
                            font-weight: 900; 
                            line-height: 1.1; 
                            background: linear-gradient(to right, #fff, #cbd5e1);
                            -webkit-background-clip: text;
                            -webkit-text-fill-color: transparent;
                            margin: 0;
                            max-width: 90%;
                        }
                        
                        .details { 
                            font-size: 1.8rem; 
                            color: #94a3b8; 
                            margin-top: 10px; 
                            font-weight: 500; 
                        }

                        .qr-container {
                            background: white;
                            padding: 25px;
                            border-radius: 30px;
                            box-shadow: 0 0 60px rgba(59, 130, 246, 0.3);
                            position: relative;
                        }
                        
                        /* "Scan Me" Badge */
                        .scan-badge {
                            position: absolute;
                            top: -20px;
                            right: -20px;
                            background: #ef4444;
                            color: white;
                            font-weight: 900;
                            padding: 10px 20px;
                            border-radius: 50px;
                            transform: rotate(15deg);
                            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                            font-size: 1.2rem;
                        }

                        .qr-code {
                            width: 400px;
                            height: 400px;
                            object-fit: contain;
                        }

                        .footer {
                            width: 100%;
                            border-top: 1px solid rgba(255,255,255,0.1);
                            padding-top: 20px;
                            display: flex;
                            justify-content: space-between;
                            align-items: flex-end;
                        }
                        
                        .instruction {
                            text-align: left;
                        }
                        .instruction h3 {
                            font-size: 1.5rem;
                            color: #3b82f6;
                            margin: 0 0 5px 0;
                            text-transform: uppercase;
                        }
                        .instruction p {
                            font-size: 1rem;
                            color: #94a3b8;
                            margin: 0;
                            max-width: 300px;
                        }
                        
                        .meta {
                            text-align: right;
                            font-size: 1rem;
                            color: rgba(255,255,255,0.3);
                        }

                    </style>
                </head>
                <body>
                    <div class="page">
                        <div class="glow-orb orb-1"></div>
                        <div class="glow-orb orb-2"></div>

                        <div class="content">
                            <div class="header">
                                <div class="brand">Doulos Attendance</div>
                                <h1 class="meeting-name">${meeting.name}</h1>
                                <div class="details">${meeting.campus} &bull; ${meeting.startTime}</div>
                            </div>

                            <div class="qr-container">
                                <div class="scan-badge">SCAN ME!</div>
                                ${new XMLSerializer().serializeToString(qrSvg)}
                            </div>

                            <div class="footer">
                                <div class="instruction">
                                    <h3>Quick Check-In</h3>
                                    <p>Open your camera or QR scanner to mark your attendance instantly.</p>
                                </div>
                                <div class="meta">
                                    Generatd on ${new Date().toLocaleDateString()}<br/>
                                    doulos.app
                                </div>
                            </div>
                        </div>
                    </div>
                        
                        .qr-section { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; }
                        .qr-container { 
                            padding: 15mm; 
                            background: white; 
                            border: 2mm solid #032540; 
                            border-radius: 10mm;
                            box-shadow: 0 10px 30px rgba(0,0,0,0.05);
                        }
                        .scan-text { margin-top: 10mm; font-size: 1.2rem; color: #555; font-weight: 500; }
                        
                        .footer-info { width: 100%; border-top: 2px solid #eee; padding-top: 10mm; }
                        .date { font-size: 1.4rem; font-weight: 700; color: #032540; margin-bottom: 3mm; }
                        .system-tag { font-size: 1rem; color: #888; letter-spacing: 2px; text-transform: uppercase; }

                        @media print {
                            body { background: none; }
                            .page { box-shadow: none; margin: 0; width: 100%; height: 100%; }
                        }
                    </style>
                </head>
                <body>
                    <div class="page">
                        <div class="glow-orb orb-1"></div>
                        <div class="glow-orb orb-2"></div>

                        <div class="content">
                            <div class="header">
                                <div class="brand">Doulos Attendance</div>
                                <h1 class="meeting-name">${meeting.name}</h1>
                                <div class="details">${meeting.campus} &bull; ${meeting.startTime}</div>
                            </div>

                            <div class="qr-container">
                                <div class="scan-badge">SCAN ME!</div>
                                <img src="${qrDataUrl}" class="qr-code" />
                            </div>

                            <div class="footer">
                                <div class="instruction">
                                    <h3>Quick Check-In</h3>
                                    <p>Open your camera or QR scanner to mark your attendance instantly.</p>
                                </div>
                                <div class="meta">
                                    ${new Date(meeting.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>
                                    Doulos Solidarity
                                </div>
                            </div>
                        </div>
                    </div>
                    <script>
                        window.onload = () => {
                            setTimeout(() => {
                                window.print();
                                // window.onafterprint = () => window.close(); // Optional: Close after print
                            }, 500); 
                        };
                    </script>
                </body>
            </html>
        `;

        const win = window.open('', '_blank');
        win.document.write(printHtml);
        win.document.close();
    };

    const logout = () => {
        localStorage.clear();
        window.location.href = '/admin';
    };

    const toggleStatus = async (meeting) => {
        if (!meeting.isActive) return; // Already closed, can't reopen

        if (!window.confirm('Are you sure you want to CLOSE this meeting? Once closed, it cannot be reopened and the QR code will be disabled.')) return;

        try {
            await api.patch(`/meetings/${meeting._id}`, { isActive: false });
            fetchMeetings();
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to close meeting' });
        }
    };

    const saveMember = async (e) => {
        e.preventDefault();
        try {
            if (editingMember._id === 'NEW') {
                await api.post('/members', editingMember);
            } else {
                await api.patch(`/members/${editingMember._id}`, editingMember);
            }
            setMsg({ type: 'success', text: 'Member profile updated!' });
            setEditingMember(null);
            fetchMembers();
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to save member' });
        }
    };

    const handleResetDevice = async (memberId) => {
        if (!window.confirm('Are you sure you want to reset this student\'s device link? They will be able to check in with a new phone.')) return;
        try {
            await api.post(`/ members / ${memberId}/reset-device`);
            setMsg({ type: 'success', text: 'Device link reset successfully!' });
            fetchMembers();
            setEditingMember(null);
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to reset device' });
        }
    };

    const totalAttendanceCount = meetings.reduce((acc, current) => acc + (current.attendanceCount || 0), 0);
    const activeMeetingsCount = meetings.filter(m => m.isActive).length;

    return (
        <div style={{ position: 'relative', minHeight: '100vh', overflowX: 'hidden' }}>
            <BackgroundGallery />
            <ValentineRain />
            <div className="container" style={{ position: 'relative', zIndex: 1, paddingTop: '2rem', paddingBottom: '2rem' }}>
                <header className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                        <div className="rotating-logo">
                            <Logo size={45} />
                        </div>
                        <style>{`
                            .rotating-logo {
                                animation: rotateInfinite 20s linear infinite;
                            }
                            @keyframes rotateInfinite {
                                from { transform: rotate(0deg); }
                                to { transform: rotate(360deg); }
                            }
                        `}</style>
                        <div className="admin-nav" style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '0.25rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <button
                                onClick={() => setActiveTab('meetings')}
                                style={{
                                    padding: '0.5rem 1rem', borderRadius: '0.4rem', border: 'none', cursor: 'pointer',
                                    background: activeTab === 'meetings' ? 'hsl(var(--color-primary))' : 'transparent',
                                    color: activeTab === 'meetings' ? 'white' : 'var(--color-text-dim)',
                                    fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                Meetings
                            </button>
                            <button
                                onClick={() => setActiveTab('members')}
                                style={{
                                    padding: '0.5rem 1rem', borderRadius: '0.4rem', border: 'none', cursor: 'pointer',
                                    background: activeTab === 'members' ? 'hsl(var(--color-primary))' : 'transparent',
                                    color: activeTab === 'members' ? 'white' : 'var(--color-text-dim)',
                                    fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                Members
                            </button>
                            <button
                                onClick={() => setActiveTab('reports')}
                                style={{
                                    padding: '0.5rem 1rem', borderRadius: '0.4rem', border: 'none', cursor: 'pointer',
                                    background: activeTab === 'reports' ? 'hsl(var(--color-primary))' : 'transparent',
                                    color: activeTab === 'reports' ? 'white' : 'var(--color-text-dim)',
                                    fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                Reports
                            </button>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <button
                            className="btn"
                            style={{
                                padding: '0.6rem',
                                background: 'rgba(255,255,255,0.05)',
                                color: isDarkMode ? '#facc15' : 'var(--color-bg)',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}
                            onClick={() => setIsDarkMode(!isDarkMode)}
                        >
                            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <button
                            className="btn"
                            style={{
                                background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                                color: 'hsl(var(--color-text))',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}
                            onClick={logout}
                        >
                            Logout
                        </button>
                    </div>
                </header>

                {msg && (
                    <div style={{
                        position: 'fixed',
                        top: '2rem',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 2000,
                        minWidth: '300px',
                        padding: '1rem 1.5rem',
                        borderRadius: '0.75rem',
                        background: msg.type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(16, 185, 129, 0.95)',
                        color: 'white',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                        backdropFilter: 'blur(10px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.75rem',
                        fontWeight: 600,
                        animation: 'slideDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                        {msg.type === 'error' ? '⚠️' : '✅'} {msg.text}
                        <style>{`
                            @keyframes slideDown {
                                0% { opacity: 0; transform: translate(-50%, -20px); }
                                100% { opacity: 1; transform: translate(-50%, 0); }
                            }
                        `}</style>
                    </div>
                )}

                {/* Analytics Bar */}
                <div className="analytics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ padding: '0.75rem', background: 'rgba(37, 170, 225, 0.2)', borderRadius: '0.75rem', color: '#25AAE1' }}>
                            <Users size={24} />
                        </div>
                        <div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-dim)' }}>Total Check-ins</p>
                            <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{totalAttendanceCount}</h3>
                        </div>
                    </div>
                    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ padding: '0.75rem', background: 'rgba(255, 215, 0, 0.2)', borderRadius: '0.75rem', color: '#FFD700' }}>
                            <Activity size={24} />
                        </div>
                        <div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-dim)' }}>Active Meetings</p>
                            <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{activeMeetingsCount}</h3>
                        </div>
                    </div>
                    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ padding: '0.75rem', background: 'rgba(221, 93, 108, 0.2)', borderRadius: '0.75rem', color: '#dd5d6c' }}>
                            <BarChart3 size={24} />
                        </div>
                        <div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-dim)' }}>Total Events</p>
                            <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{meetings.length}</h3>
                        </div>
                    </div>
                </div>

                {activeTab === 'meetings' ? (
                    <>
                        {/* Actions */}
                        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
                                <Plus size={20} style={{ marginRight: '0.5rem' }} /> New Meeting
                            </button>
                        </div>

                        {/* Create Form */}
                        {showCreate && (
                            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', maxWidth: '800px' }}>
                                <h3>Create Meeting</h3>
                                <form onSubmit={handleCreate} className="create-meeting-form" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label>Meeting Name</label>
                                        <input className="input-field" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                                    </div>
                                    <div>
                                        <label>Date</label>
                                        <input type="date" className="input-field" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required />
                                    </div>
                                    <div>
                                        <label>Campus</label>
                                        <select className="input-field" value={formData.campus} onChange={e => setFormData({ ...formData, campus: e.target.value })}>
                                            <option value="Athi River">Athi River</option>
                                            <option value="Valley Road">Valley Road</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label>Start Time</label>
                                        <input type="time" className="input-field" value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} required />
                                    </div>
                                    <div>
                                        <label>End Time</label>
                                        <input type="time" className="input-field" value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} required />
                                    </div>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label>Question of the Day (Optional)</label>
                                        <input
                                            placeholder="e.g. What are you grateful for today?"
                                            className="input-field"
                                            value={formData.questionOfDay}
                                            onChange={e => setFormData({ ...formData, questionOfDay: e.target.value })}
                                        />
                                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', marginTop: '0.3rem' }}>
                                            This question will appear on the student check-in form.
                                        </p>
                                    </div>
                                    {['developer', 'superadmin'].includes(userRole) && (
                                        <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(37, 170, 225, 0.1)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(37, 170, 225, 0.2)' }}>
                                            <input
                                                type="checkbox"
                                                id="testMode"
                                                checked={formData.isTestMeeting}
                                                onChange={e => setFormData({ ...formData, isTestMeeting: e.target.checked })}
                                                style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
                                            />
                                            <label htmlFor="testMode" style={{ cursor: 'pointer', margin: 0, color: '#25AAE1', fontWeight: 600 }}>
                                                Developer Mode: Skip Time Restrictions
                                            </label>
                                        </div>
                                    )}

                                    {/* Geo-Location Security Section */}
                                    <div style={{ gridColumn: '1 / -1', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                            <label style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <MapPin size={16} /> Geo-Location Security
                                            </label>
                                            <button
                                                type="button"
                                                className="btn"
                                                onClick={() => {
                                                    if (navigator.geolocation) {
                                                        navigator.geolocation.getCurrentPosition(
                                                            (position) => {
                                                                setFormData({
                                                                    ...formData,
                                                                    location: {
                                                                        ...formData.location,
                                                                        latitude: position.coords.latitude,
                                                                        longitude: position.coords.longitude
                                                                    }
                                                                });
                                                                setMsg({ type: 'success', text: 'Location set to current position.' });
                                                            },
                                                            (error) => {
                                                                setMsg({ type: 'error', text: 'Unable to retrieve location.' });
                                                                console.error("Error getting location: ", error);
                                                            }
                                                        );
                                                    } else {
                                                        setMsg({ type: 'error', text: 'Geolocation is not supported by this browser.' });
                                                    }
                                                }}
                                                style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', background: 'rgba(37, 170, 225, 0.1)', color: '#25AAE1', border: '1px solid rgba(37, 170, 225, 0.3)' }}
                                            >
                                                Set to Current Location
                                            </button>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                <label>Location Name</label>
                                                <input
                                                    className="input-field"
                                                    placeholder="e.g. Daystar Athi River Chapel"
                                                    value={formData.location?.name || ''}
                                                    onChange={e => setFormData({
                                                        ...formData,
                                                        location: { ...formData.location, name: e.target.value }
                                                    })}
                                                />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                <label>Radius (meters)</label>
                                                <input
                                                    type="number"
                                                    className="input-field"
                                                    placeholder="200"
                                                    value={formData.location?.radius || 200}
                                                    onChange={e => setFormData({
                                                        ...formData,
                                                        location: { ...formData.location, radius: Number(e.target.value) }
                                                    })}
                                                />
                                            </div>
                                        </div>

                                        {(formData.location?.latitude && formData.location?.longitude) && (
                                            <div style={{ fontSize: '0.8rem', color: '#4ade80', background: 'rgba(74, 222, 128, 0.1)', padding: '0.5rem', borderRadius: '0.25rem', display: 'flex', gap: '1rem' }}>
                                                <span>Lat: {formData.location.latitude.toFixed(6)}</span>
                                                <span>Long: {formData.location.longitude.toFixed(6)}</span>
                                            </div>
                                        )}
                                    </div>



                                    {/* Dynamic Fields Section */}
                                    <div style={{ gridColumn: '1 / -1', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                            <label style={{ fontWeight: 'bold' }}>Student Form Fields</label>
                                            <button type="button" className="btn" onClick={addField} style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}>+ Add Field</button>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            {formData.requiredFields.map((field, index) => (
                                                <div key={index} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                    <input
                                                        placeholder="Label (e.g. Department)"
                                                        className="input-field"
                                                        value={field.label}
                                                        onChange={e => updateField(index, 'label', e.target.value)}
                                                        style={{ flex: 2 }}
                                                        required
                                                    />
                                                    <input
                                                        placeholder="Key (slug)"
                                                        className="input-field"
                                                        value={field.key}
                                                        onChange={e => updateField(index, 'key', e.target.value)}
                                                        style={{ flex: 1, fontSize: '0.8rem', opacity: 0.7 }}
                                                        required
                                                    />
                                                    <button type="button" onClick={() => removeField(index)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>×</button>
                                                </div>
                                            ))}
                                        </div>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', marginTop: '0.5rem' }}>
                                            * Use "Admission Number" (key: studentRegNo) for unique check-ins (Format: 00-0000).
                                        </p>
                                    </div>

                                    <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
                                        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem' }}>Create Meeting</button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Meetings List */}
                        <div className="meetings-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                            {meetings.map(m => (
                                <div key={m._id} className="glass-panel" style={{ padding: '1.5rem', position: 'relative', transition: 'all 0.3s ease', border: m.isActive ? '1px solid rgba(124, 58, 237, 0.3)' : '1px solid var(--glass-border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                            <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{m.name}</h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-dim)', fontSize: '0.85rem' }}>
                                                <MapPin size={14} /> {m.campus}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => toggleStatus(m)}
                                                disabled={!m.isActive}
                                                style={{
                                                    padding: '0.25rem 0.6rem',
                                                    borderRadius: '2rem',
                                                    fontSize: '0.7rem',
                                                    fontWeight: 'bold',
                                                    background: m.isActive ? 'rgba(74, 222, 128, 0.15)' : 'rgba(239, 68, 68, 0.1)',
                                                    color: m.isActive ? '#4ade80' : '#f87171',
                                                    border: m.isActive ? '1px solid #4ade80' : '1px solid #f87171',
                                                    cursor: m.isActive ? 'pointer' : 'default',
                                                    opacity: m.isActive ? 1 : 0.8
                                                }}
                                            >
                                                {m.isActive ? '• ACTIVE' : 'FINALIZED'}
                                            </button>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-dim)', fontSize: '0.8rem' }}>
                                                <Users size={14} /> {m.attendanceCount || 0}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-dim)', fontSize: '0.85rem' }}>
                                            <Calendar size={14} /> {new Date(m.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-dim)', fontSize: '0.85rem' }}>
                                            <Clock size={14} /> {m.startTime} - {m.endTime}
                                        </div>
                                    </div>

                                    {m.isActive && (
                                        <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
                                            <input
                                                className="input-field"
                                                placeholder="e.g. 22-0000"
                                                style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
                                                value={quickRegNo}
                                                onChange={e => {
                                                    let val = e.target.value.replace(/\D/g, '');
                                                    if (val.length > 2) {
                                                        val = val.slice(0, 2) + '-' + val.slice(2, 6);
                                                    }
                                                    setQuickRegNo(val);
                                                }}
                                            />
                                            <button
                                                className="btn btn-primary"
                                                style={{ padding: '0.4rem 0.8rem', flexShrink: 0 }}
                                                onClick={() => handleQuickCheckIn(m._id)}
                                                disabled={quickCheckInLoading}
                                            >
                                                {quickCheckInLoading ? '...' : <Plus size={16} />}
                                            </button>
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                        {m.isActive && (
                                            <button
                                                className="btn"
                                                style={{ flex: '1 1 60px', background: 'rgba(37, 170, 225, 0.15)', color: '#25AAE1', padding: '0.5rem', fontSize: '0.8rem' }}
                                                onClick={() => {
                                                    const now = new Date();
                                                    const [startH, startM] = m.startTime.split(':').map(Number);
                                                    const [endH, endM] = m.endTime.split(':').map(Number);

                                                    const start = new Date(m.date);
                                                    start.setHours(startH, startM, 0, 0);

                                                    const end = new Date(m.date);
                                                    end.setHours(endH, endM, 0, 0);

                                                    // Use state 'userRole' which is initialized from localStorage
                                                    const role = userRole || localStorage.getItem('role');
                                                    const isSuperUser = ['developer', 'superadmin', 'SuperAdmin'].includes(role);

                                                    const isWithinTime = now >= start && now <= end;

                                                    if (isSuperUser || isWithinTime) {
                                                        setSelectedMeeting(m);
                                                    } else {
                                                        // Developer Mode: Skip Time Restrictions
                                                        if (window.confirm(`⚠️ Time Restriction ⚠️\n\nThis meeting is scheduled for ${m.startTime} - ${m.endTime}.\nCurrent time is ${now.toLocaleTimeString()}.\n\nDo you want to FORCE OPEN the QR code anyway?`)) {
                                                            setSelectedMeeting(m);
                                                        }
                                                    }
                                                }}
                                            >
                                                <QrIcon size={16} style={{ marginRight: '0.3rem' }} /> QR
                                            </button>
                                        )}
                                        <button className="btn" style={{ flex: '2 1 100px', background: 'var(--glass-bg)', color: 'hsl(var(--color-text))', padding: '0.5rem', fontSize: '0.8rem', border: '1px solid var(--glass-border)' }} onClick={() => setViewingAttendance(m)}>
                                            View Attendance
                                        </button>
                                        <button className="btn" style={{ flex: '0 0 40px', background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-dim)', padding: '0.5rem' }} onClick={() => setEditingMeeting(m)}>
                                            <Pencil size={16} />
                                        </button>
                                        {['developer', 'superadmin'].includes(userRole) && (
                                            <button
                                                className="btn"
                                                style={{ flex: '0 0 40px', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', padding: '0.5rem' }}
                                                onClick={() => handleDeleteMeeting(m._id, m.name)}
                                                title="Delete Meeting (Requires password)"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : activeTab === 'members' ? (
                    <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Members Registry</h2>
                                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-dim)' }}>
                                    {members.length} members registered in the system
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '0.2rem', borderRadius: '0.5rem' }}>
                                    {['All', 'Athi River', 'Valley Road'].map(c => (
                                        <button
                                            key={c}
                                            onClick={() => setMemberCampusFilter(c)}
                                            style={{
                                                padding: '0.4rem 0.8rem', borderRadius: '0.3rem', border: 'none', cursor: 'pointer',
                                                background: memberCampusFilter === c ? 'rgba(37, 170, 225, 0.2)' : 'transparent',
                                                color: memberCampusFilter === c ? '#25AAE1' : 'var(--color-text-dim)',
                                                fontSize: '0.75rem', fontWeight: 600
                                            }}
                                        >{c === 'Valley Road' ? 'Nairobi' : c}</button>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '0.2rem', borderRadius: '0.5rem' }}>
                                    {['All', 'Douloid', 'Recruit', 'Visitor', 'Exempted'].map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setMemberTypeFilter(t)}
                                            style={{
                                                padding: '0.4rem 0.8rem', borderRadius: '0.3rem', border: 'none', cursor: 'pointer',
                                                background: memberTypeFilter === t ? 'rgba(167, 139, 250, 0.2)' : 'transparent',
                                                color: memberTypeFilter === t ? '#a78bfa' : 'var(--color-text-dim)',
                                                fontSize: '0.75rem', fontWeight: 600
                                            }}
                                        >{t}</button>
                                    ))}
                                </div>
                                {memberTypeFilter === 'Recruit' && (
                                    <button
                                        className="btn"
                                        style={{ background: 'rgba(234, 179, 8, 0.1)', color: '#eab308', fontSize: '0.8rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                        onClick={handleGraduateAll}
                                        title="Graduate all Recruits to Douloids"
                                    >
                                        <GraduationCap size={16} /> Graduate All Recruits
                                    </button>
                                )}
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                    {userRole === 'superadmin' && (
                                        <button
                                            className="btn"
                                            style={{ background: 'rgba(37, 170, 225, 0.1)', color: '#25AAE1', fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                                            onClick={handleSetupTestAccount}
                                            title="Designate a student as a permanent tester (will not show in reports)"
                                        >
                                            Setup Tester
                                        </button>
                                    )}
                                    {['developer', 'superadmin', 'admin'].includes(userRole) && (
                                        <button
                                            className="btn"
                                            style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '0.8rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                            onClick={handleResetAllPoints}
                                            title="Reset all points to 0"
                                        >
                                            <RotateCcw size={14} /> Reset Points
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <button className="btn" style={{ background: 'rgba(167, 139, 250, 0.1)', color: '#a78bfa', fontSize: '0.8rem', padding: '0.5rem 1rem' }} onClick={handleSyncRegistry}>
                                Sync
                            </button>

                            {/* Add Member Dropdown */}
                            <div style={{ position: 'relative' }}>
                                <button
                                    className="btn btn-primary"
                                    style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                    onClick={() => setShowAddMenu(!showAddMenu)}
                                >
                                    <Plus size={16} /> Add Member <ChevronDown size={14} />
                                </button>

                                {showAddMenu && (
                                    <div className="glass-panel" style={{
                                        position: 'absolute',
                                        top: '120%',
                                        right: 0,
                                        zIndex: 100,
                                        background: 'hsl(var(--color-bg))',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '0.5rem',
                                        padding: '0.5rem',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.25rem',
                                        minWidth: '180px',
                                        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)'
                                    }}>
                                        <button
                                            className="btn"
                                            style={{ justifyContent: 'flex-start', padding: '0.6rem', fontSize: '0.85rem', background: 'transparent', border: 'none' }}
                                            onClick={() => {
                                                setEditingMember({ _id: 'NEW', name: '', studentRegNo: '', campus: 'Athi River', memberType: 'Visitor' });
                                                setShowAddMenu(false);
                                            }}
                                        >
                                            <Users size={16} style={{ marginRight: '0.5rem', opacity: 0.7 }} /> Single Entry
                                        </button>
                                        <button
                                            className="btn"
                                            style={{ justifyContent: 'flex-start', padding: '0.6rem', fontSize: '0.85rem', background: 'transparent', border: 'none' }}
                                            onClick={() => {
                                                document.getElementById('import-file-input').click();
                                                setShowAddMenu(false);
                                            }}
                                        >
                                            <UploadCloud size={16} style={{ marginRight: '0.5rem', opacity: 0.7 }} /> Import File
                                        </button>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    id="import-file-input"
                                    hidden
                                    accept=".csv, .xlsx, .xls, .pdf, .docx, .doc"
                                    onChange={handleFileImport}
                                />
                            </div>
                        </div>

                        <button
                            className="btn"
                            style={{ background: 'rgba(37, 170, 225, 0.1)', color: '#25AAE1', fontSize: '0.8rem', padding: '0.5rem 1rem', border: '1px solid rgba(37,170,225,0.2)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                            onClick={downloadRegistryCSV}
                            title="Export full registry to CSV"
                        >
                            <FileSpreadsheet size={16} /> Export CSV
                        </button>

                        <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ position: 'relative' }}>
                                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-dim)' }} />
                                <input
                                    placeholder="Search registry by name or admission number..."
                                    className="input-field"
                                    style={{ paddingLeft: '3rem' }}
                                    value={memberSearch}
                                    onChange={e => setMemberSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                        <th style={{ padding: '1rem', color: 'var(--color-text-dim)', fontWeight: 500 }}>Member Details</th>
                                        <th style={{ padding: '1rem', color: 'var(--color-text-dim)', fontWeight: 500 }}>Points</th>
                                        <th style={{ padding: '1rem', color: 'var(--color-text-dim)', fontWeight: 500 }}>Campus</th>
                                        <th style={{ padding: '1rem', color: 'var(--color-text-dim)', fontWeight: 500 }}>Category</th>
                                        <th style={{ padding: '1rem', color: 'var(--color-text-dim)', fontWeight: 500 }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingMembers ? (
                                        <tr><td colSpan="5" style={{ padding: '3rem', textAlign: 'center' }}>Loading directory...</td></tr>
                                    ) : (
                                        (() => {
                                            const filtered = members.filter(m => {
                                                const matchesSearch =
                                                    m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
                                                    m.studentRegNo.toLowerCase().includes(memberSearch.toLowerCase());
                                                const matchesCampus = memberCampusFilter === 'All' || m.campus === memberCampusFilter;
                                                return matchesSearch && matchesCampus;
                                            });

                                            if (filtered.length === 0) {
                                                return (
                                                    <tr>
                                                        <td colSpan="5" style={{ padding: '4rem', textAlign: 'center' }}>
                                                            <div style={{ color: 'var(--color-text-dim)', marginBottom: '1.5rem' }}>
                                                                <Users size={48} style={{ opacity: 0.2, marginBottom: '1rem', margin: '0 auto' }} />
                                                                <p>{memberSearch || memberCampusFilter !== 'All' ? 'No members match your filters.' : 'Registry is empty. Sync from history to populate it.'}</p>
                                                            </div>
                                                            {!memberSearch && memberCampusFilter === 'All' && (
                                                                <button className="btn btn-primary" onClick={handleSyncRegistry}>
                                                                    Sync Registry from History
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            }

                                            return filtered.map((m, i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }} onClick={() => { setEditingMember(m); fetchMemberInsights(m.studentRegNo); }}>
                                                    <td style={{ padding: '1rem' }}>
                                                        <div style={{ fontWeight: 600 }}>{m.name}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>{m.studentRegNo}</div>
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#FFD700', fontWeight: 800 }}>
                                                            <Trophy size={14} /> {m.totalPoints || 0}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--color-text-dim)' }}>
                                                        {m.campus}
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <span style={{
                                                            padding: '0.2rem 0.5rem',
                                                            background: m.memberType === 'Douloid' ? 'rgba(255, 215, 0, 0.1)' :
                                                                m.memberType === 'Recruit' ? 'rgba(37, 170, 225, 0.1)' :
                                                                    m.memberType === 'Exempted' ? 'rgba(239, 68, 68, 0.1)' :
                                                                        'rgba(255, 255, 255, 0.05)',
                                                            color: m.memberType === 'Douloid' ? '#FFD700' :
                                                                m.memberType === 'Recruit' ? '#25AAE1' :
                                                                    m.memberType === 'Exempted' ? '#f87171' :
                                                                        'var(--color-text-dim)',
                                                            borderRadius: '4px',
                                                            fontSize: '0.7rem',
                                                            fontWeight: 'bold',
                                                            textTransform: 'uppercase'
                                                        }}>
                                                            {m.memberType}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                            <button
                                                                className="btn"
                                                                style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem', background: 'rgba(167, 139, 250, 0.1)', color: '#a78bfa' }}
                                                                onClick={(e) => { e.stopPropagation(); setEditingMember(m); fetchMemberInsights(m.studentRegNo); }}
                                                            >
                                                                Insights
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ));
                                        })()
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <ReportsView
                        meetings={meetings}
                        members={members}
                        onViewAttendance={setViewingAttendance}
                        onDownload={downloadReport}
                        onDownloadCSV={downloadCSV}
                        onDownloadCumulativeCSV={downloadCumulativeCSV}
                    />
                )
                }

                {/* Member Insights & Profile Modal */}
                {
                    editingMember && (
                        <div style={{
                            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                            background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 110, padding: '1rem'
                        }} onClick={() => { setEditingMember(null); setMemberInsights(null); }}>
                            <div className="glass-panel" style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem', background: 'hsl(var(--color-bg))' }} onClick={e => e.stopPropagation()}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                                    <div>
                                        <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'hsl(var(--color-primary))' }}>{editingMember._id === 'NEW' ? 'Register New Member' : editingMember.name}</h2>
                                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.5rem' }}>
                                            <p style={{ color: 'var(--color-text-dim)', margin: 0 }}>{editingMember.studentRegNo} • {editingMember.campus}</p>
                                            {memberInsights?.history?.[0] && !loadingInsights && (
                                                <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '1rem', color: 'var(--color-text-dim)' }}>
                                                    Last seen: {new Date(memberInsights.history[0].date).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button className="btn" onClick={() => { setEditingMember(null); setMemberInsights(null); }} style={{ padding: '0.5rem 1rem' }}>Close</button>
                                </div>

                                {editingMember._id === 'NEW' ? (
                                    <form onSubmit={saveMember} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                                            <div>
                                                <label style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>Full Name</label>
                                                <input className="input-field" required value={editingMember.name} onChange={e => setEditingMember({ ...editingMember, name: e.target.value })} />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>Admission Number</label>
                                                <input
                                                    className="input-field"
                                                    required
                                                    value={editingMember.studentRegNo}
                                                    onChange={e => {
                                                        let val = e.target.value.replace(/\D/g, '');
                                                        if (val.length > 2) {
                                                            val = val.slice(0, 2) + '-' + val.slice(2, 6);
                                                        }
                                                        setEditingMember({ ...editingMember, studentRegNo: val });
                                                    }}
                                                    placeholder="e.g. 22-0000"
                                                />
                                            </div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                                            <div>
                                                <label style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>Campus</label>
                                                <select className="input-field" value={editingMember.campus} onChange={e => setEditingMember({ ...editingMember, campus: e.target.value })}>
                                                    <option value="Athi River">Athi River</option>
                                                    <option value="Valley Road">Valley Road</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>Category</label>
                                                <select className="input-field" value={editingMember.memberType} onChange={e => setEditingMember({ ...editingMember, memberType: e.target.value })}>
                                                    <option value="Douloid">Douloid</option>
                                                    <option value="Recruit">Recruit</option>
                                                    <option value="Visitor">Visitor</option>
                                                    <option value="Exempted">Exempted</option>
                                                </select>
                                            </div>
                                        </div>
                                        <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', padding: '1rem' }}>Save Member</button>
                                    </form>
                                ) : (
                                    <div>
                                        {loadingInsights ? (
                                            <div style={{ padding: '3rem', textAlign: 'center', opacity: 0.5 }}>Analyzing attendance data...</div>
                                        ) : memberInsights ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                                {/* Stats Cards */}
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                                                    <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                        <div style={{ color: 'var(--color-text-dim)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Points</div>
                                                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFD700' }}>{editingMember.totalPoints || 0}</div>
                                                    </div>
                                                    <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                        <div style={{ color: 'var(--color-text-dim)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Attended</div>
                                                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#25AAE1' }}>{memberInsights.stats.physicalAttended}{memberInsights.stats.exemptedCount > 0 ? ` + ${memberInsights.stats.exemptedCount}E` : ''} / {memberInsights.stats.totalMeetings}</div>
                                                    </div>
                                                    <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                        <div style={{ color: 'var(--color-text-dim)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Consistency</div>
                                                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: memberInsights.stats.percentage > 75 ? '#4ade80' : '#facc15' }}>{memberInsights.stats.percentage}%</div>
                                                    </div>
                                                </div>

                                                {/* Attendance Trend (Custom Chart) */}
                                                <div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                                        <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Attendance Trend (Last 20)</h4>
                                                        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.7rem' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                <div style={{ width: '8px', height: '8px', background: '#25AAE1', borderRadius: '2px' }}></div> Present
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                <div style={{ width: '8px', height: '8px', background: '#FFD700', borderRadius: '2px' }}></div> Exempt
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                <div style={{ width: '8px', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}></div> Absent
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '100px', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '0.5rem' }}>
                                                        {memberInsights.history.slice(0, 20).reverse().map((h, idx) => (
                                                            <div
                                                                key={idx}
                                                                title={`${h.name} (${new Date(h.date).toLocaleDateString()}): ${h.isExempted ? 'Exempted' : h.attended ? 'Present' : 'Absent'}`}
                                                                style={{
                                                                    flex: 1,
                                                                    height: (h.attended || h.isExempted) ? '100%' : '15%',
                                                                    background: h.isExempted ? '#FFD700' : h.attended ? '#25AAE1' : 'rgba(255,255,255,0.1)',
                                                                    borderRadius: '2px',
                                                                    transition: 'all 0.3s ease',
                                                                    opacity: (h.attended || h.isExempted) ? 1 : 0.3
                                                                }}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Category Display */}
                                                <div className="glass-panel" style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                                    <div>
                                                        <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-dim)' }}>Profile Category</h4>
                                                    </div>
                                                    <span style={{
                                                        padding: '0.4rem 1rem',
                                                        borderRadius: '2rem',
                                                        fontSize: '0.8rem',
                                                        fontWeight: 700,
                                                        background: editingMember.memberType === 'Exempted' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(167, 139, 250, 0.1)',
                                                        color: editingMember.memberType === 'Exempted' ? '#f87171' : '#a78bfa',
                                                        border: editingMember.memberType === 'Exempted' ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(167, 139, 250, 0.2)'
                                                    }}>
                                                        {editingMember.memberType.toUpperCase()}
                                                    </span>
                                                </div>

                                                {/* History List */}
                                                <div>
                                                    <h4 style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>Meeting History</h4>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                        {memberInsights.history.slice(0, 10).map((h, idx) => (
                                                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.4rem', fontSize: '0.85rem' }}>
                                                                <span>{h.name}</span>
                                                                <span style={{ color: h.isExempted ? '#FFD700' : h.attended ? '#4ade80' : '#f87171', fontWeight: 600 }}>
                                                                    {h.isExempted ? 'EXEMPTED' : h.attended ? 'PRESENT' : 'ABSENT'}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ padding: '3rem', textAlign: 'center' }}>No attendance history found.</div>
                                        )}
                                        {/* Super Admin Actions */}
                                        <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            <button
                                                className="btn"
                                                style={{
                                                    width: '100%',
                                                    background: 'rgba(37, 170, 225, 0.1)',
                                                    color: '#25AAE1',
                                                    border: '1px solid rgba(37, 170, 225, 0.2)',
                                                    padding: '0.75rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '0.5rem'
                                                }}
                                                onClick={() => handleResetDevice(editingMember._id)}
                                            >
                                                <RotateCcw size={16} /> Unlock Device / Reset Link
                                            </button>

                                            {['developer', 'superadmin'].includes(userRole) && (
                                                <button
                                                    className="btn"
                                                    style={{
                                                        width: '100%',
                                                        background: 'rgba(239, 68, 68, 0.1)',
                                                        color: '#ef4444',
                                                        border: '1px solid rgba(239, 68, 68, 0.2)',
                                                        padding: '0.75rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '0.5rem'
                                                    }}
                                                    onClick={() => handleDeleteMember(editingMember._id, editingMember.name)}
                                                >
                                                    <Trash2 size={16} /> Delete Member Permanentely
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                }

                {/* Attendance View Modal */}
                {
                    viewingAttendance && (
                        <div style={{
                            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                            background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100
                        }}>
                            <div className="glass-panel" style={{ width: '90%', maxWidth: '1000px', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'hsl(var(--color-bg))', padding: 0, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                                <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ margin: 0 }}>{viewingAttendance.name} - Attendance</h3>
                                    <button className="btn" style={{ padding: '0.5rem 1rem' }} onClick={() => setViewingAttendance(null)}>Close</button>
                                </div>
                                <div style={{ overflow: 'auto', padding: '1rem', flex: 1 }}>
                                    <AttendanceTable meeting={viewingAttendance} setMsg={setMsg} />
                                </div>
                            </div>
                        </div>
                    )
                }

                {
                    selectedMeeting && (
                        <div style={{
                            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                            background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100
                        }} onClick={() => setSelectedMeeting(null)}>
                            <div className="glass-panel qr-modal-content" style={{ padding: '2rem', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                                <h3 style={{ marginBottom: '1rem' }}>Scan to Check In</h3>

                                {/* 
                                SECURITY FEATURE: Screen Blur
                                We blur the QR code on screen so it cannot be scanned directly.
                                It must be printed to be scanned cleanly.
                            */}
                                <div style={{
                                    background: 'white',
                                    padding: '1rem',
                                    borderRadius: '0.5rem',
                                    display: 'inline-block'
                                }}>
                                    <QRCode
                                        value={`${window.location.origin}/check-in/${selectedMeeting.code}`}
                                        size={256}
                                        level="H"
                                    />
                                </div>

                                <p style={{ marginTop: '1rem', fontWeight: 'bold' }}>{selectedMeeting.name}</p>
                                <p style={{ color: 'var(--color-text-dim)', fontSize: '0.9rem' }}>{selectedMeeting.campus} | {selectedMeeting.startTime} - {selectedMeeting.endTime}</p>

                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                                    <button
                                        className="btn btn-primary"
                                        style={{ padding: '0.5rem 1.5rem' }}
                                        onClick={() => handlePrintQR(selectedMeeting)}
                                    >
                                        <Download size={14} style={{ marginRight: '0.4rem' }} /> Print QR
                                    </button>
                                    <button
                                        className="btn"
                                        style={{ background: 'var(--glass-bg)', color: 'var(--color-text)', fontSize: '0.8rem', padding: '0.5rem 1rem', border: '1px solid var(--glass-border)' }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const link = `${window.location.origin}/check-in/${selectedMeeting.code}`;
                                            navigator.clipboard.writeText(link);
                                            setMsg({ type: 'success', text: 'Link copied to clipboard!' });
                                        }}
                                    >
                                        <LinkIcon size={14} style={{ marginRight: '0.4rem' }} /> Copy Link
                                    </button>
                                    {['developer', 'superadmin'].includes(userRole) && (
                                        <a
                                            href={`/check-in/${selectedMeeting.code}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="btn"
                                            style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-dim)', fontSize: '0.8rem', padding: '0.5rem 1rem', textDecoration: 'none' }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <ExternalLink size={14} style={{ marginRight: '0.4rem' }} /> Test
                                        </a >
                                    )}
                                </div >
                                <p style={{ color: 'var(--color-text-dim)', fontSize: '0.8rem', marginTop: '1.5rem', opacity: 0.7 }}>Click anywhere outside to close</p>
                            </div >
                        </div >
                    )
                }

                {/* Edit Meeting Modal */}
                {
                    editingMeeting && (
                        <div style={{
                            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                            background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100
                        }}>
                            <div className="glass-panel" style={{ width: '90%', maxWidth: '600px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
                                <h3 style={{ marginBottom: '1.5rem' }}>Edit Meeting Content</h3>
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    try {
                                        await api.patch(`/meetings/${editingMeeting._id}`, editingMeeting);
                                        setMsg({ type: 'success', text: 'Meeting updated!' });
                                        setEditingMeeting(null);
                                        fetchMeetings();
                                    } catch (err) {
                                        setMsg({ type: 'error', text: 'Failed to update' });
                                    }
                                }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                                    <div>
                                        <label>Devotion (Topic / Verse)</label>
                                        <textarea
                                            className="input-field"
                                            rows="3"
                                            value={editingMeeting.devotion || ''}
                                            onChange={e => setEditingMeeting({ ...editingMeeting, devotion: e.target.value })}
                                            placeholder="e.g. John 3:16 - The Heart of Service"
                                        />
                                    </div>

                                    <div>
                                        <label>Ice Breaker / Activity</label>
                                        <textarea
                                            className="input-field"
                                            rows="2"
                                            value={editingMeeting.iceBreaker || ''}
                                            onChange={e => setEditingMeeting({ ...editingMeeting, iceBreaker: e.target.value })}
                                            placeholder="e.g. Two Truths and a Lie"
                                        />
                                    </div>

                                    <div>
                                        <label>Announcements</label>
                                        <textarea
                                            className="input-field"
                                            rows="3"
                                            value={editingMeeting.announcements || ''}
                                            onChange={e => setEditingMeeting({ ...editingMeeting, announcements: e.target.value })}
                                            placeholder="Check your emails for the retreat info!"
                                        />
                                    </div>

                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Changes</button>
                                        <button type="button" className="btn" onClick={() => setEditingMeeting(null)} style={{ background: 'transparent', border: '1px solid var(--glass-border)' }}>Cancel</button>
                                    </div>

                                    {/* Location Settings */}
                                    <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
                                        <h4 style={{ marginBottom: '1rem' }}>Geo-Location Security</h4>
                                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '0.5rem' }}>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-dim)', marginBottom: '1rem' }}>
                                                Set the allowed check-in zone to your current location.
                                                Students must be within <strong>{editingMeeting.location?.radius || 200} meters</strong> of this point.
                                            </p>

                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' }}>
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ fontSize: '0.8rem' }}>Location Name</label>
                                                    <input
                                                        className="input-field"
                                                        value={editingMeeting.location?.name || ''}
                                                        onChange={e => setEditingMeeting({
                                                            ...editingMeeting,
                                                            location: { ...editingMeeting.location, name: e.target.value }
                                                        })}
                                                        placeholder="e.g. Athi River Chapel"
                                                    />
                                                </div>
                                                <div style={{ width: '100px' }}>
                                                    <label style={{ fontSize: '0.8rem' }}>Radius (m)</label>
                                                    <input
                                                        type="number"
                                                        className="input-field"
                                                        value={editingMeeting.location?.radius || 200}
                                                        onChange={e => setEditingMeeting({
                                                            ...editingMeeting,
                                                            location: { ...editingMeeting.location, radius: parseInt(e.target.value) || 200 }
                                                        })}
                                                    />
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (!navigator.geolocation) {
                                                        setMsg({ type: 'error', text: 'Geolocation is not supported by your browser' });
                                                        return;
                                                    }
                                                    navigator.geolocation.getCurrentPosition(
                                                        async (position) => {
                                                            const { latitude, longitude } = position.coords;
                                                            try {
                                                                await api.post(`/meetings/${editingMeeting._id}/location`, {
                                                                    latitude,
                                                                    longitude,
                                                                    radius: editingMeeting.location?.radius || 200,
                                                                    name: editingMeeting.location?.name || 'My Current Location'
                                                                });
                                                                setMsg({ type: 'success', text: 'Location updated to your current position!' });
                                                                fetchMeetings();
                                                                setEditingMeeting(null);
                                                            } catch (err) {
                                                                setMsg({ type: 'error', text: 'Failed to update location' });
                                                            }
                                                        },
                                                        (err) => {
                                                            setMsg({ type: 'error', text: 'Could not get your location. Allow permission.' });
                                                        }
                                                    );
                                                }}
                                                className="btn"
                                                style={{
                                                    width: '100%',
                                                    background: 'rgba(37, 170, 225, 0.1)',
                                                    color: '#25AAE1',
                                                    border: '1px solid rgba(37, 170, 225, 0.2)',
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    gap: '0.5rem'
                                                }}
                                            >
                                                <MapPin size={16} /> Set to My Current Position
                                            </button>
                                            {editingMeeting.location?.latitude && (
                                                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#4ade80', textAlign: 'center' }}>
                                                    ✅ Location Active: {editingMeeting.location.latitude.toFixed(4)}, {editingMeeting.location.longitude.toFixed(4)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
            </div>
        </div>
    );
};

const ReportsView = ({ meetings, members, onViewAttendance, onDownload, onDownloadCSV, onDownloadCumulativeCSV }) => {
    const [reportType, setReportType] = useState('summary'); // 'summary' or 'cumulative'
    const [filterSemester, setFilterSemester] = useState('Current');
    const [filterCampus, setFilterCampus] = useState('All');

    const getSemester = (date) => {
        const d = new Date(date);
        const month = d.getMonth(); // 0-11
        const year = d.getFullYear();
        if (month <= 4) return `Jan Semester ${year}`;
        if (month <= 7) return `May Semester ${year}`;
        return `Sept Semester ${year}`;
    };

    const currentSemester = getSemester(new Date());
    const semesters = Array.from(new Set(meetings.map(m => getSemester(m.date))));
    if (!semesters.includes(currentSemester)) semesters.push(currentSemester);

    const filteredMeetings = meetings.filter(m => {
        const semesterMatch = filterSemester === 'All' ||
            (filterSemester === 'Current' ? getSemester(m.date) === currentSemester : getSemester(m.date) === filterSemester);
        const campusMatch = filterCampus === 'All' || m.campus === filterCampus;
        return semesterMatch && campusMatch;
    });

    const totalAttendance = filteredMeetings.reduce((acc, m) => acc + (m.attendanceCount || 0), 0);
    const averageAttendance = filteredMeetings.length > 0 ? (totalAttendance / filteredMeetings.length).toFixed(1) : 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', animation: 'fadeIn 0.5s ease-out' }}>
            <div className="glass-panel" style={{ padding: '2rem', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1.5rem' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Reports & Analytics</h2>
                        <p style={{ margin: '0.2rem 0 0', color: 'var(--color-text-dim)', fontSize: '0.9rem' }}>Real-time attendance tracking and insights</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '0.75rem' }}>
                        <select
                            className="input-field"
                            style={{
                                padding: '0.5rem 2rem 0.5rem 1rem',
                                width: 'auto',
                                border: 'none',
                                background: 'rgba(255,255,255,0.05)',
                                fontSize: '0.8rem',
                                fontWeight: 600
                            }}
                            value={filterSemester}
                            onChange={(e) => setFilterSemester(e.target.value)}
                        >
                            <option value="Current">This Semester</option>
                            <option value="All">All Time</option>
                            {semesters.filter(s => s !== currentSemester).map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                        <select
                            className="input-field"
                            style={{
                                padding: '0.5rem 2rem 0.5rem 1rem',
                                width: 'auto',
                                border: 'none',
                                background: 'rgba(255,255,255,0.05)',
                                fontSize: '0.8rem',
                                fontWeight: 600
                            }}
                            value={filterCampus}
                            onChange={(e) => setFilterCampus(e.target.value)}
                        >
                            <option value="All">Global (All)</option>
                            <option value="Athi River">Athi River</option>
                            <option value="Valley Road">Valley Road</option>
                        </select>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                    <div style={{ padding: '1.5rem', background: 'var(--glass-bg)', borderRadius: '1rem', border: '1px solid rgba(37, 170, 225, 0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#25AAE1', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>
                            <Activity size={14} /> Gross Attendance
                        </div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'hsl(var(--color-text))' }}>{totalAttendance}</div>
                    </div>
                    <div style={{ padding: '1.5rem', background: 'var(--glass-bg)', borderRadius: '1rem', border: '1px solid rgba(167, 139, 250, 0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a78bfa', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>
                            <Calendar size={14} /> Total Meetings
                        </div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'hsl(var(--color-text))' }}>{filteredMeetings.length}</div>
                    </div>
                    <div style={{ padding: '1.5rem', background: 'var(--glass-bg)', borderRadius: '1rem', border: '1px solid rgba(250, 204, 21, 0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#facc15', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>
                            <Users size={14} /> Avg Engagement
                        </div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'hsl(var(--color-text))' }}>{averageAttendance}</div>
                    </div>
                    <div
                        onClick={() => onDownloadCumulativeCSV(members.filter(m => filterCampus === 'All' || m.campus === filterCampus), filterSemester === 'Current' ? currentSemester : filterSemester)}
                        style={{
                            padding: '1.5rem',
                            background: 'rgba(255,255,255,0.02)',
                            borderRadius: '1rem',
                            border: '1px solid rgba(255,255,255,0.1)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.3s'
                        }}
                        className="hover-bright"
                    >
                        <Download size={24} style={{ marginBottom: '0.5rem', color: 'var(--color-primary)' }} />
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Export Core Matrix</span>
                    </div>
                </div>

                {/* Visual Analytics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
                    <div className="glass-panel" style={{ padding: '2rem', height: '350px', background: 'rgba(0,0,0,0.2)' }}>
                        <h3 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1.5rem', color: '#25AAE1' }}>Frequency Analysis</h3>
                        <ResponsiveContainer width="100%" height="85%">
                            <LineChart data={[...filteredMeetings].reverse().map(m => ({ name: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), count: m.attendanceCount || 0 }))}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                <XAxis dataKey="name" stroke="var(--color-text-dim)" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--color-text-dim)" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}
                                    itemStyle={{ color: 'hsl(var(--color-text))', fontWeight: 700 }}
                                />
                                <Line type="monotone" dataKey="count" stroke="#25AAE1" strokeWidth={4} dot={{ r: 0 }} activeDot={{ r: 6, fill: '#25AAE1', stroke: 'hsl(var(--color-bg))', strokeWidth: 2 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="glass-panel" style={{ padding: '2rem', height: '350px', background: 'var(--glass-bg)' }}>
                        <h3 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1.5rem', color: '#a78bfa' }}>Segment Integrity</h3>
                        <ResponsiveContainer width="100%" height="85%">
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Douloids', value: members.filter(m => m.memberType === 'Douloid' && (filterCampus === 'All' || m.campus === filterCampus)).length },
                                        { name: 'Recruits', value: members.filter(m => m.memberType === 'Recruit' && (filterCampus === 'All' || m.campus === filterCampus)).length },
                                        { name: 'Visitors', value: members.filter(m => (m.memberType === 'Visitor' || !m.memberType) && (filterCampus === 'All' || m.campus === filterCampus)).length },
                                    ]}
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={8}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    <Cell fill="#FFD700" />
                                    <Cell fill="#a78bfa" />
                                    <Cell fill="#25AAE1" />
                                </Pie>
                                <Tooltip
                                    contentStyle={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-panel" style={{ background: 'var(--glass-bg)', borderRadius: '1rem', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                    <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--color-text-dim)' }}>Archived Logs</div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '0.2rem', borderRadius: '0.5rem' }}>
                                <button
                                    onClick={() => setReportType('summary')}
                                    style={{
                                        padding: '0.4rem 0.8rem', borderRadius: '0.3rem', border: 'none', cursor: 'pointer',
                                        background: reportType === 'summary' ? 'rgba(37, 170, 225, 0.2)' : 'transparent',
                                        color: reportType === 'summary' ? '#25AAE1' : 'var(--color-text-dim)',
                                        fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase'
                                    }}
                                >Logs</button>
                                <button
                                    onClick={() => setReportType('cumulative')}
                                    style={{
                                        padding: '0.4rem 0.8rem', borderRadius: '0.3rem', border: 'none', cursor: 'pointer',
                                        background: reportType === 'cumulative' ? 'rgba(37, 170, 225, 0.2)' : 'transparent',
                                        color: reportType === 'cumulative' ? '#25AAE1' : 'var(--color-text-dim)',
                                        fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase'
                                    }}
                                >Cumulative</button>
                            </div>
                        </div>
                    </div>

                    {reportType === 'summary' ? (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(0,0,0,0.2)' }}>
                                        <th style={{ padding: '1.25rem', color: 'var(--color-text-dim)', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Meeting Name</th>
                                        <th style={{ padding: '1.25rem', color: 'var(--color-text-dim)', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Date</th>
                                        <th style={{ padding: '1.25rem', color: 'var(--color-text-dim)', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Campus</th>
                                        <th style={{ padding: '1.25rem', color: 'var(--color-text-dim)', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Attendance</th>
                                        <th style={{ padding: '1.25rem', color: 'var(--color-text-dim)', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', textAlign: 'center' }}>Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredMeetings.map((m, i) => (
                                        <tr key={i} className="hover-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'all 0.2s' }}>
                                            <td style={{ padding: '1.25rem', fontWeight: 600, color: 'white' }}>{m.name}</td>
                                            <td style={{ padding: '1.25rem', fontSize: '0.8rem', opacity: 0.6 }}>{new Date(m.date).toLocaleDateString('en-GB')}</td>
                                            <td style={{ padding: '1.25rem' }}>
                                                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#facc15', background: 'rgba(250, 204, 21, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                                                    {m.campus.toUpperCase()}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1.25rem', fontWeight: 800, color: '#25AAE1', fontSize: '1.1rem' }}>{m.attendanceCount || 0}</td>
                                            <td style={{ padding: '1.25rem', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                    <button
                                                        onClick={() => onViewAttendance(m)}
                                                        className="btn-icon"
                                                        style={{ background: 'rgba(37, 170, 225, 0.1)', color: '#25AAE1' }}
                                                    >
                                                        <Users size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => onDownloadCSV(m._id, m.name)}
                                                        className="btn-icon"
                                                        style={{ background: 'rgba(250, 204, 21, 0.1)', color: '#facc15' }}
                                                    >
                                                        <FileSpreadsheet size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(0,0,0,0.2)' }}>
                                        <th style={{ padding: '1.25rem', color: 'var(--color-text-dim)', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Subject Name</th>
                                        <th style={{ padding: '1.25rem', color: 'var(--color-text-dim)', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>ID Hash</th>
                                        <th style={{ padding: '1.25rem', color: 'var(--color-text-dim)', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Classification</th>
                                        <th style={{ padding: '1.25rem', color: 'var(--color-text-dim)', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>Aggregated Units</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {members
                                        .filter(m => filterCampus === 'All' || m.campus === filterCampus)
                                        .map((m, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                <td style={{ padding: '1.25rem', fontWeight: 600, color: 'white' }}>{m.name || 'Unknown'}</td>
                                                <td style={{ padding: '1.25rem', fontSize: '0.8rem', opacity: 0.6, fontFamily: 'monospace' }}>{m.studentRegNo}</td>
                                                <td style={{ padding: '1.25rem' }}>
                                                    <span style={{
                                                        fontSize: '0.7rem',
                                                        fontWeight: 800,
                                                        color: m.memberType === 'Douloid' ? '#FFD700' : '#25AAE1',
                                                        border: `1px solid ${m.memberType === 'Douloid' ? 'rgba(255,215,0,0.3)' : 'rgba(37,170,225,0.3)'}`,
                                                        padding: '0.2rem 0.6rem',
                                                        borderRadius: '20px'
                                                    }}>
                                                        {m.memberType.toUpperCase() || 'VISITOR'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1.25rem', fontWeight: 800, fontSize: '1.1rem', color: '#4ade80' }}>{m.totalAttended}</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const AttendanceTable = ({ meeting, setMsg }) => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const userRole = localStorage.getItem('role') || 'admin';

    const deleteRecord = async (id) => {
        if (!window.confirm('Delete this attendance record?')) return;
        try {
            await api.delete(`/attendance/${id}`);
            setRecords(records.filter(r => r._id !== id));
            setMsg({ type: 'success', text: 'Record deleted.' });
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to delete' });
        }
    };

    const toggleExemption = async (id) => {
        try {
            const res = await api.patch(`/attendance/${id}/exemption`);
            setRecords(records.map(r => r._id === id ? { ...r, isExempted: res.data.isExempted } : r));
            setMsg({ type: 'success', text: `Status updated to ${res.data.isExempted ? 'Exempted' : 'Present'}` });
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to update exemption status' });
        }
    };


    useEffect(() => {
        const fetchAttendance = async () => {
            try {
                const res = await api.get(`/attendance/${meeting._id}`);
                setRecords(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAttendance();
    }, [meeting._id]);

    if (loading) return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading records...</div>;

    // Determine headers
    const allKeys = new Set();
    let sampleQuestion = '';

    records.forEach(r => {
        const responses = r.responses || {};
        Object.keys(responses).forEach(k => {
            if (k !== 'dailyQuestionAnswer') allKeys.add(k);
        });
        if (r.questionOfDay) sampleQuestion = r.questionOfDay;
    });

    const headers = Array.from(allKeys);
    // Add Daily Question to the end if any record has a question
    const hasDailyQuestion = records.some(r => r.responses?.dailyQuestionAnswer);

    // Filtering logic
    const filteredRecords = records.filter(r => {
        const searchPool = [
            ...(Object.values(r.responses || {})),
            r.memberType,
            r.studentRegNo
        ].join(' ').toLowerCase();
        return searchPool.includes(searchTerm.toLowerCase());
    });

    return (
        <div>
            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-dim)' }} />
                <input
                    placeholder="Search by name, reg no, or any field..."
                    className="input-field"
                    style={{ paddingLeft: '3rem' }}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--color-text-dim)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Found {filteredRecords.length} records</span>
                {searchTerm && <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer' }}>Clear search</button>}
            </div>

            {filteredRecords.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--color-primary-glow)', borderRadius: '1rem' }}>
                    No students match your search.
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                                <th style={{ padding: '1rem', color: 'var(--color-text-dim)', fontWeight: 500, borderBottom: '1px solid var(--glass-border)' }}>Time</th>
                                <th style={{ padding: '1rem', color: 'var(--color-text-dim)', fontWeight: 500, borderBottom: '1px solid var(--glass-border)' }}>Category</th>
                                {headers.map(h => (
                                    <th key={h} style={{ padding: '1rem', textTransform: 'capitalize', color: 'var(--color-text-dim)', fontWeight: 500, borderBottom: '1px solid var(--glass-border)' }}>
                                        {h.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                    </th>
                                ))}
                                {hasDailyQuestion && (
                                    <th style={{ padding: '1rem', color: 'var(--color-text-dim)', fontWeight: 500, borderBottom: '1px solid var(--glass-border)', minWidth: '200px' }}>
                                        Question of the Day
                                        <div style={{ fontSize: '0.7rem', fontWeight: 'normal', fontStyle: 'italic', marginTop: '4px' }}>
                                            "{meeting.questionOfDay || sampleQuestion || 'Daily Question'}"
                                        </div>
                                    </th>
                                )}
                                <th style={{ padding: '1rem', color: 'var(--color-text-dim)', fontWeight: 500, borderBottom: '1px solid var(--glass-border)' }}>Status</th>
                                {['developer', 'superadmin'].includes(userRole) && (
                                    <th style={{ padding: '1rem', color: 'var(--color-text-dim)', fontWeight: 500, borderBottom: '1px solid var(--glass-border)' }}>Action</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRecords.map((r, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }}>
                                    <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--color-text-dim)' }}>
                                        {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.9rem', fontWeight: 600, color: 'hsl(var(--color-primary))' }}>
                                        {r.memberType || 'Visitor'}
                                    </td>
                                    {headers.map(h => (
                                        <td key={h} style={{ padding: '1rem', fontSize: '0.9rem' }}>
                                            {r.responses?.[h] || '-'}
                                        </td>
                                    ))}
                                    {hasDailyQuestion && (
                                        <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#a78bfa' }}>
                                            {r.responses?.dailyQuestionAnswer || '-'}
                                        </td>
                                    )}
                                    <td style={{ padding: '1rem' }}>
                                        <span
                                            style={{
                                                padding: '0.3rem 0.6rem',
                                                borderRadius: '2rem',
                                                fontSize: '0.7rem',
                                                fontWeight: 800,
                                                background: 'rgba(37, 170, 225, 0.1)',
                                                color: '#25AAE1',
                                                border: '1px solid rgba(37, 170, 225, 0.2)',
                                                letterSpacing: '0.5px'
                                            }}
                                        >
                                            PRESENT
                                        </span>
                                    </td>
                                    {['developer', 'superadmin'].includes(userRole) && meeting.isActive && (
                                        <td style={{ padding: '0.5rem 1rem' }}>
                                            <button
                                                onClick={() => deleteRecord(r._id)}
                                                style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.4rem', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                title="Delete Record"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
