import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import JobSeekerDashboard from './pages/JobSeekerDashboard';
import RedirectPage from './pages/RedirectPage'; // Import the new page
import ProtectedRoute from './components/Routing/ProtectedRoute';
import Navbar from './components/Navbar/Navbar';
import './App.css';

function AppContent() {
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const isRedirectPage = location.pathname === '/redirect';
    const isDashboardPage = location.pathname.includes('dashboard');

    return (
      <div className="App">
            {!isRedirectPage && (
                <Navbar 
                    onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                    isDashboard={isDashboardPage}
                />
            )}
            <main className="main-container">
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/redirect" element={<RedirectPage />} /> {/* Add the new route back */}
                    <Route 
                        path="/jobseeker/dashboard" 
                        element={
                            <ProtectedRoute allowedRoles={['jobseeker']}>
                                <JobSeekerDashboard isSidebarOpen={isSidebarOpen} />
                            </ProtectedRoute>
                        } 
                    />
                </Routes>
            </main>
        </div>
    );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;