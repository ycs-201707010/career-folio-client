/** @type {import('tailwindcss').Config} */
import defaultTheme from "tailwindcss/defaultTheme";

export default {
  content: ["./index.html", "./src/**/*.{html,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // --- 👇 [핵심 수정] ---
      fontFamily: {
        // 2. 'sans' (기본 폰트)를 Pretendard로 덮어씁니다.
        sans: ["Pretendard", ...defaultTheme.fontFamily.sans],
      },
      // --- [수정 완료] ---
    },
  },
  plugins: [],
  darkMode: "class",
};
