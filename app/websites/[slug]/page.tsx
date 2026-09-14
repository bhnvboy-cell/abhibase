'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function WebsitePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchWebsite();
  }, [slug]);

  const fetchWebsite = async () => {
    try {
      const response = await fetch(`/api/websites/${slug}`);
      if (!response.ok) {
        throw new Error('Website not found');
      }
      const text = await response.text();
      setHtml(text);
    } catch (err) {
      setError('Website not found');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-zinc-400">Loading website...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-6xl mb-4">🔍</p>
          <h1 className="text-2xl font-bold mb-2">Website Not Found</h1>
          <p className="text-zinc-400">This website doesn't exist or hasn't been published yet.</p>
          <a href="/dashboard/website-builder" className="mt-4 inline-block bg-violet-600 hover:bg-violet-700 px-6 py-2 rounded-lg">
            Create Your Own
          </a>
        </div>
      </div>
    );
  }

  return (
    <iframe
      srcDoc={html}
      className="w-full h-screen border-0"
      title="Website"
    />
  );
}
