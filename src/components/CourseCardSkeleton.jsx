import React from "react";

function CourseCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
      {/* 썸네일 뼈대 */}
      <div className="h-40 bg-gray-300"></div>
      <div className="p-4 space-y-3">
        {/* 제목 뼈대 */}
        <div className="h-5 bg-gray-300 rounded w-3/4"></div>
        {/* 강사명 뼈대 */}
        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
        {/* 별점 뼈대 */}
        <div className="h-4 bg-gray-300 rounded w-1/3"></div>
        {/* 가격 뼈대 */}
        <div className="flex justify-end">
          <div className="h-6 bg-gray-300 rounded w-1/4"></div>
        </div>
      </div>
    </div>
  );
}

export default CourseCardSkeleton;
