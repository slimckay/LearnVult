import { useEffect, useState } from "react";
import { downloadResource, listResources } from "../api.js";
import { CLASS_LEVELS, EXAM_YEARS, RESOURCE_TYPES, SUBJECTS, typeLabel } from "../catalog.js";
import { saveOfflineResource } from "../offline/db.js";

const emptyFilters = {
  q: "",
  resource_type: "",
  subject: "",
  class_level: "",
  year_from: "",
  year_to: "",
  mine: false,
};

export default function Library({ user }) {
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load(next = filters) {
    try {
      setError("");
      const params = {
        q: next.q,
        resource_type: next.resource_type,
        subject: next.subject,
        class_level: next.class_level,
        year_from: next.year_from,
        year_to: next.year_to,
      };
      if (next.mine) params.mine = "true";
      setItems(await listResources(params));
    } catch (err) {
      setError(`${err.message}. If you are offline, open the Offline shelf.`);
    }
  }

  function update(field, value) {
    const next = { ...filters, [field]: value };
    setFilters(next);
    if (field !== "q") load(next);
  }

  useEffect(() => { load(); }, []);

  async function keepOffline(item) {
    try {
      const { blob } = await downloadResource(item.id);
      await saveOfflineResource(item, blob);
      setMessage(`Saved "${item.title}" on this device.`);
    } catch (err) {
      setError(err.message);
    }
  }

  function apply(event) {
    event.preventDefault();
    load(filters);
  }

  function clearFilters() {
    setFilters(emptyFilters);
    load(emptyFilters);
  }

  return (
    <>
      <section className="hero">
        <div className="hero-card">
          <span className="kicker">{user.school_name || "LearnVult school"}</span>
          <h1>Resource library</h1>
          <p className="meta">
            Welcome, {user.full_name}. Students and teachers can search and filter notes or past papers by subject, class and year.
          </p>
        </div>
        <div className="stat">
          <span>Materials matching filters</span>
          <strong>{items.length}</strong>
        </div>
      </section>

      <div className="card">
        {error && <div className="banner error">{error}</div>}
        {message && <div className="banner">{message}</div>}
        <form onSubmit={apply}>
          <label>Search</label>
          <input
            placeholder="Title, subject, class or description"
            value={filters.q}
            onChange={(e) => update("q", e.target.value)}
          />
          <div className="filter-grid">
            <div>
              <label>Type</label>
              <select value={filters.resource_type} onChange={(e) => update("resource_type", e.target.value)}>
                <option value="">All types</option>
                {RESOURCE_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </div>
            <div>
              <label>Subject</label>
              <select value={filters.subject} onChange={(e) => update("subject", e.target.value)}>
                <option value="">All subjects</option>
                {SUBJECTS.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
            <div>
              <label>Class</label>
              <select value={filters.class_level} onChange={(e) => update("class_level", e.target.value)}>
                <option value="">All classes</option>
                {CLASS_LEVELS.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
            <div>
              <label>Year from</label>
              <select value={filters.year_from} onChange={(e) => update("year_from", e.target.value)}>
                <option value="">Any</option>
                {EXAM_YEARS.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
            </div>
            <div>
              <label>Year to</label>
              <select value={filters.year_to} onChange={(e) => update("year_to", e.target.value)}>
                <option value="">Any</option>
                {EXAM_YEARS.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
            </div>
          </div>
          {(user.role === "teacher" || user.role === "admin") && (
            <label className="check-line">
              <input type="checkbox" checked={filters.mine} onChange={(e) => update("mine", e.target.checked)} />
              Only my uploads
            </label>
          )}
          <div className="row">
            <button className="btn" type="submit">Apply filters</button>
            <button className="btn secondary" type="button" onClick={clearFilters}>Clear</button>
          </div>
        </form>

        {!items.length && (
          <p className="meta">No materials match these filters. Ask a teacher to upload the file, or clear the filters.</p>
        )}
        {items.map((item) => (
          <article className="resource" key={item.id}>
            <div>
              <strong>{item.title}</strong>
              <div className="meta">
                <span className="tag">{item.subject}</span>
                <span className="tag">{item.class_level}</span>
                <span className="tag">{typeLabel(item.resource_type)}</span>
                {item.academic_year && <span className="tag">{item.academic_year}</span>}
              </div>
            </div>
            <button className="btn secondary" onClick={() => keepOffline(item)}>Save offline</button>
          </article>
        ))}
      </div>
    </>
  );
}
