import { useEffect, useState } from "react";
import { listOfflineResources, openBlob } from "../offline/db.js";

export default function Offline() {
  const [items, setItems] = useState([]);
  useEffect(() => { listOfflineResources().then(setItems); }, []);
  return (
    <div className="card">
      <h1>Offline resources</h1>
      <p className="meta">These files live on this device. You can open them even when there is no internet.</p>
      {!items.length && <p>Nothing saved yet. Open the library while online and click Save offline.</p>}
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
