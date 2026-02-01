import React, { useState, useCallback } from 'react';
import axios from 'axios';
import jsCookie from 'js-cookie';
import { useDropzone } from 'react-dropzone';
import { FiUploadCloud, FiFile, FiLoader, FiAlertCircle } from 'react-icons/fi';
import './ResumeUpload.css';

const ResumeUpload = ({ onUploadSuccess }) => {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [fileName, setFileName] = useState('');

    const onDrop = useCallback(async (acceptedFiles, fileRejections) => {
        // Handle rejected files (e.g., wrong type)
        if (fileRejections.length > 0) {
            setError('Invalid file type. Please upload a PDF or DOCX file.');
            return;
        }

        const file = acceptedFiles[0];
        if (!file) return;

        setFileName(file.name);
        setError('');
        setUploading(true);

        const formData = new FormData();
        formData.append('resume', file);

        try {
            const token = jsCookie.get('token');
            const res = await axios.post('http://localhost:5000/api/resumes/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (onUploadSuccess) {
                onUploadSuccess(res.data.data);
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'An error occurred during upload.';
            setError(errorMessage);
        } finally {
            setUploading(false);
            setFileName('');
        }
    }, [onUploadSuccess]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        },
        multiple: false,
        disabled: uploading,
    });

    return (
        <div className="resume-upload-container">
            <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
                <input {...getInputProps()} />
                <div className="upload-content">
                    {uploading ? (
                        <>
                            <FiLoader className="upload-icon spinner" />
                            <span className="upload-text">Uploading {fileName}...</span>
                        </>
                    ) : (
                        <>
                            <FiUploadCloud className="upload-icon" />
                            <span className="upload-text">Upload Resume</span>
                            <p className="upload-subtitle">Drag & drop or click</p>
                        </>
                    )}
                </div>
            </div>
            {error && <p className="upload-error"><FiAlertCircle size={14} /> {error}</p>}
        </div>
    );
};

export default ResumeUpload;
