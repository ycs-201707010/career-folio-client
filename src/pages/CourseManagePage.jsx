// ** 전체 강좌의 섹션 및 동영상 순서 등을 변경하는 상세 수정 페이지 **

import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import SectionManager from "../components/SectionManager";
import StatusBadge from "../components/StatusBadge";
import Swal from "sweetalert2"; // 커스텀 alert 창 라이브러리 임포트

const API_BASE_URL = "http://localhost:8080";

// React Query가 사용할 데이터 fetching 함수
// 이 함수는 반드시 Promise를 반환해야 합니다 (axios는 Promise를 반환함).
const fetchCourseDetails = async (courseId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const { data } = await axios.get(
    `${API_BASE_URL}/api/courses/${courseId}`,
    config
  );
  return data;
};

const updateCourseDetails = async ({ courseId, formData, token }) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  };
  const { data } = await axios.put(
    `${API_BASE_URL}/api/courses/${courseId}`,
    formData,
    config
  );
  return data;
};

// [신규] 강좌 삭제 API 함수
const deleteCourse = async ({ courseId, token }) => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const { data } = await axios.delete(
    `${API_BASE_URL}/api/courses/${courseId}`,
    config
  );
  return data;
};

function CourseManagePage() {
  const { courseId } = useParams(); // URL 파라미터에서 courseId를 가져옵니다.
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // useQuery 훅 사용
  // data, isLoading, isError 등의 상태를 자동으로 관리해줍니다.
  const {
    data: course,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["course", courseId], // 이 데이터의 고유 키 (배열 형태)
    queryFn: () => fetchCourseDetails(courseId, token), // 데이터를 가져올 함수
    enabled: !!token, // 토큰이 있을 때만 이 쿼리를 실행합니다.
  });

  // 강좌 정보 수정을 위한 상태
  const [editForm, setEditForm] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);

  useEffect(() => {
    if (course) {
      setEditForm({
        title: course.title,
        description: course.description,
        price: course.price,
        discount_price: course.discount_price,
      });
      setThumbnailPreview(
        course.thumbnail_url ? `${API_BASE_URL}/${course.thumbnail_url}` : null
      ); // 기존 썸네일 표시
      setThumbnailFile(null); // 수정 시 파일 상태 초기화
    }
  }, [course]);

  const mutation = useMutation({
    mutationFn: updateCourseDetails,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      alert("강좌 정보가 성공적으로 수정되었습니다.");
    },
    onError: (err) => {
      alert(err.response?.data?.message || "정보 수정에 실패했습니다.");
    },
  });

  // [신규] 강좌 삭제 Mutation
  const deleteMutation = useMutation({
    mutationFn: deleteCourse,
    onSuccess: (data) => {
      Swal.fire("삭제 완료", data.message, "success");
      // 삭제 성공 시, 강사 대시보드 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ["myCourses"] });
      // 강사 대시보드로 이동
      navigate("/instructor/dashboard");
    },
    onError: (err) => {
      Swal.fire(
        "삭제 실패",
        err.response?.data?.message || "오류 발생",
        "error"
      );
    },
  });

  // [신규] 강좌 삭제 핸들러
  const handleDeleteCourse = () => {
    Swal.fire({
      title: "정말 이 강좌를 삭제하시겠습니까?",
      text: "강좌의 모든 섹션, 강의, 수강생 정보가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "삭제",
      cancelButtonText: "취소",
    }).then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate({ courseId, token });
      }
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  // (★★신규★★) 파일 변경 핸들러
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setThumbnailPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      // 파일 선택 취소 시
      setThumbnailFile(null);
      setThumbnailPreview(
        course.thumbnail_url ? `${API_BASE_URL}/${course.thumbnail_url}` : null
      ); // 원래 썸네일로 복구
    }
  };

  // (★★신규★★) 썸네일 삭제 핸들러
  const handleRemoveThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
    // 저장 시 thumbnail_url: 'null'을 보내 삭제 처리
  };

  const handleFormSubmit = (e, requestedStatus = null) => {
    e.preventDefault();
    const formData = new FormData();

    // 1. 텍스트 필드 추가 (기존과 동일)
    Object.keys(editForm).forEach((key) => {
      // ... (discount_price 'null' 처리 로직 동일) ...
      formData.append(key, editForm[key]);
    });

    // 2. 썸네일 파일/삭제 여부 추가 (기존과 동일)
    if (thumbnailFile) {
      formData.append("thumbnail", thumbnailFile);
    } else if (thumbnailPreview === null && course.thumbnail_url) {
      formData.append("thumbnail_url", "null");
    }

    // 3. [신규] 강좌 상태(status) 추가
    //    (만약 "게시하기" 버튼을 눌렀다면)
    if (requestedStatus) {
      let finalStatus = requestedStatus; // 'published' 요청

      // [Turn 92] 하이브리드 모델 로직
      // "게시" 요청인데, "미검증" 강사라면?
      if (requestedStatus === "published" && !user.is_verified_instructor) {
        finalStatus = "pending"; // "검수 대기"로 변경
      }
      formData.append("status", finalStatus);
    }

    mutation.mutate({ courseId, formData, token });
  };

  if (isLoading) {
    return <div className="text-center p-10">강좌 정보를 불러오는 중...</div>;
  }

  if (isError) {
    return (
      <div className="text-center p-10 text-red-500">
        오류: {error.response?.data?.message || error.message}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <nav className="text-sm mb-4">
        <Link
          to="/instructor/dashboard"
          className="text-blue-600 hover:underline"
        >
          강사 대시보드
        </Link>
        <span className="mx-2">/</span>
        <span>강좌 관리</span>
      </nav>
      <div className="bg-white p-8 rounded-lg shadow-md">
        <div className="flex justify-between mb-5">
          <div>
            <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
            <p className="text-gray-500 mb-6">
              <StatusBadge status={course.status} />
            </p>
          </div>
          <div className="flex flex-col gap-2 flex-shrink-0">
            {/* --- 👇 [핵심 수정] ---
            "변경사항 저장" 버튼은 "게시하기"와 "초안으로 변경" 버튼과
            항상 "공존"해야 합니다.
          */}
            <button
              onClick={(e) => handleFormSubmit(e, "draft")} // 👈 'draft'로 명시
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              disabled={mutation.isPending}
              title="모든 변경 내용을 '초안'으로 저장합니다." // 👈 툴팁 추가
            >
              {mutation.isPending ? "저장 중..." : "초안으로 저장"}
            </button>

            {/* 'published' 상태가 아닐 때만 "게시하기" 버튼 보임 */}
            {course.status !== "published" && (
              <button
                onClick={(e) => handleFormSubmit(e, "published")}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                disabled={mutation.isPending}
              >
                {/* [Turn 92]의 서버 로직이 'is_verified_instructor'를
                  확인하여 'pending' 또는 'published'로 자동 처리합니다.
              */}
                {user.is_verified_instructor
                  ? "즉시 게시하기"
                  : "검수 요청하기"}
              </button>
            )}

            {/* 'published' 상태일 때만 "보관" 버튼 보임 (선택적) */}
            {course.status === "published" && (
              <button
                onClick={(e) => handleFormSubmit(e, "archived")} // 👈 'archived'
                className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
                disabled={mutation.isPending}
              >
                강좌 숨기기
              </button>
            )}
          </div>
        </div>

        {/* 강좌 정보 수정 폼 */}
        <form
          // onSubmit={handleFormSubmit}
          className="mb-8 p-6 border rounded-lg space-y-4"
        >
          <h2 className="text-xl font-semibold text-gray-700">
            강좌 정보 수정
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-600">
              제목
            </label>
            <input
              type="text"
              name="title"
              value={editForm?.title || ""}
              onChange={handleFormChange}
              className="w-full mt-1 p-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">
              설명
            </label>
            <textarea
              name="description"
              value={editForm?.description || ""}
              onChange={handleFormChange}
              rows="3"
              className="w-full mt-1 p-2 border rounded-md"
            ></textarea>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-600">
                정가 (원)
              </label>
              <input
                type="number"
                name="price"
                value={editForm?.price || ""}
                onChange={handleFormChange}
                className="w-full mt-1 p-2 border rounded-md"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-600">
                할인가 (원, 없으면 비워두기)
              </label>
              <input
                type="number"
                name="discount_price"
                value={editForm?.discount_price ?? ""}
                onChange={handleFormChange}
                className="w-full mt-1 p-2 border rounded-md"
              />
            </div>
          </div>

          {/* (★★신규★★) 썸네일 수정 UI */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              썸네일 이미지
            </label>
            {thumbnailPreview ? (
              <div className="flex items-center gap-4">
                <img
                  src={thumbnailPreview}
                  alt="썸네일 미리보기"
                  className="max-h-32 rounded border"
                />
                <button
                  type="button"
                  onClick={handleRemoveThumbnail}
                  className="text-xs text-red-600 hover:underline"
                >
                  이미지 삭제
                </button>
              </div>
            ) : (
              <p className="text-xs text-gray-500">현재 썸네일 없음</p>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 mt-2"
            />
          </div>

          <div className="text-right">
            {/* <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "저장 중..." : "정보 저장"}
            </button> */}
          </div>
        </form>

        {/* 커리큘럼(섹션, 강의)을 관리하는 UI */}
        <SectionManager course={course}></SectionManager>

        {/* --- 👇 [신규] 강좌 삭제 영역 --- */}
        <div className="mt-8 p-6 border border-red-500 rounded-lg bg-red-50">
          <h2 className="text-xl font-semibold text-red-700">위험 구역</h2>
          <p className="text-sm text-red-600 mt-2 mb-4">
            이 강좌를 삭제하면 모든 관련 데이터(섹션, 강의, 수강평, 수강생
            이력)가 삭제되며 복구할 수 없습니다.
          </p>
          <button
            onClick={handleDeleteCourse}
            disabled={deleteMutation.isPending}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400"
          >
            {deleteMutation.isPending ? "삭제 중..." : "이 강좌 삭제하기"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CourseManagePage;
