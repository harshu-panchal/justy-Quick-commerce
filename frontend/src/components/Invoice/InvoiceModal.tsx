import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { OrderDetail } from '../../services/api/orderService';
import './InvoiceModal.css';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderDetail;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, order }) => {
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Invoice_${order.invoiceNumber}`,
  });

  if (!isOpen) return null;

  return (
    <div className="invoice-modal-overlay" onClick={onClose}>
      <div className="invoice-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="invoice-modal-header">
          <h2>Order Invoice</h2>
          <button className="invoice-close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="invoice-content-wrapper">
          <div ref={componentRef} className="printable-invoice">
            {/* Invoice Top */}
            <div className="invoice-top">
              <div className="invoice-logo-section">
                <h1>JYASTI</h1>
                <p className="text-sm text-gray-500 font-medium">Builds Trust in 10 Minutes</p>
                <div className="mt-4">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Seller</p>
                  <p className="font-semibold text-gray-800">{order.items[0]?.soldBy || 'Jaysti Merchant'}</p>
                </div>
              </div>
              <div className="invoice-qr-section">
                {order.qrCodeUrl ? (
                  <img src={order.qrCodeUrl} alt="Order QR" className="invoice-qr-img" />
                ) : (
                  <div className="invoice-qr-img flex items-center justify-center bg-gray-50 text-gray-400 text-[10px] text-center">
                    QR Pending
                  </div>
                )}
                <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase">Scan for Logistics</p>
              </div>
            </div>

            <div className="invoice-info-grid">
              <div>
                <div className="mb-4">
                  <p className="info-label">Customer Details</p>
                  <p className="info-value">{order.customerName}</p>
                  <p className="text-sm text-gray-600">{order.customerPhone}</p>
                  <p className="text-sm text-gray-600">{order.customerEmail}</p>
                </div>
                <div>
                  <p className="info-label">Delivery Address</p>
                  <p className="info-value">{order.deliveryAddress.address}</p>
                  <p className="text-sm text-gray-600">
                    {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}
                  </p>
                </div>
              </div>
              <div className="lg:text-right">
                <div className="mb-4">
                  <p className="info-label">Invoice Info</p>
                  <p className="info-value">#{order.invoiceNumber}</p>
                  <p className="text-sm text-gray-600">ID: {order.id}</p>
                </div>
                <div className="mb-4">
                  <p className="info-label">Order Date</p>
                  <p className="info-value">{new Date(order.orderDate).toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
                  <p className="text-sm text-gray-600">Slot: {order.timeSlot}</p>
                </div>
                <div>
                  <p className="info-label">Payment Information</p>
                  <p className="info-value">{order.paymentMethod}</p>
                  <p className={`text-xs font-bold ${order.paymentStatus === 'Paid' ? 'text-green-600' : 'text-orange-600'}`}>
                    {order.paymentStatus.toUpperCase()}
                  </p>
                </div>
              </div>
            </div>

            <table className="invoice-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Unit</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <p className="font-semibold">{item.product}</p>
                      {item.comboOffer && <p className="text-[10px] text-orange-600 font-bold">COMBO OFFER</p>}
                    </td>
                    <td>{item.unit}</td>
                    <td>₹{item.price.toFixed(2)}</td>
                    <td>{item.qty}</td>
                    <td style={{ textAlign: 'right' }}>₹{item.subtotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="invoice-totals">
              <div className="total-row">
                <span className="text-gray-500">Subtotal</span>
                <span>₹{order.subtotal.toFixed(2)}</span>
              </div>
              <div className="total-row">
                <span className="text-gray-500">Tax</span>
                <span>₹{order.tax.toFixed(2)}</span>
              </div>
              <div className="total-row grand-total">
                <span>Total Amount</span>
                <span>₹{order.grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-12 pt-6 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400 font-medium">Thank you for shopping with JYASTI</p>
              <p className="text-[10px] text-gray-300 mt-1">This is a computer generated invoice and does not require signature.</p>
            </div>
          </div>
        </div>

        <div className="invoice-actions-footer">
          <button className="btn-close" onClick={onClose}>Cancel</button>
          <button className="btn-print" onClick={() => handlePrint()}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 0 0 1 2-2h16a2 0 0 1 2 2v5a2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            Print Invoice
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
