import { useEffect, useState } from "react";
import { listOfflineResources, openBlob } from "../offline/db.js";

export default function Offline() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    listOfflineResources().then(setItems);
  }, []);

  return (
    <div className="card">
      <span className="kicker">On this device</span>
      <h1>Offline shelf</h1>
      <p className="meta page-intro">
        These files stay on this phone or laptop. Open them even when there is no data.
      </p>
      {!items.length && (
        <p className="meta">Nothing saved yet. Open the library while online and tap Save offline.</p>
      )}
      {items.map((item) => (
        <article className="resource" key={item.id}>
          <div>
            <strong>{item.title}</strong>
            <div className="meta">{item.subject} · saved {new Date(item.savedAt).toLocaleString()}</div>
          </div>
          <button className="btn secondary" onClick={() => openBlob(item.blob, item.filename)}>Open</button>
        </article>
      ))}
    </div>
  );
}
