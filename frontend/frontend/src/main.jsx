import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./ui/ui.css";
import ToastProvider from "./ui/ToastProvider";
import App from "./App.jsx";
import Aurora from "./ui/AuroraLazy";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ToastProvider>
      <Suspense fallback={null}>
        <Aurora
          colorStops={["#68d35a", "#26382d", "#5227ff"]}
          blend={0.68}
          amplitude={1.15}
          speed={1.4}
        />
      </Suspense>
      <App />
    </ToastProvider>
  </StrictMode>
);
