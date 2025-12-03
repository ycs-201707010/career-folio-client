// src/components/BadgeSettingsModal.jsx
import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { XMarkIcon, CheckCircleIcon } from "@heroicons/react/24/solid";
import Swal from "sweetalert2";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const updateRepresentativeBadges = async ({ badgeIdxs, token }) => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const { data } = await axios.put(
    `${API_BASE_URL}/api/profile/badges/representative`,
    { badgeIdxs },
    config
  );
  return data;
};

const BadgeSettingsModal = ({ show, onClose, allBadges, profileId }) => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  // 선택된 뱃지의 ID들을 관리하는 state
  const [selectedIds, setSelectedIds] = useState([]);

  // 모달 열릴 때 초기값 세팅
  useEffect(() => {
    if (show && allBadges) {
      const currentRep = allBadges
        .filter((b) => b.is_representative)
        .map((b) => b.badge_idx);
      setSelectedIds(currentRep);
    }
  }, [show, allBadges]);

  const mutation = useMutation({
    mutationFn: updateRepresentativeBadges,
    onSuccess: () => {
      Swal.fire("저장 완료", "대표 뱃지가 설정되었습니다.", "success");
      // 프로필 데이터 갱신
      queryClient.invalidateQueries({ queryKey: ["publicProfile", profileId] });
      onClose();
    },
    onError: (err) =>
      Swal.fire("오류", err.response?.data?.message || "저장 실패", "error"),
  });

  const toggleSelection = (badgeId) => {
    if (selectedIds.includes(badgeId)) {
      // 이미 선택됨 -> 해제
      setSelectedIds((prev) => prev.filter((id) => id !== badgeId));
    } else {
      // 미선택 -> 추가 (3개 제한)
      if (selectedIds.length >= 5) {
        return Swal.fire(
          "알림",
          "대표 뱃지는 최대 5개까지만 선택할 수 있습니다.",
          "warning"
        );
      }
      setSelectedIds((prev) => [...prev, badgeId]);
    }
  };

  const handleSave = () => {
    mutation.mutate({ badgeIdxs: selectedIds, token });
  };

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">대표 뱃지 설정</h2>
          <button onClick={onClose}>
            <XMarkIcon className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          프로필 상단에 노출할 뱃지를 선택해주세요. (최대 5개)
        </p>

        <div className="grid grid-cols-4 gap-4 mb-6 max-h-96 overflow-y-auto p-2">
          {allBadges.map((badge) => {
            const isSelected = selectedIds.includes(badge.badge_idx);
            return (
              <div
                key={badge.badge_idx}
                onClick={() => toggleSelection(badge.badge_idx)}
                className={`relative cursor-pointer p-2 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                  isSelected
                    ? "border-blue-500 bg-blue-50"
                    : "border-transparent hover:bg-gray-100"
                }`}
              >
                <img
                  src={`${API_BASE_URL}/uploads/${badge.image_url}`}
                  alt={badge.badge_name}
                  className="w-12 h-12 object-contain"
                />
                <span className="text-xs text-center font-medium truncate w-full">
                  {badge.badge_name}
                </span>

                {isSelected && (
                  <div className="absolute top-1 right-1">
                    <CheckCircleIcon className="w-5 h-5 text-blue-600" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={mutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {mutation.isPending
              ? "저장 중..."
              : `저장 (${selectedIds.length}/5)`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BadgeSettingsModal;
