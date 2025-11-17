// ** 이력서 실시간 빌더 페이지 **
// src/pages/ResumeBuildPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useDebounce } from "../hooks/useDebounce"; // 3초 지연 훅
import { UserCircleIcon, Cog6ToothIcon } from "@heroicons/react/24/outline";
// 이력서 PDF 저장 시 사용할 라이브러리
// import jsPDF from "jspdf";
// import html2canvas from "html2canvas";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// --- API 함수들 ---
const fetchMyProfile = async (token) => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const { data } = await axios.get(`${API_BASE_URL}/api/resume/me`, config);
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

const uploadResumePhoto = async ({ formData, token }) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  };
  const { data } = await axios.put(
    `${API_BASE_URL}/api/profile/resume-photo`,
    formData,
    config
  );
  return data; // { resume_photo_url: "..." } 반환
};

// ----------------------------------------
// --- 2. 왼쪽: 에디터 컴포넌트들 ---
// ----------------------------------------

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
  const { token } = useAuth(); // 👈 3. token 가져오기

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setDraftData((prev) => ({
      ...prev,
      profile: { ...prev.profile, [name]: value },
    }));
  };

  // TODO: 사진 업로드는 별도 핸들러 필요 (ProfileEdit.jsx 참조)
  // 4. 파일 입력을 위한 ref 생성
  const photoInputRef = useRef(null);

  // 5. 사진 업로드 Mutation 생성
  const photoMutation = useMutation({
    mutationFn: uploadResumePhoto,
    onSuccess: (data) => {
      // 6. 성공 시, 서버가 반환한 새 URL로 draftData를 수동 업데이트
      setDraftData((prev) => ({
        ...prev,
        profile: { ...prev.profile, resume_photo_url: data.resume_photo_url },
      }));
      alert("증명사진이 변경되었습니다.");
    },
    onError: (err) => {
      alert(err.response?.data?.message || "사진 업로드 실패");
    },
  });

  // 7. "사진 변경" 버튼 클릭 핸들러
  const handlePhotoUploadClick = () => {
    photoInputRef.current.click(); // 숨겨진 input[type=file]을 클릭
  };

  // 8. 파일이 실제로 선택되었을 때 실행되는 핸들러
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append("resume_photo", file); // 👈 API에서 받을 이름("resume_photo")

      photoMutation.mutate({ formData, token });
    }
  };

  return (
    <FormSection title="기본 정보">
      <div className="flex items-center gap-4">
        {draftData.profile.resume_photo_url ? (
          <img
            src={`${API_BASE_URL}/${draftData.profile.resume_photo_url}`}
            alt="프로필"
            className="w-24 h-32 object-cover rounded-md border"
          />
        ) : (
          <div className="w-24 h-32 bg-gray-200 rounded-md flex items-center justify-center">
            <UserCircleIcon className="w-16 h-16 text-gray-400" />
          </div>
        )}
        <div>
          {/* 9. 숨겨진 파일 입력 필드 */}
          <input
            type="file"
            ref={photoInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/png, image/jpeg"
          />
          <button
            onClick={handlePhotoUploadClick} // 👈 핸들러 연결
            disabled={photoMutation.isPending}
            className="text-sm text-blue-600 font-medium hover:underline disabled:text-gray-400"
          >
            {photoMutation.isPending ? "업로드 중..." : "증명사진 변경"}
          </button>
        </div>
      </div>

      <div>
        <label className={labelStyle}>이력서 제목</label>
        <input
          type="text"
          name="resume_title"
          value={draftData.profile.resume_title || ""}
          onChange={handleProfileChange}
          placeholder="예: 열정적인 프론트엔드 개발자"
          className={inputStyle}
        />
      </div>

      <div>
        <label className={labelStyle}>이름 (수정 불가)</label>
        <input
          type="text"
          value={draftData.profile.username || ""}
          disabled
          className={`${inputStyle} bg-gray-100`}
        />
      </div>

      <div>
        <label className={labelStyle}>자기소개</label>
        <textarea
          name="introduction"
          value={draftData.profile.introduction || ""}
          onChange={handleProfileChange}
          placeholder="자신을 간략하게 소개해 주세요."
          rows="5"
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
      className="p-8 md:p-12 bg-white shadow-lg "
      style={{ width: "21cm", minHeight: "29.7cm" }}
    >
      {/* A4 비율 유지를 위해 width/minHeight 설정 */}

      {/* 헤더: 이름, 사진, 연락처 */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-3">
            {profile.resume_title}
          </h1>
          <h1 className="text-3xl font-bold text-gray-800">
            {profile.username}
          </h1>
          {/* <h2 className="text-xl font-light text-blue-600">
            {profile.nickname}
          </h2> */}

          <div className="mt-4 space-y-1 text-sm text-gray-600">
            {profile.email && <p>📧 {profile.email}</p>}
            {profile.phone && <p>📞 {profile.phone}</p>}
            {profile.address && <p>📍 {profile.address}</p>}
          </div>
        </div>
        {profile.picture_url && (
          <img
            src={`${API_BASE_URL}/${profile.resume_photo_url}`}
            alt="증명사진"
            className="w-28 h-36 object-cover rounded-md border-2 border-gray-100"
          />
        )}
      </header>

      {/* 자기소개 */}
      <section className="mb-8">
        <h3 className="text-2xl font-bold text-gray-800 border-b-2 border-gray-300 pb-1 mb-3">
          자기소개
        </h3>

        {profile.introduction && (
          <p className="text-sm whitespace-pre-wrap">{profile.introduction}</p>
        )}
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
    queryKey: ["myResumeData"],
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

  // PDF 로딩 상태
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  // PDF 저장 핸들러 함수
  const handleExportToPDF = () => {
    if (!draftData) return;

    setIsPdfLoading(true);
    console.log("[PDF] 서버에 PDF 생성 요청...");

    axios
      .post(
        `${API_BASE_URL}/api/resume/download-pdf`,
        { draftData: draftData }, // 현재 수정 중인 데이터를 서버로 전송
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob", // 👈 응답을 바이너리 파일(blob)로 받음
        }
      )
      .then((response) => {
        // 4. 성공 시, 브라우저에서 다운로드 실행
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;

        const username = draftData.profile.username || "user";
        const fileName = `[이력서] ${username}.pdf`;
        link.setAttribute("download", fileName); // 👈 동적 파일명 설정

        document.body.appendChild(link);
        link.click();

        // 5. 메모리 정리
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
        console.log("[PDF] PDF 다운로드 성공.");
      })
      .catch((error) => {
        console.error("PDF 다운로드 실패:", error);
        alert("PDF를 생성하는 데 실패했습니다.");
      })
      .finally(() => {
        setIsPdfLoading(false);
      });
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
      <div className="fixed bottom-0 left-0 w-full bg-white shadow-lg p-4 border-t flex justify-between items-center z-20 gap-4">
        {/* --- 👇 [신규] 포트폴리오 설정 버튼 (왼쪽) --- */}
        <Link
          to="/portfolio-settings"
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-md"
        >
          <Cog6ToothIcon className="h-5 w-5" />
          포트폴리오 설정
        </Link>

        <div className="flex gap-4">
          <button
            onClick={handleExportToPDF}
            disabled={isPdfLoading || saveMutation.isPending}
            className="px-6 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700"
          >
            {isPdfLoading ? "PDF 생성 중..." : "PDF로 저장"}
          </button>
          <button
            onClick={handleFinalSave}
            disabled={saveMutation.isPending}
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {saveMutation.isPending ? "저장 중..." : "이력서 최종 저장"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResumeBuildPage;
