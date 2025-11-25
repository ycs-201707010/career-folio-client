import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useDebounce } from "../hooks/useDebounce";
import {
  MagnifyingGlassIcon,
  PencilSquareIcon,
  ChatBubbleLeftRightIcon,
  EyeIcon,
  HashtagIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/outline";
import { UserCircleIcon } from "@heroicons/react/24/solid";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// --- API 함수 ---
const fetchQuestions = async ({ category, sort, search }) => {
  const params = { category, sort, search };
  const { data } = await axios.get(`${API_BASE_URL}/api/qna`, { params });
  return data;
};

// 카테고리 정의
const CATEGORIES = [
  { id: "all", name: "전체" },
  { id: "tech", name: "IT / 전자" },
  { id: "humanities", name: "인문 / 사회" },
  { id: "service", name: "서비스" },
];

// 날짜 포맷팅 (YYYY-MM-DD)
const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString();

function QnaListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // --- 상태 관리 ---
  const [activeCategory, setActiveCategory] = useState("all");
  const [sortBy, setSortBy] = useState("latest"); // latest, views, answers
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // --- 데이터 조회 ---
  const {
    data: questions,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["questions", activeCategory, sortBy, debouncedSearchTerm],
    queryFn: () =>
      fetchQuestions({
        category: activeCategory,
        sort: sortBy,
        search: debouncedSearchTerm,
      }),
    keepPreviousData: true,
  });

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-5xl mx-auto px-4">
        {/* 1. 헤더 & 글쓰기 버튼 */}
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">지식IN</h1>
            <p className="text-gray-600 mt-1">
              커리어 고민, 기술 질문을 자유롭게 나눠보세요.
            </p>
          </div>
          <Link
            to="/qna/new" // (아직 안 만듦)
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition shadow-sm"
          >
            <PencilSquareIcon className="w-5 h-5" />
            질문하기
          </Link>
        </div>

        {/* 2. 검색 & 필터 바 */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6 space-y-4 md:space-y-0 md:flex md:justify-between md:items-center">
          {/* 카테고리 탭 */}
          <div className="flex space-x-2 overflow-x-auto pb-2 md:pb-0">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat.id
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* 검색 & 정렬 */}
          <div className="flex gap-3 flex-shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="latest">최신순</option>
              <option value="views">조회순</option>
              <option value="answers">답변많은순</option>
            </select>

            <div className="relative w-full md:w-64">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="관심있는 내용을 검색해보세요"
                className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 bg-gray-50"
              />
            </div>
          </div>
        </div>

        {/* 3. 질문 목록 */}
        <div className="space-y-4">
          {isLoading && <div className="text-center py-20">로딩 중...</div>}
          {isError && (
            <div className="text-center py-20 text-red-500">
              오류가 발생했습니다.
            </div>
          )}

          {!isLoading && !isError && questions?.length === 0 && (
            <div className="text-center py-20 text-gray-500 bg-white rounded-lg shadow-sm">
              아직 등록된 질문이 없습니다. 첫 질문을 남겨보세요!
            </div>
          )}

          {!isLoading &&
            questions?.map((q) => (
              <div
                key={q.idx}
                className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition border border-transparent hover:border-blue-200"
              >
                <Link to={`/qna/${q.idx}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-grow pr-4">
                      {/* 제목 */}
                      <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">
                        {q.title}
                      </h3>
                      {/* 본문 미리보기 (마크다운 기호 제거는 복잡하니 일단 텍스트만) */}
                      <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                        {q.content.replace(/[#*`]/g, "")}
                      </p>

                      {/* 태그 & 메타 정보 */}
                      <div className="flex items-center flex-wrap gap-3 text-xs text-gray-500">
                        <span
                          className={`px-2 py-0.5 rounded bg-gray-100 font-medium text-gray-600`}
                        >
                          {CATEGORIES.find((c) => c.id === q.category)?.name ||
                            q.category}
                        </span>

                        <span className="flex items-center gap-1">
                          {q.author_picture ? (
                            <img
                              src={`${API_BASE_URL}/${q.author_picture}`}
                              alt=""
                              className="w-4 h-4 rounded-full"
                            />
                          ) : (
                            <UserCircleIcon className="w-4 h-4" />
                          )}
                          {q.author_nickname || q.author_name}
                        </span>
                        <span>{formatDate(q.created_at)}</span>

                        {/* 태그 */}
                        {q.tags &&
                          q.tags.split(",").map((tag, i) => (
                            <span
                              key={i}
                              className="flex items-center text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded"
                            >
                              <HashtagIcon className="w-3 h-3 mr-0.5" />
                              {tag}
                            </span>
                          ))}
                      </div>
                    </div>

                    {/* 우측 통계 (답변수, 조회수) */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      {/* 해결됨 / 미해결 뱃지 */}
                      <div
                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${
                          q.is_solved
                            ? "bg-green-100 text-green-700 border-green-200"
                            : "bg-gray-50 text-gray-500 border-gray-200"
                        }`}
                      >
                        {q.is_solved ? (
                          <>
                            <CheckBadgeIcon className="w-4 h-4" />
                            <span>해결됨</span>
                          </>
                        ) : (
                          <span>미해결</span>
                        )}
                      </div>

                      <div
                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${
                          q.is_solved
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        <ChatBubbleLeftRightIcon className="w-4 h-4" />
                        <span>{q.answer_count}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <EyeIcon className="w-4 h-4" />
                        <span>{q.view_count}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export default QnaListPage;
