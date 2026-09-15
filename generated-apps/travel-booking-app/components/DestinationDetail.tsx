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

export function DestinationDetail() {
  const [data, setData] = useState<Destination[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/destinations')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <h2 className="text-xl font-bold">DestinationDetail</h2>
      <p className="text-zinc-400 mt-2">Destination details</p>
    </div>
  )
}
