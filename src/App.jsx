import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout"; // 레이아웃 import
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
import MyProfilePage from "./pages/MyProfilePage";

// ... 다른 페이지 import ...

function App() {
  return (
    <Router>
      <Routes>
        {/* Navbar가 있는 페이지 그룹 */}
        <Route element={<Layout />}>
          {/* 공개 페이지 */}
          <Route path="/" element={<HomePage />} />
          <Route path="/courses" element={<CourseListPage />} />
          <Route path="/course/:courseId" element={<CourseDetailPage />} />

          {/* 로그인이 필요한 페이지 */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-profile"
            element={
              <ProtectedRoute>
                <MyProfilePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <CartPage />
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
          <Route
            path="/my-courses"
            element={
              <ProtectedRoute>
                <MyCoursesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/instructor/dashboard"
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

          {/* 관리자 전용 페이지 */}
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            }
          />
        </Route>

        <Route
          path="/learn/course/:courseId"
          element={
            <ProtectedRoute>
              <LecturePlayerPage />
            </ProtectedRoute>
          }
        />

        {/* Navbar가 없는 독립적인 페이지 (로그인, 회원가입) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Routes>
    </Router>
  );
}

export default App;
