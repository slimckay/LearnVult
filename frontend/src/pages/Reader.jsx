import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { downloadResource } from "../api.js";
import { getOfflineResource, getProgress, openBlob, saveOfflineResource, saveProgress } from "../offline/db.js";

function isPdf(item) {
  const name = `${item?.filename || ""} ${item?.mime_type || ""}`.toLowerCase();
  return name.includes("pdf");
}

function isImage(item) {
  const name = `${item?.filename || ""} ${item?.mime_type || ""}`.toLowerCase();
  return /png|jpe?g|gif|webp|image\//.test(name);
}

export default function Reader() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        let row = await getOfflineResource(id);
        if (!row) {
          const { blob } = await downloadResource(id);
          row = { id: Number(id), title: `Resource ${id}`, filename: "file", blob };
          await saveOfflineResource(row, blob);
        }
        const progress = await getProgress(id);
        if (!alive) return;
        setItem(row);
        setPage(progress.page || 1);
      } catch (err) {
        if (alive) setError(err.message || "Could not open this file.");
      }
    })();
    return () => { alive = false; };
  }, [id]);

  const url = useMemo(() => (item?.blob ? URL.createObjectURL(item.blob) : ""), [item]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

  async function go(next) {
    const safe = Math.max(1, next);
    setPage(safe);
    await saveProgress(id, safe);
  }

  if (error) {
    return (
      <div className="card">
        <div className="banner error">{error}</div>
        <button className="btn secondary" onClick={() => navigate(-1)}>Back</button>
      </div>
    );
  }
  if (!item) return <div className="card">Opening file…</div>;

  return (
    <div className="card reader-card">
      <div className="reader-bar">
        <div>
          <Link to="/library">Library</Link>
          <h1>{item.title}</h1>
          <p className="meta">{item.filename}{page > 1 ? ` · last page ${page}` : ""}</p>
        </div>
        <div className="row">
          {isPdf(item) && (
            <>
              <button className="btn secondary" onClick={() => go(page - 1)}>Previous</button>
              <span className="meta">Page {page}</span>
              <button className="btn secondary" onClick={() => go(page + 1)}>Next</button>
            </>
          )}
          <button className="btn" onClick={() => openBlob(item.blob, item.filename)}>Download file</button>
        </div>
      </div>
      {isPdf(item) && url && (
        <iframe className="reader-frame" title={item.title} src={`${url}#page=${page}`} />
      )}
      {isImage(item) && url && <img className="reader-image" src={url} alt={item.title} />}
      {!isPdf(item) && !isImage(item) && (
        <p className="meta">This file type opens better outside the app. Use Download file to save it to the phone.</p>
      )}
    </div>
  );
}
