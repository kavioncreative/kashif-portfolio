
import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Cropper from 'react-easy-crop';
import { X, Check, Loader2, ArrowLeft } from 'lucide-react';
import { getCroppedPreviewImage } from '../utils/getCroppedPreviewImage';
import { uploadPreviewImage } from '../utils/uploadPreviewImage';

const ImageEditModal = ({ isOpen, onClose, onBack, image, onSave, saving }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(image?.preview_settings?.zoom || 1);

    // Explicit user interaction state
    const [hasUserCropped, setHasUserCropped] = useState(false);

    // Track BOTH crop outputs
    const [completedCrop, setCompletedCrop] = useState(null);
    const [croppedPixels, setCroppedPixels] = useState(null);

    // Local loading state to ensure INSTANT feedback
    const [isProcessing, setIsProcessing] = useState(false);

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCompletedCrop(croppedArea);
        setCroppedPixels(croppedAreaPixels);
        setHasUserCropped(true);
    }, []);

    const onMediaLoaded = useCallback(((mediaSize) => {
        const { width, height } = mediaSize;
        if (image?.preview_settings?.crop) {
            const { crop: percentCrop } = image.preview_settings;
            const currentZoom = image?.preview_settings?.zoom || 1;
            const cropCenterX = percentCrop.x + percentCrop.width / 2;
            const cropCenterY = percentCrop.y + percentCrop.height / 2;
            const pixelX = ((50 - cropCenterX) / 100) * width * currentZoom;
            const pixelY = ((50 - cropCenterY) / 100) * height * currentZoom;
            setCrop({ x: pixelX, y: pixelY });
        }
    }), [image]);

    const handleSave = async () => {
        // 🚀 START LOADING IMMEDIATELY
        setIsProcessing(true);

        // Double check state
        if (!hasUserCropped) {
            setIsProcessing(false);
            return;
        }

        let croppedImageBlob = null;
        let previewImageUrl = null;

        try {
            // These heavy operations happen while UI shows "Saving preview..."
            croppedImageBlob = await getCroppedPreviewImage(image.url, croppedPixels);

            const portfolioId = image.portfolio_id;
            const imageId = image.id;

            if (!portfolioId || !imageId) throw new Error('Missing portfolioId or imageId');

            previewImageUrl = await uploadPreviewImage(croppedImageBlob, portfolioId, imageId);

            const settings = {
                crop: completedCrop,
                zoom,
                previewUrl: previewImageUrl
            };

            // Pass to parent for DB update
            await onSave(settings);

        } catch (error) {
            console.error('❌ Failed to generate/upload cropped image:', error);
            alert('Failed to upload preview image. Please try again.');
            setIsProcessing(false); // Enable button if failed
        }
    };

    // Combine local and parent loading states
    const isSaving = isProcessing || saving;

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return createPortal(
        <div
            onClick={() => !isSaving && console.log('🌚 BACKDROP CLICKED')}
            style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.95)',
                backdropFilter: 'blur(5px)',
                zIndex: 9999,
                pointerEvents: 'auto'
            }}
        >
            <div
                onClick={(e) => {
                    e.stopPropagation();
                    console.log('📦 MODAL CONTAINER CLICKED');
                }}
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: 'var(--bg-secondary)',
                    width: '90vw',
                    maxWidth: '600px',
                    borderRadius: '16px',
                    border: '1px solid var(--grid-line)',
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    zIndex: 10000,
                    pointerEvents: 'auto',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    boxSizing: 'border-box'
                }}
            >
                <div style={{
                    padding: '16px 24px',
                    borderBottom: '1px solid var(--grid-line)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    pointerEvents: 'auto'
                }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Adjust Image Preview</h3>
                    <button type="button" onClick={onClose} disabled={isSaving} style={{ color: '#9CA3AF', cursor: isSaving ? 'default' : 'pointer', pointerEvents: 'auto' }}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{
                    position: 'relative',
                    width: '100%',
                    height: '340px',
                    backgroundColor: '#000',
                    zIndex: 1
                }}>
                    <Cropper
                        image={image.url}
                        crop={crop}
                        zoom={zoom}
                        aspect={4 / 3}
                        onCropChange={!isSaving ? setCrop : () => { }}
                        onCropComplete={onCropComplete}
                        onZoomChange={!isSaving ? setZoom : () => { }}
                        onMediaLoaded={onMediaLoaded}
                        showGrid={false}
                        initialCroppedAreaPercentages={image?.preview_settings?.crop}
                    />
                </div>

                <div style={{ padding: '24px', position: 'relative', zIndex: 10001, pointerEvents: 'auto' }}>
                    <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span style={{ fontSize: '14px', color: '#9CA3AF' }}>Zoom</span>
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            onChange={(e) => setZoom(e.target.value)}
                            disabled={isSaving}
                            style={{ flex: 1, accentColor: 'var(--accent)', cursor: isSaving ? 'default' : 'pointer', pointerEvents: 'auto' }}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', position: 'relative', zIndex: 10002, pointerEvents: 'auto' }}>
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={onBack || onClose}
                            disabled={isSaving}
                            style={{ cursor: isSaving ? 'default' : 'pointer', pointerEvents: 'auto' }}
                        >
                            {onBack ? 'Back' : 'Cancel'}
                        </button>

                        <div style={{ position: 'relative', zIndex: 10003, pointerEvents: 'auto' }}>
                            <button
                                type="button"
                                className="btn-primary"
                                onClick={handleSave}
                                disabled={isSaving || !hasUserCropped}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    opacity: (!hasUserCropped || isSaving) ? 0.6 : 1,
                                    cursor: (!hasUserCropped || isSaving) ? 'not-allowed' : 'pointer',
                                    pointerEvents: 'auto',
                                    position: 'relative',
                                    zIndex: 10004,
                                    minWidth: '160px',
                                    justifyContent: 'center'
                                }}
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        <span>Saving preview...</span>
                                    </>
                                ) : (
                                    <>
                                        {hasUserCropped ? 'Set Preview' : 'Move image to set preview'}
                                        {hasUserCropped && <Check size={16} />}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ImageEditModal;
