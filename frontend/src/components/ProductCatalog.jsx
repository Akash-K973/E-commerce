import { useState, useEffect } from 'react'
import ProductService from '../services/ProductService'
import CustomerService from '../services/CustomerService'
import AuthService from '../services/AuthService'

export default function ProductCatalog({ onAddToCartSuccess }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [addingId, setAddingId] = useState(null)

  const categories = ['ALL', 'Watches', 'Electronics', 'Fashion', 'Fragrance']

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const data = await ProductService.getAllProducts(search, selectedCategory, true)
      setProducts(data)
      setError('')
    } catch (err) {
      console.error('Error fetching products:', err)
      setError('Failed to load products. Make sure backend is running.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [search, selectedCategory])

  const handleAddToCart = async (product) => {
    const user = AuthService.getCurrentUser()
    if (!user) {
      alert('Please log in to add items to your cart.')
      return
    }
    if (!product.stockQuantity || product.stockQuantity <= 0) {
      alert('This product is out of stock.')
      return
    }
    setAddingId(product.id)
    try {
      await CustomerService.addToCart(user.id, product.id, 1)
      if (onAddToCartSuccess) onAddToCartSuccess()
    } catch (err) {
      console.error('Add to cart error:', err)
      alert(err.response?.data?.message || err.message || 'Could not add item to cart.')
    } finally {
      setAddingId(null)
    }
  }

  return (
    <div style={{ padding: '2rem 0' }}>
      {/* Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(10,10,10,0.9) 100%)',
          border: '1px solid var(--border-focus)',
          borderRadius: 'var(--radius-card)',
          padding: '2.5rem',
          marginBottom: '2rem',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div>
          <span style={{ color: 'var(--gold)', fontSize: '0.85rem', letterSpacing: '0.15em', fontWeight: '700', textTransform: 'uppercase' }}>
            Curated Atelier Collection
          </span>
          <h1 style={{ fontSize: '2.25rem', margin: '0.5rem 0', fontWeight: '800', fontFamily: 'Manrope, sans-serif' }}>
            Elevate Your Standard
          </h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', fontSize: '0.95rem' }}>
            Discover hand-crafted timepieces, bespoke audio gear, and luxury essentials carefully verified by Obsidian Atelier.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        {/* Category Chips */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                background: selectedCategory === cat ? 'var(--gold)' : 'var(--bg-card)',
                color: selectedCategory === cat ? '#000' : 'var(--text-secondary)',
                border: '1px solid ' + (selectedCategory === cat ? 'var(--gold)' : 'var(--border)'),
                padding: '0.5rem 1.25rem',
                borderRadius: 'var(--radius-btn)',
                fontWeight: selectedCategory === cat ? '700' : '500',
                cursor: 'pointer',
                transition: 'var(--transition)'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="catalog-search-container" style={{ position: 'relative', width: '300px', maxWidth: '100%' }}>
          <input
            type="text"
            placeholder="Search catalog..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.65rem 1rem 0.65rem 2.5rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-search)',
              color: '#fff',
              outline: 'none'
            }}
          />
          <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>
            🔍
          </span>
        </div>
      </div>

      {/* Loading & Error Messages */}
      {loading && <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gold)' }}>Loading luxury products...</div>}
      {error && <div style={{ padding: '1rem', background: 'rgba(220,38,38,0.15)', border: '1px solid var(--error)', borderRadius: '12px', color: '#fca5a5' }}>{error}</div>}

      {/* Product Grid */}
      {!loading && !error && (
        <div className="product-grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))', gap: '1.5rem' }}>
          {products.map((product) => (
            <div
              key={product.id}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-card)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                transition: 'var(--transition)',
                cursor: 'pointer'
              }}
              className="product-card"
            >
              {/* Product Image */}
              <div
                style={{ height: '220px', overflow: 'hidden', position: 'relative', background: '#141414' }}
                onClick={() => setSelectedProduct(product)}
              >
                <img
                  src={product.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80'}
                  alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'var(--transition-slow)' }}
                />
                {product.discount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      background: 'rgba(239,68,68,0.9)',
                      color: '#fff',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '800',
                      backdropFilter: 'blur(8px)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
                    }}
                  >
                    {product.discount}% OFF
                  </span>
                )}
                <span
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'rgba(0,0,0,0.75)',
                    color: 'var(--gold)',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    backdropFilter: 'blur(8px)'
                  }}
                >
                  ★ {product.rating || 4.9}
                </span>
                <span
                  style={{
                    position: 'absolute',
                    bottom: '12px',
                    left: '12px',
                    background: 'var(--gold-dim)',
                    border: '1px solid var(--border-focus)',
                    color: 'var(--gold)',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '0.7rem',
                    fontWeight: '600'
                  }}
                >
                  {product.category || 'Luxury'}
                </span>
              </div>

              {/* Product Info */}
              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                  {product.vendorName || 'Obsidian Seller'}
                </div>
                <h3
                  onClick={() => setSelectedProduct(product)}
                  style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem', color: '#fff', cursor: 'pointer' }}
                >
                  {product.name}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.4', marginBottom: '1rem', flexGrow: 1 }}>
                  {product.description?.length > 70 ? `${product.description.substring(0, 70)}...` : product.description}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                  <div>
                    {product.discount > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                          ${Number(product.price).toLocaleString()}
                        </span>
                        <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--gold)' }}>
                          ${Number(product.discountedPrice).toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--gold)' }}>
                        ${product.price ? Number(product.price).toLocaleString() : '0.00'}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={addingId === product.id || !product.stockQuantity || product.stockQuantity <= 0}
                    style={{
                      background: (!product.stockQuantity || product.stockQuantity <= 0) ? 'var(--bg-card)' : 'var(--gold)',
                      color: (!product.stockQuantity || product.stockQuantity <= 0) ? 'var(--text-muted)' : '#000',
                      border: (!product.stockQuantity || product.stockQuantity <= 0) ? '1px solid var(--border)' : 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: 'var(--radius-btn)',
                      fontWeight: '700',
                      cursor: (!product.stockQuantity || product.stockQuantity <= 0) ? 'not-allowed' : 'pointer',
                      fontSize: '0.85rem',
                      transition: 'var(--transition)'
                    }}
                  >
                    {addingId === product.id ? 'Adding...' : (!product.stockQuantity || product.stockQuantity <= 0) ? 'Out of Stock' : '+ Add'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(12px)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '1rem'
          }}
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="product-detail-modal-inner"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ width: '45%', background: '#000' }}>
              <img
                src={selectedProduct.imageUrl}
                alt={selectedProduct.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div style={{ width: '55%', padding: '2rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge badge-purple">{selectedProduct.category}</span>
                <button
                  onClick={() => setSelectedProduct(null)}
                  style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.25rem', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginTop: '0.75rem', marginBottom: '0.5rem' }}>
                {selectedProduct.name}
              </h2>
              <div style={{ marginBottom: '1rem' }}>
                {selectedProduct.discount > 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--gold)', fontSize: '1.5rem', fontWeight: '800' }}>
                      ${Number(selectedProduct.discountedPrice).toLocaleString()}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '1.1rem', textDecoration: 'line-through' }}>
                      ${Number(selectedProduct.price).toLocaleString()}
                    </span>
                    <span style={{ background: 'rgba(239,68,68,0.2)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.4)', padding: '2px 8px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '800' }}>
                      {selectedProduct.discount}% OFF
                    </span>
                  </div>
                ) : (
                  <div style={{ color: 'var(--gold)', fontSize: '1.5rem', fontWeight: '800' }}>
                    ${Number(selectedProduct.price).toLocaleString()}
                  </div>
                )}
              </div>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                {selectedProduct.description}
              </p>

              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                <div>SKU: <strong style={{ color: '#fff' }}>{selectedProduct.sku || 'N/A'}</strong></div>
                <div>Vendor: <strong style={{ color: '#fff' }}>{selectedProduct.vendorName || 'Obsidian Seller'}</strong></div>
                <div>Stock Status: <strong style={{ color: selectedProduct.stockQuantity > 0 ? '#10b981' : '#ef4444' }}>{selectedProduct.stockQuantity > 0 ? `${selectedProduct.stockQuantity} units available` : 'Out of Stock'}</strong></div>
              </div>

              <button
                onClick={() => {
                  handleAddToCart(selectedProduct)
                  setSelectedProduct(null)
                }}
                disabled={!selectedProduct.stockQuantity || selectedProduct.stockQuantity <= 0}
                style={{
                  marginTop: 'auto',
                  width: '100%',
                  padding: '0.85rem',
                  background: (!selectedProduct.stockQuantity || selectedProduct.stockQuantity <= 0) ? 'var(--bg-card)' : 'var(--gold)',
                  color: (!selectedProduct.stockQuantity || selectedProduct.stockQuantity <= 0) ? 'var(--text-muted)' : '#000',
                  border: (!selectedProduct.stockQuantity || selectedProduct.stockQuantity <= 0) ? '1px solid var(--border)' : 'none',
                  borderRadius: 'var(--radius-btn)',
                  fontWeight: '800',
                  fontSize: '1rem',
                  cursor: (!selectedProduct.stockQuantity || selectedProduct.stockQuantity <= 0) ? 'not-allowed' : 'pointer'
                }}
              >
                {(!selectedProduct.stockQuantity || selectedProduct.stockQuantity <= 0) ? '❌ Out of Stock' : '🛒 Add to Cart'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
