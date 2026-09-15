'use client'

import { useState, useEffect } from 'react'

interface MenuItem {
  id: string
  name: string
  description?: string
  price: number
  category?: string
  image_url?: string
  restaurant_id: string
}

export function MenuItemList() {
  const [data, setData] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/menu-items')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="animate-pulse text-zinc-500">Loading...</div>

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold">MenuItemList</h2>
      {data.length === 0 ? (
        <p className="text-zinc-500">No items yet.</p>
      ) : (
        data.map(item => (
          <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
            <h3 className="font-medium">{item.name}</h3>
            <p className="text-sm text-zinc-400 mt-1">{item.description}</p>
            <p className="text-sm text-zinc-400 mt-1">{item.price}</p>
          </div>
        ))
      )}
    </div>
  )
}
