import { NavLink, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Library from "./pages/Library.jsx";
import Upload from "./pages/Upload.jsx";
import Offline from "./pages/Offline.jsx";
import SyncStatus from "./pages/SyncStatus.jsx";
import { flushUploadQueue } from "./offline/syncQueue.js";

function readUser() {
  const raw = localStorage.getItem("lv_user");
  return raw ? JSON.parse(raw) : null;
}

function Layout({ user, onLogout, children }) {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on = async () => {
      setOnline(true);
      if (localStorage.getItem("lv_token")) {
        try { await flushUploadQueue(); } catch {}
      }
    };
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">LearnVult<small>Offline learning resources for Sierra Leone</small></div>
        <nav>
          <span className="offline-pill">{online ? "Online" : "Offline"}</span>
          {user ? (
            <>
              <NavLink to="/library">Library</NavLink>
              <NavLink to="/offline">Offline</NavLink>
              <NavLink to="/sync">Sync</NavLink>
              {(user.role === "teacher" || user.role === "admin") && <NavLink to="/upload">Upload</NavLink>}
              <button className="btn ghost" onClick={onLogout}>Log out</button>
            </>
          ) : (
            <>
              <NavLink to="/login">Login</NavLink>
              <NavLink to="/register">Register</NavLink>
            </>
          )}
        </nav>
      </header>
      {children}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(readUser);
  const navigate = useNavigate();
  function handleAuth(data) {
    localStorage.setItem("lv_token", data.access_token);
    localStorage.setItem("lv_user", JSON.stringify(data.user));
    setUser(data.user);
    navigate("/library");
  }
  function logout() {
    localStorage.removeItem("lv_token");
    localStorage.removeItem("lv_user");
    setUser(null);
    navigate("/login");
  }
  return (
    <Layout user={user} onLogout={logout}>
      <Routes>
        <Route path="/" element={<Navigate to={user ? "/library" : "/login"} />} />
        <Route path="/login" element={<Login onAuth={handleAuth} />} />
        <Route path="/register" element={<Register onAuth={handleAuth} />} />
        <Route path="/library" element={user ? <Library user={user} /> : <Navigate to="/login" />} />
        <Route path="/upload" element={user ? <Upload /> : <Navigate to="/login" />} />
        <Route path="/offline" element={<Offline />} />
        <Route path="/sync" element={user ? <SyncStatus /> : <Navigate to="/login" />} />
      </Routes>
    </Layout>
  );
}
