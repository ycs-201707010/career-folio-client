import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:8080";

const fetchCartItems = async (token) => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const { data } = await axios.get(`${API_BASE_URL}/api/cart`, config);
  return data;
};

const removeFromCart = async ({ courseId, token }) => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  await axios.delete(`${API_BASE_URL}/api/cart/${courseId}`, config);
};

function CartPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: cartItems, isLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: () => fetchCartItems(token),
    enabled: !!token,
  });

  const itemRemoveMutation = useMutation({
    mutationFn: removeFromCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const totalPrice = cartItems?.reduce(
    (acc, item) => acc + (item.discount_price ?? item.price),
    0
  );

  // '결제하기' 버튼 클릭 시 실행될 함수
  const handleCheckout = () => {
    if (!cartItems || cartItems.length === 0) {
      alert("결제할 상품이 없습니다.");
      return;
    }
    // 결제 페이지로 이동하면서, state에 장바구니 목록 전체를 담아 전달
    navigate("/checkout", { state: { items: cartItems } });
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6">장바구니</h1>
      {isLoading ? (
        <p>로딩 중...</p>
      ) : !cartItems || cartItems.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg shadow-md">
          <p className="text-gray-500">장바구니가 비어있습니다.</p>
          <Link
            to="/courses"
            className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            강의 보러 가기
          </Link>
        </div>
      ) : (
        <div className="md:flex gap-8">
          {/* 왼쪽: 상품 목록 */}
          <div className="flex-grow">
            {cartItems.map((item) => (
              <div
                key={item.idx}
                className="flex gap-4 p-4 mb-4 bg-white rounded-lg shadow-sm"
              >
                <img
                  src={
                    item.thumbnail_url || "https://via.placeholder.com/150x90"
                  }
                  alt={item.title}
                  className="w-40 h-24 object-cover rounded-md"
                />
                <div className="flex-grow">
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-xs text-gray-500">
                    강사: {item.instructor_name}
                  </p>
                  <p className="text-sm font-bold mt-2">
                    ₩
                    {Number(item.discount_price ?? item.price).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() =>
                    itemRemoveMutation.mutate({ courseId: item.idx, token })
                  }
                  className="text-gray-400 hover:text-red-500 text-xs"
                >
                  삭제
                </button>
              </div>
            ))}
          </div>

          {/* 오른쪽: 결제 정보 */}
          <div className="w-full md:w-64 mt-8 md:mt-0 flex-shrink-0">
            <div className="bg-white p-6 rounded-lg shadow-md sticky top-8">
              <h2 className="text-lg font-bold mb-4">결제 예상 금액</h2>
              <div className="flex justify-between">
                <span>총 상품 금액</span>
                <span>₩{Number(totalPrice).toLocaleString()}</span>
              </div>
              <hr className="my-4" />
              <div className="flex justify-between font-bold text-xl">
                <span>총 결제 금액</span>
                <span>₩{Number(totalPrice).toLocaleString()}</span>
              </div>
              <button
                onClick={handleCheckout}
                className="w-full mt-6 bg-red-500 text-white font-bold py-3 rounded-md hover:bg-red-600"
              >
                결제하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CartPage;
