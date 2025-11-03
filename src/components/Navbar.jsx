import React, { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import axios from "axios"; // 로그인 상태 관리 훅
import { ShoppingCartIcon, UserCircleIcon } from "@heroicons/react/24/outline"; // 아이콘 import

const API_BASE_URL = "http://localhost:8080"; // API 주소

// Navbar에서 프로필 정보를 가져오기 위한 API 함수
const fetchMyProfileForNav = async (token) => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const { data } = await axios.get(`${API_BASE_URL}/api/profile/me`, config);

  return data;
};

function Navbar() {
  const { user, logout, token } = useAuth(); // 현재 사용자 정보와 로그아웃 함수 가져오기
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null); // 드롭다운 DOM 참조

  // 로그인했을 때만 프로필 정보(사진 URL 등)를 가져옵니다.
  const { data: profile } = useQuery({
    queryKey: ["myProfile"],
    queryFn: () => fetchMyProfileForNav(token),
    enabled: !!user, // user(로그인 상태)가 있을 때만 쿼리 실행
    refetchOnWindowFocus: false,
    // 👇 이 부분이 핵심입니다!
    // 받아온 전체 데이터(data)에서 profile 속성만 선택하여
    // 이 컴포넌트의 data(여기서는 profile 변수)로 사용합니다.
    select: (data) => data.profile,
  });

  // 드롭다운 닫기 로직 (바깥 클릭 감지)
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    // 이벤트 리스너 등록
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // 클린업
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
    navigate("/"); // 로그아웃 후 홈으로 이동
  };

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
                  <ShoppingCartIcon className="h-6 w-6" />
                  {/* <svg
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
                  </svg> */}
                  {/* TODO: 장바구니 개수 표시 */}
                </Link>
                {/* --- 프로필 드롭다운 --- */}
                <div className="relative" ref={dropdownRef}>
                  {/* 1. 프로필 사진 버튼 */}
                  {profile?.picture_url ? (
                    <img
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      src={`${API_BASE_URL}/${profile.picture_url}`}
                      alt="프로필"
                      className="w-9 h-9 rounded-full overflow-hidden border-2 border-transparent hover:border-blue-500 transition focus:outline-none cursor-pointer"
                    />
                  ) : (
                    <UserCircleIcon
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="w-8 h-8 text-gray-400 rounded-full overflow-hidden border-2 border-transparent hover:border-blue-500 transition focus:outline-none cursor-pointer"
                    />
                  )}
                  {/* <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-9 h-9 rounded-full overflow-hidden border-2 border-transparent hover:border-blue-500 transition focus:outline-none"
                  >
                    {profile?.picture_url ? (
                      <img
                        src={`${API_BASE_URL}/${profile.picture_url}`}
                        alt="프로필"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserCircleIcon className="w-8 h-8 text-gray-400" />
                    )}
                  </button> */}

                  {/* 2. 드롭다운 메뉴 리스트 */}
                  {isDropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                      role="menu"
                      aria-orientation="vertical"
                    >
                      <div className="py-1" role="none">
                        <div className="px-4 py-3 border-b">
                          <p className="text-sm text-gray-500">로그인 계정</p>
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {user.nickname}
                          </p>
                        </div>
                        <Link
                          to="/my-profile"
                          onClick={() => setIsDropdownOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 no-underline hover:no-underline"
                          role="menuitem"
                        >
                          내 프로필 관리
                        </Link>
                        {/* <Link to="/account-settings" ... >계정 설정</Link> */}
                        <button
                          onClick={handleLogout}
                          className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                          role="menuitem"
                        >
                          로그아웃
                        </button>
                      </div>
                    </div>
                  )}
                </div>
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
