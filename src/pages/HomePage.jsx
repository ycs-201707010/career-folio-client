import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import ActivityGraph from "../components/ActivityGraph"; // (잔디 컴포넌트 재사용)
import {
  AcademicCapIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  RocketLaunchIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// --- API 함수: 내 활동(잔디) 데이터 가져오기 ---
const fetchMyActivity = async (userId) => {
  const { data } = await axios.get(
    `${API_BASE_URL}/api/profile/${userId}/activity`
  );
  return data;
};

// --------------------------------------------------
// 1. 비로그인용: 랜딩 페이지 (Landing View)
// --------------------------------------------------
const LandingView = () => (
  <div className="bg-white">
    {/* Hero Section */}
    <div className="relative isolate px-6 pt-14 lg:px-8">
      <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          당신의 커리어를 증명하는 <br />
          <span className="text-blue-600">가장 완벽한 방법</span>
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600">
          CareerFolio는 단순한 이력서가 아닙니다. <br />
          학습, 질문, 프로젝트, 그리고 성장의 모든 순간을 기록하세요.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link
            to="/signup"
            className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            무료로 시작하기
          </Link>
          <Link
            to="/courses"
            className="text-sm font-semibold leading-6 text-gray-900"
          >
            강좌 둘러보기 <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </div>

    {/* Feature Section */}
    <div className="bg-gray-50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-blue-600">
            All-in-One Platform
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            성장에 필요한 모든 도구
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-3 lg:gap-y-16">
            <div className="relative pl-16">
              <dt className="text-base font-semibold leading-7 text-gray-900">
                <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                  <DocumentTextIcon
                    className="h-6 w-6 text-white"
                    aria-hidden="true"
                  />
                </div>
                이력서 & 포트폴리오
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                마크다운 지원, PDF 내보내기, 다양한 템플릿으로 나만의 전문적인
                프로필을 만드세요.
              </dd>
            </div>
            <div className="relative pl-16">
              <dt className="text-base font-semibold leading-7 text-gray-900">
                <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                  <AcademicCapIcon
                    className="h-6 w-6 text-white"
                    aria-hidden="true"
                  />
                </div>
                실전형 강좌
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                검증된 강사진의 IT/기술 강좌를 수강하고 실력을 키우세요.
                수료증도 발급됩니다.
              </dd>
            </div>
            <div className="relative pl-16">
              <dt className="text-base font-semibold leading-7 text-gray-900">
                <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                  <ChatBubbleLeftRightIcon
                    className="h-6 w-6 text-white"
                    aria-hidden="true"
                  />
                </div>
                지식IN 커뮤니티
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                모르는 게 있다면 질문하세요. AI 멘토와 동료 개발자들이 답변해
                드립니다.
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  </div>
);

// --------------------------------------------------
// 2. 로그인용: 대시보드 (Dashboard View)
// --------------------------------------------------
const DashboardView = ({ user }) => {
  // 내 활동 데이터 (잔디) 조회
  const { data: activityData, isLoading } = useQuery({
    queryKey: ["userActivity", user.id], // user.id 사용 (Turn 83에서 추가한 로그인 ID)
    queryFn: () => fetchMyActivity(user.id),
    enabled: !!user.id,
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* 1. 환영 메시지 & 퀵 메뉴 */}
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              반가워요,{" "}
              <span className="text-blue-600">
                {user.nickname || user.name}
              </span>
              님! 👋
            </h1>
            <p className="text-gray-500 mt-2">
              오늘도 목표를 향해 한 걸음 더 나아가 볼까요?
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/qna"
              className="flex items-center gap-2 px-5 py-3 bg-blue-50 text-blue-700 rounded-lg font-semibold hover:bg-blue-100 transition"
            >
              <ChatBubbleLeftRightIcon className="w-5 h-5" /> 질문하기
            </Link>
            <Link
              to="/my-resume"
              className="flex items-center gap-2 px-5 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition"
            >
              <DocumentTextIcon className="w-5 h-5" /> 이력서 관리
            </Link>
          </div>
        </div>

        {/* 2. 내 활동 현황 (잔디) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 왼쪽: 잔디 그래프 (2/3 차지) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <RocketLaunchIcon className="w-5 h-5 text-green-500" />
                최근 활동 기록
              </h2>
              {isLoading ? (
                <div className="h-32 flex items-center justify-center text-gray-400">
                  데이터 로딩 중...
                </div>
              ) : (
                <ActivityGraph activityData={activityData} />
              )}
            </div>

            {/* (추가 가능: 최근 수강 중인 강좌 목록 등) */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
              <h3 className="text-xl font-bold mb-2">
                학습 열정을 불태우세요! 🔥
              </h3>
              <p className="opacity-90 mb-4">
                새로운 기술을 배우고 커리어를 업그레이드할 시간입니다.
              </p>
              <Link
                to="/courses"
                className="inline-flex items-center gap-2 bg-white text-indigo-600 px-4 py-2 rounded-lg font-bold hover:bg-gray-100 transition"
              >
                추천 강좌 보러가기 <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* 오른쪽: 바로가기 및 알림 요약 (1/3 차지) */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4">바로가기</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li>
                  <Link
                    to={`/profile/${user.id}`}
                    className="flex items-center justify-between hover:text-blue-600 group"
                  >
                    <span>내 공개 프로필</span>
                    <ArrowRightIcon className="w-4 h-4 text-gray-300 group-hover:text-blue-500" />
                  </Link>
                </li>
                <li className="border-t pt-3">
                  <Link
                    to="/my-courses"
                    className="flex items-center justify-between hover:text-blue-600 group"
                  >
                    <span>내 강의실</span>
                    <ArrowRightIcon className="w-4 h-4 text-gray-300 group-hover:text-blue-500" />
                  </Link>
                </li>
                {user.role === "admin" && (
                  <li className="border-t pt-3">
                    <Link
                      to="/admin/dashboard"
                      className="flex items-center justify-between text-purple-600 font-bold hover:text-purple-800 group"
                    >
                      <span>관리자 대시보드</span>
                      <ArrowRightIcon className="w-4 h-4" />
                    </Link>
                  </li>
                )}
              </ul>
            </div>

            {/* (공지사항 등 추가 가능) */}
          </div>
        </div>
      </div>
    </div>
  );
};

// --------------------------------------------------
// 메인 페이지 컴포넌트
// --------------------------------------------------
function HomePage() {
  const { user } = useAuth(); // 로그인 여부 확인

  // user가 있으면 DashboardView, 없으면 LandingView 렌더링
  return user ? <DashboardView user={user} /> : <LandingView />;
}

export default HomePage;
