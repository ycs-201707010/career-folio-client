const StatusBadge = ({ status }) => {
  const statusStyles = {
    draft: "bg-yellow-100 text-yellow-800",
    published: "bg-green-100 text-green-800",
    pending: "bg-blue-100 text-blue-800",
    archived: "bg-red-100 text-red-800",
  };
  const statusText = {
    draft: "초안",
    published: "게시됨",
    pending: "검수 대기",
    archived: "보관됨",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
        statusStyles[status] || "bg-gray-100 text-gray-800"
      }`}
    >
      {statusText[status] || status}
    </span>
  );
};

export default StatusBadge;
