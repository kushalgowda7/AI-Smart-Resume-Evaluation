import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import jsCookie from 'js-cookie';
import { FiFileText, FiInbox, FiTrash2, FiLoader, FiAlertCircle, FiClock, FiMessageSquare, FiStar } from 'react-icons/fi';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

import ResumeUpload from '../components/Dashboard/ResumeUpload';
import AnalysisReportLinear from '../components/Dashboard/AnalysisReportLinear';
import SuitableJobRoleReport from '../components/Dashboard/SuitableJobRoleReport';
import JDMatchPage from './JDMatchPage';
import Modal from '../components/UI/Modal/Modal';
import FeatureTabs from '../components/Dashboard/FeatureTabs';
import Toast from '../components/UI/Toast/Toast';
import './JobSeekerDashboardV2.css';

const JobSeekerDashboard = ({ isSidebarOpen }) => {
    const [history, setHistory] = useState([]);
    const [selectedResume, setSelectedResume] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [analyzing, setAnalyzing] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [resumeToDelete, setResumeToDelete] = useState(null);
    const [activeFeature, setActiveFeature] = useState('ai-analysis');
    const [toast, setToast] = useState({ message: '', type: '', isVisible: false });
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteProgress, setDeleteProgress] = useState(0);
    const [retryCountdown, setRetryCountdown] = useState(0);

    const apiBaseUrl = 'http://localhost:5000/api';

    const showToast = (message, type = 'error') => {
        setToast({ message, type, isVisible: true });
        setTimeout(() => {
            setToast(prev => ({ ...prev, isVisible: false }));
        }, 3000);
    };

    const fetchHistory = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = jsCookie.get('token');
            const res = await axios.get(`${apiBaseUrl}/resumes/history`, { headers: { 'Authorization': `Bearer ${token}` } });
            setHistory(res.data.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
            setError('');
        } catch (err) {
            setError('Could not fetch data from the server.');
        } finally {
            setIsLoading(false);
        }
    }, []);


    useEffect(() => {
        let timer;
        if (retryCountdown > 0) {
            timer = setInterval(() => {
                setRetryCountdown(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [retryCountdown]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const handleSelectResume = async (resumeId) => {
        setActiveFeature('ai-analysis');

        if (selectedResume?._id === resumeId && selectedResume.analysis?.Final_Scoring) return;

        setError('');
        setIsLoading(true);
        try {
            const token = jsCookie.get('token');
            const res = await axios.get(`${apiBaseUrl}/resumes/${resumeId}`, { headers: { 'Authorization': `Bearer ${token}` } });
            setSelectedResume(res.data.data);
            setHistory(prev => prev.map(h => h._id === resumeId ? res.data.data : h));
        } catch (err) {
            setError('Could not fetch resume details.');
            setSelectedResume(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUploadSuccess = (newResumeData) => {
        fetchHistory().then(() => {
            if (newResumeData && newResumeData._id) {
                handleSelectResume(newResumeData._id);
            }
        });
    };

    const handleAnalyze = async () => {
        if (!selectedResume) return;
        setAnalyzing(true);
        setError('');
        try {
            const token = jsCookie.get('token');
            const res = await axios.post(`${apiBaseUrl}/resumes/${selectedResume._id}/analyze`, {}, { headers: { 'Authorization': `Bearer ${token}` } });
            const updatedResume = { ...selectedResume, analysis: res.data.data };
            setSelectedResume(updatedResume);
            setHistory(prev => prev.map(h => h._id === selectedResume._id ? updatedResume : h));
        } catch (err) {
            if (err.response?.status === 503) {
                setRetryCountdown(60); // Start 60s countdown
                setError(err.response?.data?.message || 'System busy. Please wait.');
            } else {
                setError(err.response?.data?.message || 'An error occurred during analysis.');
            }
        } finally {
            setAnalyzing(false);
        }
    };

    const handleDeleteClick = (e, resume) => {
        e.stopPropagation();
        setResumeToDelete(resume);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!resumeToDelete) return;

        setShowDeleteConfirm(false); // Close confirm modal
        setIsDeleting(true); // Open progress modal
        setDeleteProgress(0);

        // Simulate progress
        const progressInterval = setInterval(() => {
            setDeleteProgress(prev => {
                if (prev >= 90) return prev;
                return prev + 10;
            });
        }, 200);

        try {
            const token = jsCookie.get('token');
            await axios.delete(`${apiBaseUrl}/resumes/${resumeToDelete._id}`, { headers: { 'Authorization': `Bearer ${token}` } });

            clearInterval(progressInterval);
            setDeleteProgress(100);

            // Wait a bit to show 100%
            setTimeout(() => {
                setHistory(prev => prev.filter(h => h._id !== resumeToDelete._id));
                if (selectedResume && selectedResume._id === resumeToDelete._id) {
                    setSelectedResume(null);
                }
                setIsDeleting(false);
                setResumeToDelete(null);
                showToast('Resume deleted successfully.', 'success');
            }, 500);

        } catch (err) {
            clearInterval(progressInterval);
            setIsDeleting(false);
            showToast('Could not delete the resume.', 'error');
        }
    };

    const renderHistoryItem = (item) => {
        const atsScore = item.analysis?.Final_Scoring?.ATS_Optimization_Score;
        const scoreExists = atsScore !== undefined && atsScore !== null;
        const color = scoreExists && atsScore >= 85 ? '#28a745' : scoreExists && atsScore >= 60 ? '#ffc107' : '#dc3545';

        return (
            <li
                key={item._id}
                className={`history-item ${selectedResume?._id === item._id ? 'selected' : ''}`}
                onClick={() => handleSelectResume(item._id)}
            >
                <div className="history-item-main">
                    <FiFileText className="history-item-icon" />
                    <div className="history-item-details">
                        <span className="history-item-filename">{item.originalFilename}</span>
                        <div className="history-item-meta">
                            <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                            <span className="time-meta"><FiClock size={11} /> {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>
                </div>
                <div className="history-item-side">
                    {scoreExists && (
                        <div className="history-item-score-graph">
                            <CircularProgressbar
                                value={atsScore}
                                text={`${atsScore}`}
                                strokeWidth={14}
                                styles={buildStyles({
                                    pathColor: color,
                                    textColor: '#343a40',
                                    trailColor: '#e9ecef',
                                    textSize: '32px',
                                })}
                            />
                        </div>
                    )}
                    <button className="history-action-btn" onClick={(e) => handleDeleteClick(e, item)} title="Delete">
                        <FiTrash2 size={14} />
                    </button>
                </div>
            </li>
        );
    };

    const renderFeatureContent = () => {
        if (!selectedResume) {
            return (
                <div className="main-content-placeholder">
                    <FiInbox size={48} />
                    <h2>Select a resume to get started</h2>
                    <p>Your analysis reports and other features will appear here once you upload or select a resume from the history panel.</p>
                </div>
            );
        }

        const hasAnalysis = selectedResume.analysis && selectedResume.analysis.Final_Scoring;

        switch (activeFeature) {
            case 'ai-analysis':
                if (hasAnalysis) {
                    return <AnalysisReportLinear analysisData={selectedResume} />;
                }
                return (
                    <div className="main-content-placeholder">
                        <FiFileText size={48} />
                        <h2>Ready to Analyze</h2>
                        <p>Your resume "{selectedResume.originalFilename}" is ready for its AI-powered analysis.</p>
                        <button onClick={handleAnalyze} disabled={analyzing || retryCountdown > 0} className="analyze-button-v2">
                            {analyzing ? <><FiLoader className="spinner" /> Analyzing...</> : retryCountdown > 0 ? `Retry in ${retryCountdown}s` : 'Start Analysis'}
                        </button>
                        {error && <p className="error-message" style={{ marginTop: '1rem' }}><FiAlertCircle /> {error}</p>}
                    </div>
                );
            case 'suitable-job-role':
                if (hasAnalysis) {
                    return <SuitableJobRoleReport jobRolesData={selectedResume.analysis.Suitable_Job_Role} />;
                }
                return (
                    <div className="main-content-placeholder">
                        <FiStar size={48} />
                        <h2>Analysis Required</h2>
                        <p>Please run the AI Analysis first to see suitable job roles.</p>
                    </div>
                );
            case 'jd-match':
                return <JDMatchPage resume={selectedResume} />;

            case 'mock-interview':
                return (
                    <div className="main-content-placeholder">
                        <FiMessageSquare size={48} />
                        <h2>Mock Interview</h2>
                        <p>This feature is coming soon! Practice your interview skills with an AI.</p>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className={`dashboard-v2-container ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
            <aside className="sidebar-panel">
                <div className="upload-section-wrapper">
                    <ResumeUpload onUploadSuccess={handleUploadSuccess} />
                </div>
                <h2 className="history-header">History</h2>
                {isLoading && history.length === 0 ? (
                    <div className="history-list"><FiLoader className="spinner" /></div>
                ) : history.length > 0 ? (
                    <ul className="history-list">{history.map(renderHistoryItem)}</ul>
                ) : (
                    <div className="no-history-placeholder">
                        <FiInbox size={32} />
                        <p>No resumes uploaded yet.</p>
                    </div>
                )}
            </aside>
            <main className="main-content-area-wrapper">
                <FeatureTabs
                    activeFeature={activeFeature}
                    setActiveFeature={setActiveFeature}
                    disabled={!selectedResume}
                    onShowError={(msg) => showToast(msg, 'error')}
                />
                <div className="feature-content-wrapper">
                    {isLoading && selectedResume ? <div className="main-content-placeholder"><FiLoader className="spinner" size={48} /></div> : renderFeatureContent()}
                </div>
            </main>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)}>
                <h3>Confirm Deletion</h3>
                <p>Are you sure you want to delete "{resumeToDelete?.originalFilename}"? This action cannot be undone.</p>
                <div className="modal-actions">
                    <button className="btn btn-cancel" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                    <button className="btn btn-confirm-delete" onClick={confirmDelete}>Delete</button>
                </div>
            </Modal>

            {/* Deletion Progress Modal */}
            <Modal isOpen={isDeleting} onClose={() => { }} size="small">
                <div style={{ padding: '1rem', textAlign: 'center' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Deleting...</h3>
                    <p style={{ marginBottom: '1.5rem', color: '#666' }}>Removing resume and associated data.</p>
                    <div style={{
                        width: '100%',
                        height: '10px',
                        backgroundColor: '#e9ecef',
                        borderRadius: '5px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            width: `${deleteProgress}%`,
                            height: '100%',
                            backgroundColor: '#ef4444',
                            transition: 'width 0.2s ease-in-out'
                        }}></div>
                    </div>
                    <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#888' }}>{deleteProgress}%</p>
                </div>
            </Modal>

            {toast.isVisible && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
                />
            )}
        </div>
    );
};

export default JobSeekerDashboard;