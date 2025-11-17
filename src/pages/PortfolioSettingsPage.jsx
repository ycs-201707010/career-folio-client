import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Switch } from "@headlessui/react";
import { CheckCircleIcon, EyeIcon } from "@heroicons/react/24/solid";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// --- API 함수 ---

// 1. [재사용] Navbar, ResumeBuildPage와 동일한 API/Key 사용 (캐시 공유)
const fetchMyResumeData = async (token) => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const { data } = await axios.get(`${API_BASE_URL}/api/resume/me`, config);
  return data;
};

// 2. [신규] 설정 저장 API (Turn 115에서 서버에 만듦)
const updatePortfolioSettings = async ({ template, isPublic, token }) => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const { data } = await axios.put(
    `${API_BASE_URL}/api/resume/settings`,
    { template, isPublic },
    config
  );
  return data;
};

// 템플릿 예시 데이터 (나중에 실제 템플릿 컴포넌트와 연결)
const TEMPLATES = [
  {
    id: "default",
    name: "기본 템플릿",
    imageUrl: "https://via.placeholder.com/150/EEEEEE/888888?text=Default",
  },
  {
    id: "modern",
    name: "모던 템플릿",
    imageUrl: "https://via.placeholder.com/150/3B82F6/FFFFFF?text=Modern",
  },
  {
    id: "minimalist",
    name: "심플 템플릿",
    imageUrl: "https://via.placeholder.com/150/111827/FFFFFF?text=Minimalist",
  },
];

function PortfolioSettingsPage() {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();

  // 1. "myResumeData" 쿼리 키로 기존 캐시/데이터를 불러옴
  const { data: resumeData, isLoading } = useQuery({
    queryKey: ["myResumeData"],
    queryFn: () => fetchMyResumeData(token),
    enabled: !!token,
  });

  // 2. 이 페이지의 "임시" 상태 (DB와 동기화)
  const [selectedTemplate, setSelectedTemplate] = useState("default");
  const [isPublic, setIsPublic] = useState(false);

  // 3. useQuery가 데이터를 성공적으로 로드하면, state에 반영
  useEffect(() => {
    if (resumeData?.profile) {
      setIsPublic(Boolean(resumeData.profile.is_portfolio_public));
      setSelectedTemplate(resumeData.profile.portfolio_template || "default");
    }
  }, [resumeData]);

  // 4. 설정 저장 Mutation
  const mutation = useMutation({
    mutationFn: updatePortfolioSettings,
    onSuccess: (data) => {
      // 5. [중요] 저장 성공 시, "myResumeData" 캐시를 수동으로 업데이트
      // (서버에서 데이터를 다시 안 받아오고 즉시 UI에 반영하기 위함)
      queryClient.setQueryData(["myResumeData"], (oldData) => ({
        ...oldData,
        profile: {
          ...oldData.profile,
          is_portfolio_public: isPublic,
          portfolio_template: selectedTemplate,
        },
      }));
      alert(data.message); // (Swal.fire로 바꾸는 것 추천)
    },
    onError: (err) => {
      alert(err.response?.data?.message || "설정 저장 실패");
    },
  });

  const handleSaveSettings = () => {
    mutation.mutate({ template: selectedTemplate, isPublic, token });
  };

  // (user.id가 로그인 ID라고 가정)
  const myPortfolioUrl = `${window.location.origin}/portfolio/${user?.id}`;

  if (isLoading) {
    return <div className="text-center p-10">설정 정보를 불러오는 중...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6">포트폴리오 설정</h1>

      {/* --- 1. 공개 여부 설정 --- */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">공개 설정</h2>
        <div className="flex items-center justify-between">
          <div>
            <span className="font-medium text-gray-900">
              내 포트폴리오 페이지 공개하기
            </span>
            <p className="text-sm text-gray-500">
              {isPublic
                ? "모든 방문자가 내 포트폴리오를 볼 수 있습니다."
                : "비공개 상태입니다."}
            </p>
          </div>
          <Switch
            checked={isPublic}
            onChange={setIsPublic}
            className="hover:bg-transparent"
          >
            <span
              className={`block rounded-full shadow p-1 h-6 w-11 flex items-center ${
                isPublic ? "bg-green-600" : "bg-gray-400"
              }`}
            >
              <span
                className={`block size-4 rounded-full transition duration-300 ease-in-out bg-white transform ${
                  isPublic ? "translate-x-5" : "translate-x-0"
                }`}
              ></span>
            </span>
          </Switch>
        </div>

        {/* 공개 URL 미리보기 */}
        {isPublic && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md border">
            <label className="text-xs font-medium text-gray-500">
              공개 URL
            </label>
            <div className="flex justify-between items-center">
              <a
                href={myPortfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline truncate"
              >
                {myPortfolioUrl}
              </a>
              <button
                onClick={() =>
                  navigator.clipboard
                    .writeText(myPortfolioUrl)
                    .then(() => alert("URL이 복사되었습니다."))
                }
                className="text-xs text-gray-500 hover:text-black ml-4"
              >
                복사
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- 2. 템플릿 선택 --- */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">템플릿 선택</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => setSelectedTemplate(template.id)}
              className={`relative rounded-lg border-2 overflow-hidden transition-all
                ${
                  selectedTemplate === template.id
                    ? "border-blue-600 ring-2 ring-blue-400"
                    : "border-gray-200 hover:border-gray-400"
                }
              `}
            >
              <img
                src={template.imageUrl}
                alt={template.name}
                className="w-full h-auto object-cover"
              />
              <span className="block text-sm font-medium p-2">
                {template.name}
              </span>
              {selectedTemplate === template.id && (
                <div className="absolute top-2 right-2 bg-blue-600 rounded-full p-1">
                  <CheckCircleIcon className="w-5 h-5 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* --- 3. 저장 버튼 --- */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveSettings}
          disabled={mutation.isPending}
          className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {mutation.isPending ? "저장 중..." : "설정 저장하기"}
        </button>
      </div>
    </div>
  );
}

export default PortfolioSettingsPage;
