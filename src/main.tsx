import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Default to LIGHT theme; respect saved preference if any.
try {
  const saved = localStorage.getItem('zip2git-theme');
  if (saved === 'dark') {
    document.documentElement.classList.remove('light');
  } else {
    document.documentElement.classList.add('light');
  }
} catch {
  document.documentElement.classList.add('light');
}

createRoot(document.getElementById("root")!).render(<App />);
