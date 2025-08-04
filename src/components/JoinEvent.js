import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Webcam from "react-webcam";
import { BrowserMultiFormatReader } from "@zxing/library";

const NameDialog = ({ isOpen, onSubmit, onCancel }) => {
  const [fullName, setFullName] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (fullName.trim()) {
      onSubmit(fullName);
    }
  };

  if (!isOpen) return null;
  
  return (
    <div style={{ 
      position: "fixed", 
      inset: 0, 
      backgroundColor: "rgba(0, 0, 0, 0.5)", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      zIndex: 50
    }}>
      <div style={{ 
        backgroundColor: "white", 
        padding: "1.5rem",
        borderRadius: "0.5rem",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        width: "100%",
        maxWidth: "400px"
      }}>
        <h2 style={{ 
          fontSize: "1.25rem", 
          fontWeight: "bold", 
          marginBottom: "1rem" 
        }}>Enter Your Full Name</h2>
        
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your full name"
            style={{ 
              width: "100%", 
              padding: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
              marginBottom: "1rem",
              boxSizing: "border-box"
            }}
            autoFocus
          />
          
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={onCancel}
              style={{ 
                flex: 1,
                backgroundColor: "#f44336",
                color: "white",
                padding: "0.5rem 1rem",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "16px"
              }}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              style={{ 
                flex: 1,
                backgroundColor: "#4CAF50",
                color: "white",
                padding: "0.5rem 1rem",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "16px",
                opacity: fullName.trim() ? 1 : 0.7
              }}
              disabled={!fullName.trim()}
            >
              Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CheckInAnotherDialog = ({ isOpen, onYes, onNo }) => {
  if (!isOpen) return null;
  
  return (
    <div style={{ 
      position: "fixed", 
      inset: 0, 
      backgroundColor: "rgba(0, 0, 0, 0.5)", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      zIndex: 50
    }}>
      <div style={{ 
        backgroundColor: "white", 
        padding: "1.5rem",
        borderRadius: "0.5rem",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        width: "100%",
        maxWidth: "400px",
        textAlign: "center"
      }}>
        <h2 style={{ 
          fontSize: "1.25rem", 
          fontWeight: "bold", 
          marginBottom: "1rem" 
        }}>Check in another user?</h2>
        
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
          <button
            type="button"
            onClick={onNo}
            style={{ 
              backgroundColor: "#f44336",
              color: "white",
              padding: "0.5rem 1rem",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "16px",
              minWidth: "100px"
            }}
          >
            No
          </button>
          
          <button
            type="button"
            onClick={onYes}
            style={{ 
              backgroundColor: "#4CAF50",
              color: "white",
              padding: "0.5rem 1rem",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "16px",
              minWidth: "100px"
            }}
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
};

const JoinEvent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  const codeReader = useRef(null);
  const scanInterval = useRef(null);
  const checkInTimeout = useRef(null);
  const isMounted = useRef(true);
  
  const [event, setEvent] = useState(null);
  const [scannedCode, setScannedCode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [attendeeName, setAttendeeName] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [scanStatus, setScanStatus] = useState('neutral');
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [shouldStartScanning, setShouldStartScanning] = useState(false);
  const [showJoinButton, setShowJoinButton] = useState(true);
  const [showCheckInAnotherDialog, setShowCheckInAnotherDialog] = useState(false);
  const [isLoadingCamera, setIsLoadingCamera] = useState(false);

  // Initialize code reader and set mount status
  useEffect(() => {
    isMounted.current = true;
    codeReader.current = new BrowserMultiFormatReader();
    
    return () => {
      isMounted.current = false;
      stopScanning();
      if (checkInTimeout.current) {
        clearTimeout(checkInTimeout.current);
      }
      // Clean up camera
      if (webcamRef.current?.video?.srcObject) {
        webcamRef.current.video.srcObject.getTracks().forEach(track => {
          track.stop();
        });
        webcamRef.current.video.srcObject = null;
      }
    };
  }, []);
  
  // Fetch event details
  useEffect(() => {
    axios.get(`http://localhost:8080/api/events/${id}`)
      .then((response) => {
        if (isMounted.current) {
          setEvent(response.data);
        }
      })
      .catch((error) => {
        if (isMounted.current) {
          console.error("Error fetching event:", error);
          setHasError(true);
          setErrorMessage("Failed to load event details");
        }
      });
  }, [id]);

  // Start scanning when conditions are met
  useEffect(() => {
    if (cameraReady && shouldStartScanning && !isProcessing && !hasScanned) {
      startScanning();
    }
  }, [cameraReady, shouldStartScanning, isProcessing, hasScanned]);

  const validateQRCode = async (qrText) => {
    try {
      if (!qrText || qrText.trim().length === 0) {
        return { isValid: false, error: "Empty QR code" };
      }

      if (!qrText.startsWith("EVT-")) {
        return { 
          isValid: false, 
          error: "Invalid QR code format. Please scan a valid event QR code." 
        };
      }

      try {
        const response = await axios.get(
          `http://localhost:8080/api/events/verify-qr/${id}/${encodeURIComponent(qrText)}`
        );
        
        if (response.data.status === "success") {
          return { isValid: true, error: null };
        }
        
        if (response.data.message?.includes("QR code does not match")) {
          return { 
            isValid: false, 
            error: "This QR code is not valid for the current event" 
          };
        }
        
        return { 
          isValid: false, 
          error: response.data.message || "QR code verification failed" 
        };
      } catch (error) {
        if (error.response) {
          if (error.response.status === 400) {
            return { 
              isValid: false, 
              error: "Invalid QR code format" 
            };
          }
          if (error.response.status === 404) {
            return { 
              isValid: false, 
              error: "Event not found for this QR code" 
            };
          }
          return { 
            isValid: false, 
            error: error.response.data?.message || "Verification failed" 
          };
        }
        return { 
          isValid: false, 
          error: "Network error. Please try again." 
        };
      }
    } catch (error) {
      return { 
        isValid: false, 
        error: "Validation error. Please try again." 
      };
    }
  };

  const startScanning = useCallback(() => {
    if (!webcamRef.current || isScanning) return;
    
    setIsScanning(true);
    setHasScanned(false);
    setShowJoinButton(false);
    
    scanInterval.current = setInterval(() => {
      if (webcamRef.current && !isProcessing && !hasScanned && cameraReady && isMounted.current) {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc && codeReader.current) {
          codeReader.current
            .decodeFromImageUrl(imageSrc)
            .then((result) => {
              if (result && result.text && !isProcessing && isMounted.current) {
                handleQrDetected(result.text);
              }
            })
            .catch((err) => {
              if (!err.message.includes('No MultiFormat Readers') && isMounted.current) {
                console.debug('QR scan attempt:', err.message);
              }
            });
        }
      }
    }, 500);
  }, [isProcessing, hasScanned, isScanning, cameraReady]);

  const stopScanning = useCallback(() => {
    if (scanInterval.current) {
      clearInterval(scanInterval.current);
      scanInterval.current = null;
    }
    setIsScanning(false);
    
    // Stop camera stream if exists
    if (webcamRef.current?.video?.srcObject) {
      webcamRef.current.video.srcObject.getTracks().forEach(track => track.stop());
      webcamRef.current.video.srcObject = null;
    }
    setCameraReady(false);
  }, []);

  const handleNameSubmit = (name) => {
    if (!isMounted.current) return;
    setAttendeeName(name);
    setShowNameDialog(false);
    setShouldStartScanning(true);
    setShowJoinButton(false);
  };

  const handleStopScan = () => {
    stopScanning();
    setAttendeeName("");
    setScanStatus('neutral');
    setHasScanned(false);
    setIsProcessing(false);
    setShowJoinButton(true);
    setShouldStartScanning(false);
    setCameraReady(false);
  };

  const handleJoinAgain = () => {
    setShowNameDialog(true);
    setShowJoinButton(false);
    setErrorMessage("");
    setHasError(false);
  };

  const handleCancelNameEntry = () => {
    setShowNameDialog(false);
    setShouldStartScanning(false);
    setShowJoinButton(true);
    setAttendeeName("");
  };

  const handleCheckInAnotherYes = () => {
    setShowCheckInAnotherDialog(false);
    setShowSuccess(false);
    setScannedCode("");
    setScanStatus('neutral');
    setHasScanned(false);
    setIsProcessing(false);
    setShowNameDialog(true);
  };

  const handleCheckInAnotherNo = () => {
    setShowCheckInAnotherDialog(false);
    setShowSuccess(false);
    setScannedCode("");
    setScanStatus('neutral');
    setHasScanned(false);
    setIsProcessing(false);
    setShouldStartScanning(false);
    setShowJoinButton(true);
    setAttendeeName("");
    navigate("/events");
  };

  const handleQrDetected = async (qrText) => {
    if (isProcessing || hasScanned || !isMounted.current) return;

    setIsProcessing(true);
    setHasScanned(true);
    setScannedCode(qrText);
    stopScanning();

    const validation = await validateQRCode(qrText);
    
    if (validation.isValid) {
      try {
        await axios.post('http://localhost:8080/api/attendance', {
          eventId: id,
          attendeeName: attendeeName,
          code: qrText
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (isMounted.current) {
          setScanStatus('success');
          setShowSuccess(true);
          
          checkInTimeout.current = setTimeout(() => {
            if (isMounted.current) {
              setShowCheckInAnotherDialog(true);
            }
          }, 3000);
        }
      } catch (error) {
        if (isMounted.current) {
          setScanStatus('error');
          setErrorMessage(error.response?.data?.message || "Failed to record attendance");
          
          setTimeout(() => {
            if (isMounted.current) {
              setScanStatus('neutral');
              setErrorMessage("");
              setHasScanned(false);
              setIsProcessing(false);
              setShouldStartScanning(true);
            }
          }, 3000);
        }
      }
    } else {
      if (isMounted.current) {
        setScanStatus('error');
        setErrorMessage(validation.error);
        
        setTimeout(() => {
          if (isMounted.current) {
            setScanStatus('neutral');
            setErrorMessage("");
            setHasScanned(false);
            setIsProcessing(false);
            setShouldStartScanning(true);
          }
        }, 3000);
      }
    }
  };

  const getBorderStyle = () => {
    switch (scanStatus) {
      case 'success':
        return { border: '4px solid #4CAF50', boxShadow: '0 0 0 4px rgba(76, 175, 80, 0.3)' };
      case 'error':
        return { border: '4px solid #f44336', boxShadow: '0 0 0 4px rgba(244, 67, 54, 0.3)' };
      default:
        return { border: '2px solid #ccc', boxShadow: 'none' };
    }
  };

  if (!event) return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <p>Loading event details...</p>
      {hasError && <p style={{ color: "red" }}>{errorMessage}</p>}
    </div>
  );

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1rem" }}>
        Join Event: {event.name}
      </h2>
      <div style={{ 
        backgroundColor: "#f5f5f5", 
        padding: "1rem", 
        borderRadius: "0.5rem",
        marginBottom: "2rem"
      }}>
        <p><strong>Date:</strong> {event.date}</p>
        <p><strong>Time:</strong> {event.time}</p>
        <p><strong>Place:</strong> {event.place}</p>
        <p><strong>Organizer:</strong> {event.organizer?.name}</p>
      </div>
      
      {attendeeName && !showSuccess && (
        <div style={{ 
          backgroundColor: "#e3f2fd", 
          padding: "1rem", 
          borderRadius: "0.5rem",
          marginBottom: "1rem"
        }}>
          <p><strong>Current Attendee:</strong> {attendeeName}</p>
        </div>
      )}
      
      {showSuccess && (
        <div style={{ 
          margin: "2rem 0", 
          padding: "1.5rem", 
          backgroundColor: "#e8f5e9", 
          borderRadius: "0.5rem",
          textAlign: "center",
          border: "2px solid #4CAF50"
        }}>
          <h3 style={{ color: "#2e7d32", fontSize: "1.25rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
            Check-in Successful!
          </h3>
          <p><strong>{attendeeName}</strong> has been checked in with code: <strong>{scannedCode}</strong></p>
        </div>
      )}
      
      {!showNameDialog && !showSuccess && shouldStartScanning && (
        <div style={{ marginTop: "2rem" }}>
          <h3 style={{ textAlign: "center", marginBottom: "1rem" }}>QR Code Scanner</h3>
          <div style={{ 
            width: "100%", 
            maxWidth: "400px", 
            height: "400px", 
            margin: "0 auto", 
            borderRadius: "0.5rem",
            overflow: "hidden",
            position: "relative",
            ...getBorderStyle()
          }}>
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={{
                facingMode: "environment",
                width: { ideal: 1280 },
                height: { ideal: 720 }
              }}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onUserMedia={() => {
                if (isMounted.current) {
                  setCameraReady(true);
                  setIsLoadingCamera(false);
                }
              }}
              onUserMediaError={(error) => {
                if (isMounted.current) {
                  console.error("Camera error:", error);
                  setErrorMessage("Unable to access camera. Please check permissions.");
                  setShowJoinButton(true);
                  setShouldStartScanning(false);
                  setIsLoadingCamera(false);
                  // Ensure camera is stopped
                  if (webcamRef.current?.video?.srcObject) {
                    webcamRef.current.video.srcObject.getTracks().forEach(track => track.stop());
                  }
                }
              }}
              forceScreenshotSourceSize={true}
              onUserMediaStarted={() => {
                setIsLoadingCamera(true);
              }}
            />
            
            {isLoadingCamera && (
              <div style={{
                position: "absolute",
                inset: 0,
                backgroundColor: "rgba(0,0,0,0.7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "1.2rem",
                fontWeight: "bold"
              }}>
                Initializing camera...
              </div>
            )}
            
            {isProcessing && (
              <div style={{
                position: "absolute",
                inset: 0,
                backgroundColor: "rgba(0,0,0,0.7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "1.2rem",
                fontWeight: "bold"
              }}>
                Processing...
              </div>
            )}
          </div>
          
          <p style={{ marginTop: "1rem", textAlign: "center" }}>
            Point your camera at a QR code to check in <strong>{attendeeName}</strong>
          </p>
          
          {errorMessage && (
            <div style={{ 
              color: "red", 
              marginTop: "1rem", 
              textAlign: "center",
              padding: "0.5rem",
              backgroundColor: "#ffebee",
              borderRadius: "0.25rem"
            }}>
              {errorMessage.includes("already checked in") ? (
                <>
                  <p style={{ fontWeight: "bold" }}>Duplicate Check-in Detected</p>
                  <p>{errorMessage}</p>
                </>
              ) : errorMessage.includes("not valid") ? (
                <>
                  <p style={{ fontWeight: "bold" }}>Invalid QR Code</p>
                  <p>{errorMessage}</p>
                  <p style={{ fontSize: "0.8rem" }}>Please scan the correct QR code for this event</p>
                </>
              ) : (
                <p>Error: {errorMessage}</p>
              )}
            </div>
          )}
          
          <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
            <button 
              onClick={handleStopScan}
              style={{ 
                padding: "0.75rem 1.5rem", 
                backgroundColor: "#f44336", 
                color: "white", 
                border: "none", 
                borderRadius: "0.5rem",
                cursor: "pointer",
                fontSize: "1rem",
                fontWeight: "bold"
              }}
            >
              Cancel Scanning
            </button>
          </div>
        </div>
      )}

      {showJoinButton && !showNameDialog && !shouldStartScanning && (
        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          <button 
            onClick={handleJoinAgain}
            style={{ 
              padding: "1rem 2rem", 
              backgroundColor: "#4CAF50", 
              color: "white", 
              border: "none", 
              borderRadius: "0.5rem",
              cursor: "pointer",
              fontSize: "1.125rem",
              fontWeight: "bold",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
            }}
          >
            Join Event
          </button>
        </div>
      )}
      
      <NameDialog 
        isOpen={showNameDialog} 
        onSubmit={handleNameSubmit}
        onCancel={handleCancelNameEntry}
      />
      
      <CheckInAnotherDialog 
        isOpen={showCheckInAnotherDialog}
        onYes={handleCheckInAnotherYes}
        onNo={handleCheckInAnotherNo}
      />
    </div>
  );
};

export default JoinEvent;