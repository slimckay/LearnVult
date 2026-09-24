import { useEffect, useState } from "react";
import { downloadResource, listResources } from "../api.js";
import { saveOfflineResource } from "../offline/db.js";

export default function Library({ user }) {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    try {
      setError("");
      setItems(await listResources({ q }));
    } catch (err) {
      setError(`${err.message}. If you are offline, open the Offline shelf.`);
    }
  }

  useEffect(() => { load(); }, []);

  async function keepOffline(item) {
    try {
      const { blob } = await downloadResource(item.id);
      await saveOfflineResource(item, blob);
      setMessage(`Saved "${item.title}" on this device.`);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <section className="hero">
        <div className="hero-card">
          <span className="kicker">{user.school_name || "LearnVult school"}</span>
          <h1>Resource library</h1>
          <p className="meta">
            Welcome, {user.full_name}. Browse notes, past papers, and assignments for class.
          </p>
        </div>
        <div className="stat">
          <span>Materials in this library</span>
          <strong>{items.length}</strong>
        </div>
      </section>

      <div className="card">
        {error && <div className="banner error">{error}</div>}
        {message && <div className="banner">{message}</div>}
        <form className="row" onSubmit={(e) => { e.preventDefault(); load(); }}>
          <input placeholder="Search title, subject or class" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="btn">Search</button>
        </form>
        {!items.length && (
          <p className="meta">No resources yet. Teachers can add files from Upload.</p>
        )}
        {items.map((item) => (
          <article className="resource" key={item.id}>
            <div>
              <strong>{item.title}</strong>
              <div className="meta">
                <span className="tag">{item.subject}</span>
                <span className="tag">{item.class_level}</span>
                {item.resource_type}
              </div>
            </div>
            <button className="btn secondary" onClick={() => keepOffline(item)}>Save offline</button>
          </article>
        ))}
      </div>
    </>
  );
}
