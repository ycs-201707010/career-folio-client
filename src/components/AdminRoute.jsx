import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AdminRoute = ({ children }) => {
  // AuthContext를 통해 현재 로그인된 사용자 정보와 로딩 상태를 가져옵니다.
  const { user, isLoading } = useAuth();

  // 사용자가 원래 이동하려고 했던 경로 정보를 저장합니다.
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>사용자 정보를 확인 중입니다...</p>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    alert("접근 권한이 없습니다.");
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};

export default AdminRoute;
