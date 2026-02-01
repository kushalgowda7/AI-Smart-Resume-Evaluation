import React from 'react';
import { useNavigate } from 'react-router-dom';
import jsCookie from 'js-cookie';
import { FiLogOut, FiMenu } from 'react-icons/fi';
import './Navbar.css';

const Navbar = ({ onMenuClick, isDashboard }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        jsCookie.remove('token');
        navigate('/');
    };

    return (
        <header className="main-navbar">
            <div className="navbar-content">
                <div className="navbar-left">
                    {isDashboard && (
                        <button className="menu-toggle-btn" onClick={onMenuClick} title="Toggle Sidebar">
                            <FiMenu />
                        </button>
                    )}
                    <a href="/" className="navbar-logo">AI Smart Resume Evaluation</a>
                </div>
                {isDashboard && (
                    <div className="navbar-right">
                        <button onClick={handleLogout} className="logout-button">
                            <FiLogOut />
                            <span>Logout</span>
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Navbar;