import { useState } from "react";
import { uploadResource } from "../api.js";
import { CLASS_LEVELS, EXAM_YEARS, RESOURCE_TYPES, SUBJECTS } from "../catalog.js";
import { queueUpload } from "../offline/db.js";
import { isNetworkError } from "../offline/syncQueue.js";

export default function Upload() {
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [kind, setKind] = useState("notes");

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
      setMessage(`Uploaded "${created.title}" to the school library.`);
      formEl.reset();
      setKind("notes");
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
        setKind("notes");
      } else {
        setError(err.message);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 640 }}>
      <span className="kicker">Teachers</span>
      <h1>Add a class resource</h1>
      <p className="meta page-intro">
        Organise the file by subject, class, type and year so students can filter the library later.
      </p>
      {error && <div className="banner error">{error}</div>}
      {message && <div className="banner">{message}</div>}
      <form onSubmit={submit}>
        <label>Title</label>
        <input name="title" required placeholder="SSS 2 Algebra revision" />

        <div className="form-grid">
          <div>
            <label>Subject</label>
            <select name="subject" required defaultValue="Mathematics">
              {SUBJECTS.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>
          <div>
            <label>Class level</label>
            <select name="class_level" required defaultValue="SSS 2">
              {CLASS_LEVELS.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>
          <div>
            <label>Type</label>
            <select name="resource_type" value={kind} onChange={(e) => setKind(e.target.value)}>
              {RESOURCE_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </div>
          <div>
            <label>{kind === "past_paper" ? "Exam year" : "Academic year"}</label>
            <select name="academic_year" defaultValue="2025">
              <option value="">Not set</option>
              {EXAM_YEARS.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </div>
        </div>

        <label>Description</label>
        <textarea name="description" rows="3" placeholder="What this file covers, or which paper (Paper 1, Paper 2)" />
        <label>File</label>
        <input name="file" type="file" required />
        <button className="btn" disabled={busy}>{busy ? "Saving..." : "Upload to library"}</button>
      </form>
    </div>
  );
}
