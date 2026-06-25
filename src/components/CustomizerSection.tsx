import { CustomizationState } from '../types';
import { Check } from 'lucide-react';

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
    <div id="eyewear-customizer-form" className="bg-[#10100f] border border-neutral-800 rounded-lg p-5 sm:p-6 w-full flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-neutral-800 pb-4 gap-2">
        <h3 className="text-lg font-medium text-white">Customize your frame</h3>
        <span className="text-xs text-neutral-500">
          Changes update the 3D preview
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        <div className="space-y-2">
          <span className="text-sm text-neutral-300 block">Frame shape</span>
          <div className="grid grid-cols-3 overflow-hidden rounded-md border border-neutral-800">
            {frameStyles.map((styleOpt) => {
              const isSelected = customization.style === styleOpt.id;
              return (
                <button
                  key={styleOpt.id}
                  onClick={() => updateStyle(styleOpt.id as any)}
                  className={`py-2 text-xs font-medium text-center transition-all border-r border-neutral-800 last:border-r-0 ${
                    isSelected
                      ? 'bg-neutral-800 text-white'
                      : 'text-neutral-500 hover:text-neutral-200'
                  }`}
                  style={{ cursor: 'pointer' }}
                >
                  {styleOpt.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-neutral-300 block">Frame color</span>
            <span className="text-xs text-neutral-500 truncate max-w-[100px] text-right">
              {selectedFrameColor?.name}
            </span>
          </div>
          <div className="flex items-center gap-2 min-h-[38px]">
            {frameColorsOption.map((colOpt) => {
              const isSelected = customization.frameColor === colOpt.id;
              return (
                <button
                  key={colOpt.id}
                  onClick={() => updateFrameColor(colOpt.id)}
                  className={`relative rounded-full border transition-all flex items-center justify-center ${
                    isSelected ? 'border-white' : 'border-neutral-700 hover:border-neutral-500'
                  }`}
                  title={colOpt.name}
                  style={{ cursor: 'pointer' }}
                >
                  <span className={`w-5 h-5 rounded-full block ${colOpt.bgClass}`} />
                  {isSelected && (
                    <span className="absolute inset-0 m-auto w-3 h-3 bg-white/50 rounded-full flex items-center justify-center">
                      <Check className="w-2 h-2 text-neutral-900 font-bold" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-neutral-300 block">Lens tint</span>
            <span className="text-xs text-neutral-500 truncate max-w-[100px] text-right">
              {selectedLensColor?.name}
            </span>
          </div>
          <div className="flex items-center gap-2 min-h-[38px]">
            {lensColorsOption.map((lensOpt) => {
              const isSelected = customization.lensColor === lensOpt.id;
              return (
                <button
                  key={lensOpt.id}
                  onClick={() => updateLensColor(lensOpt.id)}
                  className={`relative rounded-full border transition-all flex items-center justify-center ${
                    isSelected ? 'border-white' : 'border-neutral-700 hover:border-neutral-500'
                  }`}
                  title={lensOpt.name}
                  style={{ cursor: 'pointer' }}
                >
                  <span className={`w-5 h-5 rounded-full block ${lensOpt.bgClass}`} />
                  {isSelected && (
                    <span className="absolute inset-0 m-auto w-3 h-3 bg-white/50 rounded-full flex items-center justify-center">
                      <Check className="w-2 h-2 text-neutral-900 font-bold" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-sm text-neutral-300 block">Details</span>
          <div className="flex gap-3 items-center justify-between min-h-[38px]">
            <button
              onClick={toggleHinge}
              className={`text-xs font-medium px-3 py-2 rounded-md border transition-all ${
                customization.hingeGold
                  ? 'bg-[#b5a68e] text-neutral-950 border-[#b5a68e]'
                  : 'text-neutral-500 border-neutral-800 hover:text-white'
              }`}
              style={{ cursor: 'pointer' }}
            >
              18k Hinge
            </button>

            <input
              type="text"
              placeholder="Engraving"
              value={customization.engraving}
              onChange={(e) => updateEngraving(e.target.value)}
              className="text-xs bg-transparent border-b border-neutral-800 px-2 py-2 text-neutral-200 placeholder:text-neutral-700 w-28 text-center focus:outline-none focus:border-neutral-500"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center pt-5 border-t border-neutral-800 gap-4 mt-1">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-xs text-neutral-500 block">Total</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-sans font-bold tracking-tight text-white">${calculateTotalPrice()}</span>
              <span className="text-xs text-neutral-500">USD</span>
            </div>
          </div>
          <div className="border-l border-neutral-800 pl-4">
            <span className="text-xs text-green-400 inline-block font-medium">
              In stock
            </span>
            <span className="text-xs font-sans text-neutral-500 block mt-0.5">Ships within 24 hours</span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={onAddToCart}
            className="flex-1 sm:flex-none py-3 px-8 bg-[#b5a68e] text-neutral-950 rounded-md hover:bg-[#b5a68e]/90 transition-all font-sans font-semibold text-sm flex items-center justify-center"
            style={{ cursor: 'pointer' }}
            id="add-custom-specs-tobag"
          >
            <span>Add custom frame</span>
          </button>
        </div>
      </div>
    </div>
  );
}
