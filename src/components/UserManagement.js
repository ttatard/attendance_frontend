import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './Sidebar';

const UserManagement = ({ 
  userType, 
  onSignOut, 
  userData, 
  sidebarVisible, 
  setSidebarVisible,
  darkMode
}) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [currentOrganization, setCurrentOrganization] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [processing, setProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('authToken');

        // Fetch organization and users in parallel
        const [orgResponse, usersResponse] = await Promise.all([
          axios.get(`http://localhost:8080/api/organizers/by-user/${userData.id}`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10000
          }),
          axios.get('http://localhost:8080/api/users', {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10000
          })
        ]);

        if (!orgResponse.data?.id) {
          throw new Error('Organization data is invalid');
        }

        setCurrentOrganization(orgResponse.data.id);

        // Transform users with multiple organization support
        const transformedUsers = usersResponse.data.map(user => ({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          accountType: user.accountType,
          ministry: user.ministry,
          apostolate: user.apostolate,
          isDeactivated: user.isDeactivated,
          enrolledOrganizations: user.enrolledOrganizations || [],
          isEnrolledInCurrentOrg: user.enrolledOrganizations?.some(org => org.id === orgResponse.data.id) || false
        }));

        setUsers(transformedUsers);
        
        console.log('Initial data loaded:', {
          organizationId: orgResponse.data.id,
          totalUsers: transformedUsers.length,
          enrolled: transformedUsers.filter(u => u.isEnrolledInCurrentOrg).length,
          notEnrolled: transformedUsers.filter(u => !u.enrolledOrganizations || u.enrolledOrganizations.length === 0).length
        });
        
      } catch (err) {
        let errorMsg = 'Failed to fetch data';
        
        if (err.code === 'ECONNABORTED') {
          errorMsg = 'Request timed out';
        } else if (err.response) {
          errorMsg = err.response.data?.message || 
                    `Server error: ${err.response.status}`;
        } else if (err.request) {
          errorMsg = 'No response from server';
        }

        console.error('Fetch error:', {
          message: err.message,
          response: err.response?.data,
          stack: err.stack
        });

        setError(errorMsg);
        
        if (err.response?.status === 401) {
          onSignOut();
          navigate('/');
        }
      } finally {
        setLoading(false);
      }
    };

    if (userData?.id) {
      fetchData();
    }
  }, []);

  const handleEnrollUser = async (userId) => {
    try {
      setProcessing(true);
      const token = localStorage.getItem('authToken');
      
      if (!currentOrganization) {
        throw new Error('No organization found for this admin');
      }

      await axios.post(
        `http://localhost:8080/api/users/${userId}/enroll`,
        { organizationId: currentOrganization },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Optimistic UI update
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { 
                ...user, 
                enrolledOrganizations: [
                  ...(user.enrolledOrganizations || []),
                  { id: currentOrganization }
                ],
                isEnrolledInCurrentOrg: true
              }
            : user
        )
      );
      
      setSuccessMessage('User enrolled successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Enrollment error:', err.response?.data);
      setError(err.response?.data?.message || 
              'Failed to enroll user. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleUnenrollUser = async (userId) => {
    try {
      setProcessing(true);
      const token = localStorage.getItem('authToken');

      await axios.post(
        `http://localhost:8080/api/users/${userId}/unenroll`,
        { organizationId: currentOrganization },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      // Optimistic UI update
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { 
                ...user, 
                enrolledOrganizations: user.enrolledOrganizations?.filter(org => org.id !== currentOrganization) || [],
                isEnrolledInCurrentOrg: false
              }
            : user
        )
      );
      
      setSuccessMessage('User unenrolled successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Unenrollment error:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to unenroll user');
    } finally {
      setProcessing(false);
    }
  };

  const handleSignOut = () => {
    onSignOut();
    navigate('/');
  };

  const handleManualRefresh = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('authToken');
      const [orgResponse, usersResponse] = await Promise.all([
        axios.get(`http://localhost:8080/api/organizers/by-user/${userData.id}`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000
        }),
        axios.get('http://localhost:8080/api/users', {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000
        })
      ]);

      const transformedUsers = usersResponse.data.map(user => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        accountType: user.accountType,
        ministry: user.ministry,
        apostolate: user.apostolate,
        isDeactivated: user.isDeactivated,
        enrolledOrganizations: user.enrolledOrganizations || [],
        isEnrolledInCurrentOrg: user.enrolledOrganizations?.some(org => org.id === orgResponse.data.id) || false
      }));

      setUsers(transformedUsers);
      setSuccessMessage('Data refreshed successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  // Memoized filtered users
  const enrolledUsers = useMemo(() => 
    users.filter(user => user.isEnrolledInCurrentOrg),
    [users]
  );

  const notEnrolledUsers = useMemo(() => 
    users.filter(user => !user.enrolledOrganizations || user.enrolledOrganizations.length === 0),
    [users]
  );

  const enrolledElsewhereUsers = useMemo(() => 
    users.filter(user => 
      user.enrolledOrganizations?.length > 0 && !user.isEnrolledInCurrentOrg
    ),
    [users]
  );

  // Search functionality
  const filteredUsers = useMemo(() => {
    let baseUsers;
    switch (activeTab) {
      case 'enrolled':
        baseUsers = enrolledUsers;
        break;
      case 'notEnrolled':
        baseUsers = notEnrolledUsers;
        break;
      default:
        baseUsers = users;
    }

    if (!searchTerm.trim()) {
      return baseUsers;
    }

    const searchLower = searchTerm.toLowerCase();
    return baseUsers.filter(user => {
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      const email = user.email.toLowerCase();
      return fullName.includes(searchLower) || email.includes(searchLower);
    });
  }, [users, enrolledUsers, notEnrolledUsers, activeTab, searchTerm]);

  const styles = {
    container: {
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: darkMode ? '#121212' : '#f8f9fa',
      position: 'relative',
      color: darkMode ? '#ffffff' : '#000000',
    },
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '1.5rem',
      color: darkMode ? '#ffffff' : '#000000',
    },
    mainContent: {
      flex: 1,
      padding: '2rem',
      minHeight: 'calc(100vh - 60px)',
      display: 'flex',
      flexDirection: 'column',
      marginLeft: sidebarVisible ? '250px' : '0'
    },
    header: {
      textAlign: 'center',
      marginBottom: '2rem',
      padding: '0 1rem',
    },
    title: {
      fontSize: '2.5rem',
      color: darkMode ? '#ffffff' : '#2c3e50',
      marginBottom: '0.5rem',
    },
    headerActions: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '1rem',
      marginTop: '1rem',
    },
    refreshButton: {
      backgroundColor: darkMode ? '#4CAF50' : '#28a745',
      color: 'white',
      border: 'none',
      padding: '0.5rem 1rem',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '0.9rem',
      opacity: loading ? 0.7 : 1,
      pointerEvents: loading ? 'none' : 'auto',
    },
    searchContainer: {
      marginBottom: '1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
    },
    searchBox: {
      padding: '0.75rem 1rem',
      fontSize: '1rem',
      border: darkMode ? '1px solid #444' : '1px solid #ddd',
      borderRadius: '8px',
      backgroundColor: darkMode ? '#2a2a2a' : '#ffffff',
      color: darkMode ? '#ffffff' : '#000000',
      width: '100%',
      maxWidth: '400px',
      outline: 'none',
      transition: 'border-color 0.3s ease',
    },
    searchBoxFocus: {
      borderColor: darkMode ? '#64b5f6' : '#3498db',
    },
    clearButton: {
      backgroundColor: darkMode ? '#666' : '#ccc',
      color: darkMode ? '#ffffff' : '#000000',
      border: 'none',
      padding: '0.75rem 1rem',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '0.9rem',
      minWidth: '60px',
    },
    searchStats: {
      textAlign: 'center',
      margin: '0.5rem 0',
      fontSize: '0.9rem',
      color: darkMode ? '#aaaaaa' : '#666666',
    },
    tableContainer: {
      overflowX: 'auto',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      backgroundColor: darkMode ? '#1e1e1e' : 'white',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      marginTop: '1rem',
    },
    th: {
      backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
      padding: '1rem',
      textAlign: 'left',
      borderBottom: darkMode ? '1px solid #444' : '1px solid #ddd',
    },
    td: {
      padding: '1rem',
      borderBottom: darkMode ? '1px solid #444' : '1px solid #ddd',
    },
    enrollButton: {
      backgroundColor: darkMode ? '#64b5f6' : '#3498db',
      color: 'white',
      border: 'none',
      padding: '0.5rem 1rem',
      borderRadius: '4px',
      cursor: 'pointer',
      marginRight: '0.5rem',
      opacity: processing ? 0.7 : 1,
      pointerEvents: processing ? 'none' : 'auto',
    },
    unenrollButton: {
      backgroundColor: darkMode ? '#e53935' : '#f44336',
      color: 'white',
      border: 'none',
      padding: '0.5rem 1rem',
      borderRadius: '4px',
      cursor: 'pointer',
      opacity: processing ? 0.7 : 1,
      pointerEvents: processing ? 'none' : 'auto',
    },
    successNotification: {
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 9999,
      backgroundColor: darkMode ? '#2e7d32' : '#4CAF50',
      color: 'white',
      padding: '16px 24px',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    errorDisplay: {
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      width: '80%',
      maxWidth: '500px',
      backgroundColor: darkMode ? '#3a1c1c' : '#fdecea',
      color: '#d32f2f',
      padding: '16px',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    },
    errorCloseButton: {
      marginLeft: 'auto',
      background: 'none',
      border: 'none',
      color: '#d32f2f',
      fontSize: '1.2rem',
      cursor: 'pointer',
      padding: '0 5px',
    },
    statusBadge: {
      display: 'inline-block',
      padding: '0.25rem 0.5rem',
      borderRadius: '12px',
      fontSize: '0.8rem',
      fontWeight: '600',
    },
    enrolledBadge: {
      backgroundColor: darkMode ? '#2e7d32' : '#4CAF50',
      color: 'white',
    },
    notEnrolledBadge: {
      backgroundColor: darkMode ? '#FF9800' : '#FFC107',
      color: darkMode ? '#ffffff' : '#000000',
    },
    sameOrgBadge: {
      backgroundColor: darkMode ? '#1976D2' : '#2196F3',
      color: 'white',
    },
    tabContainer: {
      display: 'flex',
      marginBottom: '1rem',
      borderBottom: darkMode ? '1px solid #444' : '1px solid #ddd',
    },
    tabButton: {
      padding: '0.5rem 1rem',
      border: 'none',
      backgroundColor: 'transparent',
      color: darkMode ? '#ffffff' : '#000000',
      cursor: 'pointer',
      marginRight: '0.5rem',
    },
    activeTab: {
      borderBottom: `2px solid ${darkMode ? '#64b5f6' : '#3498db'}`,
      fontWeight: 'bold',
    },
    loadingRow: {
      textAlign: 'center',
      padding: '1rem',
    },
    emptyState: {
      textAlign: 'center',
      padding: '2rem',
      color: darkMode ? '#aaaaaa' : '#666666',
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Sidebar 
          userType={userType}
          onSignOut={handleSignOut}
          sidebarVisible={sidebarVisible}
          setSidebarVisible={setSidebarVisible}
          darkMode={darkMode}
        />
        <div style={styles.loadingContainer}>Loading users...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {successMessage && (
        <div style={styles.successNotification}>
          <div>✓</div>
          <div>{successMessage}</div>
        </div>
      )}

      {error && (
        <div style={styles.errorDisplay}>
          <div>⚠️</div>
          <div>{error}</div>
          <button onClick={() => setError(null)} style={styles.errorCloseButton}>×</button>
        </div>
      )}

      <Sidebar 
        userType={userType}
        onSignOut={handleSignOut}
        sidebarVisible={sidebarVisible}
        setSidebarVisible={setSidebarVisible}
        darkMode={darkMode}
      />

      <div style={styles.mainContent}>
        <div style={styles.header}>
          <h1 style={styles.title}>User Management</h1>
          <p>Manage user enrollment in your organization</p>
          
          <div style={styles.headerActions}>
            <button 
              style={styles.refreshButton}
              onClick={handleManualRefresh}
              disabled={loading}
            >
              {loading ? 'Refreshing...' : '🔄 Refresh Data'}
            </button>
          </div>
        </div>

        <div style={styles.tabContainer}>
          <button 
            style={{...styles.tabButton, ...(activeTab === 'all' && styles.activeTab)}}
            onClick={() => setActiveTab('all')}
          >
            All Users ({users.length})
          </button>
          <button 
            style={{...styles.tabButton, ...(activeTab === 'enrolled' && styles.activeTab)}}
            onClick={() => setActiveTab('enrolled')}
          >
            Enrolled ({enrolledUsers.length})
          </button>
          <button 
            style={{...styles.tabButton, ...(activeTab === 'notEnrolled' && styles.activeTab)}}
            onClick={() => setActiveTab('notEnrolled')}
          >
            Not Enrolled ({notEnrolledUsers.length})
          </button>
        </div>

        <div style={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              ...styles.searchBox,
              ...(searchTerm && styles.searchBoxFocus)
            }}
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              style={styles.clearButton}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {searchTerm && (
          <div style={styles.searchStats}>
            Showing {filteredUsers.length} of {
              activeTab === 'all' ? users.length : 
              activeTab === 'enrolled' ? enrolledUsers.length : 
              notEnrolledUsers.length
            } users matching "{searchTerm}"
          </div>
        )}

        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {processing && (
                <tr>
                  <td colSpan="4" style={styles.loadingRow}>
                    Processing...
                  </td>
                </tr>
              )}
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="4" style={styles.emptyState}>
                    {searchTerm ? 
                      `No users found matching "${searchTerm}"` : 
                      'No users found in this category'
                    }
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td style={styles.td}>{user.firstName} {user.lastName}</td>
                    <td style={styles.td}>{user.email}</td>
                    <td style={styles.td}>
                      {user.isEnrolledInCurrentOrg ? (
                        <span style={{...styles.statusBadge, ...styles.sameOrgBadge}}>Enrolled</span>
                      ) : user.enrolledOrganizations?.length > 0 ? (
                        <span style={{...styles.statusBadge, ...styles.enrolledBadge}}>
                          Enrolled in {user.enrolledOrganizations.length} organization(s)
                        </span>
                      ) : (
                        <span style={{...styles.statusBadge, ...styles.notEnrolledBadge}}>Not Enrolled</span>
                      )}
                    </td>
                    <td style={styles.td}>
                      {!user.isEnrolledInCurrentOrg ? (
                        <button
                          style={styles.enrollButton}
                          onClick={() => handleEnrollUser(user.id)}
                          disabled={processing}
                        >
                          {processing ? 'Processing...' : 'Enroll'}
                        </button>
                      ) : (
                        <button
                          style={styles.unenrollButton}
                          onClick={() => handleUnenrollUser(user.id)}
                          disabled={processing}
                        >
                          {processing ? 'Processing...' : 'Unenroll'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;