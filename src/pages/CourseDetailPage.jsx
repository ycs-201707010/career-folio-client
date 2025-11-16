import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import {
  PencilIcon,
  PlayCircleIcon,
  ChatBubbleLeftRightIcon,
  StarIcon as StarIconSolid,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import ReviewModal from "../components/ReviewModal";
import Swal from "sweetalert2";

const API_BASE_URL = "http://localhost:8080";

const fetchCourseDetails = async (courseId, token) => {
  const config = {};

  if (token) {
    config.headers = { Authorization: `Bearer ${token}` };
  }

  console.log(config.headers);

  const { data } = await axios.get(
    `${API_BASE_URL}/api/courses/public/${courseId}`,
    config
  );

  console.log(data);

  return data;
};

// [신규] 수강평(Reviews) API 호출
const fetchReviews = async (courseId) => {
  const { data } = await axios.get(
    `${API_BASE_URL}/api/courses/${courseId}/reviews`
  );
  return data;
};

// --- 1. [신규] 수강생용 위젯 ---
const EnrolledWidget = ({ course, enrollment }) => {
  // 1. [수정] 실제 진행률 사용
  const progress = enrollment.progress_percent || 0;

  // 2. [수정] "마지막으로 본" 또는 "다음" 강의 찾기
  let lectureToResume = null;
  const lastViewedId = enrollment.last_viewed_lecture_idx;

  const allLectures = course.sections.flatMap((s) => s.lectures || []);

  if (lastViewedId) {
    // 이어볼 강의 (마지막 본 강의)
    lectureToResume = allLectures.find((l) => l.idx === lastViewedId);
  } else if (allLectures.length > 0) {
    // (본 적이 없으면) 그냥 1강
    lectureToResume = allLectures[0];
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md sticky top-8">
      <h2 className="text-xl font-bold mb-3">학습 진행률</h2>
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
        <div
          className="bg-blue-600 h-2.5 rounded-full"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <p className="text-sm text-gray-600 mb-4">{progress}% 완료</p>

      <hr className="my-4" />

      {/* 3. [수정] 이어보기 UI */}
      {lectureToResume ? (
        <>
          <h3 className="text-md font-semibold mb-2">
            {lastViewedId ? "이어 학습하기" : "학습 시작하기"}
          </h3>
          <p className="text-sm text-gray-700 truncate mb-4">
            {lectureToResume.title}
          </p>
        </>
      ) : (
        <p className="text-sm text-gray-700 mb-4">강의가 없습니다.</p>
      )}

      <Link
        to={`/learn/course/${course.idx}`} // 👈 학습 페이지로 이동
        className={`w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3 rounded-md transition ${
          !lectureToResume
            ? "bg-gray-400 cursor-not-allowed"
            : "hover:bg-blue-700"
        }`}
        // 강의가 없으면 비활성화
        onClick={(e) => !lectureToResume && e.preventDefault()}
      >
        <PlayCircleIcon className="h-5 w-5" />
        수강하러 가기
      </Link>
    </div>
  );
};

// --- 2. [신규] 강사용 위젯 ---
const InstructorWidget = ({ courseId }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md sticky top-8">
      <h2 className="text-xl font-bold mb-4">강사 메뉴</h2>
      <p className="text-sm text-gray-600 mb-4">
        이 강좌의 소유자입니다. 강좌를 관리하세요.
      </p>
      <Link
        to={`/instructor/course/${courseId}`}
        className="w-full flex items-center justify-center gap-2 bg-gray-700 text-white font-bold py-3 rounded-md hover:bg-gray-800 transition"
      >
        <PencilIcon className="h-5 w-5" />
        강좌 관리하기
      </Link>
    </div>
  );
};

// --- 3. [기존] 구매자용 위젯 ---
const PurchaseWidget = ({ course, onAddToCart, onBuyNow, mutations }) => {
  const discounted =
    course.discount_price !== null && course.discount_price < course.price;
  const isFree = course.price === 0 || course.discount_price === 0;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md sticky top-8">
      <div className="text-right mb-4">
        {discounted ? (
          <div>
            <span className="text-1xl text-gray-400 line-through">
              ₩{Number(course.price).toLocaleString()}
            </span>
            <span className="text-2xl font-bold text-red-500 ml-2">
              ₩{Number(course.discount_price).toLocaleString()}
            </span>
          </div>
        ) : (
          <span className="text-2xl font-bold">
            ₩{Number(course.price).toLocaleString()}
          </span>
        )}
      </div>
      {!isFree && (
        <button
          onClick={onAddToCart}
          disabled={mutations.addToCart.isPending}
          className="w-full mb-2 bg-white text-blue-600 border-2 border-blue-600 font-bold py-3 rounded-md hover:bg-gray-50 transition"
        >
          {mutations.addToCart.isPending ? "처리 중..." : "장바구니에 담기"}
        </button>
      )}
      <button
        onClick={onBuyNow}
        disabled={mutations.freeEnroll.isPending}
        className="w-full bg-blue-600 text-white font-bold py-3 rounded-md hover:bg-blue-700 transition"
      >
        {mutations.freeEnroll.isPending
          ? "처리 중..."
          : isFree
          ? "무료 수강 신청"
          : "결제하고 수강하기"}
      </button>
      {/* ... (총 섹션, 강의 시간 등은 동일) ... */}
    </div>
  );
};

/** 수강 후기 컴포넌트 */
const StarRating = ({ rating }) => {
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIconSolid
          key={star}
          className={`h-5 w-5 ${
            rating >= star ? "text-yellow-400" : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );
};

// [신규] 수강 후기 삭제 API
const deleteReview = async ({ reviewId, token }) => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const { data } = await axios.delete(
    `${API_BASE_URL}/api/courses/reviews/${reviewId}`,
    config
  );
  return data;
};

const CourseReviews = ({
  user,
  courseId,
  isEnrolled,
  progressPercent,
  onWriteReview,
}) => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  // 1. 수강평 API를 자체적으로 호출
  const {
    data: reviews,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["courseReviews", courseId],
    queryFn: () => fetchReviews(courseId),
  });

  // [신규] 수강평 삭제 Mutation
  const deleteReviewMutation = useMutation({
    mutationFn: deleteReview,
    onSuccess: (data) => {
      Swal.fire("삭제 완료", data.message, "success");
      // [중요] 'courseReviews' 쿼리뿐만 아니라,
      // 'course-public' 쿼리도 무효화해야 'avg_rating'이 갱신됩니다.
      queryClient.invalidateQueries({ queryKey: ["courseReviews", courseId] });
      queryClient.invalidateQueries({
        queryKey: ["course-public", courseId, token],
      });
    },
    onError: (err) => {
      Swal.fire(
        "삭제 실패",
        err.response?.data?.message || "오류 발생",
        "error"
      );
    },
  });

  const handleDeleteReview = (reviewId) => {
    Swal.fire({
      title: "이 수강평을 정말 삭제하시겠습니까?",
      text: "이 작업은 되돌릴 수 없습니다.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "삭제",
      cancelButtonText: "취소",
    }).then((result) => {
      if (result.isConfirmed) {
        deleteReviewMutation.mutate({ reviewId, token });
      }
    });
  };

  const handleWriteReviewClick = () => {
    // (Turn 114의 PlayerNavbar 로직과 동일)
    if (progressPercent < 80) {
      // (Swal이 import되어 있다고 가정)
      Swal.fire({
        icon: "info",
        title: "수강평 작성 불가",
        text: "강좌를 80% 이상 수강해야 후기를 작성할 수 있습니다.",
      });
    } else {
      onWriteReview(); // 👈 부모(CourseDetailPage)의 모달 열기 함수 호출
    }
  };

  return (
    <div className="flex-grow bg-white p-6 rounded-lg shadow-md mt-8">
      <div className="flex justify-between mb-3 ">
        <h2 className="text-2xl font-bold mb-4">수강평</h2>

        {isEnrolled && (
          <button
            onClick={handleWriteReviewClick} // 👈 핸들러 연결
            className={`flex items-center justify-center gap-2 text-sm font-bold py-2 px-4 rounded-md border-2 transition ${
              progressPercent >= 80
                ? "border-yellow-400 text-yellow-500 hover:bg-yellow-50"
                : "border-gray-300 text-gray-400 cursor-not-allowed"
            }`}
            title={
              progressPercent < 80 ? "진행률 80% 달성 시 활성화됩니다." : ""
            }
          >
            <ChatBubbleLeftRightIcon className="h-5 w-5" />
            {progressPercent < 80 ? "수강평 작성 불가" : "수강평 남기기"}
          </button>
        )}
      </div>

      {isLoading && <p>수강평을 불러오는 중...</p>}
      {isError && (
        <p className="text-red-500">수강평을 불러오는 데 실패했습니다.</p>
      )}

      {!isLoading && !isError && (
        <>
          {reviews.length === 0 ? (
            <p className="text-gray-500">아직 작성된 수강평이 없습니다.</p>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div
                  key={review.idx}
                  className="flex items-start gap-4 border-b pb-4"
                >
                  <img
                    src={
                      review.author_picture
                        ? `${API_BASE_URL}/${review.author_picture}`
                        : `https://ui-avatars.com/api/?name=${review.author_name}&background=random`
                    }
                    alt={review.author_name}
                    className="w-10 h-10 rounded-full bg-gray-200"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">
                        {review.author_name}
                      </span>

                      <div className="flex justify-center items-center gap-2">
                        <span className="text-xs text-gray-500 ">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                        {user &&
                          (user.role === "admin" ||
                            user.userIdx === review.user_idx) && (
                            <button
                              onClick={() => handleDeleteReview(review.idx)}
                              disabled={deleteReviewMutation.isPending}
                              className="text-gray-400 hover:text-red-500"
                              title="삭제"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          )}
                      </div>
                    </div>
                    <StarRating rating={review.rating} />
                    <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">
                      {review.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

function CourseDetailPage() {
  const { courseId } = useParams();
  const { token, user } = useAuth(); // 로그인 정보 가져오기
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const {
    data: course,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["course-public", courseId, token],
    queryFn: () => fetchCourseDetails(courseId, token),
  });

  // 장바구니 추가 mutation
  const addToCartMutation = useMutation({
    mutationFn: (course_id) => {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      return axios.post(
        `${API_BASE_URL}/api/cart`,
        { courseId: course_id },
        config
      );
    },
    onSuccess: () => {
      alert("장바구니에 추가되었습니다.");
      // (선택) 장바구니 아이콘의 카운트를 업데이트하기 위해 관련 쿼리를 무효화할 수 있음
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (err) => {
      alert(err.response?.data?.message || "오류가 발생했습니다.");
    },
  });

  // 무료 수강 신청 mutation
  const freeEnrollMutation = useMutation({
    mutationFn: (course_id) => {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      return axios.post(
        `${API_BASE_URL}/api/enrollments/free`,
        { courseId: course_id },
        config
      );
    },
    onSuccess: () => {
      alert("수강 신청이 완료되었습니다!");
      // TODO: '나의 학습' 페이지 등으로 이동하는 로직 추가
      navigate("/my-courses");
    },
    onError: (err) =>
      alert(err.response?.data?.message || "오류가 발생했습니다."),
  });

  // '장바구니에 담기' 버튼 클릭 시 실행
  const handleAddToCart = () => {
    if (!user) {
      if (
        window.confirm("로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?")
      ) {
        navigate("/login");
      }
      return;
    }
    // 유료든 무료든 장바구니에 담는 로직은 동일
    addToCartMutation.mutate(courseId);
  };

  // '바로 결제하기' 또는 '무료 수강 신청' 버튼 클릭 시 실행
  const handleBuyNow = () => {
    if (!user) {
      if (
        window.confirm("로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?")
      ) {
        navigate("/login");
      }
      return;
    }

    // 무료 강좌일 경우, 즉시 수강 신청 로직 실행
    if (isFree) {
      freeEnrollMutation.mutate(courseId);
    } else {
      // 유료 강좌일 경우, 결제 페이지로 이동 (나중에 구현)
      // 바로 결제할 강좌 정보를 state에 담아서 전달합니다.
      alert("결제 페이지로 이동합니다. (구현 예정)");
      navigate("/checkout", { state: { items: [course] } });
    }
  };

  let userRole = "visitor"; // 기본값 : 방문자
  if (user && course) {
    if (user.userIdx === course.instructor_idx) {
      userRole = "instructor"; // 강사 본인
    } else if (course.enrollment) {
      userRole = "enrolled"; // 수강중인 학생
    }
  }

  if (isLoading)
    return <div className="text-center p-10">강좌 정보를 불러오는 중...</div>;
  if (isError)
    return (
      <div className="text-center p-10 text-red-500">
        오류: {error.response?.data?.message || error.message}
      </div>
    );

  const totalLectures = course.sections.reduce(
    (acc, section) => acc + section.lectures.length,
    0
  );
  const totalDuration = course.sections.reduce(
    (acc, section) =>
      acc +
      section.lectures.reduce(
        (lecAcc, lecture) => lecAcc + lecture.duration_seconds,
        0
      ),
    0
  );

  // [신규] 수강생일 경우에만 진행률 계산
  const progressPercent = course?.enrollment?.progress_percent || 0;

  // 할인중인 강좌임을 파악하는데 쓰일 변수
  const discounted =
    course.discount_price !== null && course.discount_price < course.price;

  const isFree = course.price === 0 || course.discount_price === 0;

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto p-4 md:p-8">
        {/* 상단 정보 영역 */}
        <div className="flex justify-start gap-6 bg-gray-800 text-white p-8 rounded-lg">
          <img
            src={
              `${API_BASE_URL}/${course.thumbnail_url}` ||
              "data:image/png;base64,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"
            }
            alt={course.title}
            className="w-48 h-36 flex-shrink-0 rounded-md mb-4 object-cover"
          />
          <div>
            <h1 className="text-4xl font-bold">{course.title}</h1>
            <p className="mt-2 text-lg text-gray-300">{course.description}</p>
            <p className="mt-4 text-sm">강사: {course.instructor_name}</p>
            <div className="flex items-center mt-2">
              <span className="text-yellow-400 font-bold">
                ★ {course.avg_rating.toFixed(1)}
              </span>
              <span className="text-xs text-gray-400 ml-2">
                ({course.review_count}개의 수강평)
              </span>
              <span className="text-gray-400 mx-2">|</span>
              <span className="text-sm">
                {course.enrollment_count.toLocaleString()}명의 수강생
              </span>
            </div>
          </div>
        </div>

        {/* 메인 컨텐츠 영역 (커리큘럼 + 구매) */}
        <div className="md:flex gap-8 mt-8">
          {/* 왼쪽: 커리큘럼 */}
          <div className="flex flex-col flex-grow">
            <div className="flex-grow bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold mb-4">커리큘럼</h2>
              <div className="space-y-4">
                {course.sections.map((section) => (
                  <div key={section.idx}>
                    <h3 className="font-semibold bg-gray-100 p-3 rounded-t-md">
                      {section.order}. {section.title}
                    </h3>
                    <ul className="border rounded-b-md">
                      {section.lectures.map((lecture) => (
                        <li
                          key={lecture.idx}
                          className="flex justify-between items-center p-3 border-t"
                        >
                          <span className="text-sm text-gray-700">
                            {lecture.order}. {lecture.title}
                          </span>
                          <span className="text-xs text-gray-500">
                            {Math.floor(lecture.duration_seconds / 60)}분{" "}
                            {lecture.duration_seconds % 60}초
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* [신규] 수강평 컴포넌트 렌더링 */}
            <CourseReviews
              user={user}
              courseId={courseId}
              isEnrolled={userRole === "enrolled"} // 👈 (A) 수강생인지 여부
              progressPercent={progressPercent} // 👈 (B) 진행률
              onWriteReview={() => setIsReviewModalOpen(true)} // 👈 (C) 모달 여는 함수
            />
          </div>

          {/* 오른쪽: 구매 정보 */}
          <div className="w-full md:w-80 mt-8 md:mt-0 flex-shrink-0">
            {userRole === "instructor" && (
              <InstructorWidget courseId={course.idx} />
            )}
            {userRole === "enrolled" && (
              <EnrolledWidget course={course} enrollment={course.enrollment} />
            )}
            {userRole === "visitor" && (
              <PurchaseWidget
                course={course}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
                mutations={{
                  addToCart: addToCartMutation,
                  freeEnroll: freeEnrollMutation,
                }}
              />
            )}
          </div>
        </div>
      </div>

      <ReviewModal
        courseId={courseId}
        show={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
      />
    </div>
  );
}

export default CourseDetailPage;
