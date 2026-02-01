import React, { useState } from 'react';
import axios from 'axios';
import jsCookie from 'js-cookie';
import { FiUpload, FiClipboard, FiLoader, FiAlertCircle, FiFileText } from 'react-icons/fi';
import './JobDescriptionInput.css';

const JobDescriptionInput = ({ resumeId, onAnalysisComplete, activeTab, setActiveTab }) => {
    const [jdText, setJdText] = useState('');
    const [jdFile, setJdFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        setJdFile(e.target.files[0]);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (activeTab === 'paste' && !jdText.trim()) {
            setError('Please paste a job description.');
            return;
        }
        if (activeTab === 'upload' && !jdFile) {
            setError('Please choose a file to upload.');
            return;
        }

        setIsLoading(true);
        setError('');

        const token = jsCookie.get('token');
        const url = `http://localhost:5000/api/resumes/${resumeId}/jd-match`;

        try {
            let response;
            if (activeTab === 'upload' && jdFile) {
                const formData = new FormData();
                formData.append('jdFile', jdFile);
                response = await axios.post(url, formData, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                });
            } else { // 'paste' tab
                response = await axios.post(url, { jdText }, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            }
            onAnalysisComplete(response.data.data);
            setJdText('');
            setJdFile(null);
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred during analysis.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="jd-input-container">
            <div className="jd-input-tabs">
                <button
                    className={`tab-btn ${activeTab === 'paste' ? 'active' : ''}`}
                    onClick={() => setActiveTab('paste')}
                >
                    <FiClipboard /> Paste Text
                </button>
                <button
                    className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
                    onClick={() => setActiveTab('upload')}
                >
                    <FiUpload /> Upload File
                </button>
            </div>

            <form onSubmit={handleSubmit} className="jd-input-form">
                {activeTab === 'paste' ? (
                    <textarea
                        placeholder="Paste the full job description here..."
                        value={jdText}
                        onChange={(e) => setJdText(e.target.value)}
                        className="jd-textarea"
                    />
                ) : (
                    <div className="jd-upload-area">
                        <input type="file" id="jdFile" onChange={handleFileChange} accept=".pdf,.docx,.txt" />
                        <label htmlFor="jdFile" className="jd-upload-label">
                            <FiFileText size={24} />
                            <span>{jdFile ? jdFile.name : 'Click to browse or drag & drop'}</span>
                            <small>PDF, DOCX, or TXT</small>
                        </label>
                    </div>
                )}

                <button type="submit" className="analyze-jd-btn" disabled={isLoading}>
                    {isLoading ? <FiLoader className="spinner" /> : 'Compare with Resume'}
                </button>

                {error && (
                    <div className="jd-error-message">
                        <FiAlertCircle /> {error}
                    </div>
                )}
            </form>
        </div>
    );
};

export default JobDescriptionInput;