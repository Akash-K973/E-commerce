import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthService from '../services/AuthService'
import CustomerService from '../services/CustomerService'

export default function Navbar({ cartCount = 0, onOpenCart, activeTab, setActiveTab }) {
  const navigate = useNavigate()
  const user = AuthService.getCurrentUser()
  const role = user?.role || 'CUSTOMER'
  const username = user?.username || 'Guest'

  const handleLogout = () => {
    AuthService.logout()
    navigate('/login')
  }

  const getRoleBadgeClass = () => {
    switch (role) {
      case 'ADMIN': return 'badge badge-red'
      case 'VENDOR': return 'badge badge-gold'
      default: return 'badge badge-purple'
    }
  }

  return (
    <nav className="dashboard-navbar" style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--border)' }}>
      <div className="navbar-brand" style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
        <span style={{ color: 'var(--gold)', fontWeight: '800', fontSize: '1.4rem', letterSpacing: '0.05em' }}>
          OBSIDIAN <span style={{ color: 'var(--text-primary)', fontWeight: '300' }}>LUXURY</span>
        </span>
      </div>

      {/* Nav Tabs */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button
          className={`btn-nav ${activeTab === 'store' ? 'active' : ''}`}
          onClick={() => { setActiveTab('store'); navigate('/dashboard'); }}
          style={activeTab === 'store' ? activeNavStyle : navStyle}
        >
          🛍️ Storefront
        </button>

        {(role === 'CUSTOMER' || role === 'USER' || role === 'ADMIN') && (
          <button
            className={`btn-nav ${activeTab === 'customer' ? 'active' : ''}`}
            onClick={() => { setActiveTab('customer'); navigate('/dashboard'); }}
            style={activeTab === 'customer' ? activeNavStyle : navStyle}
          >
            📦 My Orders
          </button>
        )}

        {(role === 'VENDOR' || role === 'ADMIN') && (
          <button
            className={`btn-nav ${activeTab === 'vendor' ? 'active' : ''}`}
            onClick={() => { setActiveTab('vendor'); navigate('/dashboard'); }}
            style={activeTab === 'vendor' ? activeNavStyle : navStyle}
          >
            🏪 Vendor Portal
          </button>
        )}

        {role === 'ADMIN' && (
          <button
            className={`btn-nav ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => { setActiveTab('admin'); navigate('/dashboard'); }}
            style={activeTab === 'admin' ? activeNavStyle : navStyle}
          >
            ⚡ Admin Portal
          </button>
        )}
      </div>

      {/* Right Navbar Controls */}
      <div className="navbar-right" style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
        {/* Cart Button */}
        <button
          onClick={onOpenCart}
          style={{
            position: 'relative',
            background: 'var(--gold-dim)',
            border: '1px solid var(--border-focus)',
            color: 'var(--gold)',
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-btn)',
            cursor: 'pointer',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'var(--transition)'
          }}
        >
          🛒 Cart
          {cartCount > 0 && (
            <span
              style={{
                background: 'var(--gold)',
                color: '#000',
                borderRadius: '50%',
                padding: '2px 8px',
                fontSize: '0.75rem',
                fontWeight: '800'
              }}
            >
              {cartCount}
            </span>
          )}
        </button>

        {/* Profile Link */}
        <div
          onClick={() => navigate('/profile')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}
        >
          <span className={getRoleBadgeClass()}>{role}</span>
          <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{username}</span>
        </div>

        {/* Logout */}
        <button className="btn-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  )
}

const navStyle = {
  background: 'transparent',
  border: '1px solid transparent',
  color: 'var(--text-secondary)',
  padding: '0.5rem 1rem',
  borderRadius: 'var(--radius-btn)',
  cursor: 'pointer',
  fontWeight: '500',
  transition: 'var(--transition)'
}

const activeNavStyle = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-focus)',
  color: 'var(--gold)',
  padding: '0.5rem 1rem',
  borderRadius: 'var(--radius-btn)',
  cursor: 'pointer',
  fontWeight: '700',
  boxShadow: 'var(--shadow-gold)'
}
