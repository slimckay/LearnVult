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
    setBusy(true); setError("");
    try { onAuth(await login(email, password)); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return (
    <div className="card" style={{ maxWidth: 420, margin: "0 auto" }}>
      <h1>Sign in</h1>
      <p className="meta">Demo teacher: teacher@learnvult.sl / Teacher123!</p>
      {error && <div className="banner error">{error}</div>}
      <form onSubmit={submit}>
        <label>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        <label>Password</label>
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        <button className="btn" disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button>
      </form>
      <p>New here? <Link to="/register">Create an account</Link></p>
    </div>
  );
}
