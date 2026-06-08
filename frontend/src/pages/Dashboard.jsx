import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api.js'

export default function Dashboard() {
  const navigate = useNavigate()
  const [links, setLinks] = useState([])
  const [stats, setStats] = useState(null)
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('token')) { navigate('/login'); return }
    loadData()
  }, [])

  async function loadData() {
    try {
      const [l, s] = await Promise.all([api.myLinks(), api.myStats()])
      setLinks(l)
      setStats(s)
    } catch {
      navigate('/login')
    }
  }

  async function handleShorten(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.shorten(url)
      setUrl('')
      await loadData()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ maxWidth: 700, margin: '40px auto', padding: '0 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700 }}>Dashboard</h1>
        {stats && (
          <div className="card" style={{ padding: '10px 20px', display: 'flex', gap: 24 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#60a5fa' }}>{stats.totalLinks}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Total links</div>
            </div>
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <form onSubmit={handleShorten} style={{ display: 'flex', gap: 10 }}>
          <input
            type="url"
            placeholder="https://example.com/long-url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            required
          />
          <button className="btn-primary" type="submit" disabled={loading} style={{ whiteSpace: 'nowrap' }}>
            {loading ? '...' : 'Shorten'}
          </button>
        </form>
        {error && <p className="error">{error}</p>}
      </div>

      <div className="card">
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Your links</h2>
        {links.length === 0 ? (
          <p style={{ color: '#64748b' }}>No links yet. Create your first one above.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {links.map(link => (
              <div key={link.code} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', background: '#0f172a', borderRadius: 8
              }}>
                <div>
                  <a href={`/r/${link.code}`} target="_blank" rel="noreferrer"
                    style={{ fontWeight: 600, fontSize: 14 }}>
                    /r/{link.code}
                  </a>
                  <p style={{ fontSize: 12, color: '#64748b', marginTop: 2, maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {link.originalUrl}
                  </p>
                </div>
                <button
                  className="btn-ghost"
                  style={{ padding: '4px 12px', fontSize: 12 }}
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}/r/${link.code}`)}
                >
                  Copy
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
