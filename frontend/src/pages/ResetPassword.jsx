import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../api.js";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState(params.get("email") || "");
  const [code, setCode] = useState(params.get("code") || "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const data = await resetPassword({ email, code, new_password: password });
      setMessage(data.detail || "Password updated.");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="card">
        <span className="kicker">Account help</span>
        <h1>Create a new password</h1>
        <p className="meta page-intro">Use the 6-digit code from the previous page, then choose a new password.</p>
        {error && <div className="banner error">{error}</div>}
        {message && <div className="banner">{message}</div>}
        <form onSubmit={submit}>
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          <label>Reset code</label>
          <input value={code} onChange={(e) => setCode(e.target.value)} required placeholder="6-digit code" />
          <label>New password</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" minLength={8} required />
          <label>Confirm password</label>
          <input value={confirm} onChange={(e) => setConfirm(e.target.value)} type="password" minLength={8} required />
          <button className="btn" disabled={busy}>{busy ? "Saving..." : "Save new password"}</button>
        </form>
        <p className="meta"><Link to="/forgot">Get a new code</Link> · <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}
