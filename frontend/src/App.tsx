import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { LobbyPage } from "./pages/LobbyPage";
import { GamePage } from "./pages/GamePage";
import { ResultsPage } from "./pages/ResultsPage";
import "./styles/index.css";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LobbyPage />} />
      <Route path="/game/:gameId" element={<GamePage />} />
      <Route path="/results/:gameId" element={<ResultsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
