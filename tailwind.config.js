/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"], // ensure this line exists
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
  colors: {
    'text-primary': '#E1E2E2',
    'text-subtle': '#6D6041',
    'gold': '#CAAB5B',
    'main': '#121317',
    'section': '#111216',
    'border': '#2C2C2C',
  },
  boxShadow: {
        'soft': '0 4px 15px rgba(0, 0, 0, 0.3)',
      },
      borderRadius: {
        'xl': '1rem',
      },
}

  },
  plugins: [require("tailwindcss-animate")],
};


