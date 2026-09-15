'use client'

import { useState, useEffect } from 'react'

interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string
  quantity: number
  price: number
}

export function CartSummary() {
  const [data, setData] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/orderitems')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <h2 className="text-xl font-bold mb-4">CartSummary</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {data.slice(0, 4).map(item => (
          <div key={item.id} className="bg-zinc-800 rounded-lg p-4">
            <p className="text-2xl font-bold text-violet-400">{item.quantity}}</p>
            <p className="text-xs text-zinc-500 mt-1">quantity</p>
          </div>
        ))}
      </div>
    </div>
  )
}
