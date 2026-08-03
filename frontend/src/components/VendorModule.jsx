import { useState, useEffect } from 'react'
import VendorService from '../services/VendorService'
import ProductService from '../services/ProductService'
import AuthService from '../services/AuthService'

export default function VendorModule() {
  const user = AuthService.getCurrentUser()
  const vendorId = user?.id || 1

  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  // Product Form Modal State
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Watches',
    stockQuantity: 10,
    imageUrl: '',
    sku: ''
  })

  // Vendor Profile Edit State
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profileForm, setProfileForm] = useState({
    storeName: '',
    description: '',
    businessEmail: '',
    phoneNumber: '',
    address: '',
    logoUrl: ''
  })

  const loadVendorData = async () => {
    setLoading(true)
    try {
      const [profData, statsData, prodData] = await Promise.all([
        VendorService.getVendorProfile(vendorId),
        VendorService.getVendorStats(vendorId),
        ProductService.getVendorProducts(vendorId)
      ])
      setProfile(profData)
      setStats(statsData)
      setProducts(prodData)
      setProfileForm({
        storeName: profData.storeName || '',
        description: profData.description || '',
        businessEmail: profData.businessEmail || '',
        phoneNumber: profData.phoneNumber || '',
        address: profData.address || '',
        logoUrl: profData.logoUrl || ''
      })
    } catch (err) {
      console.error('Error loading vendor portal data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVendorData()
  }, [vendorId])

  const handleOpenAddModal = () => {
    setEditingProduct(null)
    setProductForm({
      name: '',
      description: '',
      price: '',
      category: 'Watches',
      stockQuantity: 15,
      imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
      sku: 'VND-' + Math.floor(100 + Math.random() * 900)
    })
    setShowProductModal(true)
  }

  const handleOpenEditModal = (prod) => {
    setEditingProduct(prod)
    setProductForm({
      name: prod.name || '',
      description: prod.description || '',
      price: prod.price || '',
      category: prod.category || 'Watches',
      stockQuantity: prod.stockQuantity || 0,
      imageUrl: prod.imageUrl || '',
      sku: prod.sku || ''
    })
    setShowProductModal(true)
  }

  const handleProductSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...productForm,
        price: Number(productForm.price),
        stockQuantity: Number(productForm.stockQuantity),
        vendorId: vendorId,
        vendorName: profile?.storeName || user?.username || 'Vendor'
      }

      if (editingProduct) {
        await ProductService.updateProduct(editingProduct.id, payload)
      } else {
        await ProductService.createProduct(payload)
      }

      setShowProductModal(false)
      loadVendorData()
    } catch (err) {
      console.error('Error saving product:', err)
      alert('Failed to save product.')
    }
  }

  const handleDeleteProduct = async (prodId) => {
    if (!window.confirm('Are you sure you want to delete this product listing?')) return
    try {
      await ProductService.deleteProduct(prodId)
      loadVendorData()
    } catch (err) {
      console.error('Error deleting product:', err)
    }
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    try {
      const updated = await VendorService.updateVendorProfile(vendorId, profileForm)
      setProfile(updated)
      setShowProfileModal(false)
    } catch (err) {
      console.error('Error updating vendor profile:', err)
    }
  }

  if (loading) return <div style={{ color: 'var(--gold)', padding: '2rem' }}>Loading Vendor Atelier Portal...</div>

  return (
    <div style={{ padding: '1.5rem 0' }}>
      {/* Header & Store Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(20,20,20,0.95) 100%)',
          border: '1px solid var(--border-focus)',
          borderRadius: 'var(--radius-card)',
          padding: '2rem',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <img
            src={profile?.logoUrl || 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400&q=80'}
            alt=""
            style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--gold)' }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#fff', fontFamily: 'Manrope, sans-serif' }}>
                {profile?.storeName || 'Vendor Atelier'}
              </h1>
              <span className="badge badge-purple">{profile?.status || 'APPROVED'}</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              {profile?.description || 'Exclusive seller of luxury artisanal products.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowProfileModal(true)}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-focus)',
            color: 'var(--gold)',
            padding: '0.65rem 1.25rem',
            borderRadius: 'var(--radius-btn)',
            cursor: 'pointer',
            fontWeight: '700'
          }}
        >
          ⚙️ Edit Store Profile
        </button>
      </div>

      {/* Analytics Summary Cards */}
      <div className="dashboard-grid" style={{ marginBottom: '2.5rem' }}>
        <div className="info-card">
          <div className="card-icon icon-orange">📦</div>
          <div className="card-label">Active Listings</div>
          <div className="card-value">{products.length}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Products in your store catalog</div>
        </div>

        <div className="info-card">
          <div className="card-icon icon-green">💎</div>
          <div className="card-label">Estimated Revenue</div>
          <div className="card-value" style={{ color: 'var(--gold)' }}>
            ${stats?.estimatedSales ? Number(stats.estimatedSales).toLocaleString() : '0.00'}
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Generated from store purchases</div>
        </div>

        <div className="info-card">
          <div className="card-icon icon-purple">⭐</div>
          <div className="card-label">Store Rating</div>
          <div className="card-value">★ {stats?.storeRating || 4.9} / 5.0</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Verified customer feedback score</div>
        </div>

        <div className="info-card">
          <div className="card-icon icon-blue">⚠️</div>
          <div className="card-label">Low Stock Alerts</div>
          <div className="card-value" style={{ color: stats?.lowStockCount > 0 ? 'var(--warning)' : '#10b981' }}>
            {stats?.lowStockCount || 0}
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Items with &lt; 10 inventory</div>
        </div>
      </div>

      {/* Inventory Management Table Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', fontFamily: 'Manrope, sans-serif' }}>
            Store Product Inventory
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Manage your store's luxury offerings, prices, and stock inventory.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          style={{
            background: 'var(--gold)',
            color: '#000',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: 'var(--radius-btn)',
            fontWeight: '800',
            cursor: 'pointer',
            fontSize: '0.95rem'
          }}
        >
          + Add New Product
        </button>
      </div>

      {/* Products Table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '1rem' }}>Product</th>
              <th style={{ padding: '1rem' }}>SKU</th>
              <th style={{ padding: '1rem' }}>Category</th>
              <th style={{ padding: '1rem' }}>Price</th>
              <th style={{ padding: '1rem' }}>Stock</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No products in your catalog yet. Click "+ Add New Product" to create one.
                </td>
              </tr>
            ) : (
              products.map((prod) => (
                <tr key={prod.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img src={prod.imageUrl} alt="" style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover' }} />
                      <div>
                        <div style={{ fontWeight: '700', color: '#fff' }}>{prod.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: #{prod.id}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{prod.sku || 'N/A'}</td>
                  <td style={{ padding: '1rem' }}><span className="badge badge-purple">{prod.category}</span></td>
                  <td style={{ padding: '1rem', fontWeight: '800', color: 'var(--gold)' }}>${Number(prod.price).toLocaleString()}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ color: prod.stockQuantity < 10 ? '#ef4444' : '#10b981', fontWeight: '700' }}>
                      {prod.stockQuantity} units
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleOpenEditModal(prod)}
                        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--gold)', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(prod.id)}
                        style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid var(--error)', color: '#fca5a5', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Product Modal */}
      {showProductModal && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
            zIndex: 1100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem'
          }}
          onClick={() => setShowProductModal(false)}
        >
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-focus)',
              borderRadius: 'var(--radius-card)',
              maxWidth: '600px', width: '100%', padding: '2rem'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--gold)', marginBottom: '1.25rem' }}>
              {editingProduct ? 'Edit Product Listing' : 'Create New Product'}
            </h2>

            <form onSubmit={handleProductSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={labelStyle}>Product Name</label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Category</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="Watches">Watches</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Fragrance">Fragrance</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={labelStyle}>Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Stock Quantity</label>
                  <input
                    type="number"
                    required
                    value={productForm.stockQuantity}
                    onChange={(e) => setProductForm({ ...productForm, stockQuantity: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>SKU Code</label>
                  <input
                    type="text"
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Image URL</label>
                <input
                  type="text"
                  value={productForm.imageUrl}
                  onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={labelStyle}>Description</label>
                <textarea
                  rows={3}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  style={{ flex: 1, padding: '0.75rem', background: 'var(--bg-card)', border: '1px solid var(--border)', color: '#fff', borderRadius: 'var(--radius-btn)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '0.75rem', background: 'var(--gold)', border: 'none', color: '#000', fontWeight: '800', borderRadius: 'var(--radius-btn)', cursor: 'pointer' }}
                >
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Vendor Profile Modal */}
      {showProfileModal && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
            zIndex: 1100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem'
          }}
          onClick={() => setShowProfileModal(false)}
        >
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-focus)',
              borderRadius: 'var(--radius-card)',
              maxWidth: '550px', width: '100%', padding: '2rem'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--gold)', marginBottom: '1.25rem' }}>
              Edit Store Profile
            </h2>

            <form onSubmit={handleProfileSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Store Name</label>
                <input
                  type="text"
                  required
                  value={profileForm.storeName}
                  onChange={(e) => setProfileForm({ ...profileForm, storeName: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Business Email</label>
                <input
                  type="email"
                  value={profileForm.businessEmail}
                  onChange={(e) => setProfileForm({ ...profileForm, businessEmail: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Logo Image URL</label>
                <input
                  type="text"
                  value={profileForm.logoUrl}
                  onChange={(e) => setProfileForm({ ...profileForm, logoUrl: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={labelStyle}>Store Description</label>
                <textarea
                  rows={3}
                  value={profileForm.description}
                  onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  style={{ flex: 1, padding: '0.75rem', background: 'var(--bg-card)', border: '1px solid var(--border)', color: '#fff', borderRadius: 'var(--radius-btn)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '0.75rem', background: 'var(--gold)', border: 'none', color: '#000', fontWeight: '800', borderRadius: 'var(--radius-btn)', cursor: 'pointer' }}
                >
                  Save Store Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const labelStyle = {
  display: 'block',
  fontSize: '0.85rem',
  color: 'var(--text-secondary)',
  marginBottom: '0.4rem'
}

const inputStyle = {
  width: '100%',
  padding: '0.65rem 1rem',
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-input)',
  color: '#fff',
  outline: 'none'
}
