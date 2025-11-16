import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import ReactPlayer from "react-player"; // ReactPlayer 사용
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  PlayCircleIcon,
  ChatBubbleBottomCenterTextIcon,
} from "@heroicons/react/24/solid"; // 뒤로가기 아이콘
import Swal from "sweetalert2";

const API_BASE_URL = "http://localhost:8080";

// --- API 함수 ---

/** 강좌/커리큘럼/수강정보 조회 */
const fetchLearnCourse = async (courseId, token) => {
  console.log(`[API] Fetching course details for courseId: ${courseId}`);
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const { data } = await axios.get(
    `${API_BASE_URL}/api/learn/course/${courseId}`,
    config
  );
  console.log("[API] Course data received:", data);
  return data;
};

/** 강의 진행 상황 업데이트. */
const updateProgress = async ({
  enrollmentIdx,
  lectureId,
  watchedSeconds,
  token,
}) => {
  console.log(
    `[API] Updating progress for lecture ${lectureId} to ${watchedSeconds}s`
  );

  const config = { headers: { Authorization: `Bearer ${token}` } };
  const { data } = await axios.post(
    `${API_BASE_URL}/api/learn/progress`,
    { enrollmentIdx, lectureId, watchedSeconds },
    config
  );
  console.log("[API] Progress update response:", data);
  return data;
};

/** 강의 완료 시 컴플리트 요청 */
const completeLecture = async ({ enrollmentIdx, lectureId, token }) => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const { data } = await axios.post(
    `${API_BASE_URL}/api/learn/complete`,
    { enrollmentIdx, lectureId },
    config
  );
  return data; // { message: "...", progress_percent: 80 } 반환
};

// [신규] 'courses.js'의 '댓글' API 호출
const fetchComments = async (lectureId) => {
  // 댓글은 공개이므로 token 불필요
  const { data } = await axios.get(
    `${API_BASE_URL}/api/courses/lectures/${lectureId}/comments`
  );
  return data;
};

const addComment = async ({ lectureId, content, parentCommentIdx, token }) => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const { data } = await axios.post(
    `${API_BASE_URL}/api/courses/lectures/${lectureId}/comments`,
    { content, parentCommentIdx },
    config
  );
  return data; // (새 댓글 객체 반환)
};

// (★★신규★★) 시간 포맷 함수
const formatTime = (seconds) => {
  const date = new Date(0);
  date.setSeconds(seconds);
  return date.toISOString().substr(14, 5); // MM:SS 형식
};
// --- 유튜브 ID 추출 함수 (변경 없음) ---
const getYouTubeId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

// 플레이어 상단 네비게이션 바 컴포넌트
const PlayerNavbar = ({ courseTitle, onBackClick }) => {
  return (
    <div
      // 이미지와 유사한 배경 및 그림자 효과, 부드러운 전환 효과
      className={`bg-white z-20 px-6 py-3 
                       backdrop-blur-sm shadow-lg 
                        transition-transform duration-300 ease-out 
                        `}
    >
      <div className="flex items-center justify-between ">
        {/* 좌측: 뒤로가기 버튼 */}
        <div className="flex items-center gap-4">
          <button
            onClick={onBackClick}
            className="flex items-center gap-2 text-base hover:text-green-600 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <span className="font-medium">{courseTitle}</span>
        </div>

        {/* 우측: 수강평 작성하기 버튼 */}
        <button
          onClick={() => alert("수강평 작성 기능 (미구현)")} // 실제 기능으로 대체 필요
          className="flex items-center gap-1 text-sm text-yellow-400 font-semibold
                               hover:text-yellow-300 transition-colors"
        >
          <span className="text-xl">⭐</span>
          <span>수강평 작성하기</span>
        </button>
      </div>
    </div>
  );
};

function LecturePlayerPage() {
  const { courseId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const playerRef = useRef(null); // ReactPlayer 참조용
  const lastUpdateTime = useRef(Date.now());

  // 15초마다 시청 시간 저장
  const PROGRESS_SAVE_INTERVAL_MS = 15 * 1000;

  const {
    data: courseData,
    isLoading: isCourseLoading,
    isError,
    error,
    isSuccess,
  } = useQuery({
    queryKey: ["learn-course", courseId, token],
    queryFn: () => fetchLearnCourse(courseId, token),
    enabled: !!token,
    refetchOnWindowFocus: false,
  });

  const enrollmentIdx = courseData?.enrollment?.idx;
  const progressPercent = courseData?.enrollment?.progress_percent || 0;

  const [currentLecture, setCurrentLecture] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [isPlayerLoading, setIsPlayerLoading] = useState(true);

  const [newComment, setNewComment] = useState("");

  // 댓글 쿼리
  const { data: comments, isLoading: isCommentsLoading } = useQuery({
    queryKey: ["comments", currentLecture?.idx],
    queryFn: () => fetchComments(currentLecture.idx),
    enabled: !!currentLecture,
  });

  // (★★신규★★) Navbar 가시성 상태
  const [isNavbarVisible, setIsNavbarVisible] = useState(false);

  // 강좌 데이터 로드 시 실행
  useEffect(() => {
    console.log("[Effect 1] Course data fetched:", courseData);

    if (isSuccess && courseData?.sections) {
      let lectureToPlay = null;

      // "첫 미완료 강의"를 최우선으로 찾기
      for (const section of courseData.sections) {
        if (section.lectures) {
          const firstUncompleted = section.lectures.find(
            (l) => !l.is_completed
          );
          if (firstUncompleted) {
            lectureToPlay = firstUncompleted;
            break; // 찾았으면 즉시 중단
          }
        }
      }

      // 이어볼 강의가 없으면 -> 첫 미완료 강의
      if (!lectureToPlay) {
        for (const section of courseData.sections) {
          const firstUncompleted = section.lectures?.find(
            (l) => !l.is_completed
          );
          if (firstUncompleted) {
            lectureToPlay = firstUncompleted;
            break;
          }
        }
      }

      // 그것도 없으면 -> 1강
      if (!lectureToPlay && courseData.sections[0]?.lectures?.[0]) {
        lectureToPlay = courseData.sections[0].lectures[0];
      }

      if (lectureToPlay) {
        setCurrentLecture(lectureToPlay);
      }
    }
  }, [courseData, isSuccess]);

  // 현재 강의 변경 시 videoUrl 계산
  useEffect(() => {
    console.log("[Effect 2] currentLecture changed:", currentLecture);
    setIsPlayerLoading(true);
    let finalUrl = "";
    if (currentLecture?.video_url) {
      const urlSource = currentLecture.video_url;
      if (urlSource.startsWith("uploads/")) {
        const filename = urlSource.split("/").pop();
        finalUrl = `${API_BASE_URL}/api/video/stream/${filename}`;
      } else {
        const youtubeId = getYouTubeId(urlSource);
        if (youtubeId) {
          finalUrl = `https://www.youtube.com/watch?v=${youtubeId}`;
        } else {
          finalUrl = urlSource;
          console.warn("YouTube ID 추출 실패, 원본 URL 사용:", finalUrl);
        }
      }
    }
    console.log("[Effect 2] Calculated videoUrl:", finalUrl);
    setVideoUrl(finalUrl);
    lastUpdateTime.current = Date.now(); // 강의 변경 시 업데이트 시간 초기화
  }, [currentLecture]);

  // 진행률 업데이트 mutation
  // (★★수정★★) 진행률 업데이트 mutation (onSuccess 로직 변경)
  const progressMutation = useMutation({
    mutationFn: updateProgress,

    onError: (err) => {
      console.error("Progress update failed:", err);
    },
  });

  // [신규] 강의 완료 처리
  const completeMutation = useMutation({
    mutationFn: completeLecture,
    onSuccess: (data) => {
      // (서버가 보내준 새 진행률로 캐시 갱신)
      const newData = queryClient.setQueryData(
        ["learn-course", courseId, token],
        (oldData) => {
          if (!oldData) return oldData;

          const newSections = oldData.sections.map((s) => ({
            ...s,
            lectures: s.lectures.map((l) =>
              l.idx === currentLecture.idx ? { ...l, is_completed: 1 } : l
            ),
          }));

          return {
            ...oldData,
            enrollment: {
              ...oldData.enrollment,
              progress_percent: data.progress_percent,
            },
            sections: newSections,
          };
        }
      );

      const allLectures =
        newData?.sections?.flatMap((section) => section.lectures || []) || [];

      // is_completed = 0 인 강의를 찾음.
      const nextLecture = allLectures.find((lecture) => !lecture.is_completed);

      if (nextLecture) {
        // 4a. 다음 강의로 이동
        console.log("[Auto-Next] 다음 강의로 이동:", nextLecture.title);
        setCurrentLecture(nextLecture);
      } else {
        // 4b. 완강
        console.log("[Auto-Next] 모든 강의를 완강했습니다!");
        Swal.fire({
          title: "강좌 완강!",
          text: "모든 강의를 완료하셨습니다. 수강평을 작성해 주시겠어요?",
          icon: "success",
          confirmButtonText: "좋아요",
        });
      }
    },
    onError: (err) =>
      alert(err.response?.data?.message || "강의 완료 처리 실패"),
  });

  // [신규] 댓글(토론) 추가
  const addCommentMutation = useMutation({
    mutationFn: addComment,
    onSuccess: (newCommentData) => {
      // (캐시 즉시 업데이트)
      queryClient.setQueryData(
        ["comments", currentLecture.idx],
        (oldComments) => [...(oldComments || []), newCommentData]
      );
      setNewComment(""); // 입력창 비우기
    },
    onError: (err) => alert(err.response?.data?.message || "댓글 작성 실패"),
  });

  // ReactPlayer 진행률 콜백
  const handleProgress = (progress) => {
    if (
      !currentLecture ||
      !playerRef.current ||
      progressMutation.isPending ||
      !enrollmentIdx
    )
      return;

    const currentTime = Math.floor(progress.playedSeconds);
    const now = Date.now();

    // 마지막 업데이트 후 15초가 지났을 때
    if (now - lastUpdateTime.current > PROGRESS_SAVE_INTERVAL_MS) {
      console.log(
        `[Progress] Saving progress for lecture ${currentLecture.idx} at ${currentTime}s`
      );
      progressMutation.mutate({
        enrollmentIdx: enrollmentIdx,
        lectureId: currentLecture.idx,
        watchedSeconds: currentTime,
        token,
      });
      lastUpdateTime.current = now;
    }
  };

  /** 강의 완료 버튼 핸들러 */
  const handleCompleteLecture = () => {
    console.log(completeMutation.isPending);
    console.log(enrollmentIdx);
    console.log(currentLecture);

    if (completeMutation.isPending || !enrollmentIdx || !currentLecture) return;

    Swal.fire({
      title: "강의를 완료하시겠습니까?",
      text: "다음 강의로 이동합니다.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "완료",
      cancelButtonText: "취소",
    }).then((result) => {
      if (result.isConfirmed) {
        completeMutation.mutate({
          enrollmentIdx: enrollmentIdx, // 👈 [추가]
          lectureId: currentLecture.idx,
          token,
        });
        // TODO: 다음 강의로 자동 이동
      }
    });
  };

  // [신규] 댓글(토론) 제출 핸들러
  const handleSaveComment = () => {
    if (!newComment.trim() || !currentLecture || addCommentMutation.isPending)
      return;
    addCommentMutation.mutate({
      lectureId: currentLecture.idx,
      content: newComment,
      parentCommentIdx: null, // (대댓글은 추후 구현)
      token,
    });
  };

  // (★★신규★★) 마우스 움직임 감지 및 Navbar 가시성 제어
  const handleMouseMove = useCallback((e) => {
    // 플레이어 영역 상단 100px 이내에서만 Navbar를 표시
    if (e.clientY < 100) {
      setIsNavbarVisible(true);
    } else {
      setIsNavbarVisible(false);
    }
  }, []);

  useEffect(() => {
    const playerElement = playerRef.current?.wrapper; // ReactPlayer의 DOM 요소에 접근
    if (playerElement) {
      playerElement.addEventListener("mousemove", handleMouseMove);
      // 컴포넌트 언마운트 시 이벤트 리스너 제거
      return () => {
        playerElement.removeEventListener("mousemove", handleMouseMove);
      };
    }
  }, [handleMouseMove]);

  // ** 화면 출력 **
  if (isCourseLoading)
    return <div className="text-center p-10">강의를 불러오는 중입니다...</div>;
  if (isError)
    return (
      <div className="text-center p-10 text-red-500">
        {" "}
        강의를 불러오는 데 실패했습니다.
        <br /> 오류: {error.response?.data?.message || error.message}{" "}
      </div>
    );
  if (!currentLecture && isSuccess && courseData)
    return <div className="text-center p-10">재생할 강의가 없습니다.</div>; // isSuccess 조건 추가
  if (!currentLecture && !isCourseLoading)
    return <div className="text-center p-10">강의 정보 로딩 중...</div>;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 왼쪽: 비디오 플레이어 */}
      <main className="flex-grow flex flex-col">
        {/* (★★신규★★) PlayerNavbar 렌더링 */}
        <PlayerNavbar
          courseTitle={currentLecture.title} // 강좌 제목 전달
          onBackClick={() => navigate("/my-courses")} // 학습 목록으로 이동
          isVisible={isNavbarVisible}
        />

        <div
          className="bg-black flex-grow relative w-full"
          style={{ minHeight: "300px", height: "70vh" }}
        >
          {/* videoUrl 상태가 준비되었을 때만 플레이어 렌더링 */}
          {videoUrl ? (
            <ReactPlayer
              ref={playerRef} // ref 연결
              url={videoUrl}
              controls={true}
              width="100%"
              height="100%"
              style={{ position: "absolute", top: 0, left: 0 }}
              // (★★수정★★) onReady에서 isPlayerLoading을 false로 설정
              onReady={() => {
                console.log("[ReactPlayer] Ready");
                setIsPlayerLoading(false);
              }}
              onStart={() => console.log("[ReactPlayer] Start")}
              onProgress={handleProgress} // 진행률 콜백 연결
              onError={(e) => console.error("[ReactPlayer Error]", e)}
              // playing // 자동 재생은 일단 비활성화
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white bg-gray-900">
              강의 URL 준비 중...
            </div>
          )}
          {/* (★★수정★★) 로딩 오버레이 조건 변경: isPlayerLoading 상태 사용 */}
          {isPlayerLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 text-white z-10">
              플레이어 로딩 중...
            </div>
          )}
        </div>

        {/* (★★신규★★) 메모 영역 - 유튜브 댓글 스타일 */}
        <div
          className="bg-white p-4 shadow-md overflow-y-auto"
          style={{ flexBasis: "35%" }}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ChatBubbleBottomCenterTextIcon className="h-5 w-5 text-gray-500" />
              학습 토론 ({comments?.length || 0})
            </h2>
            <button
              onClick={handleCompleteLecture}
              disabled={completeMutation.isPending}
              className="bg-green-600 text-white text-sm px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400"
            >
              <CheckCircleIcon className="h-5 w-5 inline-block -mt-1" /> 강의
              완료
            </button>
          </div>

          {/* 새 댓글 작성 UI */}
          <div className="mb-4 flex gap-2">
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="질문이나 학습 내용을 공유해보세요..."
              className="flex-grow border rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={handleSaveComment}
              disabled={addCommentMutation.isPending}
              className="text-sm text-white px-4 py-1 rounded bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
            >
              {addCommentMutation.isPending ? "등록 중..." : "등록"}
            </button>
          </div>

          {/* 댓글 목록 */}
          <div className="space-y-4">
            {isCommentsLoading && <p>댓글 로딩 중...</p>}
            {comments?.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                아직 작성된 댓글이 없습니다.
              </p>
            )}
            {comments?.map((comment) => (
              <div key={comment.idx} className="flex items-start gap-3 text-sm">
                <img
                  src={
                    comment.author_picture
                      ? `${API_BASE_URL}/${comment.author_picture}`
                      : `https://ui-avatars.com/api/?name=${comment.author_name}&background=random`
                  }
                  alt={comment.author_name}
                  className="w-8 h-8 rounded-full bg-gray-200"
                />
                <div className="flex-1">
                  <span className="font-semibold text-gray-900">
                    {comment.author_name}
                  </span>
                  <span className="text-gray-500 text-xs ml-2">
                    {new Date(comment.created_at).toLocaleString()}
                  </span>
                  <p className="text-gray-800 break-words mt-1">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* 오른쪽: 커리큘럼 사이드바 */}
      <aside className="w-64 md:w-80 flex-shrink-0 bg-white shadow-lg overflow-y-auto">
        <div className="p-4 border-b">
          <h2 className="font-bold truncate text-sm md:text-base">
            {courseData?.title}
          </h2>
          <span className="text-xs text-gray-500">{progressPercent}% 완료</span>
        </div>
        <div className="space-y-2 p-2">
          {courseData?.sections?.map((section) => (
            <div key={section.idx}>
              <h3 className="font-semibold text-xs md:text-sm p-2 bg-gray-100 rounded">
                {section.title}
              </h3>
              <ul className="mt-1">
                {(section.lectures || []).map((lecture) => (
                  <li key={lecture.idx}>
                    <button
                      onClick={() => setCurrentLecture(lecture)}
                      className={`w-full text-left text-xs md:text-sm p-2 rounded flex items-center gap-2 hover:bg-gray-100 ${
                        currentLecture?.idx === lecture.idx
                          ? "bg-blue-100 font-semibold text-blue-700"
                          : ""
                      }`}
                    >
                      {lecture.is_completed ? (
                        <CheckCircleIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <PlayCircleIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      )}
                      <span className="flex-grow truncate">
                        {lecture.title}
                      </span>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {formatTime(lecture.duration_seconds)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

export default LecturePlayerPage;
