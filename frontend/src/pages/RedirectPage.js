import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FiCompass } from 'react-icons/fi';
import './RedirectPage.css';
import { FiExternalLink } from "react-icons/fi";

const RedirectPage = () => {
    const [progress, setProgress] = useState(0);
    const location = useLocation();

    const queryParams = new URLSearchParams(location.search);
    const skill = queryParams.get('skill');
    const targetUrl = queryParams.get('targetUrl');

    useEffect(() => {
        // Animate progress bar over 1.5 seconds
        const interval = setInterval(() => {
            setProgress(prev => Math.min(prev + (100 / 75), 100));
        }, 20);

        const timer = setTimeout(() => {
            if (targetUrl) {
                // Use replace so the user's back button doesn't lead back here
                window.location.replace(targetUrl);
            }
        }, 1500);

        return () => {
            clearTimeout(timer);
            clearInterval(interval);
        };
    }, [targetUrl]);

    return (
        <div className="redirect-page-container">
            <div className="redirect-box">
                <FiExternalLink className="redirect-icon" />
                <h1 className="redirect-title">Finding the best resources...</h1>
                <p className="redirect-text">
                    Please wait while we navigate you to perplexity.ai for the most up-to-date resources for <strong>{skill || 'your selected skill'}</strong>.
                </p>
                <div className="redirect-progress-bar-container">
                    <div className="redirect-progress-bar" style={{ width: `${progress}%` }}></div>
                </div>
            </div>
            <footer className="redirect-footer">
                Loading...
            </footer>
        </div>
    );
};

export default RedirectPage;