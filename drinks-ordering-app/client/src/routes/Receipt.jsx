import React, { useContext, useRef, useState, useEffect } from 'react';
import { LightDark, ProductList } from '../contexts/contexts';
import { useAuth } from '../contexts/AuthContext';
import './Receipt.css';
import AxiosInstance from '../components/Axios';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const Receipt = ({ order, onClose }) => {
  const { theme } = useContext(LightDark);
  const { products } = useContext(ProductList);
  const { user, accessToken } = useAuth();
  const receiptRef = useRef(null);
  const [contentHeight, setContentHeight] = useState(0);

  const getProductName = (drinkId) => {
    const product = products.find(p => p.id === drinkId);
    return product ? product.name : `Product ID: ${drinkId}`;
  };

  const getProductPrice = (drinkId) => {
    const product = products.find(p => p.id === drinkId);
    return product ? parseFloat(product.price) : 0;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateTotal = () => {
    if (order.total_price) {
      return parseFloat(order.total_price).toFixed(2);
    }
    return order.items.reduce((sum, item) => {
      const drinkId = item.drink_id || item.drink || item.product_id;
      const price = getProductPrice(drinkId);
      const quantity = item.quantity || 1;
      return sum + (price * quantity);
    }, 0).toFixed(2);
  };

  const calculateSubtotal = () => {
    const total = parseFloat(calculateTotal());
    const vat = total * 0.15;
    return (total - vat).toFixed(2);
  };

  const calculateVAT = () => {
    const total = parseFloat(calculateTotal());
    return (total * 0.15).toFixed(2);
  };

  const handleEmailReceipt = async () => {
    try {
      await AxiosInstance.post(
        `/api/orders/${order.id}/email-receipt/`,
        {},
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      alert('Receipt sent to your email!');
    } catch (error) {
      console.error('Error sending receipt:', error);
      alert('Failed to send receipt. Please try again.');
    }
  };

  useEffect(() => {
            if (receiptRef.current) {
              setContentHeight(receiptRef.current.offsetHeight);
            }
          }, [receiptRef]);

  const handlePrint = () => {
  const input = document.getElementById('receipt');

  html2canvas(input, {
    scrollY: -window.scrollY,
    scrollX: -window.scrollX,
    width: input.scrollWidth,
    height: input.scrollHeight,
    windowWidth: input.scrollWidth,
    windowHeight: input.scrollHeight
  }).then((canvas) => {
    const imgData = canvas.toDataURL('image/png');
    

    const imgWidth = 125; 
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    const pdf = new jsPDF('p', 'mm', 'a6');
    
    let heightLeft = imgHeight;
    let position = 0;
    
    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= 150; 
    

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 150;
    }
    
    pdf.save('receipt.pdf');
  });
};


  return (
    <div className="receipt-overlay" onClick={onClose}>
      <div className="receipt-container" id={'receipt'} onClick={(e) => e.stopPropagation()} ref={receiptRef}>
        <button className="receipt-close" onClick={onClose} data-html2canvas-ignore>×</button>
        
        <div className="receipt-content">
          {/* Header */}
          <div className="receipt-header">
            <h1 className="receipt-logo">SwiftServe</h1>
            <p className="receipt-tagline">Skip the queue!</p>
            <div className="receipt-divider"></div>
          </div>

          {/* Receipt Info */}
          <div className="receipt-info">
            <div className="receipt-info-row">
              <span className="receipt-label">Receipt #:</span>
              <span className="receipt-value">{order.id}</span>
            </div>
            <div className="receipt-info-row">
              <span className="receipt-label">Date:</span>
              <span className="receipt-value">{formatDate(order.created_at || order.date)}</span>
            </div>
            <div className="receipt-info-row">
              <span className="receipt-label">Customer:</span>
              <span className="receipt-value">{user?.username || 'Guest'}</span>
            </div>
            <div className="receipt-info-row">
              <span className="receipt-label">Status:</span>
              <span className="receipt-value receipt-status">{order.status || 'Completed'}</span>
            </div>
          </div>

          <div className="receipt-divider"></div>

          {/* Items */}
          <div className="receipt-items">
            <div className="receipt-items-header">
              <span className="receipt-item-col-name">Item</span>
              <span className="receipt-item-col-qty">Qty</span>
              <span className="receipt-item-col-price">Price</span>
              <span className="receipt-item-col-total">Total</span>
            </div>

            {order.items && order.items.map((item, index) => {
              const drinkId = item.drink_id || item.drink || item.product_id;
              const quantity = item.quantity || 1;
              const unitPrice = getProductPrice(drinkId);
              const totalPrice = unitPrice * quantity;

              return (
                <div key={index} className="receipt-item-row">
                  <span className="receipt-item-col-name">{getProductName(drinkId)}</span>
                  <span className="receipt-item-col-qty">{quantity}</span>
                  <span className="receipt-item-col-price">R{unitPrice.toFixed(2)}</span>
                  <span className="receipt-item-col-total">R{totalPrice.toFixed(2)}</span>
                </div>
              );
            })}
          </div>

          <div className="receipt-divider"></div>

          {/* Totals */}
          <div className="receipt-totals">
            <div className="receipt-total-row">
              <span className="receipt-total-label">Subtotal:</span>
              <span className="receipt-total-value">R{calculateSubtotal()}</span>
            </div>
            <div className="receipt-total-row">
              <span className="receipt-total-label">VAT (15%):</span>
              <span className="receipt-total-value">R{calculateVAT()}</span>
            </div>
            <div className="receipt-divider"></div>
            <div className="receipt-total-row receipt-grand-total">
              <span className="receipt-total-label">Total:</span>
              <span className="receipt-total-value">R{calculateTotal()}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="receipt-footer">
            <p className="receipt-thank-you">Thank you for your order!</p>
            <p className="receipt-footer-text">For support, contact us at support@swiftserve.com</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="receipt-actions" data-html2canvas-ignore>
          <button className="receipt-action-btn receipt-email-btn" onClick={handleEmailReceipt}>
            Email Receipt
          </button>
          <button className="receipt-action-btn receipt-print-btn" data-html2canvas-ignore onClick={handlePrint}>
            Download
          </button>
        </div>
      </div>
    </div>
  );
};

export default Receipt;