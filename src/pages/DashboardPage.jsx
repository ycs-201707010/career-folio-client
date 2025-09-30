import React from "react";
import { useAuth } from "../context/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";

function DashboardPage() {
  const { user, logout } = useAuth();

  // 페이지 이동
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();

    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <header className="max-w-4xl mx-auto bg-white p-4 rounded-lg shadow-md flex justify-between items-center">
        <h1 className="text-xl font-bold">CareerFolio Dashboard</h1>
        <div className="flex items-center gap-4">
          <p>
            <span className="font-semibold">{user?.nickname}</span>님,
            환영합니다!
          </p>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white font-semibold rounded-md hover:bg-red-600 transition"
          >
            로그아웃
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto mt-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold">메인 컨텐츠 영역</h2>
          <p className="mt-2 text-gray-600">
            이곳에 이력서 빌더, Q&A 게시판 등의 기능이 들어올 예정입니다.
          </p>
        </div>
      </main>
    </div>
  );
}

export default DashboardPage;
