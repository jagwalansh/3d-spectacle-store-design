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
      case 'hero': return 'Home';
      case 'tech': return 'Materials';
      case 'customizer': return 'Customize';
      case 'catalog': return 'Collection';
      default: return 'Home';
    }
  };

  return (
    <nav 
      id="main-navigation"
      className="fixed top-0 left-0 w-full z-50 px-6 py-6 md:px-12 flex justify-between items-start transition-all duration-300 bg-gradient-to-b from-[#0b0b0a]/80 to-transparent"
    >
      {/* Brand logo */}
      <div 
        id="navbar-brand"
        className="flex flex-col cursor-pointer"
        onClick={() => scrollSectionTo('hero-trigger')}
      >
        <span className="text-lg font-sans tracking-[0.28em] font-light text-white uppercase">
          Optique
        </span>
        <span className="text-xs text-neutral-500 leading-none mt-2">
          Handmade eyewear
        </span>
      </div>

      {/* Center Nav Anchors */}
      <div 
        id="navbar-anchors"
        className="hidden md:flex items-center gap-12 pt-2"
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
              className={`text-sm transition-all duration-300 relative ${
                isActive ? 'text-white font-bold' : 'text-neutral-500 hover:text-white'
              }`}
            >
              <span>{item.label}</span>
              {isActive && (
                <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-6 h-px bg-[#b5a68e]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Right Action panel */}
      <div id="navbar-actions" className="flex items-center gap-4">
        {/* Dynamic Section Indicator */}
        <div className="hidden lg:block text-right border-r border-neutral-700/70 pr-6 mr-2">
          <span className="text-xs text-neutral-500 block">Viewing</span>
          <span className="text-sm font-medium text-neutral-200">{getSectionIndicator()}</span>
        </div>

        {/* Interactive Shopping Cart Trigger */}
        <button
          onClick={onCartClick}
          className="relative text-white pt-1 transition-all group flex items-center gap-3 hover:text-[#b5a68e] active:scale-95"
          style={{ cursor: 'pointer' }}
          id="cart-trigger-btn"
        >
          <span className="w-8 h-8 border border-neutral-500 flex items-center justify-center">
            <ShoppingBag className="w-4 h-4 text-neutral-100 group-hover:rotate-6 transition-transform" />
          </span>
          <span className="text-sm font-medium hidden sm:inline-block">Cart</span>
          {cartCount > 0 ? (
            <span className="absolute -top-1 -right-1 bg-[#b5a68e] text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-mono font-bold border-2 border-[#0a0a0b]">
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
