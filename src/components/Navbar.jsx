import React, { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  ShoppingCartIcon,
  UserCircleIcon,
  AcademicCapIcon,
  QuestionMarkCircleIcon,
  DocumentTextIcon,
  WrenchScrewdriverIcon,
  BellIcon,
} from "@heroicons/react/24/outline";
import {
  BellIcon as BellIconSolid,
  SunIcon,
  MoonIcon,
} from "@heroicons/react/24/solid";
import { useTheme } from "../context/ThemeContext";

const API_BASE_URL = "http://localhost:8080";

// --- API 함수 (기능 로직 유지) ---
const fetchMyProfileForNav = async (token) => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const { data } = await axios.get(`${API_BASE_URL}/api/profile/me`, config);
  return data;
};

const fetchNotifications = async (token) => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const { data } = await axios.get(`${API_BASE_URL}/api/notifications`, config);
  return data;
};

const markAsRead = async ({ id, token }) => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  await axios.patch(`${API_BASE_URL}/api/notifications/${id}/read`, {}, config);
};

const markAllAsRead = async (token) => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  await axios.patch(`${API_BASE_URL}/api/notifications/read-all`, {}, config);
};

function Navbar() {
  const { user, logout, token } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [isNotiOpen, setIsNotiOpen] = useState(false);
  const notiRef = useRef(null);

  const { data: profile } = useQuery({
    queryKey: ["myProfile"],
    queryFn: () => fetchMyProfileForNav(token),
    enabled: !!user,
    refetchOnWindowFocus: false,
    select: (data) => data.profile,
  });

  const { data: notiData } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetchNotifications(token),
    enabled: !!user,
    refetchInterval: 30000,
  });

  const notifications = notiData?.notifications || [];
  const unreadCount = notiData?.unreadCount || 0;

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

  const handleNotificationClick = (noti) => {
    if (!noti.is_read) {
      readMutation.mutate({ id: noti.idx, token });
    }
    if (noti.url) {
      navigate(noti.url);
    }
    setIsNotiOpen(false);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (notiRef.current && !notiRef.current.contains(event.target)) {
        setIsNotiOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef, notiRef]);

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
    setIsNotiOpen(false);
    navigate("/");
  };

  // 👇 [수정] NavLink 스타일: 시맨틱 컬러 적용
  // 활성 상태: Primary Container 배경 + Primary 텍스트 (또는 on-container)
  // 비활성 상태: Surface Variant 텍스트 + Hover 시 Surface Container 배경
  const getNavLinkClass = ({ isActive }) =>
    `flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? "bg-secondary-container text-on-secondary-container"
        : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
    }`;

  return (
    // 👇 [수정] 네비게이션 배경: surface, 하단 보더: outline (투명도 조절)
    <nav className="bg-surface shadow-md relative z-10 border-b border-transparent dark:border-outline/20 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          {/* 왼쪽: 로고 */}
          <div className="flex-shrink-0">
            <Link
              to="/"
              // 👇 [수정] 텍스트: on-surface
              className="flex items-center font-bold text-xl hover:no-underline text-on-surface"
            >
              <img
                src="../src/assets/careerFolio_logo.png"
                alt="로고"
                className="w-36"
              />
            </Link>
          </div>

          {/* 중앙: 메인 메뉴 */}
          <div className="hidden ml-6 sm:ml-6 sm:flex flex-1 justify-center sm:space-x-8">
            <div className="flex space-x-4">
              <NavLink to="/courses" className={getNavLinkClass}>
                <AcademicCapIcon className="h-5 w-5" />
                <span>전체 강좌</span>
              </NavLink>

              <NavLink to="/qna" className={getNavLinkClass}>
                <QuestionMarkCircleIcon className="h-5 w-5" />
                <span>지식IN</span>
              </NavLink>

              <NavLink to="/my-resume" className={getNavLinkClass}>
                <DocumentTextIcon className="h-5 w-5" />
                <span>이력서</span>
              </NavLink>

              {user?.role === "admin" && (
                <NavLink to="/admin/dashboard" className={getNavLinkClass}>
                  <WrenchScrewdriverIcon className="w-5 h-5"></WrenchScrewdriverIcon>
                  <span>관리자</span>
                </NavLink>
              )}
            </div>
          </div>

          {/* 오른쪽: 로그인/로그아웃, 장바구니 등 */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {/* 테마 토글 버튼 */}
            <button
              onClick={toggleTheme}
              // 👇 [수정] 아이콘 색상: on-surface-variant, Hover: surface-container
              className="p-1 rounded-full text-on-surface-variant hover:text-on-surface focus:outline-none hover:bg-surface-container transition-colors mr-2"
              aria-label="테마 변경"
            >
              {theme === "dark" ? (
                <SunIcon className="h-6 w-6 text-yellow-500" />
              ) : (
                <MoonIcon className="h-6 w-6 text-on-surface-variant" />
              )}
            </button>

            {user ? (
              <>
                {/* 장바구니 아이콘 */}
                <Link
                  to="/cart"
                  // 👇 [수정] 아이콘: on-surface-variant -> Hover: primary
                  className="p-1 rounded-full text-on-surface-variant hover:text-primary focus:outline-none focus:ring-2 focus:ring-offset-2 mr-4 transition-colors"
                >
                  <ShoppingCartIcon className="h-6 w-6" />
                </Link>

                {/* 알림 벨 아이콘 */}
                <div className="relative" ref={notiRef}>
                  <button
                    onClick={() => setIsNotiOpen(!isNotiOpen)}
                    // 👇 [수정] 아이콘: on-surface-variant -> Hover: primary
                    className="p-1 rounded-full text-on-surface-variant hover:text-primary focus:outline-none focus:ring-2 focus:ring-offset-2 mr-4 relative transition-colors"
                  >
                    {unreadCount > 0 ? (
                      <BellIconSolid className="h-6 w-6 text-yellow-500" />
                    ) : (
                      <BellIcon className="h-6 w-6" />
                    )}

                    {/* 읽지 않은 알림 뱃지 */}
                    {unreadCount > 0 && (
                      // 👇 [수정] 뱃지: bg-error, text-on-error
                      <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-error ring-2 ring-surface text-[10px] font-bold text-on-error text-center leading-4">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* 알림 드롭다운 */}
                  {isNotiOpen && (
                    // 👇 [수정] 드롭다운 배경: surface, 보더: outline
                    <div className="absolute right-0 mt-2 w-80 origin-top-right bg-surface rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 overflow-hidden border border-outline/20">
                      {/* 헤더 */}
                      <div className="px-4 py-2 border-b border-outline/20 flex justify-between items-center bg-surface-container">
                        <span className="text-sm font-semibold text-on-surface">
                          알림
                        </span>
                        {unreadCount > 0 && (
                          <button
                            onClick={() => readAllMutation.mutate()}
                            // 👇 [수정] 텍스트: primary
                            className="text-xs text-primary hover:underline"
                          >
                            모두 읽음
                          </button>
                        )}
                      </div>

                      {/* 리스트 */}
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map((noti) => (
                            <div
                              key={noti.idx}
                              onClick={() => handleNotificationClick(noti)}
                              // 👇 [수정] 읽지 않음: secondary-container, 읽음: surface
                              className={`px-4 py-3 border-b border-outline/10 last:border-0 cursor-pointer hover:bg-surface-container transition ${
                                !noti.is_read
                                  ? "bg-secondary-container"
                                  : "bg-surface"
                              }`}
                            >
                              <p className="text-sm text-on-surface line-clamp-2">
                                {noti.message}
                              </p>
                              <span className="text-xs text-on-surface-variant mt-1 block">
                                {new Date(noti.created_at).toLocaleString()}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="p-6 text-center text-on-surface-variant text-sm">
                            새로운 알림이 없습니다.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 프로필 드롭다운 */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    // 👇 [수정] 보더: 호버 시 primary
                    className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden border-2 border-transparent hover:border-primary transition focus:outline-none"
                  >
                    {profile?.picture_url ? (
                      <img
                        src={`${API_BASE_URL}/${profile.picture_url}`}
                        alt="프로필"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserCircleIcon className="w-8 h-8 text-on-surface-variant" />
                    )}
                  </button>

                  {/* 드롭다운 메뉴 리스트 */}
                  {isDropdownOpen && (
                    // 👇 [수정] 배경: surface
                    <div
                      className="absolute right-0 mt-2 w-56 origin-top-right bg-surface rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 border border-outline/20"
                      role="menu"
                    >
                      <div className="py-1" role="none">
                        <div className="px-4 py-3 border-b border-outline/20">
                          <p className="text-sm text-on-surface-variant">
                            로그인 계정
                          </p>
                          <p className="text-sm font-medium text-on-surface truncate">
                            {user.nickname}
                          </p>
                        </div>

                        {/* 메뉴 아이템: text-on-surface, hover:bg-surface-container */}
                        <Link
                          to={`/profile/${user.id}`}
                          onClick={() => setIsDropdownOpen(false)}
                          className="block px-4 py-2 text-sm text-on-surface hover:bg-surface-container no-underline hover:no-underline"
                          role="menuitem"
                        >
                          내 프로필
                        </Link>
                        <Link
                          to="/my-courses"
                          onClick={() => setIsDropdownOpen(false)}
                          className="block px-4 py-2 text-sm text-on-surface hover:bg-surface-container no-underline hover:no-underline"
                          role="menuitem"
                        >
                          나의 학습
                        </Link>
                        <Link
                          to="/instructor/dashboard"
                          onClick={() => setIsDropdownOpen(false)}
                          className="block px-4 py-2 text-sm text-on-surface hover:bg-surface-container no-underline hover:no-underline"
                          role="menuitem"
                        >
                          강좌 관리
                        </Link>
                        <Link
                          to="/my-profile"
                          onClick={() => setIsDropdownOpen(false)}
                          className="block px-4 py-2 text-sm text-on-surface hover:bg-surface-container no-underline hover:no-underline border-t border-outline/20"
                          role="menuitem"
                        >
                          계정 설정
                        </Link>

                        <button
                          onClick={handleLogout}
                          // 👇 [수정] 로그아웃: text-error
                          className="w-full text-left block px-4 py-2 text-sm text-error hover:bg-surface-container"
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
              // 로그아웃 상태
              <div className="flex space-x-4">
                <Link
                  to="/login"
                  // 👇 [수정] 로그인 버튼: bg-surface-container, text-on-surface
                  className="px-3 py-1 border border-transparent text-sm font-medium rounded-md text-on-surface bg-surface-container hover:bg-surface-container/80 no-underline hover:no-underline"
                >
                  로그인
                </Link>
                <Link
                  to="/signup"
                  // 👇 [수정] 회원가입 버튼: bg-primary, text-on-primary
                  className="px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white dark:text-black bg-primary hover:bg-primary/90"
                >
                  회원가입
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
