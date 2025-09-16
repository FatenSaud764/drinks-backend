import React, { useContext, useEffect, useState } from 'react'
import NavBar from '../components/NavBar'
import { AccessTokens, LightDark, ProductList } from '../contexts/contexts'
import './Orders.css'
import AxiosInstance from '../components/Axios'

const OrdersPage = () => {
  const { theme } = useContext(LightDark)
  const { products } = useContext(ProductList)
  const { accessToken } = useContext(AccessTokens)
  const [activeTab, setActiveTab] = useState('active')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // The API endpoint should automatically return orders for the authenticated user
      // based on the Bearer token provided in the Authorization header
      const res = await AxiosInstance.get('/api/orders/', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      
      // Log the response for debugging
      console.log('Orders API response:', res.data)
      
      // Sort orders by created_at date (most recent first)
      const sortedOrders = res.data.sort((a, b) => {
        const dateA = new Date(a.created_at || a.date)
        const dateB = new Date(b.created_at || b.date)
        return dateB - dateA // Most recent first
      })
      
      setOrders(sortedOrders)
    } catch (err) {
      console.error('Error fetching orders:', err)
      setError('Failed to load orders. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const cancelOrder = async (orderId) => {
    try {
      // Use the DELETE endpoint to cancel a specific order
      await AxiosInstance.delete(`/api/orders/${orderId}/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      alert('Order cancelled successfully!')
      fetchOrders() // Refresh orders after cancellation
    } catch (err) {
      console.error('Error cancelling order:', err)
      if (err.response?.status === 404) {
        alert('Order not found or already cancelled')
      } else if (err.response?.status === 403) {
        alert('You are not authorized to cancel this order')
      } else {
        alert('Failed to cancel order. Please try again.')
      }
    }
  }

  useEffect(() => {
    if (accessToken && accessToken !== 'null') {
      fetchOrders()
    }
  }, [accessToken])

  const getProductName = (drinkId) => {
    if (!products || products.length === 0) {
      return 'Loading...'
    }
    const product = products.find(p => p.id === drinkId)
    return product ? product.name : `Product ID: ${drinkId}`
  }

  const getProductPrice = (drinkId) => {
    if (!products || products.length === 0) {
      return 0
    }
    const product = products.find(p => p.id === drinkId)
    return product ? parseFloat(product.price) : 0
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return '#f59e0b'
      case 'completed':
        return '#10b981'
      case 'cancelled':
        return '#ef4444'
      case 'preparing':
        return '#3b82f6'
      case 'ready':
        return '#10b981'
      default:
        return '#6b7280'
    }
  }

  const activeOrders = orders.filter(order => 
    order.status?.toLowerCase() === 'pending' || 
    order.status?.toLowerCase() === 'preparing' ||
    order.status?.toLowerCase() === 'ready'
  )

  const pastOrders = orders.filter(order => 
    order.status?.toLowerCase() === 'completed' || 
    order.status?.toLowerCase() === 'cancelled'
  )

  const currentOrders = activeTab === 'active' ? activeOrders : pastOrders

  if (!accessToken || accessToken === 'null') {
    return (
      <div className="orderswrapper" id={theme}>
        <NavBar />
        <div className="orders-content">
          <p className="login-message">Please log in to view your orders.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="orderswrapper" id={theme}>
      <NavBar />
      <div className="orders-content">
        <h1 className="orders-title">My Orders</h1>
        
        <div className="orders-tabs">
          <button 
            className={`tab-button ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            Active ({activeOrders.length})
          </button>
          <button 
            className={`tab-button ${activeTab === 'past' ? 'active' : ''}`}
            onClick={() => setActiveTab('past')}
          >
            Past ({pastOrders.length})
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading your orders...</div>
        ) : error ? (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={fetchOrders} className="retry-button">
              Retry
            </button>
          </div>
        ) : (
          <div className="orders-list">
            {currentOrders.length === 0 ? (
              <div className="no-orders">
                <p>
                  {activeTab === 'active' 
                    ? "You don't have any active orders at the moment." 
                    : "You don't have any past orders yet."}
                </p>
                {activeTab === 'active' && orders.length === 0 && (
                  <p>Start shopping to see your orders here!</p>
                )}
              </div>
            ) : (
              currentOrders.map((order) => (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <div className="order-info">
                      <h3>Order #{order.id}</h3>
                      <span className="order-date">{formatDate(order.created_at || order.date)}</span>
                    </div>
                    <div className="order-status-section">
                      <span 
                        className="order-status"
                        style={{ backgroundColor: getStatusColor(order.status) }}
                      >
                        {order.status || 'Pending'}
                      </span>
                      {activeTab === 'active' && order.status?.toLowerCase() === 'pending' && (
                        <button 
                          className="cancel-button"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to cancel this order?')) {
                              cancelOrder(order.id)
                            }
                          }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="order-items">
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item, index) => {
                        // Handle nested item structure
                        const drinkId = item.drink_id || item.drink || item.product_id
                        const quantity = item.quantity || 1
                        
                        return (
                          <div key={index} className="order-item">
                            <div className="item-details">
                              <span className="item-name">{getProductName(drinkId)}</span>
                              <span className="item-quantity">Qty: {quantity}</span>
                            </div>
                            <span className="item-total">
                              R{(getProductPrice(drinkId) * quantity).toFixed(2)}
                            </span>
                          </div>
                        )
                      })
                    ) : (
                      <div className="order-item">
                        <div className="item-details">
                          <span className="item-name">No items found</span>
                          <span className="item-quantity">Check order details</span>
                        </div>
                        <span className="item-total">R0.00</span>
                      </div>
                    )}
                  </div>

                  <div className="order-footer">
                    <span className="order-total">
                      Total: R{
                        order.total_price 
                          ? parseFloat(order.total_price).toFixed(2)
                          : order.items && order.items.length > 0
                            ? order.items.reduce((sum, item) => {
                                const drinkId = item.drink_id || item.drink || item.product_id
                                const price = getProductPrice(drinkId)
                                const quantity = item.quantity || 1
                                return sum + (price * quantity)
                              }, 0).toFixed(2)
                            : '0.00'
                      }
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default OrdersPage