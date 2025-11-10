import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2"; // 커스텀 alert 창 라이브러리 임포트

// Dnd-kit 라이브러리 import (DragOverlay 추가)
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const API_BASE_URL = "http://localhost:8080";

// --- API 함수들 (이전과 동일) ---

// 섹션 추가
const addSection = async ({ courseId, title, token }) => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const { data } = await axios.post(
    `${API_BASE_URL}/api/courses/${courseId}/sections`,
    { title },
    config
  );
  return data;
};
// 강의 추가
const addLecture = async ({ sectionId, formData, token }) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  };
  const { data } = await axios.post(
    `${API_BASE_URL}/api/courses/sections/${sectionId}/lectures`,
    formData,
    config
  );
  return data;
};
// 섹션 순서 변경
const reorderSections = async ({ reorderedSections, token }) => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const { data } = await axios.patch(
    `${API_BASE_URL}/api/courses/sections/reorder`,
    { sections: reorderedSections },
    config
  );
  return data;
};
// 강의 순서 변경
const reorderLectures = async ({ reorderedLectures, token }) => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const { data } = await axios.patch(
    `${API_BASE_URL}/api/courses/lectures/reorder`,
    { lectures: reorderedLectures },
    config
  );
  return data;
};
// 섹션 수정
const updateSection = async ({ sectionId, title, token }) => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const { data } = await axios.put(
    `${API_BASE_URL}/api/courses/sections/${sectionId}`,
    { title },
    config
  );
  return data;
};
// 섹션 삭제
const deleteSection = async ({ sectionId, token }) => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const { data } = await axios.delete(
    `${API_BASE_URL}/api/courses/sections/${sectionId}`,
    config
  );
  return data;
};
// 강의 수정
const updateLecture = async ({ lectureId, formData, token }) => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const { data } = await axios.put(
    `${API_BASE_URL}/api/courses/lectures/${lectureId}`,
    formData,
    config
  );
  return data;
};
// 강의 삭제
const deleteLecture = async ({ lectureId, token }) => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const { data } = await axios.delete(
    `${API_BASE_URL}/api/courses/lectures/${lectureId}`,
    config
  );
  return data;
};

// --- Draggable 컴포넌트들 ---
// DragOverlay에 표시될 강의 아이템 미리보기
function LectureDragPreview({ lecture }) {
  return (
    <li className="text-sm text-gray-700 flex items-center gap-2 p-2 bg-white rounded border shadow-lg">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>
      {lecture.order}. {lecture.title}
    </li>
  );
}

// ** Draggable 강의 아이템 (isDragging prop 추가)**
function SortableLectureItem({ lecture, queryClient, token, courseIdx }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `lecture-${lecture.idx}` });
  const [isEditing, setIsEditing] = useState(false);

  // 수정 폼을 위한 별도의 상태
  const [editForm, setEditForm] = useState({
    title: lecture.title,
    duration_seconds: lecture.duration_seconds,
    video_url: lecture.video_url,
    videoFile: null,
  });

  // 'keep', 'upload', 'url'
  const [editUploadType, setEditUploadType] = useState("keep");

  const isUploadedFile = lecture.video_url.startsWith("uploads/");

  const updateMutation = useMutation({
    mutationFn: updateLecture,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["course", String(courseIdx)],
      });
      setIsEditing(false);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteLecture,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["course", String(courseIdx)],
      });
    },
  });

  const handleUpdate = () => {
    const formData = new FormData();
    let hasChanges = false;

    if (editForm.title.trim() && editForm.title !== lecture.title) {
      formData.append("title", editForm.title);
      hasChanges = true;
    }

    // (★★수정★★) duration_seconds는 항상 보내도록 (값이 같더라도) - NOT NULL 제약조건 때문
    // formData.append("duration_seconds", editForm.duration_seconds || 0); // 빈 값이면 0으로 보냄

    if (
      editForm.duration_seconds &&
      editForm.duration_seconds !== lecture.duration_seconds
    ) {
      formData.append("duration_seconds", editForm.duration_seconds);
      hasChanges = true;
    } else if (editForm.duration_seconds === undefined) {
      formData.append("duration_seconds", 0); // 빈 값이면 0으로 보냄
    }

    // 업로드 타입을 upload로 결정하고 비디오 파일이 존재할 경우
    if (editUploadType === "upload" && editForm.videoFile) {
      formData.append("video", editForm.videoFile);
      hasChanges = true;
    }
    // 업로드 타입이 url이고, 기존에 등록되어 있던 URL과 다를 경우
    else if (
      editUploadType === "url" &&
      editForm.video_url.trim() &&
      editForm.video_url !== lecture.video_url
    ) {
      // URL 링크가 변경된 경우
      formData.append("video_url", editForm.video_url);
      hasChanges = true;
    }

    if (hasChanges) {
      updateMutation.mutate({ lectureId: lecture.idx, formData, token });
    } else {
      setIsEditing(false); // 변경사항 없으면 그냥 닫기
    }
  };

  const handleDelete = () => {
    if (window.confirm(`'${lecture.title}' 강의를 정말 삭제하시겠습니까?`)) {
      deleteMutation.mutate({ lectureId: lecture.idx, token });
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
    // 수정 모드 진입 시 상태 초기화
    setEditForm({
      title: lecture.title,
      duration_seconds: lecture.duration_seconds,
      video_url: lecture.video_url,
      videoFile: null,
    });
    setEditUploadType("keep");
  };

  if (isEditing) {
    // --- 수정 모드 UI ---
    return (
      <li
        ref={setNodeRef}
        style={{ transform: CSS.Transform.toString(transform), transition }}
        className="text-sm p-3 bg-white rounded border-2 border-blue-500 shadow-lg space-y-3"
      >
        {/* 제목 입력 */}
        <input
          type="text"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          className="w-full text-sm font-semibold border-b focus:outline-none"
        />

        {/* (★★수정★★) 영상 길이 입력 (항상 표시) */}
        <input
          type="number"
          value={editForm.duration_seconds}
          onChange={(e) =>
            setEditForm({ ...editForm, duration_seconds: e.target.value })
          }
          className="w-full text-sm border-b focus:outline-none mt-1"
          placeholder="영상 길이(초)"
          min="0" // 음수 입력 방지
        />

        {/* 영상 소스 수정 옵션 */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-600 block">
            영상 소스 변경
          </label>
          <div className="flex gap-4 text-xs">
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name={`editUploadType-${lecture.idx}`}
                value="keep"
                checked={editUploadType === "keep"}
                onChange={() => setEditUploadType("keep")}
              />{" "}
              기존 영상 유지
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name={`editUploadType-${lecture.idx}`}
                value="upload"
                checked={editUploadType === "upload"}
                onChange={() => setEditUploadType("upload")}
              />{" "}
              파일로 교체
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name={`editUploadType-${lecture.idx}`}
                value="url"
                checked={editUploadType === "url"}
                onChange={() => setEditUploadType("url")}
              />{" "}
              URL로 교체
            </label>
          </div>

          {editUploadType === "upload" && (
            <input
              type="file"
              accept="video/*"
              onChange={(e) =>
                setEditForm({ ...editForm, videoFile: e.target.files[0] })
              }
              className="w-full text-xs block"
            />
          )}
          {editUploadType === "url" && (
            <input
              type="text"
              value={editForm.video_url}
              onChange={(e) =>
                setEditForm({ ...editForm, video_url: e.target.value })
              }
              className="w-full text-xs border-b focus:outline-none"
              placeholder="새로운 동영상 URL"
            />
          )}
        </div>

        <div className="flex justify-end gap-2 mt-2">
          <button
            onClick={() => setIsEditing(false)}
            className="text-xs px-3 py-1 bg-gray-200 rounded"
          >
            취소
          </button>
          <button
            onClick={handleUpdate}
            className="text-xs px-3 py-1 bg-blue-600 text-white rounded"
            disabled={updateMutation.isPending}
          >
            {" "}
            {updateMutation.isPending ? "저장 중..." : "저장"}{" "}
          </button>
        </div>
      </li>
    );
  }

  // --- 일반 모드 UI ---
  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className="text-sm flex items-center gap-2 p-2 bg-white rounded border touch-none group"
    >
      <div {...attributes} {...listeners} className="cursor-grab p-1">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </div>
      <span className="flex-1 text-gray-700">
        {lecture.order}. {lecture.title} ({lecture.duration_seconds}초)
      </span>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleEditClick}
          className="text-gray-400 hover:text-blue-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>
        </button>
        <button
          onClick={handleDelete}
          className="text-gray-400 hover:text-red-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </li>
  );
} // ** End of SortableLectureItem **

// ** Draggable 섹션 아이템 (isOver, activeId prop 추가 및 하이라이트 로직) **
function SortableSectionItem({
  course,
  section,
  token,
  queryClient,
  activeId,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id: `section-${section.idx}` });
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(section.title);

  const updateMutation = useMutation({
    mutationFn: updateSection,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["course", String(course.idx)],
      });
      setIsEditing(false);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteSection,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["course", String(course.idx)],
      });
    },
  });

  const handleUpdate = () => {
    if (editedTitle.trim() === section.title || !editedTitle.trim()) {
      setIsEditing(false);
      return;
    }
    updateMutation.mutate({
      sectionId: section.idx,
      title: editedTitle,
      token,
    });
  };
  const handleDelete = () => {
    if (
      window.confirm(
        `'${section.title}' 섹션을 정말 삭제하시겠습니까?\n섹션 안의 모든 강의도 함께 삭제됩니다.`
      )
    ) {
      deleteMutation.mutate({ sectionId: section.idx, token });
    }
  };

  // ... (기존의 시각적 피드백 및 강의 추가 로직은 동일) ...
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const isDropZone = isOver && activeId && activeId.startsWith("lecture-");
  const [showAddLecture, setShowAddLecture] = useState(false);
  const [uploadType, setUploadType] = useState("upload");
  const [lectureData, setLectureData] = useState({
    title: "",
    videoFile: null,
    video_url: "",
    duration_seconds: "",
  });
  const lectureMutation = useMutation({
    mutationFn: addLecture,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["course", String(course.idx)],
      });
      setShowAddLecture(false);
      setLectureData({
        title: "",
        videoFile: null,
        video_url: "",
        duration_seconds: "",
      });
      setUploadType("upload");
    },
    onError: (error) =>
      alert(error.response?.data?.message || "강의 추가 실패"),
  });

  const handleLectureSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("title", lectureData.title);
    formData.append("duration_seconds", lectureData.duration_seconds);
    formData.append("uploadType", uploadType);
    if (uploadType === "upload" && lectureData.videoFile) {
      formData.append("video", lectureData.videoFile);
    } else if (uploadType === "url" && lectureData.video_url) {
      formData.append("video_url", lectureData.video_url);
    } else {
      alert("동영상 파일 또는 URL을 입력해주세요.");
      return;
    }
    lectureMutation.mutate({ sectionId: section.idx, formData, token });
  };
  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setLectureData({ ...lectureData, videoFile: e.target.files[0] });
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-4 rounded-md border touch-none transition-colors ${
        isDropZone ? "bg-blue-100 border-blue-400" : "bg-gray-50"
      }`}
    >
      <div className="flex items-center mb-3">
        <div {...attributes} {...listeners} className="cursor-grab p-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </div>
        {isEditing ? (
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onBlur={handleUpdate}
            onKeyDown={(e) => e.key === "Enter" && handleUpdate()}
            autoFocus
            className="font-bold text-lg flex-1 border-b-2 border-blue-500 focus:outline-none bg-transparent"
          />
        ) : (
          <h3 className="font-bold text-lg flex-1">
            {section.order}. {section.title}
          </h3>
        )}
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={() => setIsEditing(true)}
            className="text-gray-400 hover:text-blue-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </button>
          <button
            onClick={handleDelete}
            className="text-gray-400 hover:text-red-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
      <SortableContext
        items={(section.lectures || []).map((l) => `lecture-${l.idx}`)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="ml-4 space-y-2">
          {(section.lectures || [])
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((lecture) => (
              <SortableLectureItem
                key={lecture.idx}
                lecture={lecture}
                queryClient={queryClient}
                token={token}
                courseIdx={course.idx}
              />
            ))}
        </ul>
      </SortableContext>
      {isDropZone && (
        <div className="ml-4 mt-2 p-4 border-2 border-dashed border-blue-400 rounded-md flex justify-center items-center">
          <span className="text-blue-500 font-bold text-lg">+</span>
        </div>
      )}
      <div className="mt-4 ml-4">
        {/* 강의 추가 */}
        {showAddLecture ? (
          <form
            onSubmit={handleLectureSubmit}
            className="space-y-3 p-3 bg-white border rounded-md"
          >
            <input
              type="text"
              placeholder="강의 제목"
              value={lectureData.title}
              onChange={(e) =>
                setLectureData({ ...lectureData, title: e.target.value })
              }
              className="w-full border px-2 py-1 rounded text-sm"
              required
            />
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name={`uploadType-${section.idx}`}
                  value="upload"
                  checked={uploadType === "upload"}
                  onChange={() => setUploadType("upload")}
                  className="form-radio"
                />
                직접 업로드
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name={`uploadType-${section.idx}`}
                  value="url"
                  checked={uploadType === "url"}
                  onChange={() => setUploadType("url")}
                  className="form-radio"
                />
                URL 링크
              </label>
            </div>
            {uploadType === "upload" ? (
              <div>
                <label className="text-xs text-gray-600">동영상 파일</label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="w-full text-sm block border rounded p-1"
                  required
                />
              </div>
            ) : (
              <div>
                <label className="text-xs text-gray-600">동영상 URL</label>
                <input
                  type="text"
                  placeholder="유튜브, Vimeo 등 동영상 URL"
                  value={lectureData.video_url}
                  onChange={(e) =>
                    setLectureData({
                      ...lectureData,
                      video_url: e.target.value,
                    })
                  }
                  className="w-full border px-2 py-1 rounded text-sm"
                  required
                />
              </div>
            )}
            <input
              type="number"
              placeholder="영상 길이 (초)"
              value={lectureData.duration_seconds}
              onChange={(e) =>
                setLectureData({
                  ...lectureData,
                  duration_seconds: e.target.value,
                })
              }
              className="w-full border px-2 py-1 rounded text-sm"
              required
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddLecture(false)}
                className="text-xs text-gray-600 px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={lectureMutation.isPending}
                className="text-xs text-white px-3 py-1 rounded bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400"
              >
                {lectureMutation.isPending ? "업로드 중..." : "강의 저장"}
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowAddLecture(true)}
            className="text-sm text-blue-600 font-semibold hover:underline"
          >
            + 강의 추가하기
          </button>
        )}
      </div>
    </div>
  );
}

// --- 메인 컴포넌트 (DragOverlay 추가 및 핸들러 수정) ---
// ... (메인 컴포넌트 SectionManager의 나머지 코드는 이전과 동일합니다) ...
// (DragOverlay, handleDragEnd 등의 코드는 생략되었습니다.)
function SectionManager({ course: initialCourse }) {
  const [course, setCourse] = useState(initialCourse);
  const [activeId, setActiveId] = useState(null);
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const sectionMutation = useMutation({
    mutationFn: addSection,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["course", String(initialCourse.idx)],
      });
      setNewSectionTitle("");
    },
    onError: (error) =>
      alert(error.response?.data?.message || "섹션 추가 실패"),
  });
  const reorderSectionMutation = useMutation({
    mutationFn: reorderSections,
    onError: (error) => {
      alert(error.response?.data?.message || "순서 변경 실패");
      queryClient.invalidateQueries({
        queryKey: ["course", String(initialCourse.idx)],
      });
    },
  });
  const reorderLectureMutation = useMutation({
    mutationFn: reorderLectures,
    onError: (error) => {
      alert(error.response?.data?.message || "순서 변경 실패");
      queryClient.invalidateQueries({
        queryKey: ["course", String(initialCourse.idx)],
      });
    },
  });
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const handleAddSection = (e) => {
    e.preventDefault();
    if (!newSectionTitle.trim()) {
      Swal.fire({
        icon: "error",
        title: "내용이 없어요!",
        text: "섹션의 제목을 입력해주세요! ㅜ.ㅜ",
      });
      return;
    }
    sectionMutation.mutate({
      courseId: initialCourse.idx,
      title: newSectionTitle,
      token,
    });
  };
  useEffect(() => {
    setCourse(initialCourse);
  }, [initialCourse]);
  const findItem = (id) => {
    if (id.startsWith("lecture-")) {
      for (const section of course.sections) {
        const lecture = (section.lectures || []).find(
          (l) => `lecture-${l.idx}` === id
        );
        if (lecture) return lecture;
      }
    }
    return course.sections.find((s) => `section-${s.idx}` === id);
  };
  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };
  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const activeId = active.id;
    const overId = over.id;
    const findSectionContainer = (itemId) => {
      if (itemId.startsWith("section-")) {
        return itemId;
      }
      const section = course.sections.find((section) =>
        (section.lectures || []).some(
          (lecture) => `lecture-${lecture.idx}` === itemId
        )
      );
      return section ? `section-${section.idx}` : null;
    };
    const activeContainerId = findSectionContainer(activeId);
    const overContainerId = findSectionContainer(overId);
    if (!activeContainerId || !overContainerId) {
      return;
    }
    if (activeId.startsWith("section-")) {
      setCourse((prev) => {
        const oldIndex = prev.sections.findIndex(
          (s) => `section-${s.idx}` === activeId
        );
        const newIndex = prev.sections.findIndex(
          (s) => `section-${s.idx}` === overId
        );
        if (oldIndex === -1 || newIndex === -1) return prev;
        const reordered = arrayMove(prev.sections, oldIndex, newIndex);
        const final = reordered.map((s, index) => ({ ...s, order: index + 1 }));
        const payload = final.map((s) => ({ idx: s.idx, order: s.order }));
        reorderSectionMutation.mutate({ reorderedSections: payload, token });
        return { ...prev, sections: final };
      });
      return;
    }
    if (activeId.startsWith("lecture-")) {
      setCourse((prev) => {
        const activeSectionIndex = prev.sections.findIndex(
          (s) => `section-${s.idx}` === activeContainerId
        );
        const overSectionIndex = prev.sections.findIndex(
          (s) => `section-${s.idx}` === overContainerId
        );
        if (activeSectionIndex === -1 || overSectionIndex === -1) return prev;
        const activeLectureIndex = prev.sections[
          activeSectionIndex
        ].lectures.findIndex((l) => `lecture-${l.idx}` === activeId);
        let overLectureIndex;
        if (overId.startsWith("lecture-")) {
          overLectureIndex = prev.sections[overSectionIndex].lectures.findIndex(
            (l) => `lecture-${l.idx}` === overId
          );
        } else {
          overLectureIndex = prev.sections[overSectionIndex].lectures.length;
        }
        const newState = JSON.parse(JSON.stringify(prev));
        const [movedLecture] = newState.sections[
          activeSectionIndex
        ].lectures.splice(activeLectureIndex, 1);
        newState.sections[overSectionIndex].lectures.splice(
          overLectureIndex,
          0,
          movedLecture
        );
        const payload = [];
        newState.sections.forEach((section) => {
          if (section.lectures) {
            section.lectures.forEach((lecture, index) => {
              payload.push({
                idx: lecture.idx,
                order: index + 1,
                section_idx: section.idx,
              });
              lecture.order = index + 1;
            });
          }
        });
        reorderLectureMutation.mutate({ reorderedLectures: payload, token });
        return newState;
      });
    }
  };
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="mt-8 p-6 border-2 border-dashed rounded-lg">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          커리큘럼 관리 (드래그하여 순서를 변경하세요)
        </h2>
        <SortableContext
          items={(course.sections || []).map((s) => `section-${s.idx}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {(course.sections || [])
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((section) => (
                <SortableSectionItem
                  key={section.idx}
                  course={course}
                  section={section}
                  token={token}
                  queryClient={queryClient}
                  activeId={activeId}
                />
              ))}
          </div>
        </SortableContext>
        <form
          onSubmit={handleAddSection}
          className="mt-8 pt-6 border-t flex gap-2"
        >
          <input
            type="text"
            value={newSectionTitle}
            onChange={(e) => setNewSectionTitle(e.target.value)}
            placeholder="새 섹션 제목"
            className="flex-1 px-3 py-2 border rounded-md"
            disabled={sectionMutation.isPending}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-gray-800 text-white rounded-md"
            disabled={sectionMutation.isPending}
          >
            {sectionMutation.isPending ? "추가 중..." : "섹션 추가"}
          </button>
        </form>
      </div>
      <DragOverlay>
        {activeId ? (
          activeId.startsWith("lecture-") ? (
            <LectureDragPreview lecture={findItem(activeId)} />
          ) : null
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
export default SectionManager;
