/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

const BarcodeScanner = ({ onScan, onClose }: BarcodeScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [permissionStatus, setPermissionStatus] = useState<
    "prompt" | "granted" | "denied" | "requesting"
  >("prompt");

  const requestPermissions = async () => {
    setPermissionStatus("requesting");
    try {
      // Check if the BarcodeDetector API is available (newer implementation)
      if ("BarcodeDetector" in window) {
        // This API check often triggers browser permission requests on devices
        const formats = await (
          window as any
        ).BarcodeDetector.getSupportedFormats();
        console.log("Supported barcode formats:", formats);
      }

      // Request camera access - this will trigger permission prompt
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setPermissionStatus("granted");

      // Set up keyboard listener for hardware scanner
      document.addEventListener("keypress", handleKeyPress);
    } catch (error) {
      console.error("Error requesting permissions:", error);
      setPermissionStatus("denied");
    }
  };

  // Handle barcode input from hardware scanner
  const handleKeyPress = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      // Get the input value from a global variable or element
      const scannedValue = (window as any).currentBarcode || "";
      if (scannedValue) {
        onScan(scannedValue);
        (window as any).currentBarcode = "";
      }
    } else {
      // Accumulate characters
      (window as any).currentBarcode =
        ((window as any).currentBarcode || "") + event.key;
    }
  };

  useEffect(() => {
    // Initialize barcode collection variable
    (window as any).currentBarcode = "";

    // Check for existing permissions
    if (navigator.permissions && navigator.permissions.query) {
      // Try to query camera permission status
      navigator.permissions
        .query({ name: "camera" as PermissionName })
        .then((status) => {
          setPermissionStatus(status.state as "prompt" | "granted" | "denied");
          if (status.state === "granted") {
            // If already granted, set up camera and scanner
            setupCamera();
          }
        })
        .catch((err) => {
          console.warn("Couldn't query permission status:", err);
        });
    }

    // Cleanup function
    return () => {
      document.removeEventListener("keypress", handleKeyPress);
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
      (window as any).currentBarcode = "";
    };
  }, []);

  const setupCamera = async () => {
    try {
      // Access device camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // For NLS-MT90, hardware triggers often simulate keyboard input
        document.addEventListener("keypress", handleKeyPress);
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert(
        "Could not access camera. Please ensure camera permissions are granted."
      );
    }
  };

  if (permissionStatus === "prompt" || permissionStatus === "requesting") {
    return (
      <div className="permission-container">
        <h3>Scanner Permission Required</h3>
        <p>
          This app needs permission to access your device's camera and barcode
          scanner to function.
        </p>
        {permissionStatus === "requesting" ? (
          <div className="loading">Requesting permissions...</div>
        ) : (
          <button className="permission-button" onClick={requestPermissions}>
            Grant Scanner Permission
          </button>
        )}
        <button className="cancel-button" onClick={onClose}>
          Cancel
        </button>
      </div>
    );
  }

  if (permissionStatus === "denied") {
    return (
      <div className="permission-container error">
        <h3>Permission Denied</h3>
        <p>
          Scanner permission was denied. Please enable camera access in your
          device settings to use this feature.
        </p>
        <button className="retry-button" onClick={requestPermissions}>
          Try Again
        </button>
        <button className="close-button" onClick={onClose}>
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="scanner-container">
      <div className="scanner-overlay">
        <div className="scanner-target"></div>
      </div>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="scanner-video"
      />
      <div className="scanner-instructions">
        <p>Point scanner at barcode or press hardware scan button</p>
      </div>
      <button className="close-button" onClick={onClose}>
        Close Scanner
      </button>
    </div>
  );
};

export default BarcodeScanner;
