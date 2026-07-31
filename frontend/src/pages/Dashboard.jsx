import { useNavigate } from 'react-router-dom'
import AuthService from '../services/AuthService'

export default function Dashboard() {
  const navigate = useNavigate()
  const user = AuthService.getCurrentUser()

  const handleLogout = () => {
    AuthService.logout()
    navigate('/login')
  }
  
  const handleProfile = () => {
    navigate('/profile')
  }

  // Fallback if user details are missing
  const username = user?.username || 'User'
  const email = user?.email || 'N/A'
  const role = user?.role || 'USER'
  const token = user?.token || ''

  return (
    <div className="dashboard-bg">
      {/* Navbar */}
      <nav className="dashboard-navbar">
        <div className="navbar-brand">
          <span>ShopNova</span>
        </div>
        <div className="navbar-right">
          <div className="navbar-username">
            Welcome, <button className="btn-logout" onClick={handleProfile}>
            {username}
          </button>
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="dashboard-content">
        <div className="dashboard-welcome">
          <h1>Welcome back, {username}!</h1>
          <p>You have successfully logged in using React, Spring Boot, and JWT Authentication.</p>
        </div>

        <div className="dashboard-grid">
          {/* User Profile Info Card */}
          <div className="info-card">
            <div className="card-icon icon-purple">👤</div>
            <div className="card-label">Profile Details</div>
            <div className="card-value" style={{ marginBottom: '0.5rem', fontSize: '1.2rem' }}>
              {username}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Username assigned to your account
            </div>
          </div>

          {/* Email Info Card */}
          <div className="info-card">
            <div className="card-icon icon-blue">✉️</div>
            <div className="card-label">Email Address</div>
            <div className="card-value" style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>
              {email}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Primary contact email address
            </div>
          </div>

          {/* Role / Access Level Card */}
          <div className="info-card">
            <div className="card-icon icon-green">🛡️</div>
            <div className="card-label">Access Level</div>
            <div style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="badge badge-purple">{role}</span>
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Security role assigned on backend
            </div>
          </div>

          {/* Token Info Card */}
          <div className="info-card" style={{ gridColumn: 'span 1' }}>
            <div className="card-icon icon-orange">🔑</div>
            <div className="card-label">JWT Authentication</div>
            <div style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="badge badge-green">ACTIVE</span>
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', wordBreak: 'break-all' }}>
              Token prefix: <code style={{ color: 'var(--accent-secondary)' }}>{token ? `${token.substring(0, 15)}...` : 'N/A'}</code>
            </div>
          </div>
        </div>

        {/* Extra Dashboard details */}
        <div style={{
          marginTop: '3rem',
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          borderRadius: '20px',
          padding: '2rem',
          backdropFilter: 'blur(12px)'
        }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>System Info</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
            This application uses a PostgreSQL database backend. Spring Security blocks unauthorized requests to API endpoints, 
            requiring a valid JWT signature. When you sign in, the JWT token is saved in your browser&apos;s local storage 
            and attached to every REST API call in the authorization header.
          </p>
        </div>
      </main>
    </div>
  )
}
