import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "../components/Sidebar";

const EventList = ({ userType, userData, onSignOut, sidebarVisible, setSidebarVisible }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [registeredEvents, setRegisteredEvents] = useState(new Set());
  const [registrationLoading, setRegistrationLoading] = useState(null);
  const [unregistrationLoading, setUnregistrationLoading] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          throw new Error('Authentication token not found');
        }

        // Fetch all events
        const response = await axios.get('http://localhost:8080/api/events', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        setEvents(response.data);

        // Fetch user's registered events (you'll need to implement this endpoint)
        try {
          const registrationsResponse = await axios.get('http://localhost:8080/api/registrations/my-registrations', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          const registeredEventIds = new Set(registrationsResponse.data.map(reg => reg.eventId));
          setRegisteredEvents(registeredEventIds);
        } catch (regError) {
          console.warn('Could not fetch user registrations:', regError);
          // Continue without registration data
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError(err.response?.data?.message || err.message || 'Failed to fetch events');
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const handlePreRegister = async (event) => {
    setRegistrationLoading(event.id);
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(`http://localhost:8080/api/registrations/pre-register/${event.id}`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 200 || response.status === 201) {
        setRegisteredEvents(prev => new Set([...prev, event.id]));
        alert(`Successfully pre-registered for "${event.name}"!`);
      }
    } catch (err) {
      console.error('Pre-registration failed:', err);
      alert(err.response?.data?.message || 'Pre-registration failed. Please try again.');
    } finally {
      setRegistrationLoading(null);
    }
  };

  const handleUnregister = async (event) => {
    const confirmUnregister = window.confirm(`Are you sure you want to unregister from "${event.name}"?`);
    if (!confirmUnregister) return;

    setUnregistrationLoading(event.id);
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.delete(`http://localhost:8080/api/registrations/unregister/${event.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 200 || response.status === 204) {
        setRegisteredEvents(prev => {
          const newSet = new Set(prev);
          newSet.delete(event.id);
          return newSet;
        });
        alert(`Successfully unregistered from "${event.name}".`);
      }
    } catch (err) {
      console.error('Unregistration failed:', err);
      alert(err.response?.data?.message || 'Unregistration failed. Please try again.');
    } finally {
      setUnregistrationLoading(null);
    }
  };

  const handleJoinEvent = (event) => {
    // Navigate to QR scanner with both event ID and QR code
    navigate(`/qr-scanner`, { 
      state: { 
        eventId: event.id,
        eventName: event.name,
        eventQRCode: event.qrCode 
      } 
    });
  };

  const handleViewDetails = (event) => {
    setSelectedEvent(event);
  };

  const handleCloseDetails = () => {
    setSelectedEvent(null);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    
    const time = typeof timeString === 'string' ? timeString : String(timeString);
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatPrice = (isFree, price) => {
    if (isFree === undefined && price === undefined) {
      return 'FREE'; // Default for events without price info
    }
    if (isFree || !price || price === 0) {
      return 'FREE';
    }
    return `₱${parseFloat(price).toFixed(2)}`;
  };

  const isEventToday = (eventDate) => {
    const today = new Date();
    const eventDay = new Date(eventDate);
    return today.toDateString() === eventDay.toDateString();
  };

  const isEventStarted = (eventDate, eventTime) => {
    const now = new Date();
    const eventDateTime = new Date(`${eventDate}T${eventTime}`);
    return now >= eventDateTime;
  };

  const canJoinEvent = (event) => {
    const isRegistered = registeredEvents.has(event.id);
    const isTodayOrStarted = isEventToday(event.date) || isEventStarted(event.date, event.time);
    return isRegistered && isTodayOrStarted;
  };

  const styles = {
    container: {
      display: "flex",
      minHeight: "100vh",
      backgroundColor: "#f8f9fa",
      position: "relative",
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
      color: "#2c3e50",
      marginBottom: "0.5rem"
    },
    subtitle: {
      fontSize: "1.2rem",
      color: "#7f8c8d",
      marginBottom: "0"
    },
    content: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
      gap: "2rem",
      margin: "2rem 0"
    },
    eventCard: {
      backgroundColor: "white",
      borderRadius: "10px",
      padding: "1.5rem",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      transition: "transform 0.3s ease, box-shadow 0.3s ease",
      position: "relative",
      ":hover": {
        transform: "translateY(-5px)",
        boxShadow: "0 6px 12px rgba(0, 0, 0, 0.15)"
      }
    },
    eventHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "1rem"
    },
    eventTitle: {
      color: "#2c3e50",
      fontSize: "1.5rem",
      margin: 0,
      flex: 1
    },
    priceTag: {
      backgroundColor: "#e74c3c",
      color: "white",
      padding: "0.5rem 1rem",
      borderRadius: "20px",
      fontSize: "0.9rem",
      fontWeight: "600",
      marginLeft: "1rem"
    },
    freePriceTag: {
      backgroundColor: "#2ecc71",
      color: "white",
      padding: "0.5rem 1rem",
      borderRadius: "20px",
      fontSize: "0.9rem",
      fontWeight: "600",
      marginLeft: "1rem"
    },
    eventDetail: {
      color: "#7f8c8d",
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
    joinButton: {
      backgroundColor: "#2ecc71",
      ":hover": {
        backgroundColor: "#27ae60"
      }
    },
    unregisterButton: {
      backgroundColor: "#e74c3c",
      ":hover": {
        backgroundColor: "#c0392b"
      }
    },
    disabledButton: {
      backgroundColor: "#bdc3c7",
      cursor: "not-allowed",
      ":hover": {
        backgroundColor: "#bdc3c7"
      }
    },
    registeredBadge: {
      backgroundColor: "#2ecc71",
      color: "white",
      padding: "0.25rem 0.75rem",
      borderRadius: "15px",
      fontSize: "0.8rem",
      fontWeight: "600",
      position: "absolute",
      top: "1rem",
      right: "1rem"
    },
    footer: {
      textAlign: "center",
      marginTop: "auto",
      padding: "1rem",
      color: "#7f8c8d",
      borderTop: "1px solid #eee"
    },
    loading: {
      textAlign: "center",
      padding: "2rem",
      color: "#7f8c8d",
      fontSize: "1.2rem"
    },
    error: {
      textAlign: "center",
      padding: "2rem",
      color: "#e74c3c",
      fontSize: "1.2rem"
    },
    noEvents: {
      textAlign: "center",
      padding: "3rem",
      backgroundColor: "white",
      borderRadius: "10px",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
    },
    buttonGroup: {
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem",
      marginTop: "1rem"
    },
    statusText: {
      fontSize: "0.9rem",
      color: "#7f8c8d",
      textAlign: "center",
      marginTop: "0.5rem",
      fontStyle: "italic"
    }
  };

  const getButtonState = (event) => {
    const isRegistered = registeredEvents.has(event.id);
    const canJoin = canJoinEvent(event);

    if (canJoin) {
      return {
        showPreRegister: false,
        showJoin: true,
        showUnregister: true,
        joinDisabled: false
      };
    } else if (isRegistered) {
      return {
        showPreRegister: false,
        showJoin: true,
        showUnregister: true,
        joinDisabled: true
      };
    } else {
      return {
        showPreRegister: true,
        showJoin: false,
        showUnregister: false,
        joinDisabled: false
      };
    }
  };

  return (
    <div style={styles.container}>
      <Sidebar 
        userType={userType}
        onSignOut={onSignOut}
        sidebarVisible={sidebarVisible}
        setSidebarVisible={setSidebarVisible}
      />

      <div style={{
        ...styles.mainContent,
        marginLeft: sidebarVisible ? '250px' : '0'
      }}>
        <div style={styles.header}>
          <h1 style={styles.title}>Upcoming Events</h1>
          <p style={styles.subtitle}>Browse and join exciting events</p>
        </div>

        {loading ? (
          <div style={styles.loading}>Loading events...</div>
        ) : error ? (
          <div style={styles.error}>Error: {error}</div>
        ) : (
          <div style={styles.content}>
            {events.length === 0 ? (
              <div style={styles.noEvents}>
                <p>No upcoming events available.</p>
              </div>
            ) : (
              events.map(event => {
                const buttonState = getButtonState(event);
                const isRegistered = registeredEvents.has(event.id);
                
                return (
                  <div key={event.id} style={styles.eventCard}>
                    {isRegistered && (
                      <div style={styles.registeredBadge}>
                        Registered
                      </div>
                    )}
                    
                    <div style={styles.eventHeader}>
                      <h2 style={styles.eventTitle}>{event.name}</h2>
                      <div style={(event.isFree === false && event.price > 0) ? styles.priceTag : styles.freePriceTag}>
                        {formatPrice(event.isFree, event.price)}
                      </div>
                    </div>
                    
                    <p style={styles.eventDetail}>
                      <strong>Date:</strong> {formatDate(event.date)}
                    </p>
                    <p style={styles.eventDetail}>
                      <strong>Time:</strong> {formatTime(event.time)}
                    </p>
                    <p style={styles.eventDetail}>
                      <strong>Location:</strong> {event.place}
                    </p>
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
                            {registrationLoading === event.id ? 'Registering...' : 'Pre-Register'}
                          </button>
                          <div style={styles.statusText}>
                            Pre-register to join this event
                          </div>
                        </>
                      )}
                      
                      {buttonState.showJoin && (
                        <>
                          <button 
                            onClick={() => handleJoinEvent(event)}
                            style={{
                              ...styles.cardButton, 
                              ...styles.joinButton,
                              ...(buttonState.joinDisabled ? styles.disabledButton : {})
                            }}
                            disabled={buttonState.joinDisabled}
                          >
                            Join Event
                          </button>
                          {buttonState.joinDisabled && (
                            <div style={styles.statusText}>
                              Available on event day
                            </div>
                          )}
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
          </div>
        )}

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
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '10px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto'
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
                    color: '#7f8c8d'
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
                  marginBottom: '1rem'
                }}>
                  <div style={(selectedEvent.isFree === false && selectedEvent.price > 0) ? styles.priceTag : styles.freePriceTag}>
                    {formatPrice(selectedEvent.isFree, selectedEvent.price)}
                  </div>
                  {registeredEvents.has(selectedEvent.id) && (
                    <div style={styles.registeredBadge}>
                      Registered
                    </div>
                  )}
                </div>
                
                <p style={styles.eventDetail}>
                  <strong>Date:</strong> {formatDate(selectedEvent.date)}
                </p>
                <p style={styles.eventDetail}>
                  <strong>Time:</strong> {formatTime(selectedEvent.time)}
                </p>
                <p style={styles.eventDetail}>
                  <strong>Location:</strong> {selectedEvent.place}
                </p>
                {selectedEvent.description && (
                  <p style={styles.eventDetail}>
                    <strong>Description:</strong> {selectedEvent.description}
                  </p>
                )}
                {selectedEvent.organizer && (
                  <p style={styles.eventDetail}>
                    <strong>Organizer:</strong> {selectedEvent.organizer.name}
                  </p>
                )}
              </div>
              
              <div style={styles.buttonGroup}>
                {(() => {
                  const buttonState = getButtonState(selectedEvent);
                  
                  if (buttonState.showPreRegister) {
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
                        Pre-Register
                      </button>
                    );
                  } else if (buttonState.showJoin) {
                    return (
                      <>
                        <button
                          onClick={() => {
                            handleCloseDetails();
                            handleJoinEvent(selectedEvent);
                          }}
                          style={{
                            ...styles.cardButton,
                            ...styles.joinButton,
                            ...(buttonState.joinDisabled ? styles.disabledButton : {}),
                            width: '100%',
                            textAlign: 'center'
                          }}
                          disabled={buttonState.joinDisabled}
                        >
                          {buttonState.joinDisabled ? 'Available on event day' : 'Join Event'}
                        </button>
                        
                        {buttonState.showUnregister && (
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
                        )}
                      </>
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