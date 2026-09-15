'use client'

import { useParams } from 'next/navigation'

export default function GeneratedAppPage() {
  const params = useParams()
  const slug = params.slug as string

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <iframe
        src={`/api/serve-app/${slug}`}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
        }}
        title={`${slug} app`}
      />
    </div>
  )
}
