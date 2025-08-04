import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './Sidebar';

const SupportCenter = ({ 
  userType, 
  onSignOut, 
  userData, 
  sidebarVisible, 
  setSidebarVisible,
  darkMode
}) => {
  const [formData, setFormData] = useState({
    concernType: '',
    message: '',
    attachment: null
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const concernTypes = [
    { value: 'UI_CONCERN', label: 'UI Concern' },
    { value: 'FUNCTIONALITY_ISSUE', label: 'Function not working' },
    { value: 'OTHER', label: 'Others' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type and size
      if (!file.type.match('image.*')) {
        setError('Please upload an image file (JPEG, PNG, etc.)');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Image size should be less than 5MB');
        return;
      }

      setFormData(prev => ({ ...prev, attachment: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.concernType) {
      setError('Please select a concern type');
      return;
    }
    
    if (!formData.message.trim()) {
      setError('Please enter your message');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const formDataToSend = new FormData();
      formDataToSend.append('concernType', formData.concernType);
      formDataToSend.append('message', formData.message);
      formDataToSend.append('userId', userData.id);
      if (formData.attachment) {
        formDataToSend.append('attachment', formData.attachment);
      }
      
      await axios.post('http://localhost:8080/api/support', formDataToSend, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setSubmitSuccess(true);
      setFormData({
        concernType: '',
        message: '',
        attachment: null
      });
      setPreviewImage(null);
      
      // Reset success message after 3 seconds
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (err) {
      console.error('Error submitting support ticket:', err);
      setError(err.response?.data?.message || 'Failed to submit support ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(-1); // Go back to previous page
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
    formContainer: {
      maxWidth: '800px',
      margin: '0 auto',
      width: '100%',
      backgroundColor: darkMode ? '#1e1e1e' : 'white',
      borderRadius: '10px',
      padding: '2rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    },
    formGroup: {
      marginBottom: '1.5rem',
    },
    formLabel: {
      display: 'block',
      marginBottom: '0.5rem',
      fontWeight: '600',
      color: darkMode ? '#e0e0e0' : '#2c3e50',
    },
    formControl: {
      width: '100%',
      padding: '0.75rem 1rem',
      border: darkMode ? '1px solid #444' : '1px solid #ddd',
      borderRadius: '6px',
      fontSize: '1rem',
      backgroundColor: darkMode ? '#2a2a2a' : 'white',
      color: darkMode ? '#ffffff' : '#000000',
      ':focus': {
        borderColor: darkMode ? '#64b5f6' : '#3498db',
        outline: 'none',
        boxShadow: darkMode ? '0 0 0 3px rgba(100, 181, 246, 0.1)' : '0 0 0 3px rgba(52, 152, 219, 0.1)',
      },
    },
    textarea: {
      minHeight: '150px',
      resize: 'vertical',
    },
    fileInput: {
      display: 'none',
    },
    fileInputLabel: {
      display: 'inline-block',
      padding: '0.75rem 1.5rem',
      backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
      color: darkMode ? '#ffffff' : '#2c3e50',
      border: darkMode ? '1px solid #444' : '1px solid #ddd',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '1rem',
      fontWeight: '600',
      textAlign: 'center',
      ':hover': {
        backgroundColor: darkMode ? '#333' : '#e9ecef',
        borderColor: darkMode ? '#555' : '#ccc',
      },
    },
    previewContainer: {
      marginTop: '1rem',
      textAlign: 'center',
    },
    previewImage: {
      maxWidth: '100%',
      maxHeight: '300px',
      borderRadius: '6px',
      border: darkMode ? '1px solid #444' : '1px solid #ddd',
    },
    buttonGroup: {
      display: 'flex',
      gap: '1rem',
      marginTop: '2rem',
    },
    submitButton: {
      backgroundColor: darkMode ? '#64b5f6' : '#3498db',
      color: 'white',
      border: 'none',
      padding: '0.75rem 1.5rem',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '1rem',
      fontWeight: '600',
      ':hover': {
        backgroundColor: darkMode ? '#42a5f5' : '#2980b9',
      },
      ':disabled': {
        backgroundColor: darkMode ? '#424242' : '#bdc3c7',
        cursor: 'not-allowed',
      },
    },
    cancelButton: {
      backgroundColor: 'transparent',
      color: darkMode ? '#b0b0b0' : '#7f8c8d',
      border: darkMode ? '1px solid #444' : '1px solid #ddd',
      padding: '0.75rem 1.5rem',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '1rem',
      fontWeight: '600',
      ':hover': {
        backgroundColor: darkMode ? '#333' : '#f5f5f5',
        borderColor: darkMode ? '#555' : '#ccc',
      },
    },
    errorMessage: {
      backgroundColor: darkMode ? '#3a1c1c' : '#fdecea',
      color: '#d32f2f',
      padding: '12px 15px',
      borderRadius: '6px',
      marginBottom: '20px',
      fontSize: '0.9rem',
    },
    successMessage: {
      backgroundColor: darkMode ? '#1b5e20' : '#e8f5e9',
      color: darkMode ? '#a5d6a7' : '#2e7d32',
      padding: '12px 15px',
      borderRadius: '6px',
      marginBottom: '20px',
      fontSize: '0.9rem',
    },
  };

  return (
    <div style={styles.container}>
      {/* Sidebar Component */}
      <Sidebar 
        userType={userType}
        onSignOut={onSignOut}
        sidebarVisible={sidebarVisible}
        setSidebarVisible={setSidebarVisible}
        darkMode={darkMode}
      />

      {/* Main Content */}
      <div style={styles.mainContent}>
        <div style={styles.header}>
          <h1 style={styles.title}>Support Center</h1>
          <p style={styles.subtitle}>We're here to help with any issues you encounter</p>
        </div>

        <div style={styles.formContainer}>
          {error && (
            <div style={styles.errorMessage}>
              {error}
            </div>
          )}
          
          {submitSuccess && (
            <div style={styles.successMessage}>
              Your support ticket has been submitted successfully! We'll get back to you soon.
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Concern Type *</label>
              <select
                name="concernType"
                value={formData.concernType}
                onChange={handleChange}
                style={styles.formControl}
                required
              >
                <option value="">Select a concern type</option>
                {concernTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Message *</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                style={{...styles.formControl, ...styles.textarea}}
                required
                placeholder="Please describe your issue in detail..."
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Attachment (Optional)</label>
              <input
                type="file"
                id="attachment"
                onChange={handleFileChange}
                accept="image/*"
                style={styles.fileInput}
              />
              <label htmlFor="attachment" style={styles.fileInputLabel}>
                Choose Image
              </label>
              {previewImage && (
                <div style={styles.previewContainer}>
                  <img 
                    src={previewImage} 
                    alt="Preview" 
                    style={styles.previewImage}
                  />
                </div>
              )}
            </div>

            <div style={styles.buttonGroup}>
              <button
                type="button"
                onClick={handleCancel}
                style={styles.cancelButton}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={styles.submitButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SupportCenter;