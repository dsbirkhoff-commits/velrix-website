import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Demo from "./pages/Demo.jsx";
import VoiceDemo from "./pages/VoiceDemo.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/demo" element={<Demo />} />
        <Route path="/voice-demo" element={<VoiceDemo />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}
