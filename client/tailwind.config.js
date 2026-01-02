/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#feb705',   // Yellow/Gold
                secondary: '#f74407', // Orange/Red
                dark: '#1a1645',      // Dark Navy
                accent: '#810431',    // Deep Red/Burgundy
                success: '#439746',   // Green
                tomato: '#FF6347',    // Keeping for backward compatibility if needed, but should be replaced
                gold: '#FFD700',      // Keeping for backward compatibility
                oliver: '#556B2F'     // Keeping for backward compatibility
            }
        },
    },
    plugins: [],
}
