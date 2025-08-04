import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

const ReportPage = ({ userType, onSignOut }) => {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({
    registeredEvents: 0,
    attendedEvents: 0,
    attendancePercentage: 0,
  });
  const [registeredEventsList, setRegisteredEventsList] = useState([]);
  const [attendedEventsList, setAttendedEventsList] = useState([]);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // IMPORTANT: Use the full backend URL
      const backendUrl = 'http://localhost:8080/api/events/report/summary';
      console.log('Fetching report data from:', backendUrl);
      
      // Get JWT token from localStorage
      const token = localStorage.getItem('token') || 
                   localStorage.getItem('authToken') || 
                   localStorage.getItem('jwtToken') ||
                   localStorage.getItem('accessToken');
      
      console.log('Token found:', token ? 'Yes' : 'No');
      
      const headers = {
        'Content-Type': 'application/json',
      };
      
      // Add authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log('Making request with headers:', headers);
      
      const response = await axios.get(backendUrl, { headers });

      console.log('Report data received:', response.data);

      const {
        registeredEvents,
        attendedEvents,
        totalEvents,
        registeredEventsList,
        attendedEventsList,
      } = response.data;

      const attendancePercentage =
        registeredEvents > 0 ? ((attendedEvents / registeredEvents) * 100).toFixed(2) : 0;

      setSummary({ registeredEvents, attendedEvents, attendancePercentage });
      setRegisteredEventsList(registeredEventsList || []);
      setAttendedEventsList(attendedEventsList || []);
    } catch (error) {
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
        setError('API endpoint not found. Please check:\n• UserEventReportController exists\n• @RequestMapping("/api/events/report") is correct\n• Backend is running');
      } else if (error.response?.status === 500) {
        setError(`Server error: ${error.response?.data?.message || 'Check backend logs for details'}`);
      } else {
        setError(`Error: ${error.response?.data?.message || error.message}`);
      }
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh' }}>
        <Sidebar
          userType={userType}
          onSignOut={onSignOut}
          sidebarVisible={sidebarVisible}
          setSidebarVisible={setSidebarVisible}
        />
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', marginBottom: '10px' }}>Loading Report...</div>
            <div style={{ fontSize: '14px', color: '#666' }}>Connecting to backend server</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', height: '100vh' }}>
        <Sidebar
          userType={userType}
          onSignOut={onSignOut}
          sidebarVisible={sidebarVisible}
          setSidebarVisible={setSidebarVisible}
        />
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ textAlign: 'center', maxWidth: '600px', padding: '20px' }}>
            <h3 style={{ color: '#e74c3c', marginBottom: '15px' }}>Connection Error</h3>
            <div style={{ 
              backgroundColor: '#fff5f5', 
              border: '1px solid #fed7d7', 
              borderRadius: '8px', 
              padding: '15px', 
              marginBottom: '20px',
              textAlign: 'left',
              whiteSpace: 'pre-line'
            }}>
              {error}
            </div>
            <button onClick={fetchReportData} style={retryButtonStyle}>
              Retry Connection
            </button>
            <div style={{ marginTop: '20px', fontSize: '12px', color: '#888' }}>
              <p><strong>Debug Checklist:</strong></p>
              <ul style={{ textAlign: 'left', paddingLeft: '20px' }}>
                <li>Backend running on port 8080?</li>
                <li>Try: <a href="http://localhost:8080/api/test/health" target="_blank" rel="noopener noreferrer">http://localhost:8080/api/test/health</a></li>
                <li>Check browser console for detailed errors</li>
                <li>Verify JWT token in Local Storage</li>
                <li>Check CORS configuration</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar
        userType={userType}
        onSignOut={onSignOut}
        sidebarVisible={sidebarVisible}
        setSidebarVisible={setSidebarVisible}
      />

      <div
        style={{
          flex: 1,
          marginLeft: sidebarVisible ? '250px' : '0',
          padding: '30px',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '28px', margin: 0 }}>My Attendance Report</h1>
          <button onClick={fetchReportData} style={refreshButtonStyle}>
            🔄 Refresh
          </button>
        </div>

        {/* Summary Cards */}
        <div style={cardContainerStyle}>
          <StatCard label="Registered Events" value={summary.registeredEvents} />
          <StatCard label="Attended Events" value={summary.attendedEvents} />
          <StatCard
            label="Attendance Percentage"
            value={`${summary.attendancePercentage}%`}
          />
        </div>

        {/* Registered Events List */}
        <h2 style={{ marginTop: '40px', fontSize: '22px' }}>Registered Events</h2>
        <EventTable 
          data={registeredEventsList} 
          emptyText="You haven't registered for any events yet." 
          formatDate={formatDate}
        />

        {/* Attended Events List */}
        <h2 style={{ marginTop: '40px', fontSize: '22px' }}>Attended Events</h2>
        <EventTable 
          data={attendedEventsList} 
          emptyText="You haven't attended any events yet." 
          formatDate={formatDate}
        />
      </div>
    </div>
  );
};

// Reusable components
const StatCard = ({ label, value }) => (
  <div style={cardStyle}>
    <h3 style={{ margin: 0, fontSize: '16px', color: '#555' }}>{label}</h3>
    <p style={{ fontSize: '28px', marginTop: '10px', color: '#2c3e50' }}>{value}</p>
  </div>
);

const EventTable = ({ data, emptyText, formatDate }) => (
  <div style={{ marginTop: '10px', overflowX: 'auto' }}>
    <table style={tableStyle}>
      <thead>
        <tr>
          <th style={thStyle}>Event Name</th>
          <th style={thStyle}>Date</th>
          <th style={thStyle}>Location</th>
        </tr>
      </thead>
      <tbody>
        {data.length > 0 ? (
          data.map((event, index) => (
            <tr key={index}>
              <td style={tdStyle}>{event.name || 'N/A'}</td>
              <td style={tdStyle}>{formatDate(event.date)}</td>
              <td style={tdStyle}>{event.location || 'N/A'}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="3" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
              {emptyText}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

// Styles
const cardContainerStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '20px',
};

const cardStyle = {
  padding: '20px',
  borderRadius: '12px',
  backgroundColor: '#f9f9f9',
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  textAlign: 'center',
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  backgroundColor: '#ffffff',
  marginTop: '10px',
  borderRadius: '8px',
  boxShadow: '0 0 10px rgba(0,0,0,0.05)',
};

const thStyle = {
  backgroundColor: '#2c3e50',
  color: '#ffffff',
  padding: '12px',
  textAlign: 'left',
};

const tdStyle = {
  padding: '10px',
  borderBottom: '1px solid #ddd',
  fontSize: '14px',
};

const retryButtonStyle = {
  padding: '12px 24px',
  backgroundColor: '#3498db',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 'bold',
};

const refreshButtonStyle = {
  padding: '8px 16px',
  backgroundColor: '#27ae60',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  fontSize: '14px',
};

export default ReportPage;