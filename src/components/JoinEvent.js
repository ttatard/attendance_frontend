import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "../components/Sidebar";

const JoinEvent = ({ userType, userData, onSignOut, sidebarVisible, setSidebarVisible, darkMode }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState(null);
  const [codeInput, setCodeInput] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        const response = await axios.get(`http://localhost:8080/api/events/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setEvent(response.data);
        setError(null);
      } catch (error) {
        console.error("Error fetching event:", error);
        setError("Failed to load event details");
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [id]);

  const verifyCode = async () => {
    if (!codeInput.trim()) return;
    
    setLoading(true);
    setVerificationResult(null);
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(
        'http://localhost:8080/api/registrations/verify-code',
        { eventId: id, code: codeInput },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setVerificationResult({
        success: true,
        message: response.data.message,
        userName: response.data.userName
      });
      
      setCodeInput('');
    } catch (error) {
      console.error("Code verification error:", error);
      setVerificationResult({
        success: false,
        message: error.response?.data?.message || 'Failed to verify code'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckInAnother = () => {
    setVerificationResult(null);
    setCodeInput('');
  };

  const handleBackToEvents = () => {
    navigate('/events');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (e) {
      return dateString;
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    } catch (e) {
      return timeString;
    }
  };

  const isEventToday = (dateString) => {
    if (!dateString) return false;
    try {
      const today = new Date();
      const eventDay = new Date(dateString);
      return today.toDateString() === eventDay.toDateString();
    } catch (e) {
      return false;
    }
  };

  const styles = {
    container: {
      display: "flex",
      minHeight: "100vh",
      backgroundColor: darkMode ? "#121212" : "#f8f9fa",
      color: darkMode ? "#ffffff" : "#000000",
    },
    mainContent: {
      flex: 1,
      padding: "2rem",
      maxWidth: "600px",
      margin: "0 auto",
      marginLeft: sidebarVisible ? '250px' : '0',
      transition: "margin-left 0.3s ease",
    },
    eventHeader: {
      marginBottom: "1.5rem",
      borderBottom: darkMode ? "1px solid #333" : "1px solid #eee",
      paddingBottom: "1rem"
    },
    eventTitle: {
      fontSize: "1.8rem",
      fontWeight: "bold",
      marginBottom: "0.5rem",
      color: darkMode ? "#ffffff" : "#2c3e50"
    },
    eventDetails: {
      backgroundColor: darkMode ? "#1e1e1e" : "#f5f5f5",
      padding: "1.5rem",
      borderRadius: "0.5rem",
      marginBottom: "1.5rem"
    },
    detailText: {
      margin: "0.5rem 0",
      color: darkMode ? "#b0b0b0" : "#555"
    },
    codeSection: {
      backgroundColor: darkMode ? "#1e1e1e" : "#f5f5f5",
      padding: "1.5rem",
      borderRadius: "0.5rem",
      marginTop: "2rem"
    },
    codeInput: {
      width: "100%",
      padding: "0.75rem",
      fontSize: "1.2rem",
      textAlign: "center",
      border: "2px solid #ccc",
      borderRadius: "0.5rem",
      marginBottom: "1rem",
      textTransform: "uppercase",
      backgroundColor: darkMode ? "#2a2a2a" : "white",
      color: darkMode ? "#ffffff" : "#000000",
      "::placeholder": {
        color: darkMode ? "#888" : "#aaa"
      }
    },
    verifyButton: {
      width: "100%",
      padding: "0.75rem",
      backgroundColor: "#4CAF50",
      color: "white",
      border: "none",
      borderRadius: "0.5rem",
      cursor: "pointer",
      fontSize: "1.1rem",
      fontWeight: "bold",
      transition: "background-color 0.3s ease",
      ":hover": {
        backgroundColor: "#45a049"
      },
      ":disabled": {
        backgroundColor: darkMode ? "#424242" : "#bdc3c7",
        cursor: "not-allowed"
      }
    },
    resultMessage: {
      marginTop: "1rem",
      padding: "1rem",
      borderRadius: "0.5rem",
      textAlign: "center",
      fontSize: "1rem"
    },
    actionButtons: {
      display: "flex",
      gap: "1rem",
      marginTop: "1.5rem"
    },
    actionButton: {
      flex: 1,
      padding: "0.75rem",
      border: "none",
      borderRadius: "0.5rem",
      cursor: "pointer",
      fontSize: "1rem",
      fontWeight: "bold",
      transition: "background-color 0.3s ease"
    },
    secondaryButton: {
      backgroundColor: "#f39c12",
      color: "white",
      ":hover": {
        backgroundColor: "#e67e22"
      }
    },
    primaryButton: {
      backgroundColor: "#3498db",
      color: "white",
      ":hover": {
        backgroundColor: "#2980b9"
      }
    },
    loading: {
      textAlign: "center",
      padding: "2rem",
      color: darkMode ? "#b0b0b0" : "#7f8c8d"
    },
    error: {
      textAlign: "center",
      padding: "2rem",
      color: "#e74c3c"
    },
    meetingLink: {
      color: darkMode ? "#64b5f6" : "#1976d2",
      textDecoration: "underline",
      wordBreak: "break-all"
    },
    instructions: {
      textAlign: "center",
      marginBottom: "1rem",
      color: darkMode ? "#b0b0b0" : "#7f8c8d",
      fontSize: "0.9rem"
    }
  };

  return (
    <div style={styles.container}>
      <Sidebar 
        userType={userType}
        onSignOut={onSignOut}
        sidebarVisible={sidebarVisible}
        setSidebarVisible={setSidebarVisible}
        userData={userData}
        darkMode={darkMode}
      />

      <div style={styles.mainContent}>
        <div style={styles.eventHeader}>
          <h2 style={styles.eventTitle}>
            {event ? `Check-in: ${event.name}` : 'Event Check-in'}
          </h2>
          <p style={{ color: darkMode ? "#b0b0b0" : "#7f8c8d" }}>
            Enter your unique code to check in to this event
          </p>
        </div>
        
        {loading && !event ? (
          <div style={styles.loading}>Loading event details...</div>
        ) : error ? (
          <div style={styles.error}>Error: {error}</div>
        ) : event ? (
          <>
            <div style={styles.eventDetails}>
              <p style={styles.detailText}><strong>Date:</strong> {formatDate(event.date)}</p>
              <p style={styles.detailText}><strong>Time:</strong> {formatTime(event.time)}</p>
              <p style={styles.detailText}>
                <strong>Location:</strong> {event.isOnline ? 'Online Event' : event.place}
              </p>
              {event.organizer && (
                <p style={styles.detailText}><strong>Organizer:</strong> {event.organizer.name}</p>
              )}
              
              {event.isOnline && isEventToday(event.date) && (
                <div style={{ 
                  backgroundColor: darkMode ? "#2a2a2a" : "#e3f2fd",
                  padding: "1rem",
                  borderRadius: "0.5rem",
                  marginTop: "1rem"
                }}>
                  <p style={{ marginBottom: "0.5rem" }}><strong>Meeting Details:</strong></p>
                  {event.meetingUrl && (
                    <p style={styles.detailText}>
                      <strong>Link:</strong>{' '}
                      <a href={event.meetingUrl} target="_blank" rel="noopener noreferrer" style={styles.meetingLink}>
                        {event.meetingUrl}
                      </a>
                    </p>
                  )}
                  {event.meetingId && (
                    <p style={styles.detailText}><strong>ID:</strong> {event.meetingId}</p>
                  )}
                  {event.meetingPasscode && (
                    <p style={styles.detailText}><strong>Passcode:</strong> {event.meetingPasscode}</p>
                  )}
                </div>
              )}
            </div>
            
            <div style={styles.codeSection}>
              <h3 style={{ textAlign: "center", marginBottom: "1rem" }}>Enter Your Check-in Code</h3>
              
              <p style={styles.instructions}>
                Enter the 6-character code you received when you registered for this event
              </p>
              
              <input
                type="text"
                placeholder="Enter your code (e.g., A1B2C3)"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                style={styles.codeInput}
                maxLength={6}
                disabled={loading}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && codeInput.length >= 6) {
                    verifyCode();
                  }
                }}
              />
              
              <button
                onClick={verifyCode}
                style={{
                  ...styles.verifyButton,
                  ...(loading || codeInput.length < 6 ? { ":disabled": true } : {})
                }}
                disabled={loading || codeInput.length < 6}
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
              
              {verificationResult && (
                <div style={{
                  ...styles.resultMessage,
                  backgroundColor: verificationResult.success ? 
                    (darkMode ? "#2e7d32" : "#d4edda") : 
                    (darkMode ? "#c62828" : "#f8d7da"),
                  color: verificationResult.success ? 
                    (darkMode ? "#a5d6a7" : "#155724") : 
                    (darkMode ? "#ffcdd2" : "#721c24"),
                  border: `1px solid ${verificationResult.success ? 
                    (darkMode ? "#4caf50" : "#c3e6cb") : 
                    (darkMode ? "#f44336" : "#f5c6cb")}`
                }}>
                  {verificationResult.success ? (
                    <>
                      <strong>Success!</strong> {verificationResult.message}
                      {verificationResult.userName && (
                        <div style={{ marginTop: "0.5rem" }}>
                          Welcome, <strong>{verificationResult.userName}</strong>!
                        </div>
                      )}
                    </>
                  ) : (
                    <strong>Error: {verificationResult.message}</strong>
                  )}
                </div>
              )}
              
              {verificationResult && (
                <div style={styles.actionButtons}>
                  <button
                    onClick={handleCheckInAnother}
                    style={{
                      ...styles.actionButton,
                      ...styles.secondaryButton
                    }}
                  >
                    Check In Another Person
                  </button>
                  <button
                    onClick={handleBackToEvents}
                    style={{
                      ...styles.actionButton,
                      ...styles.primaryButton
                    }}
                  >
                    Back to Events
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={styles.loading}>Event not found</div>
        )}
      </div>
    </div>
  );
};

export default JoinEvent;