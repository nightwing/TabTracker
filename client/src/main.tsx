import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// This is needed for Electron applications
declare global {
  interface Window {
    electron?: {
      isElectron: boolean;
    };
  }
}

createRoot(document.getElementById("root")!).render(<App />);
