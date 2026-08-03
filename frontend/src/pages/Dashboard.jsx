import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import ProductCatalog from '../components/ProductCatalog'
import CustomerModule from '../components/CustomerModule'
import VendorModule from '../components/VendorModule'
import AdminModule from '../components/AdminModule'
import CustomerService from '../services/CustomerService'
import AuthService from '../services/AuthService'

export default function Dashboard() {
  const user = AuthService.getCurrentUser()
  const role = user?.role || 'CUSTOMER'

  const [activeTab, setActiveTab] = useState('store')
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)

  const updateCartCount = async () => {
    if (!user?.id) return
    try {
      const items = await CustomerService.getCart(user.id)
      setCartCount(items.length)
    } catch (err) {
      console.error('Failed to fetch cart count:', err)
    }
  }

  useEffect(() => {
    updateCartCount()
  }, [user?.id])

  return (
    <div className="dashboard-bg" style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Top Navigation Bar */}
      <Navbar
        cartCount={cartCount}
        onOpenCart={() => setIsCartOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Module Content */}
      <main className="dashboard-content" style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {activeTab === 'store' && (
          <ProductCatalog
            onAddToCartSuccess={() => {
              updateCartCount()
              setIsCartOpen(true)
            }}
          />
        )}

        {activeTab === 'customer' && (
          <CustomerModule
            isCartOpen={isCartOpen}
            onCloseCart={() => setIsCartOpen(false)}
            onCartUpdated={(cnt) => setCartCount(cnt)}
          />
        )}

        {activeTab === 'vendor' && (
          <VendorModule />
        )}

        {activeTab === 'admin' && (
          <AdminModule />
        )}
      </main>

      {/* Cart Modal when open from Store or Navbar */}
      {activeTab !== 'customer' && (
        <CustomerModule
          isCartOpen={isCartOpen}
          onCloseCart={() => setIsCartOpen(false)}
          onCartUpdated={(cnt) => setCartCount(cnt)}
        />
      )}
    </div>
  )
}
