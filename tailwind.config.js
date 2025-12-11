/** @type {import('tailwindcss').Config} */
import defaultTheme from "tailwindcss/defaultTheme";

export default {
  darkMode: "class",

  content: ["./index.html", "./src/**/*.{html,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // --- 👇 [핵심 수정] ---
      fontFamily: {
        // 2. 'sans' (기본 폰트)를 Pretendard로 덮어씁니다.
        sans: ["Pretendard", ...defaultTheme.fontFamily.sans],
      },
      // --- [수정 완료] ---

      colors: {
        primary: {
          DEFAULT: "rgb(var(--color-primary) / <alpha-value>)",
          on: "rgb(var(--color-on-primary) / <alpha-value>)",
          container: "rgb(var(--color-primary-container) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "rgb(var(--color-secondary) / <alpha-value>)",
          on: "rgb(var(--color-on-secondary) / <alpha-value>)",
          container: "rgb(var(--color-secondary-container) / <alpha-value>)",
        },
        surface: {
          DEFAULT: "rgb(var(--color-surface) / <alpha-value>)",
          on: "rgb(var(--color-on-surface) / <alpha-value>)",
          container: "rgb(var(--color-surface-container) / <alpha-value>)",
        },
        outline: "rgb(var(--color-outline) / <alpha-value>)",
        error: "rgb(var(--color-error) / <alpha-value>)",
      },
    },
  },
  plugins: [],
};
