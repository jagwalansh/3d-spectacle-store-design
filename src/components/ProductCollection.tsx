import { Product, CustomizationState } from '../types';
import { Star, Eye, ShoppingCart } from 'lucide-react';
import SpectacleCardCanvas from './SpectacleCardCanvas';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

interface ProductCollectionProps {
  onLoadPreset: (preset: CustomizationState) => void;
  onAddToCartDirectly: (product: Product) => void;
}

export default function ProductCollection({ onLoadPreset, onAddToCartDirectly }: ProductCollectionProps) {
  const curatedProducts: Product[] = [
    {
      id: 'cortina-sun',
      name: 'The Cortina Sun',
      style: 'aviator',
      frameColor: 'polished-amber',
      lensColor: 'forest-ocean',
      price: 235,
      rating: 4.9,
      reviewsCount: 84,
      tags: ['POLARIZED', 'LIMITED EDITION'],
      imageUrl: 'Warm amber tones and signature alpine polar shades.',
    },
    {
      id: 'silicon-blue',
      name: 'The Silicon Guard',
      style: 'rectangular',
      frameColor: 'matte-black',
      lensColor: 'blue-block',
      price: 210,
      rating: 4.8,
      reviewsCount: 121,
      tags: ['BLUE BLOCK', 'BESTSELLER'],
      imageUrl: 'Stealth charcoal framing built for high digital exposures.',
    },
    {
      id: 'monarch-citron',
      name: 'The Monarch Citron',
      style: 'round',
      frameColor: 'champagne-crystal',
      lensColor: 'sunset-gold',
      price: 225,
      rating: 5.0,
      reviewsCount: 42,
      tags: ['GOLD CORE', 'TRANSLUCENT'],
      imageUrl: 'Champagne crystal showcasing internal gold backbone fibers.',
    },
    {
      id: 'sovereign-sun',
      name: 'The Sovereign Classic',
      style: 'round',
      frameColor: 'pure-gold',
      lensColor: 'solar-charcoal',
      price: 270,
      rating: 4.9,
      reviewsCount: 63,
      tags: ['18K GILDED', 'PREMIUM'],
      imageUrl: 'Brilliant imperial polished gold with absolute solar shades.',
    }
  ];

  const handleApplyPreset = (prod: Product) => {
    // Generate customization state equivalent
    const presetState: CustomizationState = {
      style: prod.style,
      frameColor: prod.frameColor,
      lensColor: prod.lensColor,
      transmissionType: prod.frameColor === 'champagne-crystal' ? 'translucent' : (prod.frameColor === 'matte-black' ? 'matte' : 'glossy'),
      engraving: '',
      hingeGold: prod.frameColor === 'pure-gold' || prod.frameColor === 'polished-amber',
    };

    onLoadPreset(presetState);

    // Scroll to design customizer workshop seamlessly!
    const customizerSection = document.getElementById('customizer-trigger');
    if (customizerSection) {
      // Find the active ScrollTrigger instance computed by GSAP for the customizer trigger
      const trigger = ScrollTrigger.getAll().find((st) => st.trigger === customizerSection);
      if (trigger) {
        window.scrollTo({
          top: trigger.start + (trigger.end - trigger.start) * 0.53,
          behavior: 'smooth'
        });
      } else {
        const pinSpacer = customizerSection.closest('.pin-spacer') || customizerSection;
        const rect = pinSpacer.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const targetY = rect.top + scrollTop;
        window.scrollTo({
          top: targetY + (window.innerHeight * 1.5) * 0.53,
          behavior: 'smooth'
        });
      }
    }
  };

  const getStyleLabel = (style: string) => {
    switch (style) {
      case 'round': return 'Round Wire';
      case 'rectangular': return 'Rectangular Block';
      case 'aviator': return 'Teardrop Aviator';
      default: return style;
    }
  };

  const getFrameColorLabel = (color: string) => {
    switch (color) {
      case 'matte-black': return 'Opaque Stealth Black';
      case 'polished-amber': return 'Polished Honey Amber';
      case 'champagne-crystal': return 'Translucent Champagne';
      case 'pure-gold': return 'Mirror 18k Gold Alloy';
      default: return color;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-12 space-y-12" id="catalog-products-module">
      <div className="text-center space-y-3">
        <span className="text-sm text-neutral-400">
          Selected frames
        </span>
        <h2 className="text-3xl sm:text-4xl font-sans tracking-tight font-semibold text-white leading-none">
          Shop the collection
        </h2>
        <p className="text-sm font-sans text-neutral-400 max-w-lg mx-auto leading-relaxed">
          A short edit of ready-to-wear frames. Try a shape in the customizer or add one directly to your bag.
        </p>
      </div>

      <div className="collection-stack w-full" aria-label="Curated eyewear collection">
        {curatedProducts.map((prod, index) => {
            return (
              <div
                key={prod.id}
                className={`collection-stack-card stack-card-${index + 1} bg-[#11110f]/85 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between group overflow-hidden backdrop-blur-sm`}
              >
                {/* Product Info / Tag badges */}
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-1.5">
                    {prod.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-medium text-[#b5a68e] bg-[#b5a68e]/5 border border-[#b5a68e]/15 px-2 py-0.5 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-lg font-sans font-semibold text-white group-hover:text-[#b5a68e] transition-colors">
                      {prod.name}
                    </h3>
                    <p className="text-xs text-neutral-400 capitalize">
                      {getStyleLabel(prod.style)} × {getFrameColorLabel(prod.frameColor)}
                    </p>
                  </div>

                  {/* Exact 3D model visualization */}
                  <div className="bg-neutral-950 rounded-2xl border border-neutral-850/60 h-36 relative overflow-hidden flex flex-col justify-end p-2 group-hover:border-[#b5a68e]/30 transition-all duration-300">
                    {/* 3D Spectacle Preview Canvas */}
                    <div className="absolute inset-0 z-0">
                      <SpectacleCardCanvas
                        style={prod.style}
                        frameColor={prod.frameColor}
                        lensColor={prod.lensColor}
                      />
                    </div>

                    {/* Description text overlay */}
                    <p className="relative z-10 text-[9px] font-sans text-neutral-400 text-center leading-normal px-2 py-1.5 bg-neutral-950/80 backdrop-blur-sm rounded-xl border border-neutral-850/30">
                      {prod.imageUrl}
                    </p>
                  </div>
                </div>

                {/* Price & Rating Row */}
                <div className="border-t border-neutral-850 mt-5 pt-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-sans font-bold text-white">
                      ${prod.price}
                    </span>
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 animate-pulse" />
                      <span className="text-xs font-semibold text-neutral-200">{prod.rating}</span>
                      <span className="text-[10px] font-sans text-neutral-400">({prod.reviewsCount})</span>
                    </div>
                  </div>

                  {/* Dual action buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleApplyPreset(prod)}
                      className="w-full py-2.5 px-1 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 rounded-xl transition-all font-sans font-semibold text-[10px] tracking-wider uppercase flex items-center justify-center gap-1.5 border border-neutral-800"
                      title="Load dynamic 3D specs configuration"
                      style={{ cursor: 'pointer' }}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>

                    <button
                      onClick={() => onAddToCartDirectly(prod)}
                      className="w-full py-2.5 px-1 bg-[#b5a68e] hover:bg-[#b5a68e]/90 text-neutral-950 rounded-xl transition-all font-sans font-bold text-[10px] tracking-wider uppercase flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md"
                      style={{ cursor: 'pointer' }}
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              </div>
            );
        })}
      </div>

      <div className="h-36 sm:h-44" aria-hidden="true" />
    </div>
  );
}
