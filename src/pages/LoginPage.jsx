import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL = "http://localhost:8080/api/auth"; //"https://careerfolio.up.railway.app/api/auth";

function LoginPage() {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await axios.post(`${API_BASE_URL}/login`, {
        id,
        password,
      });
      login(response.data.token); // AuthContext의 login 함수 호출
      navigate("/dashboard"); // 로그인 성공 시 대시보드로 이동
    } catch (err) {
      setError(err.response?.data?.message || "로그인에 실패했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6">로그인</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="id">
              아이디
            </label>
            <input
              type="text"
              id="id"
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 mb-2" htmlFor="password">
              비밀번호
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          {error && (
            <p className="text-red-500 text-sm text-center mb-4">{error}</p>
          )}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
          >
            로그인
          </button>
        </form>
        <p className="text-center text-sm text-gray-600 mt-4">
          계정이 없으신가요?{" "}
          <Link to="/signup" className="text-blue-600 hover:underline">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
