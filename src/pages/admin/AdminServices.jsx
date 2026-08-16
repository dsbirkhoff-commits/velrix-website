import React from "react";
import { adminApi } from "../../lib/adminApi.js";
import AdminOrgDataViewer from "./AdminOrgDataViewer.jsx";

export default function AdminServices() {
  return (
    <AdminOrgDataViewer
      title="Diensten"
      sub="Cross-organisatie leesoverzicht — kies eerst een organisatie."
      emptyText="Deze organisatie heeft nog geen diensten."
      fetchFn={adminApi.listOrgServices}
      columns={[
        { key: "naam", label: "Naam" },
        { key: "prijs", label: "Prijs", render: (r) => (r.prijs != null ? `€${Number(r.prijs).toFixed(2)}` : "—") },
        { key: "afspraakduur_minuten", label: "Duur (min)" },
        { key: "actief", label: "Actief", render: (r) => (r.actief ? "Ja" : "Nee") },
      ]}
    />
  );
}
