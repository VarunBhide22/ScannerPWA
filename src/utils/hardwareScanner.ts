/* eslint-disable @typescript-eslint/no-explicit-any */
export interface HardwareScannerOptions {
  onScan: (barcode: string) => void;
  scanEndChar?: string; // Character that marks the end of a scan
  scanTimeout?: number; // Timeout between characters in ms
}

export class HardwareScanner {
  private buffer: string = "";
  private lastCharTime: number = 0;
  private options: HardwareScannerOptions;
  private isListening: boolean = false;

  constructor(options: HardwareScannerOptions) {
    this.options = {
      scanEndChar: "\n", // Default to newline/enter
      scanTimeout: 30, // Default timeout between characters
      ...options,
    };
  }

  public start(): void {
    if (this.isListening) return;

    this.isListening = true;
    document.addEventListener("keydown", this.handleKeyDown);

    // Try to access the Android DataWedge API if available (works on some Zebra/Newland devices)
    if (typeof window !== "undefined" && (window as any).datawedge) {
      try {
        console.log("DataWedge API detected, registering scanner...");
        const datawedge = (window as any).datawedge;
        datawedge.registerForBarcode((data: any) => {
          if (data && data.barcode) {
            this.options.onScan(data.barcode);
          }
        });
        datawedge.start();
      } catch (e) {
        console.warn("Error initializing DataWedge API:", e);
      }
    }

    console.log("Hardware scanner listener started");
  }

  public stop(): void {
    if (!this.isListening) return;

    document.removeEventListener("keydown", this.handleKeyDown);
    this.isListening = false;
    this.buffer = "";

    // If using DataWedge API
    if (typeof window !== "undefined" && (window as any).datawedge) {
      try {
        (window as any).datawedge.stop();
      } catch (e) {
        console.warn("Error stopping DataWedge API:", e);
      }
    }

    console.log("Hardware scanner listener stopped");
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    const currentTime = new Date().getTime();

    // If there's a significant delay, this might be manual typing rather than a scan
    // Hardware scanners typically send characters very quickly in succession
    if (
      this.buffer.length > 0 &&
      currentTime - this.lastCharTime > (this.options.scanTimeout || 30)
    ) {
      this.buffer = ""; // Reset if timeout occurred
    }

    // Update last character time
    this.lastCharTime = currentTime;

    // Check for end character (usually Enter key)
    if (event.key === "Enter" || event.key === this.options.scanEndChar) {
      if (this.buffer.length > 0) {
        // Process the scan
        this.options.onScan(this.buffer);
        this.buffer = "";

        // Prevent default to avoid form submissions
        event.preventDefault();
      }
    } else if (!event.ctrlKey && !event.altKey && !event.metaKey) {
      // Only add to buffer if it's a regular character (not a modifier keypress)
      this.buffer += event.key;
    }
  };
}
