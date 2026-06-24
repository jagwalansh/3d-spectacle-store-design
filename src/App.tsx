import { useState, useEffect } from 'react';
import { CustomizationState, CartItem, Product } from './types';
import SpecsCanvas from './components/SpecsCanvas';
import Navbar from './components/Navbar';
import TechHighlights from './components/TechHighlights';
import CustomizerSection from './components/CustomizerSection';
import ProductCollection from './components/ProductCollection';
import CartDrawer from './components/CartDrawer';
import { ArrowDown, Check, MousePointer, Info, Layers, Hammer, Compass, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // Shared state: Customization Config
  const [customization, setCustomization] = useState<CustomizationState>({
    style: 'round',
    frameColor: 'polished-amber',
    lensColor: 'forest-ocean',
    transmissionType: 'translucent', // translucent displays gold wire inner sleeve in real-time!
    engraving: '',
    hingeGold: true,
  });

  // Shared state: Shopping Cart
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Active section to sync highlighting in Navbar
  const [activeSection, setActiveSection] = useState('hero');

  // Loading animation states
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Timed progress simulation
  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      current += Math.floor(Math.random() * 8) + 3;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setTimeout(() => {
          setIsLoading(false);
        }, 550);
      }
      setLoadingProgress(current);
    }, 60);

    return () => clearInterval(interval);
  }, []);

  // Newsletter subscription
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleUpdateQuantity = (index: number, delta: number) => {
    setCartItems((prev) => {
      const next = [...prev];
      if (next[index]) {
        next[index].quantity = Math.max(1, next[index].quantity + delta);
      }
      return next;
    });
  };

  const handleRemoveItem = (index: number) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleAddBespokeToCart = () => {
    // Generate pricing values
    let finalCost = 210;
    if (customization.frameColor === 'polished-amber') finalCost += 25;
    else if (customization.frameColor === 'champagne-crystal') finalCost += 15;
    else if (customization.frameColor === 'rose-acetate') finalCost += 15;
    else if (customization.frameColor === 'pure-gold') finalCost += 60;
    else if (customization.frameColor === 'platinum') finalCost += 45;

    if (customization.transmissionType === 'translucent') finalCost += 20;
    if (customization.hingeGold) finalCost += 25;
    if (customization.engraving) finalCost += 10;

    // Create custom product instance
    const bespokeProduct: Product = {
      id: `bespoke-specs-${Date.now()}`,
      name: 'Bespoke Custom Eyewear',
      style: customization.style,
      frameColor: customization.frameColor,
      lensColor: customization.lensColor,
      price: finalCost,
      rating: 5.0,
      reviewsCount: 1,
      imageUrl: '',
      tags: ['BESPOKE LAB', 'GOLD INFUSED']
    };

    const newItem: CartItem = {
      product: bespokeProduct,
      quantity: 1,
      customization: {
        frameColorName: customization.frameColor.replace('-', ' '),
        lensColorName: customization.lensColor.replace('-', ' '),
        styleName: customization.style,
        engravingText: customization.engraving || undefined
      }
    };

    setCartItems((prev) => [...prev, newItem]);
    setIsCartOpen(true);
  };

  const handleAddDirectToCart = (product: Product) => {
    const newItem: CartItem = {
      product,
      quantity: 1,
    };
    setCartItems((prev) => [...prev, newItem]);
    setIsCartOpen(true);
  };

  const handleLoadPreset = (preset: CustomizationState) => {
    setCustomization(preset);
  };

  return (
    <div className="relative min-h-screen bg-[#0a0a0b] selection:bg-[#b5a68e] select-none text-neutral-200 sleek-dot-grid" id="store-workspace">
      {/* 1. Luxurious opening loading animation */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8, ease: 'easeInOut' } }}
            className="fixed inset-0 bg-[#070708] z-[9999] flex flex-col justify-center items-center select-none pointer-events-auto"
          >
            {/* Elegant luxury visual accents */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(181,166,142,0.06)_0%,transparent_65%)] pointer-events-none" />
            
            <div className="relative flex flex-col items-center space-y-8 text-center px-6">
              {/* Spinning minimalist geometric lens/case accent */}
              <div className="relative w-16 h-16 flex items-center justify-center">
                <div className="absolute w-12 h-12 rounded-full border border-[#b5a68e]/20" />
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
                  className="absolute w-12 h-12 rounded-full border-t border-[#b5a68e] border-r border-transparent"
                />
                <span className="text-[10px] font-mono text-[#b5a68e] font-bold tracking-wider">OP</span>
              </div>

              {/* High-fashion, spaced title branding */}
              <div className="space-y-1">
                <motion.h1 
                  initial={{ letterSpacing: '0.2em', opacity: 0 }}
                  animate={{ letterSpacing: '0.45em', opacity: 1 }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className="text-2xl sm:text-3xl font-sans font-extralight text-white tracking-[0.45em]"
                >
                  O P T I Q U E
                </motion.h1>
                <p className="text-[9px] font-mono tracking-[0.3em] text-neutral-500 uppercase">
                  ATELIER DE SYNTHÈSE SPATIALE
                </p>
              </div>

              {/* Elegant linear loading progress bar */}
              <div className="w-48 space-y-2">
                <div className="h-[1px] w-full bg-neutral-900 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${loadingProgress}%` }}
                    transition={{ ease: 'easeOut' }}
                    className="h-full bg-[#b5a68e]"
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                  <span>SYSTEM READY</span>
                  <span>{loadingProgress}%</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3D Model Render Engine - Canvas resides fixed in background, controlled by scrolling */}
      <SpecsCanvas
        customization={customization}
        onScrollSectionChange={setActiveSection}
      />

      {/* Floating Header Navbar */}
      <Navbar
        cartCount={cartItems.reduce((acc, c) => acc + c.quantity, 0)}
        onCartClick={() => setIsCartOpen(true)}
        activeSection={activeSection}
      />

      {/* Cart Slider Overlay */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onRemoveItem={handleRemoveItem}
        onUpdateQuantity={handleUpdateQuantity}
        onClearCart={handleClearCart}
      />

      {/* --- SECTION 1: HERO VIEW (01 / Introduction) --- */}
      <section
        id="hero-trigger"
        className="relative min-h-[105vh] flex flex-col justify-between pt-36 pb-12 px-6 sm:px-12 md:px-24 overflow-hidden"
      >
        {/* Sleek dynamic blur circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] ambient-blur-glow pointer-events-none" />

        {/* Editorial Text Symmetrical Grid */}
        <div className="relative z-20 w-full max-w-7xl mx-auto flex-1 flex flex-col md:flex-row justify-between items-center gap-12 md:gap-0 pt-24 pb-8 h-full">
          {/* Left Column: introducing spec */}
          <div id="hero-left-text" className="flex-1 flex flex-col justify-center items-start w-full md:w-auto md:pr-12 text-left space-y-5 opacity-0 pointer-events-none">
            <span className="text-[11px] font-mono text-[#b5a68e] tracking-[0.25em] block uppercase font-bold">
              EST. 2026 • EUROPEAN DESIGN SYSTEM
            </span>
            <div className="space-y-2">
              <span className="text-xs font-mono text-neutral-500 tracking-[0.3em] uppercase block font-bold">
                01 / INTRODUCING
              </span>
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-sans font-black tracking-tighter text-white uppercase leading-[0.85]">
                THE <br />
                <span className="text-[#b5a68e]">SPEC</span>
              </h1>
            </div>
            <p className="text-xs font-mono text-neutral-400 leading-relaxed uppercase max-w-xs">
              Hand-sculpted responsive cellulose acetate with solid-gilded brass cores. Calibrated using Three.js spatial projections.
            </p>
            <div className="pt-4 border-t border-neutral-800 w-full max-w-[240px]">
              <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-[0.15em] block font-bold mb-1">
                ATELIER CALIBRATION
              </span>
              <p className="text-[10px] font-mono text-neutral-500 leading-tight">
                Zeiss AR Filter System • 5-Barrel Gold Hinge • Titanium Spline
              </p>
            </div>
          </div>

          {/* Symmetrical Central Spacer reserved for 3D case & spectacles */}
          <div className="w-full md:w-[35%] h-[320px] md:h-[450px] pointer-events-none flex-shrink-0" />

          {/* Right Column: company name */}
          <div id="hero-right-text" className="flex-1 flex flex-col justify-center items-end w-full md:w-auto md:pl-12 text-right space-y-5 opacity-0 pointer-events-none">
            <span className="text-[11px] font-mono text-[#b5a68e] tracking-[0.25em] block uppercase font-bold">
              MEDITERRANEAN CRAFT ARCHITECTURE
            </span>
            <div className="space-y-2">
              <span className="text-xs font-mono text-neutral-500 tracking-[0.3em] uppercase block font-bold">
                02 / MANUFACTORY
              </span>
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-sans font-black tracking-tighter text-white uppercase leading-[0.85]">
                OPTIQUE <br />
                <span className="text-neutral-500">CO.</span>
              </h1>
            </div>
            <p className="text-xs font-mono text-neutral-400 leading-relaxed uppercase max-w-xs">
              Every curve representing hundreds of hours of manual refinement, fusing Italian premium heritage with mechanical performance.
            </p>
            <div className="pt-4 border-t border-neutral-800 w-full max-w-[240px] text-right ml-auto">
              <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-[0.15em] block font-bold mb-1">
                LIMITED EDITION
              </span>
              <p className="text-[10px] font-mono text-neutral-500 leading-tight">
                Batch 04 // 250 Units Produced globally with custom engraving
              </p>
            </div>
          </div>
        </div>

        {/* Floating Indicator calling user attention to scroll */}
        <div id="hero-scroll-indicator" className="relative z-20 flex flex-col items-center justify-center mt-32 md:mt-0 opacity-0 pointer-events-none">
          <div className="bg-neutral-900/80 backdrop-blur-md px-6 py-3 rounded-full border border-neutral-800 shadow-lg text-[10px] font-mono text-neutral-300 flex items-center gap-3 tracking-wider hover:border-[#b5a68e]/35 transition-all">
            <MousePointer className="w-3.5 h-3.5 text-[#b5a68e] animate-pulse" />
            <span>SCROLL DOWN TO ENGAGE 3D DECOMPOSITION</span>
          </div>
        </div>

        {/* Hero Footer details */}
        <div id="hero-footer-details" className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative z-20 border-t border-neutral-800 pt-8 w-full max-w-7xl mx-auto text-[10px] font-mono text-neutral-400 opacity-0 pointer-events-none">
          <div className="flex items-center gap-2.5">
            <Compass className="w-4 h-4 text-[#b5a68e]" />
            <span>01 / INTEGRATED DEDICATED VIEWPORT</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Hammer className="w-4 h-4 text-[#b5a68e]" />
            <span>02 / BIO-RESOURCES VERIFIED GLASS</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Award className="w-4 h-4 text-[#b5a68e]" />
            <span>03 / HAND-FINISHED SPLINE CHASSIS</span>
          </div>
        </div>
      </section>

      {/* --- SECTION 2: ENGINEERING (02 / Craftsmanship) --- */}
      <section
        id="features-trigger"
        className="relative min-h-[110vh] flex flex-col justify-center py-20 bg-neutral-950/30 border-y border-neutral-800/40"
      >
        {/* Sleek ambient light behind details */}
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-[#b5a68e]/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="w-full relative z-20">
          {/* TechHighlights handles item detail selection and hotspot previews */}
          <TechHighlights />
        </div>
      </section>

      {/* --- SECTION 3: SPEC-LAB WORKSHOP (03 / Bespoke Customizer) --- */}
      <section
        id="customizer-trigger"
        className="relative min-h-[100vh] flex flex-col items-center pt-12 pb-24 px-6 sm:px-12 md:px-24"
      >
        {/* Top spacer so the centered 3D circular stage and specs are fully visible */}
        <div className="w-full min-h-[52vh] pointer-events-none" />

        {/* Customization controls centered directly below the 3D model viewport */}
        <div className="w-full max-w-5xl mx-auto relative z-20" id="customizer-panel-section">
          <div className="relative">
            {/* Highlight callouts */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-neutral-900 text-[#b5a68e] border border-[#b5a68e]/20 text-[9px] font-mono px-3.5 py-1 rounded-full uppercase tracking-wider font-bold shadow-md">
              Bespoke Configuration Lab Active
            </div>

            <CustomizerSection
              customization={customization}
              onCustomizationChange={setCustomization}
              onAddToCart={handleAddBespokeToCart}
            />
          </div>
        </div>
      </section>

      {/* --- SECTION 4: CURATED CATALOG GALLERY (04 / Selected Works) --- */}
      <section
        id="catalog-trigger"
        className="relative min-h-[100vh] py-24 bg-neutral-950/30 border-t border-neutral-800/40"
      >
        <div className="relative z-20 w-full">
          {/* Renders products collection with state setters */}
          <ProductCollection
            onLoadPreset={handleLoadPreset}
            onAddToCartDirectly={handleAddDirectToCart}
          />
        </div>
      </section>

      {/* --- PREMIUM BRAND FOOTER --- */}
      <footer id="atelier-footer" className="bg-[#121213] text-neutral-400 py-16 px-6 sm:px-12 md:px-24 border-t border-neutral-900 relative overflow-hidden" style={{ contentVisibility: 'auto' }}>
        {/* Decorative elements */}
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-[#b5a68e]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 w-full max-w-7xl mx-auto relative z-10 text-xs text-sans pb-12 border-b border-neutral-900">
          <div className="md:col-span-4 space-y-4">
            <span className="text-lg font-sans tracking-[0.3em] font-light text-white block uppercase">
              O P T I Q U E
            </span>
            <p className="text-[11px] leading-relaxed max-w-xs text-neutral-500">
              A private optical atelier creating premium responsive spectacles. Blending classic European metal craftsmanship with progressive organic polymers.
            </p>
          </div>

          <div className="md:col-span-4 space-y-2">
            <h4 className="font-mono text-neutral-300 font-bold uppercase tracking-wider">MUSEUMS & STUDIOS</h4>
            <ul className="space-y-1.5 text-neutral-500 text-[11px]">
              <li>Galleria Manzoni, Corso 16, Milan, Italy</li>
              <li>Sacre Coeur Block B, Atelier 04, Paris, France</li>
              <li>Bespoke Glassworks Warehouse 12, Brooklyn, USA</li>
            </ul>
          </div>

          <div className="md:col-span-4 space-y-3.5">
            <h4 className="font-mono text-neutral-300 font-bold uppercase tracking-wider">STUDIO NEWSLETTER</h4>
            {isSubscribed ? (
              <div id="newsletter-success" className="bg-[#b5a68e]/10 border border-[#b5a68e]/35 p-3 rounded-lg text-[11px] text-[#b5a68e] font-mono leading-relaxed">
                ✓ Subscription registered successfully. Welcome to Optique Studio, Milan.
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Submit your email"
                  className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-[11px] placeholder:text-neutral-600 focus:outline-none focus:border-neutral-700 w-full"
                />
                <button 
                  onClick={() => setIsSubscribed(true)}
                  className="bg-neutral-800 px-3 py-2 text-[10px] font-mono tracking-wider font-bold hover:bg-neutral-700 text-white rounded-lg transition-all"
                  style={{ cursor: 'pointer' }}
                >
                  JOIN
                </button>
              </div>
            )}
            <p className="text-[10px] text-neutral-500 font-mono">
              Subscribe to unlock seasonal optician collaborations & limited drop notifications.
            </p>
          </div>
        </div>

        <div className="w-full max-w-7xl mx-auto pt-8 flex flex-col sm:flex-row justify-between items-center text-[10px] font-mono text-neutral-600 space-y-4 sm:space-y-0">
          <div className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-green-600" />
            <span>Optique Systems Inc. All Rights Reserved.</span>
          </div>
          <div className="flex gap-4">
            <a href="#" className="hover:text-neutral-400">Optical Patents</a>
            <a href="#" className="hover:text-neutral-400">Carbon Statement</a>
            <a href="#" className="hover:text-neutral-400">Security Encryptions</a>
          </div>
          <div>
            <span>Engine: Three.js • GSAP ScrollTrigger • Tailwind CSS</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
