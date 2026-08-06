import React, { useRef, useState } from "react";
import { Camera, X, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function JobSitePhotos({ photos, setPhotos }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (files) => {
    if (!files || !files.length) return;
    setUploading(true);
    try {
      const urls = [];
      for (const file of Array.from(files)) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        if (file_url) urls.push(file_url);
      }
      setPhotos([...photos, ...urls]);
    } catch (e) {
      // ignore
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const remove = (i) => setPhotos(photos.filter((_, idx) => idx !== i));

  return (
    <div className="hx-bid-photos">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={(e) => upload(e.target.files)}
        className="hidden"
      />
      <button
        className="hx-bid-photo-add"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? <Loader2 size={18} className="spin" /> : <Camera size={18} />}
        <span>{uploading ? "Uploading..." : "Add job site photo"}</span>
      </button>
      {photos.length > 0 && (
        <div className="hx-bid-photo-grid">
          {photos.map((url, i) => (
            <div key={i} className="hx-bid-photo-tile">
              <img src={url} alt={`Job site ${i + 1}`} />
              <button className="hx-bid-photo-remove" onClick={() => remove(i)}>
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}