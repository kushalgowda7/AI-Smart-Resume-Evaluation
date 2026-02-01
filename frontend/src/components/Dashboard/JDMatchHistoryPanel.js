import React from 'react';
import { FiClock, FiTrash2, FiPlus } from 'react-icons/fi';
import './JDMatchHistoryPanel.css';

const JDMatchHistoryPanel = ({ history, onSelect, onDelete, selectedId, onMatchNew }) => {
    return (
        <aside className="jd-history-panel">
            <div className="jd-history-header">
                <button className="match-new-jd-btn-panel" onClick={onMatchNew}>
                    <FiPlus />
                    Match New JD
                </button>
                <div className="separator-line"></div>
                <h3 className="jd-history-title">Matching History</h3>
            </div>
            <div className="jd-history-list">
                {history.length === 0 ? (
                    <p className="jd-history-empty">No matching history for this resume yet.</p>
                ) : (
                    history.map(item => (
                        <div
                            key={item._id}
                            className={`jd-history-item ${selectedId === item._id ? 'selected' : ''}`}
                            onClick={() => onSelect(item)}
                        >
                            <div className="jd-history-item-info">
                                <span className="jd-history-item-score">{item.analysisData.matchScore}%</span>
                                <div className="jd-history-item-details">
                                    <span className="jd-history-item-title">Analysis</span>
                                    <span className="jd-history-item-date">
                                        <FiClock size={12} />
                                        {new Date(item.createdAt).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                            <button className="jd-history-delete-btn" onClick={(e) => { e.stopPropagation(); onDelete(item._id); }}>
                                <FiTrash2 />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </aside>
    );
};

export default JDMatchHistoryPanel;