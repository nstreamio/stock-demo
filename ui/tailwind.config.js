/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      backgroundColor: {
        app: "var(--app-background)",
        "row-primary": "var(--app-background)",
        "row-secondary": "var(--row-background-secondary)",
      },
    },
  },
  plugins: [],
};

