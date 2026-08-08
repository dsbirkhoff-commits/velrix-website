import React, { createContext, useContext, useState } from "react";
import BookingModal from "./BookingModal.jsx";

const BookingContext = createContext(null);

export function BookingProvider({ children }) {
  const [open, setOpen] = useState(false);

  return (
    <BookingContext.Provider value={{ openBooking: () => setOpen(true) }}>
      {children}
      {open && <BookingModal onClose={() => setOpen(false)} />}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBooking must be used within a BookingProvider");
  return ctx;
}
