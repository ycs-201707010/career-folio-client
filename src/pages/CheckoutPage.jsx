import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL = "http://localhost:8080";

const processCheckout = async ({ courseIds, token }) => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const { data } = await axios.post(
    `${API_BASE_URL}/api/payments/checkout`,
    { courseIds },
    config
  );
  return data;
};

function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  // 강좌 상세 페이지 또는 장바구니 페이지에서 넘겨준 결제할 아이템 목록
  const items = location.state?.items || [];

  const mutation = useMutation({
    mutationFn: processCheckout,
    onSuccess: () => {
      alert("결제가 완료되었습니다!");
      // 장바구니 캐시를 무효화하여 비워줍니다.
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      navigate("/my-courses"); // 결제 성공 후 내 강좌 목록으로 이동
    },
    onError: (err) => alert(err.response?.data?.message || "결제 중 오류 발생"),
  });

  const handleCheckout = () => {
    const courseIds = items.map((item) => item.idx);
    mutation.mutate({ courseIds, token });
  };

  const totalPrice = items.reduce(
    (acc, item) => acc + (item.discount_price ?? item.price),
    0
  );

  if (items.length === 0) {
    return (
      <div className="text-center p-10">
        <p>결제할 상품이 없습니다.</p>
        <button
          onClick={() => navigate("/courses")}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
        >
          강의 보러가기
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6">주문/결제</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4">주문 상품</h2>
        {items.map((item) => (
          <div
            key={item.idx}
            className="flex justify-between items-center py-2 border-b"
          >
            <span>{item.title}</span>
            <span className="font-medium">
              ₩{Number(item.discount_price ?? item.price).toLocaleString()}
            </span>
          </div>
        ))}
        <div className="flex justify-between font-bold text-xl mt-4 pt-4 border-t">
          <span>총 결제 금액</span>
          <span>₩{Number(totalPrice).toLocaleString()}</span>
        </div>
        <button
          onClick={handleCheckout}
          disabled={mutation.isPending}
          className="w-full mt-6 bg-blue-600 text-white font-bold py-3 rounded-md hover:bg-blue-700 transition disabled:bg-gray-400"
        >
          {mutation.isPending
            ? "결제 처리 중..."
            : `${Number(totalPrice).toLocaleString()}원 결제하기`}
        </button>
      </div>
    </div>
  );
}

export default CheckoutPage;
