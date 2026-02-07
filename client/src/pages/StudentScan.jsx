import { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import api from '../api';
import { CheckCircle, XCircle, ScanLine, Lock } from 'lucide-react';
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

            scanner.render(async (decodedText, result) => {
                // SECURITY: Screen vs Paper Detection (Digital Eye)
                const video = document.querySelector('#reader video');
                if (video) {
                    const canvas = document.createElement('canvas');
                    canvas.width = video.videoWidth / 4; // Downscale for faster analysis
                    canvas.height = video.videoHeight / 4;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
                    let digitalScore = 0;

                    // Logic: Check for high-frequency pixel patterns & excessive blue-light saturation
                    for (let i = 0; i < imageData.length; i += 16) {
                        const r = imageData[i], g = imageData[i + 1], b = imageData[i + 2];
                        // Screens tend to have a blue-light peak and very high local contrast (pixels)
                        if (b > r + 30 && b > g + 30) digitalScore++;
                    }

                    // If score is high, it's likely a digital screen
                    if (digitalScore > (canvas.width * canvas.height) / 100) {
                        setStatus('error');
                        setMsg('SECURITY ALERT: Digital Screen Detected. Please scan the physical printed banner. Photos/Screenshots are not allowed.');
                        scanner.clear();
                        return;
                    }
                }

                let code = decodedText;
                // If scanned text is a URL (e.g. from the dashboard QR), extract the code
                if (decodedText.includes('/check-in/')) {
                    const parts = decodedText.split('/check-in/');
                    code = parts[parts.length - 1].replace(/\/$/, ''); // handle trailing slash
                }

                // Check for local lock
                const lockData = localStorage.getItem(`doulos_attendance_lock_${code}`);
                if (lockData) {
                    const { reason } = JSON.parse(lockData);
                    setMsg(reason);
                    setStatus('locked');
                    scanner.clear();
                    return;
                }

                setStatus('submitting'); // Show a loading state
                try {
                    // Pre-verify the meeting link/time
                    // Using extracted code to avoid sending full URL to backend
                    const res = await api.get(`/meetings/code/${code}`);
                    setScannedCode(code); // Save the clean code
                    scanner.clear();
                    setStatus('form');
                } catch (err) {
                    setScannedCode(code);
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
            const errorMsg = err.response?.data?.message || 'Submission Failed';
            const status = err.response?.status;

            if (status === 403 || status === 409) {
                localStorage.setItem(`doulos_attendance_lock_${scannedCode}`, JSON.stringify({
                    reason: errorMsg,
                    timestamp: Date.now()
                }));
                setStatus('locked');
                setMsg(errorMsg);
                setTimeout(() => window.location.href = '/portal', 4000);
            } else {
                setStatus('error');
                setMsg(errorMsg);
            }
        }
    };

    const reset = () => {
        setScannedCode(null);
        setFormData({ studentName: '', studentRegNo: '' });
        setStatus('idle');
        setMsg('');
    };

    return (
        <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column', padding: '1.5rem', position: 'relative' }}>
            <ValentineRain />

            <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', marginBottom: '2.5rem', animation: 'fadeIn 0.8s ease-out' }}>
                <h1 style={{
                    fontSize: '2rem',
                    fontWeight: 900,
                    letterSpacing: '-0.05em',
                    margin: 0,
                    textShadow: '0 0 30px rgba(255, 255, 255, 0.2)'
                }}>
                    DOULOS <span style={{ color: 'hsl(var(--color-primary))' }}>SCANNER</span>
                </h1>
                <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '2px' }}>
                    SENSING QR CODE...
                </p>
            </div>

            <div className="glass-panel" style={{
                width: '100%',
                maxWidth: '450px',
                padding: '2.5rem',
                textAlign: 'center',
                border: '1px solid var(--glass-border)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                animation: 'slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                backdropFilter: 'blur(20px)'
            }}>
                {status === 'idle' && (
                    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
                        <div id="reader" style={{
                            borderRadius: '1.25rem',
                            overflow: 'hidden',
                            border: '2px solid rgba(37, 170, 225, 0.3)',
                            background: 'rgba(0,0,0,0.5)',
                            position: 'relative'
                        }}>
                            {/* Floating scanner corner accents could go here if CSS allows */}
                        </div>
                        <div style={{
                            marginTop: '2rem',
                            padding: '1rem',
                            background: 'rgba(37, 170, 225, 0.05)',
                            borderRadius: '1rem',
                            border: '1px solid rgba(37, 170, 225, 0.1)',
                            color: '#25AAE1',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            letterSpacing: '0.5px'
                        }}>
                            Align meeting QR code within the frame
                        </div>
                    </div>
                )}

                {status === 'form' && (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.5s ease-out' }}>
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(74, 222, 128, 0.1) 0%, transparent 100%)',
                            padding: '0.75rem',
                            borderRadius: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            justifyContent: 'center',
                            color: '#4ade80',
                            border: '1px solid rgba(74, 222, 128, 0.2)',
                            fontSize: '0.8rem',
                            fontWeight: 900,
                            letterSpacing: '1px'
                        }}>
                            <ScanLine size={18} /> CODE DETECTED
                        </div>

                        <div style={{ textAlign: 'left' }}>
                            <label style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem', display: 'block' }}>Student Details</label>
                            <input
                                placeholder="FULL NAME"
                                className="input-field"
                                style={{ height: '55px', fontSize: '1rem', fontWeight: 700, borderRadius: '0.75rem' }}
                                value={formData.studentName}
                                onChange={e => setFormData({ ...formData, studentName: e.target.value })}
                                required
                            />
                        </div>

                        <div style={{ textAlign: 'left' }}>
                            <input
                                placeholder="ADMISSION NO (e.g. 21-1234)"
                                className="input-field"
                                style={{ height: '55px', fontSize: '1rem', fontWeight: 700, borderRadius: '0.75rem' }}
                                value={formData.studentRegNo}
                                onChange={e => setFormData({ ...formData, studentRegNo: e.target.value })}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={status === 'submitting'}
                            style={{ height: '60px', fontSize: '1rem', fontWeight: 900, borderRadius: '1rem', textTransform: 'uppercase' }}
                        >
                            {status === 'submitting' ? 'SUBMITTING...' : 'SUBMIT ATTENDANCE'}
                        </button>
                        <button
                            type="button"
                            className="btn"
                            onClick={reset}
                            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--color-text-dim)', fontSize: '0.8rem', fontWeight: 700 }}
                        >
                            TRY AGAIN
                        </button>
                    </form>
                )}

                {status === 'submitting' && (
                    <div style={{ textAlign: 'center', padding: '3rem 0', animation: 'fadeIn 0.5s ease-out' }}>
                        <div className="loading-spinner-small" style={{ width: '50px', height: '50px', borderTopColor: '#25AAE1', margin: '0 auto 1.5rem' }}></div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '2px', color: '#25AAE1' }}>SUBMITTING...</h3>
                        <p style={{ color: 'var(--color-text-dim)', fontSize: '0.8rem', marginTop: '0.5rem' }}>Recording attendance...</p>
                    </div>
                )}

                {status === 'success' && (
                    <div style={{ textAlign: 'center', padding: '2rem 0', animation: 'fadeIn 0.8s ease-out' }}>
                        <div style={{
                            background: 'rgba(74, 222, 128, 0.1)',
                            width: '90px', height: '90px',
                            borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 1.5rem',
                            border: '1px solid rgba(74, 222, 128, 0.2)'
                        }}>
                            <CheckCircle size={50} color="#4ade80" />
                        </div>
                        <h2 style={{ color: '#4ade80', fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>SUCCESSFUL</h2>
                        <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '2.5rem' }}>{msg}</p>
                        <button className="btn btn-primary" onClick={reset} style={{ width: '100%', padding: '1.25rem', borderRadius: '1rem', fontWeight: 900 }}>SCAN ANOTHER</button>
                    </div>
                )}

                {status === 'error' && (
                    <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                        <div style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            width: '90px', height: '90px',
                            borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 1.5rem',
                            border: '1px solid rgba(239, 68, 68, 0.2)'
                        }}>
                            <XCircle size={50} color="#ef4444" />
                        </div>
                        <h2 style={{ color: '#ef4444', fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>FAILED</h2>
                        <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '2.5rem' }}>{msg}</p>
                        <button className="btn" onClick={reset} style={{ width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.75rem' }}>TRY AGAIN</button>
                    </div>
                )}

                {status === 'locked' && (
                    <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                        <div style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            width: '90px', height: '90px',
                            borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 1.5rem',
                            border: '1px solid rgba(239, 68, 68, 0.2)'
                        }}>
                            <Lock size={50} color="#ef4444" />
                        </div>
                        <h2 style={{ color: '#ef4444', fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>ACCESS DENIED</h2>
                        <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '2.5rem' }}>{msg}</p>
                        <button className="btn btn-primary" onClick={() => window.location.href = '/portal'} style={{ width: '100%', padding: '1.25rem', borderRadius: '1rem', fontWeight: 900 }}>GO TO PORTAL</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentScan;
