'use client'

import { useState, useEffect } from 'react'

interface Delivery {
  id: string
  order_id: string
  driver_name?: string
  status: string
  estimated_arrival?: string
}

export function DeliveryTracker() {
  const [data, setData] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/deliverys')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <h2 className="text-xl font-bold mb-4">DeliveryTracker</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {data.slice(0, 4).map(item => (
          <div key={item.id} className="bg-zinc-800 rounded-lg p-4">
            <p className="text-2xl font-bold text-violet-400">{item.status}}</p>
            <p className="text-xs text-zinc-500 mt-1">status</p>
          </div>
        ))}
      </div>
    </div>
  )
}
