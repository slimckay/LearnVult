import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../api.js";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const data = await forgotPassword(email);
      setMessage(data.detail || "Ask your school admin for a reset code.");
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
          Enter your email. Your school admin can then give you a 6-digit code so you can create a new password.
        </p>
        {error && <div className="banner error">{error}</div>}
        {message && <div className="banner">{message}</div>}
        <form onSubmit={submit}>
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          <button className="btn" disabled={busy}>{busy ? "Sending request..." : "Request reset code"}</button>
        </form>
        <p className="meta"><Link to="/reset">I already have a code</Link></p>
        <p className="meta"><Link to="/login">Back to sign in</Link></p>
      </div>
    </div>
  );
}
