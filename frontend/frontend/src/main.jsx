import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./ui/ui.css";
import ToastProvider from "./ui/ToastProvider";
import Aurora from "./ui/Aurora";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ToastProvider>
      <Aurora
        colorStops={["#68d35a", "#26382d", "#5227ff"]}
        blend={0.68}
        amplitude={1.15}
        speed={1.4}
      />
      <App />
    </ToastProvider>
  </StrictMode>
);
