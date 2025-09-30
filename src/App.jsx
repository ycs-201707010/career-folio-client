import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";

// ... 다른 페이지 import ...

function App() {
  return (
    <Router>
      <Routes>
        {/* 기본 경로(/)로 접속 시 HomePage를 보여줍니다. */}
        <Route path="/" element={<HomePage />} />
        {/* 다른 라우트들 */}
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </Router>
  );
}

export default App;
