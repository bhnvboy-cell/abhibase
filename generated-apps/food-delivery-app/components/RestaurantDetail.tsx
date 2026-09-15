'use client'

import { useState, useEffect } from 'react'

interface Restaurant {
  id: string
  name: string
  cuisine?: string
  rating?: number
  delivery_time?: string
  image_url?: string
  address: string
}

export function RestaurantDetail() {
  const [data, setData] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/restaurants')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <h2 className="text-xl font-bold">RestaurantDetail</h2>
      <p className="text-zinc-400 mt-2">Restaurant info and menu</p>
    </div>
  )
}
