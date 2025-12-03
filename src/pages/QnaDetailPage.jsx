// ** 지식IN 상세 페이지 (AI 답변 + 채택/투표 + 프로필링크 포함) **
import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import MDEditor from "@uiw/react-md-editor";
import {
  HandThumbUpIcon,
  HandThumbDownIcon,
  CheckBadgeIcon,
  TrashIcon,
  UserCircleIcon,
  SparklesIcon, // 👈 AI 아이콘
  ChatBubbleLeftRightIcon,
  EyeIcon,
} from "@heroicons/react/24/solid";
import {
  HandThumbUpIcon as HandThumbUpOutline,
  HandThumbDownIcon as HandThumbDownOutline,
} from "@heroicons/react/24/outline";
import Swal from "sweetalert2";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// --- API 함수 ---
const fetchQuestionDetail = async (id) => {
  const { data } = await axios.get(`${API_BASE_URL}/api/qna/${id}`);
  return data; // { question: {...}, answers: [...] }
};

const createAnswer = async ({ questionId, content, token }) => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const { data } = await axios.post(
    `${API_BASE_URL}/api/qna/${questionId}/answers`,
    { content },
    config
  );
  return data;
};

const adoptAnswer = async ({ questionId, answerId, token }) => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const { data } = await axios.post(
    `${API_BASE_URL}/api/qna/${questionId}/answers/${answerId}/adopt`,
    {},
    config
  );
  return data;
};

const voteAnswer = async ({ answerId, voteType, token }) => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const { data } = await axios.post(
    `${API_BASE_URL}/api/qna/answers/${answerId}/vote`,
    { voteType },
    config
  );
  return data;
};

const deleteItem = async ({ type, id, token }) => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const url =
    type === "questions"
      ? `${API_BASE_URL}/api/qna/${id}`
      : `${API_BASE_URL}/api/qna/answers/${id}`;
  const { data } = await axios.delete(url, config);
  return data;
};

// ----------------------------------------
// --- 컴포넌트: 답변 아이템 ---
// ----------------------------------------
const AnswerItem = ({
  answer,
  questionAuthorId,
  isQuestionSolved,
  onAdopt,
  onDelete,
}) => {
  const { user, token } = useAuth();
  const queryClient = useQueryClient();

  // 투표 Mutation
  const voteMutation = useMutation({
    mutationFn: ({ voteType }) =>
      voteAnswer({
        answerId: answer.idx,
        voteType,
        token,
      }), // (간단히 token 가져옴)
    onSuccess: (data) => {
      // 투표 성공 시 캐시 갱신 (좋아요 수 업데이트)
      queryClient.invalidateQueries({ queryKey: ["questionDetail"] });
    },
    onError: () => Swal.fire("오류", "로그인이 필요합니다.", "error"),
  });

  // 본인 글인지 확인
  const isMyAnswer = user && user.userIdx === answer.user_idx;
  // 질문 작성자인지 확인 (채택 권한)
  const isQuestionAuthor = user && user.userIdx === questionAuthorId;

  return (
    <div
      className={`flex gap-4 p-6 bg-white rounded-lg shadow-sm border ${
        answer.is_adopted
          ? "border-green-500 ring-1 ring-green-500"
          : "border-gray-200"
      }`}
    >
      {/* 1. 좌측: 투표 및 채택 상태 */}
      <div className="flex flex-col items-center gap-2 min-w-[50px]">
        <button
          onClick={() => voteMutation.mutate({ voteType: "like" })}
          className="text-gray-400 hover:text-blue-600 transition"
        >
          <HandThumbUpOutline className="w-8 h-8" />
        </button>
        <span className="font-bold text-lg text-gray-700">
          {answer.like_count || 0}
        </span>
        <button
          onClick={() => voteMutation.mutate({ voteType: "dislike" })}
          className="text-gray-400 hover:text-red-600 transition"
        >
          <HandThumbDownOutline className="w-8 h-8" />
        </button>

        {/* 채택 표시 */}
        {answer.is_adopted && (
          <div className="mt-4 flex flex-col items-center text-green-600">
            <CheckBadgeIcon className="w-10 h-10" />
            <span className="text-xs font-bold">채택됨</span>
          </div>
        )}
      </div>

      {/* 2. 우측: 본문 및 메타데이터 */}
      <div className="flex-grow min-w-0">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            {answer.author_picture ? (
              <img
                src={`${API_BASE_URL}/${answer.author_picture}`}
                alt=""
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <UserCircleIcon className="w-8 h-8 text-gray-300" />
            )}
            <div>
              {/* 👇 [수정] 작성자 프로필 링크 연결 */}
              <Link
                to={`/profile/${answer.author_id}`}
                className="text-sm font-bold text-gray-900 hover:text-blue-600 hover:underline"
              >
                {answer.author_name}
              </Link>
              <p className="text-xs text-gray-500">
                {new Date(answer.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          {/* 삭제 버튼 */}
          {(isMyAnswer || user?.role === "admin") && (
            <button
              onClick={onDelete}
              className="text-gray-400 hover:text-red-500"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        <div data-color-mode="light" className="prose max-w-none mb-6">
          <MDEditor.Markdown
            source={answer.content}
            style={{ backgroundColor: "white", color: "#333" }}
          />
        </div>

        {/* 채택 버튼 (질문 작성자만 보임 + 아직 해결 안 된 질문일 때) */}
        {isQuestionAuthor && !isQuestionSolved && (
          <button
            onClick={onAdopt}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-md hover:bg-green-100 transition text-sm font-semibold"
          >
            <CheckBadgeIcon className="w-5 h-5" /> 이 답변 채택하기
          </button>
        )}
      </div>
    </div>
  );
};

// ----------------------------------------
// --- 메인 페이지 컴포넌트 ---
// ----------------------------------------
function QnaDetailPage() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [answerContent, setAnswerContent] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["questionDetail", id],
    queryFn: () => fetchQuestionDetail(id),
    refetchInterval: 5000, // (선택) AI 답변 확인을 위해 5초마다 자동 갱신 (필요 없으면 삭제)
  });

  // Mutations
  const createAnswerMutation = useMutation({
    mutationFn: () =>
      createAnswer({ questionId: id, content: answerContent, token }),
    onSuccess: () => {
      Swal.fire("등록 완료", "답변이 등록되었습니다.", "success");
      queryClient.invalidateQueries({ queryKey: ["questionDetail", id] });
      setAnswerContent("");
    },
    onError: (err) =>
      Swal.fire("오류", err.response?.data?.message || "등록 실패", "error"),
  });

  const adoptMutation = useMutation({
    mutationFn: (answerId) => adoptAnswer({ questionId: id, answerId, token }),
    onSuccess: () => {
      Swal.fire("채택 완료", "답변을 채택했습니다.", "success");
      queryClient.invalidateQueries({ queryKey: ["questionDetail", id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteItem,
    onSuccess: (data, variables) => {
      Swal.fire("삭제 완료", "성공적으로 삭제되었습니다.", "success");
      if (variables.type === "questions") {
        navigate("/qna");
      } else {
        queryClient.invalidateQueries({ queryKey: ["questionDetail", id] });
      }
    },
  });

  if (isLoading) return <div className="p-10 text-center">로딩 중...</div>;
  if (isError || !data)
    return (
      <div className="p-10 text-center text-red-500">
        질문을 찾을 수 없습니다.
      </div>
    );

  const { question, answers } = data;
  const isMyQuestion = user && user.userIdx === question.user_idx;

  // --- 👇 [핵심] AI 답변과 사람 답변 분리 ---
  // (DB의 answers 테이블에 is_ai 컬럼이 있어야 함)
  const aiAnswer = answers.find((a) => a.is_ai);
  const humanAnswers = answers.filter((a) => !a.is_ai);

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-5xl mx-auto px-4">
        {/* --- 1. 질문 영역 --- */}
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 mb-8">
          {/* 질문 헤더 */}
          <div className="flex justify-between items-start border-b pb-4 mb-6">
            <div className="flex-grow">
              <div className="flex items-center gap-3 mb-3">
                {question.is_solved ? (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-green-100 text-green-700 text-xs font-bold border border-green-200">
                    <CheckBadgeIcon className="w-4 h-4" /> 해결됨
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-500 text-xs font-bold border border-gray-200">
                    미해결
                  </span>
                )}
                <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-md text-xs font-bold border border-blue-100">
                  {question.category}
                </span>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {question.title}
              </h1>

              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  {question.author_picture ? (
                    <img
                      src={`${API_BASE_URL}/${question.author_picture}`}
                      className="w-5 h-5 rounded-full"
                    />
                  ) : (
                    <UserCircleIcon className="w-5 h-5" />
                  )}

                  {/* 👇 [수정] 질문자 프로필 링크 */}
                  <Link
                    to={`/profile/${question.author_id}`}
                    className="hover:text-blue-600 hover:underline text-gray-700 font-medium"
                  >
                    {question.author_nickname || question.author_name}
                  </Link>
                </span>
                <span>{new Date(question.created_at).toLocaleString()}</span>
                <span className="flex items-center gap-1">
                  <EyeIcon className="w-4 h-4" /> {question.view_count}
                </span>
                <span className="flex items-center gap-1">
                  <ChatBubbleLeftRightIcon className="w-4 h-4" />{" "}
                  {question.answer_count}
                </span>
              </div>
            </div>

            {(isMyQuestion || user?.role === "admin") && (
              <button
                onClick={() => {
                  if (window.confirm("정말 삭제하시겠습니까?"))
                    deleteMutation.mutate({
                      type: "questions",
                      id: question.idx,
                      token,
                    });
                }}
                className="text-gray-400 hover:text-red-500 p-1"
              >
                <TrashIcon className="w-6 h-6" />
              </button>
            )}
          </div>

          <div
            data-color-mode="light"
            className="prose max-w-none min-h-[150px]"
          >
            <MDEditor.Markdown
              source={question.content}
              style={{ backgroundColor: "white", color: "#333" }}
            />
          </div>

          {question.tags && question.tags.length > 0 && (
            <div className="flex gap-2 mt-8">
              {/* (태그가 콤마로 구분된 문자열로 올 경우 처리) */}
              {(Array.isArray(question.tags)
                ? question.tags
                : question.tags.split(",")
              ).map((tag, i) => (
                <span
                  key={i}
                  className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm font-medium"
                >
                  # {tag.trim()}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* --- 👇 2. [신규] AI 답변 전용 공간 --- */}
        {aiAnswer && (
          <div className="mb-8 bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 p-[2px] rounded-lg shadow-md">
            <div className="bg-white rounded-md p-6">
              <div className="flex items-center gap-2 mb-4 text-purple-600 font-bold text-lg">
                <SparklesIcon className="w-6 h-6 animate-pulse" />
                <span>Gemini AI의 답변</span>
              </div>
              <div data-color-mode="light" className="prose max-w-none">
                <MDEditor.Markdown
                  source={aiAnswer.content}
                  style={{ backgroundColor: "white", color: "#333" }}
                />
              </div>
              <div className="mt-4 pt-4 border-t text-xs text-gray-400 text-right">
                * AI가 생성한 답변은 정확하지 않을 수 있습니다.
              </div>
            </div>
          </div>
        )}

        {/* --- 3. 사람 답변 목록 --- */}
        <div className="mb-10">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            {humanAnswers.length}개의 답변
          </h3>
          <div className="space-y-4">
            {humanAnswers.map((answer) => (
              <AnswerItem
                key={answer.idx}
                answer={answer}
                questionAuthorId={question.user_idx}
                isQuestionSolved={question.is_solved}
                onAdopt={() => {
                  if (window.confirm("이 답변을 채택하시겠습니까?"))
                    adoptMutation.mutate(answer.idx);
                }}
                onDelete={() => {
                  if (window.confirm("답변을 삭제하시겠습니까?"))
                    deleteMutation.mutate({
                      type: "answers",
                      id: answer.idx,
                      token,
                    });
                }}
              />
            ))}
          </div>
        </div>

        {/* --- 4. 답변 작성 에디터 --- */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            답변 작성하기
          </h3>
          {user ? (
            <>
              <div
                data-color-mode="light"
                className="mb-4 border rounded-md overflow-hidden"
              >
                <MDEditor
                  value={answerContent}
                  onChange={setAnswerContent}
                  height={300}
                  preview="live"
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => createAnswerMutation.mutate()}
                  disabled={createAnswerMutation.isPending}
                  className="px-6 py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition"
                >
                  {createAnswerMutation.isPending ? "등록 중..." : "답변 등록"}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-md border border-dashed border-gray-300">
              <p className="text-gray-600 mb-2">
                답변을 작성하려면 로그인이 필요합니다.
              </p>
              <Link
                to="/login"
                className="text-blue-600 font-bold hover:underline"
              >
                로그인하러 가기
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default QnaDetailPage;
