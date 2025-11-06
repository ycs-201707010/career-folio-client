// ** 회원가입 페이지 **

import { useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  CheckCircleIcon,
  AtSymbolIcon,
  UserIcon,
  KeyIcon,
  IdentificationIcon,
} from "@heroicons/react/24/solid"; // npm install @heroicons/react. 아이콘을 추가한다.
import Swal from "sweetalert2"; // 커스텀 alert 창 라이브러리 임포트

// API 기본 URL을 Railway 주소로 변경
const API_BASE_URL = "http://localhost:8080"; //"https://careerfolio.up.railway.app/api/auth";

// (★★신규★★) 로딩 애니메이션 컴포넌트
const LoadingDots = () => (
  <div className="flex space-x-1 justify-center items-center h-full">
    <span className="sr-only">Loading...</span> {/* 스크린 리더용 텍스트 */}
    <div className="h-1.5 w-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
    <div className="h-1.5 w-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
    <div className="h-1.5 w-1.5 bg-current rounded-full animate-bounce"></div>
  </div>
);

/** 약관 동의 컴포넌트 */
const TOSScreen = ({ onAgree }) => {
  const [agreed, setAgreed] = useState({
    tos: false,
    privacy: false,
  });

  const handleCheck = (e) => {
    const { name, checked } = e.target;
    setAgreed((prev) => ({ ...prev, [name]: checked }));
  };

  const handleAllAgree = (e) => {
    const { checked } = e.target;
    setAgreed({
      tos: checked,
      privacy: checked,
    });
  };

  const isAllAgreed = agreed.tos && agreed.privacy;

  return (
    <div className="max-w-md mx-auto mt-10 p-6 md:p-8 border rounded-lg shadow-lg bg-white dark:bg-zinc-800">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">
        환영합니다!
      </h2>
      <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
        CareerFolio 서비스 이용을 위해 약관에 동의해주세요.
      </p>

      <div className="space-y-4">
        {/* 전체 동의 */}
        <div className="relative flex items-start rounded-md border border-gray-300 dark:border-zinc-700 p-4">
          <div className="flex h-6 items-center">
            <input
              id="all-agree"
              name="all-agree"
              type="checkbox"
              className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
              checked={isAllAgreed}
              onChange={handleAllAgree}
            />
          </div>
          <div className="ml-3 text-sm leading-6">
            <label
              htmlFor="all-agree"
              className="font-bold text-gray-900 dark:text-white"
            >
              전체 동의
            </label>
            <p className="text-gray-500 dark:text-gray-400">
              서비스 이용을 위한 필수 항목에 모두 동의합니다.
            </p>
          </div>
        </div>

        {/* 서비스 이용약관 (필수) */}
        <div className="relative flex items-start p-4">
          <div className="flex h-6 items-center">
            <input
              id="tos"
              name="tos"
              type="checkbox"
              className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
              checked={agreed.tos}
              onChange={handleCheck}
            />
          </div>
          <div className="ml-3 text-sm leading-6">
            <label
              htmlFor="tos"
              className="font-medium text-gray-900 dark:text-gray-200"
            >
              [필수] 서비스 이용약관
            </label>
            <a
              href="/terms"
              target="_blank"
              className="text-blue-600 hover:underline ml-2 text-xs"
            >
              내용 보기
            </a>
          </div>
        </div>

        {/* 개인정보 처리방침 (필수) */}
        <div className="relative flex items-start p-4">
          <div className="flex h-6 items-center">
            <input
              id="privacy"
              name="privacy"
              type="checkbox"
              className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
              checked={agreed.privacy}
              onChange={handleCheck}
            />
          </div>
          <div className="ml-3 text-sm leading-6">
            <label
              htmlFor="privacy"
              className="font-medium text-gray-900 dark:text-gray-200"
            >
              [필수] 개인정보 수집 및 이용
            </label>
            <a
              href="/privacy"
              target="_blank"
              className="text-blue-600 hover:underline ml-2 text-xs"
            >
              내용 보기
            </a>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onAgree}
        disabled={!isAllAgreed}
        className={`w-full py-2.5 rounded text-white font-semibold transition mt-8 ${
          isAllAgreed
            ? "bg-blue-600 hover:bg-blue-700"
            : "bg-gray-400 cursor-not-allowed"
        }`}
      >
        동의하고 다음으로
      </button>
    </div>
  );
};

/** 회원가입 정보 입력 컴포넌트 */
const SignupFormScreen = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    emailCode: "",
    id: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false); // 이메일 코드 발송 로딩 상태
  // 페이지 이동
  const navigate = useNavigate();

  // 항목별 유효성 상태
  const [valid, setValid] = useState({
    name: false,
    emailFormat: false, // 이메일 형식
    emailVerified: false, // 이메일 인증 완료
    idFormat: false, // 아이디 형식
    idAvailable: false, // 아이디 사용 가능
    passwordStrength: false,
    passwordMatch: false,
  });

  // 유효성 검사 함수 정의
  const validateId = (id) => /^[a-zA-Z0-9_]{4,16}$/.test(id);
  // TODO : 나중에 프로필 닉네임 변경할 때 사용하기?
  //   const validateNickname = (nickname) =>
  //     /^[가-힣a-zA-Z0-9]{2,20}$/.test(nickname);
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // 비밀번호 보안 수준 분석 함수
  const getPasswordStrength = (password) => {
    if (!password) return { level: "없음", color: "text-gray-400" };

    const strong = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}/;
    const medium = /(?=.*[a-z])(?=.*\d).{6,}/;

    if (strong.test(password))
      return { level: "강함", color: "text-green-600" };
    if (medium.test(password))
      return { level: "보통", color: "text-yellow-500" };
    return { level: "약함", color: "text-red-500" };
  };

  const strength = getPasswordStrength(formData.password);

  // 값 변경 핸들러
  const handleChange = (e) => {
    // 실시간 유효성 검사 업데이트
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === "name") {
      setValid((prev) => ({ ...prev, name: value.trim().length > 0 }));
    } else if (name === "id") {
      setValid((prev) => ({
        ...prev,
        idFormat: validateId(value),
        idAvailable: false,
      })); // id 변경 시 중복확인 리셋
    } else if (name === "email") {
      setValid((prev) => ({
        ...prev,
        emailFormat: validateEmail(value),
        emailVerified: false,
      })); // email 변경 시 인증 리셋
    } else if (name === "password") {
      const strength = getPasswordStrength(value);
      setValid((prev) => ({
        ...prev,
        passwordStrength: strength.level !== "약함",
        passwordMatch: value === formData.confirmPassword,
      }));
    } else if (name === "confirmPassword") {
      setValid((prev) => ({
        ...prev,
        passwordMatch: value === formData.password,
      }));
    }
  };

  // 아이디 중복 확인
  const checkDuplicate = async () => {
    if (!valid.idFormat)
      return Swal.fire({
        icon: "error",
        title: "형식 부적합",
        text: "아이디 형식에 적절하지 않습니다.\n영문, 숫자 조합으로 된 4~16자 사이로 작성해주세요.",
      });
    try {
      const res = await axios.get(`${API_BASE_URL}/api/auth/check-duplicate`, {
        params: { type: "id", value: formData.id },
      });
      if (res.data.exists) {
        Swal.fire({
          icon: "error",
          title: "중복 확인",
          text: "이미 사용 중인 아이디입니다.",
        });
        setValid((prev) => ({ ...prev, idAvailable: false }));
      } else {
        Swal.fire({
          icon: "success",
          title: "중복 확인",
          text: "사용이 가능한 아이디입니다.",
        });
        setValid((prev) => ({ ...prev, idAvailable: true }));
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "중복 확인",
        text: "중복 확인 중 오류가 발생했습니다.",
      });
    }
  };

  // 이메일 인증 코드 발송
  const handleSendCode = async () => {
    if (!valid.emailFormat)
      return Swal.fire({
        icon: "error",
        title: "형식 부적합",
        text: "유효한 이메일 주소를 입력해주세요.",
      });
    setIsSendingCode(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/send-code`, {
        email: formData.email,
      });
      Swal.fire({
        icon: "success",
        title: "이메일 인증",
        text: res.data.message,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "이메일 인증",
        text:
          err.response?.data?.message || "코드 발송 중 오류가 발생했습니다.",
      });
    } finally {
      setIsSendingCode(false);
    }
  };

  // 이메일 인증 코드 확인
  const handleVerifyCode = async () => {
    if (!/^\d{6}$/.test(formData.emailCode))
      return Swal.fire({
        icon: "error",
        title: "인증번호 형식 부적합",
        text: "6자리 숫자 코드를 입력하세요.",
      });

    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/verify-code`, {
        email: formData.email,
        code: formData.emailCode,
      });

      Swal.fire({
        icon: "success",
        title: "이메일 인증",
        text: res.data.message,
      });

      setValid((prev) => ({ ...prev, emailVerified: true }));
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "이메일 인증",
        text:
          err.response?.data?.message || "코드 발송 중 오류가 발생했습니다.",
      });
    }
  };

  // 모든 조건이 완료되면 회원가입 버튼 활성화.
  const isAllValid =
    valid.emailVerified &&
    valid.idAvailable &&
    valid.passwordStrength &&
    valid.passwordMatch &&
    formData.name.length > 0;

  // **Submit시 실행할 함수.**
  /** 최종 회원가입 제출 */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAllValid)
      return Swal.fire({
        icon: "error",
        title: "회원가입 오류",
        text: "모든 항목을 올바르게 입력하고 인증을 완료해주세요.",
      });
    setIsLoading(true);

    const { name, email, id, password } = formData;

    // --- 전화번호 조합 ---
    const combinedPhoneNumber = `${phone1}-${phone2}-${phone3}`;

    const requestData = {
      name,
      email,
      id,
      password,
    };

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/signup`,
        requestData
      );

      Swal.fire({
        icon: "success",
        title: "회원 가입",
        text: response.data.message,
      });
      navigate("/login");
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "회원 가입 중 오류",
        text:
          error.response?.data?.message || "회원가입 중 오류가 발생했습니다.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 md:p-8 border rounded-lg shadow-lg bg-white dark:bg-zinc-800">
      <form
        className="signup-form flex flex-col justify-center"
        onSubmit={handleSubmit}
      >
        {/* <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">
          회원가입
        </h2> */}
        <img
          src="../src/assets/careerFolio_logo.png"
          alt="로고"
          className="w-64 self-center" // 자기만 가운데로 오는구나
        />

        {/* --- [수정] 이름 (아이콘 추가) --- */}
        <div className="mb-4">
          <label
            className="block mb-1 font-semibold text-sm text-gray-700 dark:text-gray-200"
            htmlFor="name"
          >
            이름
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <IdentificationIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="홍길동"
              value={formData.name}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded dark:bg-zinc-700 dark:text-white pl-10"
              required
            />
          </div>
        </div>

        {/* --- [수정] 이메일 (아이콘 추가) --- */}
        <div className="mb-4">
          <label
            className="block mb-1 font-semibold text-sm text-gray-700 dark:text-gray-200"
            htmlFor="email"
          >
            이메일
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <AtSymbolIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                className="w-full border px-3 py-2 rounded dark:bg-zinc-700 dark:text-white pl-10"
                type="email"
                id="email"
                name="email"
                placeholder="test@example.com"
                value={formData.email}
                onChange={handleChange}
                readOnly={valid.emailVerified}
              />
            </div>
            <button
              type="button"
              className={`px-3 py-1 w-24 flex justify-center items-center rounded text-sm transition-colors duration-15 dark:bg-zinc-600 dark:text-white ${
                valid.emailFormat && !valid.emailVerified
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
              disabled={
                !valid.emailFormat || valid.emailVerified || isSendingCode
              }
              onClick={handleSendCode}
            >
              {isSendingCode ? (
                <LoadingDots />
              ) : valid.emailVerified ? (
                "인증완료"
              ) : (
                "코드 발송"
              )}
            </button>
          </div>
          {!valid.emailFormat && formData.email && (
            <p className="text-sm text-red-500 mt-1">
              유효한 이메일 형식이 아닙니다.
            </p>
          )}
        </div>

        {/* --- [수정] 인증코드 (UI 일관성) --- */}
        <div className="mb-6">
          <label className="block mb-1 font-semibold text-sm text-gray-700 dark:text-gray-200">
            이메일 인증코드
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              name="emailCode"
              placeholder="6자리 숫자"
              value={formData.emailCode}
              onChange={handleChange}
              className="flex-1 border px-3 py-2 rounded dark:bg-zinc-700 dark:text-white"
              readOnly={valid.emailVerified}
              maxLength={6}
            />
            <button
              type="button"
              className={`px-3 py-1 w-24 rounded text-sm dark:bg-zinc-600 dark:text-white ${
                formData.emailCode.length > 0 && !valid.emailVerified
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
              disabled={formData.emailCode.length === 0 || valid.emailVerified}
              onClick={handleVerifyCode}
            >
              {valid.emailVerified ? (
                <CheckCircleIcon className="h-5 w-5" />
              ) : (
                "코드 확인"
              )}
            </button>
          </div>
          {valid.emailVerified && (
            <p className="text-sm text-green-600 mt-1">
              이메일 인증이 완료되었습니다.
            </p>
          )}
        </div>

        {/* --- [삭제] 전화번호 --- */}

        {/* --- [수정] 아이디 (아이콘 추가) --- */}
        <div className="mb-4">
          <label
            className="block mb-1 font-semibold text-sm text-gray-700 dark:text-gray-200"
            htmlFor="id"
          >
            로그인 ID
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <UserIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="id"
                name="id"
                placeholder="영문/숫자 4~16자"
                value={formData.id}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded dark:bg-zinc-700 dark:text-white pl-10"
                readOnly={valid.idAvailable}
              />
            </div>
            <button
              type="button"
              className={`px-3 py-1 w-24 rounded text-sm dark:bg-zinc-600 dark:text-white ${
                valid.idFormat && !valid.idAvailable
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
              disabled={!valid.idFormat || valid.idAvailable}
              onClick={checkDuplicate}
            >
              {valid.idAvailable ? (
                <CheckCircleIcon className="h-5 w-5" />
              ) : (
                "중복 확인"
              )}
            </button>
          </div>
          {valid.idAvailable && (
            <p className="text-sm text-green-600 mt-1">
              사용 가능한 아이디입니다.
            </p>
          )}
        </div>

        {/* --- [수정] 비밀번호 (아이콘 추가) --- */}
        <div className="mb-4">
          <label
            className="block mb-1 font-semibold text-sm text-gray-700 dark:text-gray-200"
            htmlFor="password"
          >
            비밀번호
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <KeyIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="비밀번호"
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-3 py-2 rounded border focus:outline-none dark:bg-zinc-700 pl-10 ${
                strength.level === "강함"
                  ? "border-green-500"
                  : strength.level === "보통"
                  ? "border-yellow-400"
                  : formData.password
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
            />
          </div>
          {formData.password.length > 0 && (
            <p className={`text-sm mt-1 ${strength.color}`}>
              보안 수준: {strength.level}
            </p>
          )}
        </div>

        {/* --- [수정] 비밀번호 확인 (아이콘 추가) --- */}
        <div className="mb-6 relative">
          <label
            className="block mb-1 font-semibold text-sm text-gray-700 dark:text-gray-200"
            htmlFor="confirmPassword"
          >
            비밀번호 확인
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <KeyIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              placeholder="비밀번호 확인"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full px-3 py-2 rounded border focus:outline-none dark:bg-zinc-700 transition-all duration-300 pl-10 ${
                valid.passwordMatch
                  ? "border-green-400"
                  : formData.confirmPassword
                  ? "border-red-400"
                  : "border-gray-300"
              }`}
            />
            {valid.passwordMatch && formData.confirmPassword && (
              <CheckCircleIcon className="w-5 h-5 text-green-500 absolute right-3 top-2.5" />
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={!isAllValid || isLoading}
          className={`w-full py-2.5 rounded text-white font-semibold transition ${
            isAllValid
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          {isLoading ? "가입 처리 중..." : "가입하기"}
        </button>
      </form>
    </div>
  );
};

// ----------------------------------------
// --- 메인 페이지 컴포넌트 ---
// ----------------------------------------
function SignupPage() {
  const [step, setStep] = useState(1); // 1: 약관, 2: 폼

  const handleAgreeAndNext = () => {
    setStep(2);
  };

  return step === 1 ? (
    <TOSScreen onAgree={handleAgreeAndNext} />
  ) : (
    <SignupFormScreen />
  );
}

// 외부에서 페이지를 import할 시 반환.
export default SignupPage;
