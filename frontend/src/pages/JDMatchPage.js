import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import jsCookie from 'js-cookie';
import { FiTarget } from 'react-icons/fi';
import JobDescriptionInput from '../components/Dashboard/JobDescriptionInput';
import JDAnalysisReport from '../components/Dashboard/JDAnalysisReport';
import JDMatchHistoryPanel from '../components/Dashboard/JDMatchHistoryPanel';
import './JDMatchPage.css';

const JDMatchPage = ({ resume }) => {
    const [history, setHistory] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const [error, setError] = useState('');
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [activeTab, setActiveTab] = useState('paste');
    const [showInputArea, setShowInputArea] = useState(false);

    const apiBaseUrl = 'http://localhost:5000/api';

    const fetchHistory = useCallback(async (shouldSelectLatest = true) => {
        if (!resume?._id) return;
        setLoadingHistory(true);
        try {
            const token = jsCookie.get('token');
            const res = await axios.get(`${apiBaseUrl}/resumes/${resume._id}/jd-match`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const sortedHistory = res.data.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setHistory(sortedHistory);

            if (sortedHistory.length > 0 && shouldSelectLatest) {
                setSelectedReport(sortedHistory[0]);
                setShowInputArea(false);
            } else if (sortedHistory.length === 0) {
                setSelectedReport(null);
                setShowInputArea(true);
            }
        } catch (err) {
            setError('Could not fetch JD match history.');
        } finally {
            setLoadingHistory(false);
        }
    }, [resume?._id]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const handleSelectReport = (report) => {
        setSelectedReport(report);
        setShowInputArea(false);
    };

    const handleAnalysisComplete = (newReport) => {
        fetchHistory().then(() => {
            setSelectedReport(newReport);
            setShowInputArea(false);
        });
    };

    const handleDelete = async (historyId) => {
        try {
            const token = jsCookie.get('token');
            await axios.delete(`${apiBaseUrl}/jd-match/${historyId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            // If the deleted one was selected, select the latest one. Otherwise keep current selection.
            const shouldSelectLatest = selectedReport?._id === historyId;
            if (shouldSelectLatest) setSelectedReport(null);
            fetchHistory(shouldSelectLatest);
        } catch (err) {
            setError('Failed to delete history item.');
        }
    };

    return (
        <div className="jd-match-page-container">
            <div className="jd-main-content">
                <div className="report-header-section" style={{ padding: '1.5rem 2rem 0 2rem', alignItems: 'center' }}>
                    <FiTarget />
                    <h3 style={{ margin: 0 }}>Match Job Description</h3>
                </div>
                <p className="report-description" style={{ padding: '0 2rem', marginTop: '0.25rem', marginBottom: '0.5rem' }}>
                    An AI-powered analysis of your resume against the provided job description.
                </p>

                {showInputArea && (
                    <div className="jd-input-wrapper">
                        <JobDescriptionInput
                            resumeId={resume._id}
                            onAnalysisComplete={handleAnalysisComplete}
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                        />
                    </div>
                )}

                <div className="jd-report-wrapper">
                    <JDAnalysisReport
                        report={selectedReport}
                    />
                </div>
            </div>
            <JDMatchHistoryPanel
                history={history}
                onSelect={handleSelectReport}
                onDelete={handleDelete}
                selectedId={selectedReport?._id}
                onMatchNew={() => {
                    setShowInputArea(true);
                    setSelectedReport(null);
                }}
            />
        </div>
    );
};

export default JDMatchPage;