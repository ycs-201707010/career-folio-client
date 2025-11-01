// src/hooks/useDebounce.js
import { useState, useEffect } from "react";

export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // delay 시간 이후에 value를 업데이트하는 타이머 설정
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // value가 바뀔 때마다 (사용자가 타이핑할 때마다)
    // 이전 타이머를 취소하고 새 타이머를 설정합니다.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // value나 delay가 바뀔 때만 이펙트 재실행

  return debouncedValue;
}
