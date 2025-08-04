import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import LandingPage from './components/LandingPage';
import SignPage from './components/SignPage';
import EventList from './components/EventList';
import JoinEvent from './components/JoinEvent';
import QRScanner from './components/QRScanner';
import AdminPage from './components/AdminPage';
import AccountPage from './components/AccountPage';
import ReportPage from './components/ReportPage';
import SettingsPage from './components/SettingsPage';
import UserManagement from './components/UserManagement';
import SupportCenter from './components/SupportCenter';
import { toast } from 'react-toastify';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [userType, setUserType] = useState('user');
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [userData, setUserData] = useState({
    id: "",
    firstName: "",
    lastName: "",
    email: "",
    birthday: "",
    gender: ""
  });
  const [loading, setLoading] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Load theme preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Toggle dark/light mode
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const resetInactivityTimer = () => {
    setLastActivity(Date.now());
  };

  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const response = await axios.get('http://localhost:8080/api/users/me', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          if (response.data.isDeactivated) {
            localStorage.removeItem('authToken');
            toast.info('Your account is deactivated. Please sign in to reactivate.');
            return;
          }

          if (response.data.isDeleted) {
            localStorage.removeItem('authToken');
            toast.error('Account not found');
            return;
          }

          const { id, accountType, firstName, lastName, email, birthday, gender } = response.data;
          setUserType(accountType === 'ADMIN' ? 'admin' : 'user');
          setUserData({
            id,
            firstName,
            lastName,
            email,
            birthday,
            gender: gender?.toLowerCase() || ''
          });
          setIsAuthenticated(true);
          setLastActivity(Date.now());
        } catch (err) {
          localStorage.removeItem('authToken');
          if (err.response?.status === 403 && err.response.data?.isDeactivated) {
            toast.info('Your account is deactivated. Please sign in to reactivate.');
          }
        }
      }
      setLoading(false);
    };

    verifyAuth();

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, resetInactivityTimer);
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, resetInactivityTimer);
      });
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const checkInactivity = setInterval(() => {
      const now = Date.now();
      const timeElapsed = now - lastActivity;
      const fiveMinutes = 5 * 60 * 1000;

      if (timeElapsed > fiveMinutes) {
        handleSignOut();
      }
    }, 1000);

    return () => clearInterval(checkInactivity);
  }, [isAuthenticated, lastActivity]);

  const handleSignOut = () => {
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
    setUserType('user');
    setSidebarVisible(false);
    setUserData({
      id: "",
      firstName: "",
      lastName: "",
      email: "",
      birthday: "",
      gender: ""
    });
  };

  if (loading) {
    return <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '1.5rem'
    }}>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/home" replace />
            ) : (
              <SignPage
                setIsAuthenticated={setIsAuthenticated}
                setUserType={setUserType}
                setUserData={setUserData}
                darkMode={darkMode}
              />
            )
          }
        />
        <Route
  path="/manage-users"
  element={
    isAuthenticated && userType === 'admin' ? (
      <UserManagement
        userType={userType}
        onSignOut={handleSignOut}
        userData={userData}
        sidebarVisible={sidebarVisible}
        setSidebarVisible={setSidebarVisible}
        darkMode={darkMode}
      />
    ) : (
      <Navigate to="/home" replace />
    )
  }
/>
<Route
  path="/support"
  element={
    isAuthenticated ? (
      <SupportCenter
        userType={userType}
        onSignOut={handleSignOut}
        userData={userData}
        sidebarVisible={sidebarVisible}
        setSidebarVisible={setSidebarVisible}
        darkMode={darkMode}
      />
    ) : (
      <Navigate to="/" replace />
    )
  }
/>
        <Route
          path="/home"
          element={
            isAuthenticated ? (
              <LandingPage
                userType={userType}
                userData={userData}
                onSignOut={handleSignOut}
                sidebarVisible={sidebarVisible}
                setSidebarVisible={setSidebarVisible}
                darkMode={darkMode}
                toggleDarkMode={toggleDarkMode}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/events"
          element={
            isAuthenticated ? (
              <EventList
                userType={userType}
                onSignOut={handleSignOut}
                userData={userData}
                sidebarVisible={sidebarVisible}
                setSidebarVisible={setSidebarVisible}
                darkMode={darkMode}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/join/:id"
          element={
            isAuthenticated ? (
              <JoinEvent 
                userData={userData}
                sidebarVisible={sidebarVisible}
                setSidebarVisible={setSidebarVisible}
                darkMode={darkMode}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/qr-scanner"
          element={
            isAuthenticated ? (
              <QRScanner 
                userData={userData}
                sidebarVisible={sidebarVisible}
                setSidebarVisible={setSidebarVisible}
                darkMode={darkMode}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/admin"
          element={
            isAuthenticated && userType === 'admin' ? (
              <AdminPage
                onSignOut={handleSignOut}
                userData={userData}
                sidebarVisible={sidebarVisible}
                setSidebarVisible={setSidebarVisible}
                darkMode={darkMode}
              />
            ) : (
              <Navigate to="/home" replace />
            )
          }
        />
        <Route
          path="/account"
          element={
            isAuthenticated ? (
              <AccountPage
                userType={userType}
                onSignOut={handleSignOut}
                userData={userData}
                setUserData={setUserData}
                sidebarVisible={sidebarVisible}
                setSidebarVisible={setSidebarVisible}
                darkMode={darkMode}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/reports"
          element={
            isAuthenticated ? (
              <ReportPage
                userType={userType}
                onSignOut={handleSignOut}
                userData={userData}
                sidebarVisible={sidebarVisible}
                setSidebarVisible={setSidebarVisible}
                darkMode={darkMode}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/settings"
          element={
            isAuthenticated ? (
              <SettingsPage
                userType={userType}
                onSignOut={handleSignOut}
                userData={userData}
                sidebarVisible={sidebarVisible}
                setSidebarVisible={setSidebarVisible}
                darkMode={darkMode}
                toggleDarkMode={toggleDarkMode}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;