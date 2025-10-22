import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * 로그인된 사용자만 접근할 수 있도록 페이지를 보호하는 컴포넌트입니다.
 * @param {object} props - { children: React.ReactNode }
 */
const ProtectedRoute = ({ children }) => {
  // AuthContext를 통해 현재 로그인된 사용자 정보와 로딩 상태를 가져옵니다.
  const { user, isLoading } = useAuth();

  // 사용자가 원래 이동하려고 했던 경로 정보를 저장합니다.
  const location = useLocation();

  // 앱이 처음 로딩될 때, AuthContext가 localStorage의 토큰을 확인하는 동안 잠시 대기합니다.
  // 이 로딩 상태 처리가 없으면, 확인이 끝나기 전에 로그인 페이지로 튕기는 현상이 발생할 수 있습니다.
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>사용자 정보를 확인 중입니다...</p>
      </div>
    );
  }

  if (!user) {
    // 로그인하지 않았다면 로그인 페이지로 리디렉션\
    // 'state={{ from: location }}'는 로그인 성공 후 원래 가려던 페이지로 돌려보내기 위한 정보입니다.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
