import React, { useState, useRef, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import jsCookie from 'js-cookie';
import {
    FiFileText, FiAward, FiUser, FiCheckCircle, FiClipboard, FiBookOpen,
    FiStar, FiAlertTriangle, FiDownload, FiCalendar, FiClock, FiX,
    FiInfo, FiThumbsUp, FiTrendingUp, FiChevronsLeft, FiChevronsRight
} from 'react-icons/fi';
import Modal from '../UI/Modal/Modal';
import './AnalysisReportLinear.css';

const ScoreExplanationModal = ({ isOpen, onRequestClose, title, content }) => {
    if (!isOpen) return null;
    return (
        <Modal isOpen={isOpen} onClose={onRequestClose} size="large">
            <div className="modal-header"><h3>{title}</h3><button onClick={onRequestClose} className="modal-close-btn"><FiX /></button></div>
            <div className="modal-body"><ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown></div>
        </Modal>
    );
};

const ScoreCard = ({ score, title, onInfoClick }) => {
    const getScoreColor = (s) => s >= 85 ? '#28a745' : s >= 70 ? '#ffc107' : s >= 50 ? '#fd7e14' : '#dc3545';
    const color = getScoreColor(score);
    return (
        <div className="score-card">
            <div className="score-card-title">{title}</div>
            <div className="score-card-graph"><CircularProgressbar value={score} text={`${score}%`} strokeWidth={8} styles={buildStyles({ pathColor: color, textColor: color, trailColor: '#eef2f7' })} /></div>
            <button className="score-card-button" onClick={onInfoClick}><FiInfo size={12} /><span>Know Why</span></button>
        </div>
    );
};

const iconMap = {
    Scoring: <FiTrendingUp />, Overall_Assessment: <FiAward />, Education_Analysis: <FiBookOpen />, Skills_Analysis: <FiCheckCircle />,
    Experience_Analysis: <FiClipboard />, Professional_Profile_Analysis: <FiUser />, Key_Strengths: <FiStar />,
    Areas_for_Improvement: <FiAlertTriangle />, Improvement_Tips: <FiThumbsUp />,
};

const AnalysisSection = React.forwardRef(({ title, content, id, description, children }, ref) => {
    if (!content && !children) return null;

    const renderContent = (data) => {
        if (typeof data === 'string') {
            const cleaned = data.replace(/^-+\s*/, '');
            return <ReactMarkdown remarkPlugins={[remarkGfm]}>{cleaned}</ReactMarkdown>;
        }

        if (Array.isArray(data)) {
            return (
                <ul className="subsection-list">
                    {data.map((item, idx) => (
                        <li key={idx}>{renderContent(item)}</li>
                    ))}
                </ul>
            );
        }

        if (typeof data === 'object' && data !== null) {
            return (
                <ul className="subsection-list">
                    {Object.entries(data).map(([key, value]) => (
                        <li key={key}>
                            <strong>{key.replace(/_/g, ' ')}:</strong> {renderContent(value)}
                        </li>
                    ))}
                </ul>
            );
        }
        return null;
    };

    return (
        <div id={id} className="analysis-section-card" ref={ref}>
            <div className="section-title-container">
                <div className="section-icon">{iconMap[title] || <FiFileText />}</div>
                <div className="section-header-text">
                    <h3>{title.replace(/_/g, ' ')}</h3>
                    {description && <p className="section-description-text" style={{ color: '#4339cb', fontWeight: 300, fontSize: '0.9rem', margin: '4px 0 0 0' }}>{description}</p>}
                </div>
            </div>
            <div className="section-content">
                {children || renderContent(content)}
            </div>
        </div>
    );
});

const AnalysisReportLinear = ({ analysisData }) => {
    const reportContainerRef = useRef(null);
    const sectionRefs = useRef({});
    const [activeSection, setActiveSection] = useState('');
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [modalContent, setModalContent] = useState({ title: '', content: '' });
    const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);

    // Destructure Suitable_Job_Role out so it's not included in the '...sections' rest parameter
    const { Final_Scoring, Score_Explanation, Suitable_Job_Role, ...sections } = analysisData.analysis || {};
    const { ATS_Optimization_Score, Overall_Resume_Score } = Final_Scoring || {};
    const { ATS_Score_Explanation, Overall_Score_Explanation } = Score_Explanation || {};

    // Remove 'Suitable_Job_Role' from the order array
    const sectionOrder = useMemo(() => [
        'Scoring', 'Overall_Assessment', 'Education_Analysis', 'Skills_Analysis',
        'Experience_Analysis', 'Key_Strengths',
        'Areas_for_Improvement', 'Improvement_Tips'
    ], []);

    const sectionDescriptions = {
        Overall_Assessment: "A high-level summary of your resume's impact and first impression.",
        Education_Analysis: "Evaluation of your academic background and its presentation.",
        Skills_Analysis: "Breakdown of your technical and soft skills, highlighting gaps.",
        Experience_Analysis: "Assessment of your work history, impact, and role clarity.",
        Key_Strengths: "Your top standout qualities that make you hireable.",
        Areas_for_Improvement: "Specific weaknesses and errors that need fixing.",
        Improvement_Tips: "Actionable advice to boost your score and job chances."
    };

    useEffect(() => {
        const handleScroll = () => {
            const container = reportContainerRef.current;
            if (!container) return;

            const scrollPosition = container.scrollTop + container.offsetTop + 120;

            if (container.scrollHeight - container.scrollTop - container.clientHeight < 1) {
                setActiveSection(sectionOrder[sectionOrder.length - 1]);
                return;
            }

            let currentSection = sectionOrder[0];
            for (const sectionId of sectionOrder) {
                const element = sectionRefs.current[sectionId];
                if (element && element.offsetTop <= scrollPosition) {
                    currentSection = sectionId;
                } else {
                    break;
                }
            }
            setActiveSection(currentSection);
        };

        const container = reportContainerRef.current;
        container?.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();

        return () => container?.removeEventListener('scroll', handleScroll);
    }, [sectionOrder]);

    const handleNavClick = (id) => {
        const element = sectionRefs.current[id];
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const openModal = (title, content) => { setModalContent({ title, content }); setModalIsOpen(true); };

    const handleDownloadPdf = async () => {
        const doc = new jsPDF({ orientation: 'p', unit: 'px', format: 'a4' });
        const pageHeight = doc.internal.pageSize.getHeight();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 20;
        let y = margin;

        for (const sectionKey of sectionOrder) {
            const element = sectionRefs.current[sectionKey];
            if (!element) continue;

            const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff' });
            const imgData = canvas.toDataURL('image/png');
            const imgHeight = (canvas.height * (pageWidth - margin * 2)) / canvas.width;

            if (y + imgHeight > pageHeight - margin) {
                doc.addPage();
                y = margin;
            }

            doc.addImage(imgData, 'PNG', margin, y, pageWidth - (margin * 2), imgHeight);
            y += imgHeight + 10;
        }

        doc.save(`${analysisData.originalFilename.replace(/\.[^/.]+$/, "")}-analysis.pdf`);
    };

    const handleDownloadOriginalResume = async () => {
        try {
            const token = jsCookie.get('token');
            const response = await fetch(`http://localhost:5000/api/resumes/${analysisData._id}/download`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Network response was not ok.');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = analysisData.originalFilename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (error) {
            console.error('Download failed:', error);
            alert(`Could not download the resume: ${error.message}`);
        }
    };

    if (!Final_Scoring) {
        return <div className="analysis-placeholder">No analysis data to display.</div>;
    }

    return (
        <div className={`analysis-report-layout ${isSidebarMinimized ? 'sidebar-minimized' : ''}`}>
            <aside className="analysis-sidebar-sticky">
                <div className="sidebar-header">
                    <h3 className="sidebar-title">Report Sections</h3>
                    <button className="sidebar-toggle-btn" onClick={() => setIsSidebarMinimized(!isSidebarMinimized)}>
                        {isSidebarMinimized ? <FiChevronsRight /> : <FiChevronsLeft />}
                    </button>
                </div>
                <ul className="analysis-nav-list">
                    {sectionOrder.map((key) => (
                        <li key={key} className={`analysis-nav-item ${activeSection === key ? 'active' : ''}`} onClick={() => handleNavClick(key)} title={key.replace(/_/g, ' ')}>
                            <div className="nav-item-icon">{iconMap[key] || <FiFileText />}</div>
                            <span className="nav-item-text">{key.replace(/_/g, ' ')}</span>
                        </li>
                    ))}
                </ul>
            </aside>
            <main className="analysis-content-area" ref={reportContainerRef}>
                <div id="Scoring" ref={el => sectionRefs.current['Scoring'] = el} className="scoring-wrapper-card">
                    <header className="report-header-main">
                        <h1>AI Analysis Report</h1>
                        <div className="analysis-metadata-container">
                            <div className="metadata-item"><FiFileText className="metadata-icon dimmed" /><span>{analysisData.originalFilename}</span></div>
                            <div className="metadata-item"><FiCalendar className="metadata-icon dimmed" /><span>{new Date(analysisData.analysis.analyzedAt).toLocaleDateString()}</span></div>
                            <div className="metadata-item"><FiClock className="metadata-icon dimmed" /><span>{new Date(analysisData.analysis.analyzedAt).toLocaleTimeString()}</span></div>
                            <div className="metadata-actions">
                                <button onClick={handleDownloadOriginalResume} className="download-btn"><FiDownload /><span>Resume</span></button>
                                <button onClick={handleDownloadPdf} className="download-btn dimmed"><FiDownload /><span>Report (PDF)</span></button>
                            </div>
                        </div>
                    </header>
                    <div className="scores-container">
                        <ScoreCard score={Overall_Resume_Score || 0} title="Overall Score" onInfoClick={() => openModal('Overall Score Explanation', Overall_Score_Explanation)} />
                        <ScoreCard score={ATS_Optimization_Score || 0} title="ATS Optimization Score" onInfoClick={() => openModal('ATS Score Explanation', ATS_Score_Explanation)} />
                    </div>
                </div>
                <div className="analysis-sections-container">
                    {sectionOrder.slice(1).map((key) => {
                        const sectionContent = sections[key];
                        if (!sectionContent) return null;

                        return (
                            <AnalysisSection
                                key={key}
                                id={key}
                                title={key}
                                content={sectionContent}
                                description={sectionDescriptions[key]}
                                ref={el => sectionRefs.current[key] = el}
                            />
                        );
                    })}
                </div>
            </main>
            <ScoreExplanationModal isOpen={modalIsOpen} onRequestClose={() => setModalIsOpen(false)} title={modalContent.title} content={modalContent.content} />
        </div>
    );
};

export default AnalysisReportLinear;