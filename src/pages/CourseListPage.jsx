import React from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Link } from "react-router-dom";
import CourseCardSkeleton from "../components/CourseCardSkeleton";

const API_BASE_URL = "http://localhost:8080";

// API 호출 함수
const fetchPublishedCourses = async () => {
  const { data } = await axios.get(`${API_BASE_URL}/api/courses`);
  return data;
};

// 개별 강좌를 표시하는 카드 컴포넌트
function CourseCard({ course }) {
  const discounted =
    course.discount_price !== null && course.discount_price < course.price;

  return (
    <Link
      to={`/course/${course.idx}`}
      className=" block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl hover:no-underline transition-shadow duration-300"
    >
      <div className="h-40 bg-gray-200">
        {/* 썸네일 이미지가 있다면 표시, 없다면 회색 박스 */}
        {course.thumbnail_url ? (
          <img
            src={`${API_BASE_URL}/${course.thumbnail_url}`}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No Image
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold truncate">{course.title}</h3>
        <p className="text-sm text-gray-500 mt-1">
          강사: {course.instructor_name}
        </p>
        <div className="flex items-center mt-2">
          {/* 별점 표시 (간단한 버전) */}
          <span className="text-yellow-500 font-bold">★</span>
          <span className="text-sm text-gray-600 ml-1">
            {course.avg_rating.toFixed(1)}
          </span>
          <span className="text-xs text-gray-400 ml-2">
            ({course.review_count}개)
          </span>
        </div>
        <div className="mt-3 text-right">
          {discounted ? (
            <div>
              <span className="text-sm text-gray-400 line-through">
                ₩{Number(course.price).toLocaleString()}
              </span>
              <span className="text-lg font-bold text-red-500 ml-2">
                ₩{Number(course.discount_price).toLocaleString()}
              </span>
            </div>
          ) : (
            <span className="text-lg font-bold">
              ₩{Number(course.price).toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function CourseListPage() {
  const {
    data: courses,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["courses"],
    queryFn: fetchPublishedCourses,
  });

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-center mb-8">전체 강좌 목록</h1>

        {/* TODO: 여기에 검색 및 필터링 UI가 들어올 예정입니다. */}
        {isError && (
          <p className="text-center text-red-500">오류가 발생했습니다.</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading &&
            Array.from({ length: 8 }).map((_, index) => (
              <CourseCardSkeleton key={index} />
            ))}

          {!isLoading &&
            courses &&
            courses.map((course) => (
              <CourseCard key={course.idx} course={course} />
            ))}
        </div>
      </div>
    </div>
  );
}

export default CourseListPage;
