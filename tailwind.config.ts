import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0E1116",
        card: "#171B22",
        accent: "#C8A96B",
        danger: "#A63D40",
        "text-primary": "#F5F5F5",
        "text-secondary": "#8A8F98",
        border: "#262B33",
      },
      fontFamily: {
        display: ["var(--font-cinzel)", "Cinzel", "serif"],
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        float: "float 4s ease-in-out infinite",
        fog: "fog-drift 8s ease-in-out infinite",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      boxShadow: {
        glow: "0 0 20px rgba(200,169,107,0.25)",
        "glow-lg": "0 0 40px rgba(200,169,107,0.3)",
        danger: "0 0 20px rgba(166,61,64,0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
