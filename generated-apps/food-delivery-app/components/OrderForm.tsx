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

export function OrderForm() {
  const [data, setData] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/orders')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  const [form, setForm] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    window.location.reload()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
      <h2 className="text-xl font-bold">Create Order</h2>
      <div>
        <label className="block text-sm text-zinc-400 mb-1">delivery_address</label>
        <input
          value={form.delivery_address || ''}
          onChange={e => setForm({ ...form, delivery_address: e.target.value })}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-violet-500"
        />
      </div>
      <div>
        <label className="block text-sm text-zinc-400 mb-1">restaurant_id</label>
        <input
          value={form.restaurant_id || ''}
          onChange={e => setForm({ ...form, restaurant_id: e.target.value })}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-violet-500"
        />
      </div>
      <button type="submit" className="bg-violet-600 hover:bg-violet-700 px-6 py-2 rounded-lg font-medium">Save</button>
    </form>
  )
}
