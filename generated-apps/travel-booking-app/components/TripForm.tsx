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

export function TripForm() {
  const [data, setData] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/trips')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  const [form, setForm] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch('/api/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    window.location.reload()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
      <h2 className="text-xl font-bold">Create Trip</h2>
      <div>
        <label className="block text-sm text-zinc-400 mb-1">destination_id</label>
        <input
          value={form.destination_id || ''}
          onChange={e => setForm({ ...form, destination_id: e.target.value })}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-violet-500"
        />
      </div>
      <div>
        <label className="block text-sm text-zinc-400 mb-1">start_date</label>
        <input
          value={form.start_date || ''}
          onChange={e => setForm({ ...form, start_date: e.target.value })}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-violet-500"
        />
      </div>
      <div>
        <label className="block text-sm text-zinc-400 mb-1">end_date</label>
        <input
          value={form.end_date || ''}
          onChange={e => setForm({ ...form, end_date: e.target.value })}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-violet-500"
        />
      </div>
      <div>
        <label className="block text-sm text-zinc-400 mb-1">budget</label>
        <input
          value={form.budget || ''}
          onChange={e => setForm({ ...form, budget: e.target.value })}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-violet-500"
        />
      </div>
      <button type="submit" className="bg-violet-600 hover:bg-violet-700 px-6 py-2 rounded-lg font-medium">Save</button>
    </form>
  )
}
