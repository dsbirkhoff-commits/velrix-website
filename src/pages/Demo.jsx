import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import VelrixReceptionDemo from "../components/VelrixReceptionDemo.jsx";

export default function Demo() {
  return (
    <div style={{ background: "#0a0b0d", minHeight: "100vh" }}>
      <div
        style={{
          maxWidth: 1080,
          margin: "0 auto",
          padding: "20px 20px 0",
        }}
      >
        <Link
          to="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "#9a9c9f",
            fontFamily: "Inter, sans-serif",
            fontSize: 13.5,
            textDecoration: "none",
          }}
        >
          <ArrowLeft size={15} /> Terug naar velrix.nl
        </Link>
      </div>
      <VelrixReceptionDemo />
    </div>
  );
}
