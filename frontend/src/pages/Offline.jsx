import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProgress, listOfflineResources, openBlob } from "../offline/db.js";

export default function Offline() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [pages, setPages] = useState({});

  useEffect(() => {
    listOfflineResources().then(async (rows) => {
      setItems(rows);
      const map = {};
      for (const row of rows) {
        const progress = await getProgress(row.id);
        map[row.id] = progress.page || 1;
      }
      setPages(map);
    });
  }, []);

  return (
    <div className="card">
      <span className="kicker">On this device</span>
      <h1>Offline shelf</h1>
      <p className="meta page-intro">
        Read in the app from the last page, or download the file to the phone.
      </p>
      {!items.length && (
        <p className="meta">Nothing saved yet. Open the library while online and tap Save offline or Read.</p>
      )}
      {items.map((item) => (
        <article className="resource" key={item.id}>
          <div>
            <strong>{item.title}</strong>
            <div className="meta">
              {item.subject} · saved {new Date(item.savedAt).toLocaleString()}
              {pages[item.id] > 1 ? ` · stopped on page ${pages[item.id]}` : ""}
            </div>
          </div>
          <div className="row">
            <button className="btn" onClick={() => navigate(`/read/${item.id}`)}>Read</button>
            <button className="btn secondary" onClick={() => openBlob(item.blob, item.filename)}>Download</button>
          </div>
        </article>
      ))}
    </div>
  );
}
