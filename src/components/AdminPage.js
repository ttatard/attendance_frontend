import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
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
    description: '',
    isFree: true,
    price: '',
    recurrencePattern: 'none',
    recurrenceInterval: 1,
    recurrenceEndDate: '',
    recurrenceCount: '',
    isOnline: false,
    meetingUrl: '',
    meetingId: '',
    meetingPasscode: ''
  });
  const [codeInputs, setCodeInputs] = useState({});
  const [codeVerificationPopups, setCodeVerificationPopups] = useState({});
  const navigate = useNavigate();

  const API_BASE_URL = 'http://localhost:8080';

  // Format time to AM/PM
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

  // Format date to readable string
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

  // Format datetime for registrations
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

  // Fetch events from API
  const fetchEvents = useCallback(async () => {
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
        // Filter out past events before setting state
        const filteredEvents = filterPastEvents(response.data);
        setEvents(filteredEvents);
        setError(null);
      } else {
        throw new Error('No events data received');
      }
    } catch (err) {
      console.error('Error fetching events:', err);
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
  }, [onSignOut]);

  // Fetch registrations for an event
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

  // Handle registration approval toggle
  const handleToggleApproval = async (registrationId, eventId, currentStatus) => {
    try {
      setGlobalLoading(true);
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

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

      await fetchEventRegistrations(eventId);
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 3000);
    } catch (err) {
      console.error('Error toggling registration approval:', err);
      setError('Failed to update registration status');
    } finally {
      setGlobalLoading(false);
    }
  };

  // Handle registration disapproval
  const handleDisapproveRegistration = async (registrationId, eventId) => {
    if (!window.confirm('Are you sure you want to disapprove this registration?')) {
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

      await fetchEventRegistrations(eventId);
    } catch (err) {
      console.error('Error disapproving registration:', err);
      setError('Failed to disapprove registration');
    } finally {
      setGlobalLoading(false);
    }
  };

  // Show registrations for an event
  const handleShowRegistrations = async (eventId) => {
    setSelectedEventId(eventId);
    setShowRegistrations(true);
    await fetchEventRegistrations(eventId);
  };

  // Handle code input change for specific events
  const handleCodeInputChange = (eventId, value) => {
    setCodeInputs(prev => ({
      ...prev,
      [eventId]: value.toUpperCase()
    }));
  };

  // Verify code for attendance
  const verifyCode = async (eventId, code) => {
    try {
      setGlobalLoading(true);
      const token = localStorage.getItem('authToken');
      
      const response = await axios.post(
        `${API_BASE_URL}/api/registrations/verify-code`,
        { eventId, code },
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Show success popup for this specific event
      setCodeVerificationPopups(prev => ({
        ...prev,
        [eventId]: {
          show: true,
          success: true,
          message: response.data.message,
          userName: response.data.userName,
          userEmail: response.data.userEmail
        }
      }));
      
      // Auto-hide popup after 5 seconds
      setTimeout(() => {
        closeCodeVerificationPopup(eventId);
      }, 5000);
      
      // Clear the input field for this event
      setCodeInputs(prev => ({
        ...prev,
        [eventId]: ''
      }));
    } catch (err) {
      // Check if this is the "already recorded" error
      const errorMessage = err.response?.data?.message || 'Failed to verify code';
      const isAlreadyRecorded = errorMessage.includes('already recorded');
      
      // Show error popup for this specific event
      setCodeVerificationPopups(prev => ({
        ...prev,
        [eventId]: {
          show: true,
          success: false,
          message: errorMessage,
          userName: err.response?.data?.userName || '',
          userEmail: err.response?.data?.userEmail || '',
          isAlreadyRecorded: isAlreadyRecorded
        }
      }));
      
      // Auto-hide error popup after 5 seconds
      setTimeout(() => {
        closeCodeVerificationPopup(eventId);
      }, 5000);
    } finally {
      setGlobalLoading(false);
    }
  };

  // Close the code verification popup for a specific event
  const closeCodeVerificationPopup = (eventId) => {
    setCodeVerificationPopups(prev => ({
      ...prev,
      [eventId]: {
        show: false,
        success: false,
        message: '',
        userName: '',
        userEmail: ''
      }
    }));
  };

  // Create organizer profile if missing
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

  // Handle input changes for new event form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEvent(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Add new event
  const handleAddEvent = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate the event data first
    const validationErrors = validateEventData(newEvent);
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return;
    }

    // Validation for online events
    if (newEvent.isOnline && !newEvent.meetingUrl) {
      setError("Meeting link is required for online events");
      return;
    }

    // Validation for in-person events
    if (!newEvent.isOnline && !newEvent.place) {
      setError("Location is required for in-person events");
      return;
    }

    try {
      setGlobalLoading(true);
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const payload = {
        name: newEvent.name,
        date: newEvent.date,
        time: newEvent.time,
        place: newEvent.place,
        description: newEvent.description || "",
        isFree: newEvent.isFree,
        price: newEvent.isFree ? 0 : parseFloat(newEvent.price) || 0,
        recurrencePattern: newEvent.recurrencePattern === 'none' ? null : newEvent.recurrencePattern,
        recurrenceInterval: parseInt(newEvent.recurrenceInterval) || 1,
        recurrenceEndDate: newEvent.recurrenceEndDate || null,
        recurrenceCount: newEvent.recurrenceCount ? parseInt(newEvent.recurrenceCount) : null,
        isOnline: newEvent.isOnline,
        meetingUrl: newEvent.isOnline ? newEvent.meetingUrl : null,
        meetingId: newEvent.isOnline ? newEvent.meetingId : null,
        meetingPasscode: newEvent.isOnline ? newEvent.meetingPasscode : null,
        requiresApproval: true
      };
      
      console.log('Sending event payload:', JSON.stringify(payload, null, 2));
      
      const response = await axios.post(
        `${API_BASE_URL}/api/events`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      
      console.log('Event creation response:', response.data);
      
      // Reset form and show success
      setShowAddEventForm(false);
      setShowSuccessPopup(true);
      setNewEvent({
        name: '',
        date: '',
        time: '',
        place: '',
        description: '',
        isFree: true,
        price: '',
        recurrencePattern: 'none',
        recurrenceInterval: 1,
        recurrenceEndDate: '',
        recurrenceCount: '',
        isOnline: false,
        meetingUrl: '',
        meetingId: '',
        meetingPasscode: ''
      });
      
      setTimeout(() => {
        setShowSuccessPopup(false);
      }, 3000);
      
      await fetchEvents();
    } catch (err) {
      console.error('Failed to add event details:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
        config: err.config
      });
      
      if (err.response?.status === 401) {
        setError('Authentication failed. Please sign in again.');
        setTimeout(() => {
          onSignOut();
        }, 2000);
      } else {
        const errorData = err.response?.data;
        let errorMessage = 'Failed to create event';
        
        if (errorData) {
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          } else if (typeof errorData === 'string') {
            errorMessage = errorData;
          } else if (Array.isArray(errorData)) {
            errorMessage = errorData.map(err => err.defaultMessage || err.message).join(', ');
          }
        }
        
        setError(errorMessage);
      }
    } finally {
      setGlobalLoading(false);
    }
  };

  // Updated validation function to properly handle same-day events
  const validateEventData = (eventData) => {
    const errors = [];
    
    // Required fields
    if (!eventData.name?.trim()) errors.push('Event name is required');
    if (!eventData.date) errors.push('Event date is required');
    if (!eventData.time) errors.push('Event time is required');
    
    // Validate date format
    if (eventData.date && !/^\d{4}-\d{2}-\d{2}$/.test(eventData.date)) {
      errors.push('Date must be in YYYY-MM-DD format');
      return errors; // Return early if date format is wrong
    }
    
    // Validate time format (accepts HH:MM or HH:MM:SS)
    if (eventData.time && !/^\d{2}:\d{2}(:\d{2})?$/.test(eventData.time)) {
      errors.push('Time must be in HH:MM or HH:MM:SS format');
      return errors; // Return early if time format is wrong
    }
    
    // Check if date is in the past (but allow today)
    if (eventData.date) {
      const today = new Date();
      const eventDate = new Date(eventData.date);
      
      // Set both dates to midnight for accurate comparison
      today.setHours(0, 0, 0, 0);
      eventDate.setHours(0, 0, 0, 0);
      
      if (eventDate < today) {
        errors.push('Event date cannot be in the past');
        return errors; // Return early since date is invalid
      }
    }
    
    // For same-day events, check if time is in the past
    if (eventData.date && eventData.time) {
      const today = new Date();
      const eventDate = new Date(eventData.date);
      
      // Check if it's today
      if (eventDate.toDateString() === today.toDateString()) {
        const [hours, minutes] = eventData.time.split(':');
        const eventDateTime = new Date();
        eventDateTime.setHours(parseInt(hours), parseInt(minutes || 0), 0, 0);
        
        // Add a 5-minute buffer to allow for processing time
        const currentTimeWithBuffer = new Date(today.getTime() + 5 * 60 * 1000);
        
        if (eventDateTime < currentTimeWithBuffer) {
          errors.push('Event time must be at least 5 minutes in the future for today\'s events');
        }
      }
    }
    
    // Validate price if not free
    if (!eventData.isFree) {
      const price = parseFloat(eventData.price);
      if (isNaN(price) || price < 0) {
        errors.push('Price must be a valid positive number');
      }
    }
    
    // Validate online event requirements
    if (eventData.isOnline && !eventData.meetingUrl?.trim()) {
      errors.push('Meeting URL is required for online events');
    }
    
    // Validate in-person event requirements
    if (!eventData.isOnline && !eventData.place?.trim()) {
      errors.push('Location is required for in-person events');
    }
    
    return errors;
  };

  // Delete event or event series
  const deleteEvent = async (eventId) => {
    const event = events.find(e => e.id === eventId);
    const isRecurring = event?.recurrencePattern && event.recurrencePattern !== 'NONE';
    
    let deleteSeries = false;
    
    if (isRecurring) {
      deleteSeries = window.confirm(
        'This is a recurring event. Do you want to delete just this instance or the entire series?\n\n' +
        'Click OK to delete the entire series, or Cancel to delete just this instance.'
      );
    } else if (!window.confirm('Are you sure you want to delete this event?')) {
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
          params: { deleteSeries },
          headers: { 'Authorization': `Bearer ${token}` },
          timeout: 10000
        }
      );
      
      setEvents(events.filter(event => {
        if (deleteSeries) {
          return event.id !== eventId && 
                 event.originalEventId !== (event.originalEventId || eventId);
        }
        return event.id !== eventId;
      }));
      
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 3000);
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

  // Get recurrence unit for display
  const getRecurrenceUnit = (pattern) => {
    switch (pattern) {
      case 'DAILY': return 'day(s)';
      case 'WEEKLY': return 'week(s)';
      case 'MONTHLY': 
      case 'WEEKLY_X': return 'month(s)';
      case 'YEARLY': return 'year(s)';
      default: return '';
    }
  };

  // Check authentication on initial load
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/login');
    } else {
      fetchEvents();
    }
  }, [navigate]);

  // Styles
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
      position: "relative",
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
    codeSection: {
      marginTop: "1.5rem",
      padding: "1rem",
      backgroundColor: darkMode ? "#2a2a2a" : "#f8f9fa",
      borderRadius: "8px",
    },
    codeTitle: {
      fontSize: "1.1rem",
      marginBottom: "0.75rem",
      color: darkMode ? "#ffffff" : "#2c3e50"
    },
    codeInputContainer: {
      display: "flex",
      gap: "0.5rem",
      marginBottom: "1rem"
    },
    codeInput: {
      flex: 1,
      padding: "0.5rem",
      border: "1px solid #ccc",
      borderRadius: "4px",
      fontSize: "1rem",
      backgroundColor: darkMode ? "#1e1e1e" : "white",
      color: darkMode ? "#ffffff" : "#000000"
    },
    verifyButton: {
      padding: "0.5rem 1rem",
      backgroundColor: "#3498db",
      color: "white",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      fontWeight: "500"
    },
    codeResult: {
      padding: "0.75rem",
      borderRadius: "4px",
      fontSize: "0.9rem"
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
    },
    codeVerificationPopup: {
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 2000,
      animation: 'slideInRight 0.3s ease-out',
      maxWidth: '400px',
    },
   getCodeVerificationPopupStyle: (popup, darkMode) => {
  let borderColor;
  if (popup.success) borderColor = darkMode ? "#4caf50" : "#27ae60";
  else if (popup.isAlreadyRecorded) borderColor = darkMode ? "#ff9800" : "#f39c12";
  else borderColor = darkMode ? "#f44336" : "#e74c3c";

  return {
    backgroundColor: darkMode ? '#1e1e1e' : 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
    textAlign: 'center',
    color: darkMode ? '#ffffff' : '#000000',
    border: '2px solid',
    borderColor: borderColor,
  };
},
    codeVerificationPopupIcon: {
      fontSize: '2rem',
      marginBottom: '0.75rem',
    },
    codeVerificationPopupTitle: {
      fontSize: '1.2rem',
      marginBottom: '0.75rem',
      color: darkMode ? '#ffffff' : '#2c3e50',
    },
    codeVerificationPopupMessage: {
      fontSize: '0.9rem',
      marginBottom: '1rem',
      lineHeight: '1.4',
    },
    codeVerificationPopupButton: {
      padding: '0.5rem 1rem',
      backgroundColor: '#3498db',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontWeight: '500',
      fontSize: '0.9rem',
    },
    codeVerificationPopupDetails: {
      backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
      padding: '0.75rem',
      borderRadius: '6px',
      marginBottom: '0.75rem',
      textAlign: 'left',
    },
    codeVerificationPopupDetail: {
      marginBottom: '0.25rem',
      fontSize: '0.9rem',
    },
  };

  // Check authentication
  const token = localStorage.getItem('authToken');
  if (!token) {
    return (
      <div style={styles.container}>
        <Sidebar 
          userType="admin"
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
          userType="admin"
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
                      
                      {event.recurrencePattern && event.recurrencePattern !== 'NONE' && (
                        <p style={styles.eventDetail}>
                          Recurrence: {event.recurrencePattern.toLowerCase()} 
                          (every {event.recurrenceInterval} {getRecurrenceUnit(event.recurrencePattern)})
                          {event.recurrenceEndDate && (
                            <span> until {formatDate(event.recurrenceEndDate)}</span>
                          )}
                          {event.recurrenceCount && (
                            <span>, {event.recurrenceCount} occurrences</span>
                          )}
                        </p>
                      )}
                      
                      {event.description && (
                        <p style={styles.eventDetail}>Description: {event.description}</p>
                      )}
                      
                      {/* Code Input Section */}
                      <div style={styles.codeSection}>
                        <h3 style={styles.codeTitle}>Check-in Attendee</h3>
                        <div style={styles.codeInputContainer}>
                          <input
                            type="text"
                            placeholder="Enter attendee code"
                            value={codeInputs[event.id] || ''}
                            onChange={(e) => handleCodeInputChange(event.id, e.target.value)}
                            style={styles.codeInput}
                            maxLength={6}
                          />
                          <button
                            onClick={() => verifyCode(event.id, codeInputs[event.id] || '')}
                            style={styles.verifyButton}
                            disabled={globalLoading || !codeInputs[event.id] || codeInputs[event.id].length < 6}
                          >
                            Verify Code
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={styles.card}>
                    <h2 style={styles.cardTitle}>No Upcoming Events Found</h2>
                    <p style={styles.cardText}>You don't have any upcoming events. Create one to get started!</p>
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

      {/* Code Verification Popups - Fixed at top right */}
      {Object.entries(codeVerificationPopups).map(([eventId, popup]) => 
        popup?.show && (
          <div key={eventId} style={styles.codeVerificationPopup}>
            <div style={styles.getCodeVerificationPopupStyle(popup, darkMode)}>
              <div style={{
                ...styles.codeVerificationPopupIcon,
                color: popup.success ? 
                  (darkMode ? "#4caf50" : "#27ae60") : 
                  (darkMode ? "#f44336" : "#e74c3c")
              }}>
                {popup.success ? '✓' : '✗'}
              </div>
              
              <h2 style={styles.codeVerificationPopupTitle}>
                {popup.success ? 'Success!' : 'Error'}
              </h2>
              
              <p style={styles.codeVerificationPopupMessage}>
                {popup.message}
              </p>
              
              {popup.success && (
                <div style={styles.codeVerificationPopupDetails}>
                  <p style={styles.codeVerificationPopupDetail}>
                    <strong>Attendee:</strong> {popup.userName}
                  </p>
                  <p style={styles.codeVerificationPopupDetail}>
                    <strong>Email:</strong> {popup.userEmail}
                  </p>
                </div>
              )}
              
              <button 
                onClick={() => closeCodeVerificationPopup(eventId)}
                style={{
                  ...styles.codeVerificationPopupButton,
                  backgroundColor: popup.success ? 
                    (darkMode ? "#4caf50" : "#27ae60") : 
                    (darkMode ? "#f44336" : "#e74c3c")
                }}
              >
                OK
              </button>
            </div>
          </div>
        )
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
                      {registration.uniqueCode && (
                        <div style={{
                          fontSize: "0.8rem",
                          color: darkMode ? "#888" : "#95a5a6",
                          marginTop: "0.25rem"
                        }}>
                          Code: {registration.uniqueCode}
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