
import React from 'react';
import { X, Check, Image as ImageIcon, Film, Loader2, Edit2, Sparkles } from 'lucide-react';
import { isVideo, isGif } from '../utils/mediaUtils';

const MediaItem = ({ item, isSelected, onSelect }) => {
    const [isLoaded, setIsLoaded] = React.useState(false);
    const isV = isVideo(item.url);
    const isG = isGif(item.url);

    return (
        <div
            onClick={() => onSelect(item)}
            className={`media-item-card ${isSelected ? 'selected' : ''}`}
            style={{
                position: 'relative',
                aspectRatio: '1/1',
                borderRadius: '14px',
                overflow: 'hidden',
                cursor: 'pointer',
                border: isSelected ? '3px solid #FF7A1A' : '1px solid rgba(255, 255, 255, 0.1)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isSelected ? '0 0 25px rgba(255, 122, 26, 0.25)' : 'none',
                transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                backgroundColor: '#1a1a1a'
            }}
        >
            {/* Loader placeholder */}
            {!isLoaded && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    zIndex: 1
                }}>
                    <Loader2 size={24} color="rgba(255, 122, 26, 0.5)" className="animate-spin" />
                </div>
            )}

            {isV || isG ? (
                <video
                    src={item.url}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: isLoaded ? 1 : 0,
                        transition: 'opacity 0.3s ease'
                    }}
                    muted
                    playsInline
                    loop
                    autoPlay
                    onLoadedData={() => setIsLoaded(true)}
                />
            ) : (
                <img
                    src={item.url}
                    alt=""
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: isLoaded ? 1 : 0,
                        transition: 'opacity 0.3s ease'
                    }}
                    onLoad={() => setIsLoaded(true)}
                />
            )}

            {/* Type Badges */}
            <div style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                padding: '5px',
                borderRadius: '8px',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2,
                border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
                {isV ? <Film size={14} color="#FFF" /> : isG ? <Sparkles size={14} color="#FFF" /> : <ImageIcon size={14} color="#FFF" />}
            </div>

            {/* Selection State Overlay */}
            {isSelected && (
                <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    backgroundColor: '#FF7A1A',
                    borderRadius: '50%',
                    width: '26px',
                    height: '26px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2,
                    boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                    border: '2px solid rgba(255, 255, 255, 0.2)'
                }}>
                    <Check size={16} color="white" strokeWidth={4} />
                </div>
            )}

            {isSelected && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(255, 122, 26, 0.05)',
                    zIndex: 1
                }} />
            )}
        </div>
    );
};

const MediaSelectorModal = ({ isOpen, onClose, portfolio, onSelect, onAdjust, saving }) => {
    if (!isOpen || !portfolio) return null;

    const mediaItems = portfolio.portfolio_images || [];
    const currentPreviewId = portfolio.primaryImage?.id;
    const selectedItem = mediaItems.find(item => item.id === currentPreviewId);

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backdropFilter: 'blur(8px)'
        }}>
            <div style={{
                backgroundColor: '#111111',
                width: '100%',
                maxWidth: '900px',
                maxHeight: '90vh',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '24px 32px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                }}>
                    <div>
                        <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.02em' }}>Select Preview Media</h3>
                        <p style={{ fontSize: '14px', color: '#9CA3AF', marginTop: '6px', fontWeight: 400 }}>
                            Choose one image or video that best represents this portfolio.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            color: '#9CA3AF',
                            background: 'rgba(255,255,255,0.05)',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '12px',
                            transition: 'all 0.2s'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Media Grid Section */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '32px',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)'
                }}>
                    <div className="media-selector-grid">
                        {mediaItems.map((item) => (
                            <MediaItem
                                key={item.id}
                                item={item}
                                isSelected={item.id === currentPreviewId}
                                onSelect={onSelect}
                            />
                        ))}
                    </div>
                </div>

                {/* Footer / Action Area */}
                <div style={{
                    padding: '24px 32px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                    backgroundColor: '#111111'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '16px'
                    }}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            {selectedItem && (
                                <button
                                    onClick={() => onAdjust(selectedItem)}
                                    className="btn-secondary"
                                    style={{
                                        padding: '12px 24px',
                                        borderRadius: '12px',
                                        fontSize: '15px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        color: '#fff',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        fontWeight: 500
                                    }}
                                >
                                    <Edit2 size={18} />
                                    Adjust Crop
                                </button>
                            )}
                            <button
                                className="btn-primary"
                                onClick={onClose}
                                style={{
                                    padding: '12px 32px',
                                    borderRadius: '12px',
                                    fontSize: '15px',
                                    fontWeight: 600,
                                    backgroundColor: '#FF7A1A',
                                    color: '#fff',
                                    border: 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: '0 10px 20px -5px rgba(255, 122, 26, 0.3)'
                                }}
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .media-selector-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 24px;
                }
                
                @media (min-width: 640px) {
                    .media-selector-grid {
                        grid-template-columns: repeat(3, 1fr);
                    }
                }
                
                @media (min-width: 800px) {
                    .media-selector-grid {
                        grid-template-columns: repeat(4, 1fr);
                    }
                }

                .media-item-card:hover {
                    box-shadow: 0 12px 30px -10px rgba(0,0,0,0.5) !important;
                    border-color: rgba(255, 255, 255, 0.2) !important;
                }
                
                .media-item-card.selected:hover {
                    border-color: #FF7A1A !important;
                    box-shadow: 0 0 30px rgba(255, 122, 26, 0.35) !important;
                }

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

export default MediaSelectorModal;
