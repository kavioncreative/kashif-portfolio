import React, { useState, useEffect, useRef } from 'react';
import Lightbox from './Lightbox';
import { Edit2, Maximize2 } from 'lucide-react';
import { isVideo, isGif } from '../utils/mediaUtils';
import { getOptimizedImageUrl } from '../utils/imageUtils';

const ImageGridItem = ({ img, index, isOwner, onEdit, openLightbox }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState(img.preview_image_url || img.url);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left + 10; // Compensate for -10px offset of the glow layer
    const y = e.clientY - rect.top + 10;
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  };

  // Reset loading state when the source image changes
  useEffect(() => {
    setImageSrc(img.preview_image_url || img.url);
    setIsLoaded(false);
  }, [img.preview_image_url, img.url]);

  // Safety fallback timer: prevent infinite loading skeleton if image takes too long or fails
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, [imageSrc]);

  const handleError = () => {
    if (imageSrc !== img.url && img.url) {
      setImageSrc(img.url);
    } else {
      setIsLoaded(true);
    }
  };

  return (
    <div
      className="gallery-item-container"
      onClick={() => openLightbox(index)}
      onMouseMove={handleMouseMove}
    >
      <div className="gallery-item-frame">
        {/* Professional Skeleton Loader */}
        {!isLoaded && (
          <div className="skeleton-placeholder">
            <div className="shimmer" />
          </div>
        )}

        {(isVideo(imageSrc) || isGif(imageSrc)) ? (
          <video
            src={imageSrc}
            onLoadedData={() => setIsLoaded(true)}
            onError={handleError}
            muted
            autoPlay
            loop
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              opacity: isLoaded ? 1 : 0,
              transition: 'opacity 0.3s ease-out'
            }}
          />
        ) : (
          <img
            src={getOptimizedImageUrl(imageSrc, { width: 1200, height: 900 })}
            alt="Portfolio"
            loading={index < 6 ? "eager" : "lazy"}
            fetchPriority={index < 4 ? "high" : "auto"}
            decoding="async"
            onLoad={() => setIsLoaded(true)}
            onError={handleError}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              opacity: isLoaded ? 1 : 0,
              transition: 'opacity 0.25s ease-out'
            }}
          />
        )}
      </div>

      {/* Hover overlay for Fullscreen view */}
      <div className="view-overlay">
        <Maximize2 size={32} className="overlay-icon" />
      </div>

      {/* Owner Edit Button */}
      {isOwner && (
        <button
          className="edit-btn"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(img);
          }}
        >
          <Edit2 size={16} />
          Edit Preview
        </button>
      )}
    </div>
  );
};

const ImageGrid = ({ images, isOwner, onEdit }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [initialLightboxIndex, setInitialLightboxIndex] = useState(0);

  const openLightbox = (index) => {
    setInitialLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <>
      <div className="gallery-grid">
        {images.map((img, index) => (
          <ImageGridItem
            key={img.id || index}
            img={img}
            index={index}
            isOwner={isOwner}
            onEdit={onEdit}
            openLightbox={openLightbox}
          />
        ))}
      </div>

      <style>{`
        .gallery-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 48px; /* Increased from 24px for better scan-ability */
          align-items: start;
          width: 100%;
          max-width: 1200px; /* Curated width for 3-column balance */
          margin: 0 auto;
        }

        @media (min-width: 640px) {
          .gallery-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .gallery-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .gallery-item-container {
            position: relative;
            background-color: var(--bg-tertiary);
            border-radius: 8px;
            /* Container must be visible for outer ring/glow */
            overflow: visible; 
            /* Container styling - Focus borders on outer ring only */
            border: none;
            width: 100%;
            height: auto;
            aspect-ratio: 4/3;
            cursor: pointer;
            /* Spotlight / Glow Border logic */
            --mouse-x: -500px;
            --mouse-y: -500px;
            transition: all 0.3s ease;
        }

        /* The "Outer Ring" Frame - Persistent in Idle State (Matches Ticker/Divider) */
        .gallery-item-container::before {
            content: "";
            position: absolute;
            inset: -10px;
            border-radius: 18px; /* Correctly parallel: 8px inner + 10px offset */
            /* Exact match to Ticker/Divider line styling but with boosted visibility */
            border: 1.5px solid rgba(255, 255, 255, 0.12); 
            opacity: 1;
            filter: none;
            box-shadow: none;
            pointer-events: none;
            transition: all 0.3s ease;
            z-index: 1;
        }

        /* The Localized Spotlight Glow Layer */
        .gallery-item-container::after {
            content: "";
            position: absolute;
            inset: -10px;
            border-radius: 18px; /* Correctly parallel: 8px inner + 10px offset */
            /* Sharpened localized radial gradient for precise proximity effect */
            background: radial-gradient(
                100px circle at var(--mouse-x) var(--mouse-y),
                var(--accent),
                transparent 60%
            );
            z-index: 2;
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
            
            /* Border-only masking logic */
            -webkit-mask-image: linear-gradient(black, black), linear-gradient(black, black);
            mask-image: linear-gradient(black, black), linear-gradient(black, black);
            -webkit-mask-clip: content-box, border-box;
            mask-clip: content-box, border-box;
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            padding: 1.5px; /* Match standard border weight */
            background-origin: border-box;
        }

        .gallery-item-container:hover {
            /* Container border stays invisible/consistent */
            border: none;
        }

        .gallery-item-container:hover::before {
            /* Base border stays theme-grey, never turns orange */
            border-color: var(--grid-line);
            opacity: 1;
        }

        .gallery-item-container:hover::after {
            opacity: 1; /* Spot-light becomes visible following the mouse */
        }

        .gallery-item-frame {
            width: 100%;
            height: 100%;
            overflow: hidden; /* Prevent image bleed */
            position: relative;
            border-radius: 8px; /* Maintain card rounding */
            z-index: 3;
        }

        .skeleton-placeholder {
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background-color: var(--bg-elevated);
            overflow: hidden;
            z-index: 1;
        }

        .shimmer {
            width: 100%;
            height: 100%;
            background: linear-gradient(
                90deg,
                transparent 0%,
                rgba(255, 255, 255, 0.03) 50%,
                transparent 100%
            );
            animation: shimmer-anim 1.5s infinite;
        }

        @keyframes shimmer-anim {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }

        .view-overlay {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.65);
          opacity: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 225ms ease-in-out;
          color: white;
          font-weight: 500;
          pointer-events: none;
          z-index: 10;
        }

        .overlay-icon {
          color: var(--accent);
          transition: transform 225ms ease-in-out, color 225ms ease-in-out, opacity 225ms ease-in-out;
          opacity: 0.8;
        }
        
        .gallery-item-container:hover .view-overlay {
            opacity: 1;
        }

        .gallery-item-container:hover .overlay-icon {
            transform: scale(1.1);
            color: #ffffff;
            opacity: 1;
            filter: drop-shadow(0 0 12px rgba(255, 255, 255, 0.2));
        }

        .edit-btn {
            position: absolute;
            top: 12px;
            right: 12px;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(4px);
            color: white;
            border: none;
            border-radius: 6px;
            padding: 8px 12px;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            opacity: 0;
            transform: translateY(-10px);
            transition: all 0.2s;
            z-index: 20;
        }

        .gallery-item-container:hover .edit-btn {
            opacity: 1;
            transform: translateY(0);
        }

        .edit-btn:hover {
            background: var(--accent);
        }
      `}</style>

      {lightboxOpen && (
        <Lightbox
          images={images}
          initialIndex={initialLightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
};

export default ImageGrid;
