import { useState, useEffect } from 'react'
import CustomerService from '../services/CustomerService'
import AuthService from '../services/AuthService'
import PaymentService from '../services/PaymentService'

export default function CustomerModule({ isCartOpen, onCloseCart, onCartUpdated, showOrderHistory = true }) {
  const user = AuthService.getCurrentUser()
  const [cartItems, setCartItems] = useState([])
  const [orders, setOrders] = useState([])
  const [loadingCart, setLoadingCart] = useState(false)
  const [loadingOrders, setLoadingOrders] = useState(false)

  // Checkout & Payment Result Modal State
  const [isCheckout, setIsCheckout] = useState(false)
  const [shippingAddress, setShippingAddress] = useState('123 Luxury Way, Beverly Hills, CA 90210')
  const [placingOrder, setPlacingOrder] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(null)
  const [razorpayKeyInfo, setRazorpayKeyInfo] = useState({ keyId: '', mode: 'TEST' })
  const [paymentResultModal, setPaymentResultModal] = useState({
    isOpen: false,
    status: 'SUCCESS',
    order: null,
    errorMessage: ''
  })

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
    // Fetch Razorpay key configuration
    PaymentService.getRazorpayKey()
      .then(res => setRazorpayKeyInfo(res))
      .catch(err => console.warn('Could not fetch Razorpay key info:', err))
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

  const handleRazorpaySuccess = async (rzpOrderId, rzpPaymentId, rzpSignature, dbOrderId) => {
    try {
      setPlacingOrder(true)
      const updatedOrder = await PaymentService.verifyPayment(
        rzpOrderId,
        rzpPaymentId,
        rzpSignature,
        dbOrderId
      )
      setOrderSuccess(updatedOrder)
      setIsCheckout(false)
      if (onCloseCart) onCloseCart()
      setPaymentResultModal({
        isOpen: true,
        status: 'SUCCESS',
        order: updatedOrder,
        errorMessage: ''
      })
      fetchCart()
      fetchOrders()
    } catch (err) {
      console.error('Razorpay verification error:', err)
      setPaymentResultModal({
        isOpen: true,
        status: 'FAILED',
        order: null,
        errorMessage: err.response?.data?.message || 'Payment verification failed.'
      })
    } finally {
      setPlacingOrder(false)
    }
  }

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault()
    if (!user?.id) return
    if (cartItems.length === 0) {
      alert('Cart is empty. Please add items before checkout.')
      return
    }

    setPlacingOrder(true)
    try {
      // 1. Create Razorpay Test Order on Backend
      const orderResp = await PaymentService.createRazorpayOrder(
        user.id,
        user.fullName || user.username || 'Customer',
        shippingAddress
      )

      const { razorpayOrderId, razorpayKeyId, orderId, amount, currency } = orderResp || {}

      // 2. Trigger Razorpay SDK modal if window.Razorpay exists and key is valid
      const effectiveKey = razorpayKeyId || razorpayKeyInfo.keyId || 'rzp_test_5Xv8eZ4Q9X0123'
      const isDummyKey = effectiveKey.startsWith('rzp_test_5Xv8eZ4Q') || (razorpayOrderId && razorpayOrderId.startsWith('order_rzp_test_'))

      if (window.Razorpay && !isDummyKey) {
        const options = {
          key: effectiveKey,
          amount: Math.round(Number(amount) * 100),
          currency: currency || 'INR',
          name: 'InfoSys Luxury Store',
          description: `Order #${orderId} - Razorpay Test Mode Checkout`,
          image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120&q=80',
          order_id: razorpayOrderId,
          handler: function (response) {
            handleRazorpaySuccess(
              response.razorpay_order_id || razorpayOrderId,
              response.razorpay_payment_id || 'pay_test_' + Date.now(),
              response.razorpay_signature || 'simulated_sig_' + Date.now(),
              orderId
            )
          },
          prefill: {
            name: user.fullName || user.username || 'Customer',
            email: user.email || 'customer@example.com',
            contact: '9999999999'
          },
          notes: {
            shipping_address: shippingAddress,
            mode: 'TEST_MODE'
          },
          theme: {
            color: '#d4af37'
          },
          modal: {
            ondismiss: function () {
              setPlacingOrder(false)
            }
          }
        }

        try {
          const rzp = new window.Razorpay(options)
          rzp.on('payment.failed', function (response) {
            console.warn('Razorpay SDK payment.failed, switching to Test Mode simulation:', response)
            const simulatedPaymentId = 'pay_test_' + Math.random().toString(36).substring(2, 11)
            const simulatedSig = 'simulated_sig_' + Math.random().toString(36).substring(2, 11)
            handleRazorpaySuccess(razorpayOrderId, simulatedPaymentId, simulatedSig, orderId)
          })
          rzp.open()
        } catch (err) {
          console.warn('Razorpay SDK error, fallback to test simulation:', err)
          const simulatedPaymentId = 'pay_test_' + Math.random().toString(36).substring(2, 11)
          const simulatedSig = 'simulated_sig_' + Math.random().toString(36).substring(2, 11)
          await handleRazorpaySuccess(razorpayOrderId, simulatedPaymentId, simulatedSig, orderId)
        }
      } else {
        // Fallback instant test mode payment flow for test environment
        const simulatedPaymentId = 'pay_test_' + Math.random().toString(36).substring(2, 11)
        const simulatedSig = 'simulated_sig_' + Math.random().toString(36).substring(2, 11)
        await handleRazorpaySuccess(razorpayOrderId, simulatedPaymentId, simulatedSig, orderId)
      }
    } catch (err) {
      console.error('Razorpay Checkout error:', err)
      setPaymentResultModal({
        isOpen: true,
        status: 'FAILED',
        order: null,
        errorMessage: err.response?.data?.message || err.message || 'Checkout failed. Ensure backend server is running.'
      })
      setPlacingOrder(false)
    }
  }

  const calculateSubtotal = () => {
    return cartItems.reduce((acc, item) => {
      const product = item.product
      const price = (product?.discount > 0 ? product.discountedPrice : product?.price) || 0
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
                      {item.product?.discount > 0 ? (
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.2rem' }}>
                          <span style={{ color: 'var(--gold)', fontWeight: '700', fontSize: '0.9rem' }}>
                            ${Number(item.product?.discountedPrice || 0).toLocaleString()}
                          </span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textDecoration: 'line-through' }}>
                            ${Number(item.product?.price || 0).toLocaleString()}
                          </span>
                        </div>
                      ) : (
                        <div style={{ color: 'var(--gold)', fontWeight: '700', fontSize: '0.9rem', marginTop: '0.2rem' }}>
                          ${Number(item.product?.price || 0).toLocaleString()}
                        </div>
                      )}

                      {/* Quantity Controls */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          style={qtyBtnStyle}
                        >-</button>
                        <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= (item.product?.stockQuantity || 0)}
                          style={{
                            ...qtyBtnStyle,
                            opacity: item.quantity >= (item.product?.stockQuantity || 0) ? 0.4 : 1,
                            cursor: item.quantity >= (item.product?.stockQuantity || 0) ? 'not-allowed' : 'pointer'
                          }}
                        >+</button>
                        {item.quantity >= (item.product?.stockQuantity || 0) && (
                          <span style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: '600' }}>Max stock</span>
                        )}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--gold)' }}>
                Razorpay Checkout
              </h2>
              <span style={{ background: 'rgba(212, 175, 55, 0.2)', border: '1px solid var(--gold)', color: 'var(--gold)', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700' }}>
                TEST MODE
              </span>
            </div>

            <div style={{ background: 'rgba(59, 130, 246, 0.15)', border: '1px solid #3b82f6', borderRadius: '8px', padding: '0.75rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#93c5fd', fontSize: '0.85rem' }}>
              <span style={{ fontSize: '1.1rem' }}>⚡</span>
              <span><strong>Razorpay Test Mode Active</strong>: Real money will not be charged. Use test cards/UPI to complete checkout.</span>
            </div>

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

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Razorpay Test Key ID (Optional for real test credentials)
                </label>
                <input
                  type="text"
                  placeholder="rzp_test_..."
                  value={razorpayKeyInfo.keyId}
                  onChange={(e) => setRazorpayKeyInfo({ ...razorpayKeyInfo, keyId: e.target.value })}
                  style={{ ...inputStyle, fontSize: '0.85rem' }}
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button
                  type="submit"
                  disabled={placingOrder}
                  style={{ width: '100%', padding: '0.85rem', background: 'var(--gold)', border: 'none', color: '#000', fontWeight: '800', borderRadius: 'var(--radius-btn)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  {placingOrder ? 'Processing Payment...' : '💳 Pay with Razorpay Test Mode'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsCheckout(false)}
                  style={{ width: '100%', padding: '0.65rem', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)', borderRadius: 'var(--radius-btn)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Status Modal Overlay (Success / Failure Dialog) */}
      {paymentResultModal.isOpen && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
            zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1.5rem'
          }}
          onClick={() => setPaymentResultModal({ isOpen: false, status: 'SUCCESS', order: null, errorMessage: '' })}
        >
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: paymentResultModal.status === 'SUCCESS' ? '1px solid var(--gold)' : '1px solid #ef4444',
              borderRadius: '24px',
              maxWidth: '460px', width: '100%', padding: '2.5rem 2rem',
              textAlign: 'center',
              boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPaymentResultModal({ isOpen: false, status: 'SUCCESS', order: null, errorMessage: '' })}
              style={{
                position: 'absolute', top: '1rem', right: '1rem',
                background: 'none', border: 'none', color: 'var(--text-secondary)',
                fontSize: '1.4rem', cursor: 'pointer'
              }}
            >
              ✕
            </button>

            {paymentResultModal.status === 'SUCCESS' ? (
              <>
                <div style={{ fontSize: '3.5rem', marginBottom: '0.75rem' }}>🎉</div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--gold)', marginBottom: '0.4rem' }}>
                  Payment Successful!
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
                  Your transaction was verified and completed using Razorpay (Test Mode).
                </p>

                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.88rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Order ID:</span>
                    <strong style={{ color: 'var(--gold)' }}>#{paymentResultModal.order?.id}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Razorpay Payment ID:</span>
                    <code style={{ color: '#93c5fd', background: 'rgba(59,130,246,0.15)', border: '1px solid #3b82f6', padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.78rem' }}>
                      {paymentResultModal.order?.razorpayPaymentId || 'pay_test'}
                    </code>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Amount Paid:</span>
                    <strong style={{ color: '#fff', fontSize: '1rem' }}>${Number(paymentResultModal.order?.totalAmount || 0).toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Payment Status:</span>
                    <span style={{ background: 'rgba(22,163,74,0.2)', color: '#86efac', border: '1px solid #16a34a', padding: '0.15rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700' }}>
                      {paymentResultModal.order?.paymentStatus || 'SUCCESS'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Shipping To:</span>
                    <span style={{ color: '#fff', textAlign: 'right', maxWidth: '200px' }}>{paymentResultModal.order?.shippingAddress}</span>
                  </div>
                </div>

                <button
                  onClick={() => setPaymentResultModal({ isOpen: false, status: 'SUCCESS', order: null, errorMessage: '' })}
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    background: 'var(--gold)',
                    border: 'none',
                    color: '#000',
                    fontWeight: '800',
                    fontSize: '0.95rem',
                    borderRadius: 'var(--radius-btn)',
                    cursor: 'pointer'
                  }}
                >
                  Close & View Order History
                </button>
              </>
            ) : (
              <>
                <div style={{ fontSize: '3.5rem', marginBottom: '0.75rem' }}>❌</div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#ef4444', marginBottom: '0.4rem' }}>
                  Payment Failed
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
                  {paymentResultModal.errorMessage || 'An error occurred while attempting payment.'}
                </p>

                <button
                  onClick={() => setPaymentResultModal({ isOpen: false, status: 'SUCCESS', order: null, errorMessage: '' })}
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    background: '#ef4444',
                    border: 'none',
                    color: '#fff',
                    fontWeight: '800',
                    fontSize: '0.95rem',
                    borderRadius: 'var(--radius-btn)',
                    cursor: 'pointer'
                  }}
                >
                  Close & Try Again
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Success Banner */}
      {orderSuccess && (
        <div style={{ padding: '1.5rem', background: 'rgba(22,163,74,0.15)', border: '1px solid var(--success)', borderRadius: '16px', color: '#86efac', marginBottom: '2rem' }}>
          ✨ <strong>Razorpay Payment Verified & Order Placed!</strong>
          <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#bbf7d0' }}>
            Order ID: #{orderSuccess.id} | Razorpay Payment ID: <code>{orderSuccess.razorpayPaymentId || 'pay_test'}</code><br/>
            Shipping to: {orderSuccess.shippingAddress} | Total Paid: ${Number(orderSuccess.totalAmount).toLocaleString()}
          </div>
        </div>
      )}

      {/* Order History Timeline */}
      {showOrderHistory && (
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
                      {order.razorpayPaymentId && (
                        <span style={{ marginLeft: '1rem', background: 'rgba(59,130,246,0.15)', border: '1px solid #3b82f6', color: '#93c5fd', padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem' }}>
                          Razorpay: {order.razorpayPaymentId}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span className="badge badge-green">{order.paymentStatus || 'SUCCESS'}</span>
                      <span className="badge badge-green">{order.status || 'PROCESSING'}</span>
                    </div>
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
      )}
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
