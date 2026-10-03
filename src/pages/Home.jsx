
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Download, Layout, Sparkles, ShieldCheck } from 'lucide-react';

const Home = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [showIosHelp, setShowIosHelp] = useState(false);

    useEffect(() => {
        // Detect iOS
        const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        setIsIOS(ios);

        // Check if already installed
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
        setIsInstalled(isStandalone);

        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (isInstalled) return;

        if (isIOS) {
            setShowIosHelp(true);
            return;
        }

        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setIsInstallable(false);
            setIsInstalled(true);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
            {/* Nav */}
            <nav style={{
                width: '100%',
                padding: '24px 40px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                maxWidth: '1200px',
                zIndex: 10
            }}>
                <div style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--accent)' }}>
                    KASHIF
                </div>
                <Link to="/login" style={{
                    color: 'var(--text-secondary)',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: 500,
                    transition: 'color 0.2s'
                }}
                    onMouseEnter={(e) => e.target.style.color = '#fff'}
                    onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
                >
                    Admin Login
                </Link>
            </nav>

            {/* Hero */}
            <main style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 20px',
                textAlign: 'center',
                maxWidth: '800px',
                position: 'relative',
                zIndex: 1
            }}>
                {/* Background Glow */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '400px',
                    height: '400px',
                    background: 'radial-gradient(circle, rgba(255, 122, 26, 0.1) 0%, transparent 70%)',
                    zIndex: -1,
                    filter: 'blur(40px)'
                }} />

                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    backgroundColor: 'rgba(255, 122, 26, 0.1)',
                    borderRadius: '100px',
                    color: 'var(--accent)',
                    fontSize: '14px',
                    fontWeight: 500,
                    marginBottom: '24px',
                    border: '1px solid rgba(255, 122, 26, 0.2)'
                }}>
                    <Sparkles size={16} />
                    Premium Portfolio Builder
                </div>

                <h1 style={{
                    fontSize: 'clamp(40px, 8vw, 72px)',
                    fontWeight: 800,
                    lineHeight: 1.1,
                    marginBottom: '20px',
                    letterSpacing: '-0.03em'
                }}>
                    Powered by <span style={{ color: 'var(--accent)' }}>Kashif</span>
                </h1>

                <p style={{
                    fontSize: 'clamp(16px, 4vw, 20px)',
                    color: 'var(--text-secondary)',
                    marginBottom: '40px',
                    lineHeight: 1.6,
                    maxWidth: '600px'
                }}>
                    The most elegant way to share your professional portfolio.
                    Fast, secure, and designed for high-end creative visual work.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        {!isInstalled && (
                            <button
                                onClick={handleInstallClick}
                                className="btn-primary"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '16px 32px',
                                    fontSize: '16px',
                                    opacity: (isInstallable || isIOS) ? 1 : 0.6,
                                    cursor: (isInstallable || isIOS) ? 'pointer' : 'default'
                                }}
                            >
                                <Download size={20} />
                                {isIOS ? 'Install App' : (isInstallable ? 'Install App' : 'PWA Supported')}
                            </button>
                        )}

                        {isInstalled && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '16px 32px',
                                fontSize: '16px',
                                color: 'var(--accent)',
                                backgroundColor: 'rgba(255, 122, 26, 0.1)',
                                borderRadius: '12px',
                                border: '1px solid rgba(255, 122, 26, 0.2)',
                                fontWeight: 600
                            }}>
                                <Sparkles size={20} />
                                App Installed
                            </div>
                        )}

                        <Link to="/login" style={{ textDecoration: 'none' }}>
                            <button className="btn-secondary" style={{
                                padding: '16px 32px',
                                fontSize: '16px',
                                backgroundColor: 'transparent',
                                border: '1px solid var(--grid-line)',
                                color: '#fff'
                            }}>
                                Get Started
                            </button>
                        </Link>
                    </div>

                    {showIosHelp && !isInstalled && (
                        <div className="fade-in" style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            padding: '16px 24px',
                            borderRadius: '16px',
                            border: '1px solid var(--grid-line)',
                            maxWidth: '320px',
                            fontSize: '14px',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.5,
                            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                            position: 'relative',
                            marginTop: '10px'
                        }}>
                            <div style={{ fontWeight: 600, color: '#fff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Download size={16} />
                                Install on iOS
                            </div>
                            To install, tap the <span style={{ color: '#fff' }}>Share icon</span> at the bottom of Safari, then select <span style={{ color: '#fff' }}>"Add to Home Screen"</span>.
                            <button
                                onClick={() => setShowIosHelp(false)}
                                style={{
                                    position: 'absolute',
                                    top: '12px',
                                    right: '12px',
                                    color: 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    padding: '4px'
                                }}
                            >
                                ✕
                            </button>
                        </div>
                    )}
                </div>
            </main>

            {/* Features Info */}
            <div style={{
                padding: '80px 20px',
                width: '100%',
                maxWidth: '1200px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '40px'
            }}>
                <div className="card-glass" style={{ padding: '32px', borderRadius: '24px' }}>
                    <div style={{ color: 'var(--accent)', marginBottom: '16px' }}><Layout size={32} /></div>
                    <h3 style={{ marginBottom: '12px' }}>Stunning Display</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Beautiful 4:3 image grids with interactive spotlight glowing effects.</p>
                </div>
                <div className="card-glass" style={{ padding: '32px', borderRadius: '24px' }}>
                    <div style={{ color: 'var(--accent)', marginBottom: '16px' }}><ShieldCheck size={32} /></div>
                    <h3 style={{ marginBottom: '12px' }}>Secure Management</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Powerful admin dashboard to manage your portfolios with ease.</p>
                </div>
                <div className="card-glass" style={{ padding: '32px', borderRadius: '24px' }}>
                    <div style={{ color: 'var(--accent)', marginBottom: '16px' }}><Sparkles size={32} /></div>
                    <h3 style={{ marginBottom: '12px' }}>Mobile Native</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Full PWA support to install it as a native app on your home screen.</p>
                </div>
            </div>

            <footer style={{
                padding: '40px',
                width: '100%',
                textAlign: 'center',
                borderTop: '1px solid var(--grid-line)',
                color: 'var(--text-secondary)',
                fontSize: '14px'
            }}>
                © {new Date().getFullYear()} Powered by Kashif. All rights reserved.
            </footer>

            <style>{`
                .card-glass {
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    transition: transform 0.3s ease, border-color 0.3s ease;
                }
                .card-glass:hover {
                    transform: translateY(-8px);
                    border-color: rgba(255, 255, 255, 0.1);
                    background: rgba(255, 255, 255, 0.05);
                }
                .fade-in {
                    animation: fadeIn 0.3s ease-out forwards;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default Home;
