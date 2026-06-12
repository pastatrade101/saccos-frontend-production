import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173
    },
    build: {
        chunkSizeWarningLimit: 900,
        rollupOptions: {
            output: {
                // Split heavy shared libraries into their own long-cacheable chunks so the
                // initial download is small and parallelised. PDF/canvas libs are left out
                // on purpose - they are only imported dynamically (statement export) and must
                // stay in their own lazy chunks rather than being pulled into the eager bundle.
                manualChunks: function (id) {
                    if (!id.includes("node_modules")) {
                        return undefined;
                    }
                    if (id.includes("jspdf")
                        || id.includes("html2canvas")
                        || id.includes("dompurify")
                        || id.includes("canvg")) {
                        return undefined;
                    }
                    if (id.includes("@mui") || id.includes("@emotion")) {
                        return "mui";
                    }
                    if (id.includes("chart.js") || id.includes("react-chartjs-2")) {
                        return "charts";
                    }
                    if (id.includes("react-joyride") || id.includes("@popperjs") || id.includes("popper.js")) {
                        return "tour";
                    }
                    if (id.includes("/react-router")
                        || id.includes("/react-dom/")
                        || id.includes("/react/")
                        || id.includes("/scheduler/")) {
                        return "react";
                    }
                    return "vendor";
                }
            }
        }
    }
});
