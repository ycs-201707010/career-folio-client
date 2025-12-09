import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  AtSymbolIcon,
  UserIcon,
  KeyIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/solid";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// (로딩 컴포넌트 재사용)
const LoadingDots = () => (
  <div className="flex space-x-1 justify-center items-center h-full">
    <div className="h-1.5 w-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
    <div className="h-1.5 w-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
    <div className="h-1.5 w-1.5 bg-current rounded-full animate-bounce"></div>
  </div>
);

function FindAccountPage() {
  const [activeTab, setActiveTab] = useState("findId"); // 'findId' | 'resetPw'
  const navigate = useNavigate();

  // 폼 상태
  const [formData, setFormData] = useState({
    name: "",
    id: "",
    email: "",
    emailCode: "",
    newPassword: "",
    confirmPassword: "",
  });

  // UI 상태
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [foundId, setFoundId] = useState(null); // 찾은 아이디 저장

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 1. 이메일 인증 코드 발송
  const handleSendCode = async () => {
    setIsSendingCode(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/send-code`, {
        email: formData.email,
        type: "find",
      });
      Swal.fire("전송 완료", res.data.message, "success");
    } catch (err) {
      Swal.fire("오류", err.response?.data?.message || "전송 실패", "error");
    } finally {
      setIsSendingCode(false);
    }
  };

  // 2. 인증 코드 확인
  const handleVerifyCode = async () => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/verify-code`, {
        email: formData.email,
        code: formData.emailCode,
      });
      Swal.fire("인증 성공", res.data.message, "success");
      setIsEmailVerified(true);
    } catch (err) {
      Swal.fire(
        "인증 실패",
        err.response?.data?.message || "코드 불일치",
        "error"
      );
    }
  };

  // 3. 아이디 찾기 실행
  const handleFindId = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(`${API_BASE_URL}/api/auth/find-id`, {
        name: formData.name,
        email: formData.email,
      });
      setFoundId(data.id); // 아이디 표시
    } catch (err) {
      Swal.fire(
        "찾기 실패",
        err.response?.data?.message || "정보 불일치",
        "error"
      );
    }
  };

  // 4. 비밀번호 재설정 실행
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      return Swal.fire("오류", "비밀번호가 일치하지 않습니다.", "warning");
    }
    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/api/auth/reset-password`,
        {
          id: formData.id,
          name: formData.name,
          email: formData.email,
          newPassword: formData.newPassword,
        }
      );
      Swal.fire("변경 성공", data.message, "success").then(() => {
        navigate("/login");
      });
    } catch (err) {
      Swal.fire(
        "변경 실패",
        err.response?.data?.message || "오류 발생",
        "error"
      );
    }
  };

  // 탭 변경 시 상태 초기화
  const switchTab = (tab) => {
    setActiveTab(tab);
    setFormData({
      name: "",
      id: "",
      email: "",
      emailCode: "",
      newPassword: "",
      confirmPassword: "",
    });
    setIsEmailVerified(false);
    setFoundId(null);
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-8 bg-white rounded-lg shadow-lg border border-gray-100">
      <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
        계정 찾기
      </h1>

      {/* 탭 네비게이션 */}
      <div className="flex border-b mb-6 rounded-none">
        <button
          className={`flex-1 py-3 text-sm font-medium rounded-none ${
            activeTab === "findId"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => switchTab("findId")}
        >
          아이디 찾기
        </button>
        <button
          className={`flex-1 py-3 text-sm font-medium rounded-none ${
            activeTab === "resetPw"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => switchTab("resetPw")}
        >
          비밀번호 재설정
        </button>
      </div>

      {/* --- [아이디 찾기] --- */}
      {activeTab === "findId" && (
        <form onSubmit={handleFindId} className="space-y-4">
          {/* 결과 화면 */}
          {foundId ? (
            <div className="text-center py-8 animate-fade-in">
              <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-600 mb-1">회원님의 아이디는</p>
              <p className="text-2xl font-bold text-blue-600 mb-6">{foundId}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate("/login")}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
                >
                  로그인
                </button>
                <button
                  onClick={() => switchTab("resetPw")}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-md hover:bg-gray-200"
                >
                  비밀번호 찾기
                </button>
              </div>
            </div>
          ) : (
            /* 입력 폼 */
            <>
              <input
                type="text"
                name="name"
                placeholder="이름"
                value={formData.name}
                onChange={handleChange}
                className="w-full border p-2 rounded-md"
                required
              />

              {/* 이메일 인증 컴포넌트 (공통) */}
              <EmailVerificationSection
                formData={formData}
                handleChange={handleChange}
                handleSendCode={handleSendCode}
                handleVerifyCode={handleVerifyCode}
                isSendingCode={isSendingCode}
                isEmailVerified={isEmailVerified}
              />

              <button
                type="submit"
                disabled={!isEmailVerified}
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed mt-4"
              >
                아이디 찾기
              </button>
            </>
          )}
        </form>
      )}

      {/* --- [비밀번호 재설정] --- */}
      {activeTab === "resetPw" && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <input
            type="text"
            name="id"
            placeholder="아이디"
            value={formData.id}
            onChange={handleChange}
            className="w-full border p-2 rounded-md"
            required
          />
          <input
            type="text"
            name="name"
            placeholder="이름"
            value={formData.name}
            onChange={handleChange}
            className="w-full border p-2 rounded-md"
            required
          />

          <EmailVerificationSection
            formData={formData}
            handleChange={handleChange}
            handleSendCode={handleSendCode}
            handleVerifyCode={handleVerifyCode}
            isSendingCode={isSendingCode}
            isEmailVerified={isEmailVerified}
          />

          {/* 인증 완료 시 새 비밀번호 입력창 노출 */}
          {isEmailVerified && (
            <div className="space-y-3 pt-4 border-t animate-fade-in">
              <input
                type="password"
                name="newPassword"
                placeholder="새 비밀번호"
                value={formData.newPassword}
                onChange={handleChange}
                className="w-full border p-2 rounded-md"
                required
              />
              <input
                type="password"
                name="confirmPassword"
                placeholder="새 비밀번호 확인"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full border p-2 rounded-md"
                required
              />
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
              >
                비밀번호 변경
              </button>
            </div>
          )}
        </form>
      )}
    </div>
  );
}

// (공통) 이메일 인증 UI 컴포넌트
const EmailVerificationSection = ({
  formData,
  handleChange,
  handleSendCode,
  handleVerifyCode,
  isSendingCode,
  isEmailVerified,
}) => (
  <div className="space-y-3">
    <div className="flex gap-2">
      <input
        type="email"
        name="email"
        placeholder="이메일"
        value={formData.email}
        onChange={handleChange}
        className="flex-1 border p-2 rounded-md"
        readOnly={isEmailVerified}
      />
      <button
        type="button"
        onClick={handleSendCode}
        disabled={isEmailVerified || isSendingCode}
        className="w-24 bg-gray-800 text-white text-sm rounded-md hover:bg-gray-900 disabled:bg-gray-400"
      >
        {isSendingCode ? (
          <LoadingDots />
        ) : isEmailVerified ? (
          "인증됨"
        ) : (
          "인증번호"
        )}
      </button>
    </div>
    <div className="flex gap-2">
      <input
        type="text"
        name="emailCode"
        placeholder="인증번호 6자리"
        value={formData.emailCode}
        onChange={handleChange}
        className="flex-1 border p-2 rounded-md"
        readOnly={isEmailVerified}
        maxLength={6}
      />
      <button
        type="button"
        onClick={handleVerifyCode}
        disabled={isEmailVerified || formData.emailCode.length < 6}
        className="w-24 bg-blue-50 text-blue-600 border border-blue-200 text-sm rounded-md hover:bg-blue-100 disabled:opacity-50"
      >
        확인
      </button>
    </div>
  </div>
);

export default FindAccountPage;
