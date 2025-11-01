// ** 이력서 실시간 빌더 페이지 **
// src/pages/ResumeBuildPage.jsx
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useDebounce } from "../hooks/useDebounce"; // 3초 지연 훅
import { UserCircleIcon } from "@heroicons/react/24/outline";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// --- API 함수들 ---
const fetchMyProfile = async (token) => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const { data } = await axios.get(`${API_BASE_URL}/api/profile/me`, config);
  return data;
};

// 1. "벌크 업데이트" API 호출 함수
const bulkUpdateResume = async ({ resumeData, token }) => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const { data } = await axios.put(
    `${API_BASE_URL}/api/resume/bulk-update`,
    resumeData,
    config
  );
  return data;
};

// ----------------------------------------
// --- 2. 왼쪽: 에디터 컴포넌트들 ---
// ----------------------------------------
// (간결함을 위해 ExperienceEditor만 예시로 작성)

// 폼 인풋 스타일
const inputStyle = "w-full p-2 border rounded text-sm";
const labelStyle = "text-sm font-medium text-gray-600 mb-1 block";

// 폼 섹션 래퍼
const FormSection = ({ title, children }) => (
  <div className="space-y-4 p-4 border rounded-md shadow-sm bg-white">
    <h3 className="font-semibold text-lg">{title}</h3>
    {children}
  </div>
);

// 폼 아이템 (추가/삭제 기능이 있는)
const FormItem = ({ children, onDelete }) => (
  <div className="p-3 border rounded-md space-y-3 bg-gray-50 relative">
    {children}
    <button
      onClick={onDelete}
      className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-xs font-medium"
    >
      삭제
    </button>
  </div>
);

// 제네릭 핸들러 (중복 제거)
const createChangeHandler = (key, index, setDraftData) => (e) => {
  const { name, value } = e.target;
  setDraftData((prev) => {
    const updatedItems = [...prev[key]];
    updatedItems[index] = { ...updatedItems[index], [name]: value };
    return { ...prev, [key]: updatedItems };
  });
};

const createDeleteHandler = (key, index, setDraftData) => () => {
  setDraftData((prev) => ({
    ...prev,
    [key]: prev[key].filter((_, i) => i !== index),
  }));
};

const createAddHandler = (key, newItem, setDraftData) => () => {
  setDraftData((prev) => ({
    ...prev,
    [key]: [...prev[key], { ...newItem, temp_id: Date.now() }],
  }));
};

// 1. 개인정보 에디터
const ProfileInfoEditor = ({ draftData, setDraftData }) => {
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setDraftData((prev) => ({
      ...prev,
      profile: { ...prev.profile, [name]: value },
    }));
  };

  // TODO: 사진 업로드는 별도 핸들러 필요 (ProfileEdit.jsx 참조)

  return (
    <FormSection title="기본 정보">
      <div className="flex items-center gap-4">
        {draftData.profile.picture_url ? (
          <img
            src={`${API_BASE_URL}/${draftData.profile.picture_url}`}
            alt="프로필"
            className="w-20 h-20 object-cover rounded-full"
          />
        ) : (
          <UserCircleIcon className="w-20 h-20 text-gray-400" />
        )}
        <button className="text-sm text-blue-600 font-medium hover:underline">
          사진 변경 (미구현)
        </button>
      </div>
      <div>
        <label className={labelStyle}>이름 (수정불가)</label>
        <input
          type="text"
          value={draftData.profile.username || ""}
          disabled
          className={`${inputStyle} bg-gray-100`}
        />
      </div>
      <div>
        <label className={labelStyle}>닉네임</label>
        <input
          type="text"
          name="nickname"
          value={draftData.profile.nickname || ""}
          onChange={handleProfileChange}
          className={inputStyle}
        />
      </div>
      <div>
        <label className={labelStyle}>한 줄 소개</label>
        <input
          type="text"
          name="bio"
          value={draftData.profile.bio || ""}
          onChange={handleProfileChange}
          className={inputStyle}
        />
      </div>
      <div>
        <label className={labelStyle}>공개 이메일</label>
        <input
          type="email"
          name="email"
          value={draftData.profile.email || ""}
          onChange={handleProfileChange}
          className={inputStyle}
        />
      </div>
      <div>
        <label className={labelStyle}>연락처</label>
        <input
          type="tel"
          name="phone"
          value={draftData.profile.phone || ""}
          onChange={handleProfileChange}
          className={inputStyle}
        />
      </div>
      <div>
        <label className={labelStyle}>주소</label>
        <input
          type="text"
          name="address"
          value={draftData.profile.address || ""}
          onChange={handleProfileChange}
          className={inputStyle}
        />
      </div>
    </FormSection>
  );
};

// 2. 경력 에디터
const ExperienceEditor = ({ draftData, setDraftData }) => (
  <FormSection title="경력">
    {draftData.experiences.map((exp, index) => (
      <FormItem
        key={exp.idx || exp.temp_id}
        onDelete={createDeleteHandler("experiences", index, setDraftData)}
      >
        <input
          type="text"
          name="company_name"
          value={exp.company_name}
          onChange={createChangeHandler("experiences", index, setDraftData)}
          placeholder="회사명"
          className={inputStyle}
        />
        <input
          type="text"
          name="position"
          value={exp.position}
          onChange={createChangeHandler("experiences", index, setDraftData)}
          placeholder="직책"
          className={inputStyle}
        />
        <div className="flex gap-4">
          <input
            type="date"
            name="start_date"
            value={exp.start_date?.split("T")[0] || ""}
            onChange={createChangeHandler("experiences", index, setDraftData)}
            className={inputStyle}
          />
          <input
            type="date"
            name="end_date"
            value={exp.end_date?.split("T")[0] || ""}
            onChange={createChangeHandler("experiences", index, setDraftData)}
            className={inputStyle}
          />
        </div>
        <textarea
          name="description"
          value={exp.description}
          onChange={createChangeHandler("experiences", index, setDraftData)}
          placeholder="주요 업무"
          rows="3"
          className={inputStyle}
        />
      </FormItem>
    ))}
    <button
      onClick={createAddHandler(
        "experiences",
        {
          company_name: "",
          position: "",
          start_date: "",
          end_date: "",
          description: "",
        },
        setDraftData
      )}
      className="text-blue-600 text-sm font-medium"
    >
      + 경력 추가
    </button>
  </FormSection>
);

// 3. 학력 에디터
const EducationEditor = ({ draftData, setDraftData }) => (
  <FormSection title="학력">
    {draftData.educations.map((edu, index) => (
      <FormItem
        key={edu.idx || edu.temp_id}
        onDelete={createDeleteHandler("educations", index, setDraftData)}
      >
        <input
          type="text"
          name="institution_name"
          value={edu.institution_name}
          onChange={createChangeHandler("educations", index, setDraftData)}
          placeholder="학교명"
          className={inputStyle}
        />
        <input
          type="text"
          name="major"
          value={edu.major}
          onChange={createChangeHandler("educations", index, setDraftData)}
          placeholder="전공"
          className={inputStyle}
        />
        <input
          type="text"
          name="degree"
          value={edu.degree}
          onChange={createChangeHandler("educations", index, setDraftData)}
          placeholder="학위 (예: 학사)"
          className={inputStyle}
        />
        <div className="flex gap-4">
          <input
            type="date"
            name="start_date"
            value={edu.start_date?.split("T")[0] || ""}
            onChange={createChangeHandler("educations", index, setDraftData)}
            className={inputStyle}
          />
          <input
            type="date"
            name="end_date"
            value={edu.end_date?.split("T")[0] || ""}
            onChange={createChangeHandler("educations", index, setDraftData)}
            className={inputStyle}
          />
        </div>
      </FormItem>
    ))}
    <button
      onClick={createAddHandler(
        "educations",
        {
          institution_name: "",
          major: "",
          degree: "",
          start_date: "",
          end_date: "",
        },
        setDraftData
      )}
      className="text-blue-600 text-sm font-medium"
    >
      + 학력 추가
    </button>
  </FormSection>
);

// 4. 프로젝트 에디터
const ProjectEditor = ({ draftData, setDraftData }) => (
  <FormSection title="프로젝트">
    {draftData.projects.map((proj, index) => (
      <FormItem
        key={proj.idx || proj.temp_id}
        onDelete={createDeleteHandler("projects", index, setDraftData)}
      >
        <input
          type="text"
          name="project_name"
          value={proj.project_name}
          onChange={createChangeHandler("projects", index, setDraftData)}
          placeholder="프로젝트명"
          className={inputStyle}
        />
        <input
          type="text"
          name="project_url"
          value={proj.project_url}
          onChange={createChangeHandler("projects", index, setDraftData)}
          placeholder="프로젝트 URL (GitHub 등)"
          className={inputStyle}
        />
        <div className="flex gap-4">
          <input
            type="date"
            name="start_date"
            value={proj.start_date?.split("T")[0] || ""}
            onChange={createChangeHandler("projects", index, setDraftData)}
            className={inputStyle}
          />
          <input
            type="date"
            name="end_date"
            value={proj.end_date?.split("T")[0] || ""}
            onChange={createChangeHandler("projects", index, setDraftData)}
            className={inputStyle}
          />
        </div>
        <textarea
          name="description"
          value={proj.description}
          onChange={createChangeHandler("projects", index, setDraftData)}
          placeholder="프로젝트 설명"
          rows="3"
          className={inputStyle}
        />
      </FormItem>
    ))}
    <button
      onClick={createAddHandler(
        "projects",
        {
          project_name: "",
          description: "",
          start_date: "",
          end_date: "",
          project_url: "",
        },
        setDraftData
      )}
      className="text-blue-600 text-sm font-medium"
    >
      + 프로젝트 추가
    </button>
  </FormSection>
);

// 5. 스킬 에디터
const SkillEditor = ({ draftData, setDraftData }) => {
  const [newSkill, setNewSkill] = useState("");

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    createAddHandler(
      "skills",
      { skill_name: newSkill, category: "" },
      setDraftData
    )();
    setNewSkill("");
  };

  return (
    <FormSection title="보유 기술">
      <div className="flex gap-2">
        <input
          type="text"
          value={newSkill}
          onChange={(e) => setNewSkill(e.target.value)}
          placeholder="예: React, Node.js"
          className={inputStyle}
        />
        <button
          onClick={handleAddSkill}
          className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-700"
        >
          추가
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {draftData.skills.map((skill, index) => (
          <div
            key={skill.idx || skill.temp_id}
            className="flex items-center gap-2 bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full"
          >
            <span>{skill.skill_name}</span>
            <button
              onClick={createDeleteHandler("skills", index, setDraftData)}
              className="text-blue-500 hover:text-blue-800 font-bold"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </FormSection>
  );
};

// ----------------------------------------
// --- 3. 오른쪽: 미리보기 컴포넌트 ---
// ----------------------------------------
const ResumePreview = ({ draftData }) => {
  const debouncedData = useDebounce(draftData, 1000); // 1초 지연

  if (!debouncedData)
    return (
      <div
        className="p-8 bg-white shadow-lg h-full"
        style={{ aspectRatio: "210/297" }}
      ></div>
    );

  const { profile, experiences, educations, projects, skills } = debouncedData;
  const formatDate = (dateStr) => (dateStr ? dateStr.split("T")[0] : "");

  return (
    <div
      className="p-8 md:p-12 bg-white shadow-lg h-full overflow-y-auto"
      style={{ width: "21cm", minHeight: "29.7cm" }}
    >
      {/* A4 비율 유지를 위해 width/minHeight 설정 */}

      {/* 헤더: 이름, 사진, 연락처 */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-800">
            {profile.username}
          </h1>
          <h2 className="text-xl font-light text-blue-600">
            {profile.nickname}
          </h2>
          <p className="text-sm text-gray-600 mt-2">{profile.bio}</p>
        </div>
        {profile.picture_url && (
          <img
            src={`${API_BASE_URL}/${profile.picture_url}`}
            alt="증명사진"
            className="w-28 h-36 object-cover rounded-md border-2 border-gray-100"
          />
        )}
      </header>

      {/* 연락처 */}
      <section className="mb-8 border-t pt-4">
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-700">
          {profile.email && <span>📧 {profile.email}</span>}
          {profile.phone && <span>📞 {profile.phone}</span>}
          {profile.address && <span>📍 {profile.address}</span>}
        </div>
      </section>

      {/* 경력 */}
      {experiences.length > 0 && (
        <ResumeSection title="경력 (Experiences)">
          {experiences.map((exp) => (
            <div key={exp.idx || exp.temp_id} className="mb-4">
              <h4 className="text-lg font-semibold">
                {exp.position}{" "}
                <span className="text-base font-normal text-gray-600">
                  at {exp.company_name}
                </span>
              </h4>
              <p className="text-sm text-gray-500">
                {formatDate(exp.start_date)} ~{" "}
                {formatDate(exp.end_date) || "현재"}
              </p>
              <p className="text-sm mt-1 whitespace-pre-wrap">
                {exp.description}
              </p>
            </div>
          ))}
        </ResumeSection>
      )}

      {/* 학력 */}
      {educations.length > 0 && (
        <ResumeSection title="학력 (Education)">
          {educations.map((edu) => (
            <div key={edu.idx || edu.temp_id} className="mb-3">
              <h4 className="text-lg font-semibold">{edu.institution_name}</h4>
              <p className="text-sm text-gray-600">
                {edu.degree} - {edu.major}
              </p>
              <p className="text-sm text-gray-500">
                {formatDate(edu.start_date)} ~{" "}
                {formatDate(edu.end_date) || "졸업"}
              </p>
            </div>
          ))}
        </ResumeSection>
      )}

      {/* 프로젝트 */}
      {projects.length > 0 && (
        <ResumeSection title="프로젝트 (Projects)">
          {projects.map((proj) => (
            <div key={proj.idx || proj.temp_id} className="mb-4">
              <h4 className="text-lg font-semibold">{proj.project_name}</h4>
              <p className="text-sm text-gray-500">
                {formatDate(proj.start_date)} ~{" "}
                {formatDate(proj.end_date) || "진행 중"}
              </p>
              {proj.project_url && (
                <a
                  href={proj.project_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-500 hover:underline"
                >
                  {proj.project_url}
                </a>
              )}
              <p className="text-sm mt-1 whitespace-pre-wrap">
                {proj.description}
              </p>
            </div>
          ))}
        </ResumeSection>
      )}

      {/* 보유 기술 */}
      {skills.length > 0 && (
        <ResumeSection title="보유 기술 (Skills)">
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={skill.idx || skill.temp_id}
                className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full"
              >
                {skill.skill_name}
              </span>
            ))}
          </div>
        </ResumeSection>
      )}
    </div>
  );
};

// 미리보기 섹션 래퍼
const ResumeSection = ({ title, children }) => (
  <section className="mb-8">
    <h3 className="text-2xl font-bold text-gray-800 border-b-2 border-gray-300 pb-1 mb-3">
      {title}
    </h3>
    {children}
  </section>
);

// ----------------------------------------
// --- 4. 메인 페이지 컴포넌트 ---
// ----------------------------------------
function ResumeBuildPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  // 4-1. DB에서 최초 데이터 1회 로드
  const { data: initialData, isLoading } = useQuery({
    queryKey: ["myProfile"],
    queryFn: () => fetchMyProfile(token),
    enabled: !!token,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5분간 캐시 유지
  });

  // 4-2. "드래프트(임시) 상태" 관리
  const [draftData, setDraftData] = useState(null);

  // 4-3. 최초 로드 완료 시, DB 데이터를 드래프트 상태로 복사
  useEffect(() => {
    if (initialData) {
      setDraftData(initialData);
    }
  }, [initialData]);

  // 4-4. "최종 저장"을 위한 Mutation
  const saveMutation = useMutation({
    mutationFn: bulkUpdateResume,
    onSuccess: (updatedData) => {
      // 저장이 성공하면, 서버가 돌려준 최신 데이터로 캐시를 덮어씀
      queryClient.setQueryData(["myProfile"], updatedData);
      setDraftData(updatedData); // 👈 저장 후 드래프트 상태도 최신화
      alert("이력서가 성공적으로 저장되었습니다.");
    },
    onError: (err) => {
      alert(err.response?.data?.message || "저장 중 오류가 발생했습니다.");
    },
  });

  const handleFinalSave = () => {
    saveMutation.mutate({ resumeData: draftData, token });
  };

  if (isLoading || !draftData) {
    return <div className="text-center p-10">이력서 빌더를 불러오는 중...</div>;
  }

  return (
    <div className="flex" style={{ height: "calc(100vh - 64px)" }}>
      {/* 1. 왼쪽: 에디터 영역 */}
      <div className="w-1/2 p-6 bg-gray-50 overflow-y-auto space-y-8">
        <h2 className="text-2xl font-bold">이력서 작성</h2>
        <ProfileInfoEditor draftData={draftData} setDraftData={setDraftData} />
        <ExperienceEditor draftData={draftData} setDraftData={setDraftData} />
        <EducationEditor draftData={draftData} setDraftData={setDraftData} />
        <ProjectEditor draftData={draftData} setDraftData={setDraftData} />
        <SkillEditor draftData={draftData} setDraftData={setDraftData} />
      </div>

      {/* 2. 오른쪽: 미리보기 영역 */}
      <div className="w-1/2 p-6 bg-gray-200 overflow-y-auto flex justify-center">
        <ResumePreview draftData={draftData} />
      </div>

      {/* 3. 하단 저장 버튼 바 */}
      <div className="fixed bottom-0 left-0 w-full bg-white shadow-lg p-4 border-t flex justify-end z-20">
        <button
          onClick={handleFinalSave}
          disabled={saveMutation.isPending}
          className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {saveMutation.isPending ? "저장 중..." : "이력서 최종 저장"}
        </button>
      </div>
    </div>
  );
}

export default ResumeBuildPage;
