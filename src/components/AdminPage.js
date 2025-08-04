import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { QRCodeCanvas } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
import AddEventModal from './AddEventModal';
import Sidebar from '../components/Sidebar';

const AdminPage = ({ 
  onSignOut, 
  userData, 
  sidebarVisible, 
  setSidebarVisible,
  darkMode,
  toggleDarkMode
}) => {
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState({});
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [showRegistrations, setShowRegistrations] = useState(false);
  const [loading, setLoading] = useState(true);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAddEventForm, setShowAddEventForm] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [organizerMissing, setOrganizerMissing] = useState(false);
  const [newEvent, setNewEvent] = useState({
    name: '',
    date: '',
    time: '',
    place: '',
    description: ''
  });
  const navigate = useNavigate();

  const API_BASE_URL = 'http://localhost:8080';

  const formatTime = (timeString) => {
    if (!timeString) return '';
    
    try {
      const time = typeof timeString === 'string' ? timeString : String(timeString);
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    } catch (e) {
      console.error('Error formatting time:', e);
      return timeString;
    }
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
      console.error('Error formatting date:', e);
      return dateString;
    }
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return '';
    
    try {
      const date = new Date(dateTimeString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.error('Error formatting datetime:', e);
      return dateTimeString;
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(`${API_BASE_URL}/api/events/my-events`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200 && response.data) {
        setEvents(response.data);
        setError(null);
      } else {
        throw new Error('No events data received');
      }
    } catch (err) {
      console.error('Error fetching events:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });

      if (err.response?.status === 401) {
        setError('Session expired. Please sign in again.');
        setTimeout(() => onSignOut(), 2000);
      } else {
        setError(err.response?.data?.message || 'Failed to fetch events');
      }
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEventRegistrations = async (eventId) => {
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(`${API_BASE_URL}/api/registrations/event/${eventId}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200) {
        setRegistrations(prev => ({
          ...prev,
          [eventId]: response.data
        }));
      }
    } catch (err) {
      console.error('Error fetching event registrations:', err);
      setError('Failed to fetch registrations');
    }
  };

  const handleToggleApproval = async (registrationId, eventId, currentStatus) => {
    try {
      setGlobalLoading(true);
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Toggle between APPROVED and PENDING
      const newStatus = currentStatus === 'APPROVED' ? 'PENDING' : 'APPROVED';
      const endpoint = newStatus === 'APPROVED' ? 'approve' : 'unapprove';

      await axios.post(
        `${API_BASE_URL}/api/registrations/${endpoint}/${registrationId}`,
        {},
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Refresh registrations for this event
      await fetchEventRegistrations(eventId);
      
      // Show success message
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 3000);
      
    } catch (err) {
      console.error('Error toggling registration approval:', err);
      setError('Failed to update registration status');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleDisapproveRegistration = async (registrationId, eventId) => {
    if (!window.confirm('Are you sure you want to disapprove this registration? This will prevent the user from attending the event.')) {
      return;
    }

    try {
      setGlobalLoading(true);
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      await axios.post(
        `${API_BASE_URL}/api/registrations/disapprove/${registrationId}`,
        {},
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Refresh registrations for this event
      await fetchEventRegistrations(eventId);
      
    } catch (err) {
      console.error('Error disapproving registration:', err);
      setError('Failed to disapprove registration');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleShowRegistrations = async (eventId) => {
    setSelectedEventId(eventId);
    setShowRegistrations(true);
    await fetchEventRegistrations(eventId);
  };

  const createOrganizerProfile = async () => {
    try {
      setGlobalLoading(true);
      setError(null);
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await axios.post(
        `${API_BASE_URL}/api/organizers/create-for-admin`,
        {},
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000
        }
      );
      
      console.log('Organizer profile created:', response.data);
      setOrganizerMissing(false);
      await fetchEvents();
    } catch (err) {
      console.error('Failed to create organizer:', err);
      setError('Failed to create organizer profile: ' + (err.response?.data?.message || err.message));
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEvent(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    setError(null);

    if (!newEvent.name || !newEvent.date || !newEvent.time || !newEvent.place) {
      setError("Please fill all required fields");
      return;
    }

    try {
      setGlobalLoading(true);
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      await axios.post(
        `${API_BASE_URL}/api/events`,
        {
          name: newEvent.name,
          date: newEvent.date,
          time: newEvent.time,
          place: newEvent.place,
          description: newEvent.description || ""
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      
      setShowAddEventForm(false);
      setShowSuccessPopup(true);
      setNewEvent({
        name: '',
        date: '',
        time: '',
        place: '',
        description: ''
      });
      
      setTimeout(() => {
        setShowSuccessPopup(false);
      }, 3000);
      
      await fetchEvents();
    } catch (err) {
      console.error('Failed to add event:', err);
      if (err.response?.status === 401) {
        setError('Authentication failed. Please sign in again.');
        setTimeout(() => {
          onSignOut();
        }, 2000);
      } else {
        setError(
          err.response?.data?.message || 
          err.response?.data?.error || 
          'Failed to create event'
        );
      }
    } finally {
      setGlobalLoading(false);
    }
  };

  const deleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      setGlobalLoading(true);
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      await axios.delete(
        `${API_BASE_URL}/api/events/${eventId}`,
        { 
          headers: { 'Authorization': `Bearer ${token}` },
          timeout: 10000
        }
      );
      
      setEvents(events.filter(event => event.id !== eventId));
    } catch (err) {
      console.error('Failed to delete event:', err);
      if (err.response?.status === 401) {
        setError('Authentication failed. Please sign in again.');
        setTimeout(() => {
          onSignOut();
        }, 2000);
      } else {
        setError(
          err.response?.data?.message || 
          'Failed to delete event. Please try again.'
        );
      }
    } finally {
      setGlobalLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

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
      minHeight: "calc(100vh - 60px)",
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
      gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
      gap: "2rem",
      margin: "2rem 0"
    },
    card: {
      backgroundColor: darkMode ? "#1e1e1e" : "white",
      borderRadius: "10px",
      padding: "2rem",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      textAlign: "center",
      transition: "transform 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease",
      ":hover": {
        transform: "translateY(-5px)",
        boxShadow: "0 6px 12px rgba(0, 0, 0, 0.15)"
      },
      color: darkMode ? "#ffffff" : "#000000",
    },
    eventCard: {
      backgroundColor: darkMode ? "#1e1e1e" : "white",
      borderRadius: "10px",
      padding: "1.5rem",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      transition: "transform 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease",
      ":hover": {
        transform: "translateY(-5px)",
        boxShadow: "0 6px 12px rgba(0, 0, 0, 0.15)"
      },
      color: darkMode ? "#ffffff" : "#000000",
    },
    eventHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "1rem"
    },
    eventTitle: {
      color: darkMode ? "#ffffff" : "#2c3e50",
      fontSize: "1.5rem",
      margin: 0
    },
    eventDetail: {
      color: darkMode ? "#b0b0b0" : "#7f8c8d",
      marginBottom: "0.75rem",
      fontSize: "1rem",
      textAlign: "left"
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
      backgroundColor: darkMode ? "#2196F3" : "#3498db",
      color: "white",
      padding: "0.75rem 1.5rem",
      borderRadius: "6px",
      textDecoration: "none",
      fontWeight: "600",
      transition: "background-color 0.3s ease",
      ":hover": {
        backgroundColor: darkMode ? "#1976D2" : "#2980b9"
      },
      border: "none",
      cursor: "pointer",
      fontSize: "1rem",
      ":disabled": {
        backgroundColor: darkMode ? "#757575" : "#95a5a6",
        cursor: "not-allowed"
      }
    },
    deleteButton: {
      backgroundColor: "#e74c3c",
      color: "white",
      padding: "0.5rem 1rem",
      borderRadius: "4px",
      border: "none",
      cursor: "pointer",
      fontWeight: "500",
      ":hover": {
        backgroundColor: "#c0392b"
      }
    },
    registrationsButton: {
      backgroundColor: darkMode ? "#FF9800" : "#f39c12",
      color: "white",
      padding: "0.5rem 1rem",
      borderRadius: "4px",
      border: "none",
      cursor: "pointer",
      fontWeight: "500",
      marginRight: "0.5rem",
      ":hover": {
        backgroundColor: darkMode ? "#F57C00" : "#e67e22"
      }
    },
    approveButton: {
      backgroundColor: "#27ae60",
      color: "white",
      padding: "0.4rem 0.8rem",
      borderRadius: "4px",
      border: "none",
      cursor: "pointer",
      fontWeight: "500",
      fontSize: "0.9rem",
      marginRight: "0.5rem",
      ":hover": {
        backgroundColor: "#2ecc71"
      }
    },
    unapproveButton: {
      backgroundColor: "#f39c12",
      color: "white",
      padding: "0.4rem 0.8rem",
      borderRadius: "4px",
      border: "none",
      cursor: "pointer",
      fontWeight: "500",
      fontSize: "0.9rem",
      marginRight: "0.5rem",
      ":hover": {
        backgroundColor: "#e67e22"
      }
    },
    toggleButton: {
      padding: "0.4rem 0.8rem",
      borderRadius: "4px",
      border: "none",
      cursor: "pointer",
      fontWeight: "500",
      fontSize: "0.9rem",
      marginRight: "0.5rem",
      transition: "background-color 0.3s ease"
    },
    disapproveButton: {
      backgroundColor: "#e74c3c",
      color: "white",
      padding: "0.4rem 0.8rem",
      borderRadius: "4px",
      border: "none",
      cursor: "pointer",
      fontWeight: "500",
      fontSize: "0.9rem",
      ":hover": {
        backgroundColor: "#c0392b"
      }
    },
    registrationsList: {
      maxHeight: "400px",
      overflowY: "auto",
      marginTop: "1rem"
    },
    registrationItem: {
      backgroundColor: darkMode ? "#2a2a2a" : "#f8f9fa",
      padding: "1rem",
      marginBottom: "0.5rem",
      borderRadius: "6px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    },
    registrationInfo: {
      flex: 1
    },
    registrationName: {
      fontWeight: "600",
      marginBottom: "0.25rem",
      color: darkMode ? "#ffffff" : "#2c3e50"
    },
    registrationEmail: {
      fontSize: "0.9rem",
      color: darkMode ? "#b0b0b0" : "#7f8c8d",
      marginBottom: "0.25rem"
    },
    registrationDate: {
      fontSize: "0.8rem",
      color: darkMode ? "#888" : "#95a5a6"
    },
    registrationActions: {
      display: "flex",
      gap: "0.5rem"
    },
    modal: {
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
    modalContent: {
      backgroundColor: darkMode ? "#1e1e1e" : "white",
      padding: "2rem",
      borderRadius: "10px",
      maxWidth: "600px",
      width: "90%",
      maxHeight: "80vh",
      overflowY: "auto",
      color: darkMode ? "#ffffff" : "#000000"
    },
    modalHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "1.5rem"
    },
    modalTitle: {
      fontSize: "1.5rem",
      color: darkMode ? "#ffffff" : "#2c3e50",
      margin: 0
    },
    closeButton: {
      backgroundColor: "transparent",
      border: "none",
      fontSize: "1.5rem",
      cursor: "pointer",
      color: darkMode ? "#ffffff" : "#000000"
    },
    qrSection: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      marginTop: "1.5rem"
    },
    qrContainer: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      marginBottom: "1rem"
    },
    qrLabel: {
      fontSize: "0.9rem",
      color: darkMode ? "#b0b0b0" : "#7f8c8d",
      marginTop: "0.5rem"
    },
    qrCodeSection: {
      width: "100%",
      marginTop: "1rem"
    },
    qrCodeLabel: {
      fontSize: "0.9rem",
      fontWeight: "500",
      color: darkMode ? "#b0b0b0" : "#7f8c8d",
      marginBottom: "0.5rem"
    },
    qrCodeData: {
      backgroundColor: darkMode ? "#2a2a2a" : "#f8f9fa",
      padding: "0.75rem",
      borderRadius: "6px",
      overflowX: "auto",
      wordBreak: "break-all",
      fontSize: "0.8rem",
      color: darkMode ? "#ffffff" : "#000000"
    },
    footer: {
      textAlign: "center",
      marginTop: "auto",
      padding: "1rem",
      color: darkMode ? "#b0b0b0" : "#7f8c8d",
      borderTop: darkMode ? "1px solid #333" : "1px solid #eee"
    },
    loadingOverlay: {
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
    loadingContent: {
      backgroundColor: darkMode ? "#1e1e1e" : "white",
      padding: "2rem",
      borderRadius: "8px",
      textAlign: "center",
      color: darkMode ? "#ffffff" : "#000000"
    },
    successNotification: {
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 2000,
      animation: 'slideInRight 0.3s ease-out',
    },
    successNotificationContent: {
      backgroundColor: darkMode ? '#2e7d32' : '#2ecc71',
      color: 'white',
      padding: '1rem 1.5rem',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      minWidth: '280px',
    },
    successIcon: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: '50%',
      width: '30px',
      height: '30px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    successNotificationText: {
      fontSize: '1rem',
      fontWeight: '500',
      margin: 0,
      flex: 1,
    }
  };

  const token = localStorage.getItem('authToken');
  if (!token) {
    return (
      <div style={styles.container}>
        <Sidebar 
          onSignOut={onSignOut}
          sidebarVisible={sidebarVisible}
          setSidebarVisible={setSidebarVisible}
          userData={userData}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
        />
        <div style={{
          ...styles.mainContent,
          marginLeft: sidebarVisible ? '250px' : '0'
        }}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Authentication Required</h2>
            <p style={styles.cardText}>Please sign in to access your events.</p>
            <button 
              onClick={onSignOut}
              style={styles.cardButton}
            >
              Go to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={{
        ...styles.container,
        filter: showAddEventForm ? 'blur(2px)' : 'none',
        transition: 'filter 0.3s ease',
      }}>
        <Sidebar 
          onSignOut={onSignOut}
          sidebarVisible={sidebarVisible}
          setSidebarVisible={setSidebarVisible}
          userData={userData}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
        />

        <div style={{
          ...styles.mainContent,
          marginLeft: sidebarVisible ? '250px' : '0'
        }}>
          <div style={styles.header}>
            <h1 style={styles.title}>Admin Dashboard</h1>
            <p style={styles.subtitle}>Welcome back, {userData?.firstName} {userData?.lastName}</p>
          </div>

          <div style={styles.content}>
            {organizerMissing ? (
              <div style={styles.card}>
                <h2 style={styles.cardTitle}>Organizer Profile Required</h2>
                <p style={styles.cardText}>
                  You need an organizer profile to create and manage events.
                </p>
                <button 
                  onClick={createOrganizerProfile}
                  style={styles.cardButton}
                  disabled={globalLoading}
                >
                  {globalLoading ? 'Creating...' : 'Create Organizer Profile'}
                </button>
                {error && <p style={{ color: '#e74c3c', marginTop: '1rem' }}>{error}</p>}
              </div>
            ) : (
              <>
                <div style={styles.card}>
                  <h2 style={styles.cardTitle}>Event Management</h2>
                  <p style={styles.cardText}>Create and manage your events</p>
                  
                  <button 
                    onClick={() => setShowAddEventForm(true)}
                    style={styles.cardButton}
                    disabled={globalLoading}
                  >
                    {globalLoading ? 'Processing...' : 'Add New Event'}
                  </button>
                </div>

                {loading ? (
                  <div style={styles.card}>
                    <h2 style={styles.cardTitle}>Loading Events</h2>
                    <p style={styles.cardText}>Please wait while we load your events...</p>
                  </div>
                ) : error ? (
                  <div style={styles.card}>
                    <h2 style={styles.cardTitle}>Error Loading Events</h2>
                    <p style={{ ...styles.cardText, color: '#e74c3c' }}>{error}</p>
                    <button 
                      onClick={fetchEvents}
                      style={styles.cardButton}
                      disabled={globalLoading}
                    >
                      Retry
                    </button>
                  </div>
                ) : events.length > 0 ? (
                  events.map(event => (
                    <div key={event.id} style={styles.eventCard}>
                      <div style={styles.eventHeader}>
                        <h2 style={styles.eventTitle}>{event.name}</h2>
                        <div>
                          <button 
                            onClick={() => handleShowRegistrations(event.id)}
                            style={styles.registrationsButton}
                            disabled={globalLoading}
                          >
                            View Registrations
                          </button>
                          <button 
                            onClick={() => deleteEvent(event.id)}
                            style={styles.deleteButton}
                            disabled={globalLoading}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <p style={styles.eventDetail}>Date: {formatDate(event.date)}</p>
                      <p style={styles.eventDetail}>Time: {formatTime(event.time)}</p>
                      <p style={styles.eventDetail}>Location: {event.place}</p>
                      {event.description && (
                        <p style={styles.eventDetail}>Description: {event.description}</p>
                      )}
                      
                      {event.qrCode && (
                        <div style={styles.qrSection}>
                          <div style={styles.qrContainer}>
                            <QRCodeCanvas 
                              value={event.qrCode} 
                              size={150}
                              level="H"
                              includeMargin={true}
                              bgColor={darkMode ? "#1e1e1e" : "#ffffff"}
                              fgColor={darkMode ? "#ffffff" : "#000000"}
                            />
                            <p style={styles.qrLabel}>Scan to check in</p>
                          </div>
                          <div style={styles.qrCodeSection}>
                            <p style={styles.qrCodeLabel}>QR Code Data:</p>
                            <div style={styles.qrCodeData}>
                              <code>{event.qrCode}</code>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div style={styles.card}>
                    <h2 style={styles.cardTitle}>No Events Found</h2>
                    <p style={styles.cardText}>You haven't created any events yet.</p>
                  </div>
                )}
              </>
            )}
          </div>

          <div style={styles.footer}>
            <p>© {new Date().getFullYear()} Attendance App</p>
          </div>
        </div>
      </div>

      {globalLoading && (
        <div style={styles.loadingOverlay}>
          <div style={styles.loadingContent}>
            <div className="spinner"></div>
            <p>Processing your request...</p>
          </div>
        </div>
      )}

      {showSuccessPopup && (
        <div style={styles.successNotification}>
          <div style={styles.successNotificationContent}>
            <div style={styles.successIcon}>✓</div>
            <p style={styles.successNotificationText}>Operation Completed Successfully!</p>
          </div>
        </div>
      )}

      {/* Registrations Modal */}
      {showRegistrations && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Event Registrations</h2>
              <button 
                style={styles.closeButton}
                onClick={() => setShowRegistrations(false)}
              >
                ×
              </button>
            </div>
            
            <div style={styles.registrationsList}>
              {registrations[selectedEventId] && registrations[selectedEventId].length > 0 ? (
                registrations[selectedEventId].map(registration => (
                  <div key={registration.id} style={styles.registrationItem}>
                    <div style={styles.registrationInfo}>
                      <div style={styles.registrationName}>
                        {registration.userName}
                      </div>
                      <div style={styles.registrationEmail}>
                        {registration.userEmail}
                      </div>
                      <div style={styles.registrationDate}>
                        Registered: {formatDateTime(registration.registrationDate)}
                      </div>
                      {registration.status && (
                        <div style={{
                          fontSize: "0.9rem",
                          fontWeight: "600",
                          marginTop: "0.25rem",
                          color: registration.status === 'APPROVED' ? '#27ae60' : 
                                registration.status === 'DISAPPROVED' ? '#e74c3c' : '#f39c12'
                        }}>
                          Status: {registration.status}
                        </div>
                      )}
                    </div>
                    <div style={styles.registrationActions}>
                      {registration.status !== 'DISAPPROVED' && (
                        <button
                          style={{
                            ...styles.toggleButton,
                            backgroundColor: registration.status === 'APPROVED' ? '#f39c12' : '#27ae60',
                            color: 'white'
                          }}
                          onClick={() => handleToggleApproval(registration.id, selectedEventId, registration.status)}
                          disabled={globalLoading}
                        >
                          {registration.status === 'APPROVED' ? 'Unapprove' : 'Approve'}
                        </button>
                      )}
                      {registration.status !== 'DISAPPROVED' && (
                        <button
                          style={styles.disapproveButton}
                          onClick={() => handleDisapproveRegistration(registration.id, selectedEventId)}
                          disabled={globalLoading}
                        >
                          Disapprove
                        </button>
                      )}
                      {registration.status === 'DISAPPROVED' && (
                        <button
                          style={{
                            ...styles.toggleButton,
                            backgroundColor: '#27ae60',
                            color: 'white'
                          }}
                          onClick={() => handleToggleApproval(registration.id, selectedEventId, registration.status)}
                          disabled={globalLoading}
                        >
                          Approve
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div style={styles.card}>
                  <p style={styles.cardText}>No registrations found for this event.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <AddEventModal
        show={showAddEventForm}
        onClose={() => setShowAddEventForm(false)}
        newEvent={newEvent}
        handleInputChange={handleInputChange}
        handleAddEvent={handleAddEvent}
        loading={globalLoading}
        error={error}
        darkMode={darkMode}
      />
    </>
  );
};

export default AdminPage;