import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Modal from 'react-modal';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

Modal.setAppElement('#root');

const SignPage = ({ setIsAuthenticated, setUserType, setUserData, darkMode }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthday: '',
    gender: '',
    email: '',
    password: '',
    accountType: 'USER'
  });
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [deactivatedUser, setDeactivatedUser] = useState(null);
  const navigate = useNavigate();

  const API_BASE_URL = 'http://localhost:8080/api';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    setWarning('');
  };

  const validateForm = () => {
  if (!isLogin) {
    if (!formData.firstName?.trim() || 
        !formData.lastName?.trim() || 
        !formData.birthday || 
        !formData.gender || 
        !formData.email?.trim() || 
        !formData.password) {
      setError('All fields are required');
      return false;
    }
    
    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
  } else {
    if (!formData.email?.trim() || !formData.password) {
      setError('Email and password are required');
      return false;
    }
  }
  return true;
};

  const handleLoginSuccess = (responseData) => {
    const { token, accountType, firstName, lastName, email, birthday, gender } = responseData;
    
    localStorage.setItem('authToken', token);
    setUserType(accountType === 'ADMIN' ? 'admin' : 'user');
    setUserData({
      firstName,
      lastName,
      email,
      birthday,
      gender: gender?.toLowerCase() || ''
    });
    
    setIsAuthenticated(true);
    navigate('/home');
  };

 // In SignPage.js
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  if (!validateForm()) {
    setLoading(false);
    return;
  }

  try {
    const endpoint = isLogin 
      ? `${API_BASE_URL}/auth/login` 
      : `${API_BASE_URL}/users/register`;

    const requestData = isLogin
      ? {
          email: formData.email.trim().toLowerCase(),
          password: formData.password
        }
      : {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          birthday: formData.birthday,
          gender: formData.gender,
          accountType: formData.accountType
        };

    const response = await axios.post(endpoint, requestData);
    
    if (response.status === 403 && response.data?.isDeactivated) {
      setDeactivatedUser({
        email: formData.email.trim().toLowerCase(),
        isDeactivated: true
      });
      setShowReactivateModal(true);
      return;
    }

    if (isLogin) {
      handleLoginSuccess(response.data);
    } else {
      // For registration, automatically log the user in
      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      });
      handleLoginSuccess(loginResponse.data);
    }
  } catch (err) {
    console.error('Error:', err);
    setError(
      err.response?.data?.message || 
      err.message || 
      (isLogin ? 'Login failed' : 'Registration failed')
    );
  } finally {
    setLoading(false);
  }
};

const handleReactivation = async () => {
  setLoading(true);
  setError('');

  try {
    console.log('Attempting reactivation for:', deactivatedUser.email); // Debug log
    
    const response = await fetch('http://localhost:8080/api/users/reactivate', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      })
    });

    const data = await response.json();
    console.log('Reactivation response:', data); // Debug log

    if (!response.ok) {
      throw new Error(data.message || 'Reactivation failed');
    }

    // Verify the account is now active
    const verifyResponse = await fetch(`http://localhost:8080/api/users/check-active?email=${encodeURIComponent(formData.email)}`, {
      headers: { 'Authorization': `Bearer ${data.token}` }
    });
    
    if (!verifyResponse.ok) {
      throw new Error('Failed to verify reactivation status');
    }

    localStorage.setItem('authToken', data.token);
    setIsAuthenticated(true);
    setShowReactivateModal(false);
    navigate('/home');

  } catch (err) {
    console.error('Reactivation error:', err); // Debug log
    setError(err.message || 'Failed to reactivate account');
  } finally {
    setLoading(false);
  }
};

  const styles = {
    container: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: darkMode ? '#121212' : '#f8f9fa',
      padding: '20px'
    },
    card: {
      backgroundColor: darkMode ? '#1e1e1e' : 'white',
      borderRadius: '10px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      width: '100%',
      maxWidth: '450px',
      padding: '40px',
      color: darkMode ? '#ffffff' : '#000000'
    },
    logoContainer: {
      textAlign: 'center',
      marginBottom: '30px'
    },
    logo: {
      color: darkMode ? '#ffffff' : '#2c3e50',
      fontSize: '28px',
      fontWeight: '700',
      margin: 0
    },
    toggleContainer: {
      display: 'flex',
      marginBottom: '25px',
      borderBottom: darkMode ? '1px solid #333' : '1px solid #eaeaea'
    },
    toggleButton: {
      flex: 1,
      padding: '12px',
      border: 'none',
      backgroundColor: 'transparent',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: '600',
      color: darkMode ? '#b0b0b0' : '#7f8c8d',
      transition: 'all 0.3s ease'
    },
    activeButton: {
      color: darkMode ? '#ffffff' : '#2c3e50',
      borderBottom: '3px solid #3498db'
    },
    error: {
      color: '#e74c3c',
      backgroundColor: darkMode ? '#2a1a1a' : '#fadbd8',
      padding: '10px',
      borderRadius: '5px',
      marginBottom: '20px',
      fontSize: '14px'
    },
    warning: {
      color: '#f39c12',
      backgroundColor: darkMode ? '#2a241a' : '#fef5e7',
      padding: '10px',
      borderRadius: '5px',
      marginBottom: '20px',
      fontSize: '14px'
    },
    form: {
      display: 'flex',
      flexDirection: 'column'
    },
    inputGroup: {
      marginBottom: '20px',
      width: '100%'
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontWeight: '500',
      color: darkMode ? '#ffffff' : '#2c3e50',
      fontSize: '14px'
    },
    input: {
      width: '100%',
      padding: '12px 15px',
      border: darkMode ? '1px solid #444' : '1px solid #ddd',
      borderRadius: '6px',
      fontSize: '16px',
      transition: 'border 0.3s ease',
      boxSizing: 'border-box',
      backgroundColor: darkMode ? '#2a2a2a' : 'white',
      color: darkMode ? '#ffffff' : '#000000'
    },
    radioGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      marginTop: '8px'
    },
    radioLabel: {
      display: 'flex',
      alignItems: 'center',
      fontSize: '15px',
      cursor: 'pointer',
      color: darkMode ? '#ffffff' : '#000000'
    },
    radioInput: {
      marginRight: '8px',
      cursor: 'pointer'
    },
    submitButton: {
      backgroundColor: '#3498db',
      color: 'white',
      padding: '14px',
      border: 'none',
      borderRadius: '6px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      marginTop: '10px',
      transition: 'background-color 0.3s ease',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    },
    forgotPassword: {
      textAlign: 'center',
      marginTop: '15px'
    },
    forgotLink: {
      color: darkMode ? '#b0b0b0' : '#7f8c8d',
      fontSize: '14px',
      textDecoration: 'none'
    },
    footer: {
      textAlign: 'center',
      marginTop: '25px',
      color: darkMode ? '#b0b0b0' : '#7f8c8d',
      fontSize: '15px'
    },
    switchLink: {
      color: '#3498db',
      fontWeight: '600',
      cursor: 'pointer',
      '&:hover': {
        textDecoration: 'underline'
      }
    }
  };

  const modalStyles = {
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
      maxWidth: '400px',
      width: '90%',
      borderRadius: '8px',
      padding: '25px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      backgroundColor: darkMode ? '#1e1e1e' : 'white',
      color: darkMode ? '#ffffff' : '#000000'
    },
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 1000
    }
  };

  const buttonStyles = {
    primary: {
      backgroundColor: '#3498db',
      color: 'white',
      padding: '10px 20px',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      margin: '0 5px',
      fontSize: '14px'
    },
    secondary: {
      backgroundColor: darkMode ? '#333' : '#e0e0e0',
      color: darkMode ? '#ffffff' : '#333',
      padding: '10px 20px',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      margin: '0 5px',
      fontSize: '14px'
    },
    disabled: {
      backgroundColor: '#bdc3c7',
      color: '#7f8c8d',
      cursor: 'not-allowed'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logoContainer}>
          <h1 style={styles.logo}>Attendance App</h1>
        </div>
        
        <div style={styles.toggleContainer}>
          <button 
            style={{...styles.toggleButton, ...(isLogin ? styles.activeButton : {})}}
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>
          <button 
            style={{...styles.toggleButton, ...(!isLogin ? styles.activeButton : {})}}
            onClick={() => setIsLogin(false)}
          >
            Sign Up
          </button>
        </div>

        {error && <div style={styles.error}>{error}</div>}
        {warning && <div style={styles.warning}>{warning}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          {!isLogin && (
            <>
              <div style={styles.inputGroup}>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="First Name *"
                  disabled={loading}
                />
              </div>
              <div style={styles.inputGroup}>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Last Name *"
                  disabled={loading}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Birthday *</label>
                <input
                  type="date"
                  name="birthday"
                  value={formData.birthday}
                  onChange={handleChange}
                  style={{...styles.input, padding: '11px 15px'}}
                  disabled={loading}
                  required
                />
              </div>
              <div style={styles.inputGroup}>
               <select
  name="gender"
  value={formData.gender}
  onChange={handleChange}
  style={{...styles.input, padding: '12px 15px', color: formData.gender ? (darkMode ? '#ffffff' : '#2c3e50') : '#7f8c8d'}}
  required
  disabled={loading}
>
  <option value="">Select Gender *</option>
  <option value="MALE">Male</option>
  <option value="FEMALE">Female</option>
  <option value="OTHER">Other</option>
  <option value="UNSPECIFIED">Prefer not to say</option>
</select>
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Account Type *</label>
                <div style={styles.radioGroup}>
                  <label style={styles.radioLabel}>
                    <input
                      type="radio"
                      name="accountType"
                      value="USER"
                      checked={formData.accountType === 'USER'}
                      onChange={handleChange}
                      style={styles.radioInput}
                      disabled={loading}
                    />
                    Regular User
                  </label>
                  <label style={styles.radioLabel}>
                    <input
                      type="radio"
                      name="accountType"
                      value="ADMIN"
                      checked={formData.accountType === 'ADMIN'}
                      onChange={handleChange}
                      style={styles.radioInput}
                      disabled={loading}
                    />
                    Administrator
                  </label>
                </div>
              </div>
            </>
          )}

          <div style={styles.inputGroup}>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              style={styles.input}
              placeholder="Email Address *"
              disabled={loading}
            />
          </div>

          <div style={styles.inputGroup}>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              style={styles.input}
              placeholder={isLogin ? 'Password *' : 'Create Password (min 6 characters) *'}
              minLength="6"
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            style={{
              ...styles.submitButton,
              ...(loading ? { backgroundColor: '#bdc3c7', cursor: 'not-allowed' } : {})
            }}
            disabled={loading}
          >
            {loading ? (
              <>
                <span style={{marginRight: '8px'}}>Processing...</span>
                <i className="fa fa-spinner fa-spin"></i>
              </>
            ) : isLogin ? 'Log In' : 'Sign Up'}
          </button>

          {isLogin && (
            <div style={styles.forgotPassword}>
              <a href="/forgot-password" style={styles.forgotLink}>
                Forgot Password?
              </a>
            </div>
          )}
        </form>

        <div style={styles.footer}>
          {isLogin ? (
            <>Don't have an account? <span 
              style={styles.switchLink}
              onClick={() => setIsLogin(false)}
            >Sign up</span></>
          ) : (
            <>Already have an account? <span 
              style={styles.switchLink}
              onClick={() => setIsLogin(true)}
            >Log in</span></>
          )}
        </div>
      </div>

{showReactivateModal && (
    <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
    }}>
        <div style={{
            backgroundColor: darkMode ? '#1e1e1e' : 'white',
            padding: '2rem',
            borderRadius: '10px',
            maxWidth: '500px',
            width: '90%'
        }}>
            <h2 style={{ marginTop: 0 }}>Account Deactivated</h2>
            <p>Your account ({deactivatedUser?.email}) is currently deactivated.</p>
            <p>Would you like to reactivate it?</p>
            
            {error && <p style={{ color: '#e74c3c' }}>{error}</p>}
            
            <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: '1.5rem',
                gap: '1rem'
            }}>
                <button 
                    onClick={() => setShowReactivateModal(false)}
                    disabled={loading}
                    style={{
                        padding: '0.75rem 1.5rem',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                >
                    Cancel
                </button>
                <button 
                    onClick={handleReactivation}
                    disabled={loading}
                    style={{
                        backgroundColor: '#3498db',
                        color: 'white',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                >
                    {loading ? 'Reactivating...' : 'Yes, Reactivate'}
                </button>
            </div>
        </div>
    </div>
)}

      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={darkMode ? 'dark' : 'light'}
      />
    </div>
  );
};

export default SignPage;