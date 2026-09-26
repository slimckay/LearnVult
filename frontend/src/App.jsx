import { NavLink, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import Library from "./pages/Library.jsx";
import Upload from "./pages/Upload.jsx";
import Offline from "./pages/Offline.jsx";
import SyncStatus from "./pages/SyncStatus.jsx";
import Admin from "./pages/Admin.jsx";
import Reader from "./pages/Reader.jsx";
import Feedback from "./pages/Feedback.jsx";
import Splash from "./components/Splash.jsx";
import { flushUploadQueue } from "./offline/syncQueue.js";

function readUser() {
  const raw = localStorage.getItem("lv_user");
  return raw ? JSON.parse(raw) : null;
}

function firstName(user) {
  return (user?.full_name || "friend").split(" ")[0];
}

function appIsInstalled() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function Layout({ user, welcome, onDismissWelcome, onLogout, children }) {
  const [online, setOnline] = useState(navigator.onLine);
  const [installed, setInstalled] = useState(appIsInstalled);

  useEffect(() => {
    const on = async () => {
      setOnline(true);
      if (localStorage.getItem("lv_token")) {
        try { await flushUploadQueue(); } catch {}
      }
    };
    const off = () => setOnline(false);
    const ready = async (event) => {
      event.preventDefault();
      if (appIsInstalled() || sessionStorage.getItem("lv_install_asked")) return;
      sessionStorage.setItem("lv_install_asked", "1");
      try {
        await event.prompt();
        const choice = await event.userChoice;
        if (choice?.outcome === "accepted") setInstalled(true);
      } catch {}
    };
    const installedNow = () => setInstalled(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    window.addEventListener("beforeinstallprompt", ready);
    window.addEventListener("appinstalled", installedNow);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
      window.removeEventListener("beforeinstallprompt", ready);
      window.removeEventListener("appinstalled", installedNow);
    };
  }, []);

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <div className="logo-mark">LV</div>
          <div>
            <div className="brand-name">LearnVult</div>
            <small>Secondary school resources · Sierra Leone</small>
          </div>
        </div>
        <nav>
          <span className={`offline-pill ${online ? "" : "is-off"}`}>
            {online ? "Online" : "Offline"}
          </span>
          {user ? (
            <>
              <span className="user-chip">{firstName(user)} · {user.role}</span>
              <NavLink to="/library">Library</NavLink>
              <NavLink to="/offline">Offline</NavLink>
              <NavLink to="/sync">Sync</NavLink>
              {user.role !== "admin" && <NavLink to="/feedback">Feedback</NavLink>}
              {user.role === "teacher" && <NavLink to="/upload">Upload</NavLink>}
              {user.role === "admin" && <NavLink to="/admin">Admin</NavLink>}
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
      {welcome && (
        <div className="banner">
          <strong>{welcome}</strong>
          <button className="btn ghost" type="button" onClick={onDismissWelcome}>Dismiss</button>
        </div>
      )}
      {children}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(readUser);
  const [welcome, setWelcome] = useState("");
  const [showSplash, setShowSplash] = useState(() => !sessionStorage.getItem("lv_splash"));
  const navigate = useNavigate();

  useEffect(() => {
    if (!showSplash) return;
    const timer = setTimeout(() => {
      sessionStorage.setItem("lv_splash", "1");
      setShowSplash(false);
    }, 2200);
    return () => clearTimeout(timer);
  }, [showSplash]);

  function handleAuth(data) {
    const first = firstName(data.user);
    const seenKey = `lv_seen_${data.user.email}`;
    const returning = Boolean(localStorage.getItem(seenKey));
    localStorage.setItem(seenKey, "1");
    const text = returning
      ? `Welcome back, ${first}. Good to see you again.`
      : `Welcome to LearnVult, ${first}.`;
    setWelcome(text);
    localStorage.setItem("lv_token", data.access_token);
    localStorage.setItem("lv_user", JSON.stringify(data.user));
    setUser(data.user);
    navigate(data.user.role === "admin" ? "/admin" : "/library");
  }

  function logout() {
    localStorage.removeItem("lv_token");
    localStorage.removeItem("lv_user");
    setWelcome("");
    setUser(null);
    navigate("/login");
  }

  if (showSplash) return <Splash />;

  return (
    <Layout user={user} welcome={welcome} onDismissWelcome={() => setWelcome("")} onLogout={logout}>
      <Routes>
        <Route path="/" element={<Navigate to={user ? (user.role === "admin" ? "/admin" : "/library") : "/login"} />} />
        <Route path="/login" element={<Login onAuth={handleAuth} />} />
        <Route path="/register" element={<Register onAuth={handleAuth} />} />
        <Route path="/forgot" element={<ForgotPassword />} />
        <Route path="/reset" element={<ResetPassword />} />
        <Route path="/library" element={user ? <Library user={user} /> : <Navigate to="/login" />} />
        <Route path="/read/:id" element={user ? <Reader /> : <Navigate to="/login" />} />
        <Route path="/upload" element={user && user.role === "teacher" ? <Upload /> : <Navigate to="/library" />} />
        <Route path="/offline" element={<Offline />} />
        <Route path="/sync" element={user ? <SyncStatus /> : <Navigate to="/login" />} />
        <Route path="/feedback" element={user && user.role !== "admin" ? <Feedback user={user} /> : <Navigate to={user ? "/admin" : "/login"} />} />
        <Route path="/admin" element={user && user.role === "admin" ? <Admin /> : <Navigate to="/login" />} />
      </Routes>
    </Layout>
  );
}
