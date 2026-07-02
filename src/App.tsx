import { Suspense, lazy, useState, useEffect } from 'react';
import { CustomizationState, CartItem, Product } from './types';
import Navbar from './components/Navbar';
import TechHighlights from './components/TechHighlights';
import CustomizerSection from './components/CustomizerSection';
import ProductCollection from './components/ProductCollection';
import CartDrawer from './components/CartDrawer';
import DotField from './components/DotField';
import { Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const SpecsCanvas = lazy(() => import('./components/SpecsCanvas'));

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
  const [isSceneReady, setIsSceneReady] = useState(false);

  useEffect(() => {
    if (isSceneReady) {
      setLoadingProgress(100);
      const finishTimer = window.setTimeout(() => {
        setIsLoading(false);
      }, 420);

      return () => window.clearTimeout(finishTimer);
    }

    const progressTimer = window.setInterval(() => {
      setLoadingProgress((current) => {
        const step = current < 55 ? 8 : current < 82 ? 3 : 1;
        return Math.min(92, current + step);
      });
    }, 90);

    return () => window.clearInterval(progressTimer);
  }, [isSceneReady]);

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
      name: 'Custom Eyewear',
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
    <div className="relative min-h-screen bg-[#0b0b0a] selection:bg-[#b5a68e] select-none text-neutral-200" id="store-workspace">
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
                  className="text-2xl sm:text-3xl font-sans font-extralight text-white tracking-[0.32em]"
                >
                  O P T I Q U E
                </motion.h1>
                <p className="text-xs text-neutral-500">
                  Handmade eyewear
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
                  <span>Loading</span>
                  <span>{loadingProgress}%</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3D Model Render Engine - Canvas resides fixed in background, controlled by scrolling */}
      <Suspense fallback={null}>
        <SpecsCanvas
          customization={customization}
          onScrollSectionChange={setActiveSection}
          onReady={() => setIsSceneReady(true)}
        />
      </Suspense>

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
        className="relative min-h-screen flex items-center px-6 sm:px-12 md:px-20 overflow-hidden"
      >
        <div className="absolute inset-0 z-0 pointer-events-auto">
          <DotField
            dotRadius={1.5}
            dotSpacing={15}
            bulgeStrength={60}
            glowRadius={70}
            sparkle
            waveAmplitude={0}
            cursorRadius={450}
            cursorForce={0.31}
            bulgeOnly
            gradientFrom="#d6cfdd"
            gradientTo="#8c52c2"
            glowColor="#b5a68e"
          />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,11,10,0.94)_0%,rgba(11,11,10,0.18)_46%,rgba(11,11,10,0.9)_100%)] pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#0a0a0b] to-transparent pointer-events-none" />

        <div className="relative z-20 w-full max-w-[1500px] mx-auto grid grid-cols-1 lg:grid-cols-[0.7fr_1.6fr_0.7fr] items-center gap-10 pt-28 lg:pt-16">
          <div id="hero-left-text" className="opacity-0 pointer-events-none space-y-4 max-w-[310px]">
            <div className="space-y-4 mb-30 ">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-sans leading-[0.95] tracking-normal text-white">
                Introducing
              </h1>
              <div className="w-14 h-px bg-[#b5a68e]" />
            </div>
          </div>

          <div id="hero-scroll-indicator" className="opacity-0 pointer-events-none min-h-[360px] lg:min-h-[620px]" />

          <div id="hero-right-text" className="opacity-0 pointer-events-auto space-y-7 max-w-[310px] lg:justify-self-end">
            <div className="space-y-4">
              <span className="text-sm text-[#b5a68e]">
                
              </span>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-sans leading-[0.95] tracking-wider text-[#b5a68e]">
                Optique
              </h2>
            </div>

            <p className="text-base text-neutral-400 leading-relaxed max-w-xs">
              A round acetate frame with warm metal detailing, built for daily wear rather than display-case drama.
            </p>

            <button
              onClick={() => {
                const features = document.getElementById('features-trigger');
                if (features) features.scrollIntoView({ behavior: 'smooth' });
              }}
              className="group flex items-center gap-4 border-b border-[#b5a68e]/45 pb-3 text-sm text-neutral-300 hover:text-white transition-colors"
              style={{ cursor: 'pointer' }}
            >
              <span>Explore the frame</span>
              <span className="text-[#b5a68e] transition-transform group-hover:translate-x-2">→</span>
            </button>
          </div>
        </div>

      </section>

      {/* --- SECTION 2: ENGINEERING (02 / Craftsmanship) --- */}
      <section
        id="features-trigger"
        className="relative min-h-[180vh] bg-neutral-950/95 border-y border-neutral-800/40 py-28"
      >
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
      <footer id="atelier-footer" className="bg-[#121213] text-neutral-400 py-16 px-6 sm:px-12 md:px-24 border-t border-neutral-900 relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-45">
              <DotField
                dotRadius={1.5}
                dotSpacing={15}
                bulgeStrength={60}
                glowRadius={70}
                sparkle
                waveAmplitude={0}
                cursorRadius={450}
                cursorForce={0.31}
                bulgeOnly
                gradientFrom="#d6cfdd"
                gradientTo="#8c52c2"
                glowColor="#b5a68e"
              />
            </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 w-full max-w-7xl mx-auto relative z-10 text-xs text-sans pb-12 border-b border-neutral-900">
          <div className="md:col-span-4 space-y-4">
            <span className="text-lg font-sans tracking-[0.18em] font-light text-white block uppercase">
              Optique
            </span>
            <p className="text-sm leading-relaxed max-w-xs text-neutral-500">
              Small-batch eyewear with customizable frame shapes, lens tints, and engraving.
            </p>
          </div>

          <div className="md:col-span-4 space-y-2">
            <h4 className="text-neutral-300 font-semibold">Visit</h4>
            <ul className="space-y-1.5 text-neutral-500 text-sm">
              <li>Galleria Manzoni, Milan</li>
              <li>Saint-Germain, Paris</li>
              <li>Brooklyn, New York</li>
            </ul>
          </div>

          <div className="md:col-span-4 space-y-3.5">
            <h4 className="text-neutral-300 font-semibold">Newsletter</h4>
            {isSubscribed ? (
              <div id="newsletter-success" className="bg-[#b5a68e]/10 border border-[#b5a68e]/35 p-3 rounded-lg text-sm text-[#b5a68e] leading-relaxed">
                You are subscribed.
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Submit your email"
                  className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm placeholder:text-neutral-600 focus:outline-none focus:border-neutral-700 w-full"
                />
                <button 
                  onClick={() => setIsSubscribed(true)}
                  className="bg-neutral-800 px-3 py-2 text-sm font-medium hover:bg-neutral-700 text-white rounded-lg transition-all"
                  style={{ cursor: 'pointer' }}
                >
                  Join
                </button>
              </div>
            )}
            <p className="text-xs text-neutral-500">
              Occasional notes on new frames and restocks.
            </p>
          </div>
        </div>

        <div className="w-full max-w-7xl mx-auto pt-8 flex flex-col sm:flex-row justify-between items-center text-[10px] font-mono text-neutral-600 space-y-4 sm:space-y-0">
          <div className="flex items-center gap-1.5">

            <span>Optique Systems Inc. All Rights Reserved.</span>
          </div>
          <div className="flex gap-4">
            <a href="#" className="hover:text-neutral-400">Optical Patents</a>
            <a href="#" className="hover:text-neutral-400">Carbon Statement</a>
            <a href="#" className="hover:text-neutral-400">Security Encryptions</a>
          </div>
        </div>
            
      </footer>
    </div>
  );
}
