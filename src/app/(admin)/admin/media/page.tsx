"use client";

import { MediaUploader } from "@/components/admin/MediaUploader";

import { AdminPageFrame } from "@/components/admin/AdminPageFrame";

export default function AdminMediaPage() {
  return (
    <AdminPageFrame title="Медиа" currentPath="/admin/media">
      <div className="grid max-w-xl gap-6">
        <p className="font-sans text-secondary">
          JPEG/PNG/WebP до 12 МБ, MP4 до 100 МБ. Загрузка идёт напрямую в
          Timeweb S3 по presigned URL.
        </p>
        <MediaUploader />
      </div>
    </AdminPageFrame>
  );
}
