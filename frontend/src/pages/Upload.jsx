import { useState } from "react";
import { uploadResource } from "../api.js";
import { queueUpload } from "../offline/db.js";
import { isNetworkError } from "../offline/syncQueue.js";

export default function Upload() {
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    const formEl = event.target;
    const form = new FormData(formEl);
    const file = form.get("file");

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const created = await uploadResource(form);
      setMessage(`Uploaded "${created.title}" to the server.`);
      formEl.reset();
    } catch (err) {
      if (isNetworkError(err) && file) {
        await queueUpload({
          title: form.get("title"),
          subject: form.get("subject"),
          class_level: form.get("class_level"),
          resource_type: form.get("resource_type") || "notes",
          academic_year: form.get("academic_year") || "",
          description: form.get("description") || "",
          filename: file.name,
          fileBlob: file,
        });
        setMessage(`"${form.get("title")}" is saved on this device and will upload when the internet returns. Open Sync to send it.`);
        formEl.reset();
      } else {
        setError(err.message);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 560 }}>
      <h1>Upload a resource</h1>
      <p className="meta">
        If there is no internet, the file stays on this phone or laptop and waits in the Sync queue.
      </p>
      {error && <div className="banner error">{error}</div>}
      {message && <div className="banner">{message}</div>}
      <form onSubmit={submit}>
        <label>Title</label>
        <input name="title" required />
        <label>Subject</label>
        <input name="subject" placeholder="Mathematics" required />
        <label>Class level</label>
        <input name="class_level" placeholder="SSS 2" required />
        <label>Type</label>
        <select name="resource_type" defaultValue="notes">
          <option value="notes">Notes</option>
          <option value="past_paper">Past paper</option>
          <option value="assignment">Assignment</option>
          <option value="other">Other</option>
        </select>
        <label>Academic year</label>
        <input name="academic_year" placeholder="2025/2026" />
        <label>Description</label>
        <textarea name="description" rows="3" />
        <label>File</label>
        <input name="file" type="file" required />
        <button className="btn" disabled={busy}>
          {busy ? "Saving..." : "Upload"}
        </button>
      </form>
    </div>
  );
}
