// src/components/SystemSettingsPage.js
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';

const SystemSettingsPage = ({ 
  userType, 
  onSignOut, 
  userData,
  sidebarVisible, 
  setSidebarVisible,
  darkMode,
  toggleDarkMode 
}) => {
  const [settings, setSettings] = useState({
    sidebarColor: '#2c3e50',
    sidebarLogoUrl: '',
    organizationName: 'Attendance System'
  });
  const [loading, setLoading] = useState(false);
  const [fetchingSettings, setFetchingSettings] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [imageError, setImageError] = useState(false);
  const [imageRetryCount, setImageRetryCount] = useState(0);
  const hasFetchedRef = useRef(false);

  // Check if current user is system owner
  const isSystemOwner = userType === 'system_owner' || localStorage.getItem('userType') === 'system_owner';

  // Helper function to format logo URL for display
  const formatLogoUrl = (url) => {
    if (!url) return '';
    
    console.log('SystemSettings - Formatting logo URL:', url);
    
    // If URL is already absolute, return as is
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
      console.log('SystemSettings - URL is absolute, returning as-is:', url);
      return url;
    }
    
    // For relative URLs starting with /uploads/, prepend the base URL
    if (url.startsWith('/uploads/')) {
      const formattedUrl = `http://localhost:8080${url}`;
      console.log('SystemSettings - Formatted URL:', formattedUrl);
      return formattedUrl;
    }
    
    // If it doesn't start with /, assume it needs /uploads/ prefix
    const formattedUrl = `http://localhost:8080/uploads/${url}`;
    console.log('SystemSettings - Added uploads prefix:', formattedUrl);
    return formattedUrl;
  };

  useEffect(() => {
    // Prevent multiple fetches
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const fetchSystemSettings = async () => {
      setFetchingSettings(true);
      try {
        const token = localStorage.getItem('authToken');
        const response = await axios.get('http://localhost:8080/api/system/settings', {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('SystemSettings - Fetched settings:', response.data);
        
        // Reset error states when new settings are loaded
        setImageError(false);
        setImageRetryCount(0);
        
        // Format the logo URL before setting
        const formattedSettings = {
          ...response.data,
          sidebarLogoUrl: formatLogoUrl(response.data.sidebarLogoUrl)
        };
        
        setSettings(formattedSettings);
        console.log('SystemSettings - Formatted settings:', formattedSettings);
      } catch (error) {
        console.error('SystemSettings - Error fetching system settings:', error);
        
        // Use default settings if fetch fails
        setSettings({
          sidebarColor: '#2c3e50',
          sidebarLogoUrl: '',
          organizationName: 'Attendance System'
        });
        setError('Using default settings - unable to load from server: ' + (error.response?.data?.message || error.message));
      } finally {
        setFetchingSettings(false);
      }
    };

    // Add a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (fetchingSettings) {
        console.warn('SystemSettings - Settings fetch timeout - using defaults');
        setSettings({
          sidebarColor: '#2c3e50',
          sidebarLogoUrl: '',
          organizationName: 'Attendance System'
        });
        setFetchingSettings(false);
        setError('Connection timeout - using default settings');
      }
    }, 10000); // 10 second timeout

    fetchSystemSettings();

    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveSettings = async () => {
    if (!isSystemOwner) {
      setError('Only System Owners can modify system settings');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const token = localStorage.getItem('authToken');
      
      // Send the raw sidebarLogoUrl (not the formatted one) to the backend
      const settingsToSave = {
        ...settings,
        // Extract the raw URL path if it's a formatted URL
        sidebarLogoUrl: settings.sidebarLogoUrl.includes('http://localhost:8080') 
          ? settings.sidebarLogoUrl.replace('http://localhost:8080', '') 
          : settings.sidebarLogoUrl
      };
      
      console.log('SystemSettings - Saving settings:', settingsToSave);
      
      const response = await axios.put('http://localhost:8080/api/system/settings', settingsToSave, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('SystemSettings - Settings saved:', response.data);
      setSuccessMessage('Settings saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('SystemSettings - Error saving settings:', error);
      setError('Failed to save settings: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleLogoError = (e) => {
    const failedUrl = e.target.src;
    console.error('SystemSettings - Failed to load logo image:', failedUrl);
    console.log('SystemSettings - Retry count:', imageRetryCount);
    
    // Only retry once with the API endpoint
    if (imageRetryCount === 0 && settings.sidebarLogoUrl) {
      setImageRetryCount(1);
      
      // Extract filename from the original URL
      const originalUrl = settings.sidebarLogoUrl;
      const filename = originalUrl.split('/').pop().split('?')[0]; // Remove query params if any
      const fallbackUrl = `http://localhost:8080/api/uploads/${filename}`;
      
      console.log('SystemSettings - Retrying with API endpoint:', fallbackUrl);
      e.target.src = fallbackUrl;
      return;
    }
    
    // If retry also failed or no retry needed, hide image and show error
    console.error('SystemSettings - All logo loading attempts failed, hiding image');
    setImageError(true);
    e.target.style.display = 'none';
    setError(`Failed to load logo image. Please check if the file exists and is accessible.`);
  };

  const handleLogoLoad = (e) => {
    console.log('SystemSettings - Logo image loaded successfully:', e.target.src);
    e.target.style.display = 'block';
    setImageError(false);
    setImageRetryCount(0);
    // Clear any previous error when image loads successfully
    if (error && error.includes('Failed to load logo image')) {
      setError('');
    }
  };

  const handleLogoUpload = async (e) => {
    if (!isSystemOwner) {
      setError('Only System Owners can upload logos');
      return;
    }

    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    // Create a preview URL for immediate display
    const previewUrl = URL.createObjectURL(file);
    setSettings(prev => ({ ...prev, sidebarLogoUrl: previewUrl }));

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    setError('');
    setImageError(false);
    setImageRetryCount(0);

    try {
      const token = localStorage.getItem('authToken');
      console.log('SystemSettings - Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type);
      
      const response = await axios.post('http://localhost:8080/api/upload/logo', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('SystemSettings - Logo upload response:', response.data);
      console.log('SystemSettings - Logo URL from server:', response.data.url);
      
      // Format the URL properly for display
      const formattedUrl = formatLogoUrl(response.data.url);
      console.log('SystemSettings - Formatted URL:', formattedUrl);
      
      setSettings(prev => ({ ...prev, sidebarLogoUrl: formattedUrl }));
      setSuccessMessage('Logo uploaded successfully! Don\'t forget to save your settings.');
      setTimeout(() => setSuccessMessage(''), 5000);
      
      // Clean up the preview URL
      URL.revokeObjectURL(previewUrl);
      
    } catch (error) {
      console.error('SystemSettings - Error uploading logo:', error);
      setError('Failed to upload logo: ' + (error.response?.data?.message || error.message));
      // Revert to previous logo URL on error
      setSettings(prev => ({ ...prev, sidebarLogoUrl: prev.sidebarLogoUrl }));
      URL.revokeObjectURL(previewUrl);
    } finally {
      setLoading(false);
    }
  };

  const handleResetToDefault = () => {
    if (!isSystemOwner) return;
    
    setSettings({
      sidebarColor: '#2c3e50',
      sidebarLogoUrl: '',
      organizationName: 'Attendance System'
    });
    setImageError(false);
    setImageRetryCount(0);
    setSuccessMessage('Settings reset to default!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

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
    },
    header: {
      textAlign: "left",
      marginBottom: "2rem",
      padding: "0 1rem"
    },
    title: {
      fontSize: "2.5rem",
      color: darkMode ? "#ffffff" : "#2c3e50",
      marginBottom: "0.5rem"
    },
    subtitle: {
      fontSize: "1.1rem",
      color: darkMode ? "#b0b0b0" : "#7f8c8d",
      marginBottom: "0"
    },
    settingsContainer: {
      maxWidth: "800px",
      margin: "0 auto",
      width: "100%",
      padding: "0 1rem"
    },
    settingsCard: {
      backgroundColor: darkMode ? "#1e1e1e" : "white",
      borderRadius: "10px",
      padding: "2rem",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      marginBottom: "2rem",
      color: darkMode ? "#ffffff" : "#000000",
      border: darkMode ? "1px solid #333" : "none",
    },
    cardTitle: {
      fontSize: "1.5rem",
      color: darkMode ? "#ffffff" : "#2c3e50",
      marginBottom: "1.5rem",
      borderBottom: darkMode ? "2px solid #333" : "2px solid #eee",
      paddingBottom: "0.5rem"
    },
    formGroup: {
      marginBottom: "1.5rem"
    },
    label: {
      display: "block",
      marginBottom: "0.5rem",
      fontWeight: "600",
      color: darkMode ? "#ffffff" : "#2c3e50",
      fontSize: "1rem"
    },
    colorInput: {
      width: "100%",
      height: "50px",
      border: darkMode ? "2px solid #444" : "2px solid #ddd",
      borderRadius: "8px",
      padding: "0.5rem",
      backgroundColor: darkMode ? "#2a2a2a" : "white",
      color: darkMode ? "#ffffff" : "#000000",
      cursor: isSystemOwner ? "pointer" : "not-allowed",
      transition: "border-color 0.3s ease",
      opacity: isSystemOwner ? 1 : 0.6
    },
    textInput: {
      width: "100%",
      padding: "0.75rem",
      border: darkMode ? "2px solid #444" : "2px solid #ddd",
      borderRadius: "8px",
      backgroundColor: darkMode ? "#2a2a2a" : "white",
      color: darkMode ? "#ffffff" : "#000000",
      fontSize: "1rem",
      transition: "border-color 0.3s ease",
      cursor: isSystemOwner ? "text" : "not-allowed",
      opacity: isSystemOwner ? 1 : 0.6
    },
    fileInput: {
      width: "100%",
      padding: "0.75rem",
      border: darkMode ? "2px solid #444" : "2px solid #ddd",
      borderRadius: "8px",
      backgroundColor: darkMode ? "#2a2a2a" : "white",
      color: darkMode ? "#ffffff" : "#000000",
      fontSize: "1rem",
      cursor: isSystemOwner ? "pointer" : "not-allowed",
      transition: "border-color 0.3s ease",
      opacity: isSystemOwner ? 1 : 0.6
    },
    buttonContainer: {
      display: "flex",
      gap: "1rem",
      alignItems: "center",
      flexWrap: "wrap"
    },
    saveButton: {
      backgroundColor: isSystemOwner ? "#3498db" : "#95a5a6",
      color: "white",
      border: "none",
      padding: "0.75rem 1.5rem",
      borderRadius: "8px",
      cursor: isSystemOwner && !loading ? "pointer" : "not-allowed",
      fontSize: "1rem",
      fontWeight: "600",
      transition: "background-color 0.3s ease",
      opacity: (isSystemOwner && !loading) ? 1 : 0.6
    },
    resetButton: {
      backgroundColor: isSystemOwner ? (darkMode ? "#555" : "#95a5a6") : "#ccc",
      color: "white",
      border: "none",
      padding: "0.75rem 1.5rem",
      borderRadius: "8px",
      cursor: isSystemOwner ? "pointer" : "not-allowed",
      fontSize: "1rem",
      fontWeight: "600",
      transition: "background-color 0.3s ease",
      opacity: isSystemOwner ? 1 : 0.6
    },
    messageContainer: {
      marginBottom: "1rem",
      padding: "0.75rem",
      borderRadius: "6px",
      fontSize: "0.9rem"
    },
    successMessage: {
      backgroundColor: "#d4edda",
      color: "#155724",
      border: "1px solid #c3e6cb"
    },
    errorMessage: {
      backgroundColor: "#f8d7da",
      color: "#721c24",
      border: "1px solid #f5c6cb"
    },
    previewSection: {
      marginTop: "2rem",
      padding: "1.5rem",
      backgroundColor: darkMode ? "#2a2a2a" : "#f8f9fa",
      borderRadius: "10px",
      border: darkMode ? "1px solid #444" : "1px solid #eee"
    },
    previewTitle: {
      color: darkMode ? "#ffffff" : "#2c3e50",
      marginBottom: "1rem",
      fontSize: "1.2rem",
      fontWeight: "600"
    },
    sidebarPreview: {
      width: "250px",
      height: "120px",
      backgroundColor: settings.sidebarColor,
      borderRadius: "10px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      color: "white",
      fontWeight: "bold",
      marginBottom: "1rem",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      gap: "0.5rem"
    },
    logoPreview: {
      width: "60px",
      height: "60px",
      borderRadius: "8px",
      objectFit: "contain",
      backgroundColor: "white",
      padding: "5px",
      border: darkMode ? "1px solid #444" : "1px solid #ddd"
    },
    logoPlaceholder: {
      width: "60px",
      height: "60px",
      borderRadius: "8px",
      backgroundColor: darkMode ? "#444" : "#ddd",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: darkMode ? "#999" : "#666",
      fontSize: "12px",
      fontWeight: "bold"
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
      zIndex: 1000,
      color: "white",
      fontSize: "1.2rem"
    },
    restrictionNotice: {
      backgroundColor: darkMode ? "#2d3748" : "#e3f2fd",
      border: darkMode ? "1px solid #4a5568" : "1px solid #bbdefb",
      borderRadius: "8px",
      padding: "1rem",
      marginBottom: "1.5rem",
      color: darkMode ? "#90cdf4" : "#1565c0",
      fontSize: "0.9rem",
      lineHeight: "1.5"
    }
  };

  if (fetchingSettings) {
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
          marginLeft: sidebarVisible ? '250px' : '0',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{ textAlign: 'center' }}>
            <h2>Loading System Settings...</h2>
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
          <h1 style={styles.title}>System Settings</h1>
          <p style={styles.subtitle}>Configure system-wide appearance and branding</p>
        </div>

        <div style={styles.settingsContainer}>
          <div style={styles.settingsCard}>
            <h2 style={styles.cardTitle}>Sidebar Customization</h2>
            
            {!isSystemOwner && (
              <div style={styles.restrictionNotice}>
                <strong>Notice:</strong> Only System Owners can modify these settings. 
                The current sidebar appearance will only be visible to System Owner accounts.
                Changes will not be reflected for User and Admin accounts at this time.
              </div>
            )}
            
            {successMessage && (
              <div style={{...styles.messageContainer, ...styles.successMessage}}>
                {successMessage}
              </div>
            )}
            
            {error && (
              <div style={{...styles.messageContainer, ...styles.errorMessage}}>
                {error}
              </div>
            )}

            <div style={styles.formGroup}>
              <label style={styles.label}>Organization Name</label>
              <input
                type="text"
                name="organizationName"
                value={settings.organizationName || ''}
                onChange={handleInputChange}
                style={styles.textInput}
                placeholder="Enter organization name"
                maxLength="50"
                disabled={!isSystemOwner}
                readOnly={!isSystemOwner}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Sidebar Color</label>
              <input
                type="color"
                name="sidebarColor"
                value={settings.sidebarColor || '#2c3e50'}
                onChange={handleInputChange}
                style={styles.colorInput}
                disabled={!isSystemOwner}
              />
              <small style={{ color: darkMode ? '#b0b0b0' : '#7f8c8d', marginTop: '0.25rem', display: 'block' }}>
                Current: {settings.sidebarColor}
              </small>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Sidebar Logo</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                style={styles.fileInput}
                disabled={!isSystemOwner}
              />
              <small style={{ color: darkMode ? '#b0b0b0' : '#7f8c8d', marginTop: '0.25rem', display: 'block' }}>
                Supported formats: JPEG, PNG, GIF, WebP (Max: 5MB)
              </small>
              
              {/* Improved logo display */}
              <div style={{marginTop: '1rem'}}>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: '500' }}>
                  {settings.sidebarLogoUrl ? 'Current logo:' : 'No logo uploaded'}
                </p>
                {settings.sidebarLogoUrl ? (
                  <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                    <img 
                      src={settings.sidebarLogoUrl} 
                      alt="Current logo" 
                      style={imageError ? {...styles.logoPreview, display: 'none'} : styles.logoPreview}
                      onError={handleLogoError}
                      onLoad={handleLogoLoad}
                    />
                    {imageError && (
                      <div style={styles.logoPlaceholder}>
                        Error
                      </div>
                    )}
                    <div style={{fontSize: '0.8rem', color: darkMode ? '#b0b0b0' : '#666'}}>
                      <div>URL: {settings.sidebarLogoUrl}</div>
                      <button 
                        onClick={() => {
                          setSettings(prev => ({ ...prev, sidebarLogoUrl: '' }));
                          setImageError(false);
                          setImageRetryCount(0);
                          setSuccessMessage('Logo removed! Don\'t forget to save your settings.');
                          setTimeout(() => setSuccessMessage(''), 3000);
                        }}
                        style={{
                          marginTop: '0.5rem',
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#e74c3c',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.7rem'
                        }}
                        disabled={!isSystemOwner}
                      >
                        Remove Logo
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={styles.logoPlaceholder}>
                    No Logo
                  </div>
                )}
              </div>
            </div>

            <div style={styles.buttonContainer}>
              <button 
                onClick={handleSaveSettings} 
                style={styles.saveButton}
                disabled={!isSystemOwner || loading}
                onMouseEnter={(e) => {
                  if (isSystemOwner && !loading) {
                    e.target.style.backgroundColor = '#2980b9';
                  }
                }}
                onMouseLeave={(e) => {
                  if (isSystemOwner && !loading) {
                    e.target.style.backgroundColor = '#3498db';
                  }
                }}
              >
                {loading ? 'Saving...' : 'Save Settings'}
              </button>

              <button 
                onClick={handleResetToDefault}
                style={styles.resetButton}
                disabled={!isSystemOwner}
                onMouseEnter={(e) => {
                  if (isSystemOwner) {
                    e.target.style.backgroundColor = darkMode ? '#666' : '#7f8c8d';
                  }
                }}
                onMouseLeave={(e) => {
                  if (isSystemOwner) {
                    e.target.style.backgroundColor = darkMode ? '#555' : '#95a5a6';
                  }
                }}
              >
                Reset to Default
              </button>
            </div>

            <div style={styles.previewSection}>
              <h3 style={styles.previewTitle}>Live Preview</h3>
              <div style={styles.sidebarPreview}>
                {settings.sidebarLogoUrl && !imageError ? (
                  <img 
                    src={settings.sidebarLogoUrl} 
                    alt="Logo preview" 
                    style={styles.logoPreview}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div style={{fontSize: '24px'}}>🏢</div>
                )}
                <span style={{ fontSize: '0.9rem', textAlign: 'center', padding: '0 1rem' }}>
                  {settings.organizationName || 'Attendance System'}
                </span>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                fontSize: '0.9rem',
                color: darkMode ? '#b0b0b0' : '#7f8c8d'
              }}>
                <span>Color: {settings.sidebarColor}</span>
                <span>Logo: {settings.sidebarLogoUrl && !imageError ? 'Uploaded' : 'None'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div style={styles.loadingOverlay}>
          <div>Processing...</div>
        </div>
      )}
    </div>
  );
};

export default SystemSettingsPage;