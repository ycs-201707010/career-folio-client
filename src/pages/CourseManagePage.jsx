// ** 전체 강좌의 섹션 및 동영상 순서 등을 변경하는 상세 수정 페이지 **

import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import SectionManager from "../components/SectionManager";

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

const updateCourseDetails = async ({ courseId, courseData, token }) => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const { data } = await axios.put(
    `${API_BASE_URL}/api/courses/${courseId}`,
    courseData,
    config
  );
  return data;
};

function CourseManagePage() {
  const { courseId } = useParams(); // URL 파라미터에서 courseId를 가져옵니다.
  const { token } = useAuth();
  const queryClient = useQueryClient();

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

  useEffect(() => {
    if (course) {
      setEditForm({
        title: course.title,
        description: course.description,
        price: course.price,
        discount_price: course.discount_price,
      });
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

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const courseData = {
      ...editForm,
      price: parseFloat(editForm.price) || 0,
      discount_price:
        editForm.discount_price === "" || editForm.discount_price === null
          ? 0
          : parseFloat(editForm.discount_price),
    };
    mutation.mutate({ courseId, courseData, token });
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
        <Link to="/instructor" className="text-blue-600 hover:underline">
          강사 대시보드
        </Link>
        <span className="mx-2">/</span>
        <span>강좌 관리</span>
      </nav>
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
        <p className="text-gray-500 mb-6">상태: {course.status}</p>

        {/* 강좌 정보 수정 폼 */}
        <form
          onSubmit={handleFormSubmit}
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
          <div className="text-right">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "저장 중..." : "정보 저장"}
            </button>
          </div>
        </form>

        {/* 커리큘럼(섹션, 강의)을 관리하는 UI */}
        <SectionManager course={course}></SectionManager>
      </div>
    </div>
  );
}

export default CourseManagePage;
