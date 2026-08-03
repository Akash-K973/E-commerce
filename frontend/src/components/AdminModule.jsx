import { useState, useEffect } from 'react'
import AdminService from '../services/AdminService'
import ProductService from '../services/ProductService'

export default function AdminModule() {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [vendors, setVendors] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeAdminTab, setActiveAdminTab] = useState('users') // 'users' | 'vendors' | 'products'

  const loadAdminData = async () => {
    setLoading(true)
    try {
      const [statsRes, usersRes, vendorsRes, productsRes] = await Promise.all([
        AdminService.getPlatformStats(),
        AdminService.getAllUsers(),
        AdminService.getAllVendors(),
        ProductService.getAllProducts()
      ])
      setStats(statsRes)
      setUsers(usersRes)
      setVendors(vendorsRes)
      setProducts(productsRes)
    } catch (err) {
      console.error('Error loading admin metrics:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAdminData()
  }, [])

  const handleRoleChange = async (userId, newRole) => {
    try {
      await AdminService.updateUserRole(userId, newRole)
      loadAdminData()
    } catch (err) {
      console.error('Error updating role:', err)
      alert('Failed to change user role.')
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user account?')) return
    try {
      await AdminService.deleteUser(userId)
      loadAdminData()
    } catch (err) {
      console.error('Error deleting user:', err)
    }
  }

  const handleVendorStatusChange = async (vendorId, newStatus) => {
    try {
      await AdminService.updateVendorStatus(vendorId, newStatus)
      loadAdminData()
    } catch (err) {
      console.error('Error updating vendor status:', err)
    }
  }

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Moderate & remove this product from the platform?')) return
    try {
      await ProductService.deleteProduct(productId)
      loadAdminData()
    } catch (err) {
      console.error('Error moderating product:', err)
    }
  }

  if (loading) return <div style={{ color: 'var(--gold)', padding: '2rem' }}>Loading Admin Command Center...</div>

  return (
    <div style={{ padding: '1.5rem 0' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(10,10,10,0.95) 100%)',
          border: '1px solid rgba(239,68,68,0.4)',
          borderRadius: 'var(--radius-card)',
          padding: '2rem',
          marginBottom: '2rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <span style={{ color: '#ef4444', fontWeight: '800', fontSize: '0.85rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Executive Control Panel
          </span>
          <span className="badge badge-red">SYSTEM ADMIN</span>
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#fff', fontFamily: 'Manrope, sans-serif' }}>
          Platform Management & Security
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '650px' }}>
          Manage user permissions, review vendor applications, moderate product listings, and monitor global sales metrics.
        </p>
      </div>

      {/* Platform Dashboard Metric Cards */}
      <div className="dashboard-grid" style={{ marginBottom: '2.5rem' }}>
        <div className="info-card">
          <div className="card-icon icon-purple">👑</div>
          <div className="card-label">Platform Revenue</div>
          <div className="card-value" style={{ color: 'var(--gold)' }}>
            ${stats?.totalPlatformRevenue ? Number(stats.totalPlatformRevenue).toLocaleString() : '0.00'}
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Cumulative platform transaction volume</div>
        </div>

        <div className="info-card">
          <div className="card-icon icon-blue">👥</div>
          <div className="card-label">Registered Accounts</div>
          <div className="card-value">{users.length}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Customers, Vendors & Admins</div>
        </div>

        <div className="info-card">
          <div className="card-icon icon-green">🛍️</div>
          <div className="card-label">Catalog Products</div>
          <div className="card-value">{products.length}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Active items across all sellers</div>
        </div>

        <div className="info-card">
          <div className="card-icon icon-orange">🏪</div>
          <div className="card-label">Active Vendors</div>
          <div className="card-value">{vendors.length}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Verified seller stores</div>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveAdminTab('users')}
          style={activeAdminTab === 'users' ? activeTabStyle : tabStyle}
        >
          👤 User Management ({users.length})
        </button>

        <button
          onClick={() => setActiveAdminTab('vendors')}
          style={activeAdminTab === 'vendors' ? activeTabStyle : tabStyle}
        >
          🏪 Vendor Applications ({vendors.length})
        </button>

        <button
          onClick={() => setActiveAdminTab('products')}
          style={activeAdminTab === 'products' ? activeTabStyle : tabStyle}
        >
          🔍 Catalog Moderation ({products.length})
        </button>
      </div>

      {/* Tab 1: User Management */}
      {activeAdminTab === 'users' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '1rem' }}>User</th>
                <th style={{ padding: '1rem' }}>Email</th>
                <th style={{ padding: '1rem' }}>Current Role</th>
                <th style={{ padding: '1rem' }}>Change Role</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: '700', color: '#fff' }}>{u.username}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: #{u.id} {u.fullName ? `• ${u.fullName}` : ''}</div>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td style={{ padding: '1rem' }}>
                    <span className={u.role === 'ADMIN' ? 'badge badge-red' : u.role === 'VENDOR' ? 'badge badge-gold' : 'badge badge-purple'}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        color: '#fff',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '8px',
                        outline: 'none'
                      }}
                    >
                      <option value="CUSTOMER">CUSTOMER</option>
                      <option value="VENDOR">VENDOR</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid var(--error)', color: '#fca5a5', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer' }}
                    >
                      Remove User
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Vendor Verification */}
      {activeAdminTab === 'vendors' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '1rem' }}>Store Name</th>
                <th style={{ padding: '1rem' }}>Business Contact</th>
                <th style={{ padding: '1rem' }}>Rating</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Moderation</th>
              </tr>
            </thead>
            <tbody>
              {vendors.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No vendor applications found.</td></tr>
              ) : (
                vendors.map((v) => (
                  <tr key={v.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: '700', color: '#fff' }}>{v.storeName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v.address}</div>
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{v.businessEmail}</td>
                    <td style={{ padding: '1rem', color: 'var(--gold)', fontWeight: '700' }}>★ {v.rating || 4.9}</td>
                    <td style={{ padding: '1rem' }}>
                      <span className={v.status === 'APPROVED' ? 'badge badge-green' : 'badge badge-orange'}>
                        {v.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleVendorStatusChange(v.id, 'APPROVED')}
                          style={{ background: 'rgba(22,163,74,0.2)', border: '1px solid var(--success)', color: '#86efac', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleVendorStatusChange(v.id, 'REJECTED')}
                          style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid var(--error)', color: '#fca5a5', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Catalog Moderation */}
      {activeAdminTab === 'products' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '1rem' }}>Item</th>
                <th style={{ padding: '1rem' }}>Vendor</th>
                <th style={{ padding: '1rem' }}>Price</th>
                <th style={{ padding: '1rem' }}>Stock</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {products.map((prod) => (
                <tr key={prod.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img src={prod.imageUrl} alt="" style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} />
                      <div>
                        <div style={{ fontWeight: '700', color: '#fff' }}>{prod.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Category: {prod.category}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{prod.vendorName || 'Obsidian Seller'}</td>
                  <td style={{ padding: '1rem', fontWeight: '800', color: 'var(--gold)' }}>${Number(prod.price).toLocaleString()}</td>
                  <td style={{ padding: '1rem' }}>{prod.stockQuantity} units</td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button
                      onClick={() => handleDeleteProduct(prod.id)}
                      style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid var(--error)', color: '#fca5a5', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer' }}
                    >
                      Delete Product
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const tabStyle = {
  background: 'transparent',
  border: 'none',
  color: 'var(--text-secondary)',
  padding: '0.5rem 1rem',
  cursor: 'pointer',
  fontWeight: '600',
  fontSize: '0.95rem'
}

const activeTabStyle = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-focus)',
  color: 'var(--gold)',
  padding: '0.5rem 1rem',
  borderRadius: 'var(--radius-btn)',
  cursor: 'pointer',
  fontWeight: '800',
  fontSize: '0.95rem'
}
