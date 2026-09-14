'use client';

import { GeneratorHub } from '@/components/generator-hub';

export default function GeneratorsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-6xl mx-auto">
        <GeneratorHub />
      </div>
    </div>
  );
}
