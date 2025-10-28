import { useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { CheckCircleIcon } from "@heroicons/react/24/solid"; // npm install @heroicons/react. 아이콘을 추가한다.
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

function SignupPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    emailCode: "",
    phone1: "",
    phone2: "",
    phone3: "",
    id: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false); // 이메일 코드 발송 로딩 상태
  // 페이지 이동
  const navigate = useNavigate();

  // 입력 필드 참조(ref) 생성
  const phoneInputRefs = useRef([]);

  // 항목별 유효성 상태
  const [valid, setValid] = useState({
    name: false,
    email: false, // 이메일 형식
    emailCode: false, // 이메일 인증 완료
    phoneCombined: false,
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
    // 실시간 유효성 검사 업데이트
    const { name, value } = e.target;

    // --- 전화번호 입력 처리 ---
    if (name === "phone1" || name === "phone2" || name === "phone3") {
      const numericValue = value.replace(/[^0-9]/g, ""); // 숫자만 허용
      let maxLength;
      let nextInputIndex;

      if (name === "phone1") {
        maxLength = 3;
        nextInputIndex = 1;
      } else {
        // phone2, phone3
        maxLength = 4;
        nextInputIndex = name === "phone2" ? 2 : null; // phone3 다음은 없음
      }

      // 최대 길이 제한
      const truncatedValue = numericValue.slice(0, maxLength);

      setFormData((prev) => {
        const updatedPhoneData = { ...prev, [name]: truncatedValue };
        // 전화번호 전체 유효성 검사
        const combinedValid =
          updatedPhoneData.phone1.length === 3 &&
          (updatedPhoneData.phone2.length === 3 ||
            updatedPhoneData.phone2.length === 4) &&
          updatedPhoneData.phone3.length === 4;
        setValid((prevValid) => ({
          ...prevValid,
          phoneCombined: combinedValid,
        }));
        return updatedPhoneData;
      });

      // 자동 포커스 이동
      if (truncatedValue.length === maxLength && nextInputIndex !== null) {
        phoneInputRefs.current[nextInputIndex]?.focus();
      }
    } else {
      setFormData({ ...formData, [name]: value });

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
    formData.name &&
    valid.phoneCombined;

  // **Submit시 실행할 함수.**
  // 최종 회원가입 제출
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAllValid)
      return Swal.fire({
        icon: "error",
        title: "회원가입 오류",
        text: "모든 항목을 올바르게 입력하고 인증을 완료해주세요.",
      });
    setIsLoading(true);

    const { name, email, phone1, phone2, phone3, id, password } = formData;

    // --- 전화번호 조합 ---
    const combinedPhoneNumber = `${phone1}-${phone2}-${phone3}`;

    const requestData = {
      name,
      email,
      phoneNumber: combinedPhoneNumber, // 조합된 전화번호 사용
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
              className={`px-3 py-1 w-24 flex justify-center items-center rounded text-sm transition-colors duration-15 dark:bg-zinc-600 dark:text-white ${
                valid.emailFormat && !valid.emailVerified
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-400 hover:bg-gray-500 cursor-not-allowed"
              }`}
              // 이메일 형식이 맞고, 아직 인증 전이며, 로딩 중이 아닐 때만 활성화
              disabled={
                !valid.emailFormat || valid.emailVerified || isSendingCode
              }
              onClick={handleSendCode}
            >
              {/* 로딩 상태에 따라 다른 내용 표시 */}
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
              className={`px-3 py-1 w-24 rounded text-sm dark:bg-zinc-600 dark:text-white ${
                formData.emailCode.length > 0 && !valid.emailVerified
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-400 hover:bg-gray-500 cursor-not-allowed"
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
          <div className="flex items-center gap-2">
            <input
              ref={(el) => (phoneInputRefs.current[0] = el)} // ref 연결
              type="text" // type을 text로 변경 (숫자 외 입력 방지 로직은 handleChange에서 처리)
              inputMode="numeric" // 모바일 키패드 숫자 우선
              pattern="[0-9]*" // 숫자 패턴 명시 (선택적)
              name="phone1"
              maxLength="3"
              placeholder="010"
              value={formData.phone1}
              onChange={handleChange}
              className="w-1/3 border px-3 py-2 rounded dark:bg-zinc-700 dark:text-white text-center"
              required
            />
            <span>-</span>
            <input
              ref={(el) => (phoneInputRefs.current[1] = el)}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              name="phone2"
              maxLength="4"
              placeholder="1234"
              value={formData.phone2}
              onChange={handleChange}
              className="w-1/3 border px-3 py-2 rounded dark:bg-zinc-700 dark:text-white text-center"
              required
            />
            <span>-</span>
            <input
              ref={(el) => (phoneInputRefs.current[2] = el)}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              name="phone3"
              maxLength="4"
              placeholder="5678"
              value={formData.phone3}
              onChange={handleChange}
              className="w-1/3 border px-3 py-2 rounded dark:bg-zinc-700 dark:text-white text-center"
              required
            />
          </div>
          {(formData.phone1 || formData.phone2 || formData.phone3) &&
            !valid.phoneCombined && (
              <p className="text-sm text-red-500 mt-1">
                전화번호 최대 11자리를 모두 입력해주세요.
              </p>
            )}
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
              className={`px-3 py-1 w-24 rounded text-sm dark:bg-zinc-600 dark:text-white ${
                valid.idFormat && !valid.idAvailable
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-400 hover:bg-gray-500 cursor-not-allowed"
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
              : "bg-gray-400 hover:bg-gray-500 cursor-not-allowed"
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
