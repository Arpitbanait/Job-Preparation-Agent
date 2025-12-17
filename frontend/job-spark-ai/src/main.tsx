import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./api/fix-formdata";   // <----------- REQUIRED GLOBAL FIX


createRoot(document.getElementById("root")!).render(<App />);
