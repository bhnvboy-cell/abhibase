'use client'

import { useState, useEffect } from 'react'

interface Destination {
  id: string
  name: string
  country: string
  description?: string
  image_url?: string
  price_from?: number
}

export function DestinationList() {
  const [data, setData] = useState<Destination[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/destinations')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="animate-pulse text-zinc-500">Loading...</div>

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold">DestinationList</h2>
      {data.length === 0 ? (
        <p className="text-zinc-500">No items yet.</p>
      ) : (
        data.map(item => (
          <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
            <h3 className="font-medium">{item.name}</h3>
            <p className="text-sm text-zinc-400 mt-1">{item.country}</p>
            <p className="text-sm text-zinc-400 mt-1">{item.description}</p>
          </div>
        ))
      )}
    </div>
  )
}
