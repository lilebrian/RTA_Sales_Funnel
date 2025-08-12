/* eslint-disable */
import React, { createContext, useContext, useEffect, useState } from "react";

const API_URL = https://api.sheetbest.com/sheets/0475a26b-34a0-4e41-b17d-5e513101983d
  typeof process !== "undefined" && process.env && process.env.REACT_APP_SHEETBEST_URL
    ? process.env.REACT_APP_SHEETBEST_URL
    : "PASTE_YOUR_SHEETBEST_URL";

const FIELDS = ["Outreach","Connections","Replies","Meetings","Proposals","Contracts"];

function norm(v){ return (v == null ? "" : String(v)).trim(); }
function labelFromDate(d){ return d.toLocaleString("en-US", { month: "long", year: "numeric" }); }
function excelSerialToDate(n){ var base = Date.UTC(1899,11,30); return new Date(base + Number(n)*86400000); }

// Turn any month-ish input (serial, YYYY-MM, YYYY-MM-DD, Date, "Aug 2025", "August") into a canonical label like "August 2025"
function monthLabel(m){
  if (m == null) return "";
  if (typeof m === "number") return labelFromDate(excelSerialToDate(m));
  var s = String(m).trim();
  if (s === "") return "";
  if (/^\d+$/.test(s)) return labelFromDate(excelSerialToDate(parseInt(s,10)));
  if (/^\d{4}-\d{2}(-\d{2})?$/.test(s)) {
    var parts = s.split("-");
    var y = parseInt(parts[0],10), mo = parseInt(parts[1],10)-1, d = parts[2] ? parseInt(parts[2],10) : 1;
    return labelFromDate(new Date(y, mo, d));
  }
  var d2 = new Date(s);
  if (!isNaN(d2)) return labelFromDate(d2);
  return s; // already a nice label like "August" or "August 2025"
}

// Remove a trailing year if present: "August 2025" -> "August"
function monthNameOnly(lbl){ return String(lbl).replace(/\s+\d{4}$/, ""); }

function canonicalKey(client, month, persona){
  return norm(client) + "_" + norm(monthLabel(month)) + "_" + norm(persona);
}

const DataContext = createContext({
  data: {},
  updateData: function(){},
  refresh: function(){},
  getCounts: function(){ return [0,0,0,0,0,0]; }
});

export const useData = () => useContext(DataContext);

export function DataProvider({ children }) {
  const [data, setData] = useState({});

  // Add both strict and fallback keys so UI lookups succeed whether month has a year or not
  function addRowToMap(map, row){
    var client = row["Client Name"], monthRaw = row["Month"], persona = row["Persona"];
    var counts = FIELDS.map(function (f) { return parseInt(row[f], 10) || 0; });

    var lbl = monthLabel(monthRaw);
    var keyStrict = norm(client) + "_" + norm(lbl) + "_" + norm(persona);
    map[keyStrict] = counts;

    // Fallback: also store a key without the year (e.g., "August")
    var keyNoYear = norm(client) + "_" + norm(monthNameOnly(lbl)) + "_" + norm(persona);
    if (!(keyNoYear in map)) map[keyNoYear] = counts;
  }

  function load(){
    var url = API_URL + "?ts=" + Date.now(); // cache-bust
    return fetch(url, { headers: { "Cache-Control":"no-cache", "Pragma":"no-cache" } })
      .then(function(r){ return r.json(); })
      .then(function(rows){
        var map = {};
        for (var i = 0; i < rows.length; i++) addRowToMap(map, rows[i]);
        setData(map);
      })
      .catch(function(e){ console.error("Read error:", e); });
  }

  useEffect(function(){
    load();
    var id = setInterval(load, 30000);
    return function(){ clearInterval(id); };
  }, []);

  async function updateData(clientName, month, persona, counts){
    // Use canonical month label for writing, so Sheet stores clean strings (not serials)
    var monthOut = monthLabel(month);

    // Update local cache under both keys (with and without year) so UI reflects immediately
    var keyStrict = norm(clientNa
