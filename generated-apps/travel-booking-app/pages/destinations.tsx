// Destinations Page
// Browse destinations

import { DestinationList } from '@/components/DestinationList'

export default function DestinationsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <DestinationList />
      </div>
    </div>
  )
}
