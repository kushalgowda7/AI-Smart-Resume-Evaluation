import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignInAlt, faUserPlus, faBrain, faTachometerAlt, faFileAlt, faStar, faMessage, faLightbulb } from '@fortawesome/free-solid-svg-icons';
import AuthModal from '../components/Auth/AuthModal';
import './HomePage.css';

const HomePage = () => {
    const [showModal, setShowModal] = useState(false);
    const [isLogin, setIsLogin] = useState(true);
    const [userType, setUserType] = useState('jobseeker');

    const openModal = (type, login) => {
        setUserType(type);
        setIsLogin(login);
        setShowModal(true);
    };

    const closeModal = () => setShowModal(false);

    return (
        <div className="homepage">
            <section className="hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">A Useful Tool To Improve Your Resume </h1>
                    <p className="hero-subtitle">
                        Get instant, AI-powered feedback on your resume
                    </p>
                    <div className="hero-cta-buttons">
                        <button className="cta-button primary" onClick={() => openModal('jobseeker', true)}>
                            <FontAwesomeIcon icon={faSignInAlt} className="cta-icon" />
                            Login
                        </button>
                        <button className="cta-button secondary" onClick={() => openModal('jobseeker', false)}>
                            <FontAwesomeIcon icon={faUserPlus} className="cta-icon" />
                            Sign Up
                        </button>
                    </div>
                </div>
            </section>

            <section className="features-section">
                 <h2 className="features-main-title">Features Included</h2>
                <div className="features-grid-container">
                    <div className="feature-card">
                        <FontAwesomeIcon icon={faBrain} className="feature-icon" />
                        <h3 className="feature-title">In-Depth AI Analysis & Scoring</h3>
                        <p>Receive a comprehensive evaluation of your resume, covering content, formatting, and keyword optimization for better visibility.</p>
                    </div>
                    <div className="feature-card">
                        <FontAwesomeIcon icon={faFileAlt} className="feature-icon" />
                        <h3 className="feature-title">JD Match Analysis</h3>
                        <p>Compare your resume against any job description to see a detailed match score, identify keyword gaps, and get suggestions.</p>
                    </div>
                    <div className="feature-card">
                        <FontAwesomeIcon icon={faStar} className="feature-icon" />
                        <h3 className="feature-title">Suitable Job Roles</h3>
                        <p>Discover potential job titles and career paths that align perfectly with the skills and experience outlined in your resume.</p>
                    </div>
                </div>
            </section>
            
            {showModal && <AuthModal closeModal={closeModal} isLogin={isLogin} setIsLogin={setIsLogin} userType={userType} />}
        </div>
    );
};

export default HomePage;