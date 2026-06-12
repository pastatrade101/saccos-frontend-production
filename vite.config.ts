import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173
    },
    build: {
        chunkSizeWarningLimit: 1600,
        rollupOptions: {
            output: {
                // Keep ALL third-party code in a single long-cacheable "vendor" chunk.
                // Splitting node_modules into several chunks (react/mui/popper/...) risks
                // cross-chunk initialization-order crashes, so we deliberately keep one
                // vendor chunk. PDF/canvas libs are excluded because they are only imported
                // dynamically (statement export) and must stay in their own lazy chunks.
                manualChunks(id) {
                    if (!id.includes("node_modules")) {
                        return undefined;
                    }
                    if (
                        id.includes("jspdf")
                        || id.includes("html2canvas")
                        || id.includes("dompurify")
                        || id.includes("canvg")
                    ) {
                        return undefined;
                    }
                    return "vendor";
                }
            }
        }
    }
});
