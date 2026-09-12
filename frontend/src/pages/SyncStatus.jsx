import { useEffect, useState } from "react";
import { flushSync, syncStatus } from "../api.js";

export default function SyncStatus() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function load() {
    try { setError(""); setRows(await syncStatus()); }
    catch (err) { setError(err.message); }
  }
  useEffect(() => { load(); }, []);
  async function flush() {
    try {
      const result = await flushSync();
      setMessage(`Flushed ${result.flushed} pending item(s).`);
      load();
    } catch (err) { setError(err.message); }
  }
  return (
    <div className="card">
      <h1>Synchronization</h1>
      <p className="meta">Pending work waits here until the device finds a connection.</p>
      {error && <div className="banner error">{error}</div>}
      {message && <div className="banner">{message}</div>}
      <button className="btn" onClick={flush}>Flush pending changes</button>
      {!rows.length && <p>No sync activity yet.</p>}
      {rows.map((row) => (
        <article className="resource" key={row.id}>
          <div>
            <strong>{row.action}</strong>
            <div className="meta">{row.detail || "—"}</div>
          </div>
          <span className="meta">{row.status}</span>
        </article>
      ))}
    </div>
  );
}
