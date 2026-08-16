import React from "react";
import { adminApi } from "../../lib/adminApi.js";
import AdminOrgDataViewer from "./AdminOrgDataViewer.jsx";

export default function AdminCustomers() {
  return (
    <AdminOrgDataViewer
      title="Klanten"
      sub="Cross-organisatie leesoverzicht — kies eerst een organisatie."
      emptyText="Deze organisatie heeft nog geen klanten."
      fetchFn={adminApi.listOrgCustomers}
      columns={[
        { key: "naam", label: "Naam" },
        { key: "email", label: "E-mail" },
        { key: "telefoonnummer", label: "Telefoon" },
        { key: "status", label: "Status" },
      ]}
    />
  );
}
