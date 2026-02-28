import { useNavigate } from 'react-router-dom';
import { Button, Text, Icon } from '@gravity-ui/uikit';
import { ShieldCheck, Rocket, LayoutHeader } from '@gravity-ui/icons';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="box-border min-h-screen w-full max-w-[100vw] bg-[var(--g-color-base-generic-hover,#0a0a0a)] text-white flex flex-col items-center overflow-x-hidden relative font-sans">
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute rounded-full blur-[120px] opacity-60 animate-float w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(116,58,255,0.4)_0%,rgba(116,58,255,0)_70%)] -top-[200px] -left-[200px]"></div>
        <div className="absolute rounded-full blur-[120px] opacity-60 animate-float w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(0,212,255,0.3)_0%,rgba(0,212,255,0)_70%)] -bottom-[150px] -right-[150px] [animation-delay:-5s]"></div>
      </div>

      <header className="w-full flex justify-between items-center p-6 md:px-12 z-10 backdrop-blur-md border-b border-white/5">
        <Text variant="display-1" style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>CNF <span className="text-indigo-400">Nexus</span></Text>
        <div className="flex items-center gap-4">
          <Button view="flat-secondary" size="l" onClick={() => navigate('/staff-login')}>
            Staff Login
          </Button>
          <Button view="outlined" size="l" onClick={() => navigate('/login')}>
            Sign In
          </Button>
        </div>
      </header>

      <main className="relative z-10 flex flex-col justify-center items-center flex-1 w-full max-w-[1200px] p-6 text-center">
        <div className="bg-white/5 backdrop-blur-xl md:backdrop-blur-2xl border border-white/10 rounded-3xl p-8 md:p-12 flex flex-col items-center shadow-2xl transition-transform duration-300 hover:-translate-y-1 w-full">
          <h1 className="text-[clamp(2.5rem,8vw,5rem)] font-extrabold tracking-tight mb-6 bg-gradient-to-br from-white to-indigo-300 bg-clip-text text-transparent leading-[1.1]">
            The Future of C&F Management
          </h1>
          <p className="text-[clamp(1rem,4vw,1.5rem)] text-white/70 max-w-[600px] mb-12 leading-relaxed">
            A state-of-the-art multi-tenant platform architected for infinite scale, absolute security, and zero-friction operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
            <Button view="action" size="xl" onClick={() => navigate('/register')}>
              Get Started Now
            </Button>
            <Button view="flat-secondary" size="xl" onClick={() => window.open('https://github.com/shahriar-sakib-khan/anti-gravity-mern-starter', '_blank')}>
              View Documentation
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6 mt-16 w-full">
          <div className="bg-white/5 border border-white/5 p-8 rounded-2xl text-left">
             <div className="mb-4 text-indigo-300">
               <Icon data={ShieldCheck} size={32} />
             </div>
             <h3 className="text-[1.2rem] font-semibold mb-3 text-white">Silent Tenant Isolation</h3>
             <p className="text-[0.95rem] text-white/50 leading-relaxed">Military-grade data separation meaning your data is cryptographically enclosed to your space.</p>
          </div>
          <div className="bg-white/5 border border-white/5 p-8 rounded-2xl text-left">
             <div className="mb-4 text-cyan-300">
               <Icon data={Rocket} size={32} />
             </div>
             <h3 className="text-[1.2rem] font-semibold mb-3 text-white">Gravity UI Engine</h3>
             <p className="text-[0.95rem] text-white/50 leading-relaxed">Incredibly performant user interfaces engineered exactly like top-tier Yandex production systems.</p>
          </div>
          <div className="bg-white/5 border border-white/5 p-8 rounded-2xl text-left">
             <div className="mb-4 text-red-300">
               <Icon data={LayoutHeader} size={32} />
             </div>
             <h3 className="text-[1.2rem] font-semibold mb-3 text-white">Vertical Slice Architecture</h3>
             <p className="text-[0.95rem] text-white/50 leading-relaxed">Bulletproof logic segregation offering absolute guarantee of API resilience and speed.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
