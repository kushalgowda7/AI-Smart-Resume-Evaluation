import React from 'react';
import { FiAlertCircle, FiCheckCircle, FiX } from 'react-icons/fi';
import './Toast.css';

const Toast = ({ message, type = 'error', onClose }) => {
    return (
        <div className={`toast-notification ${type}`}>
            <div className="toast-icon">
                {type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
            </div>
            <div className="toast-message">{message}</div>
            <button className="toast-close" onClick={onClose}>
                <FiX />
            </button>
        </div>
    );
};

export default Toast;
