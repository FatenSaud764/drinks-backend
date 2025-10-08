import React, { useContext, useEffect, useState, useRef } from 'react'
import NavBar from '../components/NavBar'
import { LightDark, ProductList } from '../contexts/contexts'
import { useAuth } from '../contexts/AuthContext'
import './Orders.css'
import AxiosInstance from '../components/Axios'
import { useCallback } from 'react'

const OrdersPage = () => {
  const { theme } = useContext(LightDark)
  const { products } = useContext(ProductList)
  const { isLoggedIn } = useAuth()
  
  const [activeTab, setActiveTab] = useState('active')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const intervalRef = useRef(null)

  // OTP states
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState(null)
  const [otpVisible, setOtpVisible] = useState(false)
  const [fetchedOtp, setFetchedOtp] = useState(null)

  const fetchOrders = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true)
      setError(null)
      
      const res = await AxiosInstance.get('/api/orders/')
      console.log('Fetched orders:', res.data)
      
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

  // This function fetches the OTP for a given order ID
  const fetchOrderOtp = useCallback(async (orderId) => {
    try {
      setSelectedOrderId(orderId)
      setOtpVisible(true)
      setOtpLoading(true)
      setOtpError(null)
      setFetchedOtp(null)

      const res = await AxiosInstance.get(`/api/orders/${orderId}/otp/`)
  

      setFetchedOtp(res.data.code)

      return res.data
    } catch (err) {
      console.error('Error fetching OTP:', err)
      setOtpError('Failed to fetch OTP. Please try again.')
      throw err
    } finally {
      setOtpLoading(false)
    }
  },[])

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
      }, 4000)

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
  }, [isLoggedIn, selectedOrderId, otpVisible])

  useEffect(() => {
    const order = orders.find(order => order.id === selectedOrderId)
    if(order) {
      if(order.status?.toLowerCase()==='completed'){setOtpVisible(false)}
    }
  }, [orders, selectedOrderId])

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  console.log('visible', otpVisible);

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
        return '#28a745'
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

  // OTP Modal Component
  const OtpVisiblity = () => (
    otpVisible && (
      <div className="otp-modal" onClick={() => setOtpVisible(false)}>
        <div className="otp-content" onClick={(e) => e.stopPropagation()}>
          <div className="otp-header">
            <h2>Order Pickup Code</h2>
            <button className="close-button" onClick={() => setOtpVisible(false)}>×</button>
          </div>
          
          {selectedOrderId && (
            <div className="order-subtitle">Order #{selectedOrderId}</div>
          )}
          
          <div className="otp-body">
            {fetchedOtp ? (
              <>
                <p className="pickup-code-text">Your pickup code is:</p>
                <div className="otp-display">
                  <div className="otp-code">{fetchedOtp}</div>
                </div>
                <p className="instruction-text">
                  Show this code to the staff when collecting your order.
                </p>
              </>
            ) : (
              <div className="loading">Loading your pickup code...</div>
            )}
            
            {otpError && (
              <div className="otp-error">{otpError}</div>
            )}
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

                      {activeTab === 'active' && order.status?.toLowerCase() === 'ready' && (
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
                        const unitPrice = getProductPrice(drinkId)
                        const totalPrice = unitPrice * quantity
                        
                        return (
                          <div key={index} className="order-item">
                            <div className="item-display">
                              <span className="item-main">
                                {quantity}x {getProductName(drinkId)}
                              </span>
                              <span className="unit-price">
                                | @R{unitPrice.toFixed(2)}
                              </span>
                            </div>
                            <span className="item-total">
                              R{totalPrice.toFixed(2)}
                            </span>
                          </div>
                        )
                      })
                    ) : (
                      <div className="order-item">
                        <span className="item-display">No items found</span>
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