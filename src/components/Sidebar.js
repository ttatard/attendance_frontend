// src/components/Sidebar.js
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import axios from "axios";

const Sidebar = ({ 
  userType, 
  onSignOut, 
  sidebarVisible, 
  setSidebarVisible,
  darkMode,
  toggleDarkMode 
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [systemSettings, setSystemSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [imageRetryCount, setImageRetryCount] = useState(0);
  const location = useLocation();

  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile && sidebarVisible) {
        setSidebarVisible(false);
      }
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, [sidebarVisible, setSidebarVisible]);

  // Simplified logo URL formatter
  const formatLogoUrl = (url) => {
    if (!url) return '';
    
    console.log('Sidebar - Formatting logo URL:', url);
    
    // If URL is already absolute, return as is
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
      console.log('Sidebar - URL is absolute, returning as-is:', url);
      return url;
    }
    
    // For relative URLs starting with /uploads/, prepend the base URL
    if (url.startsWith('/uploads/')) {
      const formattedUrl = `http://localhost:8080${url}`;
      console.log('Sidebar - Formatted URL:', formattedUrl);
      return formattedUrl;
    }
    
    // If it doesn't start with /, assume it needs /uploads/ prefix
    const formattedUrl = `http://localhost:8080/uploads/${url}`;
    console.log('Sidebar - Added uploads prefix:', formattedUrl);
    return formattedUrl;
  };

  // Test function to verify image accessibility
  const testImageUrl = async (url) => {
    if (!url) return false;
    
    try {
      console.log('Sidebar - Testing image URL:', url);
      
      const response = await fetch(url, { method: 'HEAD' });
      console.log('Sidebar - Image URL test response:', response.status, response.statusText);
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        console.log('Sidebar - Content-Type:', contentType);
        
        if (contentType && contentType.startsWith('image/')) {
          console.log('Sidebar - ✅ Image URL is accessible and valid');
          return true;
        } else {
          console.warn('Sidebar - ⚠️ URL accessible but not an image');
          return false;
        }
      } else {
        console.error('Sidebar - ❌ Image URL not accessible:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Sidebar - ❌ Error testing image URL:', error);
      return false;
    }
  };

  // Fetch system settings
  useEffect(() => {
    const fetchSystemSettings = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await axios.get('http://localhost:8080/api/system/settings', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('Sidebar - Fetched settings:', response.data);
        
        // Reset image error state when new settings are loaded
        setImageError(false);
        setImageRetryCount(0);
        
        // Format the logo URL
        const formattedSettings = {
          ...response.data,
          sidebarLogoUrl: formatLogoUrl(response.data.sidebarLogoUrl)
        };
        
        console.log('Sidebar - Formatted settings:', formattedSettings);
        setSystemSettings(formattedSettings);

        // Test image URL if it exists
        if (formattedSettings.sidebarLogoUrl) {
          const isValid = await testImageUrl(formattedSettings.sidebarLogoUrl);
          if (!isValid) {
            console.warn('Sidebar - Pre-test failed, image may not load properly');
          }
        }

      } catch (error) {
        console.error('Sidebar - Error fetching system settings:', error);
        // Use default settings if fetch fails
        setSystemSettings({
          sidebarColor: '#2c3e50',
          organizationName: 'Attendance System',
          sidebarLogoUrl: ''
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSystemSettings();
  }, []);

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  // Helper function to determine if a menu item is active
  const isActiveMenuItem = (path) => {
    // Handle exact matches and related paths
    if (path === location.pathname) return true;
    
    // Handle Events path variations
    if (path === "/admin/events" && location.pathname === "/admin/events") return true;
    if (path === "/events" && location.pathname === "/events") return true;
    
    return false;
  };

  // Dynamic menu items based on user type
  const getMenuItems = () => {
    // Get userType from localStorage as backup
    const currentUserType = userType || localStorage.getItem('userType') || 'user';
    
    const items = [
      { path: "/home", label: "Home" },
    ];

    // Events - different paths for different user types
    if (currentUserType === 'admin' || currentUserType === 'system_owner') {
      items.push({ path: "/admin/events", label: "Events" });
    } else {
      items.push({ path: "/events", label: "Events" });
    }

    // Common items for all authenticated users
    items.push(
      { path: "/reports", label: "Reports" },
      { path: "/account", label: "Account" }
    );

    // Admin specific items (both admin and system_owner can manage users)
    if (currentUserType === 'admin' || currentUserType === 'system_owner') {
      items.push({ path: "/manage-users", label: "Manage Users" });
    }

    // System Owner specific items
    if (currentUserType === 'system_owner') {
      items.push(
        { path: "/system/users", label: "All Users" },
        { path: "/system/owners", label: "System Owners" },
        { path: "/system/settings", label: "System Settings" },
        { path: "/system/audit", label: "Audit Logs" }
      );
    }

    return items;
  };

  const handleLogoError = (e) => {
    const failedUrl = e.target.src;
    console.error('Sidebar - Failed to load logo image:', failedUrl);
    console.log('Sidebar - Retry count:', imageRetryCount);
    
    // Only retry once with the API endpoint
    if (imageRetryCount === 0 && systemSettings?.sidebarLogoUrl) {
      setImageRetryCount(1);
      
      // Extract filename from the original URL
      const originalUrl = systemSettings.sidebarLogoUrl;
      const filename = originalUrl.split('/').pop().split('?')[0]; // Remove query params if any
      const fallbackUrl = `http://localhost:8080/api/uploads/${filename}`;
      
      console.log('Sidebar - Retrying with API endpoint:', fallbackUrl);
      e.target.src = fallbackUrl;
      return;
    }
    
    // If retry also failed or no retry needed, hide image
    console.error('Sidebar - All logo loading attempts failed, hiding image');
    setImageError(true);
    e.target.style.display = 'none';
  };

  const handleLogoLoad = (e) => {
    console.log('Sidebar - Logo image loaded successfully:', e.target.src);
    e.target.style.display = 'block';
    setImageError(false);
    setImageRetryCount(0); // Reset retry count on successful load
  };

  const styles = {
    sidebar: {
      position: "fixed",
      left: 0,
      top: 0,
      width: "250px",
      height: "100vh",
      backgroundColor: systemSettings?.sidebarColor || (darkMode ? "#1e1e1e" : "#2c3e50"),
      color: darkMode ? "#ffffff" : "white",
      boxShadow: "2px 0 10px rgba(0,0,0,0.1)",
      transform: sidebarVisible ? 'translateX(0)' : 'translateX(-100%)',
      transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      display: "flex",
      flexDirection: "column",
      zIndex: 100,
    },
    hoverTrigger: {
      position: "fixed",
      left: 0,
      top: 0,
      width: "20px",
      height: "100vh",
      zIndex: 99,
      backgroundColor: "transparent",
    },
    pullTab: {
      position: 'absolute',
      left: '100%',
      top: '50%',
      transform: 'translateY(-50%)',
      width: '24px',
      height: '72px',
      backgroundColor: systemSettings?.sidebarColor || (darkMode ? '#1e1e1e' : '#2c3e50'),
      border: 'none',
      borderRadius: '0 4px 4px 0',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '2px 2px 5px rgba(0,0,0,0.2)',
      color: 'white',
      zIndex: 101,
    },
    mobileToggle: {
      position: 'absolute',
      left: '100%',
      top: '20px',
      width: '40px',
      height: '40px',
      backgroundColor: systemSettings?.sidebarColor || (darkMode ? '#1e1e1e' : '#2c3e50'),
      border: 'none',
      borderRadius: '0 4px 4px 0',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '2px 2px 5px rgba(0,0,0,0.2)',
      color: 'white',
      zIndex: 101,
    },
    header: {
      padding: "20px",
      borderBottom: darkMode ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(255,255,255,0.1)",
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "10px"
    },
    logo: {
      width: "60px",
      height: "60px",
      borderRadius: "8px",
      objectFit: "contain",
      backgroundColor: "white",
      padding: "5px",
      display: imageError ? 'none' : 'block'
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
      fontSize: "24px",
      fontWeight: "bold"
    },
    organizationName: {
      margin: 0,
      fontSize: "16px",
      fontWeight: "bold",
      color: "white"
    },
    menuItem: {
      display: "flex",
      alignItems: "center",
      padding: "12px 20px",
      color: darkMode ? "#ffffff" : "white",
      textDecoration: "none",
      transition: "background-color 0.2s",
      borderLeft: "3px solid transparent",
    },
    activeMenuItem: {
      backgroundColor: darkMode ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.1)",
      borderLeft: "3px solid #3498db"
    },
    hoverMenuItem: {
      backgroundColor: darkMode ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.1)"
    },
    footer: {
      padding: "20px",
      borderTop: darkMode ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(255,255,255,0.1)",
      marginTop: "auto"
    },
    supportLink: {
      display: "block",
      padding: "8px 20px",
      color: darkMode ? "#b0b0b0" : "#bdc3c7",
      textDecoration: "none",
      marginBottom: "10px",
      transition: "color 0.2s",
    },
    signOutButton: {
      width: "100%",
      padding: "10px",
      backgroundColor: darkMode ? "rgba(231, 76, 60, 0.2)" : "rgba(231, 76, 60, 0.1)",
      color: "#e74c3c",
      border: darkMode ? "1px solid rgba(231, 76, 60, 0.5)" : "1px solid rgba(231, 76, 60, 0.3)",
      borderRadius: "4px",
      cursor: "pointer",
      transition: "all 0.2s",
      fontWeight: "500",
    },
    darkModeToggle: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "10px 20px",
      margin: "10px 0",
      backgroundColor: darkMode ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.1)",
      borderRadius: "4px",
      cursor: "pointer",
      color: darkMode ? "#ffffff" : "white"
    },
    roleBadge: {
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: "12px",
      fontSize: "12px",
      fontWeight: "bold",
      marginLeft: "8px",
      backgroundColor: (userType || localStorage.getItem('userType')) === 'system_owner' ? "#9b59b6" : 
                     (userType || localStorage.getItem('userType')) === 'admin' ? "#3498db" : "#2ecc71",
      color: "white"
    },
    loadingSpinner: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100px',
      color: 'white'
    },
    errorMessage: {
      fontSize: '10px',
      color: darkMode ? '#ff6b6b' : '#e74c3c',
      textAlign: 'center',
      marginTop: '5px'
    }
  };

  if (loading) {
    return (
      <div style={{
        ...styles.sidebar,
        transform: 'translateX(-100%)',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={styles.loadingSpinner}>Loading...</div>
      </div>
    );
  }

  // Get current userType for display
  const currentUserType = userType || localStorage.getItem('userType') || 'user';

  return (
    <>
      {/* Desktop Hover Trigger Area */}
      {!isMobile && (
        <div 
          style={styles.hoverTrigger}
          onMouseEnter={() => setSidebarVisible(true)}
          onMouseLeave={() => setSidebarVisible(false)}
        />
      )}
      
      {/* Sidebar Content */}
      <div 
        style={styles.sidebar}
        onMouseEnter={() => !isMobile && setIsHovering(true)}
        onMouseLeave={() => !isMobile && setIsHovering(false)}
      >
        {/* Pull Tab - Always visible (both when sidebar is open and closed) */}
        {!isMobile && (
          <div
            style={styles.pullTab}
            onClick={toggleSidebar}
          >
            <div style={{
              fontSize: '16px',
              fontWeight: 'bold',
              transform: sidebarVisible ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s'
            }}>
              ›
            </div>
          </div>
        )}

        {/* Mobile Menu Toggle Button */}
        {isMobile && !sidebarVisible && (
          <div
            style={styles.mobileToggle}
            onClick={toggleSidebar}
          >
            ☰
          </div>
        )}

        {/* Sidebar Header with Logo */}
        <div style={styles.header}>
          {systemSettings?.sidebarLogoUrl && !imageError ? (
            <img 
              src={systemSettings.sidebarLogoUrl} 
              alt="Organization Logo" 
              style={styles.logo}
              onError={handleLogoError}
              onLoad={handleLogoLoad}
            />
          ) : (
            <div style={styles.logoPlaceholder}>
              🏢
            </div>
          )}
          
          {imageError && (
            <div style={styles.errorMessage}>
              Logo failed to load
            </div>
          )}
          
          <h3 style={styles.organizationName}>
            {systemSettings?.organizationName || 'Attendance System'}
            {currentUserType && (
              <span style={styles.roleBadge}>
                {currentUserType === 'system_owner' ? 'Owner' : 
                 currentUserType === 'admin' ? 'Admin' : 'User'}
              </span>
            )}
          </h3>
        </div>
        
        {/* Main Navigation */}
        <nav style={{ flex: 1, padding: "10px 0", overflowY: "auto" }}>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {getMenuItems().map((item) => {
              const isActive = isActiveMenuItem(item.path);
              
              return (
                <li key={item.path}>
                  <Link 
                    to={item.path}
                    style={{
                      ...styles.menuItem,
                      ...(isActive ? styles.activeMenuItem : {})
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.target.style.backgroundColor = darkMode ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.1)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.target.style.backgroundColor = "transparent";
                      }
                    }}
                    onClick={() => isMobile && setSidebarVisible(false)}
                  >
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        
        {/* Sidebar Footer */}
        <div style={styles.footer}>
          <div 
            style={styles.darkModeToggle}
            onClick={toggleDarkMode}
          >
            <span>Dark Mode</span>
            <span>{darkMode ? '🌙' : '☀️'}</span>
          </div>
          
          <Link 
            to="/support" 
            style={{
              ...styles.supportLink,
              ...(location.pathname === '/support' ? { color: darkMode ? "#ffffff" : "white" } : {})
            }}
            onMouseEnter={(e) => {
              e.target.style.color = darkMode ? "#ffffff" : "white";
            }}
            onMouseLeave={(e) => {
              if (location.pathname !== '/support') {
                e.target.style.color = darkMode ? "#b0b0b0" : "#bdc3c7";
              }
            }}
            onClick={() => isMobile && setSidebarVisible(false)}
          >
            Support Center
          </Link>
          
          <button 
            onClick={onSignOut}
            style={styles.signOutButton}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = darkMode ? "rgba(231, 76, 60, 0.3)" : "rgba(231, 76, 60, 0.2)";
              e.target.style.color = "#c0392b";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = darkMode ? "rgba(231, 76, 60, 0.2)" : "rgba(231, 76, 60, 0.1)";
              e.target.style.color = "#e74c3c";
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
      
      {/* Mobile Overlay */}
      {isMobile && sidebarVisible && (
        <div 
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 99,
          }}
          onClick={toggleSidebar}
        />
      )}
    </>
  );
};

Sidebar.propTypes = {
  userType: PropTypes.oneOf(['system_owner', 'admin', 'user']),
  onSignOut: PropTypes.func.isRequired,
  sidebarVisible: PropTypes.bool.isRequired,
  setSidebarVisible: PropTypes.func.isRequired,
  darkMode: PropTypes.bool.isRequired,
  toggleDarkMode: PropTypes.func.isRequired,
};

Sidebar.defaultProps = {
  userType: 'user',
};

export default Sidebar;