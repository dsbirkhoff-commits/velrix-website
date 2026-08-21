import React from "react";

export default function PuurContainer({ children, className = "", style = {} }) {
  return (
    <div className={`puur-container ${className}`} style={style}>
      {children}
    </div>
  );
}
