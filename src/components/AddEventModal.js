import React from 'react';
import PropTypes from 'prop-types';

const AddEventModal = ({ 
  show, 
  onClose, 
  newEvent, 
  handleInputChange, 
  handleAddEvent, 
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
    eventForm: {
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
    radioGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem'
    },
    radioOption: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    radioInput: {
      margin: 0
    },
    priceInputGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      marginTop: '0.5rem'
    },
    currencySymbol: {
      fontWeight: '600',
      color: '#2c3e50'
    },
    priceInput: {
      flex: 1,
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
    }
  };

  // Handle price type change
  const handlePriceTypeChange = (e) => {
    const priceType = e.target.value;
    handleInputChange({
      target: {
        name: 'priceType',
        value: priceType
      }
    });
    
    // Reset price when switching to free
    if (priceType === 'free') {
      handleInputChange({
        target: {
          name: 'price',
          value: 0
        }
      });
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
        
        <form onSubmit={handleAddEvent} style={formStyles.eventForm}>
          <h3 style={{ marginBottom: '1rem', color: formStyles.cardTitle.color }}>Create New Event</h3>
          
          <div style={formStyles.formGroup}>
            <label htmlFor="event-name" style={formStyles.formLabel}>Event Name</label>
            <input
              type="text"
              id="event-name"
              name="name"
              value={newEvent.name}
              onChange={handleInputChange}
              required
              style={formStyles.formInput}
            />
          </div>
          
          <div style={formStyles.formGroup}>
            <label htmlFor="event-date" style={formStyles.formLabel}>Date</label>
            <input
              type="date"
              id="event-date"
              name="date"
              value={newEvent.date}
              onChange={handleInputChange}
              required
              min={new Date().toISOString().split('T')[0]}
              style={formStyles.formInput}
            />
          </div>

          <div style={formStyles.formGroup}>
            <label htmlFor="event-time" style={formStyles.formLabel}>Time</label>
            <input
              type="time"
              id="event-time"
              name="time"
              value={newEvent.time}
              onChange={handleInputChange}
              required
              step="3600"
              style={formStyles.formInput}
            />
          </div>
          
          <div style={formStyles.formGroup}>
            <label htmlFor="event-place" style={formStyles.formLabel}>Location</label>
            <input
              type="text"
              id="event-place"
              name="place"
              value={newEvent.place}
              onChange={handleInputChange}
              required
              style={formStyles.formInput}
            />
          </div>
          
          <div style={formStyles.formGroup}>
            <label htmlFor="event-description" style={formStyles.formLabel}>Description</label>
            <textarea
              id="event-description"
              name="description"
              value={newEvent.description}
              onChange={handleInputChange}
              style={{ ...formStyles.formInput, minHeight: '80px' }}
            />
          </div>

          {/* Price Options */}
          <div style={formStyles.formGroup}>
            <label style={formStyles.formLabel}>Event Price</label>
            <div style={formStyles.radioGroup}>
              <div style={formStyles.radioOption}>
                <input
                  type="radio"
                  id="price-free"
                  name="priceType"
                  value="free"
                  checked={newEvent.priceType === 'free'}
                  onChange={handlePriceTypeChange}
                  style={formStyles.radioInput}
                />
                <label htmlFor="price-free">Free</label>
              </div>
              
              <div style={formStyles.radioOption}>
                <input
                  type="radio"
                  id="price-paid"
                  name="priceType"
                  value="paid"
                  checked={newEvent.priceType === 'paid'}
                  onChange={handlePriceTypeChange}
                  style={formStyles.radioInput}
                />
                <label htmlFor="price-paid">Paid Event</label>
              </div>
            </div>
            
            {/* Price Input - Only show when "Paid Event" is selected */}
            {newEvent.priceType === 'paid' && (
              <div style={formStyles.priceInputGroup}>
                <span style={formStyles.currencySymbol}>₱</span>
                <input
                  type="number"
                  id="event-price"
                  name="price"
                  value={newEvent.price || ''}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required={newEvent.priceType === 'paid'}
                  style={formStyles.priceInput}
                />
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button 
              type="submit" 
              style={{
                ...formStyles.cardButton,
                backgroundColor: '#2ecc71',
                flex: 1,
                border: 'none',
                cursor: 'pointer'
              }}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Event'}
            </button>
            
            <button 
              type="button" 
              onClick={onClose}
              style={{
                ...formStyles.cardButton,
                backgroundColor: '#e74c3c',
                flex: 1,
                border: 'none',
                cursor: 'pointer'
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

AddEventModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  newEvent: PropTypes.shape({
    name: PropTypes.string,
    date: PropTypes.string,
    time: PropTypes.string,
    place: PropTypes.string,
    description: PropTypes.string,
    priceType: PropTypes.string,
    price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
  handleInputChange: PropTypes.func.isRequired,
  handleAddEvent: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
};

export default AddEventModal;