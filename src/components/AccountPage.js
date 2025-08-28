import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './Sidebar';

const AccountPage = ({ 
  userType, 
  onSignOut, 
  userData, 
  setUserData, 
  sidebarVisible, 
  setSidebarVisible,
  darkMode
}) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showOrganizationModal, setShowOrganizationModal] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrolledOrganizations, setEnrolledOrganizations] = useState([]);
  const [currentOrganization, setCurrentOrganization] = useState(null);
  const [organizationMembers, setOrganizationMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthday: '',
    gender: '',
    ministry: '',
    apostolate: '',
    spouseName: '',
    address: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const navigate = useNavigate();

  // Ministry and Apostolate data
  const ministries = [
    'TREASURY', 
    'SERVICE', 
    'MANAGEMENT_SERVICES', 
    'TEACHING', 
    'YOUTH', 
    'PLSG', 
    'INTERCESSORY', 
    'HOMESTEADS', 
    'OUTREACHES', 
    'PRAISE', 
    'LITURGY', 
    'LSS'
  ];
  
  const apostolates = {
    MANAGEMENT: ['TREASURY', 'SERVICE', 'MANAGEMENT_SERVICES'],
    PASTORAL: ['TEACHING', 'YOUTH'],
    FORMATION: ['PLSG', 'INTERCESSORY'],
    MISSION: ['HOMESTEADS', 'OUTREACHES'],
    EVANGELIZATION: ['PRAISE', 'LITURGY', 'LSS']
  };

  // Disable body scroll when modal is open
  useEffect(() => {
    if (showEditModal || showPasswordModal || showOrganizationModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showEditModal, showPasswordModal, showOrganizationModal]);

  // Success notification auto-hide effect
  useEffect(() => {
    if (showSuccessNotification) {
      const timer = setTimeout(() => {
        setShowSuccessNotification(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessNotification]);

  // Fetch user data and organization info on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await axios.get('http://localhost:8080/api/users/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        const { 
          id, firstName, lastName, email, birthday, gender, accountType, 
          ministry, apostolate, spouseName, address, createdAt, updatedAt,
          enrolledOrganizations 
        } = response.data;
        
        const userData = {
          id: id || null,
          firstName: firstName || '',
          lastName: lastName || '',
          email: email || '',
          birthday: birthday || null,
          gender: gender ? gender.toLowerCase() : '',
          accountType: accountType || 'USER',
          ministry: ministry || '',
          apostolate: apostolate || '',
          spouseName: spouseName || '',
          address: address || '',
          createdAt: createdAt || null,
          updatedAt: updatedAt || null
        };
        
        setUserData(userData);
        
        setFormData({
          firstName: firstName || '',
          lastName: lastName || '',
          birthday: birthday || '',
          gender: gender ? gender.toLowerCase() : '',
          ministry: ministry || '',
          apostolate: apostolate || '',
          spouseName: spouseName || '',
          address: address || ''
        });

        // Set enrolled organizations for regular users
        if (enrolledOrganizations) {
          setEnrolledOrganizations(enrolledOrganizations);
        }

        // Fetch organization information for admin users
        if (accountType === 'ADMIN') {
          try {
            const orgResponse = await axios.get(`http://localhost:8080/api/organizers/by-user/${id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            setCurrentOrganization(orgResponse.data);
          } catch (orgError) {
            console.error('Error fetching admin organization:', orgError);
          }
        }
        
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user data. Please try refreshing the page.');
        
        if (err.response?.status === 401) {
          localStorage.removeItem('authToken');
          navigate('/');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  // Fetch organization members
  const fetchOrganizationMembers = async () => {
    if (!currentOrganization) return;
    
    setLoadingMembers(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get('http://localhost:8080/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Filter users enrolled in this organization
      const members = response.data.filter(user => 
        user.enrolledOrganizations && 
        user.enrolledOrganizations.some(org => org.id === currentOrganization.id)
      );
      
      setOrganizationMembers(members);
    } catch (err) {
      console.error('Error fetching organization members:', err);
      setError('Failed to load organization members');
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleOrganizationClick = () => {
    if (userData.accountType === 'ADMIN' && currentOrganization) {
      fetchOrganizationMembers();
      setShowOrganizationModal(true);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMinistryChange = (e) => {
    const selectedMinistry = e.target.value;
    let assignedApostolate = '';
    
    // Find which apostolate this ministry belongs to
    for (const [apostolate, ministryList] of Object.entries(apostolates)) {
      if (ministryList.includes(selectedMinistry)) {
        assignedApostolate = apostolate;
        break;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      ministry: selectedMinistry,
      apostolate: assignedApostolate
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    setPasswordError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await axios.put('http://localhost:8080/api/users/me', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        birthday: formData.birthday,
        gender: formData.gender.toUpperCase(),
        ministry: formData.ministry || null,
        apostolate: formData.apostolate || null,
        spouseName: formData.spouseName || null,
        address: formData.address || null
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const { 
        id, firstName, lastName, email, birthday, gender, accountType, 
        ministry, apostolate, spouseName, address, createdAt, updatedAt,
        enrolledOrganizations 
      } = response.data;      
      
      const updatedUserData = {
        id,
        firstName,
        lastName,
        email,
        birthday,
        gender: gender.toLowerCase(),
        accountType,
        ministry,
        apostolate,
        spouseName,
        address,
        createdAt,
        updatedAt
      };
      
      setUserData(updatedUserData);
      setShowEditModal(false);
      setShowSuccessNotification(true);
      
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      await axios.put('http://localhost:8080/api/users/me/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordError('');
      setShowSuccessNotification(true);
      
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    onSignOut();
    navigate('/');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'Not specified';
    try {
      return new Date(dateTimeString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatEnumValue = (value) => {
    if (!value) return 'Not specified';
    return value.split('_').map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };

  // Styles with dark mode support
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
    subtitle: {
      fontSize: '1.2rem',
      color: darkMode ? '#b0b0b0' : '#7f8c8d',
      marginBottom: '0',
    },
    accountContainer: {
      display: 'flex',
      gap: '2rem',
      margin: '2rem 0',
      flexDirection: 'column',
      '@media (min-width: 768px)': {
        flexDirection: 'row',
      },
    },
    accountCard: {
      flex: 1,
      backgroundColor: darkMode ? '#1e1e1e' : 'white',
      borderRadius: '10px',
      padding: '2rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      color: darkMode ? '#ffffff' : '#000000',
    },
    accountHeader: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '2rem',
      paddingBottom: '1.5rem',
      borderBottom: darkMode ? '1px solid #333' : '1px solid #eee',
    },
    avatar: {
      width: '60px',
      height: '60px',
      borderRadius: '50%',
      backgroundColor: darkMode ? '#64b5f6' : '#3498db',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.5rem',
      fontWeight: 'bold',
      marginRight: '1.5rem',
    },
    accountHeaderText: {
      flex: 1,
    },
    accountName: {
      margin: 0,
      fontSize: '1.5rem',
      color: darkMode ? '#ffffff' : '#2c3e50',
    },
    accountRole: {
      margin: '0.25rem 0 0',
      color: darkMode ? '#b0b0b0' : '#7f8c8d',
      fontSize: '0.9rem',
    },
    accountId: {
      margin: '0.25rem 0 0',
      color: darkMode ? '#757575' : '#95a5a6',
      fontSize: '0.8rem',
      fontFamily: 'monospace',
    },
    accountDetails: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
    },
    detailRow: {
      display: 'flex',
      marginBottom: '1rem',
      '@media (min-width: 480px)': {
        flexDirection: 'row',
      },
      flexDirection: 'column',
    },
    detailLabel: {
      fontWeight: '600',
      color: darkMode ? '#e0e0e0' : '#2c3e50',
      minWidth: '150px',
      marginBottom: '0.5rem',
      '@media (min-width: 480px)': {
        marginBottom: 0,
      },
    },
    detailValue: {
      color: darkMode ? '#b0b0b0' : '#7f8c8d',
      flex: 1,
      display: 'flex',
      alignItems: 'center',
    },
    accountTypeBadge: {
      color: 'white',
      padding: '0.25rem 0.75rem',
      borderRadius: '15px',
      fontSize: '0.8rem',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    organizationCard: {
      backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
      padding: '1rem',
      borderRadius: '8px',
      cursor: userData?.accountType === 'ADMIN' ? 'pointer' : 'default',
      transition: 'background-color 0.2s',
      ':hover': userData?.accountType === 'ADMIN' ? {
        backgroundColor: darkMode ? '#333' : '#e9ecef',
      } : {},
    },
    organizationName: {
      fontWeight: '600',
      color: darkMode ? '#64b5f6' : '#3498db',
      marginBottom: '0.5rem',
    },
    organizationDetails: {
      fontSize: '0.9rem',
      color: darkMode ? '#b0b0b0' : '#7f8c8d',
    },
    clickHint: {
      fontSize: '0.8rem',
      color: darkMode ? '#888' : '#999',
      fontStyle: 'italic',
      marginTop: '0.5rem',
    },
    buttonGroup: {
      display: 'flex',
      gap: '1rem',
      marginTop: '2rem',
      flexWrap: 'wrap',
    },
    editButton: {
      backgroundColor: darkMode ? '#64b5f6' : '#3498db',
      color: 'white',
      border: 'none',
      padding: '0.75rem 1.5rem',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '1rem',
      fontWeight: '600',
    },
    changePasswordButton: {
      backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
      color: darkMode ? '#ffffff' : '#2c3e50',
      border: darkMode ? '1px solid #444' : '1px solid #ddd',
      padding: '0.75rem 1.5rem',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '1rem',
      fontWeight: '600',
      textDecoration: 'none',
      textAlign: 'center',
    },
    adminTools: {
      backgroundColor: darkMode ? '#1e1e1e' : 'white',
      borderRadius: '10px',
      padding: '1.5rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      minWidth: '250px',
      '@media (min-width: 768px)': {
        width: '250px',
      },
    },
    adminToolsTitle: {
      color: darkMode ? '#ffffff' : '#2c3e50',
      fontSize: '1.2rem',
      marginTop: 0,
      marginBottom: '1.5rem',
      paddingBottom: '0.75rem',
      borderBottom: darkMode ? '1px solid #333' : '1px solid #eee',
    },
    adminToolItem: {
      display: 'flex',
      alignItems: 'center',
      padding: '0.75rem 0',
      cursor: 'pointer',
      ':hover': {
        color: darkMode ? '#64b5f6' : '#3498db',
      },
    },
    adminToolIcon: {
      marginRight: '1rem',
      fontSize: '1.2rem',
    },
    adminToolText: {
      fontSize: '0.95rem',
    },
    footer: {
      textAlign: 'center',
      marginTop: 'auto',
      padding: '1rem',
      color: darkMode ? '#b0b0b0' : '#7f8c8d',
      borderTop: darkMode ? '1px solid #333' : '1px solid #eee',
    },
    successNotification: {
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 9999,
    },
    successContent: {
      backgroundColor: darkMode ? '#2e7d32' : '#4CAF50',
      color: 'white',
      padding: '16px 24px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      minWidth: '300px',
      fontSize: '1rem',
      fontWeight: '500',
    },
    successIcon: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: '50%',
      width: '24px',
      height: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '14px',
      fontWeight: 'bold',
    },
    successMessage: {
      flex: 1,
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      overflow: 'hidden',
    },
    modalContent: {
      backgroundColor: darkMode ? '#1e1e1e' : 'white',
      color: darkMode ? '#ffffff' : '#000000',
      borderRadius: '8px',
      boxShadow: '0 5px 20px rgba(0, 0, 0, 0.2)',
      width: '100%',
      maxWidth: '600px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      maxHeight: '90vh',
    },
    modalHeader: {
      padding: '20px',
      backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
      borderBottom: darkMode ? '1px solid #333' : '1px solid #eee',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    modalTitle: {
      margin: 0,
      fontSize: '1.4rem',
      fontWeight: '600',
      color: darkMode ? '#ffffff' : '#2c3e50',
    },
    modalCloseButton: {
      background: 'none',
      border: 'none',
      fontSize: '1.8rem',
      cursor: 'pointer',
      color: darkMode ? '#b0b0b0' : '#95a5a6',
      padding: '0 10px',
      lineHeight: '1',
    },
    modalForm: {
      padding: '25px',
      flex: 1,
    },
    formGroup: {
      marginBottom: '20px',
    },
    formLabel: {
      display: 'block',
      marginBottom: '8px',
      fontSize: '0.95rem',
      fontWeight: '600',
      color: darkMode ? '#e0e0e0' : '#34495e',
    },
    formInput: {
      width: '100%',
      padding: '12px 15px',
      border: darkMode ? '1px solid #444' : '1px solid #ddd',
      borderRadius: '6px',
      fontSize: '1rem',
      boxSizing: 'border-box',
      backgroundColor: darkMode ? '#2a2a2a' : 'white',
      color: darkMode ? '#ffffff' : '#000000',
    },
    errorMessage: {
      backgroundColor: darkMode ? '#3a1c1c' : '#fdecea',
      color: '#d32f2f',
      padding: '12px 15px',
      borderRadius: '6px',
      marginBottom: '20px',
      fontSize: '0.9rem',
    },
    modalButtonGroup: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '12px',
      marginTop: '20px',
      padding: '20px',
      borderTop: darkMode ? '1px solid #333' : '1px solid #f0f0f0',
      backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
    },
    modalCancelButton: {
      backgroundColor: 'transparent',
      color: darkMode ? '#b0b0b0' : '#7f8c8d',
      border: darkMode ? '1px solid #444' : '1px solid #ddd',
      padding: '10px 20px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '0.95rem',
      fontWeight: '600',
    },
    modalSubmitButton: {
      backgroundColor: darkMode ? '#64b5f6' : '#3498db',
      color: 'white',
      border: 'none',
      padding: '10px 20px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '0.95rem',
      fontWeight: '600',
    },
    refreshButton: {
      backgroundColor: darkMode ? '#64b5f6' : '#3498db',
      color: 'white',
      border: 'none',
      padding: '10px 20px',
      borderRadius: '5px',
      cursor: 'pointer',
      marginTop: '20px',
      fontSize: '1rem',
    },
    errorDisplay: {
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      width: '80%',
      maxWidth: '500px',
    },
    errorContent: {
      backgroundColor: darkMode ? '#3a1c1c' : '#fdecea',
      color: '#d32f2f',
      padding: '16px',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    },
    errorIcon: {
      marginRight: '12px',
      fontSize: '1.2rem',
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
    membersContainer: {
      maxHeight: '300px',
      overflowY: 'auto',
      padding: '1rem',
    },
    memberItem: {
      display: 'flex',
      alignItems: 'center',
      padding: '0.75rem',
      borderBottom: darkMode ? '1px solid #333' : '1px solid #eee',
      gap: '1rem',
    },
    memberAvatar: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      backgroundColor: darkMode ? '#64b5f6' : '#3498db',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.9rem',
      fontWeight: 'bold',
    },
    memberInfo: {
      flex: 1,
    },
    memberName: {
      fontWeight: '600',
      marginBottom: '0.25rem',
    },
    memberEmail: {
      fontSize: '0.9rem',
      color: darkMode ? '#b0b0b0' : '#7f8c8d',
    },
    memberCount: {
      textAlign: 'center',
      padding: '1rem',
      color: darkMode ? '#b0b0b0' : '#7f8c8d',
      fontSize: '0.9rem',
    },
  };

  if (loading && !showEditModal && !showPasswordModal && !showOrganizationModal) {
    return <div style={styles.loadingContainer}>Loading user data...</div>;
  }

  if (!userData || !userData.id) {
    return (
      <div style={styles.loadingContainer}>
        <p>Unable to load user data. Please try refreshing the page.</p>
        <button onClick={() => window.location.reload()} style={styles.refreshButton}>
          Refresh Page
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Success Notification */}
      {showSuccessNotification && (
        <div style={styles.successNotification}>
          <div style={styles.successContent}>
            <div style={styles.successIcon}>✓</div>
            <div style={styles.successMessage}>
              Changes saved successfully!
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div style={styles.errorDisplay}>
          <div style={styles.errorContent}>
            <div style={styles.errorIcon}>⚠️</div>
            <div style={styles.errorMessage}>{error}</div>
            <button 
              onClick={() => setError(null)} 
              style={styles.errorCloseButton}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Sidebar Component */}
      <Sidebar 
        userType={userType}
        onSignOut={handleSignOut}
        sidebarVisible={sidebarVisible}
        setSidebarVisible={setSidebarVisible}
        darkMode={darkMode}
      />

      {/* Main Content */}
      <div style={styles.mainContent}>
        <div style={styles.header}>
          <h1 style={styles.title}>Account Settings</h1>
          <p style={styles.subtitle}>Manage your account information</p>
        </div>

        <div style={styles.accountContainer}>
          <div style={styles.accountCard}>
            <div style={styles.accountHeader}>
              <div style={styles.avatar}>
                {userData.firstName?.charAt(0) || '?'}
                {userData.lastName?.charAt(0) || '?'}
              </div>
              <div style={styles.accountHeaderText}>
                <h2 style={styles.accountName}>
                  {userData.firstName || 'Unknown'} {userData.lastName || 'User'}
                </h2>
                <p style={styles.accountRole}>
                  {userData.accountType === 'ADMIN' ? 'Administrator' : 'User'}
                </p>
                <p style={styles.accountId}>
                  User ID: #{userData.id || 'N/A'}
                </p>
              </div>
            </div>

            <div style={styles.accountDetails}>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Email:</span>
                <span style={styles.detailValue}>{userData.email || 'Not specified'}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Account Type:</span>
                <span style={styles.detailValue}>
                  <span style={{
                    ...styles.accountTypeBadge,
                    backgroundColor: userData.accountType === 'ADMIN' ? '#e74c3c' : '#3498db'
                  }}>
                    {userData.accountType === 'ADMIN' ? 'Administrator' : 'User'}
                  </span>
                </span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Birthday:</span>
                <span style={styles.detailValue}>
                  {formatDate(userData.birthday)}
                </span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Gender:</span>
                <span style={styles.detailValue}>
                  {userData.gender ? 
                    userData.gender.charAt(0).toUpperCase() + userData.gender.slice(1).toLowerCase() : 
                    'Not specified'}
                </span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Spouse Name:</span>
                <span style={styles.detailValue}>
                  {userData.spouseName || 'Not specified'}
                </span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Address:</span>
                <span style={styles.detailValue}>
                  {userData.address || 'Not specified'}
                </span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Ministry:</span>
                <span style={styles.detailValue}>
                  {formatEnumValue(userData.ministry)}
                </span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Apostolate:</span>
                <span style={styles.detailValue}>
                  {formatEnumValue(userData.apostolate)}
                </span>
              </div>

              {/* Organization Information */}
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>
                  {userData.accountType === 'ADMIN' ? 'My Organization:' : 'Enrolled Organizations:'}
                </span>
                <span style={styles.detailValue}>
                  {userData.accountType === 'ADMIN' ? (
                    currentOrganization ? (
                      <div 
                        style={styles.organizationCard}
                        onClick={handleOrganizationClick}
                      >
                        <div style={styles.organizationName}>
                          {currentOrganization.organizationName || 'Unnamed Organization'}
                        </div>
                        <div style={styles.organizationDetails}>
                          ID: {currentOrganization.id}
                        </div>
                        <div style={styles.clickHint}>
                          Click to view members
                        </div>
                      </div>
                    ) : (
                      'No organization found'
                    )
                  ) : (
                    enrolledOrganizations && enrolledOrganizations.length > 0 ? (
                      <div style={styles.organizationCard}>
                        {enrolledOrganizations.map(org => (
                          <div key={org.id} style={{marginBottom: '1rem'}}>
                            <div style={styles.organizationName}>
                              {org.organizationName || 'Unnamed Organization'}
                            </div>
                            <div style={styles.organizationDetails}>
                              Organization ID: {org.id}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      'Not enrolled in any organization'
                    )
                  )}
                </span>
              </div>

              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Account Created:</span>
                <span style={styles.detailValue}>
                  {formatDateTime(userData.createdAt)}
                </span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Last Updated:</span>
                <span style={styles.detailValue}>
                  {formatDateTime(userData.updatedAt)}
                </span>
              </div>

              <div style={styles.buttonGroup}>
                <button
                  onClick={() => setShowEditModal(true)}
                  style={styles.editButton}
                  disabled={loading}
                >
                  Edit Profile
                </button>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  style={styles.changePasswordButton}
                  disabled={loading}
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>

          {userData.accountType === 'ADMIN' && (
            <div style={styles.adminTools}>
              <h3 style={styles.adminToolsTitle}>Admin Tools</h3>
              <div 
                style={styles.adminToolItem}
                onClick={() => navigate('/manage-users')}
              >
                <span style={styles.adminToolText}>Manage Users</span>
              </div>
            </div>
          )}
        </div>

        <div style={styles.footer}>
          <p>© {new Date().getFullYear()} Attendance App</p>
        </div>
      </div>

      {/* Organization Members Modal */}
      {showOrganizationModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                Organization Members
              </h2>
              <button 
                onClick={() => setShowOrganizationModal(false)}
                style={styles.modalCloseButton}
              >
                &times;
              </button>
            </div>
            
            <div style={{overflowY: 'auto', flex: 1}}>
              {currentOrganization && (
                <div style={{padding: '20px', borderBottom: darkMode ? '1px solid #333' : '1px solid #eee'}}>
                  <h3 style={{margin: '0 0 0.5rem 0', color: darkMode ? '#64b5f6' : '#3498db'}}>
                    {currentOrganization.organizationName}
                  </h3>
                  <p style={{margin: 0, color: darkMode ? '#b0b0b0' : '#7f8c8d', fontSize: '0.9rem'}}>
                    Organization ID: {currentOrganization.id}
                  </p>
                </div>
              )}
              
              {loadingMembers ? (
                <div style={styles.memberCount}>
                  Loading members...
                </div>
              ) : organizationMembers.length === 0 ? (
                <div style={styles.memberCount}>
                  No members enrolled in this organization yet.
                </div>
              ) : (
                <>
                  <div style={styles.memberCount}>
                    {organizationMembers.length} member{organizationMembers.length !== 1 ? 's' : ''} enrolled
                  </div>
                  <div style={styles.membersContainer}>
                    {organizationMembers.map(member => (
                      <div key={member.id} style={styles.memberItem}>
                        <div style={styles.memberAvatar}>
                          {member.firstName?.charAt(0) || '?'}
                          {member.lastName?.charAt(0) || '?'}
                        </div>
                        <div style={styles.memberInfo}>
                          <div style={styles.memberName}>
                            {member.firstName} {member.lastName}
                          </div>
                          <div style={styles.memberEmail}>
                            {member.email}
                          </div>
                          {member.ministry && (
                            <div style={{fontSize: '0.8rem', color: darkMode ? '#888' : '#999', marginTop: '0.25rem'}}>
                              {formatEnumValue(member.ministry)} • {formatEnumValue(member.apostolate)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            
            <div style={styles.modalButtonGroup}>
              <button
                type="button"
                onClick={() => setShowOrganizationModal(false)}
                style={styles.modalCancelButton}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div style={styles.modalOverlay}>
          <div style={{...styles.modalContent, maxHeight: '80vh', display: 'flex', flexDirection: 'column'}}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Edit Profile</h2>
              <button 
                onClick={() => setShowEditModal(false)}
                style={styles.modalCloseButton}
              >
                &times;
              </button>
            </div>
            
            <div style={{overflowY: 'auto', flex: 1}}>
              <form onSubmit={handleSubmit} style={styles.modalForm}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    style={styles.formInput}
                    required
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    style={styles.formInput}
                    required
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Birthday</label>
                  <input
                    type="date"
                    name="birthday"
                    value={formData.birthday}
                    onChange={handleChange}
                    style={styles.formInput}
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    style={styles.formInput}
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="unspecified">Prefer not to say</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Spouse Name</label>
                  <input
                    type="text"
                    name="spouseName"
                    value={formData.spouseName}
                    onChange={handleChange}
                    style={styles.formInput}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    style={{...styles.formInput, minHeight: '80px'}}
                    rows="3"
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Ministry</label>
                  <select
                    name="ministry"
                    value={formData.ministry}
                    onChange={handleMinistryChange}
                    style={styles.formInput}
                  >
                    <option value="">Select Ministry</option>
                    {ministries.map(ministry => (
                      <option key={ministry} value={ministry}>
                        {formatEnumValue(ministry)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Apostolate</label>
                  <input
                    type="text"
                    value={formatEnumValue(formData.apostolate)}
                    style={styles.formInput}
                    readOnly
                  />
                </div>
              </form>
            </div>
            
            <div style={styles.modalButtonGroup}>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                style={styles.modalCancelButton}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                style={styles.modalSubmitButton}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div style={styles.modalOverlay}>
          <div style={{...styles.modalContent, maxHeight: '80vh', display: 'flex', flexDirection: 'column'}}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Change Password</h2>
              <button 
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordError('');
                }}
                style={styles.modalCloseButton}
              >
                &times;
              </button>
            </div>
            
            <div style={{overflowY: 'auto', flex: 1}}>
              <form onSubmit={handlePasswordSubmit} style={styles.modalForm}>
                {passwordError && (
                  <div style={styles.errorMessage}>
                    {passwordError}
                  </div>
                )}
                
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Current Password</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    style={styles.formInput}
                    required
                    placeholder="Enter your current password"
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    style={styles.formInput}
                    minLength="6"
                    required
                    placeholder="Enter new password (min 6 characters)"
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Confirm New Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    style={styles.formInput}
                    minLength="6"
                    required
                    placeholder="Confirm your new password"
                  />
                </div>
              </form>
            </div>
            
            <div style={styles.modalButtonGroup}>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordError('');
                }}
                style={styles.modalCancelButton}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handlePasswordSubmit}
                style={styles.modalSubmitButton}
                disabled={loading}
              >
                {loading ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountPage;