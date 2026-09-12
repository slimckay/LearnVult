import { useState } from "react";
import { uploadResource } from "../api.js";

export default function Upload() {
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    setBusy(true); setError(""); setMessage("");
    try {
      const created = await uploadResource(form);
      setMessage(`Uploaded "${created.title}".`);
      event.target.reset();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return (
    <div className="card" style={{ maxWidth: 560 }}>
      <h1>Upload a resource</h1>
      <p className="meta">Teachers can add notes, past papers, assignments, or other files.</p>
      {error && <div className="banner error">{error}</div>}
      {message && <div className="banner">{message}</div>}
      <form onSubmit={submit}>
        <label>Title</label><input name="title" required />
        <label>Subject</label><input name="subject" placeholder="Mathematics" required />
        <label>Class level</label><input name="class_level" placeholder="SSS 2" required />
        <label>Type</label>
        <select name="resource_type" defaultValue="notes">
          <option value="notes">Notes</option>
          <option value="past_paper">Past paper</option>
          <option value="assignment">Assignment</option>
          <option value="other">Other</option>
        </select>
        <label>Academic year</label><input name="academic_year" placeholder="2025/2026" />
        <label>Description</label><textarea name="description" rows="3" />
        <label>File</label><input name="file" type="file" required />
        <button className="btn" disabled={busy}>{busy ? "Uploading..." : "Upload"}</button>
      </form>
    </div>
  );
}
