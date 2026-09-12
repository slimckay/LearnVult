import { useEffect, useState } from "react";
import { downloadResource, listResources } from "../api.js";
import { saveOfflineResource } from "../offline/db.js";

export default function Library({ user }) {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function load() {
    try { setError(""); setItems(await listResources({ q })); }
    catch (err) { setError(`${err.message}. If you are offline, open the Offline page.`); }
  }
  useEffect(() => { load(); }, []);
  async function keepOffline(item) {
    try {
      const { blob } = await downloadResource(item.id);
      await saveOfflineResource(item, blob);
      setMessage(`Saved "${item.title}" on this device.`);
    } catch (err) { setError(err.message); }
  }
  return (
    <div className="card">
      <h1>Resource library</h1>
      <p className="meta">Signed in as {user.full_name} ({user.role})</p>
      {error && <div className="banner error">{error}</div>}
      {message && <div className="banner">{message}</div>}
      <form className="row" onSubmit={(e) => { e.preventDefault(); load(); }}>
        <input placeholder="Search title" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn">Search</button>
      </form>
      {!items.length && <p className="meta">No resources yet. Teachers can upload from the Upload page.</p>}
      {items.map((item) => (
        <article className="resource" key={item.id}>
          <div>
            <strong>{item.title}</strong>
            <div className="meta">{item.subject} · {item.class_level} · {item.resource_type}</div>
          </div>
          <button className="btn secondary" onClick={() => keepOffline(item)}>Save offline</button>
        </article>
      ))}
    </div>
  );
}
