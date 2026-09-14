'use client';

import { AppTemplatesGallery } from '@/components/app-templates-gallery';

export default function TemplatesGalleryPage() {
  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-6xl mx-auto">
        <AppTemplatesGallery />
      </div>
    </div>
  );
}
