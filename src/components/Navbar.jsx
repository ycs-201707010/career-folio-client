import React from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // 로그인 상태 관리 훅

function Navbar() {
  const { user, logout } = useAuth(); // 현재 사용자 정보와 로그아웃 함수 가져오기

  return (
    <nav className="bg-white shadow-md relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* 왼쪽: 로고 및 주요 메뉴 */}
          <div className="flex">
            <Link
              to="/"
              className="flex-shrink-0 flex items-center font-bold text-xl hover:no-underline"
            >
              CareerFolio
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <NavLink
                to="/courses"
                className={({ isActive }) =>
                  `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium hover:no-underline ${
                    isActive
                      ? "border-blue-500 text-gray-900"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`
                }
              >
                전체 강좌
              </NavLink>
              {/* 로그인 시 보이는 메뉴 */}
              {user && (
                <>
                  <NavLink
                    to="/my-courses"
                    className={({ isActive }) =>
                      `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                        isActive
                          ? "border-blue-500 text-gray-900"
                          : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                      }`
                    }
                  >
                    나의 학습
                  </NavLink>
                  <NavLink
                    to="/instructor/dashboard"
                    className={({ isActive }) =>
                      `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                        isActive
                          ? "border-blue-500 text-gray-900"
                          : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                      }`
                    }
                  >
                    강의 관리
                  </NavLink>
                </>
              )}
              {/* 관리자일 때만 보이는 메뉴 */}
              {user?.role === "admin" && (
                <NavLink
                  to="/admin/dashboard"
                  className={({ isActive }) =>
                    `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? "border-blue-500 text-gray-900"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    }`
                  }
                >
                  관리자
                </NavLink>
              )}
            </div>
          </div>

          {/* 오른쪽: 로그인/로그아웃, 장바구니 등 */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {user ? (
              <>
                <Link
                  to="/cart"
                  className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-4"
                >
                  <svg
                    className="h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  {/* TODO: 장바구니 개수 표시 */}
                </Link>
                <span className="text-sm text-gray-700 mr-4">
                  환영합니다, {user.nickname}님!
                </span>
                <button
                  onClick={logout}
                  className="px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <div className="flex space-x-4">
                <Link
                  to="/login"
                  className="px-3 py-1 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 no-underline hover:no-underline"
                >
                  로그인
                </Link>
                <Link
                  to="/signup"
                  className="px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  회원가입
                </Link>
              </div>
            )}
          </div>
          {/* 모바일 햄버거 메뉴 (구현 생략) */}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
