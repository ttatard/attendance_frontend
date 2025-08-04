// src/components/Sidebar.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";

const Sidebar = ({ userType, onSignOut, sidebarVisible, setSidebarVisible }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

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

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const menuItems = [
    { path: "/home", label: "Home" },  // Changed from Dashboard to Home
    { path: userType === 'admin' ? "/admin" : "/events", label: "Events" },
    { path: "/reports", label: "Reports" },
    { path: "/account", label: "Account" },
    { path: "/settings", label: "Settings" }
  ];

  return (
    <>
      {/* Desktop Hover Trigger Area */}
      {!isMobile && (
        <div 
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            width: "20px",
            height: "100vh",
            zIndex: 99,
            backgroundColor: "transparent",
          }}
          onMouseEnter={() => setSidebarVisible(true)}
          onMouseLeave={() => setSidebarVisible(false)}
        />
      )}
      
      {/* Sidebar Content */}
      <div 
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          width: "250px",
          height: "100vh",
          backgroundColor: "#2c3e50",
          color: "white",
          boxShadow: "2px 0 10px rgba(0,0,0,0.1)",
          transform: sidebarVisible ? 'translateX(0)' : 'translateX(-100%)',
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          display: "flex",
          flexDirection: "column",
          zIndex: 100,
        }}
        onMouseEnter={() => !isMobile && setIsHovering(true)}
        onMouseLeave={() => !isMobile && setIsHovering(false)}
      >
        {/* Pull Tab - Always visible (both when sidebar is open and closed) */}
        {!isMobile && (
          <div
            style={{
              position: 'absolute',
              left: '100%',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '24px',
              height: '72px',
              backgroundColor: '#2c3e50',
              border: 'none',
              borderRadius: '0 4px 4px 0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '2px 2px 5px rgba(0,0,0,0.2)',
              color: 'white',
              zIndex: 101,
            }}
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
            style={{
              position: 'absolute',
              left: '100%',
              top: '20px',
              width: '40px',
              height: '40px',
              backgroundColor: '#2c3e50',
              border: 'none',
              borderRadius: '0 4px 4px 0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '2px 2px 5px rgba(0,0,0,0.2)',
              color: 'white',
              zIndex: 101,
            }}
            onClick={toggleSidebar}
          >
            ☰
          </div>
        )}

        {/* Rest of your sidebar content */}
        <div style={{
          padding: "20px",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          textAlign: "center"
        }}>
          <h3 style={{ margin: 0 }}>Attendance System</h3>
        </div>
        
        <nav style={{ flex: 1, padding: "10px 0" }}>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link 
                  to={item.path}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "12px 20px",
                    color: "white",
                    textDecoration: "none",
                    transition: "background-color 0.2s",
                    borderLeft: "3px solid transparent"
                  }}
                  activeStyle={{
                    backgroundColor: "rgba(255,255,255,0.1)",
                    borderLeft: "3px solid #3498db"
                  }}
                  onClick={() => isMobile && setSidebarVisible(false)}
                >
                  <span style={{ marginLeft: "10px" }}>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        <div style={{
          padding: "20px",
          borderTop: "1px solid rgba(255,255,255,0.1)"
        }}>
          <Link 
            to="/support" 
            style={{
              display: "block",
              padding: "8px 20px",
              color: "#bdc3c7",
              textDecoration: "none",
              marginBottom: "10px",
              transition: "color 0.2s"
            }}
            onClick={() => isMobile && setSidebarVisible(false)}
          >
            Support Center
          </Link>
          <button 
            onClick={onSignOut}
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: "rgba(231, 76, 60, 0.1)",
              color: "#e74c3c",
              border: "1px solid rgba(231, 76, 60, 0.3)",
              borderRadius: "4px",
              cursor: "pointer",
              transition: "all 0.2s",
              fontWeight: "500",
              ':hover': {
                backgroundColor: "rgba(231, 76, 60, 0.2)",
                color: "#c0392b",
              }
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
  userType: PropTypes.oneOf(['admin', 'user']),
  onSignOut: PropTypes.func.isRequired,
  sidebarVisible: PropTypes.bool.isRequired,
  setSidebarVisible: PropTypes.func.isRequired,
};

export default Sidebar;