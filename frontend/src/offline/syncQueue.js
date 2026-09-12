import { uploadResource } from "../api.js";
import { listQueuedUploads, removeQueuedUpload } from "./db.js";

export function isNetworkError(error) {
  const message = String(error?.message || error || "").toLowerCase();
  return (
    !navigator.onLine ||
    message.includes("failed to fetch") ||
    message.includes("network") ||
    message.includes("econnrefused")
  );
}

export async function flushUploadQueue() {
  if (!navigator.onLine) {
    return { flushed: 0, failed: 0, skipped: true };
  }

  const queued = await listQueuedUploads();
  let flushed = 0;
  let failed = 0;

  for (const item of queued) {
    const form = new FormData();
    form.append("title", item.title);
    form.append("subject", item.subject);
    form.append("class_level", item.class_level);
    form.append("resource_type", item.resource_type || "notes");
    if (item.academic_year) form.append("academic_year", item.academic_year);
    if (item.description) form.append("description", item.description);
    form.append("file", new File([item.fileBlob], item.filename || "resource.bin"));

    try {
      await uploadResource(form);
      await removeQueuedUpload(item.id);
      flushed += 1;
    } catch (error) {
      if (isNetworkError(error)) break;
      failed += 1;
    }
  }

  return { flushed, failed, skipped: false };
}
