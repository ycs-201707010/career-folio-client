import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// Route
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
// Page
import HomePage from "./pages/HomePage";
import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import InstructorDashboardPage from "./pages/InstructorDashboardPage";
import NewCoursePage from "./pages/NewCoursePage";
import CourseManagePage from "./pages/CourseManagePage";
import CourseListPage from "./pages/CourseListPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import CourseDetailPage from "./pages/CourseDetailPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import MyCoursesPage from "./pages/MyCoursesPage";
import LecturePlayerPage from "./pages/LecturePlayerPage";

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
        <Route path="/courses" element={<CourseListPage />} />
        <Route path="/course/:courseId" element={<CourseDetailPage />} />

        <Route
          path="/learn/course/:courseId"
          element={
            <ProtectedRoute>
              <LecturePlayerPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-courses"
          element={
            <ProtectedRoute>
              <MyCoursesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />

        {/* 로그인한 사용자만 이용 가능한 페이지의 경우, ProtectedRoute로 감싼다. */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/** 강좌를 생성한 강사 관련 페이지 */}
        <Route
          path="/instructor"
          element={
            <ProtectedRoute>
              <InstructorDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/instructor/course/new"
          element={
            <ProtectedRoute>
              <NewCoursePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/instructor/course/:courseId"
          element={
            <ProtectedRoute>
              <CourseManagePage />
            </ProtectedRoute>
          }
        />
        {/* 강사 관련 페이지 End */}

        {/** 장바구니 페이지 */}
        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <CartPage />
            </ProtectedRoute>
          }
        />

        {/** 관리자 계열 페이지 */}
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminDashboardPage />
            </AdminRoute>
          }
        />

        {/** 관리자 계열 페이지 End */}
      </Routes>
    </Router>
  );
}

export default App;
