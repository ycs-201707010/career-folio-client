import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL = "http://localhost:8080";

function InstructorDashboardPage() {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    const fetchCourses = async () => {
      if (!token) return;
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${token}`, // 요청 헤더에 토큰 추가
          },
        };
        const response = await axios.get(
          `${API_BASE_URL}/api/courses/my-courses`,
          config
        );
        setCourses(response.data);
      } catch (error) {
        console.error("강좌 목록을 불러오는 데 실패했습니다.", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, [token]);

  if (isLoading) {
    return <div className="text-center p-10">로딩 중...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">강사 대시보드</h1>
        <Link
          to="/instructor/course/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
        >
          + 새 강좌 만들기
        </Link>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">
          내 강좌 목록 ({courses.length}개)
        </h2>
        {courses.length > 0 ? (
          <ul className="space-y-4">
            {courses.map((course) => (
              <li
                key={course.idx}
                className="border p-4 rounded-md flex justify-between items-center"
              >
                <div>
                  <h3 className="font-bold">{course.title}</h3>
                  <p className="text-sm text-gray-500">
                    상태: <span className="font-semibold">{course.status}</span>
                  </p>
                </div>
                <Link
                  to={`/instructor/course/${course.idx}`}
                  className="text-blue-600 hover:underline"
                >
                  관리하기
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">아직 생성한 강좌가 없습니다.</p>
        )}
      </div>
    </div>
  );
}

export default InstructorDashboardPage;
