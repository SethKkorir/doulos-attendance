import React, { useState, useEffect } from 'react';
import { 
    QrCode as QrIcon, Camera, Smartphone, RefreshCw, 
    Download, Check, Shield, AlertTriangle, ExternalLink, Image
} from 'lucide-react';
import QRCode from 'react-qr-code';
import defaultApi from '../../api';

const G9MediaConsole = ({ api, setMsg, isGuest, currentSemester }) => {
    const client = api || defaultApi;
    const notify = (msg) => {
        if (typeof setMsg === 'function') setMsg(msg);
        else console.log('[G9Media]', msg);
    };

    const [birthdayQueue, setBirthdayQueue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mintedToken, setMintedToken] = useState(null);
    const [mintingLoading, setMintingLoading] = useState(false);
    
    // Device Lock Reset
    const [resetRegNo, setResetRegNo] = useState('');
    const [resetReason, setResetReason] = useState('New Smartphone Acquired');
    const [resetLoading, setResetLoading] = useState(false);

    const fetchQueue = async () => {
        setLoading(true);
        try {
            const res = await client.get('/council/media/birthday-queue');
            setBirthdayQueue(res.data);
        } catch (err) {
            console.error('Error fetching birthday queue:', err);
            notify({ type: 'error', text: 'Failed to load birthday poster queue' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQueue();
    }, []);

    const handleMintMasterQr = async () => {
        if (isGuest) return notify({ type: 'error', text: 'Action disabled in Guest Mode' });
        setMintingLoading(true);
        try {
            const res = await client.post('/council/media/mint-master-qr', { semesterCode: currentSemester });
            setMintedToken(res.data.token);
            notify({ type: 'success', text: res.data.message });
        } catch (err) {
            notify({ type: 'error', text: err.response?.data?.message || 'Failed to mint master QR' });
        } finally {
            setMintingLoading(false);
        }
    };

    const handleUpdateBirthdayStatus = async (memberId, newStatus) => {
        if (isGuest) return notify({ type: 'error', text: 'Action disabled in Guest Mode' });
        try {
            await client.patch(`/council/media/birthday-status/${memberId}`, { status: newStatus });
            notify({ type: 'success', text: `Status updated to ${newStatus}` });
            fetchQueue();
        } catch (err) {
            notify({ type: 'error', text: 'Failed to update poster status' });
        }
    };

    const handleResetDeviceLock = async (e) => {
        e.preventDefault();
        if (isGuest) return notify({ type: 'error', text: 'Action disabled in Guest Mode' });
        if (!resetRegNo.trim()) return;

        setResetLoading(true);
        try {
            const res = await client.post('/council/media/reset-device-lock', {
                studentRegNo: resetRegNo.trim(),
                reason: resetReason
            });
            notify({ type: 'success', text: res.data.message });
            setResetRegNo('');
        } catch (err) {
            notify({ type: 'error', text: err.response?.data?.message || 'Device reset failed' });
        } finally {
            setResetLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {/* G9 HEADER */}
            <div style={{ 
                background: '#FFFFFF', 
                border: '1px solid #EBEBF2', 
                borderRadius: '16px', 
                padding: '1.5rem',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem'
            }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <Camera size={18} style={{ color: '#ec4899' }} />
                        <span style={{ fontSize: '0.72rem', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase', color: '#ec4899' }}>
                            G9 MEDIA, DIGITAL SYSTEMS & BIRTHDAY STUDIO
                        </span>
                    </div>
                    <h3 style={{ margin: 0, color: "#1E1B39", fontWeight: 800, fontSize: '1.3rem' }}>
                        Master Semester QR Minter & 14-Day Birthday Studio
                    </h3>
                    <p style={{ margin: '0.25rem 0 0 0', color: "#7E7A9B", fontSize: '0.82rem' }}>
                        Cryptographic entrance QR minting, member photo downloads, and device lock resets.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        onClick={handleMintMasterQr}
                        disabled={mintingLoading}
                        className="btn"
                        style={{ background: '#ec4899', color: "#1E1B39", fontWeight: 800, padding: '0.55rem 1rem', borderRadius: '10px', border: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
                    >
                        <QrIcon size={16} />
                        <span>{mintingLoading ? 'Minting...' : 'Mint Master Semester QR'}</span>
                    </button>
                </div>
            </div>

            {/* MASTER QR DISPLAY BANNER IF MINTED */}
            {mintedToken && (
                <div style={{ background: '#F8F8FC', border: '1px solid #ec4899', borderRadius: '14px', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <div style={{ background: 'white', padding: '0.75rem', borderRadius: '10px', display: 'inline-block' }}>
                        <QRCode value={mintedToken} size={110} level="H" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '0.72rem', color: '#ec4899', fontWeight: 900, textTransform: 'uppercase' }}>
                            NEW MASTER SEMESTER QR TOKEN MINTED
                        </span>
                        <h4 style={{ margin: '0.2rem 0', color: "#1E1B39", fontWeight: 800 }}>
                            {currentSemester} Entrance Canvas Token
                        </h4>
                        <code style={{ fontSize: '0.82rem', color: '#38bdf8', wordBreak: 'break-all' }}>
                            {mintedToken}
                        </code>
                        <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.75rem', color: "#7E7A9B" }}>
                            Print this QR code on durable canvas/card at the hall entrance. Students scan this same code weekly.
                        </p>
                    </div>
                </div>
            )}

            {/* BIRTHDAY POSTER STUDIO QUEUE (US-BIR-014 & US-G9-010) */}
            <div style={{ background: '#FFFFFF', border: '1px solid #EBEBF2', borderRadius: '16px', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <div>
                        <h4 style={{ margin: 0, color: "#1E1B39", fontWeight: 800, fontSize: '1.05rem' }}>
                            Rolling 14-Day Birthday Poster Queue ({birthdayQueue.length})
                        </h4>
                        <p style={{ margin: '0.2rem 0 0 0', color: "#7E7A9B", fontSize: '0.8rem' }}>
                            Members celebrating birthdays in the next 14 days with uploaded profile photos.
                        </p>
                    </div>
                    <button onClick={fetchQueue} style={{ background: 'transparent', border: 'none', color: '#25AAE1', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>Refresh</button>
                </div>

                {loading ? (
                    <div style={{ padding: '2.5rem', textAlign: 'center', color: "#7E7A9B" }}>
                        Loading Birthday Queue...
                    </div>
                ) : birthdayQueue.length === 0 ? (
                    <div style={{ padding: '2.5rem', textAlign: 'center', color: "#7E7A9B", fontSize: '0.85rem' }}>
                        No members celebrating birthdays in the upcoming 14 days.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                        {birthdayQueue.map((member) => (
                            <div key={member._id} style={{ background: '#F8F8FC', border: '1px solid #EBEBF2', borderRadius: '12px', padding: '1.1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.85rem' }}>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <div style={{ color: "#1E1B39", fontWeight: 800, fontSize: '0.98rem' }}>{member.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#ec4899', fontWeight: 700, marginTop: '0.15rem' }}>
                                                🎂 {new Date(member.dateOfBirth).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                            </div>
                                        </div>
                                        <span style={{ 
                                            background: member.birthdayPosterStatus === 'Published to Socials' ? 'rgba(16,185,129,0.15)' : member.birthdayPosterStatus === 'Poster Created' ? 'rgba(37,170,225,0.15)' : 'rgba(245,158,11,0.15)',
                                            color: member.birthdayPosterStatus === 'Published to Socials' ? '#10b981' : member.birthdayPosterStatus === 'Poster Created' ? '#38bdf8' : '#fbbf24',
                                            fontSize: '0.68rem',
                                            fontWeight: 800,
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: '4px'
                                        }}>
                                            {member.birthdayPosterStatus || 'Pending Design'}
                                        </span>
                                    </div>

                                    {/* Photo Vault Preview */}
                                    <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                        {(member.photoVault || []).length > 0 ? (
                                            member.photoVault.map((url, idx) => (
                                                <a key={idx} href={url} target="_blank" rel="noreferrer" title="View High-Res Photo" style={{ display: 'block', width: '38px', height: '38px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #EBEBF2' }}>
                                                    <img src={url} alt="Member" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                </a>
                                            ))
                                        ) : (
                                            <span style={{ fontSize: '0.72rem', color: "#7E7A9B", fontStyle: 'italic' }}>No photos uploaded</span>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.4rem', paddingTop: '0.6rem', borderTop: '1px solid #EBEBF2' }}>
                                    <button
                                        onClick={() => handleUpdateBirthdayStatus(member._id, 'Poster Created')}
                                        style={{ flex: 1, background: '#1e293b', color: "#1E1B39", border: 'none', borderRadius: '6px', padding: '0.4rem', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                                    >
                                        Mark Ready
                                    </button>
                                    <button
                                        onClick={() => handleUpdateBirthdayStatus(member._id, 'Published to Socials')}
                                        style={{ flex: 1, background: '#10b981', color: "#FFFFFF", border: 'none', borderRadius: '6px', padding: '0.4rem', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer' }}
                                    >
                                        Published
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* DEVICE LOCK RESET UTILITY */}
            <div style={{ background: '#FFFFFF', border: '1px solid #EBEBF2', borderRadius: '16px', padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <Smartphone size={16} style={{ color: '#25AAE1' }} />
                    <h4 style={{ margin: 0, color: "#1E1B39", fontWeight: 800, fontSize: '1.05rem' }}>
                        Device Lock Reset Utility
                    </h4>
                </div>
                <p style={{ margin: '0 0 1.25rem 0', color: "#7E7A9B", fontSize: '0.8rem' }}>
                    Release device binding (<code>linkedDeviceId</code>) when a student legitimately acquires a new phone.
                </p>

                <form onSubmit={handleResetDeviceLock} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr auto', gap: '0.75rem', alignItems: 'flex-end' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', color: "#7E7A9B", fontWeight: 700, marginBottom: '0.2rem' }}>STUDENT ADMISSION NUMBER</label>
                        <input
                            type="text"
                            placeholder="e.g. 24-0123"
                            value={resetRegNo}
                            onChange={(e) => setResetRegNo(e.target.value)}
                            style={{ width: '100%', background: '#F8F8FC', border: '1px solid #EBEBF2', color: "#1E1B39", padding: '0.55rem', borderRadius: '8px', boxSizing: 'border-box' }}
                            required
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', color: "#7E7A9B", fontWeight: 700, marginBottom: '0.2rem' }}>JUSTIFICATION</label>
                        <input
                            type="text"
                            value={resetReason}
                            onChange={(e) => setResetReason(e.target.value)}
                            style={{ width: '100%', background: '#F8F8FC', border: '1px solid #EBEBF2', color: "#1E1B39", padding: '0.55rem', borderRadius: '8px', boxSizing: 'border-box' }}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={resetLoading}
                        className="btn"
                        style={{ background: "#4B3F8C", color: "#FFFFFF", fontWeight: 800, padding: '0.55rem 1.1rem', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                    >
                        {resetLoading ? 'Releasing...' : 'Release Lock'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default G9MediaConsole;
