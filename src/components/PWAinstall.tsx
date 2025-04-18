import { useState, useEffect } from "react";

// Extend the Navigator interface to include Safari's standalone property
interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

// Interface for the beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

function InstallPWA() {
  const [supportsPWA, setSupportsPWA] = useState<boolean>(false);
  const [promptInstall, setPromptInstall] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    // Cast the navigator to our extended interface
    const nav = navigator as NavigatorWithStandalone;

    // Check if the app is already installed
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      nav.standalone === true
    ) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setPromptInstall(e as BeforeInstallPromptEvent);
      // Update UI to notify the user they can install the PWA
      setSupportsPWA(true);
    };

    // Listen for the beforeinstallprompt event
    window.addEventListener("beforeinstallprompt", handler);

    // Check if the app was installed
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      console.log("PWA was installed");
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.preventDefault();
    // Show the install prompt
    if (promptInstall) {
      promptInstall.prompt();
      // Wait for the user to respond to the prompt
      promptInstall.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === "accepted") {
          console.log("User accepted the install prompt");
        } else {
          console.log("User dismissed the install prompt");
        }
        // Clear the saved prompt since it can't be used again
        setPromptInstall(null);
        setSupportsPWA(false);
      });
    }
  };

  if (!supportsPWA || isInstalled) {
    return null;
  }

  return (
    <div className="install-banner">
      <div className="install-message">
        Install this app on your device for a better experience
      </div>
      <button className="install-button" onClick={handleInstallClick}>
        Install App
      </button>
    </div>
  );
}

export default InstallPWA;
