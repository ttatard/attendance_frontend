import React, { useState } from 'react';
import PropTypes from 'prop-types';

const AddEventModal = ({ 
  show, 
  onClose, 
  newEvent, 
  handleInputChange, 
  handleAddEvent, 
  loading,
  darkMode
}) => {
  const [error, setError] = useState(null); // Add local error state

  const modalStyles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modal: {
      backgroundColor: darkMode ? '#1e1e1e' : 'white',
      borderRadius: '10px',
      padding: '2rem',
      width: '90%',
      maxWidth: '500px',
      maxHeight: '90vh',
      overflowY: 'auto',
      boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
      position: 'relative',
      color: darkMode ? '#ffffff' : '#000000',
    },
    closeButton: {
      position: 'absolute',
      top: '1rem',
      right: '1rem',
      background: 'none',
      border: 'none',
      fontSize: '1.5rem',
      cursor: 'pointer',
      color: darkMode ? '#ffffff' : '#7f8c8d',
    },
  };

  const formStyles = {
    eventForm: {
      backgroundColor: darkMode ? '#2a2a2a' : '#f8f9fa',
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
      color: darkMode ? '#ffffff' : '#2c3e50',
      fontWeight: '500'
    },
    formInput: {
      width: '100%',
      padding: '0.75rem',
      border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
      borderRadius: '4px',
      fontSize: '1rem',
      boxSizing: 'border-box',
      backgroundColor: darkMode ? '#1e1e1e' : 'white',
      color: darkMode ? '#ffffff' : '#000000'
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
      color: darkMode ? '#ffffff' : '#2c3e50'
    },
    priceInput: {
      flex: 1,
      padding: '0.75rem',
      border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
      borderRadius: '4px',
      fontSize: '1rem',
      boxSizing: 'border-box',
      backgroundColor: darkMode ? '#1e1e1e' : 'white',
      color: darkMode ? '#ffffff' : '#000000'
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
      color: darkMode ? '#ffffff' : '#2c3e50',
    },
    errorText: {
      color: '#e74c3c',
      marginTop: '0.5rem',
      fontSize: '0.9rem'
    }
  };

  const getRecurrenceUnit = (pattern) => {
    switch (pattern) {
      case 'daily': return 'day(s)';
      case 'weekly': return 'week(s)';
      case 'monthly': 
      case 'weekly_x': return 'month(s)';
      case 'yearly': return 'year(s)';
      default: return '';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!newEvent.name || !newEvent.date || !newEvent.time) {
      setError("Please fill all required fields");
      return;
    }

    // Validate based on event type
    if (newEvent.isOnline && !newEvent.meetingUrl) {
      setError("Meeting link is required for online events");
      return;
    }

    if (!newEvent.isOnline && !newEvent.place) {
      setError("Location is required for in-person events");
      return;
    }

    handleAddEvent(e);
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
        
        <form onSubmit={handleSubmit} style={formStyles.eventForm}>
          <h3 style={{ marginBottom: '1rem', color: formStyles.cardTitle.color }}>Create New Event</h3>
          
          <div style={formStyles.formGroup}>
            <label htmlFor="event-name" style={formStyles.formLabel}>Event Name *</label>
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
            <label htmlFor="event-date" style={formStyles.formLabel}>Date *</label>
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
            <label htmlFor="event-time" style={formStyles.formLabel}>Time *</label>
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
            <label style={formStyles.formLabel}>Event Type *</label>
            <div style={formStyles.radioGroup}>
              <div style={formStyles.radioOption}>
                <input
                  type="radio"
                  id="event-type-inperson"
                  name="isOnline"
                  value="false"
                  checked={!newEvent.isOnline}
                  onChange={() => handleInputChange({
                    target: {
                      name: 'isOnline',
                      value: false
                    }
                  })}
                  style={formStyles.radioInput}
                />
                <label htmlFor="event-type-inperson" style={{ color: darkMode ? '#ffffff' : '#000000' }}>In-Person</label>
              </div>
              <div style={formStyles.radioOption}>
                <input
                  type="radio"
                  id="event-type-online"
                  name="isOnline"
                  value="true"
                  checked={newEvent.isOnline}
                  onChange={() => handleInputChange({
                    target: {
                      name: 'isOnline',
                      value: true
                    }
                  })}
                  style={formStyles.radioInput}
                />
                <label htmlFor="event-type-online" style={{ color: darkMode ? '#ffffff' : '#000000' }}>Online</label>
              </div>
            </div>
          </div>

          {!newEvent.isOnline ? (
            <div style={formStyles.formGroup}>
              <label htmlFor="event-place" style={formStyles.formLabel}>Location *</label>
              <input
                type="text"
                id="event-place"
                name="place"
                value={newEvent.place}
                onChange={handleInputChange}
                required={!newEvent.isOnline}
                style={formStyles.formInput}
              />
            </div>
          ) : (
            <>
              <div style={formStyles.formGroup}>
                <label htmlFor="meeting-url" style={formStyles.formLabel}>Meeting Link *</label>
                <input
                  type="url"
                  id="meeting-url"
                  name="meetingUrl"
                  value={newEvent.meetingUrl}
                  onChange={handleInputChange}
                  required={newEvent.isOnline}
                  style={formStyles.formInput}
                  placeholder="https://meet.example.com/your-meeting"
                />
              </div>
              <div style={formStyles.formGroup}>
                <label htmlFor="meeting-id" style={formStyles.formLabel}>Meeting ID (optional)</label>
                <input
                  type="text"
                  id="meeting-id"
                  name="meetingId"
                  value={newEvent.meetingId}
                  onChange={handleInputChange}
                  style={formStyles.formInput}
                  placeholder="123 456 7890"
                />
              </div>
              <div style={formStyles.formGroup}>
                <label htmlFor="meeting-passcode" style={formStyles.formLabel}>Meeting Passcode (optional)</label>
                <input
                  type="text"
                  id="meeting-passcode"
                  name="meetingPasscode"
                  value={newEvent.meetingPasscode}
                  onChange={handleInputChange}
                  style={formStyles.formInput}
                  placeholder="Password123"
                />
              </div>
            </>
          )}
          
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

          {/* Recurrence Options */}
          <div style={formStyles.formGroup}>
            <label style={formStyles.formLabel}>Recurrence Pattern</label>
            <select
              name="recurrencePattern"
              value={newEvent.recurrencePattern || 'none'}
              onChange={handleInputChange}
              style={formStyles.formInput}
            >
              <option value="none">No recurrence</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly (same day)</option>
              <option value="monthly">Monthly (same date)</option>
              <option value="weekly_x">Monthly (nth weekday)</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          {newEvent.recurrencePattern && newEvent.recurrencePattern !== 'none' && (
            <>
              <div style={formStyles.formGroup}>
                <label style={formStyles.formLabel}>Repeat every</label>
                <input
                  type="number"
                  name="recurrenceInterval"
                  min="1"
                  value={newEvent.recurrenceInterval || 1}
                  onChange={handleInputChange}
                  style={formStyles.formInput}
                />
                <span style={{ marginLeft: '0.5rem', color: darkMode ? '#b0b0b0' : '#7f8c8d' }}>
                  {getRecurrenceUnit(newEvent.recurrencePattern)}
                </span>
              </div>

              <div style={formStyles.formGroup}>
                <label style={formStyles.formLabel}>Ends</label>
                <div style={formStyles.radioGroup}>
                  <div style={formStyles.radioOption}>
                    <input
                      type="radio"
                      id="endNever"
                      name="endOption"
                      value="never"
                      checked={!newEvent.recurrenceEndDate && !newEvent.recurrenceCount}
                      onChange={() => {
                        handleInputChange({
                          target: {
                            name: 'recurrenceEndDate',
                            value: null
                          }
                        });
                        handleInputChange({
                          target: {
                            name: 'recurrenceCount',
                            value: null
                          }
                        });
                      }}
                      style={formStyles.radioInput}
                    />
                    <label htmlFor="endNever" style={{ color: darkMode ? '#ffffff' : '#000000' }}>Never</label>
                  </div>
                  <div style={formStyles.radioOption}>
                    <input
                      type="radio"
                      id="endOn"
                      name="endOption"
                      value="on"
                      checked={!!newEvent.recurrenceEndDate}
                      onChange={() => {}}
                      style={formStyles.radioInput}
                    />
                    <label htmlFor="endOn" style={{ color: darkMode ? '#ffffff' : '#000000' }}>On</label>
                    <input
                      type="date"
                      name="recurrenceEndDate"
                      value={newEvent.recurrenceEndDate || ''}
                      onChange={handleInputChange}
                      style={{ 
                        ...formStyles.formInput, 
                        width: 'auto', 
                        marginLeft: '0.5rem',
                        backgroundColor: darkMode ? '#1e1e1e' : 'white'
                      }}
                      min={newEvent.date}
                    />
                  </div>
                  <div style={formStyles.radioOption}>
                    <input
                      type="radio"
                      id="endAfter"
                      name="endOption"
                      value="after"
                      checked={!!newEvent.recurrenceCount}
                      onChange={() => {}}
                      style={formStyles.radioInput}
                    />
                    <label htmlFor="endAfter" style={{ color: darkMode ? '#ffffff' : '#000000' }}>After</label>
                    <input
                      type="number"
                      name="recurrenceCount"
                      min="1"
                      value={newEvent.recurrenceCount || ''}
                      onChange={handleInputChange}
                      style={{ 
                        ...formStyles.formInput, 
                        width: '80px', 
                        marginLeft: '0.5rem',
                        backgroundColor: darkMode ? '#1e1e1e' : 'white'
                      }}
                    />
                    <span style={{ marginLeft: '0.5rem', color: darkMode ? '#b0b0b0' : '#7f8c8d' }}>occurrences</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Price Options */}
          <div style={formStyles.formGroup}>
            <label style={formStyles.formLabel}>Event Price</label>
            <div style={formStyles.radioGroup}>
              <div style={formStyles.radioOption}>
                <input
                  type="radio"
                  id="price-free"
                  name="isFree"
                  value="true"
                  checked={newEvent.isFree === true}
                  onChange={() => handleInputChange({
                    target: {
                      name: 'isFree',
                      value: true
                    }
                  })}
                  style={formStyles.radioInput}
                />
                <label htmlFor="price-free" style={{ color: darkMode ? '#ffffff' : '#000000' }}>Free</label>
              </div>
              
              <div style={formStyles.radioOption}>
                <input
                  type="radio"
                  id="price-paid"
                  name="isFree"
                  value="false"
                  checked={newEvent.isFree === false}
                  onChange={() => handleInputChange({
                    target: {
                      name: 'isFree',
                      value: false
                    }
                  })}
                  style={formStyles.radioInput}
                />
                <label htmlFor="price-paid" style={{ color: darkMode ? '#ffffff' : '#000000' }}>Paid Event</label>
              </div>
            </div>
            
            {newEvent.isFree === false && (
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
                  required={newEvent.isFree === false}
                  style={formStyles.priceInput}
                />
              </div>
            )}
          </div>
          
          {error && (
            <div style={formStyles.errorText}>{error}</div>
          )}
          
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
    isFree: PropTypes.bool,
    price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    recurrencePattern: PropTypes.string,
    recurrenceInterval: PropTypes.number,
    recurrenceEndDate: PropTypes.string,
    recurrenceCount: PropTypes.number,
    isOnline: PropTypes.bool,
    meetingUrl: PropTypes.string,
    meetingId: PropTypes.string,
    meetingPasscode: PropTypes.string,
  }).isRequired,
  handleInputChange: PropTypes.func.isRequired,
  handleAddEvent: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  darkMode: PropTypes.bool.isRequired,
};

export default AddEventModal;