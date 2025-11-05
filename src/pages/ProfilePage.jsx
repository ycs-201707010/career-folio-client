import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../context/AuthContext"; // 👈 1. 현재 로그인한 유저 정보

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// 2. 새 API 호출 함수
const fetchPublicProfile = async (id) => {
  const { data } = await axios.get(`${API_BASE_URL}/api/profile/${id}`);
  return data;
};

// 3. GitHub 스타일 레이아웃 (제안)
const ProfileLayout = ({ profileData }) => {
  const { profile, experiences, educations, projects, skills } = profileData;

  // 👇 뱃지 시스템이 연동될 완벽한 위치
  const badges = []; // TODO: API에서 뱃지 정보도 가져와야 함

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 flex gap-8">
      {/* 3-1. 왼쪽 사이드바 (프로필 카드) */}
      <aside className="w-1/3 space-y-4">
        {profile.resume_photo_url ? (
          <img
            src={`${API_BASE_URL}/${profile.resume_photo_url}`}
            alt="프로필 사진"
            className="w-full rounded-full border-4 border-gray-200"
          />
        ) : (
          <div className="w-full pt-[100%] bg-gray-200 rounded-full" /> // 1:1 비율
        )}
        <h1 className="text-3xl font-bold">{profile.username}</h1>
        <p className="text-xl text-gray-600">{profile.nickname}</p>
        <p className="text-sm">{profile.bio}</p>

        <hr />

        {/* 연락처 정보 (공개용) */}
        <div className="space-y-1 text-sm text-gray-700">
          {profile.email && <p>📧 {profile.email}</p>}
          {profile.phone && <p>📞 {profile.phone}</p>}
          {profile.address && <p>📍 {profile.address}</p>}
        </div>

        {/* 뱃지 전시 공간 */}
        <div className="space-y-2">
          <h3 className="font-semibold">뱃지</h3>
          <div className="flex flex-wrap gap-2">
            {badges.length > 0 ? (
              badges.map((badge) => (
                <img
                  key={badge.idx}
                  src={badge.image_url}
                  alt={badge.name}
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
      </aside>

      {/* 3-2. 오른쪽 메인 콘텐츠 (이력서 항목) */}
      <main className="w-2/3 space-y-8">
        <section>
          <h2 className="text-2xl font-semibold border-b pb-2 mb-4">
            자기소개
          </h2>
          <p className="text-sm whitespace-pre-wrap">
            {profile.introduction || "자기소개가 없습니다."}
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold border-b pb-2 mb-4">경력</h2>
          {experiences.length > 0 ? (
            experiences.map((exp) => (
              <div key={exp.idx}>... {exp.company_name} ...</div>
            ))
          ) : (
            <p>경력 정보가 없습니다.</p>
          )}
        </section>
        {/* ... (학력, 프로젝트, 스킬 섹션 동일하게 렌더링) ... */}
      </main>
    </div>
  );
};

// --- 메인 페이지 컴포넌트 ---
function ProfilePage() {
  // 4. URL 파라미터(/:id)에서 'id'를 가져옵니다. (예: 'king-gwangpil')
  const { id } = useParams();

  // 5. 현재 로그인한 사용자의 정보를 가져옵니다.
  //    (useAuth가 { ..., user: { id: 'my-id' } } 형태를 반환한다고 가정)
  const { user: currentUser } = useAuth();

  // 6. "내 프로필"인지 확인합니다.
  const isMyProfile = currentUser && currentUser.id === id;

  // 7. 'id'를 기반으로 프로필 데이터를 서버에 요청합니다.
  const { data, isLoading, isError } = useQuery({
    queryKey: ["publicProfile", id], // 쿼리 키에 'id'를 포함
    queryFn: () => fetchPublicProfile(id),
    staleTime: 1000 * 60 * 5, // 5분
  });

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
      {/* 8. [핵심] 내 프로필일 때만 "수정" 버튼을 렌더링합니다. */}
      {isMyProfile && (
        <div className="bg-gray-100 p-4 border-b">
          <div className="max-w-6xl mx-auto flex justify-end">
            <Link
              to="/resume-builder" // 이력서 수정 페이지로 이동
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700"
            >
              이력서 수정하기
            </Link>
          </div>
        </div>
      )}

      {/* 9. 프로필 레이아웃을 렌더링합니다. */}
      <ProfileLayout profileData={data} />
    </div>
  );
}

export default ProfilePage;
