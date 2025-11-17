// src/components/portfolio_templates/Template3.jsx
import React from "react";
import { EnvelopeIcon, PhoneIcon, MapPinIcon } from "@heroicons/react/24/solid";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// 날짜 포맷팅 헬퍼 (YYYY.MM)
const formatDate = (dateStr) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}`;
};

// 재사용 섹션 컴포넌트 (심플 라인)
const Section = ({ title, children }) => (
  <section className="mb-10">
    <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4">
      {title}
    </h2>
    <div className="space-y-6">{children}</div>
  </section>
);

// 타임라인 아이템 (심플)
const TimelineItem = ({ title, subtitle, date, description, url }) => (
  <div className="grid grid-cols-4 gap-4">
    {/* 날짜 (왼쪽) */}
    <div className="col-span-1 text-sm font-medium text-gray-500 pt-1">
      {date}
    </div>
    {/* 내용 (오른쪽) */}
    <div className="col-span-3">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <h4 className="text-md text-gray-700">{subtitle}</h4>
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:underline"
        >
          {url}
        </a>
      )}
      <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">
        {description}
      </p>
    </div>
  </div>
);

// ----------------------------------------
// --- 메인 템플릿 컴포넌트 ---
// ----------------------------------------
const Template3 = ({ data }) => {
  const { profile, experiences, educations, projects, skills } = data;

  // (선택적) 스킬을 카테고리별로 그룹화
  const skillsByCategory = skills.reduce((acc, skill) => {
    const category = skill.category || "기타";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(skill);
    return acc;
  }, {});

  return (
    // 전체 레이아웃 (A4용지처럼 중앙에 좁게)
    <div className="bg-white max-w-3xl mx-auto shadow-2xl rounded-lg p-12 md:p-16">
      {/* --- 1. 헤더 (이름, 연락처) --- */}
      <header className="flex flex-col md:flex-row items-start justify-between mb-10">
        <div>
          <h1 className="text-5xl font-extrabold text-gray-800">
            {profile.username}
          </h1>
          {/* <h2 className="text-2xl font-light text-blue-600 mt-1">
            {profile.resume_title}
          </h2> */}
        </div>
        <div className="text-left md:text-right mt-4 md:mt-0 text-sm space-y-1 text-gray-600 flex-shrink-0">
          {profile.email && (
            <p className="flex items-center md:justify-end gap-2">
              <span>{profile.email}</span>
              <EnvelopeIcon className="w-4 h-4" />
            </p>
          )}
          {profile.phone && (
            <p className="flex items-center md:justify-end gap-2">
              <span>{profile.phone}</span>
              <PhoneIcon className="w-4 h-4" />
            </p>
          )}
          {profile.address && (
            <p className="flex items-center md:justify-end gap-2">
              <span>{profile.address}</span>
              <MapPinIcon className="w-4 h-4" />
            </p>
          )}
        </div>
      </header>

      {/* --- 2. 자기소개 --- */}
      {profile.introduction && (
        <Section title="About Me">
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {profile.introduction}
          </p>
        </Section>
      )}

      {/* --- 3. 경력 --- */}
      <Section title="Experience">
        {experiences.map((exp) => (
          <TimelineItem
            key={exp.idx}
            title={exp.company_name}
            subtitle={exp.position}
            date={`${formatDate(exp.start_date)} ~ ${
              formatDate(exp.end_date) || "현재"
            }`}
            description={exp.description}
          />
        ))}
      </Section>

      {/* --- 4. 프로젝트 --- */}
      <Section title="Projects">
        {projects.map((proj) => (
          <TimelineItem
            key={proj.idx}
            title={proj.project_name}
            date={`${formatDate(proj.start_date)} ~ ${
              formatDate(proj.end_date) || "진행 중"
            }`}
            description={proj.description}
            url={proj.project_url}
          />
        ))}
      </Section>

      {/* --- 5. 학력 --- */}
      <Section title="Education">
        {educations.map((edu) => (
          <TimelineItem
            key={edu.idx}
            title={edu.institution_name}
            subtitle={`${edu.major || ""} (${edu.degree || ""})`}
            date={`${formatDate(edu.start_date)} ~ ${
              formatDate(edu.end_date) || "졸업"
            }`}
          />
        ))}
      </Section>

      {/* --- 6. 기술 --- */}
      <Section title="Skills">
        {Object.entries(skillsByCategory).map(([category, skillsList]) => (
          <div key={category} className="grid grid-cols-4 gap-4">
            <div className="col-span-1 text-sm font-semibold text-gray-800 pt-1">
              {category}
            </div>
            <div className="col-span-3">
              <p className="text-sm text-gray-600">
                {skillsList.map((skill) => skill.skill_name).join(", ")}
              </p>
            </div>
          </div>
        ))}
      </Section>
    </div>
  );
};

export default Template3;
