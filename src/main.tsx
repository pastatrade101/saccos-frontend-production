import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import { AuthProvider } from "./auth/AuthProvider";
import { ToastProvider } from "./components/Toast";
import { registerServiceWorker } from "./pwa/registerServiceWorker";
import { AppThemeProvider } from "./ui/AppThemeProvider";
import { LanguageProvider } from "./ui/LanguageProvider";
import { UIProvider } from "./ui/UIProvider";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <BrowserRouter>
            <UIProvider>
                <LanguageProvider>
                    <AppThemeProvider>
                        <AuthProvider>
                            <ToastProvider>
                                <App />
                            </ToastProvider>
                        </AuthProvider>
                    </AppThemeProvider>
                </LanguageProvider>
            </UIProvider>
        </BrowserRouter>
    </React.StrictMode>
);

registerServiceWorker();
