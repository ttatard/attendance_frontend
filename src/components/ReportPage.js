import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

const ReportPage = ({ 
  userType, 
  onSignOut, 
  darkMode, 
  toggleDarkMode 
}) => {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('all');
  
  // Admin-specific state
  const [adminData, setAdminData] = useState({
    totalEvents: 0,
    monthlyEvents: [],
    eventsList: []
  });
  
  // User-specific state
  const [summary, setSummary] = useState({
    registeredEvents: 0,
    attendedEvents: 0,
    attendancePercentage: 0,
  });
  const [registeredEventsList, setRegisteredEventsList] = useState([]);
  const [attendedEventsList, setAttendedEventsList] = useState([]);

  // Styles matching Landing Page
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
      overflowY: "auto",
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
      marginBottom: "1rem"
    },
    card: {
      backgroundColor: darkMode ? "#1e1e1e" : "white",
      color: darkMode ? "#ffffff" : "#000000",
      borderRadius: "10px",
      padding: "2rem",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      transition: "transform 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease, color 0.3s ease",
      marginBottom: "1.5rem"
    },
    cardTitle: {
      color: darkMode ? "#ffffff" : "#2c3e50",
      fontSize: "1.5rem",
      marginBottom: "1rem"
    },
    cardText: {
      color: darkMode ? "#b0b0b0" : "#7f8c8d",
      marginBottom: "1rem",
      fontSize: "1rem"
    },
    button: {
      backgroundColor: "#3498db",
      color: "white",
      padding: "0.75rem 1.5rem",
      borderRadius: "6px",
      border: "none",
      fontWeight: "600",
      cursor: "pointer",
      transition: "background-color 0.3s ease",
      fontSize: "14px"
    },
    buttonHover: {
      backgroundColor: "#2980b9"
    },
    successButton: {
      backgroundColor: "#27ae60",
      color: "white",
      padding: "0.5rem 1rem",
      borderRadius: "6px",
      border: "none",
      fontWeight: "600",
      cursor: "pointer",
      transition: "background-color 0.3s ease",
      fontSize: "14px"
    },
    statsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "1.5rem",
      marginBottom: "2rem"
    },
    statCard: {
      backgroundColor: darkMode ? "#1e1e1e" : "white",
      color: darkMode ? "#ffffff" : "#000000",
      borderRadius: "10px",
      padding: "1.5rem",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      textAlign: "center",
      transition: "background-color 0.3s ease, color 0.3s ease"
    },
    statValue: {
      fontSize: "2rem",
      fontWeight: "bold",
      color: darkMode ? "#ffffff" : "#2c3e50",
      marginTop: "0.5rem"
    },
    statLabel: {
      fontSize: "0.9rem",
      color: darkMode ? "#b0b0b0" : "#7f8c8d",
      margin: 0
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      backgroundColor: darkMode ? "#1e1e1e" : "#ffffff",
      borderRadius: "8px",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      overflow: "hidden"
    },
    th: {
      backgroundColor: darkMode ? "#2c3e50" : "#2c3e50",
      color: "#ffffff",
      padding: "1rem",
      textAlign: "left",
      fontWeight: "600"
    },
    td: {
      padding: "1rem",
      borderBottom: darkMode ? "1px solid #333" : "1px solid #eee",
      color: darkMode ? "#ffffff" : "#000000"
    },
    dropdown: {
      padding: "0.75rem 1rem",
      borderRadius: "6px",
      border: darkMode ? "1px solid #333" : "1px solid #ddd",
      fontSize: "14px",
      backgroundColor: darkMode ? "#1e1e1e" : "#fff",
      color: darkMode ? "#ffffff" : "#000000",
      cursor: "pointer"
    },
    errorContainer: {
      backgroundColor: darkMode ? "#2d1b1b" : "#fff5f5",
      border: darkMode ? "1px solid #4a2c2c" : "1px solid #fed7d7",
      borderRadius: "8px",
      padding: "1.5rem",
      marginBottom: "1rem",
      color: darkMode ? "#ff6b6b" : "#e74c3c"
    },
    loadingContainer: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "50vh",
      flexDirection: "column"
    },
    loadingText: {
      fontSize: "1.2rem",
      marginBottom: "0.5rem",
      color: darkMode ? "#ffffff" : "#2c3e50"
    },
    loadingSubtext: {
      fontSize: "1rem",
      color: darkMode ? "#b0b0b0" : "#7f8c8d"
    },
    footer: {
      textAlign: "center",
      marginTop: "auto",
      padding: "1rem",
      color: darkMode ? "#b0b0b0" : "#7f8c8d",
      borderTop: darkMode ? "1px solid #333" : "1px solid #eee"
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [userType, selectedMonth]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (userType === 'admin') {
        await fetchAdminReportData();
      } else {
        await fetchUserReportData();
      }
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminReportData = async () => {
    const backendUrl = 'http://localhost:8080/api/admin/events/report';
    const token = getAuthToken();
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };

    const params = selectedMonth !== 'all' ? { month: selectedMonth } : {};
    
    const response = await axios.get(backendUrl, { headers, params });
    console.log('Admin report data received:', response.data);

    setAdminData({
      totalEvents: response.data.totalEvents || 0,
      monthlyEvents: response.data.monthlyEvents || [],
      eventsList: response.data.eventsList || []
    });
  };

  const fetchUserReportData = async () => {
    const backendUrl = 'http://localhost:8080/api/events/report/summary';
    const token = getAuthToken();
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };

    const response = await axios.get(backendUrl, { headers });
    console.log('User report data received:', response.data);

    const {
      registeredEvents,
      attendedEvents,
      registeredEventsList,
      attendedEventsList,
    } = response.data;

    const attendancePercentage =
      registeredEvents > 0 ? ((attendedEvents / registeredEvents) * 100).toFixed(2) : 0;

    setSummary({ registeredEvents, attendedEvents, attendancePercentage });
    setRegisteredEventsList(registeredEventsList || []);
    setAttendedEventsList(attendedEventsList || []);
  };

  const getAuthToken = () => {
    return localStorage.getItem('token') || 
           localStorage.getItem('authToken') || 
           localStorage.getItem('jwtToken') ||
           localStorage.getItem('accessToken');
  };

  const handleError = (error) => {
    console.error('Full error details:', error);
    console.error('Error response:', error.response);
    
    if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
      setError('Cannot connect to backend server. Please ensure:\n• Backend is running on http://localhost:8080\n• CORS is properly configured');
    } else if (error.response?.status === 401) {
      setError('Authentication failed. Please log in again.');
      if (onSignOut) onSignOut();
    } else if (error.response?.status === 403) {
      setError('Access denied. You do not have permission to view this data.');
    } else if (error.response?.status === 404) {
      setError('API endpoint not found. Please check backend configuration.');
    } else if (error.response?.status === 500) {
      setError(`Server error: ${error.response?.data?.message || 'Check backend logs for details'}`);
    } else {
      setError(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  const getMonthOptions = () => {
    const months = [
      { value: 'all', label: 'All Months' },
      { value: '2025-01', label: 'January 2025' },
      { value: '2025-02', label: 'February 2025' },
      { value: '2025-03', label: 'March 2025' },
      { value: '2025-04', label: 'April 2025' },
      { value: '2025-05', label: 'May 2025' },
      { value: '2025-06', label: 'June 2025' },
      { value: '2025-07', label: 'July 2025' },
      { value: '2025-08', label: 'August 2025' },
      { value: '2025-09', label: 'September 2025' },
      { value: '2025-10', label: 'October 2025' },
      { value: '2025-11', label: 'November 2025' },
      { value: '2025-12', label: 'December 2025' },
    ];
    return months;
  };

  if (loading) {
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
          <div style={styles.loadingContainer}>
            <div style={styles.loadingText}>Loading Report...</div>
            <div style={styles.loadingSubtext}>Connecting to backend server</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
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
            <h1 style={styles.title}>Connection Error</h1>
            <div style={styles.errorContainer}>
              <pre style={{ whiteSpace: 'pre-line', margin: 0 }}>{error}</pre>
            </div>
            <button 
              onClick={fetchReportData} 
              style={styles.button}
              onMouseOver={(e) => e.target.style.backgroundColor = styles.buttonHover.backgroundColor}
              onMouseOut={(e) => e.target.style.backgroundColor = styles.button.backgroundColor}
            >
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 style={styles.title}>
            {userType === 'admin' ? 'Admin Events Report' : 'My Attendance Report'}
          </h1>
          <p style={styles.subtitle}>
            {userType === 'admin' 
              ? 'Comprehensive overview of your organization events' 
              : 'Track your event participation and attendance history'}
          </p>
          <button 
            onClick={fetchReportData} 
            style={styles.successButton}
            onMouseOver={(e) => e.target.style.backgroundColor = '#229954'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#27ae60'}
          >
            🔄 Refresh Report
          </button>
        </div>

        {userType === 'admin' ? (
          <AdminReportView 
            adminData={adminData}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            getMonthOptions={getMonthOptions}
            formatDate={formatDate}
            styles={styles}
            darkMode={darkMode}
          />
        ) : (
          <UserReportView 
            summary={summary}
            registeredEventsList={registeredEventsList}
            attendedEventsList={attendedEventsList}
            formatDate={formatDate}
            styles={styles}
            darkMode={darkMode}
          />
        )}

        <div style={styles.footer}>
          <p>© {new Date().getFullYear()} Attendance App</p>
        </div>
      </div>
    </div>
  );
};

// Admin Report Component
const AdminReportView = ({ adminData, selectedMonth, setSelectedMonth, getMonthOptions, formatDate, styles, darkMode }) => (
  <>
    {/* Month Filter Card */}
    <div style={styles.card}>
      <h2 style={styles.cardTitle}>Filter Reports</h2>
      <p style={styles.cardText}>Select a specific month or view all events</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <label style={{ fontSize: '16px', fontWeight: 'bold', color: darkMode ? "#ffffff" : "#2c3e50" }}>
          Month:
        </label>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          style={styles.dropdown}
        >
          {getMonthOptions().map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>

    {/* Summary Stats */}
    <div style={styles.statsGrid}>
      <div style={styles.statCard}>
        <h3 style={styles.statLabel}>
          {selectedMonth === 'all' ? 'Total Events Created' : 'Events This Month'}
        </h3>
        <p style={styles.statValue}>{adminData.totalEvents}</p>
      </div>
    </div>

    {/* Events Table */}
    <div style={styles.card}>
      <h2 style={styles.cardTitle}>Events Overview</h2>
      <AdminEventsTable 
        data={adminData.eventsList} 
        formatDate={formatDate}
        styles={styles}
        darkMode={darkMode}
      />
    </div>
  </>
);

// User Report Component
const UserReportView = ({ summary, registeredEventsList, attendedEventsList, formatDate, styles, darkMode }) => (
  <>
    {/* Summary Cards */}
    <div style={styles.statsGrid}>
      <div style={styles.statCard}>
        <h3 style={styles.statLabel}>Registered Events</h3>
        <p style={styles.statValue}>{summary.registeredEvents}</p>
      </div>
      <div style={styles.statCard}>
        <h3 style={styles.statLabel}>Attended Events</h3>
        <p style={styles.statValue}>{summary.attendedEvents}</p>
      </div>
      <div style={styles.statCard}>
        <h3 style={styles.statLabel}>Attendance Rate</h3>
        <p style={styles.statValue}>{summary.attendancePercentage}%</p>
      </div>
    </div>

    {/* Registered Events List */}
    <div style={styles.card}>
      <h2 style={styles.cardTitle}>Registered Events</h2>
      <EventTable 
        data={registeredEventsList} 
        emptyText="You haven't registered for any events yet." 
        formatDate={formatDate}
        styles={styles}
        darkMode={darkMode}
      />
    </div>

    {/* Attended Events List */}
    <div style={styles.card}>
      <h2 style={styles.cardTitle}>Attended Events</h2>
      <EventTable 
        data={attendedEventsList} 
        emptyText="You haven't attended any events yet." 
        formatDate={formatDate}
        styles={styles}
        darkMode={darkMode}
      />
    </div>
  </>
);

// Admin Events Table Component
const AdminEventsTable = ({ data, formatDate, styles, darkMode }) => (
  <div style={{ overflowX: 'auto' }}>
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={styles.th}>Event Name</th>
          <th style={styles.th}>Date</th>
          <th style={styles.th}>Location</th>
          <th style={styles.th}>Registrants</th>
          <th style={styles.th}>Attendees</th>
          <th style={styles.th}>Event Type</th>
        </tr>
      </thead>
      <tbody>
        {data.length > 0 ? (
          data.map((event, index) => (
            <tr key={index}>
              <td style={styles.td}>{event.name || 'N/A'}</td>
              <td style={styles.td}>{formatDate(event.date)}</td>
              <td style={styles.td}>{event.location || event.place || 'N/A'}</td>
              <td style={styles.td}>{event.registrantCount || 0}</td>
              <td style={styles.td}>{event.attendeeCount || 0}</td>
              <td style={styles.td}>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  backgroundColor: event.isOnline ? '#e3f2fd' : '#f3e5f5',
                  color: event.isOnline ? '#1976d2' : '#7b1fa2'
                }}>
                  {event.isOnline ? 'Online' : 'Face-to-Face'}
                </span>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="6" style={{ 
              ...styles.td, 
              textAlign: 'center', 
              padding: '2rem',
              color: darkMode ? '#b0b0b0' : '#7f8c8d'
            }}>
              No events found for the selected period.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

// User Events Table Component
const EventTable = ({ data, emptyText, formatDate, styles, darkMode }) => (
  <div style={{ overflowX: 'auto' }}>
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={styles.th}>Event Name</th>
          <th style={styles.th}>Date</th>
          <th style={styles.th}>Location</th>
        </tr>
      </thead>
      <tbody>
        {data.length > 0 ? (
          data.map((event, index) => (
            <tr key={index}>
              <td style={styles.td}>{event.name || 'N/A'}</td>
              <td style={styles.td}>{formatDate(event.date)}</td>
              <td style={styles.td}>{event.location || 'N/A'}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="3" style={{ 
              ...styles.td, 
              textAlign: 'center', 
              padding: '2rem',
              color: darkMode ? '#b0b0b0' : '#7f8c8d'
            }}>
              {emptyText}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

export default ReportPage;