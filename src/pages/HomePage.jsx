import React from "react";
import { Link } from "react-router-dom"; // react-router-dom의 Link 컴포넌트 사용

function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
      <div className="max-w-2xl">
        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-800">
          CareerFolio
        </h1>
        <p className="mt-4 text-lg md:text-xl text-gray-600">
          AI와 커뮤니티가 함께 만드는 당신의 살아있는 포트폴리오.
        </p>
        <p className="mt-2 text-md text-gray-500">
          당신의 커리어를 증명하고, 모든 질문에 해답을 찾으세요.
        </p>

        <div className="mt-8 flex justify-center gap-4">
          <Link
            to="/signup" // 회원가입 페이지 경로
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition duration-200"
          >
            회원가입하고 시작하기
          </Link>
          <Link
            to="/login" // 로그인 페이지 경로 (미리 추가)
            className="px-6 py-3 bg-white text-gray-700 font-semibold rounded-lg shadow-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-75 transition duration-200"
          >
            로그인
          </Link>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
