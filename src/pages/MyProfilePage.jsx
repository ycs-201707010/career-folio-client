import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { UserCircleIcon } from "@heroicons/react/24/outline";

// 로컬 개발 시에는 로컬 서버 주소, 배포 시에는 배포된 서버 주소 사용
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// --- API 호출 함수들 ---
const fetchMyProfile = async (token) => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  console.log("[API] Fetching My Profile...");
  const { data } = await axios.get(`${API_BASE_URL}/api/profile/me`, config);
  console.log("[API] My Profile data received:", data);
  return data; // { profile: {...}, experiences: [...], educations: [...], etc. }
};

const updateProfile = async ({ formData, token }) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  };
  console.log("[API] Updating Profile...");
  const { data } = await axios.put(
    `${API_BASE_URL}/api/profile/me`,
    formData,
    config
  );
  console.log("[API] Profile update response:", data);
  return data;
};

const addExperience = async ({ experienceData, token }) => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  console.log("[API] Adding Experience:", experienceData);
  const { data } = await axios.post(
    `${API_BASE_URL}/api/profile/experiences`,
    experienceData,
    config
  );
  console.log("[API] Add Experience response:", data);
  return data;
};

const deleteExperience = async ({ expId, token }) => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  console.log(`[API] Deleting Experience with ID: ${expId}`);
  await axios.delete(
    `${API_BASE_URL}/api/profile/experiences/${expId}`,
    config
  );
  console.log("[API] Delete Experience successful.");
  return expId; // 삭제된 ID 반환
};

// TODO: 학력, 프로젝트, 스킬 추가/수정/삭제 API 함수 추가

// --- 컴포넌트들 ---

// 프로필 정보 수정 컴포넌트
const ProfileEdit = ({ profile, token, queryClient }) => {
  const [formData, setFormData] = useState({
    nickname: profile?.nickname || "",
    bio: profile?.bio || "",
  });
  const [pictureFile, setPictureFile] = useState(null);
  const [picturePreview, setPicturePreview] = useState(null);

  // profile 데이터가 로드되거나 변경되면 form 상태 초기화
  useEffect(() => {
    // profile이 존재하고, formData가 아직 null일 때만 초기화 (최초 로드 시)
    if (profile) {
      console.log("Initializing ProfileEdit form with:", profile);
      setFormData({
        nickname: profile.nickname || "",
        bio: profile.bio || "",
      });
      // 이미지 URL 조합 시 API_BASE_URL 사용 확인
      setPicturePreview(
        profile.picture_url ? `${API_BASE_URL}/${profile.picture_url}` : null
      );
      setPictureFile(null);
    }
  }, [profile]);

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updatedProfileData) => {
      console.log("Profile update mutation success:", updatedProfileData);
      // 캐시를 직접 업데이트하여 즉각적인 UI 반영 (선택적)
      queryClient.setQueryData(["myProfile"], (oldData) => ({
        ...oldData,
        profile: updatedProfileData, // 서버에서 반환된 최신 프로필 정보로 업데이트
      }));
      // queryClient.invalidateQueries({ queryKey: ['myProfile'] }); // 또는 그냥 무효화
      alert("프로필이 성공적으로 저장되었습니다.");
    },
    onError: (err) => {
      console.error("Profile update error:", err);
      alert(err.response?.data?.message || "프로필 저장에 실패했습니다.");
    },
  });

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPictureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPicturePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setPictureFile(null);
      setPicturePreview(
        profile.picture_url ? `${API_BASE_URL}/${profile.picture_url}` : null
      );
    }
  };

  const handleRemovePicture = () => {
    setPictureFile(null);
    setPicturePreview(null);
    // (★★추가★★) 폼 데이터에도 이미지 삭제 요청 플래그를 심어둡니다.
    // 이는 서버 요청 시 picture_url: "null"을 보내기 위한 상태 관리입니다.
    setFormData((prev) => ({ ...prev, picture_url: "null" }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitting profile form...");
    const data = new FormData();
    let hasChanges = false; // 변경 감지 플래그

    // 변경된 텍스트 필드만 FormData에 추가
    Object.keys(formData).forEach((key) => {
      if (formData[key] !== profile[key]) {
        data.append(key, formData[key] === null ? "" : formData[key]); // null은 빈 문자열로
        hasChanges = true;
        console.log(
          `Changed field [${key}]: ${profile[key]} -> ${formData[key]}`
        );
      }
    });

    // 이미지 변경/삭제 처리
    if (pictureFile) {
      data.append("picture", pictureFile);
      hasChanges = true;
      console.log("New picture file added.");
    } else if (picturePreview === null && profile.picture_url) {
      data.append("picture_url", "null"); // 이미지 삭제 요청
      hasChanges = true;
      console.log("Requesting picture deletion.");
    }

    if (hasChanges) {
      console.log("Sending FormData:", Object.fromEntries(data.entries()));
      mutation.mutate({ formData: data, token });
    } else {
      alert("변경된 내용이 없습니다.");
      console.log("No changes detected, skipping mutation.");
    }
  };

  if (!profile && formData === null) return <div>프로필 로딩 중...</div>; // 로딩 중 UI 개선

  return (
    <form onSubmit={handleSubmit} className="space-y-5 p-4 border rounded-md ">
      <h3 className="font-semibold text-lg">기본 프로필 수정</h3>
      <div>
        <label className="text-sm font-medium text-gray-600 block mb-1">
          프로필 사진
        </label>
        <div className="flex items-center gap-4">
          {picturePreview ? (
            <img
              src={picturePreview}
              alt="프로필"
              className="w-20 h-20 object-cover rounded-full"
            />
          ) : (
            <UserCircleIcon className="w-20 h-20 text-gray-400" />
          )}{" "}
          {/* <img
            src={picturePreview || "https://via.placeholder.com/80"}
            alt="프로필 미리보기"
            className="w-20 h-20 rounded-full object-cover border bg-gray-200"
          />{" "} */}
          {/* 기본 배경색 추가 */}
          <div>
            <input
              type="file"
              id="profilePicture"
              accept="image/jpeg, image/png, image/gif"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="profilePicture"
              className="cursor-pointer text-sm text-blue-600 hover:underline mr-4 font-medium"
            >
              사진 변경
            </label>
            {picturePreview && (
              <button
                type="button"
                onClick={handleRemovePicture}
                className="text-xs text-red-500 hover:underline"
              >
                사진 삭제
              </button>
            )}
            <p className="text-xs text-gray-500 mt-1">
              JPG, PNG, GIF - 10MB 이하
            </p>
          </div>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-600">닉네임</label>
        <input
          type="text"
          name="nickname"
          value={formData.nickname || ""}
          onChange={handleChange}
          className="w-full mt-1 p-2 border rounded-md"
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-600">한 줄 소개</label>
        <input
          type="text"
          name="bio"
          value={formData.bio || ""}
          onChange={handleChange}
          className="w-full mt-1 p-2 border rounded-md"
          maxLength="100"
        />
      </div>
      {/* <div>
        <label className="text-sm font-medium text-gray-600">이력서 제목</label>
        <input
          type="text"
          name="resume_title"
          value={formData.resume_title || ""}
          onChange={handleChange}
          className="w-full mt-1 p-2 border rounded-md"
          placeholder="예: 열정적인 프론트엔드 개발자 OOO입니다"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-600">자기소개</label>
        <textarea
          name="introduction"
          value={formData.introduction || ""}
          onChange={handleChange}
          rows="5"
          className="w-full mt-1 p-2 border rounded-md"
          placeholder="자신을 자유롭게 소개해주세요."
        />
      </div> */}
      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-700 transition duration-150"
        disabled={mutation.isPending}
      >
        {mutation.isPending ? "저장 중..." : "프로필 저장"}
      </button>
    </form>
  );
};

// 경력 관리 컴포넌트
const ExperienceManager = ({ experiences, token, queryClient }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newExp, setNewExp] = useState({
    company_name: "",
    position: "",
    start_date: "",
    end_date: "",
    description: "",
  });

  const addMutation = useMutation({
    mutationFn: addExperience,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
      setShowAddForm(false);
      setNewExp({
        company_name: "",
        position: "",
        start_date: "",
        end_date: "",
        description: "",
      });
    },
    onError: (err) => alert(err.response?.data?.message || "경력 추가 실패"),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteExperience,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["myProfile"] }),
    onError: (err) => alert(err.response?.data?.message || "경력 삭제 실패"),
  });

  const handleAdd = () => {
    if (!newExp.company_name || !newExp.position || !newExp.start_date) {
      alert("회사명, 직책, 시작일은 필수입니다.");
      return;
    }
    addMutation.mutate({ experienceData: newExp, token });
  };
  const handleDelete = (expId) => {
    if (window.confirm("정말 이 경력을 삭제하시겠습니까?")) {
      deleteMutation.mutate({ expId, token });
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-md shadow-sm">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">경력</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-sm text-blue-600 font-medium hover:underline"
        >
          {showAddForm ? "취소" : "+ 경력 추가"}
        </button>
      </div>
      {showAddForm && (
        <div className="space-y-3 p-3 bg-gray-50 border rounded-md">
          <input
            type="text"
            placeholder="* 회사명"
            value={newExp.company_name}
            onChange={(e) =>
              setNewExp({ ...newExp, company_name: e.target.value })
            }
            className="w-full p-2 border rounded text-sm"
          />
          <input
            type="text"
            placeholder="* 직책"
            value={newExp.position}
            onChange={(e) => setNewExp({ ...newExp, position: e.target.value })}
            className="w-full p-2 border rounded text-sm"
          />
          <div className="flex gap-4">
            <input
              type="date"
              placeholder="* 시작일"
              value={newExp.start_date}
              onChange={(e) =>
                setNewExp({ ...newExp, start_date: e.target.value })
              }
              className="w-1/2 p-2 border rounded text-sm"
            />
            <input
              type="date"
              placeholder="종료일 (재직중이면 비워두세요)"
              value={newExp.end_date}
              onChange={(e) =>
                setNewExp({ ...newExp, end_date: e.target.value })
              }
              className="w-1/2 p-2 border rounded text-sm"
            />
          </div>
          <textarea
            placeholder="담당 업무나 성과를 간략히 설명해주세요. (선택)"
            value={newExp.description}
            onChange={(e) =>
              setNewExp({ ...newExp, description: e.target.value })
            }
            rows="3"
            className="w-full p-2 border rounded text-sm"
          />
          <button
            onClick={handleAdd}
            className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-700 transition duration-150"
            disabled={addMutation.isPending}
          >
            {addMutation.isPending ? "추가 중..." : "경력 추가하기"}
          </button>
        </div>
      )}
      {experiences?.length > 0
        ? experiences.map((exp) => (
            <div
              key={exp.idx}
              className="border-t pt-3 flex justify-between items-start group"
            >
              <div>
                <p className="font-medium text-base">
                  {exp.position}{" "}
                  <span className="text-gray-600">at {exp.company_name}</span>
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(exp.start_date).toLocaleDateString()} ~{" "}
                  {exp.end_date
                    ? new Date(exp.end_date).toLocaleDateString()
                    : "현재"}
                </p>
                {/* Markdown 렌더링 라이브러리 사용하면 더 좋음 */}
                <p className="text-sm mt-1 whitespace-pre-wrap">
                  {exp.description}
                </p>
              </div>
              {/* 마우스 올리면 삭제 버튼 보이기 */}
              <button
                onClick={() => handleDelete(exp.idx)}
                className="text-red-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity font-medium"
                disabled={deleteMutation.isPending}
              >
                삭제
              </button>
              {/* TODO: 수정 버튼 추가 */}
            </div>
          ))
        : !showAddForm && (
            <p className="text-sm text-gray-500 text-center py-4">
              아직 등록된 경력이 없습니다.
            </p>
          )}
    </div>
  );
};

// --- TODO: 학력(EducationManager), 프로젝트(ProjectManager), 스킬(SkillManager) 컴포넌트 추가 ---
// ExperienceManager와 매우 유사한 구조로 만들 수 있습니다.

// --- 메인 페이지 컴포넌트 ---
function MyProfilePage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["myProfile"],
    queryFn: () => fetchMyProfile(token),
    enabled: !!token, // 토큰이 있을 때만 쿼리 실행
    refetchOnWindowFocus: false,
  });

  if (isLoading)
    return <div className="text-center p-10">프로필 정보를 불러오는 중...</div>;
  if (isError)
    return (
      <div className="text-center p-10 text-red-500">
        프로필 정보를 불러오는 데 실패했습니다.
      </div>
    );
  // (★★수정★★) 데이터가 없을 경우 렌더링하지 않음
  if (!data) {
    return (
      <div className="text-center p-10">프로필 데이터를 찾을 수 없습니다.</div>
    );
  }

  // 데이터 구조 분해 (데이터가 없을 경우 대비)
  const {
    profile = {},
    experiences = [],
    educations = [],
    projects = [],
    skills = [],
  } = data || {};

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8  min-h-screen">
      {" "}
      {/* 배경색 추가 */}
      <h1 className="text-3xl font-bold text-gray-800">내 프로필 관리</h1>
      <ProfileEdit profile={profile} token={token} queryClient={queryClient} />
      <ExperienceManager
        experiences={experiences}
        token={token}
        queryClient={queryClient}
      />
      {/* TODO: 다른 관리 컴포넌트 렌더링 */}
      {/* <EducationManager educations={educations} token={token} queryClient={queryClient} /> */}
      {/* <ProjectManager projects={projects} token={token} queryClient={queryClient} /> */}
      {/* <SkillManager skills={skills} token={token} queryClient={queryClient} /> */}
    </div>
  );
}

export default MyProfilePage;
