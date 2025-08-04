import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BrowserMultiFormatReader } from "@zxing/library";
import axios from "axios";
import Sidebar from "../components/Sidebar";

const QRScanner = ({ userType, userData, onSignOut, sidebarVisible, setSidebarVisible }) => {
  const location = useLocation();
  const { eventId, eventQRCode, eventName } = location.state || {};
  
  // Refs
  const videoRef = useRef(null);
  const codeReader = useRef(new BrowserMultiFormatReader());
  const scanInterval = useRef(null);
  const isMounted = useRef(true);

  // State
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [isLoadingCamera, setIsLoadingCamera] = useState(false);

  // Verify and record attendance
  const verifyAndRecord = useCallback(async (scannedCode) => {
    try {
      if (scannedCode !== eventQRCode) {
        throw new Error("Invalid QR code for this event");
      }

      const response = await axios.post(
        'http://localhost:8080/api/attendance',
        {
          eventId,
          userId: userData.id,
          code: scannedCode
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`
          }
        }
      );

      if (isMounted.current) {
        setSuccess(true);
        setScanResult({
          eventName,
          userName: `${userData.firstName} ${userData.lastName}`,
          timestamp: new Date().toLocaleString()
        });

        setTimeout(() => {
          if (isMounted.current) {
            setSuccess(false);
          }
        }, 3000);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err.response?.data?.message || err.message);
      }
    }
  }, [eventId, eventQRCode, eventName, userData]);

  // Handle QR code detection
  const handleScan = useCallback(() => {
    if (!isScanning || !cameraReady || !isMounted.current) return;

    codeReader.current.decodeFromVideoElement(videoRef.current, (result, err) => {
      if (result && isMounted.current) {
        clearInterval(scanInterval.current);
        verifyAndRecord(result.getText());
      }
      if (err && !(err instanceof Error) && isMounted.current) {
        console.debug("Scan error:", err);
      }
    });
  }, [isScanning, cameraReady, verifyAndRecord]);

  // Start camera and scanning
  const startScanner = useCallback(async () => {
    try {
      if (!isMounted.current) return;
      
      setError("");
      setCameraReady(false);
      setIsLoadingCamera(true);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (isMounted.current && videoRef.current) {
        videoRef.current.srcObject = stream;
        
        try {
          await videoRef.current.play();
          if (isMounted.current) {
            setCameraReady(true);
            setIsScanning(true);
          }
        } catch (playErr) {
          if (isMounted.current) {
            console.error("Play error:", playErr);
            setError(`Camera error: ${playErr.message}`);
            stream.getTracks().forEach(track => track.stop());
          }
        } finally {
          if (isMounted.current) {
            setIsLoadingCamera(false);
          }
        }
      }
    } catch (err) {
      if (isMounted.current) {
        console.error("Camera access error:", err);
        setError(`Camera access error: ${err.message}`);
        setCameraReady(false);
        setIsLoadingCamera(false);
      }
    }
  }, []);

  // Initialize scanner
  useEffect(() => {
    if (!eventId || !eventQRCode) {
      setError("Missing event information");
      return;
    }

    startScanner();

    return () => {
      isMounted.current = false;
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
      clearInterval(scanInterval.current);
      setIsScanning(false);
      setCameraReady(false);
    };
  }, [eventId, eventQRCode, startScanner]);

  // Continuous scanning
  useEffect(() => {
    if (isScanning && cameraReady) {
      scanInterval.current = setInterval(handleScan, 500);
    }
    return () => clearInterval(scanInterval.current);
  }, [isScanning, cameraReady, handleScan]);

  const styles = {
    container: {
      display: "flex",
      minHeight: "100vh",
      backgroundColor: "#f8f9fa",
      position: "relative",
    },
    mainContent: {
      flex: 1,
      padding: "2rem",
      minHeight: "calc(100vh - 60px)",
      display: "flex",
      flexDirection: "column",
      transition: "margin-left 0.3s ease",
      marginLeft: sidebarVisible ? '250px' : '0'
    },
    scannerContainer: {
      width: "100%",
      maxWidth: "500px",
      margin: "2rem auto",
      position: "relative"
    },
    video: {
      width: "100%",
      border: "3px solid",
      borderColor: success ? "#4CAF50" : error ? "#f44336" : "#3498db",
      borderRadius: "8px",
      boxShadow: "0 4px 8px rgba(0,0,0,0.1)"
    },
    overlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(0,0,0,0.7)",
      color: "white",
      fontSize: "1.2rem"
    },
    successBox: {
      backgroundColor: "#e8f5e9",
      border: "2px solid #4CAF50",
      borderRadius: "8px",
      padding: "1rem",
      margin: "1rem 0",
      textAlign: "center"
    },
    errorBox: {
      backgroundColor: "#ffebee",
      border: "2px solid #f44336",
      borderRadius: "8px",
      padding: "1rem",
      margin: "1rem 0",
      textAlign: "center"
    }
  };

  return (
    <div style={styles.container}>
      <Sidebar 
        userType={userType}
        onSignOut={onSignOut}
        sidebarVisible={sidebarVisible}
        setSidebarVisible={setSidebarVisible}
      />

      <div style={styles.mainContent}>
        <h2>Event Check-In: {eventName || "Unknown Event"}</h2>
        <p>Scan the event's QR code to check in as {userData.firstName} {userData.lastName}</p>
        
        {error && (
          <div style={styles.errorBox}>
            <p style={{ color: "#f44336", fontWeight: "bold" }}>Error: {error}</p>
          </div>
        )}

        {success && scanResult && (
          <div style={styles.successBox}>
            <h3 style={{ color: "#2e7d32" }}>Check-In Successful!</h3>
            <p>User: {scanResult.userName}</p>
            <p>Event: {scanResult.eventName}</p>
            <p>Time: {scanResult.timestamp}</p>
          </div>
        )}

        <div style={styles.scannerContainer}>
          <video 
            ref={videoRef}
            style={styles.video}
            muted
            playsInline
          />
          
          {(!cameraReady || isLoadingCamera) && (
            <div style={styles.overlay}>
              {isLoadingCamera ? "Initializing camera..." : "Processing..."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRScanner;