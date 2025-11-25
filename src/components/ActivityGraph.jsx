import React from "react";
import { ActivityCalendar } from "react-activity-calendar";
import { Tooltip as ReactTooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";

// GitHub 스타일 테마 색상 (레벨 0 ~ 4)
// 0: 빈칸, 4: 가장 진한 초록색
const explicitTheme = {
  light: ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"],
  dark: ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"],
};

const ActivityGraph = ({ activityData }) => {
  // 1. 데이터 변환 로직
  // activityData 예시: { "2025-11-25": 5, "2025-11-20": 1 }

  const transformData = () => {
    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);

    const data = [];

    // 지난 365일 루프
    for (let d = oneYearAgo; d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0]; // "YYYY-MM-DD"
      const count = activityData ? activityData[dateStr] || 0 : 0;

      // count에 따른 레벨 계산 (0~4)
      let level = 0;
      if (count >= 1) level = 1;
      if (count >= 3) level = 2;
      if (count >= 6) level = 3;
      if (count >= 10) level = 4;

      data.push({
        date: dateStr,
        count: count,
        level: level,
      });
    }
    return data;
  };

  const calendarData = transformData();

  // 총 활동 수 계산
  const totalCount = calendarData.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
      <h3 className="text-lg font-bold text-gray-800 mb-4">
        {totalCount} contributions in the last year
      </h3>

      <div className="flex justify-center overflow-hidden">
        <ActivityCalendar
          data={calendarData}
          theme={explicitTheme}
          blockSize={12} // 블록 크기
          blockMargin={4} // 블록 간격
          fontSize={12}
          hideColorLegend={false}
          labels={{
            months: [
              "Jan",
              "Feb",
              "Mar",
              "Apr",
              "May",
              "Jun",
              "Jul",
              "Aug",
              "Sep",
              "Oct",
              "Nov",
              "Dec",
            ],
            weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
            totalCount: "{{count}} contributions in {{year}}",
            legend: {
              less: "Less",
              more: "More",
            },
          }}
          // 툴팁 설정
          renderBlock={(block, activity) =>
            // <div
            //   data-tooltip-id="activity-tooltip"
            //   data-tooltip-content={`${activity.count} contributions on ${activity.date}`}
            // >
            //   {block}
            // </div>
            React.cloneElement(block, {
              "data-tooltip-id": "activity-tooltip",
              "data-tooltip-content": `${activity.count} contributions on ${activity.date}`,
            })
          }
        />
      </div>

      <ReactTooltip id="activity-tooltip" />
    </div>
  );
};

export default ActivityGraph;
