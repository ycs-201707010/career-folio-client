import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import {
  StarIcon as StarIconSolid,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { StarIcon as StarIconOutline } from "@heroicons/react/24/outline";
import Swal from "sweetalert2";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// 후기 작성 API 함수
const addReview = async ({ courseId, rating, content, token }) => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const { data } = await axios.post(
    `${API_BASE_URL}/api/courses/${courseId}/reviews`,
    { rating, content },
    config
  );
  return data;
};

const ReviewModal = ({ courseId, show, onClose }) => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [content, setContent] = useState("");

  const addReviewMutation = useMutation({
    mutationFn: addReview,
    onSuccess: () => {
      Swal.fire("성공!", "수강평이 성공적으로 등록되었습니다.", "success");
      // 강좌 상세 페이지와 학습 페이지의 쿼리를 모두 무효화하여 갱신 유도
      queryClient.invalidateQueries({ queryKey: ["courseReviews", courseId] });
      queryClient.invalidateQueries({ queryKey: ["course-public", courseId] });
      onClose();
      // 입력 초기화
      setRating(0);
      setContent("");
    },
    onError: (err) => {
      Swal.fire(
        "오류",
        err.response?.data?.message || "후기 등록 실패",
        "error"
      );
    },
  });

  const handleSubmit = () => {
    if (rating === 0) {
      Swal.fire("알림", "별점을 선택해주세요.", "warning");
      return;
    }
    if (!content.trim()) {
      Swal.fire("알림", "수강평 내용을 입력해주세요.", "warning");
      return;
    }
    addReviewMutation.mutate({ courseId, rating, content, token });
  };

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center"
      onClick={onClose} // 배경 클릭 시 닫기
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 z-50 dark:bg-zinc-800 relative"
        onClick={(e) => e.stopPropagation()} // 내부 클릭 시 닫기 방지
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">수강평 작성</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="flex justify-center items-center my-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
              className="text-yellow-400 focus:outline-none transition-transform hover:scale-110"
            >
              {(hoverRating || rating) >= star ? (
                <StarIconSolid className="w-10 h-10" />
              ) : (
                <StarIconOutline className="w-10 h-10" />
              )}
            </button>
          ))}
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="강좌에 대한 솔직한 후기를 남겨주세요. (80% 이상 수강 시 작성 가능)"
          rows="5"
          className="w-full border rounded p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 resize-none"
        ></textarea>

        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="w-1/3 py-2.5 bg-gray-200 text-gray-700 font-semibold rounded-md hover:bg-gray-300"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={addReviewMutation.isPending}
            className="w-2/3 py-2.5 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {addReviewMutation.isPending ? "등록 중..." : "등록하기"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
