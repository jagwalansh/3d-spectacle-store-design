import { CustomizationState } from '../types';
import { Sliders, Sparkles, Check } from 'lucide-react';

interface CustomizerSectionProps {
  customization: CustomizationState;
  onCustomizationChange: (newConfig: CustomizationState) => void;
  onAddToCart: () => void;
}

export default function CustomizerSection({
  customization,
  onCustomizationChange,
  onAddToCart,
}: CustomizerSectionProps) {
  
  const frameStyles = [
    { id: 'round', name: 'Round' },
    { id: 'rectangular', name: 'Rectangle' },
    { id: 'aviator', name: 'Aviator' },
  ];

  const frameColorsOption = [
    { id: 'matte-black', name: 'Matte Black', hex: '#1c1917', bgClass: 'bg-[#1c1917]', cost: 0 },
    { id: 'champagne-crystal', name: 'Champagne Citron', hex: '#eedbb0', bgClass: 'bg-[#eedbb0]/80', cost: 15 },
    { id: 'polished-amber', name: 'Amber Tortoise', hex: '#d97706', bgClass: 'bg-amber-600', cost: 25 },
    { id: 'rose-acetate', name: 'Sunset Quartz', hex: '#fda4af', bgClass: 'bg-rose-300', cost: 15 },
    { id: 'pure-gold', name: '18k Gold Alloy', hex: '#d4af37', bgClass: 'bg-yellow-500', cost: 60 },
    { id: 'platinum', name: 'Brushed Platinum', hex: '#cbd5e1', bgClass: 'bg-slate-300', cost: 45 },
  ];

  const lensColorsOption = [
    { id: 'solar-charcoal', name: 'Charcoal', hex: '#020617', bgClass: 'bg-neutral-950' },
    { id: 'blue-block', name: 'Blue-Light Guard', hex: '#38bdf8', bgClass: 'bg-sky-400' },
    { id: 'sunset-gold', name: 'Reflective Gold', hex: '#f59e0b', bgClass: 'bg-amber-500' },
    { id: 'forest-ocean', name: 'Teal Anti-Glare', hex: '#0d9488', bgClass: 'bg-teal-600' },
  ];

  const calculateTotalPrice = () => {
    let base = 210;
    const selectedFrame = frameColorsOption.find((f) => f.id === customization.frameColor);
    if (selectedFrame) base += selectedFrame.cost;
    if (customization.transmissionType === 'translucent') base += 20;
    if (customization.hingeGold) base += 25;
    if (customization.engraving) base += 10;
    return base;
  };

  const updateStyle = (style: 'round' | 'rectangular' | 'aviator') => {
    onCustomizationChange({ ...customization, style });
  };

  const updateFrameColor = (frameColor: string) => {
    onCustomizationChange({ ...customization, frameColor });
  };

  const updateLensColor = (lensColor: string) => {
    onCustomizationChange({ ...customization, lensColor });
  };

  const toggleHinge = () => {
    onCustomizationChange({ ...customization, hingeGold: !customization.hingeGold });
  };

  const updateEngraving = (engraving: string) => {
    if (engraving.length <= 15) {
      onCustomizationChange({ ...customization, engraving });
    }
  };

  const selectedFrameColor = frameColorsOption.find((f) => f.id === customization.frameColor);
  const selectedLensColor = lensColorsOption.find((l) => l.id === customization.lensColor);

  return (
    <div id="eyewear-customizer-form" className="bg-neutral-900/65 border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-xl w-full flex flex-col gap-6">
      {/* Sleek Minimal Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-neutral-800 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-[#b5a68e]" />
          <span className="text-xs font-mono tracking-[0.2em] font-bold text-white uppercase">Atelier Design Lab</span>
        </div>
        <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest">
          Active Custom Configurator // Version 1.0
        </span>
      </div>

      {/* Horizontal Tool Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Style Selection */}
        <div className="space-y-1.5">
          <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider block">01 / Frame Silhouette</span>
          <div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-800 gap-1">
            {frameStyles.map((styleOpt) => {
              const isSelected = customization.style === styleOpt.id;
              return (
                <button
                  key={styleOpt.id}
                  onClick={() => updateStyle(styleOpt.id as any)}
                  className={`flex-1 py-1.5 text-[10px] font-sans font-medium rounded-lg text-center transition-all ${
                    isSelected
                      ? 'bg-neutral-850 text-white font-bold border border-[#b5a68e]/35'
                      : 'text-neutral-500 hover:text-white'
                  }`}
                  style={{ cursor: 'pointer' }}
                >
                  {styleOpt.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Frame Color */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-baseline">
            <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider block">02 / Frame Color</span>
            <span className="text-[8px] font-mono text-neutral-500 truncate max-w-[100px] text-right">
              {selectedFrameColor?.name}
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-neutral-950 p-2 rounded-xl border border-neutral-800 min-h-[38px] justify-center">
            {frameColorsOption.map((colOpt) => {
              const isSelected = customization.frameColor === colOpt.id;
              return (
                <button
                  key={colOpt.id}
                  onClick={() => updateFrameColor(colOpt.id)}
                  className={`relative p-0.5 rounded-full border transition-all hover:scale-105 flex items-center justify-center ${
                    isSelected ? 'border-white scale-105' : 'border-neutral-800'
                  }`}
                  title={colOpt.name}
                  style={{ cursor: 'pointer' }}
                >
                  <span className={`w-4.5 h-4.5 rounded-full block shadow-inner ${colOpt.bgClass}`} />
                  {isSelected && (
                    <span className="absolute inset-0 m-auto w-3 h-3 bg-white/40 rounded-full flex items-center justify-center">
                      <Check className="w-2 h-2 text-neutral-900 font-bold" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Lens Color */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-baseline">
            <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider block">03 / Lens Filter</span>
            <span className="text-[8px] font-mono text-neutral-500 truncate max-w-[100px] text-right">
              {selectedLensColor?.name}
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-neutral-950 p-2 rounded-xl border border-neutral-800 min-h-[38px] justify-center">
            {lensColorsOption.map((lensOpt) => {
              const isSelected = customization.lensColor === lensOpt.id;
              return (
                <button
                  key={lensOpt.id}
                  onClick={() => updateLensColor(lensOpt.id)}
                  className={`relative p-0.5 rounded-full border transition-all hover:scale-105 flex items-center justify-center ${
                    isSelected ? 'border-white scale-105' : 'border-neutral-850'
                  }`}
                  title={lensOpt.name}
                  style={{ cursor: 'pointer' }}
                >
                  <span className={`w-4.5 h-4.5 rounded-full block shadow-inner ${lensOpt.bgClass}`} />
                  {isSelected && (
                    <span className="absolute inset-0 m-auto w-3 h-3 bg-white/40 rounded-full flex items-center justify-center">
                      <Check className="w-2 h-2 text-neutral-900 font-bold" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Engraving / Gilded Hinges (Simplified) */}
        <div className="space-y-1.5">
          <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider block">04 / Bespoke Details</span>
          <div className="flex bg-neutral-950 p-1.5 rounded-xl border border-neutral-800 gap-3 items-center justify-between min-h-[38px]">
            {/* Hinge toggle */}
            <button
              onClick={toggleHinge}
              className={`text-[10px] font-sans font-medium px-2 py-1 rounded-md border transition-all ${
                customization.hingeGold
                  ? 'bg-amber-950/20 text-[#b5a68e] border-[#b5a68e]/40 font-bold'
                  : 'text-neutral-500 border-neutral-850 hover:text-white'
              }`}
              style={{ cursor: 'pointer' }}
            >
              18k Hinge
            </button>

            {/* Mini Engraving input */}
            <input
              type="text"
              placeholder="Engraving"
              value={customization.engraving}
              onChange={(e) => updateEngraving(e.target.value)}
              className="text-[10px] font-mono tracking-wider uppercase bg-neutral-900 border border-neutral-800 rounded-md px-2 py-1 text-neutral-200 placeholder:text-neutral-700 w-24 text-center focus:outline-none focus:border-neutral-700"
            />
          </div>
        </div>
      </div>

      {/* Pricing & Checkout horizontal row */}
      <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-neutral-800 gap-4 mt-1">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-[8px] font-mono text-neutral-500 tracking-wider block uppercase font-bold">Total Price</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-sans font-bold tracking-tight text-white">${calculateTotalPrice()}</span>
              <span className="text-[9px] font-mono text-neutral-500">USD</span>
            </div>
          </div>
          <div className="border-l border-neutral-800 pl-4">
            <span className="text-[8px] font-mono text-green-400 bg-green-950/30 px-2 py-0.5 border border-green-900/30 rounded-full inline-block font-bold">
              IN STOCK
            </span>
            <span className="text-[9px] font-sans text-neutral-500 block mt-0.5">Dispatched within 24 Hours</span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={onAddToCart}
            className="flex-1 sm:flex-none py-3 px-8 bg-[#b5a68e] text-neutral-950 rounded-xl hover:bg-[#b5a68e]/90 transition-all font-sans font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-md group hover:scale-102 active:scale-98"
            style={{ cursor: 'pointer' }}
            id="add-custom-specs-tobag"
          >
            <Sparkles className="w-3.5 h-3.5 text-neutral-950" />
            <span>Order Atelier Specs</span>
          </button>
        </div>
      </div>
    </div>
  );
}
