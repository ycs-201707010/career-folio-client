import React from "react";
import { Outlet } from "react-router-dom"; // 중첩 라우팅된 페이지 내용을 표시하는 컴포넌트
import Navbar from "./Navbar";

function Layout() {
  return (
    <div className=" min-h-screen flex flex-col">
      <Navbar /> {/* 상단에 Navbar 고정 */}
      <main className="flex-grow isolate">
        {/* 여기에 각 페이지의 실제 내용이 렌더링됩니다. */}
        <Outlet />
      </main>
      {/* 필요하다면 Footer 컴포넌트 추가 */}
    </div>
  );
}

export default Layout;
