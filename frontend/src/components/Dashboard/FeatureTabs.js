import React from 'react';
import { FiBarChart2, FiBriefcase, FiStar } from 'react-icons/fi';
import './FeatureTabs.css';

const FeatureTabs = ({ activeFeature, setActiveFeature, disabled, onShowError }) => {
    const features = [
        { id: 'ai-analysis', label: 'AI Analysis', icon: <FiBarChart2 /> },
        { id: 'suitable-job-role', label: 'Suitable Job Roles', icon: <FiStar /> },
        { id: 'jd-match', label: 'JD Match', icon: <FiBriefcase /> },
    ];

    return (
        <div className="feature-tabs-container">
            {features.map(feature => (
                <button
                    key={feature.id}
                    className={`feature-tab-btn ${activeFeature === feature.id ? 'active' : ''} ${disabled ? 'disabled-look' : ''}`}
                    onClick={() => {
                        if (disabled) {
                            if (onShowError) onShowError("Please upload or select a resume from the left menu first.");
                            return;
                        }
                        setActiveFeature(feature.id);
                    }}
                    title={disabled ? 'Please upload or select a resume from the left menu first' : feature.label}
                >
                    {feature.icon}
                    <span>{feature.label}</span>
                </button>
            ))}
        </div>
    );
};

export default FeatureTabs;