/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#e6f0f9",
        foreground: "#384959",
        card: "#f7fbff",
        "card-foreground": "#384959",
        muted: "#d5e8f8",
        "muted-foreground": "#6a89a7",
        border: "#88bdf2",
        input: "#88bdf2",
        primary: "#384959",
        "primary-foreground": "#f7fbff",
        secondary: "#6a89a7",
        "secondary-foreground": "#f7fbff",
        accent: "#88bdf2",
        "accent-foreground": "#384959",
        destructive: "#8f3d4a",
        ring: "#88bdf2",
        hit: "#22c55e",
        progress: "#3b82f6",
        streak: "#f97316",
        miss: "#8f3d4a",
      },
    },
  },
  plugins: [],
};
