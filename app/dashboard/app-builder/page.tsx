'use client';

import { AppBuilder } from '@/components/app-builder';

export default function AppBuilderPage() {
  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-6xl mx-auto">
        <AppBuilder />
      </div>
    </div>
  );
}
