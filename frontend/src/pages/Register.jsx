import { useState } from "react";
import { register } from "../api.js";

export default function Register({ onAuth }) {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "student",
    school_name: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      onAuth(await register(form));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="card">
        <span className="kicker">Join a school</span>
        <h1>Create account</h1>
        <p className="meta page-intro">Use your school email if you have one. Teachers can upload after signing in.</p>
        {error && <div className="banner error">{error}</div>}
        <form onSubmit={submit}>
          <label>Full name</label>
          <input value={form.full_name} onChange={(e) => update("full_name", e.target.value)} required />
          <label>Email</label>
          <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required />
          <label>Password</label>
          <input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} required minLength={8} />
          <label>Role</label>
          <select value={form.role} onChange={(e) => update("role", e.target.value)}>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>
          <label>School</label>
          <input value={form.school_name} onChange={(e) => update("school_name", e.target.value)} placeholder="e.g. Annie Walsh Memorial School" />
          <button className="btn" disabled={busy}>{busy ? "Creating..." : "Register"}</button>
        </form>
      </div>
    </div>
  );
}
