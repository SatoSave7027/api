import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";

import App from "./App";
import { AuthProvider } from "./lib/auth";
import { ToastProvider } from "./components/Toast";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <HashRouter>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>
);
