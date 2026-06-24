import { Shield, Sparkles, Hammer, Cpu, ArrowRight } from 'lucide-react';
import { useState } from 'react';

export default function TechHighlights() {
  const [activeHighlight, setActiveHighlight] = useState<number>(0);

  const features = [
    {
      title: 'Mazzucchelli Bio-Acetate',
      tag: 'CRAFT',
      desc: 'Hand-sculpted cellulose acetate sourced from historical Italian ateliers. Entirely organic, skin-friendly, and displaying stunning depth of color or translucent depth of clarity.',
      icon: Hammer,
      highlightArea: 'Rims & Bridge',
      metrics: '100% Biodegradable • High-Gloss Polish'
    },
    {
      title: 'Monoblock Gold-Gilded Hinges',
      tag: 'ENGINEERING',
      desc: 'Five-barrel steel hinges dipped in absolute 18k Champagne Gold or clean Platinum finish. Hand-pressed flush rivets anchor the temples with zero slop for lifelong structural integrity.',
      icon: Cpu,
      highlightArea: 'Temples connection',
      metrics: '50,000 Scroll Action Certified'
    },
    {
      title: 'Zeiss Protective Lens Coating',
      tag: 'OPTICS',
      desc: 'Custom-developed premium lenses fitted with precise anti-reflective coatings. Suppresses 99.8% of blue-light pollution while maintaining flawless crystal-clear color fidelity.',
      icon: Shield,
      highlightArea: 'Lens interiors',
      metrics: 'Polarized UV400 • Double-Sided Anti-Scratch'
    },
    {
      title: 'Exposed Core Engraving',
      tag: 'BESPOKE DESIGN',
      desc: 'A physical gold-foil metallic spline running straight through translucent acetate limbs. Adorned with delicate laser-etched linework which catches sunlight on every gaze.',
      icon: Sparkles,
      highlightArea: 'Inner temples',
      metrics: 'Custom text etching enabled'
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch w-full max-w-7xl mx-auto px-6 py-6" id="tech-highlights-module">
      {/* Main content column on the left (col-span-6) */}
      <div className="lg:col-span-6 flex flex-col justify-start gap-6">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#b5a68e]/10 border border-[#b5a68e]/25 text-xs font-mono text-[#b5a68e] font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>OPTICAL PATENTS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-sans tracking-tight font-extralight text-white leading-tight">
            Meticulously Sculpted. <br />
            <span className="font-semibold text-[#b5a68e]">Technically Perfected.</span>
          </h2>
          <p className="text-sm font-sans text-neutral-400 leading-relaxed">
            Every millimeter of our eyewear represents hundreds of hours of design refinement, fusing Italian premium heritage craft with modern high-performance physics.
          </p>
        </div>

        {/* Compact grid selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {features.map((feat, i) => {
            const Icon = feat.icon;
            const isActive = activeHighlight === i;

            return (
              <button
                key={feat.title}
                onClick={() => setActiveHighlight(i)}
                className={`text-left p-3.5 rounded-2xl border transition-all duration-300 flex items-center gap-3 ${
                  isActive
                    ? 'bg-neutral-800 border-[#b5a68e]/50 text-white shadow-md'
                    : 'bg-neutral-900/40 border-neutral-800 text-neutral-400 hover:bg-neutral-800/50 hover:border-neutral-700 hover:text-white'
                }`}
                style={{ cursor: 'pointer' }}
              >
                <div className={`p-2 rounded-xl transition-all ${
                  isActive ? 'bg-white/10 text-white' : 'bg-neutral-950 text-neutral-500'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[8px] font-mono tracking-widest font-bold text-[#b5a68e] uppercase block truncate">
                    {feat.tag}
                  </span>
                  <h3 className={`text-xs font-sans font-semibold truncate ${isActive ? 'text-white' : 'text-neutral-300'}`}>
                    {feat.title}
                  </h3>
                </div>
              </button>
            );
          })}
        </div>

        {/* Detailed Profile container on the left bottom */}
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-lg relative overflow-hidden backdrop-blur-md">
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

          <div className="space-y-4 relative z-10">
            <div className="flex justify-between items-start border-b border-neutral-850 pb-3">
              <h4 className="text-lg font-sans font-bold text-white">
                {features[activeHighlight].title}
              </h4>
              <span className="text-2xl font-mono text-neutral-800 font-extrabold tracking-tighter">
                0{activeHighlight + 1}
              </span>
            </div>

            <p className="text-xs sm:text-sm font-sans text-neutral-300 leading-relaxed font-light">
              {features[activeHighlight].desc}
            </p>

            <div className="grid grid-cols-2 gap-3 bg-neutral-950/60 rounded-xl p-3 border border-neutral-800 shadow-sm">
              <div>
                <span className="text-[9px] font-mono text-neutral-500 block uppercase">Component Target</span>
                <span className="text-xs font-mono font-medium text-neutral-300 mt-0.5">
                  {features[activeHighlight].highlightArea}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-mono text-neutral-500 block uppercase">Material Grade</span>
                <span className="text-xs font-mono font-semibold text-[#b5a68e] mt-0.5">
                  {features[activeHighlight].metrics}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-neutral-850 flex items-center justify-between relative z-10">
            <p className="text-[9px] font-mono text-neutral-500">
              Observe real-time highlights updates as you toggle options.
            </p>
            <button 
              onClick={() => {
                const customizer = document.getElementById('customizer-trigger');
                if (customizer) customizer.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-1.5 text-xs font-mono text-[#b5a68e] font-bold hover:gap-2.5 transition-all"
              style={{ cursor: 'pointer' }}
            >
              <span>DESIGN LAB</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Spacer right column completely empty so the 3D spectacles can land here cleanly on scroll! */}
      <div className="lg:col-span-6 hidden lg:block h-[500px]" />
    </div>
  );
}
