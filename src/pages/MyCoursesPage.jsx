// ** 내가 수강중인 강좌 목록 화면 **

import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL = "http://localhost:8080";

const fetchMyCourses = async (token) => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const { data } = await axios.get(
    `${API_BASE_URL}/api/enrollments/my`,
    config
  );
  return data;
};

// 수강 중인 강좌를 표시하는 카드 컴포넌트
const EnrolledCourseCard = ({ course }) => {
  console.log("EnrolledCourseCard - Received course data:", course);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-shadow duration-300">
      <Link to={`/learn/course/${course.course_idx}`}>
        <div className="h-40 bg-gray-200">
          <img
            src={
              `${API_BASE_URL}/${course.thumbnail_url}` ||
              "https://via.placeholder.com/300x180"
            }
            alt={course.title}
            className="w-full h-full object-cover"
          />
        </div>
      </Link>
      <div className="p-4">
        <h3 className="text-md font-semibold truncate">{course.title}</h3>
        <p className="text-xs text-gray-500 mt-1">
          강사: {course.instructor_name}
        </p>

        {/* 진행률 바 */}
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${course.progress_percent}%` }}
            ></div>
          </div>
          <p className="text-right text-xs text-gray-500 mt-1">
            {course.progress_percent}% 완료
          </p>
        </div>

        <Link
          to={`/learn/course/${course.idx}`}
          className="block w-full text-center mt-3 bg-gray-800 text-white font-semibold py-2 rounded-md hover:bg-gray-700 transition"
        >
          학습하기
        </Link>
      </div>
    </div>
  );
};

function MyCoursesPage() {
  const { token } = useAuth();
  const {
    data: myCourses,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["my-courses"],
    queryFn: () => fetchMyCourses(token),
    enabled: !!token,
  });

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto p-6 ">
        <h1 className="text-3xl font-bold mb-8">나의 학습</h1>

        {isLoading && <p className="text-center">수강 목록을 불러오는 중...</p>}
        {isError && (
          <p className="text-center text-red-500">오류가 발생했습니다.</p>
        )}

        {!isLoading &&
          !isError &&
          (myCourses?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {myCourses.map((course) => (
                <EnrolledCourseCard key={course.idx} course={course} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-lg shadow-md">
              <p className="text-gray-500">아직 수강 중인 강좌가 없습니다.</p>
              <Link
                to="/courses"
                className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
              >
                흥미로운 강좌 찾아보기
              </Link>
            </div>
          ))}
      </div>
    </div>
  );
}

export default MyCoursesPage;
