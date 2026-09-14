'use client';

import { MeetingNotes } from '@/components/meeting-notes';

export default function MeetingsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-6xl mx-auto">
        <MeetingNotes />
      </div>
    </div>
  );
}
