import React, { useState } from "react";
import { useData } from "./DataContext";

const stages = ["Outreach", "Connections", "Replies", "Meetings", "Proposals", "Contracts"];
const months = [
  "Jan 2025", "Feb 2025", "Mar 2025", "Apr 2025", "May 2025", "Jun 2025",
  "Jul 2025", "Aug 2025", "Sep 2025", "Oct 2025", "Nov 2025", "Dec 2025"
];
const personas = ["Owners", "Vendor Managers"];

export default function AdminPanel({ clientName }) {
  const { updateData } = useData();
  const [month, setMonth] = useState("Jun 2025");
  const [persona, setPersona] = useState("Owners");
  const [counts, setCounts] = useState(Array(stages.length).fill(0));

  const handleChange = (index, value) => {
    const newCounts = [...counts];
    newCounts[index] = Number(value);
    setCounts(newCounts);
  };

  const handleSave = () => {
    if (!clientName || !month || !persona) {
      console.error("❌ Missing required fields");
      return;
    }
    updateData(clientName, month, persona, counts);
  };

  return (
    <div style={{
      backgroundColor: "#1D2739",
      padding: "1.5rem",
      borderRadius: "1rem",
      width: "100%",
      maxWidth: "360px",
      boxSizing: "border-box"
    }}>
      <h3 style={{ color: "#C44528", textAlign: "center", marginBottom: "1.5rem" }}>Admin Panel</h3>

      {/* Month Dropdown */}
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ display: "block", color: "white", marginBottom: "0.5rem" }}>Month</label>
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          style={inputStyle}
        >
          {months.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* Persona Dropdown */}
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ display: "block", color: "white", marginBottom: "0.5rem" }}>Buyer Persona</label>
        <select
          value={persona}
          onChange={(e) => setPersona(e.target.value)}
          style={inputStyle}
        >
          {personas.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* Stage Inputs */}
      {stages.map((stage, i) => (
        <div key={stage} style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", color: "white", marginBottom: "0.5rem" }}>{stage}</label>
          <input
            type="number"
            value={counts[i]}
            onChange={(e) => handleChange(i, e.target.value)}
            style={inputStyle}
          />
        </div>
      ))}

      <button
        onClick={handleSave}
        style={{
          marginTop: "1rem",
          width: "100%",
          padding: "0.75rem",
          backgroundColor: "#C44528",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer"
        }}
      >
        Save
      </button>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "0.5rem",
  borderRadius: "4px",
  border: "1px solid #39455D",
  backgroundColor: "#0B111D",
  color: "white",
  boxSizing: "border-box"
};
