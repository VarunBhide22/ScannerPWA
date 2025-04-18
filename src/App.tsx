import { useState, useEffect, useRef } from "react";
import "./App.css";
import ScannedItemsList from "./components/ScannedItemsList";
import InstallPWA from "./components/PWAinstall";

function App() {
  const [scannedItems, setScannedItems] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [currentBuffer, setCurrentBuffer] = useState("");
  const scanTimeout = useRef<number | null>(null);
  const scanBuffer = useRef<string>("");

  useEffect(() => {
    // Function to handle key presses
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isScanning) return;

      // Prevent default for most keys to avoid browser shortcuts, etc.
      if (e.key !== "F1" && e.key !== "F5" && e.key !== "Escape") {
        e.preventDefault();
      }

      // Only process keypresses when scanning is active
      if (e.key.length === 1) {
        // Only single character keys
        scanBuffer.current += e.key;
        setCurrentBuffer(scanBuffer.current);

        // Clear previous timeout if still typing
        if (scanTimeout.current) {
          clearTimeout(scanTimeout.current);
        }

        // Wait 100ms to determine end of scan
        scanTimeout.current = setTimeout(() => {
          const finalScan = scanBuffer.current.trim();
          if (finalScan && !scannedItems.includes(finalScan)) {
            setScannedItems((prev) => [finalScan, ...prev]);
            console.log("Final scanned barcode:", finalScan);
          }
          scanBuffer.current = "";
          setCurrentBuffer("");
        }, 100); // Delay after last character (adjust as needed)
      }
    };

    // Add and remove event listeners
    if (isScanning) {
      document.addEventListener("keydown", handleKeyPress);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [isScanning, scannedItems]);

  const toggleScanning = () => {
    setIsScanning(!isScanning);
    setCurrentBuffer("");
    scanBuffer.current = "";
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
          <p>Scanner Active - Scan a barcode</p>
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
