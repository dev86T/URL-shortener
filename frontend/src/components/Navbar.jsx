import { Link, useNavigate } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  function logout() {
    localStorage.removeItem('token')
    navigate('/')
  }

  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 32px', background: '#1e293b', borderBottom: '1px solid #334155'
    }}>
      <Link to="/" style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', textDecoration: 'none' }}>
        ✂ Shortener
      </Link>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {token ? (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <button className="btn-ghost" style={{ padding: '6px 14px' }} onClick={logout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">
              <button className="btn-primary" style={{ padding: '6px 14px' }}>Sign up</button>
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
