import { ShoppingBag, HelpCircle, Compass, Sliders, Sparkles } from 'lucide-react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

interface NavbarProps {
  cartCount: number;
  onCartClick: () => void;
  activeSection: string;
}

export default function Navbar({ cartCount, onCartClick, activeSection }: NavbarProps) {
  const scrollSectionTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      if (id === 'customizer-trigger') {
        const trigger = ScrollTrigger.getAll().find((st) => st.trigger === el);
        if (trigger) {
          window.scrollTo({
            top: trigger.start + (trigger.end - trigger.start) * 0.53,
            behavior: 'smooth'
          });
          return;
        } else {
          const pinSpacer = el.closest('.pin-spacer') || el;
          const rect = pinSpacer.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const targetY = rect.top + scrollTop;
          window.scrollTo({
            top: targetY + (window.innerHeight * 1.5) * 0.53,
            behavior: 'smooth'
          });
          return;
        }
      }
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navItems = [
    { id: 'hero-trigger', label: 'Elegance', icon: Compass },
    { id: 'features-trigger', label: 'Craftsmanship', icon: Sparkles },
    { id: 'customizer-trigger', label: 'Design Lab', icon: Sliders },
    { id: 'catalog-trigger', label: 'Collection', icon: HelpCircle },
  ];

  const getSectionIndicator = () => {
    switch (activeSection) {
      case 'hero': return '01 / Introduction';
      case 'tech': return '02 / Engineering';
      case 'customizer': return '03 / Bespoke Workshop';
      case 'catalog': return '04 / Curated Collection';
      default: return '01 / Introduction';
    }
  };

  return (
    <nav 
      id="main-navigation"
      className="fixed top-0 left-0 w-full z-50 px-6 py-4 md:px-12 flex justify-between items-center transition-all duration-300 bg-[#0a0a0b]/80 backdrop-blur-md border-b border-neutral-900"
    >
      {/* Brand logo */}
      <div 
        id="navbar-brand"
        className="flex flex-col cursor-pointer"
        onClick={() => scrollSectionTo('hero-trigger')}
      >
        <span className="text-xl font-sans tracking-[0.3em] font-light text-white uppercase">
          O P T I Q U E
        </span>
        <span className="text-[9px] font-mono tracking-widest text-[#b5a68e] uppercase leading-none mt-1 font-bold">
          Atelier of Vision
        </span>
      </div>

      {/* Center Nav Anchors */}
      <div 
        id="navbar-anchors"
        className="hidden md:flex items-center gap-8 bg-neutral-900/80 border border-neutral-800 backdrop-blur-md px-6 py-2.5 rounded-full shadow-lg"
      >
        {navItems.map((item) => {
          const isActive = 
            (item.id === 'hero-trigger' && activeSection === 'hero') ||
            (item.id === 'features-trigger' && activeSection === 'tech') ||
            (item.id === 'customizer-trigger' && activeSection === 'customizer') ||
            (item.id === 'catalog-trigger' && activeSection === 'catalog');

          return (
            <button
              key={item.id}
              onClick={() => scrollSectionTo(item.id)}
              className={`flex items-center gap-1.5 text-xs tracking-wider uppercase font-semibold transition-all duration-300 relative ${
                isActive ? 'text-white font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <item.icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
              {isActive && (
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[#b5a68e] rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Right Action panel */}
      <div id="navbar-actions" className="flex items-center gap-4">
        {/* Dynamic Section Indicator */}
        <div className="hidden lg:block text-right border-r border-neutral-800 pr-4 mr-1">
          <span className="text-[9px] font-mono text-neutral-400 tracking-wider block uppercase font-semibold">Current Phase</span>
          <span className="text-xs font-mono font-bold text-[#b5a68e]">{getSectionIndicator()}</span>
        </div>

        {/* Interactive Shopping Cart Trigger */}
        <button
          onClick={onCartClick}
          className="relative bg-neutral-850 text-white p-3 rounded-full hover:bg-neutral-750 transition-all shadow-md group flex items-center gap-2 hover:scale-105 active:scale-95"
          style={{ cursor: 'pointer' }}
          id="cart-trigger-btn"
        >
          <ShoppingBag className="w-4 h-4 text-neutral-100 group-hover:rotate-6 transition-transform" />
          <span className="text-xs font-mono font-medium hidden sm:inline-block pr-1">Atelier Cart</span>
          {cartCount > 0 ? (
            <span className="absolute -top-1 -right-1 bg-[#b5a68e] text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-mono font-bold border-2 border-[#0a0a0b] animate-[bounce_1.5s_infinite]">
              {cartCount}
            </span>
          ) : (
            <span className="w-1.5 h-1.5 bg-[#b5a68e] rounded-full" />
          )}
        </button>
      </div>
    </nav>
  );
}
