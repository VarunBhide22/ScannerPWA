import { useState, useEffect } from "react";
import "./App.css";
import ScannedItemsList from "./components/ScannedItemsList";
import InstallPWA from "./components/PWAinstall";

function App() {
  const [scannedItems, setScannedItems] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [currentBuffer, setCurrentBuffer] = useState<string>("");

  useEffect(() => {
    // Setup hardware scanner listeners when scanning is active
    if (isScanning) {
      // Create buffer for collecting scanned characters
      let scanBuffer = "";
      let lastScanTime = 0;

      // Handler for scanner input (comes as keyboard events)
      const handleKeyDown = (event: KeyboardEvent) => {
        const currentTime = new Date().getTime();

        // If there's a significant delay, reset the buffer
        // Hardware scanners typically send characters very quickly
        if (scanBuffer.length > 0 && currentTime - lastScanTime > 50) {
          scanBuffer = "";
        }

        lastScanTime = currentTime;

        // Check for Enter key (usually signals end of barcode scan)
        if (event.key === "Enter") {
          if (scanBuffer.length > 0) {
            // Process the complete scan
            if (!scannedItems.includes(scanBuffer)) {
              setScannedItems((prev) => [scanBuffer, ...prev]);
            }
            setCurrentBuffer("");
            scanBuffer = "";
            event.preventDefault();
          }
        } else if (!event.ctrlKey && !event.altKey && !event.metaKey) {
          // Add character to buffer
          scanBuffer += event.key;
          setCurrentBuffer(scanBuffer);

          // For very short scans, this can help see what's happening
          console.log("Current scan buffer:", scanBuffer);
        }
      };

      // Add event listener
      document.addEventListener("keydown", handleKeyDown);

      // Cleanup
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isScanning, scannedItems]);

  const toggleScanning = () => {
    setIsScanning(!isScanning);
    if (isScanning) {
      setCurrentBuffer(""); // Clear buffer when stopping
    }
  };

  return (
    <div className="container">
      <h1>Barcode Scanner</h1>

      <InstallPWA />

      <button
        className={`scan-button ${isScanning ? "active" : ""}`}
        onClick={toggleScanning}
      >
        {isScanning ? "Stop Scanning" : "Start Scanning"}
      </button>

      {isScanning && (
        <div className="scanning-status">
          <div className="status-indicator"></div>
          <p>Scanner Active - Press hardware scan button</p>
          {currentBuffer && (
            <div className="buffer-display">Reading: {currentBuffer}</div>
          )}
        </div>
      )}

      <ScannedItemsList items={scannedItems} />
    </div>
  );
}

export default App;
