import Link from 'next/link';

export const metadata = {
  title: 'LinkPort — Your Entire Professional Identity. One Link.',
  description:
    'Create your professional link page. Connect LinkedIn, GitHub, LeetCode, CodeChef. Build AI resume and cover letters. Share one link with the world.',
};

const features = [
  {
    icon: '🔗',
    title: 'One Link for Everything',
    desc: 'Put all your professional links in one beautiful page — LinkedIn, GitHub, LeetCode, portfolio, resume, and more.',
  },
  {
    icon: '🏆',
    title: 'Developer ScoreCard',
    desc: 'Auto-calculated score combining LeetCode rating, CodeChef stars, GitHub activity. Show recruiters your real dev power.',
  },
  {
    icon: '🤖',
    title: 'AI Resume Builder',
    desc: 'Auto-fill resume from your connected platforms. AI enhances bullets to match job descriptions. ATS score checker included.',
  },
  {
    icon: '✉️',
    title: 'AI Cover Letter',
    desc: 'Paste a job description, pick a tone — AI writes a perfect cover letter. Rewrite paragraphs on demand.',
  },
  {
    icon: '📊',
    title: 'Deep Analytics',
    desc: 'Track profile views, link clicks, device types, countries, referrers. Know who visited and when.',
  },
  {
    icon: '📄',
    title: 'Portfolio PDF Suite',
    desc: 'Generate Dev Card, Portfolio PDF, Achievement Certificate, Project Case Studies — all in seconds.',
  },
];

const steps = [
  { step: '01', title: 'Sign Up & Connect', desc: 'Create account and connect your GitHub, LinkedIn, LeetCode, CodeChef profiles in seconds.' },
  { step: '02', title: 'Build Your Page', desc: 'Customize your public page with themes, colors, bio. Add links, products, embeds.' },
  { step: '03', title: 'Create with AI', desc: 'Let AI build your resume and cover letters from your platform data. ATS-optimize everything.' },
  { step: '04', title: 'Share & Track', desc: 'Share one link everywhere. Track analytics — who viewed, what they clicked, when.' },
];

const pricing = [
  {
    name: 'Free',
    price: '₹0',
    period: 'forever',
    color: 'border-gray-700',
    badge: '',
    features: [
      '1 profile page',
      '5 active links',
      '3 built-in themes',
      '7-day click analytics',
      '1 Resume (basic)',
      '1 Cover Letter (basic)',
      '1 Dev Card PDF',
    ],
    cta: 'Start Free',
    ctaHref: '/register',
    ctaClass: 'bg-gray-700 hover:bg-gray-600 text-white',
  },
  {
    name: 'Pro',
    price: '₹399',
    period: '/month',
    color: 'border-indigo-500',
    badge: '⭐ Most Popular',
    features: [
      'Unlimited links',
      'All themes + custom colors',
      'No LinkPort branding',
      'Custom domain',
      '90-day analytics + geo + devices',
      'LinkedIn, GitHub, LeetCode sync',
      'Developer ScoreCard',
      'Unlimited resumes & cover letters',
      'AI auto-fill from platforms',
      'ATS score checker',
      'All PDF types',
      'Version history',
      'Document analytics',
    ],
    cta: 'Get Pro',
    ctaHref: '/register?plan=pro',
    ctaClass: 'bg-indigo-600 hover:bg-indigo-500 text-white',
  },
  {
    name: 'Agency',
    price: '₹1,299',
    period: '/month',
    color: 'border-purple-500',
    badge: '🏢 Teams',
    features: [
      '10 profiles',
      '5 team members (roles)',
      'Bulk analytics dashboard',
      'White-label ready',
      'Client-branded proposals',
      'Bulk document generation',
      'Priority support',
      'API access',
    ],
    cta: 'Get Agency',
    ctaHref: '/register?plan=agency',
    ctaClass: 'bg-purple-700 hover:bg-purple-600 text-white',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* ─── NAVBAR ─── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-indigo-400">⬡</span> LinkPort
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            <Link href="#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-white transition-colors">How it Works</Link>
            <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors px-4 py-2">
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors font-medium"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="pt-32 pb-24 px-6 text-center relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-indigo-950 border border-indigo-700 text-indigo-300 text-sm px-4 py-1.5 rounded-full mb-6">
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
            The Developer&#39;s Professional Identity Platform
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
            Your Entire{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Professional Identity.
            </span>
            <br />
            One Link.
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Connect LinkedIn, GitHub, LeetCode, CodeChef. Build AI-powered resumes and cover letters.
            Share your{' '}
            <span className="text-indigo-400 font-medium">linkport.io/yourname</span>{' '}
            with recruiters and watch the magic happen.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/25"
            >
              Create Your Free Page →
            </Link>
            <Link
              href="/u/demo"
              className="w-full sm:w-auto border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all"
            >
              See a Demo Profile
            </Link>
          </div>

          <p className="text-gray-600 text-sm mt-4">Free forever · No credit card required</p>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            {[
              { value: '10K+', label: 'Developers' },
              { value: '500K+', label: 'Profile Views' },
              { value: '4.9★', label: 'Rating' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="py-24 px-6 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything you need to stand out</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Built specifically for developers and tech professionals. Not just another Linktree clone.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-indigo-700/50 hover:bg-gray-900/80 transition-all group"
              >
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-semibold mb-2 group-hover:text-indigo-300 transition-colors">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="py-24 px-6 border-t border-gray-800">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How it works</h2>
            <p className="text-gray-400 text-lg">From signup to sharing — in under 5 minutes.</p>
          </div>

          <div className="space-y-8">
            {steps.map((s) => (
              <div key={s.step} className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-14 h-14 bg-indigo-950 border border-indigo-700 rounded-xl flex items-center justify-center text-indigo-300 font-bold text-lg">
                  {s.step}
                </div>
                <div className="pt-2">
                  <h3 className="text-lg font-semibold mb-1">{s.title}</h3>
                  <p className="text-gray-400">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" className="py-24 px-6 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Simple, honest pricing</h2>
            <p className="text-gray-400 text-lg">Start free. Upgrade when you&#39;re ready.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {pricing.map((plan) => (
              <div
                key={plan.name}
                className={`bg-gray-900 border-2 ${plan.color} rounded-2xl p-8 flex flex-col relative`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-semibold px-4 py-1 rounded-full whitespace-nowrap">
                    {plan.badge}
                  </div>
                )}
                <div>
                  <div className="text-sm text-gray-400 font-medium mb-1">{plan.name}</div>
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-gray-400 pb-1">{plan.period}</span>
                  </div>
                </div>
                <ul className="mt-6 space-y-3 flex-1">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-sm text-gray-300">
                      <span className="text-green-400 mt-0.5">✓</span>
                      {feat}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.ctaHref}
                  className={`mt-8 block text-center py-3 px-6 rounded-xl font-semibold transition-all ${plan.ctaClass}`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-24 px-6 border-t border-gray-800">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to build your professional identity?
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            Join thousands of developers who already have their LinkPort page.
          </p>
          <Link
            href="/register"
            className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-4 rounded-xl font-semibold text-lg transition-all hover:scale-105"
          >
            Create Your Free Page →
          </Link>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-gray-800 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2 font-semibold text-white">
            <span className="text-indigo-400">⬡</span> LinkPort
          </div>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-gray-300 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-gray-300 transition-colors">Terms</Link>
            <Link href="/explore" className="hover:text-gray-300 transition-colors">Explore</Link>
          </div>
          <div>© {new Date().getFullYear()} LinkPort. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
