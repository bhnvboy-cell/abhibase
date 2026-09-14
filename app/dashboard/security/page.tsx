'use client';

import { SecuritySettings } from '@/components/security-settings';

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-4xl mx-auto">
        <SecuritySettings />
      </div>
    </div>
  );
}
