import { useEffect, useRef, useState } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function TechHighlights() {
  const [activeFeature, setActiveFeature] = useState(0);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);

  const features = [
    {
      title: 'Mazzucchelli Bio-Acetate',
      tag: 'CRAFT',
      desc: 'Italian cellulose acetate with a warm hand feel and visible depth through the frame.',
      highlightArea: 'Rims & Bridge',
      metrics: 'Plant-based acetate'
    },
    {
      title: 'Monoblock Gold-Gilded Hinges',
      tag: 'ENGINEERING',
      desc: 'Five-barrel hinges with a firm open and close, fitted flush into the temple.',
      highlightArea: 'Temples connection',
      metrics: 'Five-barrel steel'
    },
    {
      title: 'Zeiss Protective Lens Coating',
      tag: 'OPTICS',
      desc: 'Clear protective lenses with anti-reflective coating for everyday indoor and outdoor use.',
      highlightArea: 'Lens interiors',
      metrics: 'UV400 coating'
    },
    {
      title: 'Exposed Core Engraving',
      tag: 'BESPOKE DESIGN',
      desc: 'A visible inner wire can be engraved for initials, dates, or a short line of text.',
      highlightArea: 'Inner temples',
      metrics: 'Optional engraving'
    }
  ];

  const scrollToDesignLab = () => {
    const customizer = document.getElementById('customizer-trigger');
    if (!customizer) return;

    const trigger = ScrollTrigger.getAll().find((st) => st.trigger === customizer);
    if (trigger) {
      window.scrollTo({
        top: trigger.start + (trigger.end - trigger.start) * 0.53,
        behavior: 'smooth',
      });
      return;
    }

    customizer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    let animationFrame = 0;

    const updateCenteredFeature = () => {
      const viewportCenter = window.innerHeight / 2;
      let closestIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;

      itemRefs.current.forEach((item, index) => {
        if (!item) return;

        const rect = item.getBoundingClientRect();
        const itemCenter = rect.top + rect.height / 2;
        const distance = Math.abs(itemCenter - viewportCenter);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      setActiveFeature(closestIndex);
    };

    const requestUpdate = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(updateCenteredFeature);
    };

    updateCenteredFeature();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
    };
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start w-full max-w-7xl mx-auto px-6 py-6" id="tech-highlights-module">
      <div className="lg:col-span-6 flex flex-col justify-start gap-10">
        <div className="space-y-4 max-w-xl">
          <span className="text-sm text-[#b5a68e]">Materials and finish</span>
          <h2 className="text-3xl sm:text-4xl font-sans tracking-tight font-light text-white leading-tight">
            Made with fewer parts,
            <span className="block text-neutral-400">finished with more care.</span>
          </h2>
          <p className="text-base font-sans text-neutral-400 leading-relaxed max-w-lg">
            The frame keeps the construction visible: acetate, hinge, lens, and temple wire. Scroll through the details before moving into the customizer.
          </p>
        </div>

        <div className="divide-y divide-neutral-800/70 border-y border-neutral-800/70">
          {features.map((feat, index) => {
            const isActive = activeFeature === index;

            return (
              <article
                key={feat.title}
                ref={(element) => {
                  itemRefs.current[index] = element;
                }}
                data-index={index}
                className={`py-7 transition-all duration-500 ${
                  isActive
                    ? 'opacity-100 blur-0 translate-x-0'
                    : 'opacity-25 blur-[8px] translate-x-1'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-baseline justify-between gap-4">
                    <div>
                      <p className="text-xs text-neutral-600">{feat.tag}</p>
                      <h3 className="text-xl font-medium text-white mt-1">{feat.title}</h3>
                    </div>
                    <span className="text-xs text-neutral-600">0{index + 1}</span>
                  </div>

                  <p className="mt-3 text-base text-neutral-400 leading-relaxed">
                    {feat.desc}
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-6 text-sm">
                    <div>
                      <span className="text-neutral-600 block">Part</span>
                      <span className="text-neutral-300 mt-1 block">
                        {feat.highlightArea}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-600 block">Finish</span>
                      <span className="text-[#b5a68e] mt-1 block">
                        {feat.metrics}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="pt-2">
          <button
            onClick={scrollToDesignLab}
            className="flex items-center gap-2 border-b border-[#b5a68e]/50 pb-2 text-sm text-[#b5a68e] font-medium hover:gap-3 transition-all"
            style={{ cursor: 'pointer' }}
          >
            <span>Customize your frame</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>

      <div className="lg:col-span-6 hidden lg:block h-[500px]" />
    </div>
  );
}
