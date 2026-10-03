import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, List, LayoutGrid, Settings, Trash2, Loader2, LogOut, Sparkles } from 'lucide-react';
import UploadModal from '../components/UploadModal';
import PortfolioCard from '../components/PortfolioCard';
import ImageEditModal from '../components/ImageEditModal';
import MediaSelectorModal from '../components/MediaSelectorModal';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditPreviewOpen, setIsEditPreviewOpen] = useState(false);
    const [isMediaSelectorOpen, setIsMediaSelectorOpen] = useState(false);
    const [selectedPortfolio, setSelectedPortfolio] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [portfolios, setPortfolios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savingPreview, setSavingPreview] = useState(false);
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState(() => localStorage.getItem('adminViewMode') || 'list');

    const [profileImageUrl, setProfileImageUrl] = useState(null);
    const [initialIntroText, setInitialIntroText] = useState('');
    const [introText, setIntroText] = useState('');
    const [profileUpdating, setProfileUpdating] = useState(false);
    const [isBioSaving, setIsBioSaving] = useState(false);
    const [showSavedFeedback, setShowSavedFeedback] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [portfolioToDelete, setPortfolioToDelete] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [logoutLoading, setLogoutLoading] = useState(false);

    const isDirty = introText !== initialIntroText;

    useEffect(() => {
        const initDashboard = async () => {
            setLoading(true);
            try {
                await Promise.all([
                    fetchPortfolios(false),
                    fetchProfileSettings()
                ]);
            } catch (error) {
                console.error('Failed to initialize dashboard:', error);
            } finally {
                setTimeout(() => setLoading(false), 800);
            }
        };

        initDashboard();
    }, []);

    useEffect(() => {
        localStorage.setItem('adminViewMode', viewMode);
    }, [viewMode]);

    const fetchProfileSettings = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('site_settings')
                .select('profile_image_url, intro_text')
                .eq('owner_id', user.id)
                .single();

            if (data) {
                setProfileImageUrl(data.profile_image_url);
                setIntroText(data.intro_text || '');
                setInitialIntroText(data.intro_text || '');
            }
        } catch (error) {
            // Silent fail
        }
    };

    const handleProfileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setProfileUpdating(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const fileExt = file.name.split('.').pop();
            const filePath = `profile/${user.id}/avatar.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('site-assets')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('site-assets')
                .getPublicUrl(filePath);

            const finalUrl = `${publicUrl}?v=${Date.now()}`;

            const { error: dbError } = await supabase
                .from('site_settings')
                .upsert({
                    owner_id: user.id,
                    profile_image_url: finalUrl,
                    updated_at: new Date()
                }, { onConflict: 'owner_id' });

            if (dbError) throw dbError;

            setProfileImageUrl(finalUrl);
        } catch (error) {
            console.error('Error uploading profile image:', error);
            alert('Failed to update profile image.');
        } finally {
            setProfileUpdating(false);
        }
    };

    const handleSaveIntro = async () => {
        if (!isDirty || isBioSaving) return;
        setIsBioSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const { error } = await supabase
                .from('site_settings')
                .upsert({
                    owner_id: user.id,
                    intro_text: introText,
                    updated_at: new Date()
                }, { onConflict: 'owner_id' });

            if (error) throw error;

            setInitialIntroText(introText);
            setShowSavedFeedback(true);
            setTimeout(() => setShowSavedFeedback(false), 2000);
        } catch (error) {
            console.error('Error saving intro:', error);
            alert('Failed to save introduction.');
        } finally {
            setIsBioSaving(false);
        }
    };

    const handleEditPreview = (portfolio) => {
        setSelectedPortfolio(portfolio);
        setIsMediaSelectorOpen(true);
    };

    const handleMediaSelect = async (image) => {
        const updatedPortfolio = {
            ...selectedPortfolio,
            primaryImage: { ...image, is_preview: true },
            thumbnail: image.url,
            preview_image_url: image.preview_image_url
        };

        setSelectedPortfolio(updatedPortfolio);
        setPortfolios(prev => prev.map(p =>
            p.id === selectedPortfolio.id ? updatedPortfolio : p
        ));

        try {
            await supabase
                .from('portfolio_images')
                .update({ is_preview: false })
                .eq('portfolio_id', selectedPortfolio.id);

            await supabase
                .from('portfolio_images')
                .update({ is_preview: true })
                .eq('id', image.id);
        } catch (error) {
            console.error('Error selecting media:', error);
        }
    };

    const handleOpenImageEdit = (image) => {
        setSelectedImage(image);
        setIsMediaSelectorOpen(false);
        setIsEditPreviewOpen(true);
    };

    const handleBackToSelector = () => {
        setIsEditPreviewOpen(false);
        setIsMediaSelectorOpen(true);
    };

    const handleSavePreview = async (settings) => {
        const targetImage = selectedImage || selectedPortfolio?.primaryImage;
        if (!targetImage) return;
        setSavingPreview(true);

        try {
            const { previewUrl, ...previewSettings } = settings;
            const updatePayload = {
                preview_settings: previewSettings,
                preview_image_url: previewUrl
            };

            await supabase
                .from('portfolio_images')
                .update({ is_preview: false })
                .eq('portfolio_id', selectedPortfolio.id);

            const { error: updateError } = await supabase
                .from('portfolio_images')
                .update({ ...updatePayload, is_preview: true })
                .eq('id', targetImage.id);

            if (updateError) throw updateError;

            await fetchPortfolios(false);
            setIsEditPreviewOpen(false);
            setSelectedImage(null);
            setSelectedPortfolio(null);
        } catch (error) {
            console.error('Error saving preview settings:', error);
            alert('Failed to save preview settings');
        } finally {
            setSavingPreview(false);
        }
    };

    const handleLogout = async () => {
        setLogoutLoading(true);
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
            alert('Failed to log out.');
        } finally {
            setLogoutLoading(false);
        }
    };

    const fetchPortfolios = async (shouldUpdateLoading = true) => {
        if (shouldUpdateLoading) setLoading(true);
        try {
            const { data, error } = await supabase
                .from('portfolios')
                .select('*, portfolio_images(*)')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const portfoliosWithImages = (data || []).map(p => {
                let primaryImage = p.portfolio_images?.find(img => img.is_preview);
                if (!primaryImage && p.portfolio_images && p.portfolio_images.length > 0) {
                    primaryImage = p.portfolio_images[0];
                }
                return {
                    ...p,
                    primaryImage,
                    thumbnail: primaryImage ? primaryImage.url : null,
                    preview_image_url: primaryImage ? primaryImage.preview_image_url : null
                };
            });
            setPortfolios(portfoliosWithImages);
        } catch (error) {
            console.error('Error fetching portfolios:', error.message);
        } finally {
            if (shouldUpdateLoading) setLoading(false);
        }
    };

    const handlePortfolioPublished = () => {
        fetchPortfolios();
        setIsModalOpen(false);
    };

    const handleDeleteClick = (id) => {
        setPortfolioToDelete(id);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!portfolioToDelete) return;
        setDeleteLoading(true);
        try {
            const id = portfolioToDelete;
            const { data: images } = await supabase
                .from('portfolio_images')
                .select('url')
                .eq('portfolio_id', id);

            const filePaths = images.map(img => {
                const urlParts = img.url.split('/portfolio-images/');
                return urlParts[1];
            }).filter(path => path);

            if (filePaths.length > 0) {
                await supabase.storage
                    .from('portfolio-images')
                    .remove(filePaths);
            }

            await supabase
                .from('portfolios')
                .delete()
                .eq('id', id);

            fetchPortfolios();
            setShowDeleteConfirm(false);
            setPortfolioToDelete(null);
        } catch (error) {
            console.error('Error deleting portfolio:', error);
            alert('Failed to delete portfolio.');
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleEditPortfolio = (portfolio) => {
        setSelectedPortfolio(portfolio);
        setIsEditing(true);
        setIsModalOpen(true);
    };

    if (loading) {
        return (
            <div className="container fade-in" style={{ paddingTop: '60px', minHeight: '100vh' }}>
                {/* Skeleton Identity Suite */}
                <div className="content-auth-wrapper">
                    <div className="auth-block-card block-avatar">
                        <div className="block-avatar-circle skeleton-pulse" style={{ border: 'none' }} />
                        <div className="skeleton-pulse" style={{ height: '36px', width: '100%', borderRadius: '8px' }} />
                    </div>
                    <div className="auth-block-card block-bio">
                        <div style={{ flex: 1 }}>
                            <div className="skeleton-pulse" style={{ height: '14px', width: '120px', marginBottom: '20px', borderRadius: '4px' }} />
                            <div className="skeleton-pulse" style={{ height: '80px', width: '100%', borderRadius: '8px' }} />
                        </div>
                        <div className="block-card-footer" style={{ border: 'none' }}>
                            <div className="skeleton-pulse" style={{ height: '36px', width: '120px', borderRadius: '8px' }} />
                        </div>
                    </div>
                </div>

                {/* Skeleton Portfolios Section Header */}
                <div style={{ marginBottom: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="skeleton-pulse" style={{ height: '38px', width: '200px', borderRadius: '8px' }} />
                    <div className="skeleton-pulse" style={{ height: '42px', width: '160px', borderRadius: '8px' }} />
                </div>

                {/* Skeleton Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="skeleton-pulse" style={{ height: '300px', borderRadius: '16px' }} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="container fade-in" style={{ paddingTop: '60px', paddingBottom: '60px' }}>

            {/* Structured Dashboard Identity */}
            <div className="content-auth-wrapper">
                {/* Profile Picture Card */}
                <div className="auth-block-card block-avatar" title="Update your professional portrait">
                    <div className="block-avatar-circle">
                        {profileUpdating && (
                            <div style={{
                                position: 'absolute', inset: 0, zIndex: 20,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)'
                            }}>
                                <Loader2 className="animate-spin text-accent" size={28} />
                            </div>
                        )}
                        {profileImageUrl ? (
                            <img
                                src={profileImageUrl}
                                alt="Profile"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : (
                            <Sparkles size={32} color="var(--accent)" opacity={0.3} />
                        )}
                    </div>

                    <div style={{ position: 'relative', width: '100%' }}>
                        <button
                            className="btn-upload-avatar"
                            disabled={profileUpdating}
                            style={{ position: 'relative', zIndex: 5 }}
                        >
                            {profileUpdating ? 'Updating...' : 'Change Picture'}
                        </button>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleProfileUpload}
                            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 10 }}
                            disabled={profileUpdating}
                            title="Choose a new profile image"
                        />
                    </div>
                </div>

                {/* Identity Bio Card */}
                <div className="auth-block-card block-bio">
                    <div className="bio-content-inner">
                        <div style={{ marginBottom: '8px' }}>
                            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255, 255, 255, 0.4)', fontWeight: 700 }}>
                                Professional Identity
                            </span>
                        </div>
                        <textarea
                            value={introText}
                            onChange={(e) => {
                                setIntroText(e.target.value);
                                e.target.style.height = 'auto';
                                e.target.style.height = e.target.scrollHeight + 'px';
                            }}
                            className="bio-field-area"
                            placeholder="Write a brief intro..."
                            spellCheck="false"
                        />
                    </div>

                    <div className="block-card-footer">
                        <button
                            onClick={handleSaveIntro}
                            disabled={!isDirty || isBioSaving}
                            className={`btn-save-util ${isDirty ? 'active' : ''}`}
                        >
                            {isBioSaving ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Loader2 size={14} className="animate-spin" />
                                    <span>Saving...</span>
                                </div>
                            ) : (
                                showSavedFeedback ? 'Changes Saved ✓' : 'Save Changes'
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <header className="admin-header">
                <div className="admin-header-top">
                    <h1 className="admin-title">Portfolios</h1>
                    <button onClick={handleLogout} disabled={logoutLoading} className="logout-btn-mobile">
                        {logoutLoading ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} />}
                    </button>
                    <div className="view-toggle-wrapper">
                        <div className="view-toggle-pill">
                            <div className="view-toggle-thumb" style={{ transform: viewMode === 'list' ? 'translateX(0)' : 'translateX(100%)' }} />
                            <button onClick={() => setViewMode('list')} className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}>
                                <List size={14} strokeWidth={viewMode === 'list' ? 2.5 : 2} />
                                <span>List</span>
                            </button>
                            <button onClick={() => setViewMode('card')} className={`view-toggle-btn ${viewMode === 'card' ? 'active' : ''}`}>
                                <LayoutGrid size={14} strokeWidth={viewMode === 'card' ? 2.5 : 2} />
                                <span>Card</span>
                            </button>
                        </div>
                    </div>
                </div>
                <div className="admin-header-actions">
                    <button className="btn-primary upload-btn" onClick={() => setIsModalOpen(true)}>
                        <Plus size={18} />
                        Upload Portfolio
                    </button>
                    <button onClick={handleLogout} disabled={logoutLoading} className="logout-btn-desktop">
                        {logoutLoading ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
                        {logoutLoading ? 'Logging out...' : 'Log Out'}
                    </button>
                </div>
            </header>

            <style>{`
                .admin-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 48px; gap: 24px; }
                .admin-header-top { display: flex; align-items: center; gap: 24px; flex: 1; }
                .admin-title { font-size: 32px; font-weight: 600; color: var(--text-primary); margin: 0; }
                .view-toggle-pill { position: relative; display: flex; background-color: var(--bg-secondary); padding: 4px; border-radius: 8px; border: 1px solid var(--grid-line); width: 160px; height: 38px; }
                .view-toggle-thumb { position: absolute; top: 4px; bottom: 4px; left: 4px; width: calc(50% - 4px); background-color: var(--bg-elevated); border-radius: 6px; transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 2px 4px rgba(0,0,0,0.1); pointer-events: none; }
                .view-toggle-btn { flex: 1; position: relative; z-index: 1; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 13px; font-weight: 500; color: #9CA3AF; background: none; border: none; cursor: pointer; transition: color 0.2s; outline: none; }
                .view-toggle-btn.active { color: #ffffff; }
                .admin-header-actions { display: flex; align-items: center; gap: 16px; }
                .upload-btn { display: flex; align-items: center; gap: 8px; height: 42px; padding: 0 24px; white-space: nowrap; }
                .logout-btn-desktop { display: flex; align-items: center; gap: 8px; height: 42px; padding: 0 16px; background: transparent; border: 1px solid var(--grid-line); border-radius: 8px; color: #9CA3AF; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
                .logout-btn-desktop:hover:not(:disabled) { border-color: rgba(255, 255, 255, 0.3); background-color: rgba(255, 255, 255, 0.03); color: #ffffff; }
                .logout-btn-mobile { display: none; }
                @media (max-width: 768px) {
                    .admin-header { flex-direction: column; align-items: stretch; gap: 20px; margin-bottom: 32px; }
                    .admin-header-top { display: grid; grid-template-columns: 1fr auto; grid-template-rows: auto auto; gap: 16px; align-items: center; }
                    .admin-title { grid-column: 1; grid-row: 1; font-size: 28px; }
                    .logout-btn-mobile { grid-column: 2; grid-row: 1; display: flex; align-items: center; justify-content: center; width: 42px; height: 42px; background: var(--bg-secondary); border: 1px solid var(--grid-line); border-radius: 10px; color: #9CA3AF; cursor: pointer; }
                    .view-toggle-wrapper { grid-column: 1 / span 2; grid-row: 2; }
                    .view-toggle-pill { width: 100%; }
                    .admin-header-actions { width: 100%; }
                    .upload-btn { width: 100%; justify-content: center; font-size: 15px; }
                    .logout-btn-desktop { display: none; }
                }
            `}</style>

            <div style={{
                display: viewMode === 'card' ? 'grid' : 'flex',
                flexDirection: viewMode === 'card' ? undefined : 'column',
                gridTemplateColumns: viewMode === 'card' ? 'repeat(auto-fill, minmax(300px, 1fr))' : undefined,
                gap: '24px'
            }}>
                {portfolios.length === 0 ? (
                    <div style={{
                        gridColumn: '1 / -1', textAlign: 'center', padding: '60px',
                        border: '1px dashed var(--grid-line)', borderRadius: '12px',
                        color: 'var(--text-primary)', opacity: 0.5
                    }}>
                        No portfolios yet. Click "Upload Portfolio" to start.
                    </div>
                ) : (
                    portfolios.map(portfolio => (
                        <PortfolioCard
                            key={portfolio.id}
                            portfolio={{
                                ...portfolio,
                                onDelete: handleDeleteClick,
                                onEditPreview: handleEditPreview,
                                onEdit: handleEditPortfolio
                            }}
                            viewMode={viewMode}
                        />
                    ))
                )}
            </div>

            {isModalOpen && (
                <UploadModal
                    isOpen={isModalOpen}
                    portfolio={isEditing ? selectedPortfolio : null}
                    onClose={() => { setIsModalOpen(false); setIsEditing(false); setSelectedPortfolio(null); }}
                    onSuccess={() => { fetchPortfolios(); setIsModalOpen(false); setIsEditing(false); setSelectedPortfolio(null); }}
                />
            )}

            {showDeleteConfirm && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 2000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                }}>
                    <div style={{
                        backgroundColor: 'var(--bg-secondary)', width: '100%', maxWidth: '400px',
                        borderRadius: '16px', border: '1px solid var(--grid-line)', padding: '32px',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            width: '48px', height: '48px', backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 20px', color: '#EF4444'
                        }}>
                            <Trash2 size={24} />
                        </div>
                        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>Delete Portfolio?</h3>
                        <p style={{ color: '#9CA3AF', marginBottom: '32px', fontSize: '14px', lineHeight: '1.6' }}>
                            Are you sure you want to delete this portfolio? This action cannot be undone and all images will be lost.
                        </p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button className="btn-secondary" style={{ flex: 1 }} onClick={() => { setShowDeleteConfirm(false); setPortfolioToDelete(null); }}>
                                Cancel
                            </button>
                            <button className="btn-primary" style={{ flex: 1, backgroundColor: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={confirmDelete} disabled={deleteLoading}>
                                {deleteLoading ? <><Loader2 size={16} className="animate-spin" /> Deleting...</> : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isMediaSelectorOpen && (
                <MediaSelectorModal
                    isOpen={isMediaSelectorOpen}
                    portfolio={selectedPortfolio}
                    onClose={() => { setIsMediaSelectorOpen(false); setSelectedPortfolio(null); }}
                    onSelect={handleMediaSelect}
                    onAdjust={handleOpenImageEdit}
                    saving={savingPreview}
                />
            )}

            {isEditPreviewOpen && (selectedImage || selectedPortfolio?.primaryImage) && (
                <ImageEditModal
                    isOpen={isEditPreviewOpen}
                    image={selectedImage || selectedPortfolio.primaryImage}
                    onBack={handleBackToSelector}
                    onClose={() => { setIsEditPreviewOpen(false); setSelectedImage(null); }}
                    onSave={handleSavePreview}
                    saving={savingPreview}
                />
            )}
        </div>
    );
};

export default AdminDashboard;
