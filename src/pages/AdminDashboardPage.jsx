import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import {
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  AcademicCapIcon,
  ChatBubbleLeftRightIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/solid";
import Swal from "sweetalert2";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// --- API 함수들 ---
const fetchPendingCourses = async (token) => {
  const { data } = await axios.get(
    `${API_BASE_URL}/api/admin/pending-courses`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data;
};
const fetchAllCourses = async (token) => {
  const { data } = await axios.get(`${API_BASE_URL}/api/admin/courses`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};
const fetchAllUsers = async (token) => {
  const { data } = await axios.get(`${API_BASE_URL}/api/admin/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};
const fetchAllQna = async (token) => {
  const { data } = await axios.get(`${API_BASE_URL}/api/admin/qna/all`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

// (액션 API들)
const approveCourse = async ({ courseId, token }) =>
  axios.patch(
    `${API_BASE_URL}/api/admin/courses/${courseId}/approve`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
const rejectCourse = async ({ courseId, token }) =>
  axios.patch(
    `${API_BASE_URL}/api/admin/courses/${courseId}/reject`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
const toggleBlockUser = async ({ userId, block, token }) =>
  axios.patch(
    `${API_BASE_URL}/api/admin/users/${userId}/block`,
    { block },
    { headers: { Authorization: `Bearer ${token}` } }
  );
const deleteQuestion = async ({ questionId, token }) =>
  axios.delete(`${API_BASE_URL}/api/qna/${questionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
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

// ... (EditablePrice, StatusBadge, AdminRowSkeleton 컴포넌트는 기존과 동일 - 생략하지 않고 포함시킴) ...
const EditablePrice = ({ course, token, queryClient }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [price, setPrice] = useState(course.price);
  const [discountPrice, setDiscountPrice] = useState(course.discount_price);

  const mutation = useMutation({
    mutationFn: updateCoursePrice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-all-courses"] });
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
          placeholder="할인가"
        />
        <button onClick={handleSave} className="text-xs text-blue-600 mt-1">
          저장
        </button>
      </div>
    );
  }
  return (
    <div
      onClick={() => setIsEditing(true)}
      className="cursor-pointer hover:bg-gray-100 p-1 rounded"
    >
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

const StatusBadge = ({ status }) => {
  const statusStyles = {
    draft: "bg-yellow-100 text-yellow-800",
    published: "bg-green-100 text-green-800",
    pending: "bg-blue-100 text-blue-800",
    archived: "bg-red-100 text-red-800",
  };
  const statusText = {
    draft: "초안",
    published: "게시됨",
    pending: "검수 대기",
    archived: "보관됨",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
        statusStyles[status] || "bg-gray-100 text-gray-800"
      }`}
    >
      {statusText[status] || status}
    </span>
  );
};

// ------------------------------------------
// 1. 강좌 관리 탭 (기존 유지)
// ------------------------------------------
const CourseTab = ({ token }) => {
  const queryClient = useQueryClient();
  const { data: pendingCourses } = useQuery({
    queryKey: ["admin-pending"],
    queryFn: () => fetchPendingCourses(token),
  });
  const { data: allCourses } = useQuery({
    queryKey: ["admin-all-courses"],
    queryFn: () => fetchAllCourses(token),
  });

  const approveMutation = useMutation({
    mutationFn: approveCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending"] });
      queryClient.invalidateQueries({ queryKey: ["admin-all-courses"] });
      Swal.fire("승인 완료", "강좌가 게시되었습니다.", "success");
    },
  });
  const rejectMutation = useMutation({
    mutationFn: rejectCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending"] });
      queryClient.invalidateQueries({ queryKey: ["admin-all-courses"] });
      Swal.fire("반려 완료", "강좌가 초안으로 돌아갔습니다.", "info");
    },
  });

  return (
    <div className="space-y-8">
      {/* 검수 대기 목록 */}
      <div className="bg-white p-6 rounded-lg shadow border border-yellow-200">
        <h3 className="text-lg font-bold text-yellow-700 mb-4 flex items-center gap-2">
          <CheckCircleIcon className="w-5 h-5" /> 검수 대기중인 강좌 (
          {pendingCourses?.length || 0})
        </h3>
        <table className="w-full text-sm text-left">
          <thead className="bg-yellow-50 text-yellow-800">
            <tr>
              <th className="p-2">강좌명</th>
              <th className="p-2">강사</th>
              <th className="p-2">승인/반려</th>
            </tr>
          </thead>
          <tbody>
            {pendingCourses?.map((course) => (
              <tr key={course.idx} className="border-b">
                <td className="p-2">{course.title}</td>
                <td className="p-2">{course.instructor_name}</td>
                <td className="p-2 flex gap-2">
                  <button
                    onClick={() =>
                      approveMutation.mutate({ courseId: course.idx, token })
                    }
                    className="text-green-600 hover:text-green-800 font-bold"
                  >
                    승인
                  </button>
                  <button
                    onClick={() =>
                      rejectMutation.mutate({ courseId: course.idx, token })
                    }
                    className="text-red-600 hover:text-red-800 font-bold"
                  >
                    반려
                  </button>
                </td>
              </tr>
            ))}
            {pendingCourses?.length === 0 && (
              <tr>
                <td colSpan="3" className="p-4 text-center text-gray-400">
                  대기중인 강좌가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 전체 강좌 목록 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-bold text-gray-700 mb-4">전체 강좌 목록</h3>
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2">상태</th>
                <th className="p-2">강좌명</th>
                <th className="p-2">강사</th>
                <th className="p-2">가격 (클릭하여 수정)</th>
                <th className="p-2">수강생</th>
              </tr>
            </thead>
            <tbody>
              {allCourses?.map((course) => (
                <tr key={course.idx} className="border-b hover:bg-gray-50">
                  <td className="p-2">
                    <StatusBadge status={course.status} />
                  </td>
                  <td className="p-2 truncate max-w-xs">{course.title}</td>
                  <td className="p-2">{course.instructor_name}</td>
                  <td className="p-2">
                    <EditablePrice
                      course={course}
                      token={token}
                      queryClient={queryClient}
                    />
                  </td>
                  <td className="p-2">{course.enrollment_count}명</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------
// 2. 사용자 관리 탭 (필터 & 소트 추가)
// ------------------------------------------
const UserTab = ({ token }) => {
  const queryClient = useQueryClient();
  const { data: users } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => fetchAllUsers(token),
  });

  // [신규] 필터 & 소트 상태
  const [showAdmins, setShowAdmins] = useState(false); // 기본값: 관리자 제외하고 보기
  const [sortOrder, setSortOrder] = useState("desc"); // desc: 최신순, asc: 과거순

  // [신규] 데이터 가공
  const filteredUsers = useMemo(() => {
    if (!users) return [];

    let result = [...users];

    // 1. 필터 (관리자 제외)
    if (!showAdmins) {
      result = result.filter((user) => user.role !== "admin");
    }

    // 2. 정렬 (가입일 기준)
    result.sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [users, showAdmins, sortOrder]);

  const blockMutation = useMutation({
    mutationFn: toggleBlockUser,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      Swal.fire("처리 완료", data.message, "success");
    },
  });

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-700">
          사용자 관리 ({filteredUsers.length}명)
        </h3>

        {/* [신규] 필터 & 소트 컨트롤 */}
        <div className="flex items-center gap-4 text-sm">
          <label className="flex items-center gap-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showAdmins}
              onChange={(e) => setShowAdmins(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-600">관리자 포함 보기</span>
          </label>

          <div className="flex items-center gap-1 bg-gray-100 rounded-md px-2 py-1">
            <ArrowsUpDownIcon className="w-4 h-4 text-gray-500" />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="bg-transparent border-none text-gray-600 focus:ring-0 text-sm cursor-pointer"
            >
              <option value="desc">최신 가입순</option>
              <option value="asc">오래된 가입순</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3">ID</th>
              <th className="p-3">이름/이메일</th>
              <th className="p-3">역할</th>
              <th className="p-3">가입일</th>
              <th className="p-3">관리</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr
                key={user.idx}
                className={`border-b ${
                  user.is_blocked ? "bg-red-50" : "hover:bg-gray-50"
                }`}
              >
                <td className="p-3">{user.idx}</td>
                <td className="p-3">
                  <div className="font-bold">{user.name}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </td>
                <td className="p-3">
                  {user.role === "admin" ? (
                    <span className="text-purple-600 font-bold">관리자</span>
                  ) : user.is_verified_instructor ? (
                    <span className="text-blue-600 font-bold">인증 강사</span>
                  ) : (
                    "일반 회원"
                  )}
                </td>
                <td className="p-3">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="p-3">
                  {user.role !== "admin" && (
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            `정말 ${user.name}님을 ${
                              user.is_blocked ? "차단 해제" : "차단"
                            }하시겠습니까?`
                          )
                        )
                          blockMutation.mutate({
                            userId: user.idx,
                            block: !user.is_blocked,
                            token,
                          });
                      }}
                      className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-bold border ${
                        user.is_blocked
                          ? "border-gray-400 text-gray-600 bg-white"
                          : "border-red-200 text-red-600 bg-red-50 hover:bg-red-100"
                      }`}
                    >
                      {user.is_blocked ? "차단 해제" : "계정 정지"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ------------------------------------------
// 3. 커뮤니티 관리 탭 (소트 & 새 창 열기 추가)
// ------------------------------------------
const CommunityTab = ({ token }) => {
  const queryClient = useQueryClient();
  const { data: qnaList } = useQuery({
    queryKey: ["admin-qna"],
    queryFn: () => fetchAllQna(token),
  });

  // [신규] 소트 상태
  const [sortOrder, setSortOrder] = useState("desc");

  // [신규] 데이터 가공
  const sortedQnaList = useMemo(() => {
    if (!qnaList) return [];
    return [...qnaList].sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });
  }, [qnaList, sortOrder]);

  const deleteMutation = useMutation({
    mutationFn: deleteQuestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-qna"] });
      Swal.fire("삭제 완료", "게시글이 삭제되었습니다.", "success");
    },
  });

  // [신규] 새 창 열기 핸들러
  const handleOpenPost = (id) => {
    window.open(`/qna/${id}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-700">
          전체 질문글 ({sortedQnaList.length})
        </h3>

        {/* [신규] 소트 컨트롤 */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-md px-2 py-1 text-sm">
          <ArrowsUpDownIcon className="w-4 h-4 text-gray-500" />
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="bg-transparent border-none text-gray-600 focus:ring-0 text-sm cursor-pointer"
          >
            <option value="desc">최신 작성순</option>
            <option value="asc">오래된 작성순</option>
          </select>
        </div>
      </div>

      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-3">제목</th>
            <th className="p-3">작성자</th>
            <th className="p-3">작성일</th>
            <th className="p-3">삭제</th>
          </tr>
        </thead>
        <tbody>
          {sortedQnaList.map((q) => (
            <tr key={q.idx} className="border-b hover:bg-gray-50 group">
              <td className="p-3 max-w-xs">
                <div
                  onClick={() => handleOpenPost(q.idx)}
                  className="flex items-center gap-2 cursor-pointer hover:text-blue-600"
                  title="새 탭에서 열기"
                >
                  <span className="text-gray-400 font-medium text-xs">
                    [{q.category}]
                  </span>
                  <span className="truncate">{q.title}</span>
                  <ArrowTopRightOnSquareIcon className="w-3 h-3 text-gray-300 group-hover:text-blue-400" />
                </div>
              </td>
              <td className="p-3">{q.author_name}</td>
              <td className="p-3">
                {new Date(q.created_at).toLocaleDateString()}
              </td>
              <td className="p-3">
                <button
                  onClick={() => {
                    if (window.confirm("정말 이 게시글을 삭제하시겠습니까?"))
                      deleteMutation.mutate({ questionId: q.idx, token });
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <XCircleIcon className="w-5 h-5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ------------------------------------------
// 메인 대시보드 페이지
// ------------------------------------------
function AdminDashboardPage() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState("courses"); // 'courses' | 'users' | 'community'

  const tabClass = (tabName) =>
    `flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 rounded-b-none ${
      activeTab === tabName
        ? "border-blue-600 text-blue-600 bg-blue-50"
        : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
    }`;

  return (
    <div className="max-w-7xl mx-auto p-6 min-h-screen bg-gray-50">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">관리자 센터</h1>
      </div>

      {/* 메인 탭 네비게이션 */}
      <div className="bg-white rounded-t-lg shadow-sm border-b border-gray-200 flex mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab("courses")}
          className={tabClass("courses")}
        >
          <AcademicCapIcon className="w-5 h-5" /> 강좌 관리
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={tabClass("users")}
        >
          <UserIcon className="w-5 h-5" /> 사용자 관리
        </button>
        <button
          onClick={() => setActiveTab("community")}
          className={tabClass("community")}
        >
          <ChatBubbleLeftRightIcon className="w-5 h-5" /> 커뮤니티 관리
        </button>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="animate-fade-in">
        {activeTab === "courses" && <CourseTab token={token} />}
        {activeTab === "users" && <UserTab token={token} />}
        {activeTab === "community" && <CommunityTab token={token} />}
      </div>
    </div>
  );
}

export default AdminDashboardPage;
