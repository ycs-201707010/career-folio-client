const AdminRowSkeleton = () => (
  <tr className="border-b animate-pulse">
    {/* 강좌 (썸네일 + 제목) */}
    <td className="p-3">
      <div className="flex items-center">
        <div className="flex-shrink-0 h-10 w-16 rounded-md bg-gray-200"></div>
        <div className="ml-4">
          <div className="h-4 w-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    </td>
    {/* 강사 */}
    <td className="p-3">
      <div className="h-4 w-20 bg-gray-200 rounded"></div>
    </td>
    {/* 가격 */}
    <td className="p-3">
      <div className="h-4 w-24 bg-gray-200 rounded"></div>
    </td>
    {/* 상태 */}
    <td className="p-3">
      <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
    </td>
    {/* 액션 */}
    <td className="p-3">
      <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
    </td>
  </tr>
);

export default AdminRowSkeleton;
