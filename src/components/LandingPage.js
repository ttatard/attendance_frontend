import React from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";

const LandingPage = ({ 
  userType, 
  userData, 
  onSignOut, 
  sidebarVisible, 
  setSidebarVisible,
  darkMode,
  toggleDarkMode 
}) => {
  // Get current userType with fallback to localStorage
  const currentUserType = userType || localStorage.getItem('userType') || 'user';

  const styles = {
    container: {
      display: "flex",
      minHeight: "100vh",
      backgroundColor: darkMode ? "#121212" : "#f8f9fa",
      position: "relative",
      color: darkMode ? "#ffffff" : "#000000",
      transition: "background-color 0.3s ease, color 0.3s ease",
    },
    mainContent: {
      flex: 1,
      padding: "2rem",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      transition: "margin-left 0.3s ease",
    },
    header: {
      textAlign: "center",
      marginBottom: "2rem",
      padding: "0 1rem"
    },
    title: {
      fontSize: "2.5rem",
      color: darkMode ? "#ffffff" : "#2c3e50",
      marginBottom: "0.5rem"
    },
    subtitle: {
      fontSize: "1.2rem",
      color: darkMode ? "#b0b0b0" : "#7f8c8d",
      marginBottom: "0"
    },
    content: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
      gap: "2rem",
      margin: "2rem 0"
    },
    card: {
      backgroundColor: darkMode ? "#1e1e1e" : "white",
      color: darkMode ? "#ffffff" : "#000000",
      borderRadius: "10px",
      padding: "2rem",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      textAlign: "center",
      transition: "transform 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease, color 0.3s ease",
      ":hover": {
        transform: "translateY(-5px)",
        boxShadow: "0 6px 12px rgba(0, 0, 0, 0.15)"
      }
    },
    cardTitle: {
      color: darkMode ? "#ffffff" : "#2c3e50",
      fontSize: "1.5rem",
      marginBottom: "1rem"
    },
    cardText: {
      color: darkMode ? "#b0b0b0" : "#7f8c8d",
      marginBottom: "1.5rem",
      fontSize: "1rem"
    },
    cardButton: {
      display: "inline-block",
      backgroundColor: "#3498db",
      color: "white",
      padding: "0.75rem 1.5rem",
      borderRadius: "6px",
      textDecoration: "none",
      fontWeight: "600",
      transition: "background-color 0.3s ease",
      ":hover": {
        backgroundColor: "#2980b9"
      }
    },
    footer: {
      textAlign: "center",
      marginTop: "auto",
      padding: "1rem",
      color: darkMode ? "#b0b0b0" : "#7f8c8d",
      borderTop: darkMode ? "1px solid #333" : "1px solid #eee"
    }
  };

  return (
    <div style={styles.container}>
      <Sidebar 
        userType={currentUserType}
        onSignOut={onSignOut}
        sidebarVisible={sidebarVisible}
        setSidebarVisible={setSidebarVisible}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
      />

      <div style={{
        ...styles.mainContent,
        marginLeft: sidebarVisible ? '250px' : '0'
      }}>
        <div style={styles.header}>
          <h1 style={styles.title}>
            Welcome to the Attendance App, {userData.firstName}
            {currentUserType === 'system_owner' && ' (System Owner)'}
            {currentUserType === 'admin' && ' (Admin)'}
          </h1>
          <p style={styles.subtitle}>
            {currentUserType === 'system_owner' 
              ? 'Full system administration dashboard' 
              : currentUserType === 'admin' 
                ? 'Organization administration dashboard' 
                : 'User attendance management'}
          </p>
        </div>

        <div style={styles.content}>
          {/* Common cards for all users */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Events</h2>
            <p style={styles.cardText}>
              {currentUserType === 'system_owner' 
                ? 'View and manage all system events' 
                : currentUserType === 'admin' 
                  ? 'View and manage your organization events' 
                  : 'View and register for events'}
            </p>
            <Link 
              to={currentUserType === 'user' ? "/events" : "/admin/events"} 
              style={styles.cardButton}
            >
              {currentUserType === 'user' ? 'View Events' : 'Manage Events'}
            </Link>
          </div>

          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Reports</h2>
            <p style={styles.cardText}>
              {currentUserType === 'system_owner' 
                ? 'Generate system-wide reports and audit logs' 
                : currentUserType === 'admin' 
                  ? 'Generate organization reports' 
                  : 'View your attendance history'}
            </p>
            <Link to="/reports" style={styles.cardButton}>
              {currentUserType === 'user' ? 'My Attendance' : 'View Reports'}
            </Link>
          </div>

          {/* Admin and System Owner shared cards */}
          {(currentUserType === 'admin' || currentUserType === 'system_owner') && (
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>User Management</h2>
              <p style={styles.cardText}>
                {currentUserType === 'system_owner' 
                  ? 'Manage organization users' 
                  : 'Manage your organization users'}
              </p>
              <Link to="/manage-users" style={styles.cardButton}>
                Manage Users
              </Link>
            </div>
          )}

          {/* System Owner specific cards */}
          {currentUserType === 'system_owner' && (
            <>
              <div style={styles.card}>
                <h2 style={styles.cardTitle}>All System Users</h2>
                <p style={styles.cardText}>View and manage all user accounts across the entire system</p>
                <Link to="/system/users" style={styles.cardButton}>
                  All Users
                </Link>
              </div>
              
              <div style={styles.card}>
                <h2 style={styles.cardTitle}>System Owners</h2>
                <p style={styles.cardText}>Manage system owner accounts and permissions</p>
                <Link to="/system/owners" style={styles.cardButton}>
                  Manage Owners
                </Link>
              </div>

              <div style={styles.card}>
                <h2 style={styles.cardTitle}>System Settings</h2>
                <p style={styles.cardText}>Configure system-wide settings, branding, and preferences</p>
                <Link to="/system/settings" style={styles.cardButton}>
                  System Settings
                </Link>
              </div>

              <div style={styles.card}>
                <h2 style={styles.cardTitle}>Audit Logs</h2>
                <p style={styles.cardText}>View system-wide audit logs and activity reports</p>
                <Link to="/system/audit" style={styles.cardButton}>
                  Audit Logs
                </Link>
              </div>
            </>
          )}

          {/* Common account card */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Account</h2>
            <p style={styles.cardText}>Manage your account settings and preferences</p>
            <Link to="/account" style={styles.cardButton}>
              Account Settings
            </Link>
          </div>

          {/* Settings card for all users */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Settings</h2>
            <p style={styles.cardText}>
              {currentUserType === 'system_owner' 
                ? 'Personal settings and preferences' 
                : currentUserType === 'admin' 
                  ? 'Admin settings and preferences' 
                  : 'User settings and preferences'}
            </p>
            <Link to="/settings" style={styles.cardButton}>
              Settings
            </Link>
          </div>
        </div>

        <div style={styles.footer}>
          <p>© {new Date().getFullYear()} Attendance App</p>
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Logged in as: <strong>{currentUserType === 'system_owner' ? 'System Owner' : currentUserType === 'admin' ? 'Administrator' : 'User'}</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;