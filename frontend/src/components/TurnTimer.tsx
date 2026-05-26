import React, { useState, useEffect, useRef } from "react";

interface TurnTimerProps {
  isMyTurn: boolean;
  totalSeconds?: number;
  onExpire?: () => void;
}

export const TurnTimer: React.FC<TurnTimerProps> = ({
  isMyTurn,
  totalSeconds = 30,
  onExpire,
}) => {
  const [remaining, setRemaining] = useState(totalSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setRemaining(totalSeconds);
  }, [isMyTurn, totalSeconds]);

  useEffect(() => {
    if (!isMyTurn) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          onExpire?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isMyTurn, onExpire]);

  if (!isMyTurn) {
    return null;
  }

  const pct = (remaining / totalSeconds) * 100;
  const urgent = remaining <= 10;

  return (
    <div className={`rounded-lg px-3 py-2 text-center ${urgent ? "bg-red-900/50 border border-red-600" : "bg-gray-800"}`}>
      <div className={`text-xs font-medium mb-1 ${urgent ? "text-red-300" : "text-gray-400"}`}>
        Your Turn
      </div>
      <div className={`text-2xl font-black ${urgent ? "text-red-400 animate-pulse" : "text-white"}`}>
        {remaining}s
      </div>
      <div className="mt-1 h-1 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${urgent ? "bg-red-500" : "bg-green-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};
