import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import MDEditor from "@uiw/react-md-editor"; // 마크다운 에디터 재사용
import { XMarkIcon, PhotoIcon } from "@heroicons/react/24/solid";
import Swal from "sweetalert2";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// 질문 등록 API 호출 함수
const createQuestion = async ({ formData, token }) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  };
  const { data } = await axios.post(
    `${API_BASE_URL}/api/qna`,
    formData,
    config
  );
  return data;
};

const CATEGORIES = [
  { id: "tech", name: "IT / 전자" },
  { id: "humanities", name: "인문 / 사회" },
  { id: "service", name: "서비스" },
];

function QnaWritePage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 폼 상태
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("tech"); // 기본값
  const [content, setContent] = useState(
    "**궁금한 내용을 상세하게 적어주세요!**"
  );

  // 태그 상태 관리
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState([]);

  // 👇 [신규] 이미지 관련 상태
  const [imageFiles, setImageFiles] = useState([]); // 실제 전송할 파일 객체 배열
  const [imagePreviews, setImagePreviews] = useState([]); // 미리보기 URL 배열
  const fileInputRef = useRef(null); // 숨겨진 file input 참조

  const mutation = useMutation({
    mutationFn: createQuestion,
    onSuccess: () => {
      Swal.fire("등록 완료", "질문이 성공적으로 등록되었습니다.", "success");
      // 목록 쿼리 무효화 (최신글 갱신)
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      navigate("/qna"); // 목록 페이지로 이동
    },
    onError: (err) => {
      Swal.fire(
        "등록 실패",
        err.response?.data?.message || "오류 발생",
        "error"
      );
    },
  });

  // 태그 입력 핸들러 (엔터나 쉼표로 추가)
  const handleTagKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (newTag && !tags.includes(newTag)) {
        if (tags.length >= 5) {
          return Swal.fire(
            "알림",
            "태그는 최대 5개까지 가능합니다.",
            "warning"
          );
        }
        setTags([...tags, newTag]);
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  // 이미지 선택 핸들러
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (imageFiles.length + files.length > 5) {
      return Swal.fire(
        "알림",
        "이미지는 최대 5장까지 첨부 가능합니다.",
        "warning"
      );
    }

    const newFiles = [...imageFiles, ...files];
    setImageFiles(newFiles);

    // 미리보기 URL 생성
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  // 이미지 삭제 핸들러
  const removeImage = (index) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    setImageFiles(newFiles);

    // 메모리 누수 방지를 위해 기존 URL 해제 후 새 배열 생성
    URL.revokeObjectURL(imagePreviews[index]);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImagePreviews(newPreviews);
  };

  const handleSubmit = () => {
    if (!title.trim())
      return Swal.fire("알림", "제목을 입력해주세요.", "warning");
    if (!content.trim())
      return Swal.fire("알림", "내용을 입력해주세요.", "warning");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("category", category);

    // 태그 배열을 각각 'tags'라는 이름으로 추가
    tags.forEach((tag) => formData.append("tags", tag));

    // 이미지 파일을 각각 'images'라는 이름으로 추가
    imageFiles.forEach((file) => formData.append("images", file));

    mutation.mutate({ formData, token });
  };

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">질문 작성하기</h1>

        <div className="space-y-6">
          {/* 1. 카테고리 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              카테고리
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full md:w-1/3 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* 2. 제목 입력 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              질문 제목
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="궁금한 내용을 한 문장으로 요약해주세요."
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-lg font-medium placeholder-gray-400"
            />
          </div>

          {/* 3. 태그 입력 */}

          {/* 👇 [신규] 이미지 첨부 영역 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이미지 첨부 (선택, 최대 5장)
            </label>
            <div className="flex items-center gap-4">
              {/* 파일 선택 버튼 */}
              <button
                onClick={() => fileInputRef.current.click()}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 border border-gray-300 transition"
                disabled={imageFiles.length >= 5}
              >
                <PhotoIcon className="w-5 h-5 text-gray-500" />
                <span>사진 추가</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                multiple // 여러 장 선택 가능
                accept="image/*"
                className="hidden"
              />
              <span className="text-sm text-gray-500">
                {imageFiles.length} / 5 장
              </span>
            </div>

            {/* 이미지 미리보기 */}
            {imagePreviews.length > 0 && (
              <div className="flex gap-4 mt-4 overflow-x-auto py-2">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative flex-shrink-0">
                    <img
                      src={preview}
                      alt={`preview-${index}`}
                      className="w-24 h-24 object-cover rounded-md border border-gray-200"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-600 transition"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4. 본문 에디터 */}
          <div data-color-mode="light">
            <div className="flex gap-1 items-end">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                내용
              </label>

              <span className="block text-xs font-medium text-gray-500 mb-2">
                (markdown 문법을 지원합니다.)
              </span>
            </div>

            <div className="border rounded-md overflow-hidden">
              <MDEditor
                value={content}
                onChange={setContent}
                height={500}
                preview="live"
              />
            </div>
          </div>

          {/* 태그 그룹 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              태그 (선택, 최대 5개)
            </label>
            <div className="flex flex-wrap items-center gap-2 p-2 border border-gray-300 rounded-md focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
                >
                  # {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder={
                  tags.length === 0
                    ? "태그를 입력하고 엔터를 누르세요 (예: React, 취업)"
                    : ""
                }
                className="flex-grow p-1 outline-none text-sm min-w-[150px]"
                disabled={tags.length >= 5}
              />
            </div>
          </div>

          {/* 5. 버튼 그룹 */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 font-medium"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={mutation.isPending}
              className="px-6 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 font-medium disabled:bg-gray-400"
            >
              {mutation.isPending ? "등록 중..." : "질문 등록"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QnaWritePage;
