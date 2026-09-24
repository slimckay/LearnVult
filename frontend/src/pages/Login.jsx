import { useState } from "react";
import { Link } from "react-router-dom";
import { login } from "../api.js";

export default function Login({ onAuth }) {
  const [email, setEmail] = useState("teacher@learnvult.sl");
  const [password, setPassword] = useState("Teacher123!");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      onAuth(await login(email, password));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="card">
        <span className="kicker">School access</span>
        <h1>Sign in to class</h1>
        <p className="meta page-intro">
          Teachers share notes and past papers. Students keep them on the device when data drops.
        </p>
        {error && <div className="banner error">{error}</div>}
        <form onSubmit={submit}>
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          <label>Password</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
          <button className="btn" disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button>
        </form>
        <p className="meta">New teacher or student? <Link to="/register">Create an account</Link></p>
        <p className="meta">School admin: admin@learnvult.sl</p>
      </div>
    </div>
  );
}
