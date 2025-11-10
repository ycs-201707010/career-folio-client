import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Link } from "react-router-dom";
import { useDebounce } from "../hooks/useDebounce";
import CourseCardSkeleton from "../components/CourseCardSkeleton";
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  NoSymbolIcon,
} from "@heroicons/react/24/outline";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// API 호출 함수
const fetchPublishedCourses = async (searchTerm, sortOptions) => {
  const params = {};

  if (searchTerm) {
    params.search = searchTerm;
  }
  // 3. sortOptions(정렬/필터)를 params에 추가
  if (sortOptions.sort) {
    params.sort = sortOptions.sort;
  }
  if (sortOptions.filter) {
    params.filter = sortOptions.filter;
  }

  const { data } = await axios.get(`${API_BASE_URL}/api/courses`, { params });
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

const FilterModal = ({ isOpen, onClose, sortOptions, setSortOptions }) => {
  if (!isOpen) return null;

  const handleSortChange = (e) => {
    setSortOptions((prev) => ({ ...prev, sort: e.target.value }));
  };

  const handleFilterChange = (e) => {
    setSortOptions((prev) => ({ ...prev, filter: e.target.value }));
  };

  return (
    // 모달 배경 (Backdrop)
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center"
      onClick={onClose}
    >
      {/* 모달 컨텐츠 */}
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 z-50 dark:bg-zinc-800"
        onClick={(e) => e.stopPropagation()} // 모달 클릭 시 닫히는 것 방지
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">정렬 및 필터</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* 모달 폼 */}
        <div className="space-y-6">
          {/* 1. 정렬 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              정렬 기준
            </label>
            <select
              value={sortOptions.sort}
              onChange={handleSortChange}
              className="w-full p-2 border rounded-md dark:bg-zinc-700"
            >
              <option value="created_at_desc">최신순 (기본)</option>
              <option value="rating_desc">별점순</option>
              <option value="price_asc">가격 낮은순</option>
              <option value="price_desc">가격 높은순</option>
            </select>
          </div>

          {/* 2. 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              가격
            </label>
            <div className="space-y-2">
              <RadioOption
                id="filter_all"
                name="filter"
                value=""
                label="전체"
                checked={!sortOptions.filter}
                onChange={handleFilterChange}
              />
              <RadioOption
                id="filter_free"
                name="filter"
                value="free"
                label="무료"
                checked={sortOptions.filter === "free"}
                onChange={handleFilterChange}
              />
              <RadioOption
                id="filter_paid"
                name="filter"
                value="paid"
                label="유료"
                checked={sortOptions.filter === "paid"}
                onChange={handleFilterChange}
              />
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700"
        >
          적용하기
        </button>
      </div>
    </div>
  );
};

const RadioOption = ({ id, name, value, label, checked, onChange }) => (
  <div className="flex items-center">
    <input
      id={id}
      name={name}
      type="radio"
      value={value}
      checked={checked}
      onChange={onChange}
      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
    />
    <label
      htmlFor={id}
      className="ml-3 block text-sm text-gray-900 dark:text-gray-200"
    >
      {label}
    </label>
  </div>
);

function CourseListPage() {
  // 사용자가 입력하는 검색어 (즉시 반영)
  const [searchTerm, setSearchTerm] = useState("");
  // API 호출에 사용할, 지연된(debounced) 검색어
  const debouncedSearchTerm = useDebounce(searchTerm, 500); // 500ms 지연

  // 모달 및 필터/정렬 상태 (API 호출에 역시 사용)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortOptions, setSortOptions] = useState({
    sort: "created_at_desc", // 기본값: 최신순
    filter: "", // 기본값: 전체
  });

  const {
    data: courses,
    isLoading,
    isError,
  } = useQuery({
    // 4. [중요] queryKey에 "debouncedSearchTerm"을 포함해야
    //    검색어가 바뀔 때마다 useQuery가 자동으로 API를 다시 호출합니다.
    queryKey: ["courses", debouncedSearchTerm, sortOptions],
    queryFn: () => fetchPublishedCourses(debouncedSearchTerm, sortOptions),

    // (선택적) 새 검색 결과가 로드되는 동안 이전 데이터를 잠시 보여줘서 깜빡임 방지
    keepPreviousData: true,
  });

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto py-8 px-4 ">
        {/* 검색 */}
        <div className="w-full md:w-8/12 mx-auto mb-6">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="강좌 제목, 내용, 강사명으로 검색..."
              className="w-full p-3 pl-10 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 검색어 입력 시에만 필터 버튼 노출 */}
          {debouncedSearchTerm && (
            <div className="flex justify-end mt-2">
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-700 dark:text-gray-200"
              >
                <AdjustmentsHorizontalIcon className="h-5 w-5" />
                <span>필터 및 정렬</span>
              </button>
            </div>
          )}
        </div>

        <div>
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <CourseCardSkeleton key={index} />
              ))}
            </div>
          )}

          {isError && (
            <p className="text-center text-red-500 py-10">
              강좌를 불러오는 중 오류가 발생했습니다.
            </p>
          )}

          {/* [추가] 로딩이 끝났고, 에러도 없는데, 강좌가 0개일 때 */}
          {!isLoading && !isError && courses && courses.length === 0 && (
            <div className="text-center text-gray-500 py-20">
              <NoSymbolIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold">검색 결과 없음</h3>
              {debouncedSearchTerm ? (
                <p className="mt-2">
                  '
                  <strong className="text-gray-700">
                    {debouncedSearchTerm}
                  </strong>
                  '에 대한 검색 결과가 없습니다.
                </p>
              ) : (
                <p className="mt-2">게시된 강좌가 없습니다.</p>
              )}
            </div>
          )}

          {/* [수정] 로딩이 끝났고, 강좌가 1개 이상일 때만 그리드 표시 */}
          {!isLoading && !isError && courses && courses.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {courses.map((course) => (
                <CourseCard key={course.idx} course={course} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 10. [신규] 모달 렌더링 */}
      <FilterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        sortOptions={sortOptions}
        setSortOptions={setSortOptions}
      />
    </div>
  );
}

export default CourseListPage;
