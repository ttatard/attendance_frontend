import React, { useState, useEffect, useCallback } from 'react';
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
import SystemSettingsPage from './components/SystemSettingsPage'; 

// Move ProtectedRoute outside of App to prevent re-creation on every render
const ProtectedRoute = ({ children, requiredUserType, currentUserType, darkMode }) => {
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    setLoading(false);
  }, [currentUserType]);

  // Show loading while determining user type
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.5rem',
        backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
        color: darkMode ? '#ffffff' : '#000000'
      }}>
        Loading...
      </div>
    );
  }

  // Debug logging
  console.log(`ProtectedRoute Check: Required='${requiredUserType}', Current='${currentUserType}'`);

  // Check userType requirement
  if (requiredUserType && currentUserType !== requiredUserType) {
    console.log(`Access denied: Required '${requiredUserType}', but user has '${currentUserType}'`);
    return <Navigate to="/home" replace />;
  }
  
  return children;
};

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

  // Memoize the verifyAuth function to prevent recreation
  const verifyAuth = useCallback(async () => {
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
          localStorage.removeItem('userType');
          toast.info('Your account is deactivated. Please sign in to reactivate.');
          return false;
        }

        if (response.data.isDeleted) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('userType');
          toast.error('Account not found');
          return false;
        }

        const { id, accountType, firstName, lastName, email, birthday, gender } = response.data;
        
        // Uniform userType mapping
        let currentUserType = 'user'; // default
        if (accountType === 'ADMIN') {
          currentUserType = 'admin';
        } else if (accountType === 'SYSTEM_OWNER') {
          currentUserType = 'system_owner';
        }
        
        console.log('User authenticated with userType:', currentUserType);
        
        setUserType(currentUserType);
        // Store in localStorage with consistent key
        localStorage.setItem('userType', currentUserType);
        
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
        return true;
      } catch (err) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userType');
        if (err.response?.status === 403 && err.response.data?.isDeactivated) {
          toast.info('Your account is deactivated. Please sign in to reactivate.');
        }
        return false;
      }
    }
    return false;
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      await verifyAuth();
      setLoading(false);
    };

    initAuth();

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    const resetInactivityTimer = () => {
      setLastActivity(Date.now());
    };

    events.forEach(event => {
      window.addEventListener(event, resetInactivityTimer);
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, resetInactivityTimer);
      });
    };
  }, [verifyAuth]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const checkInactivity = setInterval(() => {
      const now = Date.now();
      const timeElapsed = now - lastActivity;
      const fiveMinutes = 5 * 60 * 1000;

      if (timeElapsed > fiveMinutes) {
        handleSignOut();
      }
    }, 60000); // Check every minute instead of every second

    return () => clearInterval(checkInactivity);
  }, [isAuthenticated, lastActivity]);

  const handleSignOut = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userType');
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
  }, []);

  const toggleDarkMode = useCallback(() => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  if (loading) {
    return <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '1.5rem',
      backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
      color: darkMode ? '#ffffff' : '#000000'
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
                toggleDarkMode={toggleDarkMode}
              />
            )
          }
        />
        
        {/* Admin Routes */}
        <Route
          path="/admin/events"
          element={
            isAuthenticated && (userType === 'admin' || userType === 'system_owner') ? (
              <AdminPage
                onSignOut={handleSignOut}
                userData={userData}
                sidebarVisible={sidebarVisible}
                setSidebarVisible={setSidebarVisible}
                darkMode={darkMode}
                toggleDarkMode={toggleDarkMode}
              />
            ) : (
              <Navigate to="/home" replace />
            )
          }
        />
        
        <Route
          path="/admin"
          element={<Navigate to="/admin/events" replace />}
        />
        
        <Route
          path="/manage-users"
          element={
            isAuthenticated && (userType === 'admin' || userType === 'system_owner') ? (
              <UserManagement
                userType={userType}
                onSignOut={handleSignOut}
                userData={userData}
                sidebarVisible={sidebarVisible}
                setSidebarVisible={setSidebarVisible}
                darkMode={darkMode}
                toggleDarkMode={toggleDarkMode}
              />
            ) : (
              <Navigate to="/home" replace />
            )
          }
        />
        
        {/* System Owner Only Routes */}
        <Route 
          path="/system/settings" 
          element={
            <ProtectedRoute 
              requiredUserType="system_owner" 
              currentUserType={userType} 
              darkMode={darkMode}
            >
              <SystemSettingsPage 
                userType={userType}
                onSignOut={handleSignOut}
                userData={userData}
                sidebarVisible={sidebarVisible}
                setSidebarVisible={setSidebarVisible}
                darkMode={darkMode}
                toggleDarkMode={toggleDarkMode}
              />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/system/owners" 
          element={
            <ProtectedRoute 
              requiredUserType="system_owner" 
              currentUserType={userType} 
              darkMode={darkMode}
            >
              <UserManagement
                userType={userType}
                onSignOut={handleSignOut}
                userData={userData}
                sidebarVisible={sidebarVisible}
                setSidebarVisible={setSidebarVisible}
                darkMode={darkMode}
                toggleDarkMode={toggleDarkMode}
                viewType="owners"
              />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/system/users" 
          element={
            <ProtectedRoute 
              requiredUserType="system_owner" 
              currentUserType={userType} 
              darkMode={darkMode}
            >
              <UserManagement
                userType={userType}
                onSignOut={handleSignOut}
                userData={userData}
                sidebarVisible={sidebarVisible}
                setSidebarVisible={setSidebarVisible}
                darkMode={darkMode}
                toggleDarkMode={toggleDarkMode}
                viewType="all"
              />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/system/audit" 
          element={
            <ProtectedRoute 
              requiredUserType="system_owner" 
              currentUserType={userType} 
              darkMode={darkMode}
            >
              <ReportPage
                userType={userType}
                onSignOut={handleSignOut}
                userData={userData}
                sidebarVisible={sidebarVisible}
                setSidebarVisible={setSidebarVisible}
                darkMode={darkMode}
                toggleDarkMode={toggleDarkMode}
                viewType="audit"
              />
            </ProtectedRoute>
          } 
        />
        
        {/* User Routes */}
        <Route
          path="/events"
          element={
            isAuthenticated && userType === 'user' ? (
              <EventList
                userType={userType}
                onSignOut={handleSignOut}
                userData={userData}
                sidebarVisible={sidebarVisible}
                setSidebarVisible={setSidebarVisible}
                darkMode={darkMode}
                toggleDarkMode={toggleDarkMode}
              />
            ) : isAuthenticated ? (
              <Navigate to="/admin/events" replace />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        
        {/* Common Routes */}
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
          path="/join/:id"
          element={
            isAuthenticated ? (
              <JoinEvent 
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
        
        <Route
          path="/qr-scanner"
          element={
            isAuthenticated ? (
              <QRScanner 
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
                toggleDarkMode={toggleDarkMode}
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
                toggleDarkMode={toggleDarkMode}
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