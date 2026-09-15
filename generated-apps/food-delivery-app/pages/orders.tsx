// Orders Page
// View order history

import { OrderList } from '@/components/OrderList'

export default function OrdersPage() {
  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <OrderList />
      </div>
    </div>
  )
}
