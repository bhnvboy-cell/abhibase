// Order Tracking Page
// Track your order

import { OrderDetail } from '@/components/OrderDetail'
import { DeliveryTracker } from '@/components/DeliveryTracker'

export default function OrderTrackingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <OrderDetail />
        <DeliveryTracker />
      </div>
    </div>
  )
}
