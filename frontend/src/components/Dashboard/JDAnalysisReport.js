import React, { useState } from 'react';
import { FiBarChart2, FiCheckCircle, FiEdit, FiInfo, FiSearch, FiTarget, FiXCircle, FiThumbsUp, FiEye, FiCopy, FiDownload, FiX } from 'react-icons/fi';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import Modal from '../UI/Modal/Modal';
import 'react-circular-progressbar/dist/styles.css';
import './JDAnalysisReport.css';

const JDModal = ({ isOpen, onClose, jdText }) => {
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(jdText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    };

    const handleDownload = () => {
        const element = document.createElement("a");
        const file = new Blob([jdText], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = "job-description.txt";
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="large">
            <div className="jd-modal-header">
                <h3>Job Description</h3>
                <div className="jd-modal-actions">
                    <button onClick={handleCopy}>
                        {copied ? 'Copied!' : <><FiCopy /> Copy</>}
                    </button>
                    <button onClick={handleDownload}><FiDownload /> Download .txt</button>
                    <button onClick={onClose} className="close-btn"><FiX /></button>
                </div>
            </div>
            <pre className="jd-modal-content">{jdText}</pre>
        </Modal>
    );
};


const JDAnalysisReport = ({ report }) => {
    const [isJdModalOpen, setIsJdModalOpen] = useState(false);

    if (!report) {
        return (
            <div className="jd-report-container">
                <div className="report-container-empty">Select a history item or match a new JD to see the report.</div>
            </div>
        );
    }

    const { analysisData, jdText } = report;

    const {
        matchScore = 0,
        overallFitAnalysis = '',
        strengths = [],
        gapsAndWeaknesses = [],
        matchedKeywords = [],
        missingKeywords = [],
        tailoringSuggestions = []
    } = analysisData;

    const getScoreColor = (score) => {
        if (score >= 85) return '#22c55e';
        if (score >= 60) return '#f59e0b';
        return '#ef4444';
    };
    const scoreColor = getScoreColor(matchScore);

    const handleResourceClick = (skill, url) => {
        const redirectUrl = `/redirect?skill=${encodeURIComponent(skill)}&targetUrl=${encodeURIComponent(url)}`;
        window.open(redirectUrl, '_blank', 'noopener,noreferrer');
    };

    const generatePerplexityResourceUrl = (skill) => {
        const jdSnippet = jdText ? jdText.replace(/\s+/g, ' ').trim() : '';
        const prompt = `You are a world-class career coach and learning strategist. A user is missing the skill '${skill}' for a job they want. 
        
In context of the Job Description : "${jdSnippet}".

Your task is to provide the absolute BEST, most up-to-date learning resources to master ${skill} specifically relevant to this job context.

Structure your response clearly with two sections: FREE and PAID.

In each section, recommend only 1-2 top-tier resources. For each resource, provide:
1. **Name:** The exact, full name of the course or video.
2. **Platform:** The platform it's on (e.g., Coursera, Udemy, YouTube).
3. **Description:** A concise, single sentence describing what a beginner will learn.
4. **Link:** The direct, clickable URL to the resource.

Prioritize resources that are current for 2025, highly-rated, and beginner-friendly. Present the final output as a clean, easy-to-read list.`;
        return `https://www.perplexity.ai/search?q=${encodeURIComponent(prompt)}`;
    };

    const generatePerplexityAboutUrl = (skill) => {
        const jdSnippet = jdText ? jdText.replace(/\s+/g, ' ').trim() : '';
        const prompt = `Explain what '${skill}' is in simple terms for a beginner, specifically in the context of this Job Description: "${jdSnippet}...". 
        
Describe what it is commonly used for in the tech industry and why a developer might need to know it for this role. Structure the answer with a clear, concise definition first, followed by a bulleted list of its main uses or benefits.`;
        return `https://www.perplexity.ai/search?q=${encodeURIComponent(prompt)}`;
    };

    return (
        <>
            <JDModal isOpen={isJdModalOpen} onClose={() => setIsJdModalOpen(false)} jdText={jdText} />
            <div className="jd-report-container">
                <div className="report-header-card">
                    <div className="report-header-main">
                        <div className="report-header-info">
                            <div className="match-score-wrapper">
                                <div className="score-card-inner">
                                    <span className="score-card-title">Matching Score</span>
                                    <div className="match-score-gauge">
                                        <CircularProgressbar
                                            value={matchScore}
                                            text={`${matchScore}%`}
                                            strokeWidth={9}
                                            styles={buildStyles({
                                                pathColor: scoreColor,
                                                textColor: '#111827',
                                                trailColor: '#e5e7eb',
                                                textSize: '22px'
                                            })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="report-header-cta" style={{ borderTop: 'none', marginTop: 0, paddingTop: 0 }}>
                            <button className="view-jd-btn" onClick={() => setIsJdModalOpen(true)}>
                                <FiEye /> View Job Description
                            </button>
                        </div>
                    </div>
                </div>

                <div className="report-grid single-column">
                    <div className="report-section">
                        <h3><FiBarChart2 className="icon-blue" /> Overall Fit Analysis</h3>
                        <p className="overall-fit-text">{overallFitAnalysis || 'Analysis not available.'}</p>
                    </div>

                    <div className="report-grid double-column">
                        <div className="report-section">
                            <h3><FiThumbsUp className="icon-green" /> Strengths</h3>
                            <ul>
                                {strengths.length > 0 ? strengths.map((item, index) => <li key={index}>{item}</li>) : <li className="empty-section-text">No specific strengths highlighted by the analysis.</li>}
                            </ul>
                        </div>

                        <div className="report-section">
                            <h3><FiXCircle className="icon-red" /> Gaps & Weaknesses</h3>
                            <ul>
                                {gapsAndWeaknesses.length > 0 ? gapsAndWeaknesses.map((item, index) => <li key={index}>{item}</li>) : <li className="empty-section-text">No specific gaps identified. Good job!</li>}
                            </ul>
                        </div>
                    </div>

                    <div className="report-section">
                        <h3><FiCheckCircle className="icon-green" /> Matched Skills</h3>
                        <div className="keywords-list">
                            {matchedKeywords.length > 0 ? matchedKeywords.map((keyword, index) => (
                                <span key={index} className="keyword-tag green">{keyword}</span>
                            )) : <p className="empty-section-text">No directly matching skills found.</p>}
                        </div>
                    </div>

                    <div className="report-section">
                        <h3><FiTarget className="icon-orange" /> Missing Skills</h3>
                        <div className="keywords-list">
                            {missingKeywords.length > 0 ? missingKeywords.map((keyword, index) => (
                                <span key={index} className="keyword-tag red">{keyword}</span>
                            )) : <p className="empty-section-text">No critical missing keywords found.</p>}
                        </div>
                    </div>

                    <div className="report-section full-width">
                        <h3><FiSearch className="icon-blue" /> Learning Resources for Missing Skills</h3>
                        <div className="missing-skills-grid">
                            {missingKeywords && missingKeywords.length > 0 ? missingKeywords.map((skill, index) => {
                                const resourceUrl = generatePerplexityResourceUrl(skill);
                                const aboutUrl = generatePerplexityAboutUrl(skill);
                                return (
                                    <div key={index} className="missing-skill-card">
                                        <div className="missing-skill-header">
                                            <FiTarget className="missing-skill-icon" />
                                            <span className="missing-skill-name">{skill}</span>
                                        </div>
                                        <div className="missing-skill-actions">
                                            <button className="resource-button secondary" onClick={() => handleResourceClick(skill, aboutUrl)}>
                                                <FiInfo />
                                                What It Is?
                                            </button>
                                            <button className="resource-button" onClick={() => handleResourceClick(skill, resourceUrl)}>
                                                <FiSearch />
                                                Find Resources
                                            </button>
                                        </div>
                                    </div>
                                );
                            }) : <p className="empty-section-text">No missing skills to show resources for.</p>}
                        </div>
                    </div>

                    <div className="report-section">
                        <h3><FiEdit className="icon-purple" /> Tailoring Suggestions</h3>
                        <ul>
                            {tailoringSuggestions.length > 0 ? tailoringSuggestions.map((item, index) => <li key={index}>{item}</li>) : <li className="empty-section-text">No specific tailoring suggestions provided.</li>}
                        </ul>
                    </div>
                </div>
            </div >
        </>
    );
};

export default JDAnalysisReport;