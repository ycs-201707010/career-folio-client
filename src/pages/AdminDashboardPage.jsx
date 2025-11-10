import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import AdminRowSkeleton from "../components/skeleton/AdminRowSkeleton";
import StatusBadge from "../components/StatusBadge";
// 👇 [추가] 아이콘
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";

const API_BASE_URL = "http://localhost:8080";

// --- API 호출 함수들 ---

// 1. [신규] 검수 대기 강좌 목록
const fetchPendingCourses = async (token) => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const { data } = await axios.get(
    `${API_BASE_URL}/api/admin/pending-courses`,
    config
  );
  return data;
};

// 2. [기존] 모든 강좌 목록
const fetchAllCourses = async (token) => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const { data } = await axios.get(`${API_BASE_URL}/api/admin/courses`, config);
  return data;
};

// 3. [신규] 강좌 승인
const approveCourse = async ({ courseId, token }) => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const { data } = await axios.patch(
    `${API_BASE_URL}/api/admin/courses/${courseId}/approve`,
    {}, // (body는 비어있음)
    config
  );
  return data;
};

// 4. [신규] 강좌 반려
const rejectCourse = async ({ courseId, token }) => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const { data } = await axios.patch(
    `${API_BASE_URL}/api/admin/courses/${courseId}/reject`,
    {}, // (TODO: 반려 사유(reason)를 body에 추가 가능)
    config
  );
  return data;
};

// 5. [기존] 가격 변경 (수정 없음)
const updateCoursePrice = async ({
  courseId,
  price,
  discount_price,
  token,
}) => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const { data } = await axios.put(
    `${API_BASE_URL}/api/admin/courses/${courseId}/price`,
    { price, discount_price },
    config
  );
  return data;
};

// 6. [삭제] updateCourseStatus (사용 안 함)

// --- (기존) 가격 수정 컴포넌트 (수정 없음) ---
const EditablePrice = ({ course, token, queryClient }) => {
  // ... (대리님 코드 그대로) ...
  const [isEditing, setIsEditing] = useState(false);
  const [price, setPrice] = useState(course.price);
  const [discountPrice, setDiscountPrice] = useState(course.discount_price);

  const mutation = useMutation({
    mutationFn: updateCoursePrice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-all-courses"] }); // 👈 쿼리 키 이름 변경
      setIsEditing(false);
    },
    onError: (error) =>
      alert(error.response?.data?.message || "가격 변경 실패"),
  });

  const handleSave = () => {
    mutation.mutate({
      courseId: course.idx,
      price: parseFloat(price),
      discount_price:
        discountPrice === "" || discountPrice === null
          ? null
          : parseFloat(discountPrice),
      token,
    });
  };

  if (isEditing) {
    return (
      <div className="flex flex-col gap-1">
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="text-xs p-1 border rounded"
          placeholder="정가"
        />
        <input
          type="number"
          value={discountPrice ?? ""}
          onChange={(e) => setDiscountPrice(e.target.value)}
          className="text-xs p-1 border rounded"
          placeholder="할인가 (없으면 비워두세요)"
        />
        <button onClick={handleSave} className="text-xs text-blue-600 mt-1">
          저장
        </button>
      </div>
    );
  }
  return (
    <div onClick={() => setIsEditing(true)} className="cursor-pointer">
      {course.discount_price !== null &&
      course.discount_price < course.price ? (
        <div>
          <span className="text-xs text-gray-400 line-through">
            ₩{Number(course.price).toLocaleString()}
          </span>
          <br />
          <span className="font-bold text-red-500">
            ₩{Number(course.discount_price).toLocaleString()}
          </span>
        </div>
      ) : (
        <span>₩{Number(course.price).toLocaleString()}</span>
      )}
    </div>
  );
};

// --- [신규] 상태 뱃지 컴포넌트 ---
// const StatusBadge = ({ status }) => {
//   const statusStyles = {
//     draft: "bg-yellow-100 text-yellow-800",
//     published: "bg-green-100 text-green-800",
//     pending: "bg-blue-100 text-blue-800",
//     archived: "bg-red-100 text-red-800",
//   };
//   const statusText = {
//     draft: "초안",
//     published: "게시됨",
//     pending: "검수 대기",
//     archived: "보관됨",
//   };
//   return (
//     <span
//       className={`px-2 py-0.5 rounded-full text-xs font-medium ${
//         statusStyles[status] || "bg-gray-100 text-gray-800"
//       }`}
//     >
//       {statusText[status] || status}
//     </span>
//   );
// };

/** 메인 함수 (전면 수정) */
function AdminDashboardPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [currentTab, setCurrentTab] = useState("pending"); // 'pending' | 'all'

  // 1. "검수 대기" 강좌 목록
  const { data: pendingCourses, isLoading: isPendingLoading } = useQuery({
    queryKey: ["admin-pending-courses"],
    queryFn: () => fetchPendingCourses(token),
    enabled: !!token,
  });

  // 2. "전체" 강좌 목록
  const { data: allCourses, isLoading: isAllLoading } = useQuery({
    queryKey: ["admin-all-courses"],
    queryFn: () => fetchAllCourses(token),
    enabled: !!token,
  });

  // 3. 강좌 "승인" 뮤테이션
  const approveMutation = useMutation({
    mutationFn: approveCourse,
    onSuccess: () => {
      // 두 쿼리 키를 모두 무효화하여 양쪽 탭을 모두 갱신
      queryClient.invalidateQueries({ queryKey: ["admin-pending-courses"] });
      queryClient.invalidateQueries({ queryKey: ["admin-all-courses"] });
    },
    onError: (error) => alert(error.response?.data?.message || "승인 실패"),
  });

  // 4. 강좌 "반려" 뮤테이션
  const rejectMutation = useMutation({
    mutationFn: rejectCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-courses"] });
      queryClient.invalidateQueries({ queryKey: ["admin-all-courses"] });
    },
    onError: (error) => alert(error.response?.data?.message || "반려 실패"),
  });

  const handleApprove = (courseId) => {
    if (
      window.confirm("이 강좌를 승인하고 강사를 '검증됨'으로 변경하시겠습니까?")
    ) {
      approveMutation.mutate({ courseId, token });
    }
  };

  const handleReject = (courseId) => {
    if (window.confirm("이 강좌를 반려하고 '초안' 상태로 되돌리시겠습니까?")) {
      rejectMutation.mutate({ courseId, token });
    }
  };

  const isLoading = currentTab === "pending" ? isPendingLoading : isAllLoading; // 👈 탭에 맞는 로딩 상태
  const coursesToShow = currentTab === "pending" ? pendingCourses : allCourses;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">관리자 대시보드</h1>

      {/* --- [신규] 탭 네비게이션 --- */}
      <div className="mb-4 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setCurrentTab("pending")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm rounded-none ${
              currentTab === "pending"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            검수 대기
            {pendingCourses && pendingCourses.length > 0 && (
              <span className="ml-2 bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs">
                {pendingCourses.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setCurrentTab("all")}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm rounded-none ${
              currentTab === "all"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            전체 강좌
          </button>
          {/* TODO: 여기에 "사용자 관리", "Q&A 관리" 탭 추가 (확장성) */}
        </nav>
      </div>

      {/* --- [수정] 테이블 렌더링 영역 --- */}
      <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3">강좌 제목</th>
              <th className="p-3">강사</th>
              <th className="p-3">가격</th>
              <th className="p-3">상태</th>
              <th className="p-3">
                {currentTab === "pending" ? "승인/반려" : "생성일"}
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? // <tr>
                //   <td colSpan="5" className="text-center p-4">
                //     로딩 중...
                //   </td>
                // </tr>
                Array.from({ length: 5 }).map((_, i) => (
                  <AdminRowSkeleton key={i} />
                ))
              : coursesToShow?.map((course) => (
                  <tr key={course.idx} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{course.title}</td>
                    <td className="p-3">{course.instructor_name}</td>
                    <td className="p-3">
                      {/* "전체" 탭에서만 가격 수정 가능 */}
                      {currentTab === "all" ? (
                        <EditablePrice
                          course={course}
                          token={token}
                          queryClient={queryClient}
                        />
                      ) : (
                        <span>₩{Number(course.price).toLocaleString()}</span>
                      )}
                    </td>
                    <td className="p-3">
                      <StatusBadge status={course.status} />
                    </td>
                    <td className="p-3">
                      {/* [핵심 수정] 탭에 따라 다른 액션 표시 */}
                      {currentTab === "pending" ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(course.idx)}
                            disabled={approveMutation.isPending}
                            className="text-green-600 hover:text-green-800"
                          >
                            <CheckCircleIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleReject(course.idx)}
                            disabled={rejectMutation.isPending}
                            className="text-red-600 hover:text-red-800"
                          >
                            <XCircleIcon className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <span>
                          {new Date(course.created_at).toLocaleDateString()}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
            {!isLoading && coursesToShow?.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center p-4 text-gray-500">
                  {currentTab === "pending"
                    ? "검수 대기 중인 강좌가 없습니다."
                    : "강좌가 없습니다."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminDashboardPage;
