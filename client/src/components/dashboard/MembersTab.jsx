import { useState, useEffect } from 'react';
import { 
    Users, FileSpreadsheet, ChevronDown, Plus, Search, RotateCcw, 
    CheckCircle, Archive, GraduationCap, Trash2, ListChecks, X, Trophy, 
    Calendar, MapPin, Lightbulb, Settings as SettingsIcon,
    Unlock, Award, Activity, ShieldAlert, Clock, User
} from 'lucide-react';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';

const MembersTab = ({ 
    members, 
    loadingMembers, 
    userRole, 
    isGuest, 
    fetchMembers, 
    setMsg, 
    currentSemester, 
    api 
}) => {
    // Registry Search & Filters State
    const [memberSearch, setMemberSearch] = useState('');
    const [memberCampusFilter, setMemberCampusFilter] = useState('All');
    const [memberTypeFilter, setMemberTypeFilter] = useState('All');
    const [activeSemesterFilter, setActiveSemesterFilter] = useState(false);
    const [selectedMemberIds, setSelectedMemberIds] = useState([]);
    
    // UI Modal Toggles
    const [showAddMenu, setShowAddMenu] = useState(false);
    const [showActionMenu, setShowActionMenu] = useState(false);
    const [showBulkListTool, setShowBulkListTool] = useState(false);
    const [bulkListType, setBulkListType] = useState('graduate');
    const [bulkListInput, setBulkListInput] = useState('');
    
    const [editingMember, setEditingMember] = useState(null);
    const [memberInsights, setMemberInsights] = useState(null);
    const [loadingInsights, setLoadingInsights] = useState(false);
    const [isEditingMemberProfile, setIsEditingMemberProfile] = useState(false);
    
    const [importLoading, setImportLoading] = useState(false);

    // Fetch members on filters change
    useEffect(() => {
        fetchMembers();
    }, [memberCampusFilter, memberTypeFilter, activeSemesterFilter]);

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

    const handleSyncRegistry = async () => {
        if (isGuest) return setMsg({ type: 'error', text: 'Action disabled in Guest Mode.' });
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

    const handleBulkEnroll = async () => {
        if (isGuest) return setMsg({ type: 'error', text: 'Action disabled in Guest Mode.' });
        if (!window.confirm(`This will automatically ENROLL all members who checked into any meetings assigned to ${currentSemester}. Continue?`)) return;

        setImportLoading(true);
        try {
            const res = await api.post('/members/bulk-enroll');
            setMsg({ type: 'success', text: res.data.message });
            fetchMembers();
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Bulk enrollment failed' });
        } finally {
            setImportLoading(false);
        }
    };

    const handleGraduateAll = async () => {
        if (isGuest) return setMsg({ type: 'error', text: 'Action disabled in Guest Mode.' });
        if (!window.confirm('Are you sure you want to graduate all Recruits to Douloids?')) return;
        const pwd = prompt('Enter admin password to confirm:');
        if (!pwd) return;
        try {
            await api.post('/members/graduate-all', { confirmPassword: pwd });
            setMsg({ type: 'success', text: 'All recruits graduated!' });
            fetchMembers();
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to graduate recruits' });
        }
    };

    const handleArchiveAllRecruits = async () => {
        if (isGuest) return setMsg({ type: 'error', text: 'Action disabled in Guest Mode.' });
        if (!window.confirm('⚠️ ARCHIVE ALL RECRUITS ⚠️\n\nThis will archive ALL members currently marked as Recruits. They will no longer be able to log in but their data will remain. Proceed?')) return;

        const pwd = prompt('Enter admin password to confirm archival:');
        if (!pwd) return;

        try {
            const res = await api.post('/members/archive-all-recruits', { confirmPassword: pwd });
            setMsg({ type: 'success', text: res.data.message });
            fetchMembers();
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to archive recruits' });
        }
    };

    const handleUndoGraduation = async () => {
        if (isGuest) return setMsg({ type: 'error', text: 'Action disabled in Guest Mode.' });
        if (!window.confirm('⚠️ UNDO GRADUATION ⚠️\n\nThis will revert all recently graduated members back to Recruits. Do you want to proceed?')) return;

        const pwd = prompt('Enter admin password to confirm undo:');
        if (!pwd) return;

        try {
            const res = await api.post('/members/undo-graduation', { confirmPassword: pwd });
            setMsg({ type: 'success', text: res.data.message });
            fetchMembers();
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to undo graduation' });
        }
    };

    const handleSetupTestAccount = async () => {
        if (isGuest) return setMsg({ type: 'error', text: 'Action disabled in Guest Mode.' });
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

    const handleResetAllPoints = async () => {
        if (isGuest) return setMsg({ type: 'error', text: 'Action disabled in Guest Mode.' });
        if (!window.confirm('Are you sure you want to reset ALL points for ALL members? This cannot be undone.')) return;
        try {
            await api.post('/members/reset-all-points');
            setMsg({ type: 'success', text: 'All points have been reset.' });
            fetchMembers();
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to reset points' });
        }
    };

    const handleBulkGraduate = async () => {
        if (isGuest) return setMsg({ type: 'error', text: 'Action disabled in Guest Mode.' });
        if (selectedMemberIds.length === 0) return;
        if (!window.confirm(`Graduate ${selectedMemberIds.length} selected recruits to Douloid status? They will see the celebratory graduation screen when they next login.`)) return;
        try {
            await api.post('/members/bulk-graduate', { memberIds: selectedMemberIds });
            setMsg({ type: 'success', text: `Successfully graduated ${selectedMemberIds.length} members!` });
            setSelectedMemberIds([]);
            fetchMembers();
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to graduate members' });
        }
    };

    const handleBulkListAction = async () => {
        if (isGuest) return setMsg({ type: 'error', text: 'Action disabled in Guest Mode.' });
        const regNos = bulkListInput.split('\n').map(r => r.trim()).filter(r => r);
        if (regNos.length === 0) return;

        try {
            setImportLoading(true);
            const endpoint = bulkListType === 'graduate' ? '/members/graduate-by-regnos' : '/members/archive-by-regnos';
            const res = await api.post(endpoint, { regNos });
            setMsg({ type: 'success', text: res.data.message });
            setShowBulkListTool(false);
            setBulkListInput('');
            fetchMembers();
        } catch (err) {
            setMsg({ type: 'error', text: 'Action failed: ' + (err.response?.data?.message || 'Server error') });
        } finally {
            setImportLoading(false);
        }
    };

    // Smart File Importing
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
                const pdfjsLib = window.pdfjsLib;
                if (!pdfjsLib) {
                    throw new Error('PDFJS Library is not loaded.');
                }
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

        const regNoRegex = /(\d{2})[- ]?(\d{4})/g;

        lines.forEach(line => {
            let match;
            while ((match = regNoRegex.exec(line)) !== null) {
                const stdRegNo = `${match[1]}-${match[2]}`;
                const lowerLine = line.toLowerCase();

                let campus = 'Athi River';
                if (lowerLine.includes('valley') || lowerLine.includes('nairobi')) campus = 'Valley Road';

                let memberType = 'Visitor';
                if (lowerLine.includes('douloid')) memberType = 'Douloid';
                else if (lowerLine.includes('recruit')) memberType = 'Recruit';
                else if (lowerLine.includes('exempt')) memberType = 'Exempted';

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

    // Individual Member Profile/Insights
    const fetchMemberInsights = async (regNo) => {
        setLoadingInsights(true);
        if (isGuest) {
            setMemberInsights({
                member: { name: 'Guest Member', studentRegNo: regNo, totalPoints: 100 },
                stats: { totalMeetings: 10, physicalAttended: 8, percentage: 80, exemptedCount: 0 },
                history: [
                    { date: new Date().toISOString(), name: 'Sample Meeting 1', attended: true },
                    { date: new Date(Date.now() - 86400000).toISOString(), name: 'Sample Meeting 2', attended: true },
                ]
            });
            setLoadingInsights(false);
            return;
        }
        try {
            const res = await api.get(`/attendance/student/${regNo}`);
            setMemberInsights(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingInsights(false);
        }
    };

    const saveMember = async (e) => {
        e.preventDefault();
        if (isGuest) return setMsg({ type: 'error', text: 'Action disabled in Guest Mode.' });

        try {
            if (editingMember._id === 'NEW') {
                await api.post('/members', editingMember);
                const firstName = editingMember.name.split(' ')[0];
                setMsg({ type: 'success', text: `Success! ${firstName} has been added!` });
                setEditingMember(prev => ({
                    ...prev,
                    name: '',
                    studentRegNo: '',
                    memberType: 'Visitor',
                    status: 'Active',
                    lastActiveSemester: '',
                    wateringDays: []
                }));
            } else {
                await api.patch(`/members/${editingMember._id}`, editingMember);
                setMsg({ type: 'success', text: 'Member profile updated!' });
                setEditingMember(null);
            }
            fetchMembers();
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to save member' });
        }
    };

    const handleDeleteMember = async (id, name) => {
        if (isGuest) return setMsg({ type: 'error', text: 'Deletion disabled in Guest Mode.' });
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

    const handleGraduateMember = async (memberId) => {
        if (isGuest) return setMsg({ type: 'error', text: 'Action disabled in Guest Mode.' });
        if (!window.confirm('Graduate this member to Douloid status?')) return;
        try {
            await api.post(`/members/${memberId}/graduate`);
            setMsg({ type: 'success', text: 'Member graduated!' });
            fetchMemberInsights(editingMember.studentRegNo);
            fetchMembers();
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to graduate member' });
        }
    };

    const handleResetMemberPoints = async (memberId) => {
        if (isGuest) return setMsg({ type: 'error', text: 'Action disabled in Guest Mode.' });
        if (!window.confirm("Reset this member's points to 0?")) return;
        try {
            await api.post(`/members/${memberId}/reset-points`);
            setMsg({ type: 'success', text: 'Points reset.' });
            fetchMemberInsights(editingMember.studentRegNo);
            fetchMembers();
            if (editingMember) setEditingMember(prev => ({ ...prev, totalPoints: 0 }));
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to reset points' });
        }
    };

    const handleResetDevice = async (memberId) => {
        if (isGuest) return setMsg({ type: 'error', text: 'Action disabled in Guest Mode.' });
        if (!window.confirm("Are you sure you want to reset this student's device link? They will be able to check in with a new phone.")) return;
        try {
            await api.post(`/members/${memberId}/reset-device`);
            setMsg({ type: 'success', text: 'Device link reset successfully!' });
            fetchMembers();
            setEditingMember(null);
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to reset device' });
        }
    };

    const filteredMembers = members.filter(m => {
        const cleanSearch = memberSearch.toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanName = m.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanReg = m.studentRegNo.toLowerCase().replace(/[^a-z0-9]/g, '');

        const matchesSearch = !memberSearch || cleanName.includes(cleanSearch) || cleanReg.includes(cleanSearch);
        const matchesCampus = memberCampusFilter === 'All' || m.campus === memberCampusFilter;
        const matchesType = memberTypeFilter === 'All' || m.memberType === memberTypeFilter;
        return matchesSearch && matchesCampus && matchesType;
    });

    return (
        <div className="glass-card-premium" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)', border: '1px solid rgba(29, 166, 217, 0.15)' }}>
            
            {/* Registry Header & Toolbar */}
            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(2, 21, 37, 0.4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.5px', color: '#1da6d9', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Users size={24} /> Members Registry
                        </h2>
                        <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem', fontWeight: 600 }}>
                            {members.length} members registered in the system
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                        <button
                            className="btn"
                            style={{ background: 'rgba(29, 166, 217, 0.1)', color: '#1da6d9', fontSize: '0.85rem', padding: '0.6rem 1.2rem', border: '1px solid rgba(29,166,217,0.2)', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '0.75rem', fontWeight: 700 }}
                            onClick={downloadRegistryCSV}
                            title="Export full registry to CSV"
                        >
                            <FileSpreadsheet size={16} /> Export CSV
                        </button>
                        <div style={{ position: 'relative' }}>
                            <button
                                className="btn btn-primary"
                                style={{ fontSize: '0.85rem', padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '0.75rem', fontWeight: 800 }}
                                onClick={() => { setShowAddMenu(!showAddMenu); setShowActionMenu(false); }}
                            >
                                <Plus size={18} /> Add Member <ChevronDown size={14} />
                            </button>
                            {showAddMenu && (
                                <div className="glass-card-premium" style={{
                                    position: 'absolute', top: '115%', right: 0, zIndex: 100,
                                    background: 'rgba(9, 29, 46, 0.95)', border: '1px solid rgba(29, 166, 217, 0.25)',
                                    borderRadius: '0.75rem', padding: '0.5rem', display: 'flex', flexDirection: 'column',
                                    gap: '0.25rem', minWidth: '200px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                                }}>
                                    <button className="btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', padding: '0.75rem', fontSize: '0.9rem', background: 'transparent', border: 'none', textAlign: 'left', color: 'white', fontWeight: 600, width: '100%', gap: '0.5rem' }}
                                        onClick={() => { setEditingMember({ _id: 'NEW', name: '', studentRegNo: '', campus: 'Athi River', memberType: 'Visitor' }); setShowAddMenu(false); }}>
                                        <Users size={16} style={{ opacity: 0.7, color: '#1da6d9' }} /> Single Entry
                                    </button>
                                    <button className="btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', padding: '0.75rem', fontSize: '0.9rem', background: 'transparent', border: 'none', textAlign: 'left', color: 'white', fontWeight: 600, width: '100%', gap: '0.5rem' }}
                                        onClick={() => { document.getElementById('import-file-input').click(); setShowAddMenu(false); }}>
                                        <FileSpreadsheet size={16} style={{ opacity: 0.7, color: '#34d399' }} /> Import Excel / CSV
                                    </button>
                                </div>
                            )}
                            <input type="file" id="import-file-input" hidden accept=".csv, .xlsx, .xls, .pdf, .doc, .docx" onChange={handleFileImport} />
                        </div>

                        {/* Action Center Dropdown */}
                        <div style={{ position: 'relative' }}>
                            <button
                                className="btn"
                                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.85rem', padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '0.75rem', fontWeight: 700 }}
                                onClick={() => { setShowActionMenu(!showActionMenu); setShowAddMenu(false); }}
                            >
                                <SettingsIcon size={16} /> Admin Actions <ChevronDown size={14} />
                            </button>
                            {showActionMenu && (
                                <div className="glass-card-premium" style={{
                                    position: 'absolute', top: '115%', right: 0, zIndex: 100,
                                    background: 'rgba(9, 29, 46, 0.95)', border: '1px solid rgba(29, 166, 217, 0.25)',
                                    borderRadius: '0.75rem', padding: '0.5rem', display: 'flex', flexDirection: 'column',
                                    gap: '0.25rem', minWidth: '240px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                                }}>
                                    <button className="btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', padding: '0.6rem 0.75rem', fontSize: '0.85rem', background: 'transparent', border: 'none', textAlign: 'left', color: '#22c55e', fontWeight: 600, width: '100%', gap: '0.5rem' }}
                                        onClick={() => { handleBulkEnroll(); setShowActionMenu(false); }}>
                                        <CheckCircle size={14} /> Bulk Enroll This Sem
                                    </button>
                                    <button className="btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', padding: '0.6rem 0.75rem', fontSize: '0.85rem', background: 'transparent', border: 'none', textAlign: 'left', color: 'white', fontWeight: 600, width: '100%', gap: '0.5rem' }}
                                        onClick={() => { handleSyncRegistry(); setShowActionMenu(false); }}>
                                        <RotateCcw size={14} /> Sync from History
                                    </button>
                                    
                                    {memberTypeFilter === 'Recruit' && (
                                        <>
                                            <button className="btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', padding: '0.6rem 0.75rem', fontSize: '0.85rem', background: 'transparent', border: 'none', textAlign: 'left', color: '#eab308', fontWeight: 600, width: '100%', gap: '0.5rem' }}
                                                onClick={() => { handleGraduateAll(); setShowActionMenu(false); }}>
                                                <GraduationCap size={14} /> Graduate All Recruits
                                            </button>
                                            <button className="btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', padding: '0.6rem 0.75rem', fontSize: '0.85rem', background: 'transparent', border: 'none', textAlign: 'left', color: '#f87171', fontWeight: 600, width: '100%', gap: '0.5rem' }}
                                                onClick={() => { handleArchiveAllRecruits(); setShowActionMenu(false); }}>
                                                <Archive size={14} /> Archive Rem. Recruits
                                            </button>
                                        </>
                                    )}

                                    {memberTypeFilter === 'Douloid' && (
                                        <button className="btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', padding: '0.6rem 0.75rem', fontSize: '0.85rem', background: 'transparent', border: 'none', textAlign: 'left', color: '#f87171', fontWeight: 600, width: '100%', gap: '0.5rem' }}
                                            onClick={() => { handleUndoGraduation(); setShowActionMenu(false); }}>
                                            <RotateCcw size={14} /> Undo Graduation
                                        </button>
                                    )}

                                    {['developer', 'superadmin'].includes(userRole) && (
                                        <>
                                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', margin: '0.25rem 0' }}></div>
                                            <button className="btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', padding: '0.6rem 0.75rem', fontSize: '0.85rem', background: 'transparent', border: 'none', textAlign: 'left', color: '#1da6d9', fontWeight: 600, width: '100%', gap: '0.5rem' }}
                                                onClick={() => { setShowBulkListTool(true); setShowActionMenu(false); }}>
                                                <ListChecks size={14} /> Bulk List Actions
                                            </button>
                                            <button className="btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', padding: '0.6rem 0.75rem', fontSize: '0.85rem', background: 'transparent', border: 'none', textAlign: 'left', color: '#1da6d9', fontWeight: 600, width: '100%', gap: '0.5rem' }}
                                                onClick={() => { handleSetupTestAccount(); setShowActionMenu(false); }}>
                                                <SettingsIcon size={14} /> Setup Tester Account
                                            </button>
                                            <button className="btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', padding: '0.6rem 0.75rem', fontSize: '0.85rem', background: 'transparent', border: 'none', textAlign: 'left', color: '#ef4444', fontWeight: 600, width: '100%', gap: '0.5rem' }}
                                                onClick={() => { handleResetAllPoints(); setShowActionMenu(false); }}>
                                                <Trash2 size={14} /> Reset All Points
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                    </div>
                </div>

                {/* Toolbar: Search & Filters */}
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: '1 1 300px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                        <input
                            placeholder="Search by name or admission number..."
                            className="modern-input"
                            style={{ paddingLeft: '3rem', width: '100%' }}
                            value={memberSearch}
                            onChange={e => setMemberSearch(e.target.value)}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '0.35rem', background: 'rgba(2, 21, 37, 0.4)', padding: '0.35rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                        {['All', 'Athi River', 'Valley Road'].map(c => (
                            <button key={c} onClick={() => setMemberCampusFilter(c)}
                                style={{
                                    padding: '0.4rem 0.85rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer',
                                    background: memberCampusFilter === c ? 'rgba(29, 166, 217, 0.2)' : 'transparent',
                                    color: memberCampusFilter === c ? '#1da6d9' : 'rgba(255,255,255,0.6)',
                                    fontSize: '0.75rem', fontWeight: 700, transition: 'all 0.2s'
                                }}
                            >{c === 'Valley Road' ? 'Nairobi' : c}</button>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '0.35rem', background: 'rgba(2, 21, 37, 0.4)', padding: '0.35rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                        {['All', 'Douloid', 'Recruit', 'Visitor', 'Exempted'].map(t => (
                            <button key={t} onClick={() => setMemberTypeFilter(t)}
                                style={{
                                    padding: '0.4rem 0.85rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer',
                                    background: memberTypeFilter === t ? 'rgba(167, 139, 250, 0.2)' : 'transparent',
                                    color: memberTypeFilter === t ? '#a78bfa' : 'rgba(255,255,255,0.6)',
                                    fontSize: '0.75rem', fontWeight: 700, transition: 'all 0.2s'
                                }}
                            >{t}</button>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '0.35rem', background: 'rgba(2, 21, 37, 0.4)', padding: '0.35rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <button onClick={() => setActiveSemesterFilter(!activeSemesterFilter)}
                            style={{
                                padding: '0.4rem 0.85rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer',
                                background: activeSemesterFilter ? 'rgba(34, 197, 94, 0.2)' : 'transparent',
                                color: activeSemesterFilter ? '#22c55e' : 'rgba(255,255,255,0.6)',
                                fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.2s'
                            }}
                        >
                            <CheckCircle size={14} style={{ color: activeSemesterFilter ? '#22c55e' : 'rgba(255,255,255,0.4)' }} /> Active This Sem
                        </button>
                    </div>
                </div>
            </div>

            {/* Registry Grid */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '1.5rem' }}>
                {loadingMembers ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                        <div className="loading-spinner-small" style={{ margin: '0 auto 1rem', width: '32px', height: '32px', borderTopColor: '#25AAE1' }}></div>
                        Loading directory...
                    </div>
                ) : filteredMembers.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center' }}>
                        <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '1.5rem' }}>
                            <Users size={48} style={{ opacity: 0.2, marginBottom: '1rem', margin: '0 auto', color: '#25AAE1' }} />
                            <p>{memberSearch || memberCampusFilter !== 'All' ? 'No members match your filters.' : 'Registry is empty. Sync from history to populate it.'}</p>
                        </div>
                        {!memberSearch && memberCampusFilter === 'All' && (
                            <button className="btn btn-primary" onClick={handleSyncRegistry} style={{ borderRadius: '0.75rem', fontWeight: 800 }}>
                                Sync Registry from History
                            </button>
                        )}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {/* Select All Filtered Controls */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', paddingLeft: '0.5rem' }} onClick={e => e.stopPropagation()}>
                            <input
                                id="select-all-registry"
                                type="checkbox"
                                style={{ width: '16px', height: '16px', accentColor: '#25AAE1', cursor: 'pointer' }}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setSelectedMemberIds(filteredMembers.map(m => m._id));
                                    } else {
                                        setSelectedMemberIds([]);
                                    }
                                }}
                                checked={selectedMemberIds.length > 0 && selectedMemberIds.length === filteredMembers.length}
                            />
                            <label htmlFor="select-all-registry" style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, cursor: 'pointer', userSelect: 'none' }}>
                                Select All Filtered ({filteredMembers.length} members)
                            </label>
                        </div>

                        {/* Modern Responsive Card Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                            {filteredMembers.map((m, i) => {
                                const isSelected = selectedMemberIds.includes(m._id);
                                return (
                                    <div
                                        key={i}
                                        className="glass-card-premium interactive"
                                        style={{
                                            padding: '1.25rem',
                                            border: isSelected ? '1px solid rgba(37, 170, 225, 0.3)' : '1px solid rgba(255,255,255,0.04)',
                                            background: isSelected ? 'rgba(37, 170, 225, 0.05)' : '#0d111b',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '1rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.25s ease'
                                        }}
                                        onClick={() => { setEditingMember(m); fetchMemberInsights(m.studentRegNo); }}
                                    >
                                        {/* Card Selection Checkbox & Category Tag */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                style={{ width: '16px', height: '16px', accentColor: '#25AAE1', cursor: 'pointer' }}
                                                checked={isSelected}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedMemberIds([...selectedMemberIds, m._id]);
                                                    } else {
                                                        setSelectedMemberIds(selectedMemberIds.filter(id => id !== m._id));
                                                    }
                                                }}
                                            />
                                            <span className="status-pill-modern" style={{
                                                background: m.memberType === 'Douloid' ? 'rgba(255, 215, 0, 0.08)' :
                                                            m.memberType === 'Recruit' ? 'rgba(37, 170, 225, 0.08)' :
                                                            m.memberType === 'Exempted' ? 'rgba(239, 68, 68, 0.08)' :
                                                            'rgba(255, 255, 255, 0.04)',
                                                color: m.memberType === 'Douloid' ? '#FFD700' :
                                                       m.memberType === 'Recruit' ? '#25AAE1' :
                                                       m.memberType === 'Exempted' ? '#f87171' :
                                                       'rgba(255,255,255,0.5)',
                                                border: m.memberType === 'Douloid' ? '1px solid rgba(255, 215, 0, 0.15)' :
                                                             m.memberType === 'Recruit' ? '1px solid rgba(37, 170, 225, 0.15)' :
                                                             m.memberType === 'Exempted' ? '1px solid rgba(239, 68, 68, 0.15)' :
                                                             '1px solid rgba(255, 255, 255, 0.05)',
                                                fontSize: '0.62rem',
                                                padding: '0.2rem 0.5rem',
                                                borderRadius: '1rem',
                                                fontWeight: 800,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px'
                                            }}>
                                                {m.memberType}
                                            </span>
                                        </div>

                                        {/* Avatar & Profile Details */}
                                        <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
                                            <div style={{
                                                width: '42px', height: '42px', borderRadius: '50%',
                                                background: 'rgba(255, 255, 255, 0.02)',
                                                border: '1px solid rgba(255,255,255,0.05)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '1rem', fontWeight: 900, color: '#94a3b8', flexShrink: 0
                                            }}>
                                                {(m.name || 'U').charAt(0).toUpperCase()}
                                            </div>
                                            <div style={{ minWidth: 0, flex: 1 }}>
                                                <div style={{ fontWeight: 800, color: 'white', fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {m.name}
                                                </div>
                                                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.1rem', fontWeight: 600 }}>
                                                    {m.studentRegNo}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Campus Info & Trophy Points Badge */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)', padding: '0.6rem 0.85rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.03)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', fontWeight: 700 }}>
                                                <MapPin size={12} color="#25AAE1" />
                                                <span>{m.campus === 'Valley Road' ? 'Nairobi' : m.campus}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#fbbf24', fontWeight: 900, background: 'rgba(251, 191, 36, 0.08)', padding: '0.2rem 0.5rem', borderRadius: '0.5rem', fontSize: '0.78rem', border: '1px solid rgba(251, 191, 36, 0.15)' }}>
                                                <Trophy size={11} style={{ color: '#fbbf24', fill: '#fbbf24' }} /> {m.totalPoints || 0} pts
                                            </div>
                                        </div>

                                        {/* Actions Footer */}
                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }} onClick={e => e.stopPropagation()}>
                                            <button
                                                className="btn"
                                                style={{ flex: 1, fontSize: '0.75rem', padding: '0.45rem', background: 'rgba(37, 170, 225, 0.1)', color: '#25AAE1', border: '1px solid rgba(37, 170, 225, 0.15)', borderRadius: '0.5rem', fontWeight: 700 }}
                                                onClick={() => { setEditingMember(m); fetchMemberInsights(m.studentRegNo); }}
                                            >
                                                Insights
                                            </button>
                                            {['developer', 'superadmin'].includes(userRole) && (
                                                <button
                                                    className="btn btn-sign-out"
                                                    style={{ width: '34px', height: '34px', padding: 0, borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    onClick={() => handleDeleteMember(m._id, m.name)}
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Member Profile/Insights Modal */}
            {editingMember && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(2, 6, 12, 0.75)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 110, padding: '1rem',
                }} onClick={() => { setEditingMember(null); setMemberInsights(null); setIsEditingMemberProfile(false); }}>
                    <div className="glass-panel" style={{ 
                        width: '100%', 
                        maxWidth: '850px', 
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        padding: '2rem', 
                        background: '#090d16',
                        borderRadius: '1.25rem',
                        border: '1px solid rgba(29, 166, 217, 0.2)',
                        boxShadow: '0 24px 64px rgba(0, 0, 0, 0.85), 0 0 40px rgba(29, 166, 217, 0.08)',
                        animation: 'popScale 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }} onClick={e => e.stopPropagation()}>
                        
                        {/* High-End Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                            {editingMember._id === 'NEW' ? (
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#1da6d9', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Plus size={24} /> Register New Member
                                    </h2>
                                    <p style={{ color: 'rgba(255,255,255,0.4)', margin: '0.25rem 0 0 0', fontSize: '0.85rem', fontWeight: 600 }}>Create a new member profile in the registry</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    {/* Glowing Ring Avatar */}
                                    <div style={{
                                        width: '60px',
                                        height: '60px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 900,
                                        fontSize: '1.35rem',
                                        color: 'white',
                                        flexShrink: 0,
                                        background: editingMember.memberType === 'Douloid' ? 'linear-gradient(135deg, #b45309, #d97706, #fbbf24)' :
                                                    editingMember.memberType === 'Recruit' ? 'linear-gradient(135deg, #0369a1, #0284c7, #38bdf8)' :
                                                    editingMember.memberType === 'Exempted' ? 'linear-gradient(135deg, #be123c, #e11d48, #fb7185)' :
                                                    'linear-gradient(135deg, #475569, #64748b, #cbd5e1)',
                                        boxShadow: editingMember.memberType === 'Douloid' ? '0 0 15px rgba(251, 191, 36, 0.3)' :
                                                   editingMember.memberType === 'Recruit' ? '0 0 15px rgba(56, 189, 248, 0.3)' :
                                                   editingMember.memberType === 'Exempted' ? '0 0 15px rgba(251, 113, 133, 0.3)' :
                                                   '0 0 15px rgba(203, 213, 225, 0.1)',
                                        border: editingMember.memberType === 'Douloid' ? '2px solid #fbbf24' :
                                                editingMember.memberType === 'Recruit' ? '2px solid #38bdf8' :
                                                editingMember.memberType === 'Exempted' ? '2px solid #fb7185' :
                                                '2px solid #cbd5e1'
                                    }}>
                                        {(editingMember.name || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'white', letterSpacing: '-0.5px' }}>{editingMember.name}</h2>
                                        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                                            <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>{editingMember.studentRegNo} • {editingMember.campus === 'Valley Road' ? 'Nairobi' : editingMember.campus}</span>
                                            {memberInsights?.history?.[0] && !loadingInsights && (
                                                <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '1rem', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 700 }}>
                                                    <Clock size={11} /> Seen {new Date(memberInsights.history[0].date).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginLeft: 'auto' }}>
                                {['developer', 'superadmin', 'admin', 'Admin'].includes(userRole) && editingMember._id !== 'NEW' && (
                                    <button
                                        className="btn"
                                        onClick={() => setIsEditingMemberProfile(!isEditingMemberProfile)}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            background: isEditingMemberProfile ? 'rgba(29, 166, 217, 0.2)' : 'rgba(255,255,255,0.05)',
                                            color: isEditingMemberProfile ? '#1da6d9' : 'rgba(255,255,255,0.6)',
                                            border: isEditingMemberProfile ? '1px solid rgba(29,166,217,0.3)' : '1px solid rgba(255,255,255,0.08)',
                                            fontWeight: 800, borderRadius: '0.6rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.2s'
                                        }}
                                    >
                                        {isEditingMemberProfile ? <Activity size={14} /> : <User size={14} />}
                                        {isEditingMemberProfile ? 'View Insights' : 'Edit Profile'}
                                    </button>
                                )}
                                <button className="btn" 
                                    onClick={() => { setEditingMember(null); setMemberInsights(null); setIsEditingMemberProfile(false); }} 
                                    style={{ 
                                        padding: '0.5rem 1rem', 
                                        borderRadius: '0.6rem', 
                                        background: 'rgba(239, 68, 68, 0.1)', 
                                        color: '#f87171', 
                                        border: '1px solid rgba(239,68,68,0.15)',
                                        fontWeight: 800,
                                        fontSize: '0.82rem',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>

                        {editingMember._id === 'NEW' || isEditingMemberProfile ? (
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

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                                    <div>
                                        <label style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>Membership Status</label>
                                        <select className="input-field" value={editingMember.status || 'Active'} onChange={e => setEditingMember({ ...editingMember, status: e.target.value })}>
                                            <option value="Active">Active</option>
                                            <option value="Archived">Archived (Paused Access)</option>
                                            <option value="Graduated">Graduated</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>Last Active Semester</label>
                                        <input
                                            className="input-field"
                                            value={editingMember.lastActiveSemester || ''}
                                            onChange={e => setEditingMember({ ...editingMember, lastActiveSemester: e.target.value })}
                                            placeholder="e.g. MAY-AUG 2026"
                                        />
                                    </div>
                                </div>

                                <div className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', display: 'block', marginBottom: '0.75rem' }}>Tree Watering Commitments (Weekly)</label>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                                            const isActive = (editingMember.wateringDays || []).includes(day);
                                            return (
                                                <button
                                                    key={day}
                                                    type="button"
                                                    onClick={() => {
                                                        const current = editingMember.wateringDays || [];
                                                        const updated = isActive
                                                            ? current.filter(d => d !== day)
                                                            : [...current, day];
                                                        setEditingMember({ ...editingMember, wateringDays: updated });
                                                    }}
                                                    style={{
                                                        padding: '0.5rem 0.8rem', borderRadius: '0.5rem', border: '1px solid',
                                                        borderColor: isActive ? '#4ade80' : 'rgba(255,255,255,0.1)',
                                                        background: isActive ? 'rgba(74, 222, 128, 0.1)' : 'rgba(255,255,255,0.05)',
                                                        color: isActive ? '#4ade80' : 'var(--color-text-dim)',
                                                        fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
                                                    }}
                                                >
                                                    {day.slice(0, 3).toUpperCase()}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {['developer', 'superadmin', 'Admin'].includes(userRole) && (
                                    <div>
                                        <label style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>Total Points</label>
                                        <input
                                            type="number"
                                            className="input-field"
                                            value={editingMember.totalPoints || 0}
                                            onChange={e => setEditingMember({ ...editingMember, totalPoints: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                )}
                                <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', padding: '1rem', borderRadius: '0.75rem' }}>Save Changes</button>
                                {isEditingMemberProfile && (
                                    <button type="button" className="btn" onClick={() => setIsEditingMemberProfile(false)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem' }}>Cancel</button>
                                )}
                            </form>
                        ) : (
                            <div>
                                {loadingInsights ? (
                                    <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                                        <div className="loading-spinner-small" style={{ margin: '0 auto 1.5rem', width: '36px', height: '36px', borderTopColor: '#25AAE1' }}></div>
                                        Analyzing student fellowship analytics...
                                    </div>
                                ) : memberInsights ? (
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                                        gap: '2rem',
                                        alignItems: 'start'
                                    }}>
                                        {/* Left Column: Stats & Administrative Actions */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                            
                                            {/* Subtitle */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1da6d9', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                <Activity size={14} /> Performance Dashboard
                                            </div>

                                            {/* Stats Cards Row */}
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                                                {/* Points Card */}
                                                <div className="glass-card-premium" style={{ padding: '0.85rem 0.5rem', textAlign: 'center', background: 'rgba(251, 191, 36, 0.03)', border: '1px solid rgba(251, 191, 36, 0.12)', borderRadius: '0.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                    <div style={{ color: 'rgba(251, 191, 36, 0.7)', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px', marginBottom: '0.25rem' }}>
                                                        <Trophy size={11} /> Points
                                                    </div>
                                                    <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fbbf24', letterSpacing: '-0.5px' }}>{editingMember.totalPoints || 0}</div>
                                                </div>

                                                {/* Attended Card */}
                                                <div className="glass-card-premium" style={{ padding: '0.85rem 0.5rem', textAlign: 'center', background: 'rgba(37, 170, 225, 0.03)', border: '1px solid rgba(37, 170, 225, 0.12)', borderRadius: '0.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                    <div style={{ color: 'rgba(37, 170, 225, 0.7)', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px', marginBottom: '0.25rem' }}>
                                                        <ListChecks size={11} /> Attended
                                                    </div>
                                                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#25AAE1', letterSpacing: '-0.5px' }}>
                                                        {memberInsights.stats.physicalAttended}
                                                        {memberInsights.stats.exemptedCount > 0 && <span style={{ fontSize: '0.8rem', color: '#fbbf24', fontWeight: 700 }}>+{memberInsights.stats.exemptedCount}E</span>}
                                                    </div>
                                                    <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.15rem', fontWeight: 700 }}>of {memberInsights.stats.totalMeetings} meetings</div>
                                                </div>

                                                {/* Consistency Card */}
                                                <div className="glass-card-premium" style={{ padding: '0.85rem 0.5rem', textAlign: 'center', background: memberInsights.stats.percentage > 75 ? 'rgba(74, 222, 128, 0.03)' : 'rgba(234, 179, 8, 0.03)', border: memberInsights.stats.percentage > 75 ? '1px solid rgba(74, 222, 128, 0.12)' : '1px solid rgba(234, 179, 8, 0.12)', borderRadius: '0.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                    <div style={{ color: memberInsights.stats.percentage > 75 ? 'rgba(74, 222, 128, 0.7)' : 'rgba(234, 179, 8, 0.7)', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px', marginBottom: '0.25rem' }}>
                                                        <Award size={11} /> Ratio
                                                    </div>
                                                    <div style={{ fontSize: '1.4rem', fontWeight: 900, color: memberInsights.stats.percentage > 75 ? '#4ade80' : memberInsights.stats.percentage > 40 ? '#facc15' : '#ef4444', letterSpacing: '-0.5px' }}>
                                                        {memberInsights.stats.percentage}%
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Micro-Progress Bar for Ratio */}
                                            <div className="glass-card-premium" style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '0.75rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800, marginBottom: '0.35rem' }}>
                                                    <span>CONSISTENCY INDEX</span>
                                                    <span style={{ color: memberInsights.stats.percentage > 75 ? '#4ade80' : memberInsights.stats.percentage > 40 ? '#facc15' : '#ef4444' }}>
                                                        {memberInsights.stats.percentage > 75 ? 'EXCELLENT' : memberInsights.stats.percentage > 45 ? 'MODERATE' : 'CRITICAL'}
                                                    </span>
                                                </div>
                                                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.03)' }}>
                                                    <div style={{
                                                        width: `${Math.min(memberInsights.stats.percentage, 100)}%`,
                                                        height: '100%',
                                                        borderRadius: '4px',
                                                        background: memberInsights.stats.percentage > 75 ? 'linear-gradient(90deg, #22c55e, #4ade80)' : 
                                                                    memberInsights.stats.percentage > 40 ? 'linear-gradient(90deg, #eab308, #facc15)' : 
                                                                    'linear-gradient(90deg, #dc2626, #ef4444)',
                                                        transition: 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
                                                    }}></div>
                                                </div>
                                            </div>

                                            {/* Category Indicator Card */}
                                            <div className="glass-card-premium" style={{ padding: '0.85rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '0.75rem' }}>
                                                <div>
                                                    <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Profile Category</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'white', fontWeight: 800, marginTop: '0.15rem' }}>Doulos Membership Level</div>
                                                </div>
                                                <span style={{
                                                    padding: '0.35rem 0.85rem',
                                                    borderRadius: '1rem',
                                                    fontSize: '0.7rem',
                                                    fontWeight: 900,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px',
                                                    background: editingMember.memberType === 'Douloid' ? 'rgba(251, 191, 36, 0.08)' :
                                                                editingMember.memberType === 'Recruit' ? 'rgba(37, 170, 225, 0.08)' :
                                                                editingMember.memberType === 'Exempted' ? 'rgba(239, 68, 68, 0.08)' :
                                                                'rgba(255,255,255,0.04)',
                                                    color: editingMember.memberType === 'Douloid' ? '#FFD700' :
                                                           editingMember.memberType === 'Recruit' ? '#25AAE1' :
                                                           editingMember.memberType === 'Exempted' ? '#f87171' :
                                                           'rgba(255,255,255,0.5)',
                                                    border: editingMember.memberType === 'Douloid' ? '1px solid rgba(251, 191, 36, 0.15)' :
                                                            editingMember.memberType === 'Recruit' ? '1px solid rgba(37, 170, 225, 0.15)' :
                                                            editingMember.memberType === 'Exempted' ? '1px solid rgba(239, 68, 68, 0.15)' :
                                                            '1px solid rgba(255,255,255,0.08)'
                                                }}>
                                                    {editingMember.memberType}
                                                </span>
                                            </div>

                                            {/* Administrative Actions Panel */}
                                            <div className="glass-card-premium" style={{ 
                                                padding: '1.25rem', 
                                                background: 'rgba(2, 10, 20, 0.6)', 
                                                border: '1px solid rgba(29, 166, 217, 0.12)', 
                                                borderRadius: '0.9rem',
                                                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.02)'
                                            }}>
                                                <div style={{ fontSize: '0.75rem', color: '#1da6d9', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '1rem' }}>
                                                    <ShieldAlert size={13} /> Admin Actions Console
                                                </div>

                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                                    
                                                    {/* Reset Device / Unlock */}
                                                    <button
                                                        className="btn"
                                                        style={{
                                                            width: '100%', 
                                                            background: 'rgba(37, 170, 225, 0.08)', 
                                                            color: '#25AAE1',
                                                            border: '1px solid rgba(37, 170, 225, 0.15)', 
                                                            padding: '0.65rem',
                                                            borderRadius: '0.6rem', 
                                                            display: 'flex', 
                                                            alignItems: 'center', 
                                                            justifyContent: 'center', 
                                                            gap: '0.5rem', 
                                                            fontWeight: 800,
                                                            fontSize: '0.8rem',
                                                            transition: 'all 0.2s'
                                                        }}
                                                        onClick={() => handleResetDevice(editingMember._id)}
                                                    >
                                                        <Unlock size={14} /> Unlock Device Link
                                                    </button>

                                                    {/* Graduate Recruit */}
                                                    {editingMember.memberType === 'Recruit' && (
                                                        <button
                                                            className="btn"
                                                            style={{
                                                                width: '100%', 
                                                                background: 'rgba(167, 139, 250, 0.08)', 
                                                                color: '#a78bfa',
                                                                border: '1px solid rgba(167, 139, 250, 0.15)', 
                                                                padding: '0.65rem',
                                                                borderRadius: '0.6rem', 
                                                                display: 'flex', 
                                                                alignItems: 'center', 
                                                                justifyContent: 'center', 
                                                                gap: '0.5rem', 
                                                                fontWeight: 800,
                                                                fontSize: '0.8rem',
                                                                transition: 'all 0.2s'
                                                            }}
                                                            onClick={() => handleGraduateMember(editingMember._id)}
                                                        >
                                                            <GraduationCap size={14} /> Graduate to Douloid
                                                        </button>
                                                    )}

                                                    {/* Reset Points */}
                                                    {['developer', 'superadmin'].includes(userRole) && (
                                                        <button
                                                            className="btn"
                                                            style={{
                                                                width: '100%', 
                                                                background: 'rgba(234, 179, 8, 0.08)', 
                                                                color: '#eab308',
                                                                border: '1px solid rgba(234, 179, 8, 0.15)', 
                                                                padding: '0.65rem',
                                                                borderRadius: '0.6rem', 
                                                                display: 'flex', 
                                                                alignItems: 'center', 
                                                                justifyContent: 'center', 
                                                                gap: '0.5rem', 
                                                                fontWeight: 800,
                                                                fontSize: '0.8rem',
                                                                transition: 'all 0.2s'
                                                            }}
                                                            onClick={() => handleResetMemberPoints(editingMember._id)}
                                                        >
                                                            <RotateCcw size={14} /> Reset Points Balance
                                                        </button>
                                                    )}

                                                    {/* Delete Member */}
                                                    {['developer', 'superadmin'].includes(userRole) && (
                                                        <button
                                                            className="btn"
                                                            style={{
                                                                width: '100%', 
                                                                background: 'rgba(239, 68, 68, 0.08)', 
                                                                color: '#ef4444',
                                                                border: '1px solid rgba(239, 68, 68, 0.15)', 
                                                                padding: '0.65rem',
                                                                borderRadius: '0.6rem', 
                                                                display: 'flex', 
                                                                alignItems: 'center', 
                                                                justifyContent: 'center', 
                                                                gap: '0.5rem', 
                                                                fontWeight: 800,
                                                                fontSize: '0.8rem',
                                                                transition: 'all 0.2s'
                                                            }}
                                                            onClick={() => handleDeleteMember(editingMember._id, editingMember.name)}
                                                        >
                                                            <Trash2 size={14} /> Delete Profile Permanently
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                        </div>

                                        {/* Right Column: Attendance Trends & History Bounded Panel */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                            
                                            {/* Subtitle */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a78bfa', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                <Calendar size={14} /> Activity Metrics
                                            </div>

                                            {/* Attendance Trend Chart Card */}
                                            <div className="glass-card-premium" style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '0.9rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                                    <h4 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)' }}>ATTENDANCE TREND (LAST 20)</h4>
                                                    <div style={{ display: 'flex', gap: '0.6rem', fontSize: '0.65rem', fontWeight: 700 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#25AAE1' }}>
                                                            <div style={{ width: '6px', height: '6px', background: '#25AAE1', borderRadius: '50%' }}></div> Present
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#fbbf24' }}>
                                                            <div style={{ width: '6px', height: '6px', background: '#fbbf24', borderRadius: '50%' }}></div> Exempt
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'rgba(255,255,255,0.3)' }}>
                                                            <div style={{ width: '6px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div> Absent
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '90px', background: 'rgba(2, 10, 20, 0.4)', padding: '0.75rem', borderRadius: '0.6rem', border: '1px solid rgba(255,255,255,0.02)' }}>
                                                    {memberInsights.history.slice(0, 20).reverse().map((h, idx) => (
                                                        <div
                                                            key={idx}
                                                            title={`${h.name} (${new Date(h.date).toLocaleDateString()}): ${h.isExempted ? 'Exempted' : h.attended ? 'Present' : 'Absent'}`}
                                                            style={{
                                                                flex: 1,
                                                                height: (h.attended || h.isExempted) ? '100%' : '15%',
                                                                background: h.isExempted ? 'linear-gradient(0deg, #d97706, #fbbf24)' : 
                                                                            h.attended ? 'linear-gradient(0deg, #0284c7, #25AAE1)' : 
                                                                            'rgba(255,255,255,0.06)',
                                                                borderRadius: '3px',
                                                                transition: 'all 0.3s ease',
                                                                opacity: (h.attended || h.isExempted) ? 1 : 0.4,
                                                                boxShadow: h.attended ? '0 0 6px rgba(37,170,225,0.2)' : h.isExempted ? '0 0 6px rgba(251,191,36,0.2)' : 'none'
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Meeting History Bounded Card */}
                                            <div className="glass-card-premium" style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '0.9rem' }}>
                                                <h4 style={{ margin: '0 0 0.85rem 0', fontSize: '0.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.5px' }}>MEETING ATTENDANCE TIMELINE</h4>
                                                
                                                <div 
                                                    className="custom-scrollbar"
                                                    style={{ 
                                                        display: 'flex', 
                                                        flexDirection: 'column', 
                                                        gap: '0.5rem',
                                                        maxHeight: '260px',
                                                        overflowY: 'auto',
                                                        paddingRight: '0.4rem'
                                                    }}
                                                >
                                                    {memberInsights.history.length === 0 ? (
                                                        <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', fontWeight: 600 }}>
                                                            No meetings recorded in history.
                                                        </div>
                                                    ) : (
                                                        memberInsights.history.map((h, idx) => (
                                                            <div 
                                                                key={idx} 
                                                                style={{ 
                                                                    display: 'flex', 
                                                                    justifyContent: 'space-between', 
                                                                    alignItems: 'center',
                                                                    padding: '0.65rem 0.85rem', 
                                                                    background: 'rgba(2, 10, 20, 0.3)', 
                                                                    borderRadius: '0.5rem', 
                                                                    fontSize: '0.82rem',
                                                                    border: '1px solid rgba(255,255,255,0.02)',
                                                                    borderLeft: h.isExempted ? '3px solid #fbbf24' : h.attended ? '3px solid #22c55e' : '3px solid #ef4444',
                                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                                }}
                                                            >
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                                                    <span style={{ fontWeight: 800, color: 'white' }}>{h.name}</span>
                                                                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{new Date(h.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                                </div>
                                                                <span style={{ 
                                                                    fontSize: '0.65rem',
                                                                    fontWeight: 900,
                                                                    letterSpacing: '0.5px',
                                                                    padding: '0.15rem 0.45rem',
                                                                    borderRadius: '0.25rem',
                                                                    background: h.isExempted ? 'rgba(251, 191, 36, 0.08)' : h.attended ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                                                                    color: h.isExempted ? '#fbbf24' : h.attended ? '#4ade80' : '#f87171',
                                                                    border: h.isExempted ? '1px solid rgba(251, 191, 36, 0.12)' : h.attended ? '1px solid rgba(34, 197, 94, 0.12)' : '1px solid rgba(239, 68, 68, 0.12)'
                                                                }}>
                                                                    {h.isExempted ? 'EXEMPTED' : h.attended ? 'PRESENT' : 'ABSENT'}
                                                                </span>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ padding: '3rem', textAlign: 'center' }}>No attendance history found.</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Bulk List Tool Modal */}
            {showBulkListTool && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', zIndex: 110,
                    backdropFilter: 'blur(10px)', padding: '2rem 1rem', overflowY: 'auto'
                }} onClick={() => setShowBulkListTool(false)}>
                    <div className="glass-panel" style={{
                        width: '100%', maxWidth: '500px', padding: '2.5rem 2rem',
                        background: '#0d111b', borderRadius: '1.5rem',
                        animation: 'slideUp 0.3s ease-out'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                <ListChecks size={24} color="#1da6d9" />
                                <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Master Bulk Tool</h3>
                            </div>
                            <button onClick={() => setShowBulkListTool(false)} className="btn" style={{ padding: '0.4rem', background: 'transparent', color: 'white' }}><X size={20} /></button>
                        </div>

                        <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                            Paste a list of Student Registration Numbers (one per line) from your master list to process them in bulk.
                        </p>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.5rem', opacity: 0.6 }}>SELECT TARGET ACTION</label>
                            <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.3rem', borderRadius: '0.5rem' }}>
                                <button
                                    onClick={() => setBulkListType('graduate')}
                                    style={{
                                        flex: 1, padding: '0.75rem', borderRadius: '0.4rem', border: 'none', cursor: 'pointer',
                                        background: bulkListType === 'graduate' ? 'rgba(167, 139, 250, 0.2)' : 'transparent',
                                        color: bulkListType === 'graduate' ? '#a78bfa' : 'rgba(255,255,255,0.5)',
                                        fontWeight: 800, fontSize: '0.8rem'
                                    }}
                                >GRADUATE PASS</button>
                                <button
                                    onClick={() => setBulkListType('archive')}
                                    style={{
                                        flex: 1, padding: '0.75rem', borderRadius: '0.4rem', border: 'none', cursor: 'pointer',
                                        background: bulkListType === 'archive' ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                                        color: bulkListType === 'archive' ? '#f87171' : 'rgba(255,255,255,0.5)',
                                        fontWeight: 800, fontSize: '0.8rem'
                                    }}
                                >ARCHIVE / FAIL</button>
                            </div>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.5rem', opacity: 0.6 }}>PASTE REGISTRATION NUMBERS</label>
                            <textarea
                                className="modern-input"
                                rows="6"
                                placeholder="PASTE LIST HERE...&#10;22-1234&#10;22-5678"
                                style={{ fontFamily: 'monospace', color: 'white', minHeight: '120px', resize: 'vertical' }}
                                value={bulkListInput}
                                onChange={(e) => setBulkListInput(e.target.value)}
                            />
                            <div style={{ fontSize: '0.7rem', color: '#1da6d9', marginTop: '0.5rem', fontWeight: 600 }}>
                                Detected {bulkListInput.split('\n').filter(r => r.trim()).length} unique numbers.
                            </div>
                        </div>

                        <button
                            className="btn btn-primary"
                            style={{ width: '100%', padding: '1rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.9rem', borderRadius: '0.75rem' }}
                            onClick={handleBulkListAction}
                            disabled={importLoading || !bulkListInput.trim()}
                        >
                            {importLoading ? 'PROCESSING LIST...' : `CONFIRM BULK ${bulkListType.toUpperCase()}`}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MembersTab;
