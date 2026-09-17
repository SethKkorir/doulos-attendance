import React, { useState, useRef } from 'react';
import { 
    X, Upload, FileText, FileSpreadsheet, CheckCircle2, AlertCircle, 
    Trash2, RefreshCw, Users, ShieldCheck, Sparkles, MapPin, ArrowRight
} from 'lucide-react';
import * as XLSX from 'xlsx';

// Smart line parser: Extracts Name, Admission Number (00-0000 or 000000), and Campus (Athi River vs Nairobi)
export const parseMemberLine = (line, defaultCampus = 'Athi River') => {
    if (!line || typeof line !== 'string' || !line.trim()) return null;
    let text = line.trim();

    // 1. Detect Admission Number: 00-0000 or 000000 or XX-XXXX
    let regNo = '';
    const regHyphenMatch = text.match(/\b(\d{2}-[A-Za-z0-9]{4,5})\b/i);
    const regRaw6Match = text.match(/\b(\d{6})\b/);

    if (regHyphenMatch) {
        regNo = regHyphenMatch[1].toUpperCase();
        text = text.replace(regHyphenMatch[0], ' ');
    } else if (regRaw6Match) {
        const d = regRaw6Match[1];
        regNo = `${d.slice(0, 2)}-${d.slice(2)}`.toUpperCase();
        text = text.replace(regRaw6Match[0], ' ');
    } else {
        const genericReg = text.match(/\b([A-Za-z0-9]{2,3}-[A-Za-z0-9]{4,5})\b/i);
        if (genericReg) {
            regNo = genericReg[1].toUpperCase();
            text = text.replace(genericReg[0], ' ');
        }
    }

    if (!regNo) return null; // No valid admission number found (e.g. table headers)

    // 2. Detect Campus (Athi River vs Nairobi)
    let campus = defaultCampus;
    if (/\b(athi(?:\s*river)?|ar)\b/i.test(text)) {
        campus = 'Athi River';
        text = text.replace(/\b(athi(?:\s*river)?|ar)\b/gi, ' ');
    } else if (/\b(nairobi|valley(?:\s*road)?|vr|nbi)\b/i.test(text)) {
        campus = 'Nairobi';
        text = text.replace(/\b(nairobi|valley(?:\s*road)?|vr|nbi)\b/gi, ' ');
    }

    // 3. Extract Name: Clean out numbers, phones, emails, serial indexes, delimiters
    let name = text
        .replace(/^[0-9]+[.)\]\-#:\s]+/g, '') // remove leading row index like '1.', '2)', '#3'
        .replace(/\b(?:\+?254|0)[17]\d{8}\b/g, '') // remove Kenyan phones
        .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '') // remove emails
        .replace(/[,;|/\\\"'(){}[\]<>_]/g, ' ') // remove delimiters
        .replace(/\s+/g, ' ')
        .trim();

    // Clean leading/trailing hyphens or dots
    name = name.replace(/^[\s\-–—:,.]+|[\s\-–—:,.]+$/g, '').trim();

    // Fallback if name was completely empty
    if (!name || name.length < 2) {
        name = `Recruit ${regNo}`;
    }

    return {
        name,
        studentRegNo: regNo,
        campus,
        memberType: 'Recruit',
        status: 'Active',
        douloidRank: 'None',
        totalPoints: 10
    };
};

// Raw PDF fallback text reader (extracts text strings from PDF byte stream)
const extractRawPdfText = (binaryString) => {
    const textPieces = [];
    // Match PDF text operators Tj and TJ
    const tjRegex = /\(([^)]+)\)\s*Tj/g;
    let m;
    while ((m = tjRegex.exec(binaryString)) !== null) {
        if (m[1] && m[1].trim()) {
            textPieces.push(m[1].trim());
        }
    }
    // Also match text arrays in TJ
    const arrayRegex = /\[([^\]]+)\]\s*TJ/g;
    while ((m = arrayRegex.exec(binaryString)) !== null) {
        const innerStrings = m[1].match(/\(([^)]+)\)/g);
        if (innerStrings) {
            const combined = innerStrings.map(s => s.replace(/[()]/g, '')).join('');
            if (combined.trim()) textPieces.push(combined.trim());
        }
    }
    return textPieces.join('\n');
};

const G2MemberImportModal = ({ isOpen, onClose, currentSemester, api, showToast, onImportSuccess }) => {
    const [importTab, setImportTab] = useState('upload'); // 'upload' or 'paste'
    const [defaultCampus, setDefaultCampus] = useState('Athi River');
    const [rawText, setRawText] = useState('');
    const [parsedList, setParsedList] = useState([]);
    const [fileName, setFileName] = useState('');
    const [isParsing, setIsParsing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    // Parse raw text whenever text changes or default campus changes
    const handleReparseText = (textToParse, campusDefault = defaultCampus) => {
        if (!textToParse) {
            setParsedList([]);
            return;
        }
        const lines = textToParse.split(/\r?\n/).filter(l => l.trim());
        const validMembers = [];
        const seenRegs = new Set();

        for (const line of lines) {
            const parsed = parseMemberLine(line, campusDefault);
            if (parsed && !seenRegs.has(parsed.studentRegNo)) {
                seenRegs.add(parsed.studentRegNo);
                validMembers.push({
                    ...parsed,
                    lastActiveSemester: currentSemester
                });
            }
        }
        setParsedList(validMembers);
    };

    // Handle Direct File Upload (CSV, XLSX, XLS, PDF, TXT)
    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setIsParsing(true);
        const ext = file.name.split('.').pop()?.toLowerCase();

        try {
            if (['xlsx', 'xls', 'csv'].includes(ext)) {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    try {
                        const bstr = evt.target?.result;
                        const wb = XLSX.read(bstr, { type: 'binary' });
                        const ws = wb.Sheets[wb.SheetNames[0]];
                        // Extract text lines from sheet
                        const csvData = XLSX.utils.sheet_to_csv(ws);
                        setRawText(csvData);
                        handleReparseText(csvData, defaultCampus);
                        showToast?.(`Parsed ${file.name} successfully`, 'success');
                    } catch (parseErr) {
                        console.error("Excel parse error:", parseErr);
                        showToast?.('Could not parse Excel/CSV file format', 'error');
                    } finally {
                        setIsParsing(false);
                    }
                };
                reader.readAsBinaryString(file);

            } else if (ext === 'pdf') {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    try {
                        const binaryStr = evt.target?.result;
                        const extractedText = extractRawPdfText(binaryStr);
                        if (extractedText && extractedText.length > 10) {
                            setRawText(extractedText);
                            handleReparseText(extractedText, defaultCampus);
                            showToast?.(`Extracted text from PDF successfully`, 'success');
                        } else {
                            showToast?.('No selectable text found in PDF. If it is a scanned image, please paste text directly.', 'error');
                        }
                    } catch (pdfErr) {
                        console.error("PDF read error:", pdfErr);
                        showToast?.('Error reading PDF file', 'error');
                    } finally {
                        setIsParsing(false);
                    }
                };
                reader.readAsBinaryString(file);

            } else {
                // Plain text / TSV
                const reader = new FileReader();
                reader.onload = (evt) => {
                    const text = evt.target?.result || '';
                    setRawText(text);
                    handleReparseText(text, defaultCampus);
                    setIsParsing(false);
                };
                reader.readAsText(file);
            }
        } catch (err) {
            console.error("Upload error:", err);
            showToast?.('Failed to process uploaded file', 'error');
            setIsParsing(false);
        }
    };

    // Change campus on specific row
    const handleToggleRowCampus = (index) => {
        setParsedList(prev => prev.map((item, idx) => {
            if (idx === index) {
                return {
                    ...item,
                    campus: item.campus === 'Athi River' ? 'Nairobi' : 'Athi River'
                };
            }
            return item;
        }));
    };

    // Edit row name
    const handleEditRowName = (index, newName) => {
        setParsedList(prev => prev.map((item, idx) => {
            if (idx === index) {
                return { ...item, name: newName };
            }
            return item;
        }));
    };

    // Remove single row
    const handleRemoveRow = (index) => {
        setParsedList(prev => prev.filter((_, idx) => idx !== index));
    };

    // Change default campus and update items that don't explicitly contain campus
    const handleDefaultCampusChange = (newCampus) => {
        setDefaultCampus(newCampus);
        handleReparseText(rawText, newCampus);
    };

    // Submit batch to backend API
    const handleExecuteImport = async () => {
        if (parsedList.length === 0) {
            showToast?.('No valid recruits to import', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = parsedList.map(m => ({
                name: m.name.trim(),
                studentRegNo: m.studentRegNo.trim().toUpperCase(),
                campus: (m.campus === 'Nairobi' || m.campus === 'Valley Road') ? 'Valley Road' : 'Athi River',
                memberType: 'Recruit',
                status: 'Active',
                douloidRank: 'None',
                totalPoints: 10,
                lastActiveSemester: currentSemester
            }));

            const res = await api.post('/members/import', { members: payload });
            showToast?.(res.data?.message || `🎉 Successfully imported ${payload.length} recruits into the register!`, 'success');
            
            if (onImportSuccess) {
                onImportSuccess(payload);
            }
            onClose();
        } catch (err) {
            console.error("Member import error:", err);
            showToast?.(err.response?.data?.message || 'Failed to import members to backend', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const athiCount = parsedList.filter(m => m.campus === 'Athi River').length;
    const nairobiCount = parsedList.filter(m => m.campus === 'Nairobi').length;

    return (
        <div 
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(15, 23, 42, 0.65)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2000,
                padding: '1.25rem',
                animation: 'fadeIn 0.2s ease'
            }}
            onClick={onClose}
        >
            <div 
                style={{
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: '24px',
                    width: '100%',
                    maxWidth: '680px',
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 25px 60px rgba(15, 23, 42, 0.25)',
                    animation: 'popScale 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    overflow: 'hidden'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* ══ Header ══ */}
                <div style={{
                    padding: '1.35rem 1.5rem',
                    borderBottom: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#F8FAFC'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#FFFFFF',
                            boxShadow: '0 4px 12px rgba(29, 78, 216, 0.25)'
                        }}>
                            <Users size={20} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.01em' }}>
                                Intake Roster Importer
                            </h3>
                            <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0, fontWeight: 600 }}>
                                Import recruits from CSV, Excel, PDF, or text lists · {currentSemester}
                            </p>
                        </div>
                    </div>

                    <button 
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '0.35rem', borderRadius: '8px', display: 'flex' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* ══ Body Content (Scrollable) ══ */}
                <div style={{ padding: '1.35rem 1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                    
                    {/* Top Segmented Controls: Tabs & Default Campus */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                        {/* Tab Switcher */}
                        <div style={{ display: 'flex', background: '#F1F5F9', padding: '0.3rem', borderRadius: '12px', gap: '0.3rem' }}>
                            <button
                                type="button"
                                onClick={() => setImportTab('upload')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.45rem',
                                    padding: '0.45rem 0.95rem',
                                    borderRadius: '9px',
                                    border: 'none',
                                    background: importTab === 'upload' ? '#FFFFFF' : 'transparent',
                                    color: importTab === 'upload' ? '#1D4ED8' : '#64748B',
                                    fontWeight: 800,
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                    boxShadow: importTab === 'upload' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
                                }}
                            >
                                <Upload size={14} />
                                <span>Upload File</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setImportTab('paste')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.45rem',
                                    padding: '0.45rem 0.95rem',
                                    borderRadius: '9px',
                                    border: 'none',
                                    background: importTab === 'paste' ? '#FFFFFF' : 'transparent',
                                    color: importTab === 'paste' ? '#1D4ED8' : '#64748B',
                                    fontWeight: 800,
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                    boxShadow: importTab === 'paste' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
                                }}
                            >
                                <FileText size={14} />
                                <span>Paste / Type Text</span>
                            </button>
                        </div>

                        {/* Default Campus Selector */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569' }}>
                                Fallback Campus:
                            </span>
                            <select
                                value={defaultCampus}
                                onChange={(e) => handleDefaultCampusChange(e.target.value)}
                                style={{
                                    padding: '0.45rem 0.75rem',
                                    borderRadius: '10px',
                                    border: '1.5px solid #CBD5E1',
                                    background: '#F8FAFC',
                                    fontSize: '0.82rem',
                                    fontWeight: 800,
                                    color: '#0F172A',
                                    cursor: 'pointer'
                                }}
                            >
                                <option value="Athi River">Athi River</option>
                                <option value="Nairobi">Nairobi</option>
                            </select>
                        </div>
                    </div>

                    {/* Tab 1: File Upload Box */}
                    {importTab === 'upload' && (
                        <div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv,.xlsx,.xls,.pdf,.txt"
                                onChange={handleFileUpload}
                                style={{ display: 'none' }}
                            />
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    border: '2px dashed #93C5FD',
                                    borderRadius: '16px',
                                    background: '#F0F7FF',
                                    padding: '1.75rem 1.25rem',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.65rem'
                                }}
                            >
                                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1D4ED8' }}>
                                    <FileSpreadsheet size={24} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#1E40AF' }}>
                                        {fileName ? `Loaded: ${fileName}` : 'Click to Browse or Drag & Drop'}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.2rem' }}>
                                        Supports CSV, Excel (.xlsx, .xls), PDF documents, or Text lists
                                    </div>
                                </div>
                                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1D4ED8', background: '#FFFFFF', padding: '0.35rem 0.85rem', borderRadius: '999px', border: '1px solid #BFDBFE' }}>
                                    Select File
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Tab 2: Raw Text / Paste Area */}
                    {importTab === 'paste' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                                <label style={{ fontSize: '0.74rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Paste Member Lines (Name, Adm No, Campus)
                                </label>
                                {rawText && (
                                    <button 
                                        type="button" 
                                        onClick={() => { setRawText(''); setParsedList([]); }} 
                                        style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '0.74rem', fontWeight: 800, cursor: 'pointer' }}
                                    >
                                        Clear Text
                                    </button>
                                )}
                            </div>
                            <textarea
                                rows={5}
                                value={rawText}
                                onChange={(e) => {
                                    setRawText(e.target.value);
                                    handleReparseText(e.target.value, defaultCampus);
                                }}
                                placeholder={`Faith Mwende 24-1122 Athi River\nVictor Kogo 242252 Nairobi\n22-0990 Seth Korir\nMercy Achieng 23-4567 Valley Road`}
                                style={{
                                    width: '100%',
                                    padding: '0.85rem',
                                    borderRadius: '12px',
                                    border: '1.5px solid #CBD5E1',
                                    background: '#F8FAFC',
                                    fontSize: '0.82rem',
                                    fontFamily: 'monospace',
                                    color: '#0F172A',
                                    outline: 'none',
                                    resize: 'vertical'
                                }}
                            />
                        </div>
                    )}

                    {/* ══ Live Candidate Preview ══ */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.86rem', fontWeight: 900, color: '#0F172A' }}>
                                    Candidates Ready to Import ({parsedList.length})
                                </span>
                                {parsedList.length > 0 && (
                                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1D4ED8', background: '#EFF6FF', padding: '0.2rem 0.6rem', borderRadius: '999px', border: '1px solid #BFDBFE' }}>
                                        {athiCount} Athi · {nairobiCount} Nairobi
                                    </span>
                                )}
                            </div>

                            {parsedList.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => { setParsedList([]); setRawText(''); setFileName(''); }}
                                    style={{ background: 'none', border: 'none', color: '#64748B', fontSize: '0.74rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                >
                                    <Trash2 size={13} /> Clear All
                                </button>
                            )}
                        </div>

                        {/* Preview List Box */}
                        {parsedList.length === 0 ? (
                            <div style={{
                                padding: '2rem 1rem',
                                background: '#F8FAFC',
                                border: '1px solid #E2E8F0',
                                borderRadius: '14px',
                                textAlign: 'center',
                                color: '#64748B'
                            }}>
                                <AlertCircle size={28} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A' }}>No parsed recruits yet</div>
                                <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '0.2rem' }}>
                                    Upload a file or paste text containing Full Names and Admission Numbers (e.g. <code>24-1122</code> or <code>241122</code>).
                                </div>
                            </div>
                        ) : (
                            <div style={{
                                maxHeight: '220px',
                                overflowY: 'auto',
                                border: '1px solid #E2E8F0',
                                borderRadius: '14px',
                                background: '#FFFFFF'
                            }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                                    <thead>
                                        <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 2 }}>
                                            <th style={{ padding: '0.6rem 0.85rem', fontWeight: 800, color: '#475569', width: '36px' }}>#</th>
                                            <th style={{ padding: '0.6rem 0.85rem', fontWeight: 800, color: '#475569' }}>Name</th>
                                            <th style={{ padding: '0.6rem 0.85rem', fontWeight: 800, color: '#475569' }}>Adm Number</th>
                                            <th style={{ padding: '0.6rem 0.85rem', fontWeight: 800, color: '#475569' }}>Campus</th>
                                            <th style={{ padding: '0.6rem 0.85rem', fontWeight: 800, color: '#475569', width: '40px' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {parsedList.map((m, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                                <td style={{ padding: '0.55rem 0.85rem', color: '#94A3B8', fontWeight: 700 }}>{idx + 1}</td>
                                                <td style={{ padding: '0.55rem 0.85rem', fontWeight: 800, color: '#0F172A' }}>
                                                    <input
                                                        type="text"
                                                        value={m.name}
                                                        onChange={(e) => handleEditRowName(idx, e.target.value)}
                                                        style={{
                                                            background: 'transparent',
                                                            border: '1px solid transparent',
                                                            borderRadius: '6px',
                                                            padding: '0.2rem 0.35rem',
                                                            fontSize: '0.82rem',
                                                            fontWeight: 800,
                                                            color: '#0F172A',
                                                            width: '100%'
                                                        }}
                                                        onFocus={e => e.target.style.borderColor = '#93C5FD'}
                                                        onBlur={e => e.target.style.borderColor = 'transparent'}
                                                    />
                                                </td>
                                                <td style={{ padding: '0.55rem 0.85rem' }}>
                                                    <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#1D4ED8', background: '#EFF6FF', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                                                        {m.studentRegNo}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '0.55rem 0.85rem' }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleRowCampus(idx)}
                                                        title="Click to toggle campus"
                                                        style={{
                                                            background: m.campus === 'Athi River' ? '#ECFDF5' : '#FFFBEB',
                                                            color: m.campus === 'Athi River' ? '#065F46' : '#92400E',
                                                            border: `1px solid ${m.campus === 'Athi River' ? '#A7F3D0' : '#FDE68A'}`,
                                                            borderRadius: '8px',
                                                            padding: '0.2rem 0.55rem',
                                                            fontSize: '0.74rem',
                                                            fontWeight: 800,
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        {m.campus} ⇄
                                                    </button>
                                                </td>
                                                <td style={{ padding: '0.55rem 0.85rem', textAlign: 'right' }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveRow(idx)}
                                                        style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '0.2rem' }}
                                                        title="Remove from import"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* ══ Modal Footer Actions ══ */}
                <div style={{
                    padding: '1.15rem 1.5rem',
                    borderTop: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#F8FAFC'
                }}>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            padding: '0.7rem 1.25rem',
                            background: '#FFFFFF',
                            border: '1px solid #CBD5E1',
                            borderRadius: '12px',
                            color: '#475569',
                            fontWeight: 800,
                            fontSize: '0.84rem',
                            cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        disabled={parsedList.length === 0 || isSubmitting}
                        onClick={handleExecuteImport}
                        style={{
                            padding: '0.75rem 1.45rem',
                            background: parsedList.length === 0 ? '#94A3B8' : 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)',
                            border: 'none',
                            borderRadius: '12px',
                            color: '#FFFFFF',
                            fontWeight: 800,
                            fontSize: '0.88rem',
                            cursor: parsedList.length === 0 || isSubmitting ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            boxShadow: parsedList.length === 0 ? 'none' : '0 4px 14px rgba(29, 78, 216, 0.3)'
                        }}
                    >
                        {isSubmitting ? (
                            <>
                                <RefreshCw className="animate-spin" size={16} />
                                <span>Importing to Database...</span>
                            </>
                        ) : (
                            <>
                                <span>Import {parsedList.length} Recruits to Register</span>
                                <ArrowRight size={16} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default G2MemberImportModal;
