import React from 'react';
import './Modal.css';

const Modal = ({ isOpen, onClose, children, size = 'normal' }) => {
    if (!isOpen) {
        return null;
    }

    // Stop propagation to prevent clicks inside the modal from closing it.
    const handleContentClick = (e) => e.stopPropagation();

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className={`modal-content-wrapper ${size}`} onClick={handleContentClick}>
                {children}
            </div>
        </div>
    );
};

export default Modal;
