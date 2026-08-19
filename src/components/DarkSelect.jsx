import React, { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

/**
 * Custom, accessible dropdown replacing a native <select> — ONLY where
 * the opened native option-list can't be reliably dark-styled by the
 * browser (Chrome/Edge on Windows render it as a white OS widget,
 * ignoring most CSS). Same controlled-input contract as a native
 * <select>: value / onChange(newValue) / options[{value,label}] /
 * placeholder — drop-in replacement, no data or fetching logic here.
 *
 * Colors are the exact existing VELRIX dark-theme hex values (see
 * DashboardLayout.jsx's .dash-shell), used directly rather than via
 * var(--x): AdminLayout.jsx doesn't currently redefine those CSS custom
 * properties, so relying on them here would be fragile. Not fixing that
 * broader gap now — out of scope for this one component.
 */
export default function DarkSelect({ value, onChange, options, placeholder = "— Kies —" }) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const rootRef = useRef(null);
  const listRef = useRef(null);
  const listboxId = useId();

  const selected = options.find((o) => o.value === value) || null;

  useEffect(() => {
    function onDocClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (open) {
      const idx = options.findIndex((o) => o.value === value);
      setHighlighted(idx >= 0 ? idx : 0);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open && highlighted >= 0 && listRef.current) {
      const el = listRef.current.querySelector(`[data-idx="${highlighted}"]`);
      if (el) el.scrollIntoView({ block: "nearest" });
    }
  }, [open, highlighted]);

  const commit = (val) => {
    onChange(val);
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === "Escape") { e.preventDefault(); setOpen(false); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlighted((h) => Math.min(h + 1, options.length - 1)); return; }
    if (e.key === "ArrowUp") { e.preventDefault(); setHighlighted((h) => Math.max(h - 1, 0)); return; }
    if (e.key === "Home") { e.preventDefault(); setHighlighted(0); return; }
    if (e.key === "End") { e.preventDefault(); setHighlighted(options.length - 1); return; }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (highlighted >= 0) commit(options[highlighted].value);
    }
  };

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <style>{`
        .dsel-listbox { scrollbar-width: thin; scrollbar-color: #34383f #0e1013; }
        .dsel-listbox::-webkit-scrollbar { width: 8px; }
        .dsel-listbox::-webkit-scrollbar-track { background: #0e1013; }
        .dsel-listbox::-webkit-scrollbar-thumb { background: #34383f; border-radius: 8px; }
        .dsel-listbox::-webkit-scrollbar-thumb:hover { background: #454a52; }
        .dsel-option:hover, .dsel-option.dsel-highlighted { background: #2563eb !important; color: #ffffff !important; }
        .dsel-option.dsel-selected:not(:hover):not(.dsel-highlighted) { background: rgba(37,99,235,0.18); }
      `}</style>

      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onKeyDown}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
          background: "#0e1013", border: `1px solid ${open ? "#c9a668" : "#34383f"}`, borderRadius: 10,
          padding: "10px 13px", fontSize: 13.5, color: selected ? "#f3f1ec" : "#6b6d71",
          fontFamily: "inherit", cursor: "pointer", boxSizing: "border-box", textAlign: "left",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={15} style={{ color: "#6b6d71", flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          className="dsel-listbox"
          style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 50,
            maxHeight: 280, overflowY: "auto", margin: 0, padding: 6, listStyle: "none",
            background: "#15171b", border: "1px solid #34383f", borderRadius: 10,
            boxShadow: "0 12px 32px rgba(0,0,0,.5)",
          }}
        >
          <li
            role="option"
            aria-selected={!value}
            data-idx={-1}
            onMouseEnter={() => setHighlighted(-1)}
            onClick={() => commit("")}
            className={`dsel-option${!value ? " dsel-selected" : ""}${highlighted === -1 ? " dsel-highlighted" : ""}`}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 10px", borderRadius: 7, fontSize: 13.5, color: "#6b6d71", cursor: "pointer" }}
          >
            <span style={{ width: 14 }}>{!value && <Check size={13} />}</span>
            {placeholder}
          </li>
          {options.map((opt, idx) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              data-idx={idx}
              onMouseEnter={() => setHighlighted(idx)}
              onClick={() => commit(opt.value)}
              className={`dsel-option${opt.value === value ? " dsel-selected" : ""}${highlighted === idx ? " dsel-highlighted" : ""}`}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 10px", borderRadius: 7, fontSize: 13.5, color: "#f3f1ec", cursor: "pointer" }}
            >
              <span style={{ width: 14 }}>{opt.value === value && <Check size={13} />}</span>
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
