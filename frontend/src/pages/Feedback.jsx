import { useState } from "react";
import { sendFeedback } from "../api.js";

export default function Feedback({ user }) {
  const [category, setCategory] = useState("suggestion");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setDone("");
    try {
      const result = await sendFeedback({ category, message });
      setDone(result.detail || "Thank you.");
      setMessage("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <span className="kicker">Help us improve</span>
      <h1>Feedback</h1>
      <p className="meta page-intro">
        Tell us what is working, what is hard on a phone, or what the school still needs. Admin can read every note.
      </p>
      {error && <div className="banner error">{error}</div>}
      {done && <div className="banner">{done}</div>}
      <form onSubmit={submit}>
        <label>Type</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="suggestion">Suggestion</option>
          <option value="problem">Something is broken</option>
          <option value="praise">What I like</option>
        </select>
        <label>Your message</label>
        <textarea
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={`Hi, I am ${user.full_name.split(" ")[0]}. ...`}
          required
          minLength={8}
        />
        <button className="btn" disabled={busy}>{busy ? "Sending..." : "Send feedback"}</button>
      </form>
    </div>
  );
}
