import React, { useState } from 'react';
import axios from 'axios';
import jsCookie from 'js-cookie';
import './AuthModal.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

const AuthModal = ({ closeModal, isLogin, setIsLogin }) => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        otp: ''
    });
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            if (showOtpInput) {
                // Handle OTP Verification
                const res = await axios.post('http://localhost:5000/api/auth/verify-otp', {
                    email: formData.email,
                    otp: formData.otp
                });
                jsCookie.set('token', res.data.token, { expires: 30 });
                window.location.href = '/jobseeker/dashboard';
            } else {
                // Handle Login or Registration
                const url = isLogin ? 'http://localhost:5000/api/auth/login' : 'http://localhost:5000/api/auth/register';
                const payload = { ...formData, role: 'jobseeker' };
                const res = await axios.post(url, payload);

                if (isLogin) {
                    jsCookie.set('token', res.data.token, { expires: 30 });
                    window.location.href = '/jobseeker/dashboard';
                } else {
                    // On successful registration, show OTP input
                    setMessage(res.data.message);
                    setShowOtpInput(true);
                }
            }
        } catch (err) {
            // BUG FIX: Keep form visible on error and clear sensitive fields
            setError(err.response?.data?.message || 'An error occurred.');
            if (showOtpInput) {
                setFormData({ ...formData, otp: '' });
            } else {
                setFormData({ ...formData, password: '' });
            }
        } finally {
            setLoading(false);
        }
    };

    const title = isLogin ? 'Login' : 'Sign Up';

    const SignUpForm = (
        <>
            <input type="text" name="fullName" placeholder="Full Name" className="auth-input" onChange={handleChange} required />
            <input type="email" name="email" placeholder="Email" className="auth-input" onChange={handleChange} required />
            <input type="password" name="password" placeholder="Password" className="auth-input" onChange={handleChange} required />
        </>
    );

    const LoginForm = (
        <>
            <input type="email" name="email" placeholder="Email" className="auth-input" onChange={handleChange} required />
            <input type="password" name="password" placeholder="Password" className="auth-input" onChange={handleChange} required />
        </>
    );

    return (
        <div className="modal-backdrop" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="close-button" onClick={closeModal}>
                    <FontAwesomeIcon icon={faTimes} />
                </button>
                <div className="modal-header">
                    <h2 className="modal-title">{title}</h2>
                </div>
                <div className="modal-body">
                    <form className="auth-form" onSubmit={handleSubmit}>
                        {!showOtpInput && (isLogin ? LoginForm : SignUpForm)}
                        
                        {showOtpInput && (
                            <input 
                                type="text" 
                                name="otp" 
                                placeholder="Enter OTP" 
                                className="auth-input" 
                                onChange={handleChange} 
                                required 
                            />
                        )}

                        <button type="submit" className="auth-button" disabled={loading}>
                            {loading ? <div className="loader"></div> : (showOtpInput ? 'Verify OTP' : title)}
                        </button>
                        
                        {error && <p className="error-message">{error}</p>}
                        {message && !error && <p className="success-message">{message}</p>}
                    </form>
                </div>
                <div className="modal-footer">
                    <p>
                        {isLogin ? "Don't have an account?" : "Already have an account?"}
                        <button type="button" className="toggle-auth" onClick={() => { setIsLogin(!isLogin); setError(''); setMessage(''); setShowOtpInput(false); setFormData({}); }}>
                            {isLogin ? 'Sign Up' : 'Login'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AuthModal;