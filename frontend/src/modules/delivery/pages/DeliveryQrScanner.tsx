import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from '@zxing/library';
import { scanQrCode, updateOrderQrStatus, ScanResponse } from '../../../services/api/delivery/qrService';
import DeliveryHeader from '../components/DeliveryHeader';
import DeliveryBottomNav from '../components/DeliveryBottomNav';

const DeliveryQrScanner: React.FC = () => {
  const navigate = useNavigate();
  const locationState = useLocation();
  const { expectedOrderId, mode, orderType: expectedOrderType } = (locationState.state as any) || {};

  const [scanResult, setScanResult] = useState<ScanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    if (!isScanning) return;

    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
    
    const codeReader = new BrowserMultiFormatReader(hints);
    codeReaderRef.current = codeReader;

    const startScanner = async () => {
      try {
        // Check for secure context (required for camera access)
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
           setError('Camera access is blocked on insecure connections. Please use HTTPS or enable "Insecure origins treated as secure" in browser flags (chrome://flags).');
           setIsScanning(false);
           return;
        }

        if (videoRef.current) {
          await codeReader.decodeFromVideoDevice(
            null, // null uses the default video device
            videoRef.current,
            (result, err) => {
              if (result) {
                onScanSuccess(result.getText());
              }
              // We ignore 'err' because ZXing throws it constantly while scanning
            }
          );
        }
      } catch (err) {
        console.error('Scanner start error:', err);
        setError('Failed to access camera. Please ensure permissions are granted.');
      }
    };

    startScanner();

    return () => {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
    };
  }, [isScanning]);

  const onScanSuccess = async (decodedText: string) => {
    // Stop scanning immediately
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
    }
    setIsScanning(false);
    
    try {
      const response = await scanQrCode(decodedText);
      if (response.success && response.data) {
        const data = response.data;
        
        // Validation: If in pickup mode, ensure the scanned Order ID matches the expected one
        if (mode === 'pickup' && expectedOrderId && data.orderId !== expectedOrderId) {
            setError('This QR belongs to another order. Please scan the correct package.');
            return;
        }

        setScanResult(data);
      } else {
        setError(response.message || 'Invalid or Expired QR Code');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to verify QR Code');
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!scanResult || isUpdating) return;
    setIsUpdating(true);

    try {
      let location = undefined;
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      } catch (e) {
        console.warn('Location access denied or failed');
      }

      const response = await updateOrderQrStatus(
        scanResult.orderId, 
        status, 
        scanResult.orderType,
        location
      );

      if (response.success) {
        alert(`Order ${status} successfully!`);
        navigate('/delivery');
      } else {
        alert(response.message || 'Failed to update status');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error updating status');
    } finally {
      setIsUpdating(false);
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setError(null);
    setIsScanning(true);
  };

  return (
    <div className="min-h-screen bg-neutral-100 pb-20">
      <DeliveryHeader />
      
      <div className="p-4 flex flex-col items-center">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 bg-teal-600 text-center">
            <h2 className="text-white font-bold text-lg">Logistics QR Scanner</h2>
            <p className="text-teal-100 text-xs mt-1">Scan customer or seller invoice QR</p>
          </div>

          <div className="p-4">
            {isScanning ? (
              <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-black border-2 border-teal-200">
                <video 
                  ref={videoRef} 
                  className="w-full h-full object-cover"
                />
                {/* Overlay UI */}
                <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none">
                  <div className="w-full h-full border-2 border-teal-400/50 rounded-sm relative">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-teal-400"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-teal-400"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-teal-400"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-teal-400"></div>
                  </div>
                </div>
                <div className="absolute bottom-4 left-0 right-0 text-center">
                   <p className="text-white text-[10px] font-bold uppercase tracking-widest bg-black/40 inline-block px-3 py-1 rounded-full">Align QR in Frame</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                {error ? (
                  <div className="p-8">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-gray-900 text-xl text-center">Scan Failed</h3>
                    <p className="text-gray-500 mt-2 text-center text-sm">{error}</p>
                    <button 
                      onClick={resetScanner}
                      className="mt-6 w-full bg-teal-600 text-white py-3 rounded-xl font-bold"
                    >
                      Try Again
                    </button>
                  </div>
                ) : scanResult ? (
                  <div className="text-left animate-in fade-in duration-500">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-black text-teal-600 bg-teal-50 px-2 py-1 rounded uppercase tracking-tighter">
                        {scanResult.orderType} VALIDATED
                      </span>
                      <span className="text-sm font-bold text-gray-400">#{scanResult.orderNumber}</span>
                    </div>

                    <div className="space-y-4 mb-2">
                       <div className="flex justify-between items-start border-b border-gray-50 pb-3">
                          <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">Customer</p>
                            <p className="font-bold text-gray-800">{scanResult.customerName}</p>
                          </div>
                          <div className="text-right">
                             <p className="text-[10px] text-gray-400 font-bold uppercase">Amount</p>
                             <p className="font-bold text-gray-800">₹{scanResult.amount.toFixed(2)}</p>
                          </div>
                       </div>
                       
                       <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">Items to Pickup</p>
                          <div className="space-y-2">
                             {(scanResult.order?.items || []).map((item: any, idx: number) => {
                                const name = item.productName || item.name || "Item";
                                const img = item.productImage || item.imageUrl || (item.equipmentItem?.imageUrl);
                                const qty = item.quantity;
                                return (
                                  <div key={idx} className="flex items-center gap-3">
                                     <div className="w-10 h-10 bg-white rounded-lg border border-gray-200 overflow-hidden flex-shrink-0">
                                        {img ? <img src={img} alt={name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs">📦</div>}
                                     </div>
                                     <div className="flex-1">
                                        <p className="text-xs font-bold text-gray-800 line-clamp-1">{name}</p>
                                        <p className="text-[10px] text-gray-500">Qty: {qty}</p>
                                     </div>
                                  </div>
                                );
                             })}
                          </div>
                       </div>

                       <div>
                         <p className="text-[10px] text-gray-400 font-bold uppercase">Delivery Address</p>
                         <p className="text-sm text-gray-600 leading-tight">{scanResult.address}</p>
                       </div>
                    </div>

                    <div className="flex flex-col gap-3 mt-6">
                      {mode === 'pickup' && !scanResult.nextAllowedStatus.includes('PICKED_UP') ? (
                         <button
                           onClick={() => handleUpdateStatus('PICKED_UP')}
                           disabled={isUpdating}
                           className="w-full bg-teal-600 hover:bg-teal-700 text-white py-4 rounded-2xl font-black shadow-lg shadow-teal-100 active:scale-[0.98] transition-all disabled:opacity-50"
                         >
                            {isUpdating ? 'UPDATING...' : 'CONFIRM PICKUP'}
                         </button>
                      ) : (
                        scanResult.nextAllowedStatus.map(status => (
                          <button
                            key={status}
                            onClick={() => handleUpdateStatus(status)}
                            disabled={isUpdating}
                            className="w-full bg-teal-600 hover:bg-teal-700 text-white py-4 rounded-2xl font-black shadow-lg shadow-teal-100 active:scale-[0.98] transition-all disabled:opacity-50"
                          >
                            {isUpdating ? 'UPDATING...' : `MARK AS ${status.toUpperCase()}`}
                          </button>
                        ))
                      )}
                      
                      <button 
                        onClick={resetScanner}
                        className="w-full text-gray-400 py-2 font-bold text-sm uppercase tracking-widest mt-2"
                      >
                        Scan Different QR
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 text-center text-gray-400 text-xs px-8">
          <p>Scan the QR code printed on the invoice to verify pickup or delivery. This action is logged with your current GPS coordinates.</p>
        </div>
      </div>

      <DeliveryBottomNav />
    </div>
  );
};

export default DeliveryQrScanner;
