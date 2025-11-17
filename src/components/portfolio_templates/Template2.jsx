// src/components/portfolio_templates/Template2.jsx
import React from "react";
import { EnvelopeIcon, PhoneIcon, MapPinIcon } from "@heroicons/react/24/solid";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// 날짜 포맷팅 헬퍼
const formatDate = (dateStr) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}`;
};

// 재사용 섹션 컴포넌트 (가운데 정렬)
const Section = ({ title, children, isDark = false }) => (
  <section
    className={`py-16 px-6 ${
      isDark ? "bg-gray-800 text-gray-200" : "bg-white"
    }`}
  >
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-12 relative pb-2">
        {title}
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-blue-600 rounded"></span>
      </h2>
      <div className="space-y-8">{children}</div>
    </div>
  </section>
);

// ----------------------------------------
// --- 메인 템플릿 컴포넌트 ---
// ----------------------------------------
const Template2 = ({ data }) => {
  const { profile, experiences, educations, projects, skills } = data;

  return (
    // 이 템플릿은 PublicPortfolioPage의 회색 배경(bg-gray-100)을 그대로 활용합니다.
    <div className="bg-white max-w-7xl mx-auto shadow-2xl rounded-lg overflow-hidden">
      {/* --- 1. Hero 섹션 (가장 상단) --- */}
      <header className="bg-gray-800 text-white p-12 md:p-20 text-center relative overflow-hidden">
        {/* (선택적) 배경 장식 */}
        <div
          className="absolute top-0 left-0 w-full h-full opacity-10 bg-blue-500"
          style={{ clipPath: "polygon(0 0, 100% 0, 100% 70%, 0 100%)" }}
        ></div>

        <div className="relative z-10">
          {profile.resume_photo_url ? (
            <img
              src={`${API_BASE_URL}/${profile.resume_photo_url}`}
              alt="증명사진"
              className="w-40 h-40 rounded-full object-cover border-4 border-blue-500 shadow-lg mx-auto mb-6"
            />
          ) : (
            <div className="w-40 h-40 rounded-full bg-gray-600 mx-auto mb-6 flex items-center justify-center">
              <span className="text-gray-400">사진 없음</span>
            </div>
          )}
          <h1 className="text-5xl font-extrabold">{profile.username}</h1>
          {/* <h2 className="text-2xl font-light text-blue-300 mt-2">
            {profile.resume_title}
          </h2> */}
        </div>
      </header>

      <main>
        {/* --- 2. 자기소개 (About Me) --- */}
        <Section title="About Me">
          <p className="text-center text-gray-700 whitespace-pre-wrap leading-relaxed">
            {profile.introduction || "자기소개가 없습니다."}
          </p>
        </Section>

        {/* --- 3. 보유 기술 (Skills) - (배경색 다르게) --- */}
        <Section title="Skills" isDark={true}>
          <div className="flex flex-wrap justify-center gap-3">
            {skills.map((skill) => (
              <span
                key={skill.idx}
                className="bg-blue-200 text-blue-900 text-md font-medium px-4 py-2 rounded-full"
              >
                {skill.skill_name}
              </span>
            ))}
          </div>
        </Section>

        {/* --- 4. 경력 (Experience) - (타임라인 스타일) --- */}
        <Section title="Experience">
          <div className="relative border-l-2 border-blue-200 pl-8">
            {experiences.map((exp, index) => (
              <div
                key={exp.idx}
                className={`relative pb-8 ${
                  index === experiences.length - 1 ? "pb-0" : ""
                }`}
              >
                {/* 타임라인 원 */}
                <div className="absolute -left-10 w-4 h-4 bg-blue-600 rounded-full border-4 border-white top-1"></div>

                <span className="block text-sm text-gray-500 mb-1">
                  {formatDate(exp.start_date)} ~{" "}
                  {formatDate(exp.end_date) || "현재"}
                </span>
                <h3 className="text-xl font-semibold">{exp.position}</h3>
                <h4 className="text-md font-normal text-gray-700">
                  {exp.company_name}
                </h4>
                <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">
                  {exp.description}
                </p>
              </div>
            ))}
          </div>
        </Section>

        {/* --- 5. 프로젝트 (Projects) - (카드 스타일) --- */}
        <Section title="Projects" isDark={true}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((proj) => (
              <div
                key={proj.idx}
                className="bg-gray-700 rounded-lg shadow-lg p-6"
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xl font-semibold text-white">
                    {proj.project_name}
                  </h3>
                  <span className="text-xs text-gray-400">
                    {formatDate(proj.start_date)} ~{" "}
                    {formatDate(proj.end_date) || "진행 중"}
                  </span>
                </div>
                <p className="text-sm text-gray-300 mb-4 whitespace-pre-wrap">
                  {proj.description}
                </p>
                {proj.project_url && (
                  <a
                    href={proj.project_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-400 hover:underline"
                  >
                    프로젝트 링크
                  </a>
                )}
              </div>
            ))}
          </div>
        </Section>

        {/* --- 6. 학력 (Education) --- */}
        <Section title="Education">
          {educations.map((edu) => (
            <div key={edu.idx} className="text-center">
              <h3 className="text-xl font-semibold">{edu.institution_name}</h3>
              <p className="text-md text-gray-700">
                {edu.major} ({edu.degree})
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {formatDate(edu.start_date)} ~{" "}
                {formatDate(edu.end_date) || "졸업"}
              </p>
            </div>
          ))}
        </Section>

        {/* --- 7. 연락처 (Contact) --- */}
        <footer className="bg-gray-800 text-gray-300 p-12 text-center">
          <h2 className="text-3xl font-bold mb-6">Contact Me</h2>
          <div className="flex flex-col md:flex-row justify-center gap-6 md:gap-12">
            {profile.email && (
              <p className="flex items-center justify-center gap-2">
                <EnvelopeIcon className="w-5 h-5 text-blue-400" />
                <span>{profile.email}</span>
              </p>
            )}
            {profile.phone && (
              <p className="flex items-center justify-center gap-2">
                <PhoneIcon className="w-5 h-5 text-blue-400" />
                <span>{profile.phone}</span>
              </p>
            )}
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Template2;
