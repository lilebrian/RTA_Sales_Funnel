/* eslint-disable */
import React, { createContext, useContext, useEffect, useState } from "react";

const API_URL = "https://api.sheetbest.com/sheets/0475a26b-34a0-4e41-b17d-5e513101983d";
const FIELDS = ["Outreach", "Connections", "Replies", "Meetings", "Proposals", "Contracts"];

function norm(v) { return v == null ? "" : String(v).trim(); }
function labelFromDate(d) { return d.toLocaleString("en-US", { month: "long", year: "numeric" }); }
function excelSerialToDate(n) { const base = Date.UTC(1899, 11, 30); return new Date(base + Number(n) * 86400000); }

function monthLabel(m) {
  if (m == null) return "";
  if (typeof m === "number") return labelFromDate(excelSerialToDate(m));
  const s = String(m).trim();
  if (s === "") return "";
  if (/^\d+$/.test(s)) return labelFromDate(excelSerialToDate(parseInt(s, 10)));
  if (/^\d{4}-\d{2}(-\d{2})?$/.test(s)) {
    const parts = s.split("-");
    const y = parseInt(parts[0], 10);
    const mo = parseInt(parts[1], 10) - 1;
    const d = parts[2] ? parseInt(parts[2], 10) : 1;
    return labelFromDate(new Date(y, mo, d));
  }
  const d2 = new Date(s);
  if (!isNaN(d2)) return labelFromDate(d2);
  return s; // already a nice label like "August 2025"
}

function monthNameOnly(lbl) { return String(lbl).replace(/\s+\d{4}$/, ""); }

const DataContext = createContext({
  data: {},
  updateData: () => {},
  refresh: () => {},
  getCounts: () => [0, 0, 0, 0, 0, 0],
});

export const useData = () => useContext(DataContext);

export function DataProvider({ children }) {
  const [data, setData] = useState({});

  function addRowToMap(map, row) {
    const client = row["Client Name"];
    const monthRaw = row["Month"];
    const persona = row["Persona"];
    const counts = FIELDS.map((f) => parseInt(row[f], 10) || 0);

    const lbl = monthLabel(monthRaw);
    const keyStrict = `${norm(client)}_${norm(lbl)}_${norm(persona)}`;
    map[keyStrict] = counts;

    // Also index without the year so "August" finds "August 2025"
    const keyNoYear = `${norm(client)}_${norm(monthNameOnly(lbl))}_${norm(persona)}`;
    if (!(keyNoYear in map)) map[keyNoYear] = counts;
  }

  function load() {
    const url = `${API_URL}?ts=${Date.now()}`; // cache-bust
    return fetch(url, { headers: { "Cache-Control": "no-cache", Pragma: "no-cache" } })
      .then((r) => r.json())
      .then((rows) => {
        const map = {};
        for (let i = 0; i < rows.length; i++) addRowToMap(map, rows[i]);
        setData(map);
      })
      .catch((e) => console.error("Read error:", e));
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  async function updateData(clientName, month, persona, counts) {
    const monthOut = monthLabel(month);

    // Update local cache under both keys so UI reflects instantly
    const keyStrict = `${norm(clientName)}_${norm(monthOut)}_${norm(persona)}`;
    const keyNoYear = `${norm(clientName)}_${norm(monthNameOnly(monthOut))}_${norm(persona)}`;
    const next = { ...data, [keyStrict]: counts, [keyNoYear]: counts };
    setData(next);

    const row = [{
      "Client Name": clientName,
      "Month": monthOut,        // write a friendly label, not a serial
      "Persona": persona,
      "Outreach": counts && counts[0] != null ? counts[0] : 0,
      "Connections": counts && counts[1] != null ? counts[1] : 0,
      "Replies": counts && counts[2] != null ? counts[2] : 0,
      "Meetings": counts && counts[3] != null ? counts[3] : 0,
      "Proposals": counts && counts[4] != null ? counts[4] : 0,
      "Contracts": counts && counts[5] != null ? counts[5] : 0,
    }];

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(row),
      });
      if (!res.ok) {
        console.error("Sheetbest write failed:", res.status, await res.text());
      } else {
        await res.json().catch(() => null);
        await load(); // refresh after save
      }
    } catch (e) {
      console.error("Write error:", e);
    }
  }

  function refresh() { return load(); }

  function getCounts(clientName, month, persona) {
    const lbl = monthLabel(month);
    const keyStrict = `${norm(clientName)}_${norm(lbl)}_${norm(persona)}`;
    if (data[keyStrict]) return data[keyStrict];
    const keyNoYear = `${norm(clientName)}_${norm(monthNameOnly(lbl))}_${norm(persona)}`;
    return data[keyNoYear] || [0, 0, 0, 0, 0, 0];
  }

  return React.createElement(
    DataContext.Provider,
    { value: { data, updateData, refresh, getCounts } },
    children
  );
}

export default DataContext;
