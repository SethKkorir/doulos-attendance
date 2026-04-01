import mongoose from 'mongoose';

class DowntimeManager {
    constructor() {
        this.status = {
            isManualMaintenance: process.env.MANUAL_MAINTENANCE === 'true',
            isSystemCrashed: false,
            lastChecked: null,
            errors: []
        };
        this.adminBypassHeader = 'X-Admin-Bypass';
        this.adminIPs = (process.env.ADMIN_IPS || '').split(',').map(ip => ip.trim()).filter(Boolean);
        this.checkInterval = 30000; // 30 seconds
        this.init();
    }

    init() {
        // Start periodic health check
        setInterval(() => this.performHealthCheck(), this.checkInterval);
        // Initial check
        this.performHealthCheck();
    }

    async performHealthCheck() {
        const errors = [];
        try {
            // Check MongoDB Connection
            if (mongoose.connection.readyState !== 1) {
                errors.push('Database connection is not active');
            }
        } catch (err) {
            errors.push(`Health check failed: ${err.message}`);
        }

        this.status.isSystemCrashed = errors.length > 0;
        this.status.errors = errors;
        this.status.lastChecked = new Date();

        if (this.status.isSystemCrashed) {
            console.warn(`[HEALTH CHECK] System moved to Isolation Mode. Errors: ${errors.join(', ')}`);
        } else if (errors.length === 0 && this.status.isSystemCrashed) {
            console.log('[HEALTH CHECK] System recovered automatically.');
        }

        return !this.status.isSystemCrashed;
    }

    shouldBypass(req) {
        // Check for Admin Bypass Header
        const bypassHeader = req.headers[this.adminBypassHeader.toLowerCase()];
        if (bypassHeader && bypassHeader === process.env.ADMIN_BYPASS_KEY) {
            return true;
        }

        // Check for Admin IP
        const clientIP = req.ip || req.connection.remoteAddress;
        if (this.adminIPs.includes(clientIP)) {
            return true;
        }

        return false;
    }

    getDowntimeMiddleware() {
        return async (req, res, next) => {
            // Admin Bypass
            if (this.shouldBypass(req)) {
                return next();
            }

            // Quick Dependency Check (Fast property check)
            const isDbConnected = mongoose.connection.readyState === 1;
            if (!isDbConnected && !this.status.isSystemCrashed) {
                this.status.isSystemCrashed = true;
                this.status.errors = ['Immediate detection: Database disconnected'];
            }

            // Manual Maintenance
            if (this.status.isManualMaintenance) {
                return this.renderDowntime(res, 'Scheduled Maintenance', 'We are currently performing scheduled maintenance to improve our services. Please check back shortly.', 503);
            }

            // Automatic System Crash / Isolation Mode
            if (this.status.isSystemCrashed) {
                return this.renderDowntime(res, 'System Stabilizing', 'Our systems are currently experiencing technical issues. Our automated team is working on stabilizing everything.', 503);
            }

            next();
        };
    }

    renderDowntime(res, title, message, status) {
        // Professional messaging
        const displayTitle = title || 'System Stabilizing';
        const customMessage = 'Our developers are currently working on this issue. We apologize for any inconvenience caused and appreciate your patience.';
        
        // Beautiful HTML Template
        const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${displayTitle} | Doulos Attendance</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
            <style>
                :root {
                    --primary: #0f172a;
                    --brand: #3b82f6;
                    --accent: #8b5cf6;
                    --text: #f8fafc;
                    --text-muted: #94a3b8;
                    --glass: rgba(15, 23, 42, 0.8);
                    --border: rgba(255, 255, 255, 0.08);
                }
                * { box-sizing: border-box; }
                body {
                    margin: 0;
                    padding: 0;
                    background-color: var(--primary);
                    color: var(--text);
                    font-family: 'Inter', sans-serif;
                    height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                    background-image: 
                        radial-gradient(at 0% 0%, rgba(59, 130, 246, 0.1) 0px, transparent 50%),
                        radial-gradient(at 100% 100%, rgba(139, 92, 246, 0.1) 0px, transparent 50%);
                }
                .barrier-box {
                    max-width: 480px;
                    width: 90%;
                    background: var(--glass);
                    backdrop-filter: blur(24px);
                    border: 1px solid var(--border);
                    border-radius: 32px;
                    padding: 3.5rem 2.5rem;
                    text-align: center;
                    box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 0.5);
                    position: relative;
                }
                .logo-container {
                    margin-bottom: 2.5rem;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1rem;
                }
                .logo-img {
                    width: 80px;
                    height: 80px;
                    filter: drop-shadow(0 0 20px rgba(59, 130, 246, 0.3));
                }
                .logo-text {
                    font-weight: 800;
                    font-size: 1.25rem;
                    letter-spacing: 0.1em;
                    color: white;
                }
                .icon-status {
                    font-size: 2.5rem;
                    margin-bottom: 1rem;
                    animation: subtle-pulse 3s infinite ease-in-out;
                }
                @keyframes subtle-pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.7; transform: scale(0.95); }
                }
                h1 {
                    font-size: 1.75rem;
                    font-weight: 700;
                    margin: 0 0 1rem 0;
                    letter-spacing: -0.02em;
                    background: linear-gradient(135deg, #fff 0%, #cbd5e1 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                p {
                    font-size: 1rem;
                    line-height: 1.6;
                    color: var(--text-muted);
                    margin: 0 0 2.5rem 0;
                    font-weight: 400;
                }
                .loader-track {
                    width: 100%;
                    height: 3px;
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 10px;
                    position: relative;
                    overflow: hidden;
                    margin-bottom: 1.5rem;
                }
                .loader-fill {
                    position: absolute;
                    left: 0;
                    top: 0;
                    height: 100%;
                    width: 40%;
                    background: linear-gradient(90deg, transparent, var(--brand), var(--accent), transparent);
                    animation: scanning 2s infinite ease-in-out;
                }
                @keyframes scanning {
                    0% { left: -40%; }
                    100% { left: 100%; }
                }
                .recovery-status {
                    font-size: 0.75rem;
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.15em;
                    color: #64748b;
                }
            </style>
        </head>
        <body>
            <div class="barrier-box">
                <div class="logo-container">
                    <img src="/logo.png" alt="Doulos Logo" class="logo-img" onerror="this.src='https://cdn-icons-png.flaticon.com/512/9165/9165675.png'">
                    <div class="logo-text">DOULOS SYSTEM</div>
                </div>
                
                <h1>${displayTitle}</h1>
                <p>${customMessage}</p>

                <div class="loader-track">
                    <div class="loader-fill"></div>
                </div>
                
                <div class="recovery-status">Monitoring System Stability...</div>
            </div>

            <script>
                // Self-Recovery Script: Pings the server and reloads as soon as it's back
                const checkRecovery = async () => {
                    try {
                        const response = await fetch('/api/auth/login', { 
                            method: 'HEAD',
                            cache: 'no-cache'
                        });
                        // If it's no longer 503, it means we are back online
                        if (response.status !== 503) {
                            window.location.reload();
                        }
                    } catch (e) {
                        // Keep monitoring
                    }
                };

                // Check every 10 seconds for a faster recovery feel than the standard 30s
                setInterval(checkRecovery, 10000);
            </script>
        </body>
        </html>
        `;

        res.status(status).send(html);
    }

    // Unified Error Interceptor
    getErrorInterceptor() {
        return (err, req, res, next) => {
            console.error(`[UNEXPECTED CRASH] ${err.message}`);
            // If it's a critical error not caught elsewhere
            this.renderDowntime(
                res, 
                'Deep Refresh Underway', 
                'Something unexpected occurred. Our system is performing a deep refresh to ensure data integrity and stability.', 
                500
            );
        };
    }
}

const downtimeManager = new DowntimeManager();
export default downtimeManager;
