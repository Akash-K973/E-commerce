import { useState, useEffect } from 'react'
import CustomerService from '../services/CustomerService'
import AuthService from '../services/AuthService'

export default function CustomerModule({ isCartOpen, onCloseCart, onCartUpdated }) {
  const user = AuthService.getCurrentUser()
  const [cartItems, setCartItems] = useState([])
  const [orders, setOrders] = useState([])
  const [loadingCart, setLoadingCart] = useState(false)
  const [loadingOrders, setLoadingOrders] = useState(false)

  // Checkout Form State
  const [isCheckout, setIsCheckout] = useState(false)
  const [shippingAddress, setShippingAddress] = useState('123 Luxury Way, Beverly Hills, CA 90210')
  const [placingOrder, setPlacingOrder] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(null)

  const fetchCart = async () => {
    if (!user?.id) return
    setLoadingCart(true)
    try {
      const data = await CustomerService.getCart(user.id)
      setCartItems(data)
      if (onCartUpdated) onCartUpdated(data.length)
    } catch (err) {
      console.error('Error loading cart:', err)
    } finally {
      setLoadingCart(false)
    }
  }

  const fetchOrders = async () => {
    if (!user?.id) return
    setLoadingOrders(true)
    try {
      const data = await CustomerService.getCustomerOrders(user.id)
      setOrders(data)
    } catch (err) {
      console.error('Error loading orders:', err)
    } finally {
      setLoadingOrders(false)
    }
  }

  useEffect(() => {
    fetchCart()
    fetchOrders()
  }, [user?.id])

  const handleUpdateQuantity = async (cartItemId, newQty) => {
    try {
      await CustomerService.updateCartQuantity(cartItemId, newQty)
      fetchCart()
    } catch (err) {
      console.error('Error updating quantity:', err)
    }
  }

  const handleRemoveItem = async (cartItemId) => {
    try {
      await CustomerService.removeFromCart(cartItemId)
      fetchCart()
    } catch (err) {
      console.error('Error removing cart item:', err)
    }
  }

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault()
    if (!user?.id) return
    setPlacingOrder(true)
    try {
      const newOrder = await CustomerService.checkout(
        user.id,
        user.fullName || user.username || 'Customer',
        shippingAddress
      )
      setOrderSuccess(newOrder)
      setIsCheckout(false)
      fetchCart()
      fetchOrders()
    } catch (err) {
      console.error('Checkout error:', err)
      alert(err.response?.data?.message || 'Checkout failed. Ensure cart is not empty.')
    } finally {
      setPlacingOrder(false)
    }
  }

  const calculateSubtotal = () => {
    return cartItems.reduce((acc, item) => {
      const price = item.product?.price || 0
      return acc + (Number(price) * item.quantity)
    }, 0)
  }

  return (
    <div>
      {/* Shopping Cart Modal / Drawer */}
      {isCartOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 1050,
            display: 'flex',
            justifyContent: 'flex-end'
          }}
          onClick={onCloseCart}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '450px',
              height: '100%',
              background: 'var(--bg-secondary)',
              borderLeft: '1px solid var(--border-focus)',
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-lg)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#fff' }}>
                Your Luxury Cart ({cartItems.length})
              </h2>
              <button
                onClick={onCloseCart}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Cart Items List */}
            <div style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem' }}>
              {cartItems.length === 0 ? (
                <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛍️</div>
                  Your cart is empty
                </div>
              ) : (
                cartItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '1rem',
                      display: 'flex',
                      gap: '1rem',
                      alignItems: 'center'
                    }}
                  >
                    <img
                      src={item.product?.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&q=80'}
                      alt={item.product?.name}
                      style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }}
                    />
                    <div style={{ flexGrow: 1 }}>
                      <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#fff' }}>{item.product?.name}</div>
                      <div style={{ color: 'var(--gold)', fontWeight: '700', fontSize: '0.9rem', marginTop: '0.2rem' }}>
                        ${Number(item.product?.price || 0).toLocaleString()}
                      </div>

                      {/* Quantity Controls */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          style={qtyBtnStyle}
                        >-</button>
                        <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          style={qtyBtnStyle}
                        >+</button>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem' }}
                    >
                      🗑️
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer / Checkout Button */}
            {cartItems.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '800' }}>
                  <span>Subtotal:</span>
                  <span style={{ color: 'var(--gold)' }}>${calculateSubtotal().toLocaleString()}</span>
                </div>

                <button
                  onClick={() => setIsCheckout(true)}
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    background: 'var(--gold)',
                    color: '#000',
                    border: 'none',
                    borderRadius: 'var(--radius-btn)',
                    fontWeight: '800',
                    fontSize: '1rem',
                    cursor: 'pointer'
                  }}
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckout && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
            zIndex: 1100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem'
          }}
          onClick={() => setIsCheckout(false)}
        >
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-focus)',
              borderRadius: 'var(--radius-card)',
              maxWidth: '500px', width: '100%', padding: '2rem'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--gold)', marginBottom: '1rem' }}>
              Checkout Order
            </h2>

            <form onSubmit={handleCheckoutSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Customer Name
                </label>
                <input
                  type="text"
                  readOnly
                  value={user?.fullName || user?.username || 'Customer'}
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Shipping Address
                </label>
                <textarea
                  rows={3}
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  required
                />
              </div>

              <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  <span>Total Items:</span>
                  <strong style={{ color: '#fff' }}>{cartItems.reduce((a, b) => a + b.quantity, 0)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: '800' }}>
                  <span>Total Payable:</span>
                  <span style={{ color: 'var(--gold)' }}>${calculateSubtotal().toLocaleString()}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsCheckout(false)}
                  style={{ flex: 1, padding: '0.75rem', background: 'var(--bg-card)', border: '1px solid var(--border)', color: '#fff', borderRadius: 'var(--radius-btn)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={placingOrder}
                  style={{ flex: 1, padding: '0.75rem', background: 'var(--gold)', border: 'none', color: '#000', fontWeight: '800', borderRadius: 'var(--radius-btn)', cursor: 'pointer' }}
                >
                  {placingOrder ? 'Processing...' : 'Confirm Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Banner */}
      {orderSuccess && (
        <div style={{ padding: '1.5rem', background: 'rgba(22,163,74,0.15)', border: '1px solid var(--success)', borderRadius: '16px', color: '#86efac', marginBottom: '2rem' }}>
          ✨ <strong>Order Placed Successfully!</strong> Order ID: #{orderSuccess.id}. Shipping to: {orderSuccess.shippingAddress}. Total: ${Number(orderSuccess.totalAmount).toLocaleString()}
        </div>
      )}

      {/* Order History Timeline */}
      <div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '1.5rem', fontFamily: 'Manrope, sans-serif' }}>
          Customer Dashboard & Order History
        </h2>

        {loadingOrders ? (
          <div style={{ color: 'var(--gold)' }}>Loading order history...</div>
        ) : orders.length === 0 ? (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '2.5rem', borderRadius: 'var(--radius-card)', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No order history found yet. Explore the Storefront catalog to place your first luxury order!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {orders.map((order) => (
              <div
                key={order.id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-card)',
                  padding: '1.5rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                  <div>
                    <span style={{ fontWeight: '800', color: 'var(--gold)', fontSize: '1.1rem' }}>
                      Order #{order.id}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '1rem' }}>
                      {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Recent'}
                    </span>
                  </div>

                  <span className="badge badge-green">{order.status || 'PROCESSING'}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                  {order.items?.map((item) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <img src={item.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=60&q=80'} alt="" style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} />
                        <span>{item.productName} (x{item.quantity})</span>
                      </div>
                      <span style={{ color: 'var(--gold)', fontWeight: '700' }}>
                        ${(Number(item.price) * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.9rem' }}>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    Shipping: <strong style={{ color: '#fff' }}>{order.shippingAddress}</strong>
                  </div>
                  <div>
                    Total Paid: <strong style={{ color: 'var(--gold)', fontSize: '1.1rem' }}>${Number(order.totalAmount).toLocaleString()}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const qtyBtnStyle = {
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border)',
  color: '#fff',
  width: '24px',
  height: '24px',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: '700'
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
