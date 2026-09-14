'use client';

import { WebsiteGenerator } from '@/components/website-generator';

export default function WebsiteBuilderPage() {
  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-6xl mx-auto">
        <WebsiteGenerator />
      </div>
    </div>
  );
}
