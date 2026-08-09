import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BookingProvider } from "./components/BookingProvider.jsx";
import Home from "./pages/Home.jsx";
import Demo from "./pages/Demo.jsx";
import Contact from "./pages/Contact.jsx";
import PlanMeeting from "./pages/PlanMeeting.jsx";
import Terms from "./pages/Terms.jsx";
import Privacy from "./pages/Privacy.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <BookingProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/demo" element={<Demo />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/plan-een-gesprek" element={<PlanMeeting />} />
          <Route path="/algemene-voorwaarden" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </BookingProvider>
    </BrowserRouter>
  );
}
