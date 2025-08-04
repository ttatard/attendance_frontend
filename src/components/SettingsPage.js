import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";

const SettingsPage = ({ 
  userType, 
  onSignOut, 
  sidebarVisible, 
  setSidebarVisible,
  darkMode,
  toggleDarkMode 
}) => {
  const navigate = useNavigate();
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [error, setError] = useState(null);

 const handleDeactivate = async () => {
   setIsDeactivating(true);
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch('http://localhost:8080/api/users/me/deactivate', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: deactivateReason })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to deactivate account');
      }

      console.log("Account deactivated");
      setShowDeactivateModal(false);
      setDeactivateReason("");
      onSignOut();
      navigate('/login'); // Use navigate instead of direct window.location
    } catch (err) {
      console.error("Deactivation error:", err);
      setError(err.message || "Failed to deactivate account. Please try again.");
    }
    finally {
      setIsDeactivating(false);
    }
  };

 const handleDelete = async () => {
  if (deleteConfirm.toLowerCase() === "delete") {
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('authToken');
      console.log("Token being sent:", token); // Add this for debugging
      
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch('http://localhost:8080/api/users/me', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete account');
      }

      console.log("Account marked as deleted");
      setShowDeleteModal(false);
      setDeleteConfirm("");
      onSignOut();
    } catch (error) {
      console.error("Error deleting account:", error);
      alert(error.message || "Error deleting account. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }
};

  const styles = {
    container: {
      display: "flex",
      minHeight: "100vh",
      backgroundColor: darkMode ? "#121212" : "#f8f9fa",
      position: "relative",
      color: darkMode ? "#ffffff" : "#000000",
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
      textAlign: "left",
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
    settingsContainer: {
      maxWidth: "800px",
      margin: "0 auto",
      width: "100%",
      padding: "0 1rem"
    },
    settingsSection: {
      backgroundColor: darkMode ? "#1e1e1e" : "white",
      borderRadius: "10px",
      padding: "1.5rem",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      marginBottom: "2rem",
      color: darkMode ? "#ffffff" : "#000000",
    },
    sectionTitle: {
      color: darkMode ? "#ffffff" : "#2c3e50",
      fontSize: "1.5rem",
      marginBottom: "1.5rem",
      paddingBottom: "0.75rem",
      borderBottom: darkMode ? "1px solid #333" : "1px solid #eee"
    },
    settingItem: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "1rem 0",
      borderBottom: darkMode ? "1px solid #333" : "1px solid #eee",
      flexWrap: "wrap"
    },
    settingName: {
      color: darkMode ? "#ffffff" : "#2c3e50",
      fontSize: "1.1rem",
      marginBottom: "0.25rem"
    },
    settingDescription: {
      color: darkMode ? "#b0b0b0" : "#7f8c8d",
      fontSize: "0.9rem",
      margin: 0
    },
    toggleContainer: {
      display: "flex",
      alignItems: "center",
      gap: "1rem"
    },
    themeLabel: {
      color: darkMode ? "#b0b0b0" : "#7f8c8d",
      fontSize: "0.9rem"
    },
    toggleSwitch: {
      position: "relative",
      display: "inline-block",
      width: "60px",
      height: "34px"
    },
    toggleSlider: {
      position: "absolute",
      cursor: "pointer",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: darkMode ? "#555" : "#ccc",
      transition: ".4s",
      borderRadius: "34px",
    },
    toggleSliderKnob: {
      position: "absolute",
      height: "26px",
      width: "26px",
      left: "4px",
      bottom: "4px",
      backgroundColor: "white",
      transition: ".4s",
      borderRadius: "50%"
    },
    toggleSliderChecked: {
      backgroundColor: "#2196F3",
    },
    toggleSliderKnobChecked: {
      transform: "translateX(26px)",
    },
    warningButton: {
      backgroundColor: darkMode ? "rgba(230, 126, 34, 0.2)" : "rgba(230, 126, 34, 0.1)",
      color: "#e67e22",
      border: darkMode ? "1px solid rgba(230, 126, 34, 0.5)" : "1px solid rgba(230, 126, 34, 0.3)",
      borderRadius: "6px",
      padding: "0.75rem 1.5rem",
      cursor: "pointer",
      fontWeight: "600",
      transition: "all 0.2s",
      ':hover': {
        backgroundColor: darkMode ? "rgba(230, 126, 34, 0.3)" : "rgba(230, 126, 34, 0.2)"
      }
    },
    dangerButton: {
      backgroundColor: darkMode ? "rgba(231, 76, 60, 0.2)" : "rgba(231, 76, 60, 0.1)",
      color: "#e74c3c",
      border: darkMode ? "1px solid rgba(231, 76, 60, 0.5)" : "1px solid rgba(231, 76, 60, 0.3)",
      borderRadius: "6px",
      padding: "0.75rem 1.5rem",
      cursor: "pointer",
      fontWeight: "600",
      transition: "all 0.2s",
      ':hover': {
        backgroundColor: darkMode ? "rgba(231, 76, 60, 0.3)" : "rgba(231, 76, 60, 0.2)"
      }
    },
    footer: {
      textAlign: "center",
      marginTop: "auto",
      padding: "1rem",
      color: darkMode ? "#b0b0b0" : "#7f8c8d",
      borderTop: darkMode ? "1px solid #333" : "1px solid #eee"
    },
    modalOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000
    },
    modal: {
      backgroundColor: darkMode ? "#1e1e1e" : "white",
      color: darkMode ? "#ffffff" : "#000000",
      borderRadius: "10px",
      padding: "2rem",
      maxWidth: "500px",
      width: "90%",
      boxShadow: "0 5px 15px rgba(0, 0, 0, 0.3)"
    },
    modalTitle: {
      color: darkMode ? "#ffffff" : "#2c3e50",
      fontSize: "1.5rem",
      marginBottom: "1rem"
    },
    modalText: {
      color: darkMode ? "#b0b0b0" : "#7f8c8d",
      marginBottom: "1.5rem"
    },
    modalWarning: {
      color: "#e74c3c",
      fontSize: "0.9rem",
      margin: "1rem 0"
    },
    errorText: {
      color: "#e74c3c",
      fontSize: "0.9rem",
      margin: "0.5rem 0",
      textAlign: "center"
    },
    reasonInput: {
      width: "100%",
      minHeight: "100px",
      padding: "0.75rem",
      border: darkMode ? "1px solid #444" : "1px solid #ddd",
      borderRadius: "6px",
      marginBottom: "1rem",
      resize: "vertical",
      backgroundColor: darkMode ? "#2a2a2a" : "white",
      color: darkMode ? "#ffffff" : "#000000"
    },
    confirmInput: {
      width: "100%",
      padding: "0.75rem",
      border: darkMode ? "1px solid #444" : "1px solid #ddd",
      borderRadius: "6px",
      marginBottom: "1rem",
      backgroundColor: darkMode ? "#2a2a2a" : "white",
      color: darkMode ? "#ffffff" : "#000000"
    },
    modalButtons: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "1rem",
      marginTop: "1.5rem"
    },
    cancelButton: {
      backgroundColor: darkMode ? "#333" : "#ecf0f1",
      color: darkMode ? "#ffffff" : "#7f8c8d",
      border: "none",
      borderRadius: "6px",
      padding: "0.75rem 1.5rem",
      cursor: "pointer",
      fontWeight: "600",
      transition: "all 0.2s",
      ':hover': {
        backgroundColor: darkMode ? "#444" : "#bdc3c7"
      }
    },
    confirmButton: {
      backgroundColor: "#3498db",
      color: "white",
      border: "none",
      borderRadius: "6px",
      padding: "0.75rem 1.5rem",
      cursor: "pointer",
      fontWeight: "600",
      transition: "all 0.2s",
      ':hover': {
        backgroundColor: "#2980b9"
      }
    },
    deleteButton: {
      backgroundColor: "#e74c3c",
      color: "white",
      border: "none",
      borderRadius: "6px",
      padding: "0.75rem 1.5rem",
      cursor: "pointer",
      fontWeight: "600",
      transition: "all 0.2s",
      ':hover': {
        backgroundColor: "#c0392b"
      }
    },
    disabledButton: {
      backgroundColor: "#95a5a6",
      cursor: "not-allowed",
      ':hover': {
        backgroundColor: "#95a5a6"
      }
    }
  };

  return (
    <div style={styles.container}>
      <Sidebar 
        userType={userType}
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
          <h1 style={styles.title}>Settings</h1>
          <p style={styles.subtitle}>Manage your account preferences</p>
        </div>

        <div style={styles.settingsContainer}>
          <div style={styles.settingsSection}>
            <h2 style={styles.sectionTitle}>Appearance</h2>
            <div style={styles.settingItem}>
              <div>
                <h3 style={styles.settingName}>Theme</h3>
                <p style={styles.settingDescription}>Choose between light and dark mode</p>
              </div>
              <div style={styles.toggleContainer}>
                <span style={styles.themeLabel}>Light</span>
                <label style={styles.toggleSwitch}>
                  <input 
                    type="checkbox" 
                    checked={darkMode}
                    onChange={toggleDarkMode}
                    style={{ display: 'none' }}
                  />
                  <span style={{
                    ...styles.toggleSlider,
                    ...(darkMode ? styles.toggleSliderChecked : {})
                  }}>
                    <span style={{
                      ...styles.toggleSliderKnob,
                      ...(darkMode ? styles.toggleSliderKnobChecked : {})
                    }} />
                  </span>
                </label>
                <span style={styles.themeLabel}>Dark</span>
              </div>
            </div>
          </div>

          <div style={styles.settingsSection}>
            <h2 style={styles.sectionTitle}>Account Actions</h2>
            
            <div style={styles.settingItem}>
              <div>
                <h3 style={{...styles.settingName, color: '#e67e22'}}>Deactivate Account</h3>
                <p style={styles.settingDescription}>
                  Temporarily disable your account. You can reactivate it later by signing in.
                </p>
              </div>
              <button 
                style={styles.warningButton}
                onClick={() => setShowDeactivateModal(true)}
              >
                Deactivate Account
              </button>
            </div>
            
            <div style={styles.settingItem}>
              <div>
                <h3 style={{...styles.settingName, color: '#e74c3c'}}>Delete Account</h3>
                <p style={styles.settingDescription}>
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
              </div>
              <button 
                style={styles.dangerButton}
                onClick={() => setShowDeleteModal(true)}
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>

        <div style={styles.footer}>
          <p>© {new Date().getFullYear()} Attendance App</p>
        </div>
      </div>

      {showDeactivateModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>Deactivate Your Account</h2>
            <p style={styles.modalText}>
              We're sorry to see you go. Please let us know why you're deactivating your account.
            </p>
            
            <textarea
              style={styles.reasonInput}
              placeholder="Reason for deactivation (optional)"
              value={deactivateReason}
              onChange={(e) => setDeactivateReason(e.target.value)}
            />
            
            <p style={styles.modalWarning}>
              Note: Your account will be temporarily disabled. You can reactivate it by signing in again.
            </p>

            {error && <p style={styles.errorText}>{error}</p>}
            
            <div style={styles.modalButtons}>
              <button 
                style={styles.cancelButton}
                onClick={() => {
                  setShowDeactivateModal(false);
                  setDeactivateReason("");
                  setError(null);
                }}
                disabled={isDeactivating}
              >
                Cancel
              </button>
              <button 
                style={{
                  ...styles.confirmButton,
                  ...(isDeactivating ? styles.disabledButton : {})
                }}
                onClick={handleDeactivate}
                disabled={isDeactivating}
              >
                {isDeactivating ? "Processing..." : "Deactivate Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>Delete Your Account Permanently</h2>
            <p style={styles.modalText}>
              This will permanently delete your account and all associated data. 
              <strong> This action cannot be undone.</strong>
            </p>
            
            <p style={styles.modalWarning}>
              To confirm, please type <strong>"DELETE"</strong> in the box below:
            </p>
            
            <input
              type="text"
              style={styles.confirmInput}
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="Type DELETE to confirm"
            />

            {error && <p style={styles.errorText}>{error}</p>}
            
            <div style={styles.modalButtons}>
              <button 
                style={styles.cancelButton}
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirm("");
                  setError(null);
                }}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                style={{
                  ...styles.deleteButton,
                  ...(deleteConfirm.toLowerCase() !== "delete" || isDeleting ? styles.disabledButton : {})
                }}
                onClick={handleDelete}
                disabled={deleteConfirm.toLowerCase() !== "delete" || isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Account Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;