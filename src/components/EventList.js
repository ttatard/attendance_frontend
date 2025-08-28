import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "../components/Sidebar";

const EventList = ({ userType, userData, onSignOut, sidebarVisible, setSidebarVisible, darkMode }) => {
  // State management
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [registeredEvents, setRegisteredEvents] = useState(new Set());
  const [registrationStatuses, setRegistrationStatuses] = useState({});
  const [registrationLoading, setRegistrationLoading] = useState(null);
  const [unregistrationLoading, setUnregistrationLoading] = useState(null);
  const navigate = useNavigate();

  // Filter out past events
  const filterPastEvents = (eventsList) => {
    const currentDateTime = new Date();
    return eventsList.filter(event => {
      const eventDate = new Date(event.date);
      const eventTime = event.time ? event.time.split(':') : [0, 0];
      eventDate.setHours(parseInt(eventTime[0]), parseInt(eventTime[1] || 0), 0, 0);
      
      // Keep events that are in the future or today with future time
      return eventDate >= currentDateTime;
    });
  };

  // Fetch events and registrations
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) throw new Error('Authentication token not found');

        // Verify user enrollment status first
        const userResponse = await axios.get('http://localhost:8080/api/users/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('User data:', userResponse.data);
        
        // Check both possible property names for organizations
        const enrolledOrg = userResponse.data.enrolledOrganizations || 
                           userResponse.data.enrolledOrganization;
        
        if (!enrolledOrg || (Array.isArray(enrolledOrg) && enrolledOrg.length === 0)) {
          console.log('User not enrolled in any organization');
          setEvents([]);
          setLoading(false);
          return;
        }

        // Fetch events (backend filters by organization)
        const response = await axios.get('http://localhost:8080/api/events', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('Events data:', response.data);
        
        // Filter out past events before setting state
        const filteredEvents = filterPastEvents(response.data);
        setEvents(filteredEvents);
        
        // Check registration status for each event
        if (filteredEvents.length > 0) {
          try {
            const registrationsResponse = await axios.get(
              'http://localhost:8080/api/registrations/my-registrations',
              { headers: { 'Authorization': `Bearer ${token}` } }
            );
            
            console.log('Registrations data:', registrationsResponse.data);
            
            // Get all event IDs where user has any registration (approved or pending)
            const registeredEventIds = new Set();
            const statusMap = {};
            
            registrationsResponse.data.forEach(reg => {
              registeredEventIds.add(reg.eventId);
              statusMap[reg.eventId] = {
                status: reg.status,
                uniqueCode: reg.uniqueCode
              };
            });
            
            console.log('Registered event IDs:', Array.from(registeredEventIds));
            console.log('Status map:', statusMap);
            
            setRegisteredEvents(registeredEventIds);
            setRegistrationStatuses(statusMap);
          } catch (regError) {
            console.warn('Could not fetch user registrations:', regError);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError(err.response?.data?.message || err.message || 'Failed to fetch events');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const checkRegistrationStatus = async (eventId) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(
        `http://localhost:8080/api/registrations/check/${eventId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Status check error:', error);
      return null;
    }
  };

  // Event action handlers
  const handleViewDetails = (event) => {
    setSelectedEvent(event);
  };

  const handleCloseDetails = () => {
    setSelectedEvent(null);
  };

  const handlePreRegister = async (event) => {
    const status = await checkRegistrationStatus(event.id);
    if (status?.isRegistered) {
      alert(`You are already ${status.status.toLowerCase()} for this event`);
      return;
    }
    if (!verifyOrganizationMatch(event)) return;
    
    setRegistrationLoading(event.id);
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(
        `http://localhost:8080/api/registrations/pre-register/${event.id}`, 
        {}, 
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      console.log('Registration response:', response.data);

      if ([200, 201].includes(response.status)) {
        const responseData = response.data;
        
        // Use event.id instead of responseData.eventId
        const registeredEventId = event.id;
        
        setRegisteredEvents(prev => new Set([...prev, registeredEventId]));
        setRegistrationStatuses(prev => ({
          ...prev,
          [registeredEventId]: {
            status: responseData.status || 'PENDING',
            uniqueCode: responseData.uniqueCode
          }
        }));
        
        if (responseData.isApproved) {
          alert(`Successfully registered for "${event.name}"! Your unique code is: ${responseData.uniqueCode}`);
        } else {
          alert(responseData.message || `Registration request sent for "${event.name}". Awaiting approval. Your code is: ${responseData.uniqueCode}`);
        }
      }
    } catch (err) {
      console.error('Registration error:', err.response?.data || err.message);
      alert(err.response?.data?.message || err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setRegistrationLoading(null);
    }
  };

  const handleUnregister = async (event) => {
    if (!window.confirm(`Unregister from "${event.name}"?`)) return;
    
    setUnregistrationLoading(event.id);
    try {
      const token = localStorage.getItem('authToken');
      console.log('Unregistering from event:', event.id);
      
      const response = await axios.post(
        `http://localhost:8080/api/registrations/cancel/${event.id}`, 
        {}, // empty body
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      console.log('Unregistration successful:', response.data);
      
      setRegisteredEvents(prev => {
        const updated = new Set(prev);
        updated.delete(event.id);
        return updated;
      });
      
      setRegistrationStatuses(prev => {
        const updated = { ...prev };
        delete updated[event.id];
        return updated;
      });
      
      alert(`Unregistered from "${event.name}"`);
    } catch (err) {
      console.error('Unregistration error details:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
      
      let errorMsg = 'Unregistration failed. Please try again.';
      
      if (err.response?.data?.error === 'You are not registered for this event') {
        errorMsg = 'You are not registered for this event.';
        // Update UI to reflect this
        setRegisteredEvents(prev => {
          const updated = new Set(prev);
          updated.delete(event.id);
          return updated;
        });
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      }
      
      alert(errorMsg);
    } finally {
      setUnregistrationLoading(null);
    }
  };

  // Helper functions
  const verifyOrganizationMatch = (event) => {
    // Check both possible property names
    const userOrgId = userData?.enrolledOrganization?.id || 
                      userData?.enrolledOrganizations?.[0]?.id;
    
    const eventOrgId = event.organizerId || event.organizer?.id;
    
    console.log('Organization verification DEBUG:', { 
      userOrgId, 
      eventOrgId, 
      eventName: event.name,
      userData: userData,
      eventOrganizer: event.organizer 
    });
    
    // If user has no organization, allow access (might be needed for some cases)
    if (!userOrgId) {
      console.warn('User not enrolled in any organization, but allowing access for now');
      return true;
    }
    
    // If event has no organization info, allow access
    if (!eventOrgId) {
      console.warn('Event missing organization ID, allowing access');
      return true;
    }
    
    // Check if organizations match
    if (userOrgId.toString() !== eventOrgId.toString()) {
      alert(`Access denied: This event belongs to ${event.organizerName || 'another organization'}`);
      return false;
    }
    
    return true;
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatPrice = (isFree, price) => {
    return isFree ? 'FREE' : `₱${parseFloat(price).toFixed(2)}`;
  };

  const isEventToday = (eventDate) => {
    const today = new Date();
    const eventDay = new Date(eventDate);
    return today.toDateString() === eventDay.toDateString();
  };

  const getEventLocation = (event) => {
    if (event.isOnline) {
      return isEventToday(event.date) ? (
        <div>
          <p><strong>Online Event</strong></p>
          {event.meetingUrl && (
            <p>
              <a href={event.meetingUrl} target="_blank" rel="noopener noreferrer">
                Join Meeting
              </a>
            </p>
          )}
        </div>
      ) : (
        <p><strong>Online Event</strong></p>
      );
    }
    return <p><strong>Location:</strong> {event.place}</p>;
  };

  const getButtonState = (event) => {
    const isRegistered = registeredEvents.has(event.id);
    
    if (isRegistered) {
      return {
        showPreRegister: false,
        showUnregister: true
      };
    } else {
      return {
        showPreRegister: true,
        showUnregister: false
      };
    }
  };

  // Styles
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
      gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
      gap: "2rem",
      margin: "2rem 0"
    },
    eventCard: {
      backgroundColor: darkMode ? "#1e1e1e" : "white",
      borderRadius: "10px",
      padding: "1.5rem",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      transition: "transform 0.3s ease, box-shadow 0.3s ease",
      position: "relative",
      ":hover": {
        transform: "translateY(-5px)",
        boxShadow: "0 6px 12px rgba(0, 0, 0, 0.15)"
      },
      border: darkMode ? "1px solid #333" : "1px solid #eee"
    },
    eventHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "1rem",
      position: "relative"
    },
    eventTitle: {
      color: darkMode ? "#ffffff" : "#2c3e50",
      fontSize: "1.5rem",
      margin: 0,
      flex: 1,
      paddingRight: "1rem"
    },
    priceTag: {
      backgroundColor: "#e74c3c",
      color: "white",
      padding: "0.5rem 1rem",
      borderRadius: "20px",
      fontSize: "0.9rem",
      fontWeight: "600",
      flexShrink: 0
    },
    freePriceTag: {
      backgroundColor: "#2ecc71",
      color: "white",
      padding: "0.5rem 1rem",
      borderRadius: "20px",
      fontSize: "0.9rem",
      fontWeight: "600",
      flexShrink: 0
    },
    eventDetail: {
      color: darkMode ? "#b0b0b0" : "#7f8c8d",
      marginBottom: "0.75rem",
      fontSize: "1rem",
      textAlign: "left"
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
      border: "none",
      cursor: "pointer",
      fontSize: "1rem",
      width: "100%",
      textAlign: "center",
      marginBottom: "0.5rem"
    },
    preRegisterButton: {
      backgroundColor: "#f39c12",
      ":hover": {
        backgroundColor: "#e67e22"
      }
    },
    unregisterButton: {
      backgroundColor: "#e74c3c",
      ":hover": {
        backgroundColor: "#c0392b"
      }
    },
    disabledButton: {
      backgroundColor: darkMode ? "#424242" : "#bdc3c7",
      cursor: "not-allowed",
      ":hover": {
        backgroundColor: darkMode ? "#424242" : "#bdc3c7"
      }
    },
    registeredBadge: {
      color: "white",
      padding: "0.25rem 0.75rem",
      borderRadius: "15px",
      fontSize: "0.8rem",
      fontWeight: "600",
      position: "absolute",
      top: "-0.5rem",
      right: "1rem"
    },
    codeDisplay: {
      fontSize: '0.7rem',
      marginTop: '0.25rem',
      fontWeight: 'bold',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      padding: '0.2rem 0.4rem',
      borderRadius: '3px',
      textAlign: 'center'
    },
    footer: {
      textAlign: "center",
      marginTop: "auto",
      padding: "1rem",
      color: darkMode ? "#b0b0b0" : "#7f8c8d",
      borderTop: darkMode ? "1px solid #333" : "1px solid #eee"
    },
    loading: {
      textAlign: "center",
      padding: "2rem",
      color: darkMode ? "#b0b0b0" : "#7f8c8d",
      fontSize: "1.2rem",
      gridColumn: "1 / -1"
    },
    error: {
      textAlign: "center",
      padding: "2rem",
      color: "#e74c3c",
      fontSize: "1.2rem",
      gridColumn: "1 / -1"
    },
    noEvents: {
      textAlign: "center",
      padding: "3rem",
      backgroundColor: darkMode ? "#1e1e1e" : "white",
      borderRadius: "10px",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      color: darkMode ? "#ffffff" : "#000000",
      gridColumn: "1 / -1",
      maxWidth: "800px",
      margin: "0 auto",
      border: darkMode ? "1px solid #333" : "1px solid #eee"
    },
    buttonGroup: {
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem",
      marginTop: "1rem"
    },
    statusText: {
      fontSize: "0.9rem",
      color: darkMode ? "#b0b0b0" : "#7f8c8d",
      textAlign: "center",
      marginTop: "0.5rem",
      fontStyle: "italic"
    },
    meetingLink: {
      color: darkMode ? "#64b5f6" : "#1976d2",
      textDecoration: "underline",
      wordBreak: "break-all"
    },
    detailCodeDisplay: {
      backgroundColor: darkMode ? "#2a2a2a" : "#f0f0f0",
      padding: "0.5rem",
      borderRadius: "4px",
      fontSize: "0.9rem",
      fontWeight: "bold",
      textAlign: "center",
      marginTop: "0.5rem",
      color: darkMode ? "#ffffff" : "#000000"
    },
    headerBadges: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      flexWrap: "wrap",
      justifyContent: "flex-end"
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

      <div style={{
        ...styles.mainContent,
        marginLeft: sidebarVisible ? '250px' : '0'
      }}>
        <div style={styles.header}>
          <h1 style={styles.title}>
            {userData?.enrolledOrganization 
              ? `${userData.enrolledOrganization.organizationName} Events`
              : "Organization Events"}
          </h1>
          <p style={styles.subtitle}>
            {userData?.enrolledOrganization 
              ? "Browse and register for upcoming events in your organization"
              : "You must be enrolled in an organization to view events"}
          </p>
        </div>

        <div style={styles.content}>
          {loading ? (
            <div style={styles.loading}>Loading events...</div>
          ) : error ? (
            <div style={styles.error}>Error: {error}</div>
          ) : (
            <>
              {events.length === 0 ? (
                <div style={styles.noEvents}>
                  {userData?.enrolledOrganization ? (
                    <>
                      <p>No upcoming events in {userData.enrolledOrganization.organizationName}.</p>
                      <p>Check back later for new events!</p>
                      {userType === 'ADMIN' && (
                        <button 
                          style={styles.cardButton}
                          onClick={() => navigate('/create-event')}
                        >
                          Create New Event
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <p>You are not enrolled in any organization.</p>
                      <p>Please contact your administrator for access.</p>
                      {userType === 'ADMIN' && (
                        <button 
                          style={styles.cardButton}
                          onClick={() => navigate('/organizations')}
                        >
                          Manage Organizations
                        </button>
                      )}
                    </>
                  )}
                </div>
              ) : (
                events.map(event => {
                  const buttonState = getButtonState(event);
                  const isRegistered = registeredEvents.has(event.id);
                  const status = registrationStatuses[event.id]?.status;
                  const uniqueCode = registrationStatuses[event.id]?.uniqueCode;
                  
                  return (
                    <div key={event.id} style={styles.eventCard}>
                      <div style={styles.eventHeader}>
                        <h2 style={styles.eventTitle}>{event.name}</h2>
                        <div style={styles.headerBadges}>
                          {isRegistered && (
                            <div style={{
                              ...styles.registeredBadge,
                              backgroundColor: status === 'APPROVED' ? '#2ecc71' : '#f39c12',
                              position: 'relative',
                              top: 0,
                              right: 0
                            }}>
                              {status === 'APPROVED' ? 'Registered' : 'Pending'}
                              {status === 'APPROVED' && uniqueCode && (
                                <div style={styles.codeDisplay}>
                                  Code: {uniqueCode}
                                </div>
                              )}
                            </div>
                          )}
                          <div style={event.isFree ? styles.freePriceTag : styles.priceTag}>
                            {formatPrice(event.isFree, event.price)}
                          </div>
                        </div>
                      </div>
                      
                      <p style={styles.eventDetail}>
                        <strong>Organization:</strong> {event.organizerName}
                      </p>
                      
                      <p style={styles.eventDetail}>
                        <strong>Date:</strong> {formatDate(event.date)}
                      </p>
                      <p style={styles.eventDetail}>
                        <strong>Time:</strong> {formatTime(event.time)}
                      </p>
                      <div style={styles.eventDetail}>
                        {getEventLocation(event)}
                      </div>
                      {event.description && (
                        <p style={styles.eventDetail}>
                          <strong>Description:</strong> {event.description}
                        </p>
                      )}
                      
                      <div style={styles.buttonGroup}>
                        <button 
                          onClick={() => handleViewDetails(event)}
                          style={styles.cardButton}
                        >
                          View Details
                        </button>
                        
                        {buttonState.showPreRegister && (
                          <>
                            <button 
                              onClick={() => handlePreRegister(event)}
                              style={{
                                ...styles.cardButton, 
                                ...styles.preRegisterButton,
                                ...(registrationLoading === event.id ? styles.disabledButton : {})
                              }}
                              disabled={registrationLoading === event.id}
                            >
                              {registrationLoading === event.id ? 'Registering...' : 'Register'}
                            </button>
                            <div style={styles.statusText}>
                              Register to join this event
                            </div>
                          </>
                        )}
                        
                        {buttonState.showUnregister && (
                          <button 
                            onClick={() => handleUnregister(event)}
                            style={{
                              ...styles.cardButton, 
                              ...styles.unregisterButton,
                              ...(unregistrationLoading === event.id ? styles.disabledButton : {})
                            }}
                            disabled={unregistrationLoading === event.id}
                          >
                            {unregistrationLoading === event.id ? 'Unregistering...' : 'Unregister'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>

        {selectedEvent && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: darkMode ? '#1e1e1e' : 'white',
              padding: '2rem',
              borderRadius: '10px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
              color: darkMode ? '#ffffff' : '#000000'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem'
              }}>
                <h2 style={{ margin: 0, fontSize: '1.8rem' }}>{selectedEvent.name}</h2>
                <button 
                  onClick={handleCloseDetails}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    color: darkMode ? '#ffffff' : '#7f8c8d'
                  }}
                >
                  ×
                </button>
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
                  gap: '1rem',
                  flexWrap: 'wrap'
                }}>
                  <div style={selectedEvent.isFree ? styles.freePriceTag : styles.priceTag}>
                    {formatPrice(selectedEvent.isFree, selectedEvent.price)}
                  </div>
                  {registeredEvents.has(selectedEvent.id) && (
                    <div style={{
                      ...styles.registeredBadge,
                      backgroundColor: registrationStatuses[selectedEvent.id]?.status === 'APPROVED' ? '#2ecc71' : '#f39c12',
                      position: 'relative',
                      top: 0,
                      right: 0
                    }}>
                      {registrationStatuses[selectedEvent.id]?.status === 'APPROVED' ? 'Registered' : 'Pending Approval'}
                    </div>
                  )}
                </div>
                
                <p style={styles.eventDetail}>
                  <strong>Organization:</strong> {selectedEvent.organizerName}
                </p>
                
                <p style={styles.eventDetail}>
                  <strong>Date:</strong> {formatDate(selectedEvent.date)}
                </p>
                <p style={styles.eventDetail}>
                  <strong>Time:</strong> {formatTime(selectedEvent.time)}
                </p>
                <div style={styles.eventDetail}>
                  {selectedEvent.isOnline ? (
                    <>
                      <p><strong>Event Type:</strong> Online</p>
                      {isEventToday(selectedEvent.date) && selectedEvent.meetingUrl && (
                        <p>
                          <strong>Meeting Link:</strong>{' '}
                          <a 
                            href={selectedEvent.meetingUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={styles.meetingLink}
                          >
                            {selectedEvent.meetingUrl}
                          </a>
                        </p>
                      )}
                      {selectedEvent.meetingId && (
                        <p><strong>Meeting ID:</strong> {selectedEvent.meetingId}</p>
                      )}
                      {selectedEvent.meetingPasscode && (
                        <p><strong>Passcode:</strong> {selectedEvent.meetingPasscode}</p>
                      )}
                    </>
                  ) : (
                    <p><strong>Location:</strong> {selectedEvent.place}</p>
                  )}
                </div>
                {selectedEvent.description && (
                  <p style={styles.eventDetail}>
                    <strong>Description:</strong> {selectedEvent.description}
                  </p>
                )}
                
                {/* Show unique code in detail view */}
                {registeredEvents.has(selectedEvent.id) && registrationStatuses[selectedEvent.id]?.uniqueCode && (
                  <div style={styles.eventDetail}>
                    <strong>Your Check-in Code:</strong>
                    <div style={styles.detailCodeDisplay}>
                      {registrationStatuses[selectedEvent.id].uniqueCode}
                    </div>
                    <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', fontStyle: 'italic' }}>
                      Present this code to the event organizer for check-in
                    </p>
                  </div>
                )}
              </div>
              
              <div style={styles.buttonGroup}>
                {/* Calculate button state for the selected event */}
                {(() => {
                  const isRegistered = registeredEvents.has(selectedEvent.id);
                  
                  if (!isRegistered) {
                    return (
                      <button
                        onClick={() => {
                          handleCloseDetails();
                          handlePreRegister(selectedEvent);
                        }}
                        style={{
                          ...styles.cardButton,
                          ...styles.preRegisterButton,
                          width: '100%',
                          textAlign: 'center'
                        }}
                      >
                        Register
                      </button>
                    );
                  } else {
                    return (
                      <button
                        onClick={() => {
                          handleCloseDetails();
                          handleUnregister(selectedEvent);
                        }}
                        style={{
                          ...styles.cardButton,
                          ...styles.unregisterButton,
                          width: '100%',
                          textAlign: 'center'
                        }}
                      >
                        Unregister
                      </button>
                    );
                  }
                })()}
              </div>
            </div>
          </div>
        )}

        <div style={styles.footer}>
          <p>© {new Date().getFullYear()} Event Management System</p>
        </div>
      </div>
    </div>
  );
};

export default EventList;