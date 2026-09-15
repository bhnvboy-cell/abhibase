'use client'

import { useState, useEffect } from 'react'

interface Order {
  id: string
  status: string
  total: number
  delivery_address: string
  user_id: string
  restaurant_id: string
}

export function OrderList() {
  const [data, setData] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/orders')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="animate-pulse text-zinc-500">Loading...</div>

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold">OrderList</h2>
      {data.length === 0 ? (
        <p className="text-zinc-500">No items yet.</p>
      ) : (
        data.map(item => (
          <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
            <h3 className="font-medium">{item.status}}</h3>
            <p className="text-sm text-zinc-400 mt-1">{item.total}</p>
            <p className="text-sm text-zinc-400 mt-1">{item.delivery_address}</p>
          </div>
        ))
      )}
    </div>
  )
}
