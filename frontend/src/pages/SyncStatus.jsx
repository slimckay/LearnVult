import { useEffect, useState } from "react";
import { flushSync, syncStatus } from "../api.js";
import { listQueuedUploads } from "../offline/db.js";
import { flushUploadQueue } from "../offline/syncQueue.js";

export default function SyncStatus() {
  const [rows, setRows] = useState([]);
  const [queued, setQueued] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setQueued(await listQueuedUploads());
    try {
      setError("");
      setRows(await syncStatus());
    } catch (err) {
      setRows([]);
      if (navigator.onLine) setError(err.message);
    }
  }

  useEffect(() => { load(); }, []);

  async function flush() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const local = await flushUploadQueue();
      let serverCount = 0;
      if (navigator.onLine) {
        const result = await flushSync();
        serverCount = result.flushed || 0;
      }
      setMessage(
        local.skipped
          ? "Still offline. Queued files will wait on this device."
          : `Sent ${local.flushed} queued upload(s). Server records updated: ${serverCount}.`
      );
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <span className="kicker">Connection</span>
      <h1>Synchronization</h1>
      <p className="meta page-intro">Work done without internet waits here until this device finds a connection.</p>
      {error && <div className="banner error">{error}</div>}
      {message && <div className="banner">{message}</div>}
      <button className="btn" onClick={flush} disabled={busy}>
        {busy ? "Syncing..." : "Sync now"}
      </button>
      <h2>Waiting on this device</h2>
      {!queued.length && <p className="meta">No queued uploads.</p>}
      {queued.map((item) => (
        <article className="resource" key={item.id}>
          <div>
            <strong>{item.title}</strong>
            <div className="meta">{item.subject} · {item.filename} · {new Date(item.createdAt).toLocaleString()}</div>
          </div>
          <span className="meta">{item.status}</span>
        </article>
      ))}
      <h2>Server sync log</h2>
      {!rows.length && <p className="meta">No server activity yet, or you are offline.</p>}
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
