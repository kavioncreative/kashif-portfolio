import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getPortfolioUrl } from '../utils/portfolioUtils';
import { isVideo, isGif } from '../utils/mediaUtils';
import ImageGrid from '../components/ImageGrid';
import { LayoutGrid, List, Sparkles, ShieldCheck, Download, Eye, ArrowLeft } from 'lucide-react';
import ImageEditModal from '../components/ImageEditModal';
import ScrollToTop from '../components/ScrollToTop';

const PortfolioView = () => {
    const { shortId } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams(); // Get URL params
    const [portfolio, setPortfolio] = useState(null);
    const [images, setImages] = useState([]);
    const [isPageLoading, setIsPageLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false);
    const [error, setError] = useState(null);
    const [isAuthenticatedOwner, setIsAuthenticatedOwner] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [savingPreview, setSavingPreview] = useState(false);

    // Determine if we are in "Admin/Edit Mode"
    const isAdminMode = searchParams.get('mode') === 'admin';
    const showOwnerControls = isAuthenticatedOwner && isAdminMode;

    const [profileSettings, setProfileSettings] = useState({
        profile_image_url: null,
        intro_text: ''
    });

    // ... (existing logic)

    useEffect(() => {
        setIsMounted(true);
        loadFullPageData();
    }, [shortId]);

    const loadFullPageData = async () => {
        setIsPageLoading(true);
        try {
            await checkUser();
            if (shortId) {
                // Fetch portfolio first to get owner_id
                const ownerId = await fetchPortfolioData(shortId);
                if (ownerId) {
                    // Fetch profile settings using owner_id
                    await fetchProfileSettings(ownerId);
                }
            }

            // Introduce a natural breathing delay so the transition feels premium
            setTimeout(() => {
                setIsPageLoading(false);
            }, 800);
        } catch (err) {
            console.error('Loader breakdown:', err);
            setError('Portfolio initialization failed.');
            setIsPageLoading(false);
        }
    };

    const fetchProfileSettings = async (ownerId) => {
        try {
            const { data } = await supabase
                .from('site_settings')
                .select('profile_image_url, intro_text')
                .eq('owner_id', ownerId)
                .single();

            if (data) {
                setProfileSettings({
                    profile_image_url: data.profile_image_url,
                    intro_text: data.intro_text || ''
                });
            }
        } catch (error) {
            console.error('Error fetching profile settings:', error);
        }
    };

    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticatedOwner(!!session);
    };

    // ... (fetchPortfolioData remains same)
    const fetchPortfolioData = async (idPrefix) => {
        try {
            // 1. First, try many matching methods to find the full UUID
            // We fetch all IDs because ilike on UUID columns is strictly typed in PostgREST
            const { data: allIds, error: idsError } = await supabase
                .from('portfolios')
                .select('id');

            if (idsError) throw idsError;

            const fullMatch = allIds.find(p => p.id === idPrefix);
            const prefixMatch = allIds.find(p => p.id.startsWith(idPrefix));
            const targetId = fullMatch ? fullMatch.id : (prefixMatch ? prefixMatch.id : null);

            if (!targetId) throw new Error('Portfolio not found');

            // 2. Fetch the full record using the verified UUID
            const { data: pfData, error: pfError } = await supabase
                .from('portfolios')
                .select('*')
                .eq('id', targetId)
                .single();

            if (pfError) throw pfError;
            setPortfolio(pfData);

            // 3. Fetch images using the verified UUID
            const { data: imgData, error: imgError } = await supabase
                .from('portfolio_images')
                .select('*')
                .eq('portfolio_id', targetId)
                .order('created_at', { ascending: true });

            if (imgError) throw imgError;
            setImages(imgData || []);

            return pfData.owner_id;

        } catch (err) {
            console.error('Error loading portfolio:', err);
            setError('Portfolio not found.');
            return null;
        }
    };

    const handleEditImage = (image) => {
        if (!showOwnerControls) return; // Guard clause
        setSelectedImage(image);
        setEditModalOpen(true);
    };

    const handleSaveImageSettings = async (settings) => {
        if (!selectedImage) {
            console.error('❌ Error: No image selected for saving');
            return;
        }

        console.log('📩 ON SAVE RECEIVED (Parent):', settings);
        console.log('🆔 UPDATING IMAGE ID:', selectedImage.id);

        setSavingPreview(true);
        try {
            // Settings structure from ImageEditModal:
            // {
            //   crop: { x, y, width, height },  // Percentages for re-editing
            //   zoom: number,
            //   previewUrl: string              // Uploaded image URL from Supabase Storage
            // }

            console.log('💾 Saving to database:', settings);

            // Extract preview URL (if exists) and crop settings
            const { previewUrl, ...previewSettings } = settings;

            // Build update payload
            const updatePayload = {
                preview_settings: previewSettings  // { crop, zoom }
            };

            // ========================================
            // PERSIST preview_image_url
            // ========================================
            // This is the PRIMARY source for grid previews
            // It contains the EXACT cropped image URL from Supabase Storage
            if (previewUrl) {
                updatePayload.preview_image_url = previewUrl;
                console.log('🌐 Saving preview URL:', previewUrl);
            }

            const { error } = await supabase
                .from('portfolio_images')
                .update(updatePayload)
                .eq('id', selectedImage.id);

            if (error) throw error;

            console.log('✅ Database update successful');

            // Update local state to reflect changes immediately
            setImages(prev => prev.map(img => {
                if (img.id === selectedImage.id) {
                    return {
                        ...img,
                        preview_settings: previewSettings,
                        preview_image_url: previewUrl || img.preview_image_url
                    };
                }
                return img;
            }));

            setEditModalOpen(false);
            setSelectedImage(null);

        } catch (error) {
            console.error('❌ Error saving image settings:', error);
            alert('Failed to save preview settings');
        } finally {
            setSavingPreview(false);
        }
    };


    if (isPageLoading) {
        return (
            <div className={`page-loader-gate ${isMounted ? 'mounted' : ''}`}>
                <div className="loader-identity-pulse">
                    <div className="pulse-circle" />
                    <span className="loader-text">Loading Excellence</span>
                </div>
                <style>{`
                    .page-loader-gate {
                        position: fixed;
                        inset: 0;
                        background-color: #000000;
                        z-index: 9999;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        opacity: 0;
                        transition: opacity 0.5s ease;
                    }
                    .page-loader-gate.mounted {
                        opacity: 1;
                    }
                    .loader-identity-pulse {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 24px;
                        transition: transform 0.6s cubic-bezier(0.23, 1, 0.32, 1);
                    }
                    .pulse-circle {
                        width: 48px;
                        height: 48px;
                        background: var(--accent);
                        border-radius: 50%;
                        position: relative;
                        animation: pulse-ring 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite;
                    }
                    .loader-text {
                        color: #ffffff;
                        font-size: 13px;
                        letter-spacing: 0.3em;
                        text-transform: uppercase;
                        font-weight: 500;
                        opacity: 0.4;
                    }
                    @keyframes pulse-ring {
                        0% { transform: scale(0.8); opacity: 0.8; box-shadow: 0 0 0 0 rgba(255, 122, 26, 0.4); }
                        50% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 20px rgba(255, 122, 26, 0); }
                        100% { transform: scale(0.8); opacity: 0.8; box-shadow: 0 0 0 0 rgba(255, 122, 26, 0.4); }
                    }
                `}</style>
            </div>
        );
    }

    if (error || !portfolio) {
        return (
            <div style={{
                display: 'flex', flexDirection: 'column', gap: '20px',
                justifyContent: 'center', alignItems: 'center',
                height: '100vh', backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)'
            }}>
                <div style={{ fontSize: '20px', fontWeight: 500, opacity: 0.6 }}>{error || 'Portfolio not found'}</div>
                <button onClick={() => window.location.reload()} className="btn-secondary">
                    Retry Loading
                </button>
            </div>
        );
    }

    return (
        <div className="fade-in-content" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
            <style>{`
                .fade-in-content {
                    animation: pageFadeIn 0.8s cubic-bezier(0.23, 1, 0.32, 1) forwards;
                }
                @keyframes pageFadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: none; }
                }
            `}</style>

            {/* Profile Header Section */}
            <div className="portfolio-profile-header">
                {/* Back Button - Absolute positioned left */}
                {showOwnerControls && (
                    <div className="owner-controls-header-left" style={{ position: 'absolute', top: '24px', left: '40px', zIndex: 10 }}>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="btn-primary"
                            style={{
                                textDecoration: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '12px',
                                padding: '8px 16px',
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                            }}
                        >
                            <ArrowLeft size={14} />
                            Back
                        </button>
                    </div>
                )}

                {/* See Public View Button - Absolute positioned for admins */}
                {showOwnerControls && (
                    <div className="owner-controls-header" style={{ position: 'absolute', top: '24px', right: '40px', zIndex: 10 }}>
                        <a
                            href={`${window.location.origin}${window.location.pathname}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-primary"
                            style={{
                                textDecoration: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '12px',
                                padding: '8px 16px',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                            }}
                        >
                            <Eye size={14} />
                            See Public View
                        </a>
                    </div>
                )}

                {/* Profile Image */}
                <div style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    backgroundColor: 'var(--bg-secondary)',
                    marginBottom: '24px'
                }}>
                    {profileSettings.profile_image_url ? (
                        <img
                            src={profileSettings.profile_image_url}
                            alt="Profile"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                            <Sparkles size={32} opacity={0.3} />
                        </div>
                    )}
                </div>

                {/* Introduction Text */}
                {profileSettings.intro_text && (
                    <p style={{
                        maxWidth: '600px',
                        fontSize: '15px',
                        lineHeight: '1.6',
                        color: 'var(--text-secondary)',
                        margin: 0,
                        fontWeight: 400,
                        letterSpacing: '0.01em'
                    }}>
                        {profileSettings.intro_text}
                    </p>
                )}
            </div>

            <div className="portfolio-content">
                {/* Automated Text Ticker - Aligned with image grid width */}
                {portfolio.description && (
                    <div className="portfolio-ticker-section">
                        <div className="ticker-track">
                            {[...Array(16)].map((_, i) => (
                                <React.Fragment key={i}>
                                    <div className="ticker-item">{portfolio.description}</div>
                                    <div className="ticker-dot" />
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                )}

                {/* Fallback spacing if no description */}
                {!portfolio.description && <div style={{ height: '24px' }} />}



                <ImageGrid
                    images={images}
                    isOwner={showOwnerControls}
                    onEdit={handleEditImage}
                />

            </div>

            <footer style={{
                backgroundColor: 'var(--accent)',
                padding: '16px 0',
                textAlign: 'center',
                width: '100%',
                marginTop: '60px',
                opacity: 0.9 // Subtle softening to maintain premium feel
            }}>
                <p style={{
                    color: 'rgba(255, 255, 255, 0.95)',
                    fontSize: '12px',
                    margin: 0,
                    letterSpacing: '0.05em',
                    fontWeight: 400,
                    textTransform: 'uppercase'
                }}>
                    All rights reserved to Kashif
                </p>
            </footer>

            {/* Modal only renders if logic allows, plus selectedImage check */}
            {editModalOpen && selectedImage && showOwnerControls && (
                <ImageEditModal
                    isOpen={editModalOpen}
                    image={selectedImage}
                    onClose={() => setEditModalOpen(false)}
                    onSave={handleSaveImageSettings}
                    saving={savingPreview}
                />
            )}

            <ScrollToTop />
        </div>
    );
};

export default PortfolioView;
