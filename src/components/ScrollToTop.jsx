
import React, { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

const ScrollToTop = () => {
    const [isVisible, setIsVisible] = useState(false);

    // Show button when page is scrolled down
    const toggleVisibility = () => {
        if (window.scrollY > 300) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    };

    // Set the top scroll position
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    useEffect(() => {
        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    return (
        <div className={`scroll-to-top ${isVisible ? 'visible' : ''}`}>
            <button
                type="button"
                onClick={scrollToTop}
                className="scroll-button"
                aria-label="Scroll to top"
            >
                <ChevronUp size={24} />
            </button>

            <style>{`
                .scroll-to-top {
                    position: fixed;
                    bottom: 40px;
                    right: 40px;
                    z-index: 1000;
                    opacity: 0;
                    visibility: hidden;
                    transform: translateY(20px);
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .scroll-to-top.visible {
                    opacity: 1;
                    visibility: visible;
                    transform: translateY(0);
                }

                .scroll-button {
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    background-color: var(--accent);
                    color: white;
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 15px rgba(255, 122, 26, 0.4);
                    transition: all 0.3s ease;
                }

                .scroll-button:hover {
                    background-color: #ff904d; /* Slightly lighter orange */
                    transform: scale(1.1);
                    box-shadow: 0 6px 20px rgba(255, 122, 26, 0.6);
                }

                .scroll-button:active {
                    transform: scale(0.95);
                }

                @media (max-width: 768px) {
                    .scroll-to-top {
                        bottom: 24px;
                        right: 24px;
                    }

                    .scroll-button {
                        width: 44px;
                        height: 44px;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                    }
                }
            `}</style>
        </div>
    );
};

export default ScrollToTop;
