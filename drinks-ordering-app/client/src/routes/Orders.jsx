import React, { useContext, useEffect, useState, useRef } from 'react'
import NavBar from '../components/NavBar'
import { LightDark, ProductList } from '../contexts/contexts'
import { useAuth } from '../contexts/AuthContext'
import './Orders.css'
import AxiosInstance from '../components/Axios'

const OrdersPage = () => {
  const { theme } = useContext(LightDark)
  const { products } = useContext(ProductList)
  const { isLoggedIn } = useAuth()
  
  const [activeTab, setActiveTab] = useState('active')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const intervalRef = useRef(null)

  // ========== OTP STATE MANAGEMENT ==========
  // TODO: Add state variables for OTP functionality
  // Example: selectedOrderId, otpCode, otpLoading, otpError
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [otpCode, setOtpCode] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState(null)
  const [otpVisible, setOtpVisible] = useState(false)
  const [fetchedOtp, setFetchedOtp] = useState(null)

  const fetchOrders = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true)
      setError(null)
      
      const res = await AxiosInstance.get('/api/orders/')
      console.log('Orders API response:', res.data)
      
      const sortedOrders = res.data.sort((a, b) => {
        const dateA = new Date(a.created_at || a.date)
        const dateB = new Date(b.created_at || b.date)
        return dateB - dateA
      })
      
      setOrders(sortedOrders)
    } catch (err) {
      console.error('Error fetching orders:', err)
      setError('Failed to load orders. Please try again.')
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  // ========== OTP FETCH FUNCTION ==========
  // TODO: Implement function to fetch OTP for an order
  // This should call GET /api/orders/{id}/otp/ endpoint (id being the order ID)
  /*
  const fetchOrderOtp = async (orderId) => {}
  */
 const fetchOrderOtp = async (orderId) => {
    try {
      setOtpLoading(true)
      setOtpError(null)
      
      const res = await AxiosInstance.get(`/api/orders/${orderId}/otp/`)
      console.log('OTP Fetch response:', res.data)

      setFetchedOtp(res.data.otp)
      setSelectedOrderId(orderId)
      setOtpVisible(true)

      return res.data
    } catch (err) {
      console.error('Error fetching OTP:', err)
      setOtpError('Failed to fetch OTP. Please try again.')
      throw err
    } finally {
      setOtpLoading(false)
    }
  }

  // ========== OTP VERIFICATION FUNCTION ==========
  // TODO: Implement function to verify OTP
  // This should call POST /api/orders/{id}/otp/verify/ endpoint
  /*
  const verifyOrderOtp = async (orderId, otpCode) => {}
  */

  const cancelOrder = async (orderId) => {
    try {
      await AxiosInstance.delete(`/api/orders/${orderId}/`)
      alert('Order cancelled successfully!')
      fetchOrders()
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
    if (isLoggedIn) {
      fetchOrders()

      intervalRef.current = setInterval(() => {
        fetchOrders(false)
      }, 5000)

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isLoggedIn])

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

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

  if (!isLoggedIn) {
    return (
      <div className="orderswrapper" id={theme}>
        <NavBar />
        <div className="orders-content">
          <p className="login-message">Please log in to view your orders.</p>
        </div>
      </div>
    )
  }

  // ========== OTP UI ==========
  // TODO: Do whatever is needed to show OTP when required
  // For this, it is completely up to you how you want to implement it ! Good luck ! :)
  // You might want to add a modal or a section in the order card to display OTP
  // Or just display it on the card directly using existing CSS styles in Orders.css
  // You can be fancy with it or keep it simple, your choice ! :) Go wild, lol
  const OtpVisiblity = () => (
    otpVisible && (
      <div className="otp-modal" onClick={() => setOtpVisible(false)}>
        <div className="otp-content" onClick={(e) => e.stopPropagation()}>
          <div className= "otp-header">
            <h2>Order OTP</h2>
            <button className="close-button" onClick={() => setOtpVisible(false)}>X</button>
          </div>
          
          <div className="otp-body">
            {fetchedOtp && (
              <div className="otp-display">
                <p>Your OTP for order #{selectedOrderId} is:</p>
                <h3 className="otp-code">{fetchedOtp}</h3>
                <p>Please provide this OTP when collecting your order.</p>
              </div>
            )}

            <div className="otp-input">
              <label htmlFor="otp">Enter OTP to verify:</label>
              <input 
                type="text"
                id="otp"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                maxLength={6}
                placeholder="Enter OTP"
                className="otp"
              />
            </div>
            {otpError && (
              <div className="otp-error">
                <p>{otpError}</p>
              </div>
            )}
          </div>

          <div className='otp-footer'>
            <button 
              className="verify-button"
              onClick={() => verifyOrderOtp(selectedOrderId, otpCode)}
              disabled={otpLoading || !otpCode}
            >
              {otpLoading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button
              onClick={() => setShowOtpModal(false)}
              className="btn-cancel"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  )
  return (
    <div className="orderswrapper" id={theme}>
      <NavBar />
      <OtpVisiblity />
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
            <button onClick={() => fetchOrders(true)} className="retry-button">
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

                      {activeTab === 'active' && (
                        order.status?.toLowerCase() === 'ready' || 
                        order.status?.toLowerCase() === 'preparing'
                      ) && (
                        <button 
                          className="otp-button"
                          onClick={() => fetchOrderOtp(order.id)}
                          disabled={otpLoading}
                        >
                          {otpLoading && selectedOrderId === order.id ? 'Loading...' : 'Get OTP'}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="order-items">
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item, index) => {
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