import React from 'react';
import ReactMarkdown from 'react-markdown';
import { FiStar, FiTrendingUp } from 'react-icons/fi';
import './SuitableJobRoleReport.css';

// A sub-component for individual role cards to keep the code clean
const JobRoleCard = ({ role, index }) => {
    const getBarColor = (p) => {
        if (p >= 85) return '#22c55e'; // Green 500
        if (p >= 70) return '#f59e0b'; // Amber 500
        return '#ef4444'; // Red 500
    };
    const color = getBarColor(role.match_percentage);

    return (
        <div className="job-role-card" style={{ '--animation-delay': `${index * 100}ms` }}>
            <div className="card-header">
                <div className="card-title-group">
                    <FiStar className="card-icon" style={{ color }} />
                    <h4 className="card-title">{role.role_name}</h4>
                </div>
                <div className="card-match-score" style={{ color, borderColor: color }}>
                    {role.match_percentage}% Match
                </div>
            </div>
            <div className="card-body">
                <div className="card-reason">
                    <ReactMarkdown>{role.reason}</ReactMarkdown>
                </div>
            </div>
            <div className="card-progress-bar-container">
                <div
                    className="card-progress-bar"
                    style={{ width: `${role.match_percentage}%`, backgroundColor: color }}
                ></div>
            </div>
        </div>
    );
};


const SuitableJobRoleReport = ({ jobRolesData }) => {
    if (!jobRolesData || jobRolesData.length === 0) {
        return (
            <div className="job-role-report-container scrollable">
                <div className="report-header-section">
                    <FiTrendingUp />
                    <h3>Suitable Job Roles</h3>
                </div>
                <p className="no-roles-found">No suitable job roles were identified in this resume. Try analyzing another resume or one with more details.</p>
            </div>
        );
    }

    return (
        <div className="job-role-report-container scrollable">
            <div className="report-header-section">
                <FiTrendingUp />
                <h3>Top Job Matches</h3>
            </div>
            <p className="report-description">
                Based on the skills and experience in your resume, here are some job roles you appear to be a good fit for..
            </p>
            <div className="roles-grid">
                {jobRolesData.map((role, index) => (
                    <JobRoleCard key={index} role={role} index={index} />
                ))}
            </div>
        </div>
    );
};

export default SuitableJobRoleReport;