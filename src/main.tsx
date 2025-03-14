import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles/spinner.css";
import { BrowserRouter } from "react-router-dom";

// Import the dev tools and initialize them
import { TempoDevtools } from "tempo-devtools";
TempoDevtools.init();

// Initialize application setup
import { initializeAppSetup } from "./utils/setupUtils";

const basename = import.meta.env.BASE_URL;

// Use a self-invoking async function to ensure all imports are properly loaded
(async () => {
  // Run setup before rendering the app
  try {
    const setupSuccess = await initializeAppSetup();
    if (!setupSuccess) {
      console.warn(
        "Application setup was not fully completed. Some features may not work correctly.",
      );
    }
  } catch (error) {
    console.error("Error during application setup:", error);
  }

  // Make sure the root element exists before rendering
  const rootElement = document.getElementById("root");
  if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
      <BrowserRouter basename={basename}>
        <App />
      </BrowserRouter>,
    );
  } else {
    console.error(
      "Root element not found. Make sure there is a div with id 'root' in your HTML.",
    );
  }
})().catch((err) => console.error("Error initializing app:", err));
