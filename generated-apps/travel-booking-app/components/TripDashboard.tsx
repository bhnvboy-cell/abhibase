'use client'

import { useState, useEffect } from 'react'

interface Trip {
  id: string
  destination_id: string
  start_date: string
  end_date: string
  budget?: number
  status: string
}

export function TripDashboard() {
  const [data, setData] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/trips')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <h2 className="text-xl font-bold mb-4">TripDashboard</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {data.slice(0, 4).map(item => (
          <div key={item.id} className="bg-zinc-800 rounded-lg p-4">
            <p className="text-2xl font-bold text-violet-400">{item.budget}</p>
            <p className="text-xs text-zinc-500 mt-1">budget</p>
          </div>
        ))}
      </div>
    </div>
  )
}
