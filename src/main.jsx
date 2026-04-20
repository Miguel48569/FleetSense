import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";        // caminho relativo
import "./index.css";           // caminho relativo
import { AuthProvider } from "@/lib/AuthContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
