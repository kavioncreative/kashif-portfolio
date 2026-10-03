
import React from 'react';
import { Eye, Copy, Check, Trash2, MoreVertical, Edit2, Image as ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getPortfolioUrl, copyPortfolioToClipboard } from '../utils/portfolioUtils';
import { getImagePreviewStyles } from '../utils/getImagePreviewStyles';
import { isVideo, isGif } from '../utils/mediaUtils';
import { getOptimizedImageUrl } from '../utils/imageUtils';

const PortfolioCard = ({ portfolio, viewMode = 'list' }) => {
    const [menuOpen, setMenuOpen] = React.useState(false);
    const [copied, setCopied] = React.useState(false);
    const menuRef = React.useRef(null);

    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const publicUrl = getPortfolioUrl(portfolio);
    const relativeUrl = `${new URL(publicUrl).pathname}?mode=admin`;

    const handleCopy = async () => {
        const success = await copyPortfolioToClipboard(portfolio);
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const isCardView = viewMode === 'card';

    return (
        <div
            className="portfolio-card"
            style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1.5px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px',
                padding: '24px',
                display: 'flex',
                flexDirection: isCardView ? 'column' : 'row',
                gap: '16px',
                alignItems: isCardView ? 'stretch' : 'center',
                transition: 'transform 0.2s, border-color 0.2s',
                position: 'relative'
            }}
        >
            {/* Thumbnail for Card View */}
            {isCardView && (
                <div style={{
                    width: '100%',
                    aspectRatio: '4/3',
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1.5px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    marginBottom: '16px',
                    position: 'relative',
                }}
                    className="thumbnail-container"
                >
                    {portfolio.thumbnail ? (
                        <>
                            {portfolio.preview_image_url ? (
                                isVideo(portfolio.preview_image_url || portfolio.thumbnail) || isGif(portfolio.preview_image_url || portfolio.thumbnail) ? (
                                    <video
                                        src={portfolio.preview_image_url || portfolio.thumbnail}
                                        muted
                                        autoPlay
                                        loop
                                        playsInline
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            display: 'block'
                                        }}
                                    />
                                ) : (
                                    <img
                                        key={portfolio.preview_image_url}
                                        src={getOptimizedImageUrl(portfolio.preview_image_url, { width: 600, height: 450 })}
                                        alt={portfolio.title}
                                        loading="lazy"
                                        decoding="async"
                                        className="fade-in"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            display: 'block'
                                        }}
                                    />
                                )
                            ) : (
                                isVideo(portfolio.thumbnail) || isGif(portfolio.thumbnail) ? (
                                    <video
                                        src={portfolio.thumbnail}
                                        muted
                                        autoPlay
                                        loop
                                        playsInline
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            display: 'block'
                                        }}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            ...getImagePreviewStyles({
                                                preview_settings: portfolio.primaryImage?.preview_settings,
                                                imageUrl: getOptimizedImageUrl(portfolio.thumbnail, { width: 600, height: 450 })
                                            })
                                        }}
                                    />
                                )
                            )}
                        </>
                    ) : (
                        <div style={{
                            width: '100%', height: '100%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#525252', fontSize: '14px'
                        }}>
                            No Image
                        </div>
                    )}

                    {/* Owner Edit Overlay (Now redundant with 3-dot edit, but keeping for visual parity) */}
                    {portfolio.onEditPreview && (
                        <div
                            className="edit-overlay"
                            style={{
                                position: 'absolute',
                                top: 0, left: 0, right: 0, bottom: 0,
                                height: '100%',
                                backgroundColor: 'rgba(0,0,0,0.4)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: 0,
                                transition: 'opacity 0.2s',
                                cursor: 'pointer'
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                portfolio.onEditPreview(portfolio);
                            }}
                        >
                            <button className="btn-secondary" style={{ pointerEvents: 'none' }}>
                                Edit Preview
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{
                    fontSize: isCardView ? '18px' : '16px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: '0',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }}>
                    {portfolio.title}
                </h3>
            </div>

            <style>{`
                .thumbnail-container:hover .edit-overlay {
                    opacity: 1 !important;
                }
                .menu-item:hover {
                    background-color: var(--bg-elevated) !important;
                    color: white !important;
                }
                .menu-item-destructive:hover {
                    background-color: rgba(239, 68, 68, 0.1) !important;
                    color: #EF4444 !important;
                }
            `}</style>

            <div style={{
                marginTop: isCardView ? 'auto' : '0',
                display: 'flex',
                gap: '12px',
                paddingTop: isCardView ? '16px' : '0',
                borderTop: isCardView ? '1px solid var(--grid-line)' : 'none',
                flexShrink: 0,
                alignItems: 'center'
            }}>
                <Link
                    to={relativeUrl}
                    className="btn-secondary"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        fontSize: '13px',
                        padding: '8px 16px',
                        whiteSpace: 'nowrap',
                        flex: isCardView ? 1 : undefined
                    }}
                >
                    <Eye size={16} />
                    {isCardView ? 'View' : 'View'}
                </Link>
                <button
                    onClick={handleCopy}
                    className="btn-secondary"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        fontSize: '13px',
                        padding: '8px 16px',
                        backgroundColor: copied ? 'rgba(74, 222, 128, 0.1)' : undefined,
                        color: copied ? '#4ade80' : undefined,
                        whiteSpace: 'nowrap',
                        flex: isCardView ? 1 : undefined
                    }}
                >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? 'Copied' : 'Link'}
                </button>

                {/* 3-Dot Action Menu */}
                <div style={{ position: 'relative' }} ref={menuRef}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpen(!menuOpen);
                        }}
                        style={{
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#9CA3AF',
                            borderRadius: '8px',
                            transition: 'color 0.2s, background-color 0.2s',
                            cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-elevated)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <MoreVertical size={20} />
                    </button>

                    {menuOpen && (
                        <div style={{
                            position: 'absolute',
                            bottom: '100%',
                            right: 0,
                            marginBottom: '8px',
                            width: '160px',
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid var(--grid-line)',
                            borderRadius: '12px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                            zIndex: 100,
                            padding: '6px',
                            overflow: 'hidden'
                        }}>
                            <button
                                className="menu-item"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setMenuOpen(false);
                                    if (portfolio.onEdit) portfolio.onEdit(portfolio);
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    color: '#9CA3AF',
                                    textAlign: 'left',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Edit2 size={16} />
                                Edit Portfolio
                            </button>
                            <button
                                className="menu-item"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setMenuOpen(false);
                                    if (portfolio.onEditPreview) portfolio.onEditPreview(portfolio);
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    color: '#9CA3AF',
                                    textAlign: 'left',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <ImageIcon size={16} />
                                Edit Preview
                            </button>
                            <button
                                className="menu-item-destructive"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setMenuOpen(false);
                                    if (portfolio.onDelete) portfolio.onDelete(portfolio.id);
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    color: '#EF4444',
                                    textAlign: 'left',
                                    transition: 'all 0.2s',
                                    marginTop: '2px'
                                }}
                            >
                                <Trash2 size={16} />
                                Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PortfolioCard;
