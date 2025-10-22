import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL = "http://localhost:8080";

// API 호출 함수들
const fetchAllCourses = async (token) => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const { data } = await axios.get(`${API_BASE_URL}/api/admin/courses`, config);
  return data;
};

// 상태 변경
const updateCourseStatus = async ({ courseId, status, token }) => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const { data } = await axios.put(
    `${API_BASE_URL}/api/admin/courses/${courseId}/status`,
    { status },
    config
  );
  return data;
};

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

//  가격 수정 기능을 위한 별도 컴포넌트
const EditablePrice = ({ course, token, queryClient }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [price, setPrice] = useState(course.price);
  const [discountPrice, setDiscountPrice] = useState(course.discount_price);

  const mutation = useMutation({
    mutationFn: updateCoursePrice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
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

/** 메인 함수 */
function AdminDashboardPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const { data: courses, isLoading } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: () => fetchAllCourses(token),
    enabled: !!token,
  });

  const mutation = useMutation({
    mutationFn: updateCourseStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
    },
    onError: (error) => {
      alert(error.response?.data?.message || "상태 변경에 실패했습니다.");
    },
  });

  const handleStatusChange = (courseId, newStatus) => {
    mutation.mutate({ courseId, status: newStatus, token });
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">관리자 대시보드</h1>
      <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3">강좌 제목</th>
              <th className="p-3">강사</th>
              <th className="p-3">가격</th>
              <th className="p-3">상태</th>
              <th className="p-3">생성일</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="5" className="text-center p-4">
                  로딩 중...
                </td>
              </tr>
            ) : (
              courses?.map((course) => (
                <tr key={course.idx} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{course.title}</td>
                  <td className="p-3">{course.instructor_name}</td>
                  <td className="p-3">
                    {/* 가격 부분을 EditablePrice 컴포넌트로 교체 */}
                    <EditablePrice
                      course={course}
                      token={token}
                      queryClient={queryClient}
                    />
                  </td>
                  <td className="p-3">
                    <select
                      value={course.status}
                      onChange={(e) =>
                        handleStatusChange(course.idx, e.target.value)
                      }
                      className={`p-1 rounded text-xs ${
                        course.status === "published"
                          ? "bg-green-100 text-green-800"
                          : course.status === "draft"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      <option value="draft">초안(Draft)</option>
                      <option value="published">게시됨(Published)</option>
                      <option value="archived">보관됨(Archived)</option>
                    </select>
                  </td>
                  <td className="p-3">
                    {new Date(course.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminDashboardPage;
