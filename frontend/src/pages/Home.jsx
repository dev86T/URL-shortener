import { useState } from 'react'
import { api } from '../api.js'

export default function Home() {
  const [url, setUrl] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleShorten(e) {
    e.preventDefault()
    setError('')
    setResult(null)
    setLoading(true)
    try {
      const data = await api.shorten(url)
      setResult(data)
      setUrl('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const shortUrl = result ? `${window.location.origin}/r/${result.code}` : null

  return (
    <main style={{ maxWidth: 600, margin: '80px auto', padding: '0 16px' }}>
      <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 8 }}>Shorten your URL</h1>
      <p style={{ color: '#94a3b8', marginBottom: 32 }}>
        Paste a long URL and get a short link instantly. No account needed.
      </p>

      <div className="card">
        <form onSubmit={handleShorten} style={{ display: 'flex', gap: 10 }}>
          <input
            type="url"
            placeholder="https://example.com/very/long/url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            required
          />
          <button className="btn-primary" type="submit" disabled={loading} style={{ whiteSpace: 'nowrap' }}>
            {loading ? '...' : 'Shorten'}
          </button>
        </form>
        {error && <p className="error">{error}</p>}

        {result && (
          <div style={{ marginTop: 20, padding: 16, background: '#0f172a', borderRadius: 8 }}>
            <p style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>Your short link:</p>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <a href={shortUrl} target="_blank" rel="noreferrer" style={{ fontSize: 18, fontWeight: 600 }}>
                {shortUrl}
              </a>
              <button
                className="btn-ghost"
                style={{ padding: '4px 12px', fontSize: 12 }}
                onClick={() => navigator.clipboard.writeText(shortUrl)}
              >
                Copy
              </button>
            </div>
          </div>
        )}
      </div>

      <p style={{ marginTop: 16, color: '#64748b', fontSize: 13 }}>
        Sign up to track your links in the dashboard.
      </p>
    </main>
  )
}
