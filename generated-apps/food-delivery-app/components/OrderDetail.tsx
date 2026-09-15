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

export function OrderDetail() {
  const [data, setData] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/orders')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <h2 className="text-xl font-bold">OrderDetail</h2>
      <p className="text-zinc-400 mt-2">Order tracking and details</p>
    </div>
  )
}
