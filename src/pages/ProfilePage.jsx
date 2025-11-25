import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { UserCircleIcon, Cog6ToothIcon } from "@heroicons/react/24/outline"; //  아이콘 추가
import ActivityGraph from "../components/ActivityGraph";
import MDEditor from "@uiw/react-md-editor"; // 마크다운 뷰어

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// API 호출 함수 (수정 없음)
const fetchPublicProfile = async (id) => {
  const { data } = await axios.get(`${API_BASE_URL}/api/profile/${id}`);
  return data;
};
/** 사용자 활동량 데이터 API 호출 */
const fetchUserActivity = async (id) => {
  const { data } = await axios.get(
    `${API_BASE_URL}/api/profile/${id}/activity`
  );
  return data; // { "2025-11-25": 5, ... }
};

// ----------------------------------------
// --- 프로필 레이아웃 컴포넌트 (수정됨) ---
// ----------------------------------------
const ProfileLayout = ({ profileData, isMyProfile, activityData }) => {
  // 👇 "경력"과 "기술"만 남깁니다.
  const { profile, experiences, skills } = profileData;

  // 👇 TODO: API에서 뱃지 정보도 가져와야 함
  const badges = []; // (일단 빈 배열로 둡니다)

  // 날짜 포맷팅 (경력 표시용)
  const formatDate = (dateStr) => (dateStr ? dateStr.split("T")[0] : "");

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 flex flex-col md:flex-row gap-8">
      {/* 1. 왼쪽 사이드바 (프로필 카드) */}
      <aside className="w-full md:w-1/3 space-y-4">
        {/* --- 👇 [수정됨] resume_photo_url -> picture_url --- */}
        {profile.picture_url ? (
          <img
            src={`${API_BASE_URL}/${profile.picture_url}`}
            alt="프로필 사진"
            className="w-full rounded-full border-4 border-gray-200 aspect-square object-cover" // 1:1 비율
          />
        ) : (
          <UserCircleIcon className="w-full text-gray-300" /> // 1:1 비율 기본 아이콘
        )}
        {/* --- [수정 완료] --- */}

        <h1 className="text-3xl font-bold">{profile.nickname}</h1>
        <p className="text-sm">{profile.bio}</p>

        <hr />

        {/* 뱃지 전시 공간 */}
        <div className="space-y-2">
          <h3 className="font-semibold">뱃지</h3>
          <div className="flex flex-wrap gap-2">
            {badges.length > 0 ? (
              badges.map((badge) => (
                <img
                  key={badge.idx}
                  src={badge.image_url} // (뱃지 이미지 경로)
                  alt={badge.badge_name}
                  className="w-12 h-12"
                  title={badge.description}
                />
              ))
            ) : (
              <p className="text-sm text-gray-500">
                아직 획득한 뱃지가 없습니다.
              </p>
            )}
          </div>
        </div>

        {/* --- 정보(이메일, 주소) --- */}
        {/* (필요 시 GitHub 프로필 링크, 개인 웹사이트 링크 등을 추가할 수 있습니다) */}
        <div className="space-y-1 text-sm text-gray-700">
          {profile.email && <p>📧 {profile.email}</p>}
        </div>

        {/* 2. isMyProfile이 true일 때만 버튼을 렌더링 (aside 내부) */}
        {isMyProfile && (
          <div className="space-y-2">
            <Link
              to="/my-profile" // (닉네임, 아바타, bio 수정 페이지)
              className="block w-full text-center px-4 py-2 bg-gray-600 text-white text-sm font-semibold rounded-md hover:bg-gray-700"
            >
              프로필 설정
            </Link>
            <Link
              to="/my-resume" // (이력서 빌더)
              className="block w-full text-center px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700"
            >
              이력서 수정하기
            </Link>
            <Link
              to="/portfolio-settings"
              className="block w-full text-center px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded-md hover:bg-gray-50"
            >
              <Cog6ToothIcon className="h-5 w-5 inline-block -mt-1 mr-1" />
              포트폴리오 설정
            </Link>
          </div>
        )}
      </aside>

      {/* 2. 오른쪽 메인 콘텐츠 */}
      <main className="w-full md:w-2/3 space-y-8">
        {/* --- README.md 뷰어 --- */}
        {profile.readme && (
          <section className="bg-white py-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="text-sm font-light mb-4 ml-4">README.md</div>
            <hr />

            {/* data-color-mode="light"로 라이트 모드 고정 (Tailwind와 충돌 방지) */}
            <div className="mt-4 mx-4" data-color-mode="light">
              <MDEditor.Markdown
                source={profile.readme}
                style={{ backgroundColor: "white", color: "#333" }}
              />
            </div>
          </section>
        )}

        {/* --- 활동량 잔디 UI --- */}
        <section>
          <h2 className="text-2xl font-semibold border-b pb-2 mb-4">
            Activity
          </h2>
          <ActivityGraph activityData={activityData} />
        </section>

        {/* 경력 섹션 */}
        <section>
          <h2 className="text-2xl font-semibold border-b pb-2 mb-4">
            경력 (Experiences)
          </h2>
          {experiences.length > 0 ? (
            <div className="space-y-4">
              {experiences.map((exp) => (
                <div key={exp.idx} className="border-b pb-2">
                  <h4 className="text-lg font-semibold">{exp.position}</h4>
                  <p className="text-md text-gray-700">{exp.company_name}</p>
                  <p className="text-sm text-gray-500">
                    {formatDate(exp.start_date)} ~{" "}
                    {formatDate(exp.end_date) || "현재"}
                  </p>
                  <p className="text-sm mt-1 whitespace-pre-wrap">
                    {exp.description}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">경력 정보가 없습니다.</p>
          )}
        </section>

        {/* --- 👇 [수정됨] "학력", "프로젝트" 섹션 삭제 --- */}

        {/* 보유 기술 섹션 */}
        <section>
          <h2 className="text-2xl font-semibold border-b pb-2 mb-4">
            보유 기술 (Skills)
          </h2>
          {skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill.idx || skill.temp_id}
                  className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full mr-2 mb-2"
                >
                  {skill.skill_name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">보유 기술 정보가 없습니다.</p>
          )}
        </section>
      </main>
    </div>
  );
};

// ----------------------------------------
// --- 메인 페이지 컴포넌트 (수정됨) ---
// ----------------------------------------
function ProfilePage() {
  const { id } = useParams(); // URL 파라미터 (예: 'king-gwangpil')
  const { user: currentUser } = useAuth(); // 로그인한 유저 (예: { userIdx: 2 })

  // 'id'를 기반으로 서버에 데이터 요청
  const { data, isLoading, isError } = useQuery({
    queryKey: ["publicProfile", id],
    queryFn: () => fetchPublicProfile(id),
    staleTime: 1000 * 60 * 5,
  });

  const { data: activityData } = useQuery({
    queryKey: ["userActivity", id],
    queryFn: () => fetchUserActivity(id),
    enabled: !!id, // id가 있을 때만 실행
  });

  // --- 👇 [핵심 수정] ---
  // "내 프로필"인지 확인하는 로직 변경
  // (로그인한 유저의 'userIdx'와 지금 보는 프로필의 'user_idx'를 비교)
  const isMyProfile =
    currentUser && data && currentUser.userIdx === data.profile.user_idx;

  if (isLoading)
    return <div className="p-10 text-center">프로필 로딩 중...</div>;
  if (isError)
    return (
      <div className="p-10 text-center text-red-500">
        프로필을 찾을 수 없습니다.
      </div>
    );

  return (
    <div>
      {/* 8. [수정됨] isMyProfile이 true일 때 "수정" 버튼 렌더링 */}

      {/* 9. 프로필 레이아웃 렌더링 */}
      <ProfileLayout
        profileData={data}
        isMyProfile={isMyProfile}
        activityData={activityData}
      />
    </div>
  );
}

export default ProfilePage;
