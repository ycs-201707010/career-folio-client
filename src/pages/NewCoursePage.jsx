import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2"; // 커스텀 alert 창 라이브러리 임포트

import { useAuth } from "../context/AuthContext";

const API_BASE_URL = "http://localhost:8080";

function NewCoursePage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [thumbnail, setThumbnail] = useState(null); // 썸네일 파일 상태
  const [thumbnailPreview, setThumbnailPreview] = useState(null); // 썸네일 미리보기 URL
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { token } = useAuth();
  const navigate = useNavigate();

  // 파일 선택 핸들러
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnail(file);
      // 미리보기 URL 생성
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setThumbnail(null);
      setThumbnailPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title) {
      setError("강좌 제목은 필수 항목입니다.");
      return;
    }
    setIsLoading(true);
    setError("");

    // FormData 사용
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("price", price ? parseFloat(price) : 0);
    if (thumbnail) {
      formData.append("thumbnail", thumbnail); // 'thumbnail' 이름으로 파일 추가
    }

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      };

      await axios.post(`${API_BASE_URL}/api/courses`, formData, config);

      Swal.fire({
        icon: "success",
        title: "강좌 생성",
        text: "새로운 강좌가 성공적으로 생성되었습니다!",
      });
      navigate("/instructor/dashboard"); // 성공 후 대시보드로 이동
    } catch (err) {
      setError(err.response?.data?.message || "강좌 생성에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">새 강좌 만들기</h1>
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-md space-y-6"
      >
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            강좌 제목
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="예: React 마스터 클래스"
          />
        </div>
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            강좌 설명
          </label>
          <textarea
            id="description"
            rows="4"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="이 강좌를 통해 무엇을 배울 수 있는지 설명해주세요."
          ></textarea>
        </div>
        <div>
          <label
            htmlFor="price"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            가격 (원)
          </label>
          <input
            type="number"
            id="price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="무료 강좌는 0 또는 비워두세요."
            min="0"
          />
        </div>

        {/* (★★신규★★) 썸네일 업로드 필드 */}
        <div>
          <label
            htmlFor="thumbnail"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            썸네일 이미지 (선택 사항)
          </label>
          <input
            type="file"
            id="thumbnail"
            accept="image/png, image/jpeg, image/gif" // 이미지 파일만 허용
            onChange={handleFileChange}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {thumbnailPreview && (
            <div className="mt-4">
              <img
                src={thumbnailPreview}
                alt="썸네일 미리보기"
                className="max-h-40 rounded-md border"
              />
            </div>
          )}
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate("/instructor/dashboard")}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
            disabled={isLoading}
          >
            취소
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:bg-gray-400"
            disabled={isLoading}
          >
            {isLoading ? "생성 중..." : "강좌 생성하기"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default NewCoursePage;
