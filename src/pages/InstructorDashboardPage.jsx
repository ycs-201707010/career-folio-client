import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import {
  EyeIcon,
  PencilIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";

const API_BASE_URL = "http://localhost:8080";

// --- [신규] React Query용 API 함수 ---
const fetchMyCourses = async (token) => {
  if (!token) return []; // 토큰 없으면 요청 안함
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const { data } = await axios.get(
    `${API_BASE_URL}/api/courses/my-courses`,
    config
  );
  return data;
};

// --- [신규] 상태 표시 뱃지 ---
const StatusBadge = ({ status }) => {
  let bgColor, textColor, text;
  switch (status) {
    case "draft":
      bgColor = "bg-gray-100";
      textColor = "text-gray-700";
      text = "초안";
      break;
    case "published":
      bgColor = "bg-green-100";
      textColor = "text-green-700";
      text = "게시됨";
      break;
    case "archived":
      bgColor = "bg-red-100";
      textColor = "text-red-700";
      text = "보관됨";
      break;
    default:
      bgColor = "bg-gray-100";
      textColor = "text-gray-700";
      text = status;
  }
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}
    >
      {text}
    </span>
  );
};

function InstructorDashboardPage() {
  const { token } = useAuth();

  // --- [수정] useEffect/useState -> useQuery ---
  const { data: courses, isLoading } = useQuery({
    queryKey: ["myCourses"],
    queryFn: () => fetchMyCourses(token),
  });
  // --- [수정 완료] ---

  if (isLoading) {
    return <div className="text-center p-10">강좌 목록을 불러오는 중...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">강좌 관리</h1>
        <Link
          to="/instructor/course/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
        >
          + 새 강좌 만들기
        </Link>
      </div>

      {/* --- [수정] <ul> -> <table> --- */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {courses.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  강좌
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  상태
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  가격
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  수강생
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  평점
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">관리</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {courses.map((course) => (
                <tr key={course.idx}>
                  {/* 강좌 (썸네일 + 제목) */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-16">
                        {course.thumbnail_url ? (
                          <img
                            className="h-10 w-16 rounded-md object-cover"
                            src={`${API_BASE_URL}/${course.thumbnail_url}`}
                            alt=""
                          />
                        ) : (
                          <div className="h-10 w-16 rounded-md bg-gray-200" />
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                          {course.title}
                        </div>
                      </div>
                    </div>
                  </td>
                  {/* 상태 */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={course.status} />
                  </td>
                  {/* 가격 */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {course.discount_price !== null ? (
                      <div>
                        <span className="text-red-500 font-semibold">
                          ₩{Number(course.discount_price).toLocaleString()}
                        </span>
                        <span className="text-gray-400 line-through ml-1">
                          ₩{Number(course.price).toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      <span>₩{Number(course.price).toLocaleString()}</span>
                    )}
                  </td>
                  {/* 수강생 */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {course.enrollment_count}
                  </td>
                  {/* 평점 */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ★ {course.avg_rating.toFixed(1)} ({course.review_count})
                  </td>
                  {/* 관리 버튼 */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      to={`/instructor/course/${course.idx}`}
                      className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                    >
                      <PencilIcon className="h-4 w-4" />
                      관리
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500 p-6">아직 생성한 강좌가 없습니다.</p>
        )}
      </div>
      {/* --- [수정 완료] --- */}
    </div>
  );
}

export default InstructorDashboardPage;
