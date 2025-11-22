// ** 자신의 프로필을 편집하는 페이지 **

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { UserCircleIcon, CameraIcon } from "@heroicons/react/24/outline";
import Swal from "sweetalert2";

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

// --- 컴포넌트들 ---

/** 프로필 정보 수정 컴포넌트 */
const ProfileEdit = ({ profile, token, queryClient }) => {
  const [formData, setFormData] = useState({
    nickname: profile?.nickname || "",
    bio: profile?.bio || "",
  });
  const [pictureFile, setPictureFile] = useState(null);
  const [picturePreview, setPicturePreview] = useState(null);
  const fileInputRef = useRef(null);

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
      Swal.fire(
        "프로필이 성공적으로 저장되었습니다.",
        updatedProfileData.message,
        "success"
      );
    },
    onError: (err) => {
      console.error("Profile update error:", err);
      Swal.fire(
        "프로필이 성공적으로 저장되었습니다.",
        err.response?.data?.message,
        "error"
      );
      // alert(err.response?.data?.message || "프로필 저장에 실패했습니다.");
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
    <form onSubmit={handleSubmit} className="space-y-6 ">
      {/* 1. 프로필 사진 섹션 */}
      <div className="flex flex-col items-center">
        <div
          className="relative group cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          {picturePreview ? (
            <img
              src={picturePreview}
              alt="프로필"
              className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md group-hover:opacity-75 transition"
            />
          ) : (
            <UserCircleIcon className="w-32 h-32 text-gray-300 bg-white rounded-full shadow-md group-hover:text-gray-400 transition" />
          )}

          {/* 호버 시 카메라 아이콘 */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
            <CameraIcon className="w-10 h-10 text-gray-800 bg-white bg-opacity-50 rounded-full p-2" />
          </div>

          {/* 숨겨진 파일 입력 */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
          />
        </div>
        <div className="flex flex-row gap-2 items-center">
          <span className="text-sm text-gray-500 mt-3">
            프로필 사진을 변경하려면 클릭하세요
          </span>
          {picturePreview && (
            <button
              type="button"
              onClick={handleRemovePicture}
              className="text-xs text-red-500 hover:underline"
            >
              사진 삭제
            </button>
          )}
        </div>
      </div>

      {/* 2. 입력 필드 섹션 */}
      <div className="grid grid-cols-1 gap-6">
        {/* 읽기 전용 정보 (Users 테이블 정보) */}
        <div className="bg-gray-50 p-4 rounded-md border border-gray-200 space-y-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            계정 정보 (수정 불가)
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              이름
            </label>
            <input
              type="text"
              value={profile?.username || ""}
              disabled
              className="mt-1 w-full bg-gray-200 border-gray-300 rounded-md text-gray-500 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              이메일 (로그인 ID)
            </label>
            <input
              type="text"
              value={profile?.email || ""}
              disabled
              className="mt-1 w-full bg-gray-200 border-gray-300 rounded-md text-gray-500 cursor-not-allowed"
            />
          </div>
          {/* 전화번호는 민감정보라 user_phone이 API에서 오는지 확인 필요 */}
        </div>

        {/* 수정 가능 정보 (User_Profile 테이블 정보) */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            프로필 설정
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              닉네임
            </label>
            <input
              type="text"
              name="nickname"
              value={formData.nickname}
              onChange={handleChange}
              className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              한 줄 소개
            </label>
            <input
              type="text"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              maxLength={100}
              className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {formData.bio.length}/100
            </p>
          </div>
        </div>
      </div>

      {/* 저장 버튼 */}
      <div className="flex justify-end pt-4 border-t">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition"
        >
          {mutation.isPending ? "저장 중..." : "변경사항 저장"}
        </button>
      </div>
    </form>
  );
};

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
    </div>
  );
}

export default MyProfilePage;
