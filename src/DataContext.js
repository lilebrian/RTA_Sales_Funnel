import React, { createContext, useContext, useState } from "react";

export const DataContext = createContext();
export const useData = () => useContext(DataContext);

const SHEET_URL = "https://api.sheetbest.com/sheets/41f9d4f0-fd27-42c6-91ee-e349631a0ae7";
const stages = ["Outreach", "Connections", "Replies", "Meetings", "Proposals", "Contracts"];

// Helper to format dates like "Jun 2025"
function formatMonthFromDateString(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleString("default", { month: "short", year: "numeric" });
}

export const DataProvider = ({ children }) => {
  const [data, setData] = useState({});

  const loadData = async () => {
    try {
      const res = await fetch(SHEET_URL);
      const rows = await res.json();
      console.log("🧾 Raw rows from Google Sheet:", rows);
      const newData = {};

      rows.forEach((row, index) => {
        const client = row.Client?.trim();
        const persona = row.Persona?.trim();
        const weekOf = row["Week of"];
        let month = row.Month?.trim();

        if (!client || !persona || !month) {
          console.warn(`⚠️ Skipping row ${index + 1} — missing fields:`, {
            client, month, persona
          });
          return;
        }

        // Try to reformat if month is in numeric form (e.g., Excel serial date)
        if (!isNaN(month)) {
          const excelEpoch = new Date(1899, 11, 30);
          const correctedDate = new Date(excelEpoch.getTime() + month * 86400000);
          month = correctedDate.toLocaleString("default", { month: "short", year: "numeric" });
        }

        const counts = stages.map(stage => Number(row[stage] || 0));
        const monthKey = `${client}_${month}_${persona}`;
        const ytdKey = `${client}_YTD_${persona}`;

        // Populate month-level key
        newData[monthKey] = (newData[monthKey] || Array(stages.length).fill(0)).map(
          (val, i) => val + counts[i]
        );

        // If Week of is this year, include in YTD
        const entryYear = new Date(weekOf).getFullYear();
        const currentYear = new Date().getFullYear();
        if (entryYear === currentYear) {
          newData[ytdKey] = (newData[ytdKey] || Array(stages.length).fill(0)).map(
            (val, i) => val + counts[i]
          );
        }
      });

      console.log("✅ Final computed keys:", Object.keys(newData));
      setData(newData);
    } catch (error) {
      console.error("❌ Error loading data:", error);
    }
  };

  const updateData = async (clientName, month, persona, counts) => {
    const today = new Date();
    const weekOf = today.toISOString().split("T")[0];

    const row = {
      Client: clientName,
      Persona: persona,
      "Week of": weekOf,
      Month: month, // Using value from dropdown
    };

    stages.forEach((stage, i) => {
      row[stage] = counts[i];
    });

    try {
      console.log("🔄 Sending to Sheet.best:", row);
      await fetch(SHEET_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(row)
      });
      loadData();
    } catch (error) {
      console.error("❌ Error saving data:", error);
    }
  };

  return (
    <DataContext.Provider value={{ data, loadData, updateData }}>
      {children}
    </DataContext.Provider>
  );
};
