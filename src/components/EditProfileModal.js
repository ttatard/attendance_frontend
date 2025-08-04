import React from 'react';
import PropTypes from 'prop-types';

const EditProfileModal = ({ 
  show, 
  onClose, 
  formData, 
  handleChange, 
  handleSubmit, 
  loading 
}) => {
  const modalStyles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(5px)',
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modal: {
      backgroundColor: 'white',
      borderRadius: '10px',
      padding: '2rem',
      width: '90%',
      maxWidth: '500px',
      maxHeight: '90vh',
      overflowY: 'auto',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
      position: 'relative',
    },
    closeButton: {
      position: 'absolute',
      top: '1rem',
      right: '1rem',
      background: 'none',
      border: 'none',
      fontSize: '1.5rem',
      cursor: 'pointer',
      color: '#7f8c8d',
    },
  };

  const formStyles = {
    profileForm: {
      backgroundColor: '#f8f9fa',
      padding: '1.5rem',
      borderRadius: '8px',
      marginBottom: '1.5rem',
      textAlign: 'left'
    },
    formGroup: {
      marginBottom: '1rem'
    },
    formLabel: {
      display: 'block',
      marginBottom: '0.5rem',
      color: '#2c3e50',
      fontWeight: '500'
    },
    formInput: {
      width: '100%',
      padding: '0.75rem',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '1rem',
      boxSizing: 'border-box'
    },
    cardButton: {
      display: 'inline-block',
      backgroundColor: '#3498db',
      color: 'white',
      padding: '0.75rem 1.5rem',
      borderRadius: '6px',
      textDecoration: 'none',
      fontWeight: '600',
      transition: 'background-color 0.3s ease',
      ':hover': {
        backgroundColor: '#2980b9'
      },
      border: 'none',
      cursor: 'pointer',
      fontSize: '1rem'
    },
    cardTitle: {
      color: '#2c3e50',
      marginBottom: '1rem'
    }
  };

  if (!show) return null;

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.modal}>
        <button 
          style={modalStyles.closeButton}
          onClick={onClose}
          aria-label="Close modal"
        >
          ×
        </button>
        
        <form onSubmit={handleSubmit} style={formStyles.profileForm}>
          <h3 style={formStyles.cardTitle}>Edit Profile</h3>
          
          <div style={formStyles.formGroup}>
            <label htmlFor="first-name" style={formStyles.formLabel}>First Name</label>
            <input
              type="text"
              id="first-name"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              style={formStyles.formInput}
            />
          </div>
          
          <div style={formStyles.formGroup}>
            <label htmlFor="last-name" style={formStyles.formLabel}>Last Name</label>
            <input
              type="text"
              id="last-name"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              style={formStyles.formInput}
            />
          </div>
          
          <div style={formStyles.formGroup}>
            <label htmlFor="email" style={formStyles.formLabel}>Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={formStyles.formInput}
            />
          </div>
          
          <div style={formStyles.formGroup}>
            <label htmlFor="birthday" style={formStyles.formLabel}>Birthday</label>
            <input
              type="date"
              id="birthday"
              name="birthday"
              value={formData.birthday}
              onChange={handleChange}
              required
              style={formStyles.formInput}
            />
          </div>
          
          <div style={formStyles.formGroup}>
            <label htmlFor="gender" style={formStyles.formLabel}>Gender</label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              style={formStyles.formInput}
              required
            >
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
              <option value="unspecified">Prefer not to say</option>
            </select>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button 
              type="submit" 
              style={{
                ...formStyles.cardButton,
                backgroundColor: '#2ecc71',
                flex: 1,
              }}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            
            <button 
              type="button" 
              onClick={onClose}
              style={{
                ...formStyles.cardButton,
                backgroundColor: '#e74c3c',
                flex: 1,
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

EditProfileModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  formData: PropTypes.shape({
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    email: PropTypes.string,
    birthday: PropTypes.string,
    gender: PropTypes.string,
  }).isRequired,
  handleChange: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

EditProfileModal.defaultProps = {
  loading: false,
};

export default EditProfileModal;