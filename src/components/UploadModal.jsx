
import React, { useState, useRef } from 'react';
import { X, Upload, CheckCircle, Image as ImageIcon, Loader2, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { getPortfolioUrl, copyPortfolioToClipboard } from '../utils/portfolioUtils';
import { Copy, Check } from 'lucide-react'; // Import for consistent feedback

const UploadModal = ({ isOpen, onClose, onSuccess, portfolio = null }) => {
    const [step, setStep] = useState(portfolio ? 2 : 1); // 1: Select, 2: Preview/Details, 3: Success
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadedImages, setUploadedImages] = useState(
        portfolio ? (portfolio.portfolio_images || []).map(img => ({
            url: img.url,
            width: img.width,
            height: img.height,
            isExisting: true,
            preview_settings: img.preview_settings // Preserve existing crop/zoom settings
        })) : []
    );
    const [title, setTitle] = useState(portfolio?.title || '');
    const [description, setDescription] = useState(portfolio?.description || '');
    const [publishLoading, setPublishLoading] = useState(false);
    const [publishedId, setPublishedId] = useState(portfolio?.id || null);
    const [copied, setCopied] = useState(false);

    const fileInputRef = useRef(null);

    const handleRemoveImage = (indexToRemove) => {
        setUploadedImages(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    if (!isOpen) return null;

    const handleFileSelect = async (e) => {
        const selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length === 0) return;

        setFiles(selectedFiles);
        setUploading(true);

        // Upload files immediately
        const newUploadedImages = [...uploadedImages];

        try {
            for (const file of selectedFiles) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${uuidv4()}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('portfolio-images')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('portfolio-images')
                    .getPublicUrl(filePath);

                const dimensions = await getMediaDimensions(file);

                newUploadedImages.push({
                    url: publicUrl,
                    path: filePath,
                    width: dimensions.width,
                    height: dimensions.height,
                    originalName: file.name,
                    mediaType: file.type
                });
            }

            setUploadedImages(newUploadedImages);
            setStep(2); // Move to details step
        } catch (error) {
            console.error('Upload error:', error);
            alert('Error uploading media. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const getMediaDimensions = (file) => {
        return new Promise((resolve) => {
            if (file.type.startsWith('video/')) {
                const video = document.createElement('video');
                video.preload = 'metadata';
                video.onloadedmetadata = () => {
                    resolve({ width: video.videoWidth, height: video.videoHeight });
                    URL.revokeObjectURL(video.src);
                };
                video.onerror = () => {
                    resolve({ width: 0, height: 0 });
                };
                video.src = URL.createObjectURL(file);
            } else {
                const img = new Image();
                img.onload = () => {
                    resolve({ width: img.width, height: img.height });
                    URL.revokeObjectURL(img.src);
                };
                img.onerror = () => {
                    resolve({ width: 0, height: 0 });
                };
                img.src = URL.createObjectURL(file);
            }
        });
    };

    const handlePublish = async () => {
        if (!title) {
            alert('Please enter a portfolio title');
            return;
        }

        setPublishLoading(true);

        try {
            let currentPortfolioId = portfolio?.id;

            if (portfolio) {
                // Update Portfolio Record
                const { error: pfError } = await supabase
                    .from('portfolios')
                    .update({ title, description })
                    .eq('id', portfolio.id);

                if (pfError) throw pfError;

                // For existing portfolios, we might need to sync images.
                // Simple approach: Delete old image records and re-insert all currently in state.
                // This preserves sort_order.
                const { error: delError } = await supabase
                    .from('portfolio_images')
                    .delete()
                    .eq('portfolio_id', portfolio.id);

                if (delError) throw delError;
            } else {
                // Create Portfolio Record
                const { data: newPortfolio, error: pfError } = await supabase
                    .from('portfolios')
                    .insert([{ title, description }])
                    .select()
                    .single();

                if (pfError) throw pfError;
                currentPortfolioId = newPortfolio.id;
            }

            // Create Image Records (for both new and updated)
            const imageRecords = uploadedImages.map((img, index) => ({
                portfolio_id: currentPortfolioId,
                url: img.url,
                width: img.width,
                height: img.height,
                sort_order: index,
                preview_settings: img.preview_settings // Carry over settings
            }));

            const { error: imgError } = await supabase
                .from('portfolio_images')
                .insert(imageRecords);

            if (imgError) throw imgError;

            setPublishedId(currentPortfolioId);

            if (portfolio) {
                // For updates, close immediately as requested
                onSuccess();
            } else {
                setStep(3); // For new portfolios, show success screen
            }
        } catch (error) {
            console.error('Publish error:', error);
            alert('Error processing portfolio: ' + error.message);
        } finally {
            setPublishLoading(false);
        }
    };

    const handleClose = () => {
        if (step === 3) {
            onSuccess();
        } else {
            onClose();
        }
    };

    const handleAddMore = () => {
        if (fileInputRef.current) fileInputRef.current.click();
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.95)',
            backdropFilter: 'blur(5px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <div style={{
                backgroundColor: 'var(--bg-secondary)',
                width: '100%',
                maxWidth: '600px',
                maxHeight: '90vh',
                borderRadius: '16px',
                border: '1px solid var(--grid-line)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid var(--grid-line)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600 }}>
                        {step === 1 ? 'Upload Portfolio' : step === 2 ? (portfolio ? 'Edit Portfolio' : 'Portfolio Details') : 'Success!'}
                    </h2>
                    <button onClick={handleClose} style={{ color: '#9CA3AF' }}>
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '24px', overflowY: 'auto' }}>

                    {step === 1 && (
                        <div style={{ textAlign: 'center', padding: '40px 0' }}>
                            {uploading ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                                    <Loader2 className="animate-spin" size={48} color="var(--accent)" />
                                    <p>Uploading images...</p>
                                </div>
                            ) : (
                                <>
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/png, image/jpeg, image/jpg, image/svg+xml, image/webp, image/gif, video/mp4, video/webm"
                                        ref={fileInputRef}
                                        onChange={handleFileSelect}
                                        style={{ display: 'none' }}
                                    />
                                    <div
                                        onClick={() => fileInputRef.current.click()}
                                        style={{
                                            border: '2px dashed var(--grid-line)',
                                            borderRadius: '12px',
                                            padding: '40px',
                                            cursor: 'pointer',
                                            transition: 'border-color 0.2s',
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                                        onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--grid-line)'}
                                    >
                                        <Upload size={48} style={{ margin: '0 auto 16px', color: '#9CA3AF' }} />
                                        <p style={{ fontWeight: 500, marginBottom: '8px' }}>Click to upload files</p>
                                        <p style={{ fontSize: '12px', color: '#6B7280' }}>PNG, JPG, SVG, WEBP, GIF, MP4, WEBM</p>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {step === 2 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {/* Image Previews */}
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#9CA3AF' }}>
                                    Selected Images ({uploadedImages.length})
                                </label>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                                    gap: '12px'
                                }}>
                                    {uploadedImages.map((img, idx) => (
                                        <div key={idx} style={{
                                            aspectRatio: '1',
                                            backgroundColor: '#222',
                                            borderRadius: '8px',
                                            overflow: 'hidden',
                                            border: '1px solid var(--grid-line)',
                                            position: 'relative'
                                        }}>
                                            <button
                                                onClick={() => handleRemoveImage(idx)}
                                                style={{
                                                    position: 'absolute',
                                                    top: '4px',
                                                    right: '4px',
                                                    backgroundColor: 'rgba(0,0,0,0.6)',
                                                    borderRadius: '50%',
                                                    width: '22px',
                                                    height: '22px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'white',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    zIndex: 10,
                                                    backdropFilter: 'blur(2px)'
                                                }}
                                                title="Remove image"
                                            >
                                                <X size={14} />
                                            </button>
                                            {img.mediaType?.startsWith('video/') || img.url.toLowerCase().endsWith('.mp4') || img.url.toLowerCase().endsWith('.webm') ? (
                                                <video
                                                    src={img.url}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    muted
                                                    playsInline
                                                />
                                            ) : (
                                                <img
                                                    src={img.url}
                                                    alt="preview"
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        onClick={handleAddMore}
                                        disabled={uploading}
                                        style={{
                                            aspectRatio: '1',
                                            backgroundColor: 'var(--bg-tertiary)',
                                            borderRadius: '8px',
                                            border: '1px dashed var(--grid-line)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#9CA3AF',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                                        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--grid-line)'}
                                    >
                                        {uploading ? <Loader2 className="animate-spin" size={24} /> : <Plus size={24} />}
                                    </button>
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/png, image/jpeg, image/jpg, image/svg+xml, image/webp, image/gif, video/mp4, video/webm"
                                        ref={fileInputRef}
                                        onChange={handleFileSelect}
                                        style={{ display: 'none' }}
                                    />
                                </div>
                            </div>

                            {/* Inputs */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Portfolio Title <span style={{ color: 'var(--accent)' }}>*</span></label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Minimalist Brand Identity"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Project details..."
                                    rows={4}
                                    style={{ resize: 'vertical' }}
                                />
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <div style={{
                                width: '64px', height: '64px',
                                backgroundColor: 'rgba(74, 222, 128, 0.1)',
                                borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 24px',
                                color: '#4ade80'
                            }}>
                                <CheckCircle size={32} />
                            </div>
                            <h3 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>Portfolio Published!</h3>
                            <p style={{ color: '#9CA3AF', marginBottom: '32px' }}>Your portfolio is now live and can be shared.</p>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <a
                                    href={getPortfolioUrl({ id: publishedId, title })}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn-primary"
                                    style={{ flex: 1, textAlign: 'center', display: 'block', textDecoration: 'none', lineHeight: '24px' }}
                                >
                                    View Portfolio
                                </a>
                                <button
                                    className="btn-secondary"
                                    style={{
                                        flex: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        backgroundColor: copied ? 'rgba(74, 222, 128, 0.1)' : undefined,
                                        color: copied ? '#4ade80' : undefined,
                                        transition: 'all 0.2s'
                                    }}
                                    onClick={async () => {
                                        const success = await copyPortfolioToClipboard({ id: publishedId, title });
                                        if (success) {
                                            setCopied(true);
                                            setTimeout(() => setCopied(false), 2000);
                                        }
                                    }}
                                >
                                    {copied ? <Check size={18} /> : <Copy size={18} />}
                                    {copied ? 'Copied' : 'Copy Link'}
                                </button>
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer Actions */}
                {step === 2 && (
                    <div style={{
                        padding: '20px 24px',
                        borderTop: '1px solid var(--grid-line)',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '12px'
                    }}>
                        <button
                            className="btn-secondary"
                            onClick={onClose}
                            disabled={publishLoading}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn-primary"
                            onClick={handlePublish}
                            disabled={publishLoading || uploading}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            {publishLoading && <Loader2 className="animate-spin" size={16} />}
                            {portfolio ? 'Update Portfolio' : 'Publish Portfolio'}
                        </button>
                    </div>
                )}
            </div>
            <style>{`
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
};

export default UploadModal;
