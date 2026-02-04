import { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import api from '../api';
import { CheckCircle, XCircle, ScanLine } from 'lucide-react';
import ValentineRain from '../components/ValentineRain';

const StudentScan = () => {
    const [scannedCode, setScannedCode] = useState(null);
    const [formData, setFormData] = useState({ studentName: '', studentRegNo: '' });
    const [status, setStatus] = useState('idle'); // idle, scanning, submitting, success, error
    const [msg, setMsg] = useState('');

    useEffect(() => {
        if (status === 'idle' && !scannedCode) {
            const scanner = new Html5QrcodeScanner(
                "reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
            );

            scanner.render(async (decodedText) => {
                setStatus('submitting'); // Show a loading state
                try {
                    // Pre-verify the meeting link/time
                    const res = await api.get(`/meetings/code/${decodedText}`);
                    setScannedCode(decodedText);
                    scanner.clear();
                    setStatus('form');
                } catch (err) {
                    setScannedCode(decodedText);
                    scanner.clear();
                    setStatus('error');
                    setMsg(err.response?.data?.message || 'Invalid QR code or access restricted.');
                }
            }, (error) => {
                // console.warn(error);
            });

            return () => {
                scanner.clear().catch(error => console.error("Failed to clear html5-qrcode scanner. ", error));
            };
        }
    }, [status, scannedCode]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('submitting');
        try {
            await api.post('/attendance/submit', {
                meetingCode: scannedCode,
                studentName: formData.studentName,
                studentRegNo: formData.studentRegNo
            });
            setStatus('success');
            setMsg('Attendance Recorded Successfully!');
        } catch (err) {
            setStatus('error');
            setMsg(err.response?.data?.message || 'Submission Failed');
        }
    };

    const reset = () => {
        setScannedCode(null);
        setFormData({ studentName: '', studentRegNo: '' });
        setStatus('idle');
        setMsg('');
    };

    return (
        <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column', padding: '1rem' }}>
            <ValentineRain />
            <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '1.5rem', textAlign: 'center' }}>
                <h2 style={{ marginBottom: '1.5rem' }}>Doulos Check-In</h2>

                {status === 'idle' && (
                    <div>
                        <div id="reader" style={{ borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid var(--glass-border)' }}></div>
                        <p style={{ marginTop: '1rem', color: 'var(--color-text-dim)' }}>Divinely scan the meeting QR code</p>
                    </div>
                )}

                {status === 'form' && (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.5rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                            <ScanLine size={16} /> <span>Code Scanned</span>
                        </div>

                        <input
                            placeholder="Full Name"
                            className="input-field"
                            value={formData.studentName}
                            onChange={e => setFormData({ ...formData, studentName: e.target.value })}
                            required
                        />
                        <input
                            placeholder="Registration No (e.g. 12-3456)"
                            className="input-field"
                            value={formData.studentRegNo}
                            onChange={e => setFormData({ ...formData, studentRegNo: e.target.value })}
                            required
                        />

                        <button type="submit" className="btn btn-primary" disabled={status === 'submitting'}>
                            {status === 'submitting' ? 'Submitting...' : 'Submit Attendance'}
                        </button>
                        <button type="button" className="btn" onClick={reset} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)' }}>
                            Scan Again
                        </button>
                    </form>
                )}

                {status === 'success' && (
                    <div className="flex-center" style={{ flexDirection: 'column', gap: '1rem', padding: '2rem 0' }}>
                        <CheckCircle size={64} color="#4ade80" />
                        <h3 style={{ color: '#4ade80' }}>Success!</h3>
                        <p>{msg}</p>
                        <button className="btn" onClick={reset} style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.1)' }}>Check In Another</button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex-center" style={{ flexDirection: 'column', gap: '1rem', padding: '2rem 0' }}>
                        <XCircle size={64} color="#ef4444" />
                        <h3 style={{ color: '#ef4444' }}>Error</h3>
                        <p>{msg}</p>
                        <button className="btn" onClick={reset} style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.1)' }}>Try Again</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentScan;
