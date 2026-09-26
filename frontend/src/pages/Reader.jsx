import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { downloadResource } from "../api.js";
import { getOfflineResource, getProgress, openBlob, saveOfflineResource, saveProgress } from "../offline/db.js";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

function looksLikePdf(item, blob) {
  const name = `${item?.filename || ""} ${item?.mime_type || ""} ${blob?.type || ""}`.toLowerCase();
  return name.includes("pdf");
}

function looksLikeImage(item, blob) {
  const name = `${item?.filename || ""} ${item?.mime_type || ""} ${blob?.type || ""}`.toLowerCase();
  return /png|jpe?g|gif|webp|image\//.test(name);
}

export default function Reader() {
  const { id } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const pdfRef = useRef(null);
  const [item, setItem] = useState(null);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Opening file…");
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        let row = await getOfflineResource(id);
        if (!row?.blob) {
          const { blob } = await downloadResource(id);
          row = { ...(row || {}), id: Number(id), title: row?.title || `Resource ${id}`, filename: row?.filename || "file", blob };
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

  useEffect(() => {
    if (!item?.blob) return undefined;
    let cancelled = false;
    const blob = item.blob;

    async function drawPdf(targetPage) {
      setStatus("Loading pages…");
      if (!pdfRef.current) {
        const data = await blob.arrayBuffer();
        pdfRef.current = await pdfjsLib.getDocument({ data }).promise;
      }
      const pdf = pdfRef.current;
      if (cancelled) return;
      const total = pdf.numPages;
      const safe = Math.min(Math.max(1, targetPage), total);
      setPageCount(total);
      if (safe !== targetPage) setPage(safe);
      const pdfPage = await pdf.getPage(safe);
      const canvas = canvasRef.current;
      const wrap = wrapRef.current;
      if (!canvas || !wrap) return;
      const width = Math.max(280, wrap.clientWidth);
      const unscaled = pdfPage.getViewport({ scale: 1 });
      const scale = (width / unscaled.width) * (window.devicePixelRatio || 1);
      const viewport = pdfPage.getViewport({ scale });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${Math.round(unscaled.height * (width / unscaled.width))}px`;
      await pdfPage.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
      setStatus("");
      await saveProgress(id, safe);
    }

    (async () => {
      try {
        if (looksLikePdf(item, blob)) {
          await drawPdf(page);
          return;
        }
        if (looksLikeImage(item, blob)) {
          const url = URL.createObjectURL(blob);
          if (!cancelled) setImageUrl(url);
          return;
        }
        setStatus("This file type is better downloaded to the phone.");
      } catch (err) {
        if (!cancelled) setError("This phone could not draw the pages. Download the file instead.");
        console.error(err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [item, page, id]);

  useEffect(() => () => { if (imageUrl) URL.revokeObjectURL(imageUrl); }, [imageUrl]);

  async function go(next) {
    const safe = Math.min(Math.max(1, next), pageCount || 1);
    setPage(safe);
    await saveProgress(id, safe);
  }

  if (error) {
    return (
      <div className="card">
        <div className="banner error">{error}</div>
        {item?.blob && <button className="btn" onClick={() => openBlob(item.blob, item.filename)}>Download file</button>}
        <button className="btn secondary" onClick={() => navigate(-1)}>Back</button>
      </div>
    );
  }
  if (!item) return <div className="card">Opening file…</div>;

  const pdf = looksLikePdf(item, item.blob);
  const image = looksLikeImage(item, item.blob);

  return (
    <div className="card reader-card">
      <div className="reader-bar">
        <div>
          <Link to="/library">Library</Link>
          <h1>{item.title}</h1>
          <p className="meta">
            {item.filename}
            {pdf ? ` · page ${page} of ${pageCount}` : ""}
          </p>
        </div>
        <div className="row">
          {pdf && (
            <>
              <button className="btn secondary" disabled={page <= 1} onClick={() => go(page - 1)}>Previous</button>
              <button className="btn secondary" disabled={page >= pageCount} onClick={() => go(page + 1)}>Next</button>
            </>
          )}
          <button className="btn" onClick={() => openBlob(item.blob, item.filename)}>Download file</button>
        </div>
      </div>
      {status && <p className="meta">{status}</p>}
      {pdf && (
        <div className="reader-wrap" ref={wrapRef}>
          <canvas ref={canvasRef} className="reader-canvas" />
        </div>
      )}
      {image && imageUrl && <img className="reader-image" src={imageUrl} alt={item.title} />}
      {!pdf && !image && (
        <p className="meta">This file type opens better outside the app. Use Download file.</p>
      )}
    </div>
  );
}
