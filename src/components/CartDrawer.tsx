import React, { useState } from 'react';
import { CartItem } from '../types';
import { X, Trash2, ShieldCheck, Ticket, Sparkles, CreditCard, ShoppingBag, Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (index: number, delta: number) => void;
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}: CartDrawerProps) {
  const [promoCode, setPromoCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'review' | 'details' | 'success'>('review');
  const [validationError, setValidationError] = useState('');

  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    address: '',
    prescription: 'No Prescription / Fashion SunglassesOnly',
  });

  const getSubtotal = () => {
    return cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  };

  const getDiscount = () => {
    return discountApplied ? getSubtotal() * 0.15 : 0;
  };

  const getDeliveryFee = () => {
    return getSubtotal() > 300 ? 0 : 15;
  };

  const getTotal = () => {
    return Math.max(0, getSubtotal() - getDiscount() + getDeliveryFee());
  };

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError('');
    if (promoCode.trim().toUpperCase() === 'VISION15') {
      setDiscountApplied(true);
    } else {
      setPromoError('Promo code not recognized. Try "VISION15" for 15% off.');
    }
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    if (!customerInfo.name || !customerInfo.email || !customerInfo.address) {
      setValidationError('Please fill out all billing and delivery coordinates.');
      return;
    }
    setCheckoutStep('success');
  };

  const handleCompleteOrder = () => {
    setIsCheckingOut(false);
    setCheckoutStep('review');
    setValidationError('');
    setPromoError('');
    onClearCart();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 pointer-events-auto"
            id="cart-backdrop-overlay"
          />

          {/* Core Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-[#0e0e0f] shadow-2xl z-50 flex flex-col justify-between overflow-hidden border-l border-neutral-800"
            style={{ cursor: 'default' }}
            id="cart-drawer-panel"
          >
            {/* Header */}
            <div className="p-6 border-b border-neutral-800 bg-[#121213] flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#b5a68e]" />
                <h3 className="text-base font-sans font-bold tracking-wider text-white uppercase">
                  ATELIER BAG ({cartItems.length})
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-neutral-400 hover:text-white transition-colors hover:bg-neutral-800 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Displaying state conditionally */}
            {checkoutStep === 'success' ? (
              /* ORDER SUCCESS DISPLAY */
              <div className="flex-1 p-8 flex flex-col justify-center items-center text-center space-y-6">
                <div className="w-16 h-16 bg-[#b5a68e]/10 border border-[#b5a68e]/20 rounded-full flex items-center justify-center animate-bounce">
                  <Sparkles className="w-8 h-8 text-[#b5a68e]" />
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-mono tracking-widest text-[#b5a68e] uppercase font-bold">
                    TRANSACTION LICENSED
                  </span>
                  <h3 className="text-2xl font-sans font-extralight text-white">
                    Your Spectacles <br />
                    Are <span className="font-semibold text-[#b5a68e]">In Construction</span>
                  </h3>
                  <p className="text-xs font-sans text-neutral-300 leading-relaxed max-w-xs mx-auto">
                    We have registered your bespoke frames customization sequence. A confirmation invoice has been sent to <span className="font-semibold">{customerInfo.email}</span>.
                  </p>
                </div>

                <div className="w-full bg-neutral-900/60 p-4 rounded-2xl border border-neutral-800 text-left space-y-2 text-xs font-mono text-neutral-300">
                  <div className="flex justify-between">
                    <span>Order Serial:</span>
                    <span className="font-bold text-white">#OP-{Math.floor(100000 + Math.random() * 900000)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Atelier Handcraft:</span>
                    <span>Active Queue (Rank #4)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dispatch Carrier:</span>
                    <span>FedEx Priority Priority Air</span>
                  </div>
                </div>

                <button
                  onClick={handleCompleteOrder}
                  className="w-full py-4 bg-[#b5a68e] text-neutral-950 hover:bg-[#b5a68e]/90 rounded-xl transition-all text-xs font-mono uppercase tracking-wider font-bold"
                  style={{ cursor: 'pointer' }}
                >
                  DISMISS INVOICE
                </button>
              </div>
            ) : isCheckingOut ? (
              /* CHECKOUT BILLING DETAIL SCREEN */
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase text-[#b5a68e] tracking-widest block font-bold">STEP 02 / 02</span>
                  <h4 className="text-lg font-sans font-bold text-white">Billing & Delivery coordinates</h4>
                  <p className="text-xs font-sans text-neutral-400 font-light">Please provide delivery address coordinates to verify the handcraft shipment queue.</p>
                </div>

                <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                  {validationError && (
                    <div className="p-3.5 bg-red-950/40 border border-red-900/60 text-red-400 text-xs font-mono rounded-xl">
                      {validationError}
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-neutral-400 uppercase">Customer Full Name</label>
                    <input
                      type="text"
                      required
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                      placeholder="E.g., Ansh Jagwal"
                      className="w-full text-xs font-sans bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-neutral-250 placeholder:text-neutral-700 focus:outline-none focus:ring-1 focus:ring-[#b5a68e]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-neutral-400 uppercase">Communication Email</label>
                    <input
                      type="email"
                      required
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                      placeholder="E.g., ansh@spectacle.com"
                      className="w-full text-xs font-sans bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-neutral-250 placeholder:text-neutral-700 focus:outline-none focus:ring-1 focus:ring-[#b5a68e]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-neutral-400 uppercase">Destination Delivery Address</label>
                    <textarea
                      required
                      rows={3}
                      value={customerInfo.address}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                      placeholder="Enter street, city, zip, country"
                      className="w-full text-xs font-sans bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-neutral-250 placeholder:text-neutral-700 focus:outline-none focus:ring-1 focus:ring-[#b5a68e]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-neutral-400 uppercase">Lens Prescriptions Option</label>
                    <select
                      value={customerInfo.prescription}
                      onChange={(e) => setCustomerInfo({...customerInfo, prescription: e.target.value})}
                      className="w-full text-xs font-sans bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-neutral-250 focus:outline-none focus:ring-1 focus:ring-[#b5a68e]"
                    >
                      <option value="No Prescription / Fashion SunglassesOnly">Non-Prescription (Plano Lens / UV Sun filters)</option>
                      <option value="Single Vision Correction (+1.50 Right, +1.25 Left)">Single Vision Distance Correction (+1.50 Right, +1.25 Left)</option>
                      <option value="Active Progressive Multifocal (Standard Lens Draft)">Active Progressive Multifocal (Advanced Zeiss Calibration)</option>
                    </select>
                  </div>

                  <div className="border-t border-neutral-800 pt-4 mt-6">
                    <div className="flex justify-between items-center py-2.5 text-xs font-mono text-neutral-400">
                      <span>SECURE CREDIT TRANSIT:</span>
                      <span className="flex items-center gap-1 font-bold text-white">
                        <CreditCard className="w-3.5 h-3.5 text-[#b5a68e]" />
                        •••• •••• •••• 4026
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIsCheckingOut(false)}
                        className="w-1/3 py-3 rounded-xl border border-neutral-800 text-xs font-mono text-neutral-400 hover:bg-neutral-900"
                      >
                        BACK
                      </button>
                      <button
                        type="submit"
                        className="w-2/3 py-3 bg-[#b5a68e] hover:bg-[#b5a68e]/90 text-neutral-950 rounded-xl text-xs font-mono uppercase tracking-widest font-bold flex items-center justify-center gap-2"
                      >
                        <ShieldCheck className="w-4 h-4 text-neutral-950" />
                        <span>CONFIRM ${getTotal()}</span>
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            ) : (
              /* CORE CART LIST ITEMS */
              <>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {cartItems.length === 0 ? (
                    <div className="h-64 flex flex-col justify-center items-center text-center space-y-4">
                      <ShoppingBag className="w-12 h-12 text-neutral-700 stroke-[1.5]" />
                      <div className="space-y-1">
                        <p className="text-sm font-sans font-medium text-white">Your bag is empty</p>
                        <p className="text-xs font-sans text-neutral-500">Design custom specs below or select archive flagship inside the gallery.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3.5" id="cart-items-wrapper">
                      {cartItems.map((item, index) => (
                        <div
                          key={item.product.id + '-' + index}
                          className="bg-neutral-900/40 rounded-2xl p-4 border border-neutral-800 flex gap-4 hover:border-neutral-700 transition-all shadow-xs"
                        >
                          {/* Mini specs display design representation */}
                          <div className="w-16 h-16 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-center flex-shrink-0 relative">
                            <span className="text-[10px] font-mono text-[#b5a68e] uppercase font-bold">
                              {item.product.style === 'round' ? 'O' : item.product.style === 'rectangular' ? '▭' : '▽'}
                            </span>
                          </div>

                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div className="space-y-1">
                              <div className="flex justify-between items-start">
                                <h4 className="text-xs font-semibold text-white font-sans truncate pr-2">
                                  {item.product.name}
                                </h4>
                                <span className="text-xs font-mono font-bold text-white flex-shrink-0">
                                  ${item.product.price}
                                </span>
                              </div>

                              {item.customization ? (
                                <p className="text-[9px] font-mono text-neutral-400 leading-normal">
                                  Config: {item.customization.frameColorName} Frame • {item.customization.lensColorName} Lens
                                  {item.customization.engravingText && (
                                    <span className="block italic text-[#b5a68e] font-bold mt-0.5">
                                      Laser Engraved: "{item.customization.engravingText}"
                                    </span>
                                  )}
                                </p>
                              ) : (
                                <p className="text-[9px] font-mono text-neutral-500">
                                  Archive Curated Original Model
                                </p>
                              )}
                            </div>

                            <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-neutral-800">
                              {/* Quantity control */}
                              <div className="flex items-center border border-neutral-800 rounded-lg p-0.5 bg-neutral-950/50">
                                <button
                                  onClick={() => onUpdateQuantity(index, -1)}
                                  className="p-1 hover:bg-neutral-800 text-neutral-400 rounded-md transition-colors"
                                  disabled={item.quantity <= 1}
                                  style={{ cursor: 'pointer' }}
                                >
                                  <Minus className="w-2.5 h-2.5" />
                                </button>
                                <span className="px-2 text-xs font-mono font-bold text-white">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => onUpdateQuantity(index, 1)}
                                  className="p-1 hover:bg-neutral-800 text-neutral-400 rounded-md transition-colors"
                                  style={{ cursor: 'pointer' }}
                                >
                                  <Plus className="w-2.5 h-2.5" />
                                </button>
                              </div>

                              {/* Remove action */}
                              <button
                                onClick={() => onRemoveItem(index)}
                                className="p-1.5 text-neutral-400 hover:text-red-500 rounded-lg hover:bg-red-950/30 transition-colors cursor-pointer"
                                title="Remove item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Billing Summary Box */}
                {cartItems.length > 0 && (
                  <div className="p-6 bg-[#121213] border-t border-neutral-800 space-y-4">
                    {/* Promo Section */}
                    <form onSubmit={handleApplyPromo} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Promo Code: E.g., VISION15"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        disabled={discountApplied}
                        className="flex-1 text-xs font-mono bg-neutral-950 border border-neutral-800 rounded-xl px-3 h-10 text-neutral-200 focus:outline-none focus:ring-1 focus:ring-[#b5a68e]"
                      />
                      <button
                        type="submit"
                        disabled={discountApplied}
                        className="px-4 bg-neutral-800 hover:bg-neutral-700 disabled:bg-neutral-900 disabled:text-neutral-600 rounded-xl text-xs font-mono uppercase font-bold h-10 flex items-center gap-1 text-white"
                        style={{ cursor: 'pointer' }}
                      >
                        <Ticket className="w-3.5 h-3.5" />
                        <span>Apply</span>
                      </button>
                    </form>

                    {discountApplied && (
                      <p className="text-[10px] font-mono text-green-400 block leading-none">
                        ✓ 15% VIP code applied successfully!
                      </p>
                    )}

                    {/* Pricing Ledger */}
                    <div className="space-y-1.5 text-xs font-sans text-neutral-400 border-b border-neutral-800 pb-3">
                      <div className="flex justify-between">
                        <span>Items Subtotal:</span>
                        <span className="font-mono text-white">${getSubtotal()}</span>
                      </div>
                      {discountApplied && (
                        <div className="flex justify-between text-green-400">
                          <span>VIP Promo (15%):</span>
                          <span className="font-mono font-medium">-${getDiscount()}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Fedex Insured Shipping:</span>
                        <span className="font-mono text-white">
                          {getDeliveryFee() === 0 ? 'FREE' : `$${getDeliveryFee()}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-baseline py-1">
                      <span className="text-sm font-sans font-bold text-white">CREDIT TOTAL:</span>
                      <span className="text-xl font-mono font-extrabold text-[#b5a68e]">${getTotal()}</span>
                    </div>

                    <button
                      onClick={() => setIsCheckingOut(true)}
                      className="w-full py-4 bg-[#b5a68e] text-neutral-950 font-bold hover:bg-[#b5a68e]/90 rounded-2xl transition-all font-sans text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                      style={{ cursor: 'pointer' }}
                    >
                      <span>PROCEED TO SECURE PAY</span>
                    </button>

                    <div className="flex justify-center items-center gap-1.5 text-[9px] font-mono text-neutral-500">
                      <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                      <span>Symmetric 256-Bit SSL Encryption Protection</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
