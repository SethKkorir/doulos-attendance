import { useState, useEffect } from 'react';
import { 
    Users, FileSpreadsheet, ChevronDown, Plus, Search, RotateCcw, 
    CheckCircle, Archive, GraduationCap, Trash2, ListChecks, X, Trophy, 
    Calendar, MapPin, Lightbulb
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
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
                                onClick={() => setShowAddMenu(!showAddMenu)}
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
                                    <button className="btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', padding: '0.75rem', fontSize: '0.9rem', background: 'transparent', border: 'none', textAlign: 'left', color: 'white', fontWeight: 600, width: '100%' }}
                                        onClick={() => { setEditingMember({ _id: 'NEW', name: '', studentRegNo: '', campus: 'Athi River', memberType: 'Visitor' }); setShowAddMenu(false); }}>
                                        <Users size={16} style={{ marginRight: '0.75rem', opacity: 0.7, color: '#1da6d9' }} /> Single Entry
                                    </button>
                                    <button className="btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', padding: '0.75rem', fontSize: '0.9rem', background: 'transparent', border: 'none', textAlign: 'left', color: 'white', fontWeight: 600, width: '100%' }}
                                        onClick={() => { document.getElementById('import-file-input').click(); setShowAddMenu(false); }}>
                                        <FileSpreadsheet size={16} style={{ marginRight: '0.75rem', opacity: 0.7, color: '#34d399' }} /> Import Excel / CSV
                                    </button>
                                </div>
                            )}
                            <input type="file" id="import-file-input" hidden accept=".csv, .xlsx, .xls, .pdf, .doc, .docx" onChange={handleFileImport} />
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

                    <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button className="btn" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', fontSize: '0.8rem', padding: '0.5rem 1rem', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '0.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }} onClick={handleBulkEnroll} title="Enroll everyone who has attended a meeting this semester">
                            <CheckCircle size={14} /> Bulk Enroll
                        </button>
                        <button className="btn" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', padding: '0.5rem 1rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }} onClick={handleSyncRegistry}>
                            <RotateCcw size={14} /> Sync
                        </button>
                        {memberTypeFilter === 'Recruit' && (
                            <>
                                <button className="btn" style={{ background: 'rgba(234, 179, 8, 0.1)', color: '#eab308', fontSize: '0.8rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1px solid rgba(234,179,8,0.2)', borderRadius: '0.5rem', fontWeight: 700 }}
                                    onClick={handleGraduateAll} title="Graduate all Recruits to Douloids">
                                    <GraduationCap size={16} /> Graduate All
                                </button>
                                <button className="btn" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', fontSize: '0.8rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '0.5rem', fontWeight: 700 }}
                                    onClick={handleArchiveAllRecruits} title="Archive all members who are currently Recruits">
                                    <Archive size={16} /> Archive Remaining
                                </button>
                                {selectedMemberIds.length > 0 && (
                                    <button className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', borderRadius: '0.5rem', fontWeight: 800 }}
                                        onClick={handleBulkGraduate}>
                                        <GraduationCap size={16} /> Graduate Selected ({selectedMemberIds.length})
                                    </button>
                                )}
                            </>
                        )}
                        {memberTypeFilter === 'Douloid' && (
                            <button className="btn" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', fontSize: '0.8rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '0.5rem', fontWeight: 700 }}
                                onClick={handleUndoGraduation} title="Undo recently graduated recruits (revert to Recruit)">
                                <RotateCcw size={16} /> Undo Graduation
                            </button>
                        )}
                        {['developer', 'superadmin'].includes(userRole) && (
                            <>
                                <button className="btn" style={{ background: 'rgba(29, 166, 217, 0.1)', color: '#1da6d9', fontSize: '0.8rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1px solid rgba(29,166,217,0.2)', borderRadius: '0.5rem', fontWeight: 700 }}
                                    onClick={() => setShowBulkListTool(true)} title="Graduate or Archive members by pasting a list of registration numbers">
                                    <ListChecks size={16} /> Bulk List Actions
                                </button>
                                <button className="btn" style={{ background: 'rgba(29, 166, 217, 0.1)', color: '#1da6d9', fontSize: '0.8rem', padding: '0.5rem 1rem', border: '1px solid rgba(29,166,217,0.2)', borderRadius: '0.5rem', fontWeight: 700 }}
                                    onClick={handleSetupTestAccount} title="Designate a student as a permanent tester">
                                    Setup Tester
                                </button>
                                <button className="btn" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '0.8rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '0.5rem', fontWeight: 700 }}
                                    onClick={handleResetAllPoints} title="Reset all points to 0">
                                    <Trash2 size={14} /> Reset Points
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Registry Grid */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '1rem 1.5rem' }}>
                <table className="glass-table-premium">
                    <thead>
                        <tr>
                            <th style={{ width: '40px', textAlign: 'center' }}>
                                <input
                                    type="checkbox"
                                    style={{ width: '16px', height: '16px', accentColor: '#1da6d9', cursor: 'pointer' }}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedMemberIds(filteredMembers.map(m => m._id));
                                        } else {
                                            setSelectedMemberIds([]);
                                        }
                                    }}
                                    checked={selectedMemberIds.length > 0 && selectedMemberIds.length === filteredMembers.length}
                                />
                            </th>
                            <th>Member Details</th>
                            <th>Points</th>
                            <th>Campus</th>
                            <th>Category</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loadingMembers ? (
                            <tr><td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Loading directory...</td></tr>
                        ) : filteredMembers.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ padding: '4rem', textAlign: 'center' }}>
                                    <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '1.5rem' }}>
                                        <Users size={48} style={{ opacity: 0.2, marginBottom: '1rem', margin: '0 auto', color: '#1da6d9' }} />
                                        <p>{memberSearch || memberCampusFilter !== 'All' ? 'No members match your filters.' : 'Registry is empty. Sync from history to populate it.'}</p>
                                    </div>
                                    {!memberSearch && memberCampusFilter === 'All' && (
                                        <button className="btn btn-primary" onClick={handleSyncRegistry} style={{ borderRadius: '0.75rem', fontWeight: 800 }}>
                                            Sync Registry from History
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ) : filteredMembers.map((m, i) => (
                            <tr key={i} data-reg={m.studentRegNo} style={{ cursor: 'pointer' }} onClick={() => { setEditingMember(m); fetchMemberInsights(m.studentRegNo); }}>
                                <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                                    <input
                                        type="checkbox"
                                        style={{ width: '16px', height: '16px', accentColor: '#1da6d9', cursor: 'pointer' }}
                                        checked={selectedMemberIds.includes(m._id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedMemberIds([...selectedMemberIds, m._id]);
                                            } else {
                                                setSelectedMemberIds(selectedMemberIds.filter(id => id !== m._id));
                                            }
                                        }}
                                    />
                                </td>
                                <td>
                                    <div style={{ fontWeight: 700, color: 'white', fontSize: '0.95rem' }}>{m.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.1rem', fontWeight: 600 }}>{m.studentRegNo}</div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#FFD700', fontWeight: 800, background: 'rgba(255, 215, 0, 0.1)', padding: '0.25rem 0.6rem', borderRadius: '0.5rem', width: 'fit-content' }}>
                                        <Trophy size={13} style={{ color: '#FFD700' }} /> {m.totalPoints || 0}
                                    </div>
                                </td>
                                <td style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
                                    {m.campus === 'Valley Road' ? 'Nairobi' : m.campus}
                                </td>
                                <td>
                                    <span className="status-pill-modern" style={{
                                        background: m.memberType === 'Douloid' ? 'rgba(255, 215, 0, 0.1)' :
                                                    m.memberType === 'Recruit' ? 'rgba(29, 166, 217, 0.1)' :
                                                    m.memberType === 'Exempted' ? 'rgba(239, 68, 68, 0.1)' :
                                                    'rgba(255, 255, 255, 0.05)',
                                        color: m.memberType === 'Douloid' ? '#FFD700' :
                                               m.memberType === 'Recruit' ? '#1da6d9' :
                                               m.memberType === 'Exempted' ? '#f87171' :
                                               'rgba(255,255,255,0.6)',
                                        borderColor: m.memberType === 'Douloid' ? 'rgba(255, 215, 0, 0.2)' :
                                                     m.memberType === 'Recruit' ? 'rgba(29, 166, 217, 0.2)' :
                                                     m.memberType === 'Exempted' ? 'rgba(239, 68, 68, 0.2)' :
                                                     'rgba(255, 255, 255, 0.1)',
                                        fontSize: '0.7rem',
                                        padding: '0.25rem 0.6rem',
                                        borderRadius: '2rem',
                                        fontWeight: 'bold',
                                        textTransform: 'uppercase'
                                    }}>
                                        {m.memberType}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
                                        <button
                                            className="btn"
                                            style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', background: 'rgba(167, 139, 250, 0.1)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.15)', borderRadius: '0.5rem', fontWeight: 700 }}
                                            onClick={() => { setEditingMember(m); fetchMemberInsights(m.studentRegNo); }}
                                        >
                                            Insights
                                        </button>
                                        {['developer', 'superadmin'].includes(userRole) && (
                                            <button
                                                className="btn"
                                                style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                onClick={() => handleDeleteMember(m._id, m.name)}
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Member Profile/Insights Modal */}
            {editingMember && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 110, padding: '1rem'
                }} onClick={() => { setEditingMember(null); setMemberInsights(null); setIsEditingMemberProfile(false); }}>
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
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                {['developer', 'superadmin', 'admin', 'Admin'].includes(userRole) && editingMember._id !== 'NEW' && (
                                    <button
                                        className="btn"
                                        onClick={() => setIsEditingMemberProfile(!isEditingMemberProfile)}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            background: isEditingMemberProfile ? 'hsl(var(--color-primary))' : 'rgba(255,255,255,0.05)',
                                            color: isEditingMemberProfile ? 'white' : 'var(--color-text-dim)',
                                            fontWeight: 700, borderRadius: '0.5rem'
                                        }}
                                    >
                                        {isEditingMemberProfile ? 'View Insights' : 'Edit Profile'}
                                    </button>
                                )}
                                <button className="btn" onClick={() => { setEditingMember(null); setMemberInsights(null); setIsEditingMemberProfile(false); }} style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem' }}>Close</button>
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
                                                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', marginTop: '0.5rem', overflow: 'hidden' }}>
                                                    <div style={{
                                                        width: `${Math.min(memberInsights.stats.percentage, 100)}%`,
                                                        height: '100%',
                                                        background: memberInsights.stats.percentage > 75 ? '#4ade80' : memberInsights.stats.percentage > 40 ? '#facc15' : '#ef4444',
                                                        transition: 'width 0.5s ease'
                                                    }}></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Attendance Trend */}
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
                                
                                {/* Action Buttons */}
                                <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <button
                                        className="btn"
                                        style={{
                                            width: '100%', background: 'rgba(37, 170, 225, 0.1)', color: '#25AAE1',
                                            border: '1px solid rgba(37, 170, 225, 0.2)', padding: '0.75rem',
                                            borderRadius: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 700
                                        }}
                                        onClick={() => handleResetDevice(editingMember._id)}
                                    >
                                        <RotateCcw size={16} /> Unlock Device / Reset Link
                                    </button>

                                    {editingMember.memberType === 'Recruit' && (
                                        <button
                                            className="btn"
                                            style={{
                                                width: '100%', background: 'rgba(167, 139, 250, 0.1)', color: '#a78bfa',
                                                border: '1px solid rgba(167, 139, 250, 0.2)', padding: '0.75rem',
                                                borderRadius: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 700
                                            }}
                                            onClick={() => handleGraduateMember(editingMember._id)}
                                        >
                                            <GraduationCap size={16} /> Graduate / Promote
                                        </button>
                                    )}

                                    {['developer', 'superadmin'].includes(userRole) && (
                                        <button
                                            className="btn"
                                            style={{
                                                width: '100%', background: 'rgba(234, 179, 8, 0.1)', color: '#eab308',
                                                border: '1px solid rgba(234, 179, 8, 0.2)', padding: '0.75rem',
                                                borderRadius: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 700
                                            }}
                                            onClick={() => handleResetMemberPoints(editingMember._id)}
                                        >
                                            <RotateCcw size={16} /> Reset Points (Set to 0)
                                        </button>
                                    )}

                                    {['developer', 'superadmin'].includes(userRole) && (
                                        <button
                                            className="btn"
                                            style={{
                                                width: '100%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                                                border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.75rem',
                                                borderRadius: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 700
                                            }}
                                            onClick={() => handleDeleteMember(editingMember._id, editingMember.name)}
                                        >
                                            <Trash2 size={16} /> Delete Member Permanently
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Bulk List Tool Modal */}
            {showBulkListTool && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 110,
                    backdropFilter: 'blur(10px)'
                }}>
                    <div className="glass-panel" style={{
                        width: '90%', maxWidth: '500px', padding: '2rem',
                        background: '#0c1a29', borderRadius: '1.5rem',
                        border: '1px solid rgba(255,255,255,0.1)',
                        animation: 'slideUp 0.3s ease-out'
                    }}>
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
