const ProfilePageSkeleton = () => {
  return (
    <div className="bg-gray-100 min-h-screen py-10">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md animate-pulse">
        {/* 헤더 스켈레톤 */}
        <div className="h-8 w-48 bg-gray-200 rounded mb-6"></div>

        {/* 탭 네비게이션 스켈레톤 */}
        <div className="flex border-b border-gray-200 mb-8">
          <div className="px-6 py-3 w-32 h-10 bg-gray-200 rounded-t-md mr-2"></div>
          <div className="px-6 py-3 w-32 h-10 bg-gray-200 rounded-t-md"></div>
        </div>

        {/* 프로필 사진 스켈레톤 */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-32 h-32 rounded-full bg-gray-200 border-4 border-white"></div>
          <div className="h-4 w-40 bg-gray-200 rounded mt-4"></div>
        </div>

        {/* 입력 폼 스켈레톤 */}
        <div className="grid grid-cols-1 gap-6">
          {/* 읽기 전용 정보 */}
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200 space-y-4">
            <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
            <div className="h-10 w-full bg-gray-200 rounded"></div>
            <div className="h-4 w-32 bg-gray-200 rounded mb-2 mt-4"></div>
            <div className="h-10 w-full bg-gray-200 rounded"></div>
          </div>

          {/* 수정 가능 정보 */}
          <div className="space-y-4">
            <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
            <div className="h-10 w-full bg-gray-200 rounded"></div>
            <div className="h-4 w-24 bg-gray-200 rounded mb-2 mt-4"></div>
            <div className="h-20 w-full bg-gray-200 rounded"></div>
          </div>
        </div>

        {/* 버튼 스켈레톤 */}
        <div className="flex justify-end pt-4 border-t mt-8">
          <div className="h-10 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePageSkeleton;
