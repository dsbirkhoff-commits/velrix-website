import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

/**
 * variant="solid" — dark ink button, primary action
 * variant="outline" — hairline-bordered, secondary action
 * External hrefs (http...) render as <a>; internal paths render as
 * react-router <Link> so /puur/* navigation never full-page-reloads.
 */
export default function PuurButton({ to, href, onClick, type = "button", variant = "solid", children, icon = true }) {
  const style = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "13px 22px",
    borderRadius: "var(--puur-radius)",
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: "-0.01em",
    cursor: "pointer",
    transition: "background .2s, color .2s, border-color .2s",
    border: variant === "outline" ? "1px solid var(--puur-ink)" : "1px solid var(--puur-ink)",
    background: variant === "solid" ? "var(--puur-ink)" : "transparent",
    color: variant === "solid" ? "var(--puur-paper)" : "var(--puur-ink)",
  };

  const content = (
    <>
      {children}
      {icon && <ArrowUpRight size={15} />}
    </>
  );

  if (href) {
    return (
      <a href={href} style={style} className="puur-btn">
        {content}
      </a>
    );
  }
  if (to) {
    return (
      <Link to={to} style={style} className="puur-btn">
        {content}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} style={style} className="puur-btn">
      {content}
    </button>
  );
}
