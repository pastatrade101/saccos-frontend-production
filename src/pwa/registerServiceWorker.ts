export function registerServiceWorker() {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
        return;
    }

    if (!import.meta.env.PROD) {
        void navigator.serviceWorker.getRegistrations().then((registrations) => {
            registrations.forEach((registration) => {
                void registration.unregister();
            });
        });
        return;
    }

    window.addEventListener("load", () => {
        void navigator.serviceWorker.register("/sw.js").catch((error) => {
            console.error("Service worker registration failed", error);
        });
    });
}
