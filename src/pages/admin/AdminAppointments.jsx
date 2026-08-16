import React from "react";
import { adminApi } from "../../lib/adminApi.js";
import AdminOrgDataViewer from "./AdminOrgDataViewer.jsx";

export default function AdminAppointments() {
  return (
    <AdminOrgDataViewer
      title="Afspraken"
      sub="Cross-organisatie leesoverzicht — kies eerst een organisatie."
      emptyText="Deze organisatie heeft nog geen afspraken."
      fetchFn={adminApi.listOrgAppointments}
      columns={[
        { key: "datum", label: "Datum" },
        { key: "tijd", label: "Tijd" },
        { key: "klantnaam", label: "Klant" },
        { key: "status", label: "Status" },
      ]}
    />
  );
}
