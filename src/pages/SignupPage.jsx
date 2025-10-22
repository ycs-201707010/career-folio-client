import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { CheckCircleIcon } from "@heroicons/react/24/solid"; // npm install @heroicons/react. 아이콘을 추가한다.

// API 기본 URL을 Railway 주소로 변경
const API_BASE_URL = "http://localhost:8080"; //"https://careerfolio.up.railway.app/api/auth";

function SignupPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    emailCode: "",
    phoneNumber: "",
    id: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  // 페이지 이동
  const navigate = useNavigate();

  // 항목별 유효성 상태
  const [valid, setValid] = useState({
    name: false,
    email: false, // 이메일 형식
    emailCode: false, // 이메일 인증 완료
    phoneNumber: false,
    idFormat: false, // 아이디 형식
    idAvailable: false, // 아이디 사용 가능
    password: false,
    confirmPassword: false,
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
  const isMatch =
    formData.password && formData.password === formData.confirmPassword;

  // 값 변경 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // 실시간 유효성 검사 업데이트
    if (name === "id") {
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
    if (!valid.idFormat) return alert("아이디 형식이 올바르지 않습니다.");
    try {
      const res = await axios.get(`${API_BASE_URL}/api/auth/check-duplicate`, {
        params: { type: "id", value: formData.id },
      });
      if (res.data.exists) {
        alert("이미 사용 중인 아이디입니다.");
        setValid((prev) => ({ ...prev, idAvailable: false }));
      } else {
        alert("사용 가능한 아이디입니다!");
        setValid((prev) => ({ ...prev, idAvailable: true }));
      }
    } catch (err) {
      alert("중복 확인 중 오류가 발생했습니다.");
    }
  };

  // 이메일 인증 코드 발송
  const handleSendCode = async () => {
    if (!valid.emailFormat) return alert("유효한 이메일 주소를 입력해주세요.");
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/send-code`, {
        email: formData.email,
      });
      alert(res.data.message);
    } catch (err) {
      alert(err.response?.data?.message || "코드 발송 중 오류가 발생했습니다.");
    }
  };

  // 이메일 인증 코드 확인
  const handleVerifyCode = async () => {
    if (!/^\d{6}$/.test(formData.emailCode))
      return alert("6자리 숫자 코드를 입력하세요.");
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/verify-code`, {
        email: formData.email,
        code: formData.emailCode,
      });
      alert(res.data.message);
      setValid((prev) => ({ ...prev, emailVerified: true }));
    } catch (err) {
      alert(
        err.response?.data?.message || "인증 코드 확인 중 오류가 발생했습니다."
      );
    }
  };

  // 모든 조건이 완료되면 회원가입 버튼 활성화.
  const isAllValid =
    valid.emailVerified &&
    valid.idAvailable &&
    valid.passwordStrength &&
    valid.passwordMatch &&
    formData.name &&
    formData.phoneNumber;

  // **Submit시 실행할 함수.**
  // 최종 회원가입 제출
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAllValid)
      return alert("모든 항목을 올바르게 입력하고 인증을 완료해주세요.");
    setIsLoading(true);

    const { name, email, phoneNumber, id, password } = formData;
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/signup`, {
        name,
        email,
        phoneNumber,
        id,
        password,
      });
      alert(response.data.message);
      navigate("/login");
    } catch (error) {
      alert(
        error.response?.data?.message || "회원가입 중 오류가 발생했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded-lg shadow-md bg-white dark:bg-zinc-800">
      <form className="signup-form" onSubmit={handleSubmit}>
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">
          회원가입
        </h2>

        {/* --- 이름 --- */}
        <div className="mb-4">
          <label
            className="block mb-1 font-semibold text-sm text-gray-700 dark:text-gray-200"
            htmlFor="name"
          >
            이름
          </label>
          <input
            type="text"
            id="name"
            name="name"
            placeholder="홍길동"
            value={formData.name}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded dark:bg-zinc-700 dark:text-white"
          />
        </div>

        {/* --- 이메일 --- */}
        <div className="mb-4">
          <label
            className="block mb-1 font-semibold text-sm text-gray-700 dark:text-gray-200"
            htmlFor="email"
          >
            이메일
          </label>
          <div className="flex gap-2">
            <input
              className="flex-1 border px-3 py-2 rounded dark:bg-zinc-700 dark:text-white"
              type="email"
              id="email"
              name="email"
              placeholder="test@example.com"
              value={formData.email}
              onChange={handleChange}
              readOnly={valid.emailVerified}
            />
            <button
              type="button"
              className={`px-3 py-1 rounded text-sm dark:bg-zinc-600 dark:text-white ${
                valid.emailFormat && !valid.emailVerified
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
              disabled={!valid.emailFormat || valid.emailVerified}
              onClick={handleSendCode}
            >
              코드 발송
            </button>
          </div>
        </div>

        {/* --- 인증코드 --- */}
        <div className="mb-6">
          <label className="block mb-1 font-semibold text-sm text-gray-700 dark:text-gray-200">
            이메일 인증코드
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              name="emailCode"
              value={formData.emailCode}
              onChange={handleChange}
              className="flex-1 border px-3 py-2 rounded dark:bg-zinc-700 dark:text-white"
              readOnly={valid.emailVerified}
            />
            <button
              type="button"
              className={`px-3 py-1 rounded text-sm dark:bg-zinc-600 dark:text-white ${
                formData.emailCode.length > 0 && !valid.emailVerified
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
              disabled={formData.emailCode.length === 0 || valid.emailVerified}
              onClick={handleVerifyCode}
            >
              코드 확인
            </button>
          </div>
          {valid.emailVerified && (
            <p className="text-sm text-green-600 mt-1">
              이메일 인증이 완료되었습니다.
            </p>
          )}
        </div>

        {/* --- 전화번호 --- */}
        <div className="mb-4">
          <label
            className="block mb-1 font-semibold text-sm text-gray-700 dark:text-gray-200"
            htmlFor="phoneNumber"
          >
            전화번호
          </label>
          <input
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            placeholder="010-1234-5678"
            value={formData.phoneNumber}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded dark:bg-zinc-700 dark:text-white"
          />
        </div>

        {/* --- 아이디 --- */}
        <div className="mb-4">
          <label
            className="block mb-1 font-semibold text-sm text-gray-700 dark:text-gray-200"
            htmlFor="id"
          >
            로그인 ID
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              id="id"
              name="id"
              placeholder="영문/숫자 4~16자"
              value={formData.id}
              onChange={handleChange}
              className="flex-1 border px-3 py-2 rounded dark:bg-zinc-700 dark:text-white"
              readOnly={valid.idAvailable}
            />
            <button
              type="button"
              className={`px-3 py-1 rounded text-sm dark:bg-zinc-600 dark:text-white ${
                valid.idFormat && !valid.idAvailable
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
              disabled={!valid.idFormat || valid.idAvailable}
              onClick={checkDuplicate}
            >
              중복 확인
            </button>
          </div>
          {valid.idAvailable && (
            <p className="text-sm text-green-600 mt-1">
              사용 가능한 아이디입니다.
            </p>
          )}
        </div>

        {/* --- 비밀번호 --- */}
        <div className="mb-4">
          <label
            className="block mb-1 font-semibold text-sm text-gray-700 dark:text-gray-200"
            htmlFor="password"
          >
            비밀번호
          </label>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="비밀번호"
            value={formData.password}
            onChange={handleChange}
            className={`w-full px-3 py-2 rounded border focus:outline-none dark:bg-zinc-700 ${
              strength.level === "강함"
                ? "border-green-500"
                : strength.level === "보통"
                ? "border-yellow-400"
                : formData.password
                ? "border-red-500"
                : "border-gray-300"
            }`}
          />
          {formData.password.length > 0 && (
            <p className={`text-sm mt-1 ${strength.color}`}>
              보안 수준: {strength.level}
            </p>
          )}
        </div>

        {/* --- 비밀번호 확인 --- */}
        <div className="mb-4 relative">
          <label
            className="block mb-1 font-semibold text-sm text-gray-700 dark:text-gray-200"
            htmlFor="confirmPassword"
          >
            비밀번호 확인
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            placeholder="비밀번호 확인"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={`w-full px-3 py-2 rounded border focus:outline-none dark:bg-zinc-700 transition-all duration-300 ${
              valid.passwordMatch
                ? "border-green-400"
                : formData.confirmPassword
                ? "border-red-400"
                : "border-gray-300"
            }`}
          />
          {valid.passwordMatch && formData.confirmPassword && (
            <CheckCircleIcon className="w-5 h-5 text-green-500 absolute right-3 top-9" />
          )}
        </div>

        <button
          type="submit"
          disabled={!isAllValid || isLoading}
          className={`w-full py-2 rounded text-white transition ${
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
}

// 외부에서 페이지를 import할 시 반환.
export default SignupPage;
