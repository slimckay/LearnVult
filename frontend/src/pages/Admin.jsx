import { useEffect, useState } from "react";
import {
  adminDeleteResource,
  adminResources,
  adminSummary,
  adminUnverifyTeacher,
  adminUsers,
  adminVerifyTeacher,
} from "../api.js";

export default function Admin() {
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [resources, setResources] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      setError("");
      const [stats, people, files] = await Promise.all([
        adminSummary(),
        adminUsers(),
        adminResources(),
      ]);
      setSummary(stats);
      setUsers(people);
      setResources(files);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { load(); }, []);

  async function run(action, success) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
      setMessage(success);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const teachers = users.filter((u) => u.role === "teacher");

  return (
    <>
      <section className="hero">
        <div className="hero-card">
          <span className="kicker">School control</span>
          <h1>Admin dashboard</h1>
          <p className="meta">View accounts, verify teachers, and remove materials from the library.</p>
        </div>
        <div className="stat">
          <span>Pending teacher checks</span>
          <strong>{summary ? summary.pending_teachers : "—"}</strong>
        </div>
      </section>

      {error && <div className="banner error">{error}</div>}
      {message && <div className="banner">{message}</div>}

      {summary && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="row">
            <span className="tag">{summary.users} users</span>
            <span className="tag">{summary.teachers} teachers</span>
            <span className="tag">{summary.resources} resources</span>
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <h2>Teachers</h2>
        <p className="meta">A teacher can upload only after you verify them.</p>
        {!teachers.length && <p className="meta">No teacher accounts yet.</p>}
        {teachers.map((person) => (
          <article className="resource" key={person.id}>
            <div>
              <strong>{person.full_name}</strong>
              <div className="meta">
                {person.email} · {person.school_name || "No school"} · {person.is_verified ? "Verified" : "Waiting"}
              </div>
            </div>
            {person.is_verified ? (
              <button className="btn ghost" disabled={busy} onClick={() => run(() => adminUnverifyTeacher(person.id), `${person.full_name} is no longer verified.`)}>Remove verification</button>
            ) : (
              <button className="btn" disabled={busy} onClick={() => run(() => adminVerifyTeacher(person.id), `${person.full_name} can now upload.`)}>Verify teacher</button>
            )}
          </article>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h2>All accounts</h2>
        {users.map((person) => (
          <article className="resource" key={person.id}>
            <div>
              <strong>{person.full_name}</strong>
              <div className="meta"><span className="tag">{person.role}</span> {person.email}</div>
            </div>
          </article>
        ))}
      </div>

      <div className="card">
        <h2>Materials</h2>
        <p className="meta">Removing a file deletes it from the live library.</p>
        {!resources.length && <p className="meta">No materials uploaded yet.</p>}
        {resources.map((item) => (
          <article className="resource" key={item.id}>
            <div>
              <strong>{item.title}</strong>
              <div className="meta">{item.subject} · {item.class_level} · {item.owner_name || "Unknown"}</div>
            </div>
            <button className="btn ghost" disabled={busy} onClick={() => {
              if (window.confirm(`Remove "${item.title}" from the library?`)) {
                run(() => adminDeleteResource(item.id), `Removed "${item.title}".`);
              }
            }}>Remove</button>
          </article>
        ))}
      </div>
    </>
  );
}
