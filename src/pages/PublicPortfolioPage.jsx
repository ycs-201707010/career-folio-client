import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// --- 1. [필수] 템플릿 컴포넌트들을 임포트합니다. ---
// (이 파일들은 src/components/portfolio_templates/ 폴더에 만들어야 합니다)
import Template1 from "../components/portfolio_templates/Template1";
import Template2 from "../components/portfolio_templates/Template2";
import Template3 from "../components/portfolio_templates/Template3";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// --- API 함수 ---
// (Turn 115에서 서버에 만든 공개용 API)
const fetchPublicPortfolio = async (id) => {
  const { data } = await axios.get(`${API_BASE_URL}/api/resume/public/${id}`);
  return data; // { profile, experiences, ..., portfolio_template: 'modern' }
};

/**
 * 템플릿 이름에 따라 렌더링할 컴포넌트를 매칭(mapping)합니다.
 */
const templates = {
  default: Template1,
  modern: Template2,
  minimalist: Template3,
};

function PublicPortfolioPage() {
  const { id } = useParams(); // 👈 1. URL에서 :id (예: 'king-gwangpil')를 가져옴

  // 2. 'id'를 기반으로 공개 포트폴리오 데이터 요청
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["publicPortfolio", id],
    queryFn: () => fetchPublicPortfolio(id),
    staleTime: 1000 * 60 * 5, // 5분 캐시
  });

  if (isLoading) {
    return <div className="text-center p-10">포트폴리오를 불러오는 중...</div>;
  }

  if (isError) {
    // 3. (Turn 115) API가 403(비공개) 또는 404(없음) 에러를 반환
    return (
      <div className="text-center p-10 text-red-500">
        {error.response?.data?.message || "포트폴리오를 불러올 수 없습니다."}
      </div>
    );
  }

  // 4. [핵심] DB에서 가져온 템플릿 이름(data.profile.portfolio_template)을 찾음
  const SelectedTemplate =
    templates[data.profile.portfolio_template] || templates.default;

  return (
    <div className="bg-gray-100 min-h-screen py-10">
      {/* 5. 선택된 템플릿을 동적으로 렌더링하고, API 데이터 전체를 props로 전달 */}
      <SelectedTemplate data={data} />
    </div>
  );
}

export default PublicPortfolioPage;
