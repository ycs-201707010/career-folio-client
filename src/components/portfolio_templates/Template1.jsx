// src/components/portfolio_templates/Template1.jsx
import React, { useState } from "react";
import {
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  UserIcon, // (자기소개)
  BriefcaseIcon, // (경력)
  AcademicCapIcon, // (학력)
  CodeBracketIcon, // (프로젝트)
  WrenchScrewdriverIcon, // (기술)
} from "@heroicons/react/24/solid";

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

// 재사용 섹션 컴포넌트
const Section = ({ title, children }) => (
  <section className="mb-8">
    <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-gray-300 pb-2 mb-4">
      {title}
    </h2>
    <div className="space-y-6">{children}</div>
  </section>
);

// 경력/학력/프로젝트 아이템 컴포넌트
const TimelineItem = ({ title, subtitle, date, description, url }) => (
  <div>
    <div className="flex justify-between items-center mb-1">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <span className="text-sm font-medium text-gray-600">{date}</span>
    </div>
    <h4 className="text-md font-medium text-gray-700">{subtitle}</h4>
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
);

// --- [신규] 사이드바 네비게이션 아이템
const NavItem = ({ label, icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 w-full p-2.5 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? "bg-blue-100 text-blue-700 font-semibold"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    }`}
  >
    {React.cloneElement(icon, { className: "w-5 h-5 flex-shrink-0" })}
    <span>{label}</span>
  </button>
);

// --- [신규] 자기소개 (About) 섹션 (사이드바에서 분리) ---
const AboutSection = ({ profile }) => (
  <Section title="자기소개">
    {/* 1. 연락처 */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {profile.email && (
        <p className="flex items-center gap-2 text-sm">
          <EnvelopeIcon className="w-5 h-5 text-gray-500" />
          <span>{profile.email}</span>
        </p>
      )}
      {profile.phone && (
        <p className="flex items-center gap-2 text-sm">
          <PhoneIcon className="w-5 h-5 text-gray-500" />
          <span>{profile.phone}</span>
        </p>
      )}
      {profile.address && (
        <p className="flex items-center gap-2 text-sm col-span-2">
          <MapPinIcon className="w-5 h-5 text-gray-500" />
          <span>{profile.address}</span>
        </p>
      )}
    </div>
    {/* 2. 상세 자기소개 */}
    <p className="text-sm text-gray-700 whitespace-pre-wrap">
      {profile.introduction || "자기소개가 없습니다."}
    </p>
  </Section>
);

// ----------------------------------------
// --- 메인 템플릿 컴포넌트 (전면 수정) ---
// ----------------------------------------
const Template1 = ({ data }) => {
  const { profile, experiences, educations, projects, skills } = data;

  // 1. [핵심] 현재 선택된 카테고리를 state로 관리
  const [activeCategory, setActiveCategory] = useState("about"); // 기본값 '자기소개'

  // 2. 네비게이션 메뉴 정의 (요구사항 3을 위해 나중에 DB에서 받아오도록 확장 가능)
  const navItems = [
    { key: "about", label: "자기소개", icon: <UserIcon />, count: 0 },
    {
      key: "experiences",
      label: "경력",
      icon: <BriefcaseIcon />,
      count: experiences.length,
    },
    {
      key: "educations",
      label: "학력",
      icon: <AcademicCapIcon />,
      count: educations.length,
    },
    {
      key: "projects",
      label: "프로젝트",
      icon: <CodeBracketIcon />,
      count: projects.length,
    },
    {
      key: "skills",
      label: "보유 기술",
      icon: <WrenchScrewdriverIcon />,
      count: skills.length,
    },
  ];

  // 3. 렌더링할 컨텐츠를 결정하는 함수
  const renderContent = () => {
    switch (activeCategory) {
      case "about":
        return <AboutSection profile={profile} />;
      case "experiences":
        return (
          <Section title="경력 (Experiences)">
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
        );
      case "educations":
        return (
          <Section title="학력 (Education)">
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
        );
      case "projects":
        return (
          <Section title="프로젝트 (Projects)">
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
        );
      case "skills":
        return (
          <Section title="보유 기술 (Skills)">
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill.idx}
                  className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full"
                >
                  {skill.skill_name}
                </span>
              ))}
            </div>
          </Section>
        );
      default:
        return <AboutSection profile={profile} />;
    }
  };

  return (
    // [요구사항 1] ViewPort 전체 사용
    // (PublicPortfolioPage의 'bg-gray-100' 배경을 제거해야 함)
    <div className="flex h-screen bg-white shadow-2xl max-w-7xl mx-auto">
      {/* --- [요구사항 2] 왼쪽 사이드바 --- */}
      <aside className="w-64 bg-gray-50 p-6 flex-shrink-0 overflow-y-auto border-r border-gray-200">
        {/* 프로필 헤더 */}
        <div className="flex flex-col items-center text-center">
          {profile.resume_photo_url ? (
            <img
              src={`${API_BASE_URL}/${profile.resume_photo_url}`}
              alt="증명사진"
              className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md"
            />
          ) : (
            <UserCircleIcon className="w-32 h-32 text-gray-300" />
          )}
          <h1 className="text-2xl font-bold mt-4">{profile.username}</h1>
          {/* <p className="text-sm text-gray-600">{profile.resume_title}</p> */}
        </div>

        {/* 네비게이션 */}
        <nav className="mt-8 space-y-1">
          {navItems.map((item) => (
            <NavItem
              key={item.key}
              label={item.label}
              icon={item.icon}
              isActive={activeCategory === item.key}
              onClick={() => setActiveCategory(item.key)}
            />
          ))}
          {/* (요구사항 3이 구현되면, 여기에 커스텀 페이지 목록이 .map()으로 추가됨) */}
        </nav>
      </aside>

      {/* --- [요구사항 2] 오른쪽 메인 콘텐츠 --- */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        {renderContent()}
      </main>
    </div>
  );
};

export default Template1;
