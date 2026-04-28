/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#E8963A',   // Cognac amber
                secondary: '#C43B2C', // Deep tomato red
                dark: '#0E0B09',      // Warm near-black
                accent: '#7A3F22',    // Leather brown
                cream: '#F0E3CC',     // Warm ivory
                surface: '#161210',   // Card surface
                success: '#439746',   // Green
                tomato: '#C43B2C',
                gold: '#E8963A',
                oliver: '#556B2F'
            },
            fontFamily: {
                display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
                sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
