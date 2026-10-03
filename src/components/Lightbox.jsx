import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X, Hand, ArrowLeft } from 'lucide-react';
import { isVideo, isGif } from '../utils/mediaUtils';
import { getOptimizedImageUrl } from '../utils/imageUtils';

const Lightbox = ({ images, initialIndex, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [showGuide, setShowGuide] = useState(false);
    const touchStartX = useRef(null);
    const touchEndX = useRef(null);
    const isPinching = useRef(false);
    const [zoom, setZoom] = useState({ scale: 1, x: 0, y: 0 });

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') { dismissGuide(); showPrev(); }
            if (e.key === 'ArrowRight') { dismissGuide(); showNext(); }
        };
        window.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';

        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        const dismissed = localStorage.getItem('swipeGuideDismissed');

        if (isMobile && !dismissed && images.length > 1) {
            const timer = setTimeout(() => setShowGuide(true), 800);
            return () => {
                window.removeEventListener('keydown', handleKeyDown);
                document.body.style.overflow = 'auto';
                clearTimeout(timer);
            };
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'auto';
        };
    }, []);

    useEffect(() => {
        setZoom({ scale: 1, x: 0, y: 0 });

        // Predictive Preloading: Load next and previous images
        if (images.length > 1) {
            const nextIndex = (currentIndex + 1) % images.length;
            const prevIndex = (currentIndex - 1 + images.length) % images.length;

            [nextIndex, prevIndex].forEach(index => {
                const img = images[index];
                if (img && !isVideo(img.url) && !isGif(img.url)) {
                    const preloadImg = new Image();
                    preloadImg.src = getOptimizedImageUrl(img.url, { width: 2000, height: 2000, resize: 'contain' });
                }
            });
        }
    }, [currentIndex, images]);

    const showPrev = () => {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    };

    const showNext = () => {
        setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    };

    const dismissGuide = () => {
        if (showGuide) {
            setShowGuide(false);
            localStorage.setItem('swipeGuideDismissed', 'true');
        }
    };

    const handleTouchStart = (e) => {
        dismissGuide();
        if (e.touches.length > 1) {
            isPinching.current = true;
            return;
        }
        isPinching.current = false;
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e) => {
        if (isPinching.current || e.touches.length > 1) {
            isPinching.current = true;
            return;
        }
        touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
        if (isPinching.current) {
            isPinching.current = false;
            touchStartX.current = null;
            touchEndX.current = null;
            return;
        }

        if (!touchStartX.current || !touchEndX.current) return;
        const diff = touchStartX.current - touchEndX.current;
        const threshold = 50;

        if (diff > threshold) {
            showNext();
        } else if (diff < -threshold) {
            showPrev();
        }

        touchStartX.current = null;
        touchEndX.current = null;
    };

    const handleWheel = (e) => {
        if (window.matchMedia('(max-width: 768px)').matches) return;

        const zoomDelta = -e.deltaY;
        const zoomSpeed = 0.002;
        const newScale = Math.min(Math.max(zoom.scale * (1 + zoomDelta * zoomSpeed), 1), 8);

        if (newScale === zoom.scale) return;

        const mouseX = e.clientX - window.innerWidth / 2;
        const mouseY = e.clientY - window.innerHeight / 2;

        if (newScale <= 1.01) {
            setZoom({ scale: 1, x: 0, y: 0 });
        } else {
            setZoom(prev => ({
                scale: newScale,
                x: mouseX - (mouseX - prev.x) * (newScale / prev.scale),
                y: mouseY - (mouseY - prev.y) * (newScale / prev.scale)
            }));
        }
    };

    const currentImage = images[currentIndex];

    if (!currentImage) return null;

    return createPortal(
        <div
            className="lightbox-overlay"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
        >
            <button className="lightbox-close" onClick={onClose} aria-label="Close">
                <X size={28} />
            </button>

            <button className="lightbox-nav lightbox-prev" onClick={showPrev} aria-label="Previous">
                <ChevronLeft size={32} />
            </button>

            <div className="lightbox-content">
                {(isVideo(currentImage.url) || isGif(currentImage.url)) ? (
                    <video
                        src={currentImage.url}
                        className="lightbox-image"
                        autoPlay
                        loop
                        playsInline
                        muted
                        style={{
                            transform: `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.scale})`,
                            transition: zoom.scale > 1 ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            cursor: zoom.scale > 1 ? 'zoom-out' : 'zoom-in'
                        }}
                    />
                ) : (
                    <img
                        src={getOptimizedImageUrl(currentImage.url, { width: 2000, height: 2000, resize: 'contain' })}
                        alt={`${currentIndex + 1} / ${images.length}`}
                        className="lightbox-image"
                        style={{
                            transform: `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.scale})`,
                            transition: zoom.scale > 1 ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            cursor: zoom.scale > 1 ? 'zoom-out' : 'zoom-in'
                        }}
                    />
                )}
            </div>

            {showGuide && (
                <div className="mobile-swipe-guide">
                    <div className="swipe-direction-wrapper">
                        <ArrowLeft size={24} className="swipe-arrow-icon" />
                        <Hand size={40} className="swipe-hand-icon" />
                    </div>
                </div>
            )}

            <button className="lightbox-nav lightbox-next" onClick={showNext} aria-label="Next">
                <ChevronRight size={32} />
            </button>

            {/* Pagination Dots */}
            <div className="lightbox-pagination">
                {images.map((_, index) => (
                    <button
                        key={index}
                        className={`pagination-dot ${index === currentIndex ? 'active' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            dismissGuide();
                            setCurrentIndex(index);
                        }}
                        aria-label={`Go to image ${index + 1}`}
                    />
                ))}
            </div>

            <style>{`
                .lightbox-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background-color: rgba(0, 0, 0, 0.98);
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    backdrop-filter: blur(10px);
                    user-select: none;
                }

                .lightbox-content {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 80px 100px; /* Immersive safe area for desktop UI */
                    box-sizing: border-box;
                    pointer-events: none;
                    overflow: hidden;
                }

                .lightbox-image {
                    width: 100%;
                    height: 100%;
                    max-width: 100%;
                    max-height: 100%;
                    object-fit: contain;
                    display: block;
                    user-select: none;
                    pointer-events: auto;
                    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    filter: drop-shadow(0 20px 50px rgba(0,0,0,0.5));
                }

                .lightbox-close {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    color: white;
                    background: rgba(255, 255, 255, 0.1);
                    border: none;
                    border-radius: 50%;
                    width: 44px;
                    height: 44px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    z-index: 100;
                    transition: all 0.2s;
                    backdrop-filter: blur(5px);
                }

                .lightbox-close:hover {
                    background: rgba(255, 255, 255, 0.2);
                    transform: rotate(90deg);
                }

                .lightbox-nav {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    color: white;
                    background: rgba(255, 255, 255, 0.05);
                    border: none;
                    border-radius: 50%;
                    width: 56px;
                    height: 56px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    z-index: 100;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    opacity: 0.6;
                }

                .lightbox-nav:hover {
                    background: rgba(255, 255, 255, 0.15);
                    opacity: 1;
                    transform: translateY(-50%) scale(1.1);
                }

                .lightbox-prev { left: 30px; }
                .lightbox-next { right: 30px; }

                .lightbox-pagination {
                    position: absolute;
                    bottom: 40px;
                    left: 50%;
                    transform: translateX(-50%);
                    display: flex;
                    gap: 12px;
                    z-index: 100;
                    padding: 10px;
                }

                .pagination-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.25);
                    border: none;
                    padding: 0;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .pagination-dot.active {
                    background: var(--accent);
                    transform: scale(1.3);
                    box-shadow: 0 0 12px var(--accent);
                }

                @media (max-width: 768px) {
                    .lightbox-content {
                        padding: 60px 20px;
                    }

                    .lightbox-image {
                        border-radius: 0;
                    }

                    .lightbox-pagination {
                        bottom: 30px;
                        gap: 10px;
                    }

                    .pagination-dot {
                        width: 7px;
                        height: 7px;
                    }

                    .lightbox-nav {
                        /* Briefly hint at navigation then hide to keep UI clean */
                        display: flex;
                        opacity: 0;
                        animation: hint-nav 2.5s ease-out forwards;
                        pointer-events: none;
                        width: 44px;
                        height: 44px;
                    }

                    @keyframes hint-nav {
                        0% { opacity: 0; transform: translateY(-50%) scale(0.8); }
                        20% { opacity: 0.5; transform: translateY(-50%) scale(1); }
                        80% { opacity: 0.5; transform: translateY(-50%) scale(1); }
                        100% { opacity: 0; transform: translateY(-50%) scale(0.8); visibility: hidden; }
                    }

                    .lightbox-close {
                        top: 20px;
                        right: 20px;
                        background: rgba(0, 0, 0, 0.5);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                    }

                    .mobile-swipe-guide {
                        position: absolute;
                        bottom: 110px;
                        left: 50%;
                        transform: translateX(-50%);
                        z-index: 10000;
                        pointer-events: none;
                        opacity: 0;
                        animation: fade-in-guide 0.5s ease-out forwards;
                    }

                    .swipe-direction-wrapper {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        animation: swipe-hint-group 2s infinite ease-in-out;
                    }

                    .swipe-hand-icon, .swipe-arrow-icon {
                        color: var(--accent);
                        filter: drop-shadow(0 0 10px rgba(255, 122, 26, 0.4));
                    }

                    @keyframes fade-in-guide {
                        to { opacity: 1; }
                    }

                    @keyframes swipe-hint-group {
                        0% { transform: translateX(80px); opacity: 0; }
                        20% { opacity: 1; }
                        80% { transform: translateX(-80px); opacity: 1; }
                        100% { transform: translateX(-80px); opacity: 0; }
                    }
                }

                @media (max-width: 480px) {
                    .lightbox-pagination {
                        bottom: 25px;
                    }
                    
                    .lightbox-content {
                        padding: 50px 10px;
                    }

                    .mobile-swipe-guide {
                        bottom: 90px;
                    }
                }
            `}</style>
        </div>,
        document.body
    );
};

export default Lightbox;
