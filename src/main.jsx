import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext"; // AuthProvider import
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"; // 추가
import { ThemeProvider } from "./context/ThemeContext"; // 다크모드 프로바이더

// Create a client
const queryClient = new QueryClient(); // 추가

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
);
