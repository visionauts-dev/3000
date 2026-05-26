import React from "react";
import { Team } from "../types";

interface ScoreBoardProps {
  teams: Team[];
  currentPlayerId?: string;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({ teams, currentPlayerId }) => {
  return (
    <div className="grid grid-cols-2 gap-3">
      {teams.map((team) => {
        const myTeam = team.players.some((p) => p.id === currentPlayerId);
        return (
          <div
            key={team.id}
            className={`rounded-lg p-3 border ${
              myTeam ? "bg-blue-900/30 border-blue-600" : "bg-yellow-900/30 border-yellow-700"
            }`}
          >
            <div className={`text-sm font-bold mb-1 ${myTeam ? "text-blue-300" : "text-yellow-300"}`}>
              {team.name} {myTeam && "(You)"}
            </div>
            <div className={`text-2xl font-black ${myTeam ? "text-blue-100" : "text-yellow-100"}`}>
              {team.totalScore}
              <span className="text-sm font-normal text-gray-400 ml-1">/ 3000</span>
            </div>
            <div className="mt-1 h-1 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${myTeam ? "bg-blue-500" : "bg-yellow-500"}`}
                style={{ width: `${Math.min((team.totalScore / 3000) * 100, 100)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
