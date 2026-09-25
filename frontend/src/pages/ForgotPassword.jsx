import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../api.js";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    setCode("");
    try {
      const data = await forgotPassword(email);
      setMessage(data.detail || "Check below for your code.");
      if (data.code) setCode(data.code);
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
        <h1>Forgot password</h1>
        <p className="meta page-intro">
          Enter your email. LearnVult will show a 6-digit code straight away so you do not need to wait for an admin.
        </p>
        {error && <div className="banner error">{error}</div>}
        {message && <div className="banner">{message}</div>}
        {code && (
          <div className="stat" style={{ marginBottom: 16 }}>
            <span>Your reset code</span>
            <strong style={{ letterSpacing: "0.12em" }}>{code}</strong>
          </div>
        )}
        <form onSubmit={submit}>
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          <button className="btn" disabled={busy}>{busy ? "Creating code..." : "Get reset code"}</button>
        </form>
        {code && (
          <p className="meta">
            <Link to={`/reset?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`}>Create a new password now</Link>
          </p>
        )}
        <p className="meta"><Link to="/reset">I already have a code</Link></p>
        <p className="meta"><Link to="/login">Back to sign in</Link></p>
      </div>
    </div>
  );
}
