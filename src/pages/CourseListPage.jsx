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

// API 호출 함수 (변경 없음)
const fetchPublishedCourses = async (searchTerm, sortOptions) => {
  const params = {};
  if (searchTerm) params.search = searchTerm;
  if (sortOptions.sort) params.sort = sortOptions.sort;
  if (sortOptions.filter) params.filter = sortOptions.filter;

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
      // 👇 [수정] 카드 배경: surface, 테두리: outline/20
      className="block bg-surface rounded-lg shadow-sm border border-outline/20 overflow-hidden hover:shadow-md hover:no-underline transition-all duration-300"
    >
      {/* 👇 [수정] 썸네일 영역 배경: surface-container-high */}
      <div className="h-40 bg-surface-container-high">
        {course.thumbnail_url ? (
          <img
            src={`${API_BASE_URL}/${course.thumbnail_url}`}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          // 👇 [수정] 아이콘 색상: on-surface-variant
          <div className="w-full h-full flex items-center justify-center text-on-surface-variant/50 font-medium">
            No Image
          </div>
        )}
      </div>
      <div className="p-4">
        {/* 👇 [수정] 제목: on-surface */}
        <h3 className="text-lg font-bold text-on-surface truncate">
          {course.title}
        </h3>
        {/* 👇 [수정] 강사명: on-surface-variant */}
        <p className="text-sm text-on-surface-variant mt-1">
          강사: {course.instructor_name}
        </p>
        <div className="flex items-center mt-2">
          {/* 별점은 노란색 유지 (테마 무관) */}
          <span className="text-yellow-500 font-bold">★</span>
          {/* 👇 [수정] 점수: on-surface */}
          <span className="text-sm text-on-surface font-medium ml-1">
            {course.avg_rating.toFixed(1)}
          </span>
          {/* 👇 [수정] 리뷰수: on-surface-variant */}
          <span className="text-xs text-on-surface-variant ml-2">
            ({course.review_count}개)
          </span>
        </div>
        <div className="mt-3 text-right">
          {discounted ? (
            <div>
              {/* 👇 [수정] 정가(취소선): on-surface-variant */}
              <span className="text-sm text-on-surface-variant line-through decoration-on-surface-variant">
                ₩{Number(course.price).toLocaleString()}
              </span>
              {/* 👇 [수정] 할인가: error (강조색) */}
              <span className="text-lg font-bold text-error ml-2">
                ₩{Number(course.discount_price).toLocaleString()}
              </span>
            </div>
          ) : (
            // 👇 [수정] 가격: on-surface
            <span className="text-lg font-bold text-on-surface">
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
    // 모달 배경
    <div
      className="fixed inset-0 bg-black/50 z-40 flex justify-center items-center backdrop-blur-sm"
      onClick={onClose}
    >
      {/* 모달 컨텐츠 */}
      {/* 👇 [수정] 배경: bg-surface, 텍스트: text-on-surface */}
      <div
        className="bg-surface text-on-surface rounded-lg shadow-xl w-full max-w-md p-6 z-50 border border-outline/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">정렬 및 필터</h2>
          <button
            onClick={onClose}
            // 👇 [수정] 닫기 버튼: text-on-surface-variant -> hover: text-on-surface
            className="text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* 1. 정렬 */}
          <div>
            <label className="block text-sm font-bold text-on-surface mb-2">
              정렬 기준
            </label>
            {/* 👇 [수정] Select: bg-surface-container, border-outline */}
            <select
              value={sortOptions.sort}
              onChange={handleSortChange}
              className="w-full p-2 border border-outline/30 rounded-md bg-surface-container text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
            >
              <option value="created_at_desc">최신순 (기본)</option>
              <option value="rating_desc">별점순</option>
              <option value="price_asc">가격 낮은순</option>
              <option value="price_desc">가격 높은순</option>
            </select>
          </div>

          {/* 2. 필터 */}
          <div>
            <label className="block text-sm font-bold text-on-surface mb-2">
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

        {/* 👇 [수정] 적용 버튼: bg-primary, text-on-primary */}
        <button
          onClick={onClose}
          className="w-full mt-6 py-2.5 bg-primary text-primary-on font-bold rounded-md hover:bg-primary/90 transition-colors shadow-sm"
        >
          적용하기
        </button>
      </div>
    </div>
  );
};

const RadioOption = ({ id, name, value, label, checked, onChange }) => (
  <div className="flex items-center">
    {/* 👇 [수정] 라디오: text-primary, border-outline */}
    <input
      id={id}
      name={name}
      type="radio"
      value={value}
      checked={checked}
      onChange={onChange}
      className="h-4 w-4 text-primary border-outline/50 focus:ring-primary bg-surface"
    />
    {/* 👇 [수정] 라벨: text-on-surface */}
    <label htmlFor={id} className="ml-3 block text-sm text-on-surface">
      {label}
    </label>
  </div>
);

function CourseListPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortOptions, setSortOptions] = useState({
    sort: "created_at_desc",
    filter: "",
  });

  const {
    data: courses,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["courses", debouncedSearchTerm, sortOptions],
    queryFn: () => fetchPublishedCourses(debouncedSearchTerm, sortOptions),
    keepPreviousData: true,
  });

  return (
    // 👇 [수정] 페이지 배경: bg-surface-container (카드가 surface이므로 배경은 살짝 어둡게)
    <div className="min-h-screen bg-surface-container transition-colors duration-300">
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* 검색 */}
        <div className="w-full md:w-8/12 mx-auto mb-6">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              {/* 👇 [수정] 아이콘: text-on-surface-variant */}
              <MagnifyingGlassIcon className="h-5 w-5 text-on-surface-variant" />
            </div>
            {/* 👇 [수정] 검색창: bg-surface, text-on-surface, border-outline */}
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="강좌 제목, 내용, 강사명으로 검색..."
              className="w-full p-3 pl-10 bg-surface text-on-surface border border-outline/30 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-on-surface-variant/50 transition-colors"
            />
          </div>

          {debouncedSearchTerm && (
            <div className="flex justify-end mt-2">
              <button
                onClick={() => setIsModalOpen(true)}
                // 👇 [수정] 필터 버튼: bg-surface-container-high (중립 버튼), text-on-surface
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-on-surface bg-surface-container-high hover:bg-surface-container-high/80 transition-colors border border-outline/10"
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
            // 👇 [수정] 에러 텍스트: text-error
            <p className="text-center text-error py-10 font-medium">
              강좌를 불러오는 중 오류가 발생했습니다.
            </p>
          )}

          {!isLoading && !isError && courses && courses.length === 0 && (
            <div className="text-center py-20">
              {/* 👇 [수정] 아이콘: text-on-surface-variant */}
              <NoSymbolIcon className="w-16 h-16 mx-auto text-on-surface-variant/50 mb-4" />
              <h3 className="text-xl font-bold text-on-surface">
                검색 결과 없음
              </h3>
              {debouncedSearchTerm ? (
                <p className="mt-2 text-on-surface-variant">
                  '
                  <strong className="text-on-surface">
                    {debouncedSearchTerm}
                  </strong>
                  '에 대한 검색 결과가 없습니다.
                </p>
              ) : (
                <p className="mt-2 text-on-surface-variant">
                  게시된 강좌가 없습니다.
                </p>
              )}
            </div>
          )}

          {!isLoading && !isError && courses && courses.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {courses.map((course) => (
                <CourseCard key={course.idx} course={course} />
              ))}
            </div>
          )}
        </div>
      </div>

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
