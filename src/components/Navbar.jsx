import React, { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios"; // 로그인 상태 관리 훅
import {
  ShoppingCartIcon,
  UserCircleIcon,
  AcademicCapIcon, // (강의)
  QuestionMarkCircleIcon, // (지식IN)
  DocumentTextIcon, // (이력서)
  WrenchScrewdriverIcon,
  BellIcon,
} from "@heroicons/react/24/outline"; // 아이콘 import
import {
  BellIcon as BellIconSolid,
  SunIcon,
  MoonIcon,
} from "@heroicons/react/24/solid";
import { useTheme } from "../context/ThemeContext";

const API_BASE_URL = "http://localhost:8080"; // API 주소

// Navbar에서 프로필 정보를 가져오기 위한 API 함수
const fetchMyProfileForNav = async (token) => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const { data } = await axios.get(`${API_BASE_URL}/api/profile/me`, config);

  return data;
};

// [신규] 알림 목록 조회
const fetchNotifications = async (token) => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const { data } = await axios.get(`${API_BASE_URL}/api/notifications`, config);
  return data; // { notifications: [], unreadCount: 0 }
};

// [신규] 알림 읽음 처리
const markAsRead = async ({ id, token }) => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  await axios.patch(`${API_BASE_URL}/api/notifications/${id}/read`, {}, config);
};

// [신규] 알림 모두 읽음 처리
const markAllAsRead = async (token) => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  await axios.patch(`${API_BASE_URL}/api/notifications/read-all`, {}, config);
};

function Navbar() {
  const { user, logout, token } = useAuth(); // 현재 사용자 정보와 로그아웃 함수 가져오기
  const { theme, toggleTheme } = useTheme(); // 테마 상태 가져옴

  const navigate = useNavigate();
  const queryClient = useQueryClient(); // 👈 추가

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null); // 드롭다운 DOM 참조

  // [신규] 알림 드롭다운 상태
  const [isNotiOpen, setIsNotiOpen] = useState(false);
  const notiRef = useRef(null);

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

  // 2. [신규] 알림 데이터 조회 (Polling: 30초마다 갱신)
  const { data: notiData } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetchNotifications(token),
    enabled: !!user,
    refetchInterval: 30000, // 30초마다 자동 갱신 (실시간성 확보)
  });

  const notifications = notiData?.notifications || [];
  const unreadCount = notiData?.unreadCount || 0;

  // 3. [신규] 읽음 처리 Mutation
  const readMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const readAllMutation = useMutation({
    mutationFn: () => markAllAsRead(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // 알림 클릭 핸들러
  const handleNotificationClick = (noti) => {
    // 1. 읽음 처리
    if (!noti.is_read) {
      readMutation.mutate({ id: noti.idx, token });
    }
    // 2. 이동
    if (noti.url) {
      navigate(noti.url);
    }
    // 3. 드롭다운 닫기
    setIsNotiOpen(false);
  };

  // 드롭다운 닫기 로직 (바깥 클릭 감지)
  useEffect(() => {
    function handleClickOutside(event) {
      // 프로필 드롭다운
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      // 알림 드롭다운
      if (notiRef.current && !notiRef.current.contains(event.target)) {
        setIsNotiOpen(false);
      }
    }
    // 이벤트 리스너 등록
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // 클린업
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef, notiRef]);

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
    setIsNotiOpen(false);
    navigate("/"); // 로그아웃 후 홈으로 이동
  };

  // NavLink 공통 스타일 함수 (활성/비활성)
  const getNavLinkClass = ({ isActive }) =>
    `flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? "bg-blue-50 text-blue-600" // (활성 스타일 - YouTube/치지직 스타일)
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    }`;

  return (
    <nav className="bg-white shadow-md relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          {/* 왼쪽: 로고 및 주요 메뉴 */}
          <div className="flex-shrink-0">
            <Link
              to="/"
              className="flex items-center font-bold text-xl hover:no-underline text-stone-950"
            >
              <img
                src="../src/assets/careerFolio_logo.png"
                alt="로고"
                className="w-36"
              />{" "}
              {/* TODO : 로고 이미지로 변경 */}
            </Link>
          </div>

          {/* 중앙: 메인 메뉴 */}
          <div className="hidden ml-6 sm:ml-6 sm:flex flex-1 justify-center sm:space-x-8">
            <div className="flex space-x-4">
              {/* 전체 강좌 */}
              <NavLink to="/courses" className={getNavLinkClass}>
                <AcademicCapIcon className="h-5 w-5" />
                <span>전체 강좌</span>
              </NavLink>

              {/* 지식IN (Q&A) */}
              <NavLink to="/qna" className={getNavLinkClass}>
                <QuestionMarkCircleIcon className="h-5 w-5" />
                <span>지식IN</span>
              </NavLink>

              {/* 이력서 빌더 */}
              <NavLink to="/my-resume" className={getNavLinkClass}>
                <DocumentTextIcon className="h-5 w-5" />
                <span>이력서</span>
              </NavLink>

              {/* 관리자일 때만 보이는 메뉴 */}
              {user?.role === "admin" && (
                <NavLink to="/admin/dashboard" className={getNavLinkClass}>
                  {/* (관리자용 아이콘) */}
                  <WrenchScrewdriverIcon className="w-5 h-5"></WrenchScrewdriverIcon>
                  <span>관리자</span>
                </NavLink>
              )}
            </div>
          </div>

          {/* 오른쪽: 로그인/로그아웃, 장바구니 등 */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <button
              onClick={toggleTheme}
              className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors mr-2"
              aria-label="테마 변경"
            >
              {theme === "dark" ? (
                <SunIcon className="h-6 w-6 text-yellow-500" /> // 다크일 땐 해 보여주기
              ) : (
                <MoonIcon className="h-6 w-6 text-gray-600" /> // 라이트일 땐 달 보여주기
              )}
            </button>

            {user ? (
              <>
                <Link
                  to="/cart"
                  className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2  mr-4"
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

                {/* --- 👇 [신규] 알림 벨 --- */}
                <div className="relative" ref={notiRef}>
                  <button
                    onClick={() => setIsNotiOpen(!isNotiOpen)}
                    className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2  mr-4 relative"
                  >
                    {unreadCount > 0 ? (
                      <BellIconSolid className="h-6 w-6 text-yellow-500" />
                    ) : (
                      <BellIcon className="h-6 w-6" />
                    )}

                    {/* 읽지 않은 알림 뱃지 */}
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 ring-2 ring-white text-[10px] font-bold text-white text-center leading-4">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* 알림 드롭다운 */}
                  {isNotiOpen && (
                    <div className="absolute right-0 mt-2 w-80 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 overflow-hidden">
                      <div className="px-4 py-2 border-b flex justify-between items-center bg-gray-50">
                        <span className="text-sm font-semibold text-gray-700">
                          알림
                        </span>
                        {unreadCount > 0 && (
                          <button
                            onClick={() => readAllMutation.mutate()}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            모두 읽음
                          </button>
                        )}
                      </div>

                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map((noti) => (
                            <div
                              key={noti.idx}
                              onClick={() => handleNotificationClick(noti)}
                              className={`px-4 py-3 border-b last:border-0 cursor-pointer hover:bg-gray-50 transition ${
                                !noti.is_read ? "bg-blue-50" : "bg-white"
                              }`}
                            >
                              <p className="text-sm text-gray-800 line-clamp-2">
                                {noti.message}
                              </p>
                              <span className="text-xs text-gray-400 mt-1 block">
                                {new Date(noti.created_at).toLocaleString()}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="p-6 text-center text-gray-500 text-sm">
                            새로운 알림이 없습니다.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

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

                        {/* --- 👇 [수정] 메뉴 이동 --- */}
                        <Link
                          to={`/profile/${user.id}`} // (Turn 77 기준: user.id가 로그인 ID)
                          onClick={() => setIsDropdownOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 no-underline hover:no-underline"
                          role="menuitem"
                        >
                          내 프로필
                        </Link>
                        <Link
                          to="/my-courses"
                          onClick={() => setIsDropdownOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 no-underline hover:no-underline"
                          role="menuitem"
                        >
                          나의 학습
                        </Link>
                        <Link
                          to="/instructor/dashboard"
                          onClick={() => setIsDropdownOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 no-underline hover:no-underline"
                          role="menuitem"
                        >
                          강좌 관리
                        </Link>
                        <Link
                          to="/my-profile" // (프로필 설정 페이지)
                          onClick={() => setIsDropdownOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 no-underline hover:no-underline border-t"
                          role="menuitem"
                        >
                          계정 설정
                        </Link>
                        {/* --- [수정 완료] --- */}

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
