import { useState, useEffect, useRef } from 'react'
import AdminService from '../services/AdminService'
import ProductService from '../services/ProductService'
import NotificationService from '../services/NotificationService'
import AuthService from '../services/AuthService'

export default function AdminModule() {
  const adminUser = AuthService.getCurrentUser()
  const adminId = adminUser?.id

  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [vendors, setVendors] = useState([])
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [commissions, setCommissions] = useState(null)
  const [systemStatus, setSystemStatus] = useState(null)
  const [reportData, setReportData] = useState(null)
  const [activeReportType, setActiveReportType] = useState('SALES')

  const [loading, setLoading] = useState(true)
  const [activeAdminTab, setActiveAdminTab] = useState('overview') // 'overview' | 'users' | 'vendors' | 'products' | 'analytics' | 'orders' | 'commissions' | 'system' | 'reports'

  // Vendor Detail Modal state
  const [selectedVendorDetails, setSelectedVendorDetails] = useState(null)
  const [vendorFilterStatus, setVendorFilterStatus] = useState('ALL')

  // Order Detail Modal state
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [orderFilterStatus, setOrderFilterStatus] = useState('ALL')

  // Notification state
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifPanel, setShowNotifPanel] = useState(false)
  const notifRef = useRef(null)

  const loadAdminData = async () => {
    setLoading(true)
    try {
      const [statsRes, usersRes, vendorsRes, productsRes, ordersRes, analyticsRes, commissionsRes, sysRes, reportRes] = await Promise.all([
        AdminService.getPlatformStats(),
        AdminService.getAllUsers(),
        AdminService.getAllVendors(),
        ProductService.getAllProducts(),
        AdminService.getAllOrders(),
        AdminService.getMarketplaceAnalytics(),
        AdminService.getCommissionData(),
        AdminService.getSystemStatus(),
        AdminService.getReport(activeReportType)
      ])
      setStats(statsRes)
      setUsers(usersRes)
      setVendors(vendorsRes)
      setProducts(productsRes)
      setOrders(ordersRes)
      setAnalytics(analyticsRes)
      setCommissions(commissionsRes)
      setSystemStatus(sysRes)
      setReportData(reportRes)
    } catch (err) {
      console.error('Error loading admin metrics:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadNotifications = async () => {
    if (!adminId) return
    try {
      const [notifs, count] = await Promise.all([
        NotificationService.getNotifications(adminId),
        NotificationService.getUnreadCount(adminId)
      ])
      setNotifications(notifs)
      setUnreadCount(count)
    } catch (err) {
      console.error('Error loading notifications:', err)
    }
  }

  useEffect(() => {
    loadAdminData()
    loadNotifications()
    const interval = setInterval(loadNotifications, 5000)
    return () => clearInterval(interval)
  }, [adminId])

  // Reload report when type changes
  useEffect(() => {
    if (activeAdminTab === 'reports') {
      AdminService.getReport(activeReportType)
        .then(res => setReportData(res))
        .catch(err => console.error('Failed to load report:', err))
    }
  }, [activeReportType, activeAdminTab])

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifPanel(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handlers
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

  const handleViewVendorDetails = async (vendorId) => {
    try {
      const data = await AdminService.getVendorDetails(vendorId)
      setSelectedVendorDetails(data)
    } catch (err) {
      console.error('Failed to load vendor details:', err)
    }
  }

  const handleOrderStatusChange = async (orderId, newStatus) => {
    try {
      await AdminService.updateOrderStatus(orderId, newStatus)
      loadAdminData()
    } catch (err) {
      console.error('Error updating order status:', err)
    }
  }

  const handleVendorPayoutStatusChange = async (vendorId, newStatus) => {
    try {
      await AdminService.updateVendorPayoutStatus(vendorId, newStatus)
      const freshComm = await AdminService.getCommissionData()
      setCommissions(freshComm)
    } catch (err) {
      console.error('Error updating payout status:', err)
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

  const handleToggleProductApproval = async (product, approved) => {
    try {
      await ProductService.updateProduct(product.id, { ...product, approved })
      loadAdminData()
    } catch (err) {
      console.error('Error updating product approval:', err)
      alert('Failed to update product approval status.')
    }
  }

  const handleMarkAsRead = async (notifId) => {
    try {
      await NotificationService.markAsRead(notifId)
      loadNotifications()
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }

  const handleMarkAllRead = async () => {
    if (!adminId) return
    try {
      await NotificationService.markAllAsRead(adminId)
      loadNotifications()
    } catch (err) {
      console.error('Error marking all as read:', err)
    }
  }

  const filteredVendors = vendors.filter(v => {
    if (vendorFilterStatus === 'ALL') return true
    return v.status === vendorFilterStatus
  })

  const filteredOrders = orders.filter(o => {
    if (orderFilterStatus === 'ALL') return true
    return o.status === orderFilterStatus
  })

  if (loading) return <div style={{ color: 'var(--gold)', padding: '2rem', textAlign: 'center', fontSize: '1.1rem' }}>⚡ Loading Executive Control Center...</div>

  return (
    <div style={{ padding: '1.5rem 0' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(10,10,10,0.98) 100%)',
          border: '1px solid rgba(212,175,55,0.3)',
          borderRadius: 'var(--radius-card)',
          padding: '2rem',
          marginBottom: '2rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--gold)', fontWeight: '800', fontSize: '0.85rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                Executive Control Command Center
              </span>
              <span className="badge badge-purple">SYSTEM ADMIN AUTHORIZED</span>
            </div>
            <h1 style={{ fontSize: '2.1rem', fontWeight: '800', color: '#fff', fontFamily: 'Manrope, sans-serif' }}>
              Obsidian Platform Governance &amp; Analytics
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '700px' }}>
              Monitor marketplace performance, handle vendor verification &amp; commissions, inspect system health, track orders, and generate business audit reports.
            </p>
          </div>

          {/* Right Header Status & Notification Bell */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'rgba(22,163,74,0.15)', border: '1px solid var(--success)', padding: '0.5rem 0.9rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', animation: 'pulse 1.5s infinite' }}></span>
              <span style={{ color: '#86efac', fontWeight: '700', fontSize: '0.85rem' }}>SYSTEM OPTIMAL</span>
            </div>

            {/* Notification Bell */}
            <div ref={notifRef} style={{ position: 'relative', flexShrink: 0 }}>
              <button
                id="admin-notif-bell"
                onClick={() => setShowNotifPanel(p => !p)}
                style={{
                  position: 'relative',
                  background: unreadCount > 0 ? 'rgba(212,175,55,0.18)' : 'var(--bg-card)',
                  border: `1px solid ${unreadCount > 0 ? 'rgba(212,175,55,0.6)' : 'var(--border)'}`,
                  borderRadius: '12px',
                  padding: '0.65rem 1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#fff',
                  fontSize: '1.1rem',
                  transition: 'all 0.2s',
                  minWidth: '60px',
                  justifyContent: 'center'
                }}
              >
                🔔
                {unreadCount > 0 && (
                  <span style={{
                    background: 'var(--gold)',
                    color: '#000',
                    borderRadius: '999px',
                    fontSize: '0.7rem',
                    fontWeight: '800',
                    padding: '0.15rem 0.45rem',
                    minWidth: '20px',
                    textAlign: 'center'
                  }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifPanel && (
                <div
                  id="admin-notif-panel"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 0.75rem)',
                    right: 0,
                    width: '380px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-focus)',
                    borderRadius: 'var(--radius-card)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
                    zIndex: 2000,
                    overflow: 'hidden'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem 1.25rem',
                    borderBottom: '1px solid var(--border)'
                  }}>
                    <span style={{ fontWeight: '800', color: '#fff', fontSize: '0.95rem' }}>🔔 Platform Alerts</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--gold)',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          fontWeight: '700',
                          textDecoration: 'underline'
                        }}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        No new notifications
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => !n.read && handleMarkAsRead(n.id)}
                          style={{
                            padding: '0.9rem 1.25rem',
                            borderBottom: '1px solid var(--border-subtle)',
                            background: n.read ? 'transparent' : 'rgba(212,175,55,0.08)',
                            cursor: n.read ? 'default' : 'pointer',
                            display: 'flex',
                            gap: '0.75rem',
                            alignItems: 'flex-start'
                          }}
                        >
                          <span style={{ fontSize: '1.1rem', flexShrink: 0, marginTop: '0.1rem' }}>
                            {n.type === 'PRODUCT_ADDED' ? '📦' : '🏪'}
                          </span>
                          <div style={{ flex: 1 }}>
                            <p style={{
                              margin: 0,
                              fontSize: '0.875rem',
                              color: n.read ? 'var(--text-secondary)' : '#fff',
                              fontWeight: n.read ? '400' : '600',
                              lineHeight: '1.4'
                            }}>
                              {n.message}
                            </p>
                            <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {new Date(n.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar for all 8 Admin Requirements */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '1px solid var(--border)',
        paddingBottom: '0.85rem',
        marginBottom: '2rem',
        overflowX: 'auto'
      }}>
        <button
          onClick={() => setActiveAdminTab('overview')}
          style={activeAdminTab === 'overview' ? activeTabStyle : tabStyle}
        >
          📊 Dashboard Summary
        </button>

        <button
          onClick={() => setActiveAdminTab('users')}
          style={activeAdminTab === 'users' ? activeTabStyle : tabStyle}
        >
          👤 Users ({users.length})
        </button>

        <button
          onClick={() => setActiveAdminTab('vendors')}
          style={activeAdminTab === 'vendors' ? activeTabStyle : tabStyle}
        >
          🏪 Vendor Management ({vendors.length})
        </button>

        <button
          onClick={() => setActiveAdminTab('products')}
          style={activeAdminTab === 'products' ? activeTabStyle : tabStyle}
        >
          🔍 Catalog Moderation ({products.length})
        </button>

        <button
          onClick={() => setActiveAdminTab('analytics')}
          style={activeAdminTab === 'analytics' ? activeTabStyle : tabStyle}
        >
          📈 Analytics &amp; Trends
        </button>

        <button
          onClick={() => setActiveAdminTab('orders')}
          style={activeAdminTab === 'orders' ? activeTabStyle : tabStyle}
        >
          📦 Order Monitoring ({orders.length})
        </button>

        <button
          onClick={() => setActiveAdminTab('commissions')}
          style={activeAdminTab === 'commissions' ? activeTabStyle : tabStyle}
        >
          💰 Commissions &amp; Payouts
        </button>

        <button
          onClick={() => setActiveAdminTab('system')}
          style={activeAdminTab === 'system' ? activeTabStyle : tabStyle}
        >
          🖥️ System Status
        </button>

        <button
          onClick={() => setActiveAdminTab('reports')}
          style={activeAdminTab === 'reports' ? activeTabStyle : tabStyle}
        >
          📑 Business Reports
        </button>
      </div>

      {/* TAB 1: OVERVIEW DASHBOARD SUMMARY */}
      {activeAdminTab === 'overview' && (
        <div>
          <div className="dashboard-grid" style={{ marginBottom: '2.5rem' }}>
            <div className="info-card">
              <div className="card-icon icon-purple">👑</div>
              <div className="card-label">Platform Gross Volume</div>
              <div className="card-value" style={{ color: 'var(--gold)', fontSize: '1.6rem', fontWeight: '800' }}>
                ${stats?.totalPlatformRevenue ? Number(stats.totalPlatformRevenue).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.4rem' }}>Aggregated platform revenue across sellers</div>
            </div>

            <div className="info-card">
              <div className="card-icon icon-blue">👥</div>
              <div className="card-label">Registered Accounts</div>
              <div className="card-value" style={{ fontSize: '1.6rem', fontWeight: '800' }}>{users.length}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.4rem' }}>Customers, Vendors &amp; System Admins</div>
            </div>

            <div className="info-card">
              <div className="card-icon icon-green">🛍️</div>
              <div className="card-label">Catalog Listings</div>
              <div className="card-value" style={{ fontSize: '1.6rem', fontWeight: '800' }}>{products.length}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.4rem' }}>Approved &amp; pending product items</div>
            </div>

            <div className="info-card">
              <div className="card-icon icon-orange">🏪</div>
              <div className="card-label">Registered Stores</div>
              <div className="card-value" style={{ fontSize: '1.6rem', fontWeight: '800' }}>{vendors.length}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.4rem' }}>Active &amp; pending seller stores</div>
            </div>
          </div>

          {/* Quick Platform Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff' }}>⚡ Actionable Moderation Queue</h3>
                <span className="badge badge-purple">ATTENTION NEEDED</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem', background: 'var(--bg-secondary)', borderRadius: '10px', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Pending Vendor Applications</span>
                  <span style={{ fontWeight: '800', color: 'var(--gold)', fontSize: '1.1rem' }}>{stats?.pendingVendors || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem', background: 'var(--bg-secondary)', borderRadius: '10px', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Products Awaiting Moderation</span>
                  <span style={{ fontWeight: '800', color: '#fde047', fontSize: '1.1rem' }}>{stats?.pendingProducts || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem', background: 'var(--bg-secondary)', borderRadius: '10px', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Total Processed Orders</span>
                  <span style={{ fontWeight: '800', color: '#86efac', fontSize: '1.1rem' }}>{orders.length}</span>
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff', marginBottom: '1rem' }}>🛡️ Security &amp; Services Status</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>JWT Security Encryption</span>
                  <span style={{ color: '#86efac', fontWeight: '700' }}>HMAC-SHA256</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Database Connection Pool</span>
                  <span style={{ color: '#86efac', fontWeight: '700' }}>ONLINE (0 Leaks)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Payment Engine</span>
                  <span style={{ color: 'var(--gold)', fontWeight: '700' }}>RAZORPAY INTEGRATED</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>In-App Alert Pipeline</span>
                  <span style={{ color: '#86efac', fontWeight: '700' }}>ACTIVE (5s Sync)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER MANAGEMENT */}
      {activeAdminTab === 'users' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '700' }}>Registered Accounts &amp; Access Control</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Accounts: {users.length}</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.82rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '1rem' }}>User Profile</th>
                <th style={{ padding: '1rem' }}>Email</th>
                <th style={{ padding: '1rem' }}>Current Role</th>
                <th style={{ padding: '1rem' }}>Modify Authorization</th>
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
                    <span className={u.role === 'ADMIN' ? 'badge badge-red' : u.role === 'VENDOR' ? 'badge badge-green' : 'badge badge-purple'}>
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

      {/* TAB 3: VENDOR MANAGEMENT */}
      {activeAdminTab === 'vendors' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
          {/* Status Filter Header */}
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '700' }}>Vendor Verification &amp; Governance</h3>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['ALL', 'APPROVED', 'PENDING', 'REJECTED', 'SUSPENDED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setVendorFilterStatus(st)}
                  style={{
                    background: vendorFilterStatus === st ? 'var(--gold)' : 'var(--bg-secondary)',
                    color: vendorFilterStatus === st ? '#000' : 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.82rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '1rem' }}>Store Name &amp; Address</th>
                <th style={{ padding: '1rem' }}>Business Contact</th>
                <th style={{ padding: '1rem' }}>Rating</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Moderation &amp; Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredVendors.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No vendor applications matching filter.</td></tr>
              ) : (
                filteredVendors.map((v) => (
                  <tr key={v.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: '700', color: '#fff' }}>{v.storeName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v.address}</div>
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                      <div>{v.businessEmail}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v.phoneNumber}</div>
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--gold)', fontWeight: '700' }}>★ {v.rating || 4.9}</td>
                    <td style={{ padding: '1rem' }}>
                      <span className={v.status === 'APPROVED' ? 'badge badge-green' : v.status === 'SUSPENDED' ? 'badge badge-red' : 'badge badge-orange'}>
                        {v.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleViewVendorDetails(v.id)}
                          style={{ background: 'var(--gold-dim)', border: '1px solid var(--gold)', color: 'var(--gold)', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                        >
                          Details
                        </button>
                        <button
                          onClick={() => handleVendorStatusChange(v.id, 'APPROVED')}
                          style={{ background: 'rgba(22,163,74,0.2)', border: '1px solid var(--success)', color: '#86efac', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleVendorStatusChange(v.id, 'SUSPENDED')}
                          style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid var(--warning)', color: '#fde047', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          Suspend
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

          {/* Vendor Details Drawer Modal */}
          {selectedVendorDetails && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-focus)', borderRadius: 'var(--radius-card)', maxWidth: '600px', width: '100%', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#fff' }}>🏪 Vendor Profile Details</h2>
                  <button onClick={() => setSelectedVendorDetails(null)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Store Name</span>
                    <h3 style={{ color: 'var(--gold)', fontSize: '1.3rem', fontWeight: '800' }}>{selectedVendorDetails.profile?.storeName}</h3>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Description</span>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>{selectedVendorDetails.profile?.description}</p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '12px' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Business Email</span>
                      <div style={{ color: '#fff', fontWeight: '600' }}>{selectedVendorDetails.profile?.businessEmail}</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Phone Number</span>
                      <div style={{ color: '#fff', fontWeight: '600' }}>{selectedVendorDetails.profile?.phoneNumber}</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Total Active Listings</span>
                      <div style={{ color: '#fff', fontWeight: '600' }}>{selectedVendorDetails.totalProducts} Items</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Estimated Gross Sales</span>
                      <div style={{ color: 'var(--gold)', fontWeight: '800' }}>${Number(selectedVendorDetails.totalSales).toLocaleString()}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                    <button onClick={() => setSelectedVendorDetails(null)} className="btn-primary" style={{ width: 'auto', padding: '0.6rem 1.5rem' }}>Close</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: MARKETPLACE ANALYTICS */}
      {activeAdminTab === 'analytics' && analytics && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Analytics Summary Cards */}
          <div className="dashboard-grid">
            <div className="info-card">
              <div className="card-icon icon-purple">💵</div>
              <div className="card-label">Gross Transaction Volume</div>
              <div className="card-value" style={{ color: 'var(--gold)', fontSize: '1.5rem', fontWeight: '800' }}>
                ${Number(analytics.totalRevenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="info-card">
              <div className="card-icon icon-blue">📦</div>
              <div className="card-label">Marketplace Orders</div>
              <div className="card-value" style={{ fontSize: '1.5rem', fontWeight: '800' }}>{analytics.totalOrdersCount}</div>
            </div>

            <div className="info-card">
              <div className="card-icon icon-green">📊</div>
              <div className="card-label">Average Order Value</div>
              <div className="card-value" style={{ color: '#86efac', fontSize: '1.5rem', fontWeight: '800' }}>
                ${Number(analytics.avgOrderValue).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="info-card">
              <div className="card-icon icon-orange">🏷️</div>
              <div className="card-label">Catalog Products</div>
              <div className="card-value" style={{ fontSize: '1.5rem', fontWeight: '800' }}>{analytics.totalProducts}</div>
            </div>
          </div>

          {/* Charts Section */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
            {/* Sales Trend Bar Chart */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '1.5rem' }}>
              <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem' }}>📈 Monthly Sales Volume Trend ($)</h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', height: '220px', padding: '1rem 0', borderBottom: '1px solid var(--border)' }}>
                {analytics.salesTrend?.map((item, idx) => {
                  const maxSales = 8000
                  const heightPercent = Math.min(100, Math.max(15, (item.sales / maxSales) * 100))
                  return (
                    <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', height: '100%', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--gold)', fontWeight: '700' }}>${item.sales}</span>
                      <div
                        style={{
                          width: '100%',
                          maxWidth: '32px',
                          height: `${heightPercent}%`,
                          background: 'linear-gradient(180deg, var(--gold) 0%, rgba(212,175,55,0.2) 100%)',
                          borderRadius: '6px 6px 0 0',
                          transition: 'height 0.5s ease'
                        }}
                      />
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{item.month}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Category Breakdown Progress Bars */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '1.5rem' }}>
              <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem' }}>🏷️ Sales Distribution by Category</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {Object.entries(analytics.categorySales || {}).map(([cat, amount]) => {
                  const total = Object.values(analytics.categorySales).reduce((a, b) => Number(a) + Number(b), 0)
                  const percent = total > 0 ? Math.round((Number(amount) / total) * 100) : 0
                  return (
                    <div key={cat}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                        <span style={{ color: '#fff', fontWeight: '600' }}>{cat}</span>
                        <span style={{ color: 'var(--gold)', fontWeight: '700' }}>${Number(amount).toLocaleString()} ({percent}%)</span>
                      </div>
                      <div style={{ width: '100%', height: '10px', background: 'var(--bg-secondary)', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ width: `${percent}%`, height: '100%', background: 'var(--gold)', borderRadius: '999px', transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ORDER MONITORING */}
      {activeAdminTab === 'orders' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
          {/* Order Status Filter Header */}
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '700' }}>Marketplace Order Monitoring &amp; Status Control</h3>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['ALL', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setOrderFilterStatus(st)}
                  style={{
                    background: orderFilterStatus === st ? 'var(--gold)' : 'var(--bg-secondary)',
                    color: orderFilterStatus === st ? '#000' : 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.82rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '1rem' }}>Order ID</th>
                <th style={{ padding: '1rem' }}>Customer Name</th>
                <th style={{ padding: '1rem' }}>Total Amount</th>
                <th style={{ padding: '1rem' }}>Payment Status</th>
                <th style={{ padding: '1rem' }}>Order Status</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No marketplace orders found.</td></tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr key={ord.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '1rem', fontWeight: '700', color: 'var(--gold)' }}>#{ord.id}</td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: '600', color: '#fff' }}>{ord.customerName || 'Customer'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>User ID: #{ord.userId}</div>
                    </td>
                    <td style={{ padding: '1rem', fontWeight: '800', color: '#fff' }}>
                      ${Number(ord.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span className="badge badge-green">{ord.paymentStatus || 'PAID'}</span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <select
                        value={ord.status}
                        onChange={(e) => handleOrderStatusChange(ord.id, e.target.value)}
                        style={{
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border)',
                          color: '#fff',
                          padding: '0.35rem 0.7rem',
                          borderRadius: '8px',
                          outline: 'none',
                          fontSize: '0.85rem'
                        }}
                      >
                        <option value="PROCESSING">PROCESSING</option>
                        <option value="SHIPPED">SHIPPED</option>
                        <option value="DELIVERED">DELIVERED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedOrder(ord)}
                        style={{ background: 'var(--gold-dim)', border: '1px solid var(--gold)', color: 'var(--gold)', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                      >
                        View Items ({ord.items?.length || 0})
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Order Details Modal */}
          {selectedOrder && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-focus)', borderRadius: 'var(--radius-card)', maxWidth: '650px', width: '100%', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#fff' }}>📦 Order Summary #{selectedOrder.id}</h2>
                  <button onClick={() => setSelectedOrder(null)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '12px' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Shipping Address</div>
                    <div style={{ color: '#fff', fontWeight: '600' }}>{selectedOrder.shippingAddress}</div>
                  </div>

                  <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#fff', marginTop: '0.5rem' }}>Purchased Items</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {selectedOrder.items?.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.8rem', background: 'var(--bg-secondary)', borderRadius: '10px' }}>
                        <img src={item.imageUrl} alt="" style={{ width: '45px', height: '45px', borderRadius: '8px', objectFit: 'cover' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '700', color: '#fff' }}>{item.productName}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Quantity: {item.quantity} units</div>
                        </div>
                        <div style={{ fontWeight: '800', color: 'var(--gold)' }}>
                          ${Number(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem' }}>
                    <span style={{ fontWeight: '700', color: '#fff' }}>Total Amount Paid</span>
                    <span style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--gold)' }}>
                      ${Number(selectedOrder.totalAmount).toFixed(2)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <button onClick={() => setSelectedOrder(null)} className="btn-primary" style={{ width: 'auto', padding: '0.6rem 1.5rem' }}>Close</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: COMMISSION MANAGEMENT */}
      {activeAdminTab === 'commissions' && commissions && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Commission Metric Summary Cards */}
          <div className="dashboard-grid">
            <div className="info-card">
              <div className="card-icon icon-purple">⚡</div>
              <div className="card-label">Marketplace Standard Rate</div>
              <div className="card-value" style={{ color: 'var(--gold)', fontSize: '1.6rem', fontWeight: '800' }}>
                {commissions.commissionRate}%
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Platform service fee</div>
            </div>

            <div className="info-card">
              <div className="card-icon icon-blue">💰</div>
              <div className="card-label">Total Gross Seller Volume</div>
              <div className="card-value" style={{ fontSize: '1.6rem', fontWeight: '800' }}>
                ${Number(commissions.totalGrossSales).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="info-card">
              <div className="card-icon icon-green">👑</div>
              <div className="card-label">Platform Net Earnings</div>
              <div className="card-value" style={{ color: '#86efac', fontSize: '1.6rem', fontWeight: '800' }}>
                ${Number(commissions.totalPlatformCommission).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Vendor Commission Breakdown Table */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '700' }}>Vendor Sales, Commission &amp; Disbursal Ledger</h3>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.82rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '1rem' }}>Vendor Store</th>
                  <th style={{ padding: '1rem' }}>Gross Sales</th>
                  <th style={{ padding: '1rem' }}>Platform Fee (10%)</th>
                  <th style={{ padding: '1rem' }}>Net Vendor Payout</th>
                  <th style={{ padding: '1rem' }}>Payout Status</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Process Action</th>
                </tr>
              </thead>
              <tbody>
                {commissions.vendorCommissions?.map((vc) => (
                  <tr key={vc.vendorId} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: '700', color: '#fff' }}>{vc.storeName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{vc.businessEmail}</div>
                    </td>
                    <td style={{ padding: '1rem', fontWeight: '700', color: '#fff' }}>
                      ${Number(vc.grossSales).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '1rem', fontWeight: '700', color: 'var(--gold)' }}>
                      ${Number(vc.platformFee).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '1rem', fontWeight: '800', color: '#86efac' }}>
                      ${Number(vc.netPayout).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span className={vc.payoutStatus === 'PAID' ? 'badge badge-green' : 'badge badge-orange'}>
                        {vc.payoutStatus}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      {vc.payoutStatus === 'PAID' ? (
                        <button
                          onClick={() => handleVendorPayoutStatusChange(vc.vendorId, 'PENDING')}
                          style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid var(--warning)', color: '#fde047', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          Mark Pending
                        </button>
                      ) : (
                        <button
                          onClick={() => handleVendorPayoutStatusChange(vc.vendorId, 'PAID')}
                          style={{ background: 'rgba(22,163,74,0.2)', border: '1px solid var(--success)', color: '#86efac', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          Disburse Payout
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: SYSTEM MONITORING */}
      {activeAdminTab === 'system' && systemStatus && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Health Overview Cards */}
          <div className="dashboard-grid">
            <div className="info-card">
              <div className="card-icon icon-green">🖥️</div>
              <div className="card-label">System Health Status</div>
              <div className="card-value" style={{ color: '#86efac', fontSize: '1.5rem', fontWeight: '800' }}>
                {systemStatus.overallStatus}
              </div>
            </div>

            <div className="info-card">
              <div className="card-icon icon-purple">⚡</div>
              <div className="card-label">JVM Memory Usage</div>
              <div className="card-value" style={{ color: 'var(--gold)', fontSize: '1.5rem', fontWeight: '800' }}>
                {systemStatus.usedMemoryMB} MB / {systemStatus.maxMemoryMB} MB
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.4rem' }}>
                {systemStatus.memoryUsagePercent}% utilization
              </div>
            </div>

            <div className="info-card">
              <div className="card-icon icon-blue">🧵</div>
              <div className="card-label">Active Java Threads</div>
              <div className="card-value" style={{ fontSize: '1.5rem', fontWeight: '800' }}>{systemStatus.activeThreads}</div>
            </div>

            <div className="info-card">
              <div className="card-icon icon-orange">⏱️</div>
              <div className="card-label">System Uptime</div>
              <div className="card-value" style={{ fontSize: '1.5rem', fontWeight: '800' }}>{systemStatus.uptimeMinutes} Mins</div>
            </div>
          </div>

          {/* Service Diagnostics Grid */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '1.5rem' }}>
            <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem' }}>🔍 Microservice Health Grid</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {Object.entries(systemStatus.services || {}).map(([key, srv]) => (
                <div key={key} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: '700', color: '#fff', fontSize: '0.92rem' }}>{srv.name}</span>
                    <span className="badge badge-green">{srv.status}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {srv.latency ? `Latency: ${srv.latency}` : srv.algorithm ? `Alg: ${srv.algorithm}` : 'Status: Optimal'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Diagnostic Logs Stream */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '1.5rem' }}>
            <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem' }}>📜 Live Operational Diagnostic Logs</h3>
            <div style={{ background: '#050505', border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem', fontFamily: 'monospace', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {systemStatus.logs?.map((log, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '1rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>[{log.timestamp}]</span>
                  <span style={{ color: log.level === 'SUCCESS' ? '#86efac' : 'var(--gold)', fontWeight: '700' }}>[{log.level}]</span>
                  <span style={{ color: '#fff' }}>{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: BUSINESS REPORTS */}
      {activeAdminTab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Report Type Selector */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '800' }}>📑 Executive Business Audit Reports</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>Generate and download real-time reporting datasets across sales, vendors, products, and system infrastructure.</p>
              </div>

              <a
                href={AdminService.exportReportCsvUrl(activeReportType)}
                target="_blank"
                rel="noreferrer"
                download
                className="btn-primary"
                style={{ width: 'auto', padding: '0.65rem 1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
              >
                📥 Export CSV Report
              </a>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
              {[
                { id: 'SALES', label: '📊 Sales & Orders Report' },
                { id: 'VENDOR', label: '🏪 Vendor Performance' },
                { id: 'PRODUCT', label: '📦 Catalog Inventory Audit' },
                { id: 'SYSTEM', label: '🖥️ System Diagnostic Report' }
              ].map(rep => (
                <button
                  key={rep.id}
                  onClick={() => setActiveReportType(rep.id)}
                  style={{
                    background: activeReportType === rep.id ? 'var(--gold)' : 'var(--bg-secondary)',
                    color: activeReportType === rep.id ? '#000' : 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                    padding: '0.65rem 1.25rem',
                    borderRadius: 'var(--radius-btn)',
                    fontWeight: '700',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  {rep.label}
                </button>
              ))}
            </div>
          </div>

          {/* Generated Report Data Table Preview */}
          {reportData && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ color: 'var(--gold)', fontSize: '1.1rem', fontWeight: '800' }}>{reportData.title}</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Generated: {reportData.generatedAt} by {reportData.generatedBy}</span>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.82rem', textTransform: 'uppercase' }}>
                    {reportData.columns?.map((col, idx) => (
                      <th key={idx} style={{ padding: '1rem' }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportData.data?.map((row, rIdx) => (
                    <tr key={rIdx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      {Object.values(row).map((val, cIdx) => (
                        <td key={cIdx} style={{ padding: '1rem', color: cIdx === 0 ? 'var(--gold)' : '#fff', fontWeight: cIdx === 0 ? '700' : '400' }}>
                          {String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3 (CATALOG MODERATION - EXISTING CONTINUED) */}
      {activeAdminTab === 'products' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '700' }}>Product Catalog Listing Moderation</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Listings: {products.length}</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '1rem' }}>Item</th>
                <th style={{ padding: '1rem' }}>Vendor</th>
                <th style={{ padding: '1rem' }}>Price</th>
                <th style={{ padding: '1rem' }}>Status</th>
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
                  <td style={{ padding: '1rem' }}>
                    {prod.discount > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ color: 'var(--gold)', fontWeight: '800' }}>
                          ${Number(prod.discountedPrice).toLocaleString()}
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textDecoration: 'line-through' }}>
                          ${Number(prod.price).toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      <span style={{ fontWeight: '800', color: 'var(--gold)' }}>
                        ${Number(prod.price).toLocaleString()}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {prod.approved ? (
                      <span className="badge badge-green">Approved</span>
                    ) : (
                      <span className="badge badge-red">Pending</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>{prod.stockQuantity} units</td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      {prod.approved ? (
                        <button
                          onClick={() => handleToggleProductApproval(prod, false)}
                          style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid var(--warning)', color: '#fde047', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                        >
                          Revoke
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleProductApproval(prod, true)}
                          style={{ background: 'rgba(22,163,74,0.15)', border: '1px solid var(--success)', color: '#86efac', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                        >
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteProduct(prod.id)}
                        style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid var(--error)', color: '#fca5a5', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    </div>
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
  fontSize: '0.9rem',
  whiteSpace: 'nowrap'
}

const activeTabStyle = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-focus)',
  color: 'var(--gold)',
  padding: '0.5rem 1rem',
  borderRadius: 'var(--radius-btn)',
  cursor: 'pointer',
  fontWeight: '800',
  fontSize: '0.9rem',
  whiteSpace: 'nowrap'
}
