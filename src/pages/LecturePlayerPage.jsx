import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import ReactPlayer from "react-player"; // ReactPlayer 사용

const API_BASE_URL = "http://localhost:8080";

// --- API 함수들 (변경 없음) ---
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
const updateProgress = async ({ lectureId, watchedSeconds, token }) => {
  console.log(
    `[API] Updating progress for lecture ${lectureId} to ${watchedSeconds}s`
  );
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const { data } = await axios.post(
    `${API_BASE_URL}/api/learn/progress`,
    { lectureId, watchedSeconds },
    config
  );
  console.log("[API] Progress update response:", data);
  return data;
};
// 메모 관련 API 함수
const fetchMemos = async (lectureId, token) => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const { data } = await axios.get(
    `${API_BASE_URL}/api/memos/lecture/${lectureId}`,
    config
  );
  return data;
};
const addMemo = async ({ lectureId, timestampSeconds, content, token }) => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const { data } = await axios.post(
    `${API_BASE_URL}/api/memos`,
    { lectureId, timestampSeconds, content },
    config
  );
  return data;
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

function LecturePlayerPage() {
  const { courseId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const playerRef = useRef(null); // ReactPlayer 참조용
  const lastUpdateTime = useRef(Date.now());
  const progressSaveInterval = 15 * 1000;

  const {
    data: course,
    isLoading: isCourseLoading,
    isError,
    error,
    isSuccess,
  } = useQuery({
    queryKey: ["learn-course", courseId],
    queryFn: () => fetchLearnCourse(courseId, token),
    enabled: !!token,
    refetchOnWindowFocus: false,
  });

  const [currentLecture, setCurrentLecture] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  // (★★수정★★) isPlayerReady 제거, 대신 플레이어 로딩 상태 직접 관리
  const [isPlayerLoading, setIsPlayerLoading] = useState(true);

  const [newMemoContent, setNewMemoContent] = useState(""); // (★★신규★★) 새 메모 내용 상태

  // 강좌 데이터 로드 시 실행
  useEffect(() => {
    console.log("[Effect 1] Course data fetched:", course);
    if (isSuccess && course?.sections) {
      let lectureToPlay = null;
      // 이미 currentLecture가 있으면 그 강의를 유지 (다른 강의 클릭 시 제외)
      if (
        currentLecture &&
        course.sections.some((s) =>
          s.lectures?.some((l) => l.idx === currentLecture.idx)
        )
      ) {
        console.log("[Effect 1] Keeping current lecture:", currentLecture);
        lectureToPlay = currentLecture; // 캐시 업데이트 시 현재 강의 유지 시도
      } else {
        // 이전 로직과 동일하게 첫 미완료/첫 강의 찾기
        for (const section of course.sections) {
          if (section.lectures) {
            const firstUncompleted = section.lectures.find(
              (l) => !l.is_completed
            );
            if (firstUncompleted) {
              lectureToPlay = firstUncompleted;
              break;
            }
          }
        }
        if (!lectureToPlay && course.sections[0]?.lectures?.[0]) {
          lectureToPlay = course.sections[0].lectures[0];
        }
        console.log("[Effect 1] Initial lecture determined:", lectureToPlay);
      }

      if (lectureToPlay && lectureToPlay.idx !== currentLecture?.idx) {
        setCurrentLecture(lectureToPlay);
      } else if (!lectureToPlay) {
        setCurrentLecture(null); // 재생할 강의 없음
      }
    }
  }, [course, isSuccess, currentLecture]); // currentLecture 추가

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

  // (★★신규★★) 현재 강의의 메모 목록 조회 쿼리
  const { data: memos, isLoading: isMemosLoading } = useQuery({
    queryKey: ["memos", currentLecture?.idx], // 키에 강의 ID 포함
    queryFn: () => fetchMemos(currentLecture.idx, token),
    enabled: !!currentLecture && !!token, // 현재 강의가 있고 토큰이 있을 때만 실행
  });

  // 진행률 업데이트 mutation
  // (★★수정★★) 진행률 업데이트 mutation (onSuccess 로직 변경)
  const mutation = useMutation({
    mutationFn: updateProgress,
    onSuccess: (data, variables) => {
      console.log(
        "[Mutation Success] Progress updated, new progress:",
        data.newProgressPercent
      );
      queryClient.invalidateQueries({ queryKey: ["my-courses"] });
      // 캐시 직접 수정 (이전과 동일)
      queryClient.setQueryData(["learn-course", courseId], (oldData) => {
        if (!oldData) return oldData;
        const newOverallProgress = data.newProgressPercent;
        const newSections = oldData.sections.map((section) => ({
          ...section,
          lectures: (section.lectures || []).map((lecture) => {
            if (lecture.idx === variables.lectureId) {
              const watchedSeconds = variables.watchedSeconds;
              const isCompleted =
                lecture.duration_seconds > 0
                  ? watchedSeconds / lecture.duration_seconds >= 0.9
                  : false;
              return {
                ...lecture,
                watched_seconds: watchedSeconds,
                is_completed: isCompleted || lecture.is_completed,
              };
            }
            return lecture;
          }),
        }));
        return {
          ...oldData,
          progress_percent: newOverallProgress,
          sections: newSections,
        };
      });
    },
    onError: (err) => {
      console.error("Progress update failed:", err);
    },
  });

  // (★★신규★★) 새 메모 추가 mutation
  const addMemoMutation = useMutation({
    mutationFn: addMemo,
    onSuccess: () => {
      // 메모 추가 성공 시, 해당 강의의 메모 목록 쿼리를 무효화하여 다시 불러옴
      queryClient.invalidateQueries({
        queryKey: ["memos", currentLecture.idx],
      });
      setNewMemoContent(""); // 입력창 비우기
    },
    onError: (err) => alert(err.response?.data?.message || "메모 추가 실패"),
  });

  // ReactPlayer 진행률 콜백
  const handleProgress = (progress) => {
    if (!currentLecture || !playerRef.current || mutation.isPending) return;

    const currentTime = Math.floor(progress.playedSeconds);
    const now = Date.now();
    const fifteenSeconds = 15 * 1000;
    const duration = currentLecture.duration_seconds;
    const isCompleted = currentLecture.is_completed; // 현재 완료 상태

    // 재생 시간이 0보다 크고, 마지막 업데이트 후 15초가 지났을 때
    if (currentTime > 0 && now - lastUpdateTime.current > fifteenSeconds) {
      console.log(
        `[Progress] Saving progress for lecture ${currentLecture.idx} at ${currentTime}s`
      );
      mutation.mutate({
        lectureId: currentLecture.idx,
        watchedSeconds: currentTime,
        token,
      });
      lastUpdateTime.current = now;
    }
  };

  // ReactPlayer 영상 종료 시 콜백
  const handleEnded = () => {
    if (!currentLecture || !playerRef.current || mutation.isPending) return;
    const finalTime = currentLecture.duration_seconds; // 종료 시점은 영상 전체 길이
    console.log(
      `[Ended] Saving final progress for lecture ${currentLecture.idx} at ${finalTime}s`
    );
    mutation.mutate({
      lectureId: currentLecture.idx,
      watchedSeconds: finalTime,
      token,
    });
    lastUpdateTime.current = Date.now();
  };

  // (★★신규★★) 메모 추가 핸들러
  const handleAddMemo = () => {
    if (!newMemoContent.trim() || !playerRef.current || !currentLecture) return;
    const currentTime = Math.floor(playerRef.current.getCurrentTime());
    addMemoMutation.mutate({
      lectureId: currentLecture.idx,
      timestampSeconds: currentTime,
      content: newMemoContent,
      token,
    });
  };

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
  if (!currentLecture && isSuccess && course)
    return <div className="text-center p-10">재생할 강의가 없습니다.</div>; // isSuccess 조건 추가
  if (!currentLecture && !isCourseLoading)
    return <div className="text-center p-10">강의 정보 로딩 중...</div>;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 왼쪽: 비디오 플레이어 */}
      <main className="flex-grow flex flex-col">
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
              onEnded={handleEnded} // 종료 콜백 연결
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

        <div className="p-4 bg-white shadow-md">
          {" "}
          <h1 className="text-xl md:text-2xl font-bold truncate">
            {currentLecture?.title || "강의 정보"}
          </h1>{" "}
          <button
            onClick={() => navigate("/my-courses")}
            className="text-sm text-blue-600 hover:underline mt-1"
          >
            ← 학습 목록으로 돌아가기
          </button>{" "}
        </div>
      </main>

      {/* 오른쪽: 커리큘럼 사이드바 (변경 없음) */}
      <aside className="w-64 md:w-80 flex-shrink-0 bg-white shadow-lg overflow-y-auto">
        {/* ... (이전과 동일) ... */}
        <div className="p-4 border-b">
          <h2 className="font-bold truncate text-sm md:text-base">
            {course?.title}
          </h2>
        </div>
        <div className="space-y-2 p-2">
          {course?.sections?.map((section) => (
            <div key={section.idx}>
              <h3 className="font-semibold text-xs md:text-sm p-2 bg-gray-100 rounded">
                {section.title}
              </h3>
              <ul className="mt-1">
                {(section.lectures || []).map((lecture) => (
                  <li key={lecture.idx}>
                    <button
                      onClick={() => setCurrentLecture(lecture)}
                      className={`w-full text-left text-xs md:text-sm p-2 rounded flex items-center gap-2 hover:bg-gray-100 transition-colors duration-150 ${
                        currentLecture?.idx === lecture.idx
                          ? "bg-blue-100 font-semibold text-blue-700"
                          : ""
                      }`}
                    >
                      {lecture.is_completed ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 text-green-500 flex-shrink-0"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 text-gray-400 flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      )}
                      <span className="flex-grow truncate">
                        {lecture.title}
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
