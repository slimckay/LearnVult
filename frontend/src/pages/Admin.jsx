import { useEffect, useState } from "react";
import {
  adminDeleteFeedback,
  adminDeleteResource,
  adminFeedback,
  adminIssueResetCode,
  adminResources,
  adminSetPassword,
  adminSummary,
  adminUnverifyTeacher,
  adminUsers,
  adminVerifyTeacher,
} from "../api.js";

export default function Admin() {
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [resources, setResources] = useState([]);
  const [notes, setNotes] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      setError("");
      const [stats, people, files, ideas] = await Promise.all([
        adminSummary(),
        adminUsers(),
        adminResources(),
        adminFeedback(),
      ]);
      setSummary(stats);
      setUsers(people);
      setResources(files);
      setNotes(ideas);
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
      const result = await action();
      setMessage(success(result));
      await load();
      return result;
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const teachers = users.filter((u) => u.role === "teacher");
  const waiting = users.filter((u) => u.reset_requested);

  return (
    <>
      <section className="hero">
        <div className="hero-card">
          <span className="kicker">School control</span>
          <h1>Admin dashboard</h1>
          <p className="meta">View accounts, verify teachers, read feedback, and remove materials.</p>
        </div>
        <div className="stat">
          <span>Feedback notes</span>
          <strong>{summary ? summary.feedback : "—"}</strong>
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
            <span className="tag">{summary.feedback || 0} feedback</span>
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <h2>Feedback</h2>
        <p className="meta">Suggestions and problems sent from the Feedback page.</p>
        {!notes.length && <p className="meta">No feedback yet.</p>}
        {notes.map((note) => (
          <article className="resource" key={note.id}>
            <div>
              <strong>{note.user_name}</strong>
              <div className="meta">
                <span className="tag">{note.category}</span>
                {note.user_email} · {note.created_at ? new Date(note.created_at).toLocaleString() : ""}
              </div>
              <p>{note.message}</p>
            </div>
            <button className="btn ghost" disabled={busy} onClick={() => run(() => adminDeleteFeedback(note.id), () => "Feedback removed.")}>Remove</button>
          </article>
        ))}
      </div>

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
              <button className="btn ghost" disabled={busy} onClick={() => run(() => adminUnverifyTeacher(person.id), () => `${person.full_name} is no longer verified.`)}>Remove verification</button>
            ) : (
              <button className="btn" disabled={busy} onClick={() => run(() => adminVerifyTeacher(person.id), () => `${person.full_name} can now upload.`)}>Verify teacher</button>
            )}
          </article>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h2>All accounts</h2>
        {waiting.length > 0 && <p className="meta">{waiting.length} account(s) asked for a new password.</p>}
        {users.map((person) => (
          <article className="resource" key={person.id}>
            <div>
              <strong>{person.full_name}</strong>
              <div className="meta">
                <span className="tag">{person.role}</span>
                {person.email}
                {person.reset_requested && <span className="tag">Reset requested</span>}
              </div>
            </div>
            {person.role !== "admin" && (
              <div className="row">
                <button className="btn secondary" disabled={busy} onClick={() => run(
                  () => adminIssueResetCode(person.id),
                  (data) => `Code for ${person.full_name}: ${data.code}. Give it to them. It expires in 2 hours.`,
                )}>Give reset code</button>
                <button className="btn ghost" disabled={busy} onClick={() => {
                  const password = window.prompt(`New password for ${person.full_name} (8+ characters)`);
                  if (!password) return;
                  if (password.length < 8) {
                    setError("Password must be at least 8 characters.");
                    return;
                  }
                  run(() => adminSetPassword(person.id, password), () => `Password updated for ${person.full_name}. Tell them the new password.`);
                }}>Set password</button>
              </div>
            )}
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
                run(() => adminDeleteResource(item.id), () => `Removed "${item.title}".`);
              }
            }}>Remove</button>
          </article>
        ))}
      </div>
    </>
  );
}
