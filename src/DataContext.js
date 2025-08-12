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
      .then((r) => r
