import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-8xl mb-6">🔗</div>
        <h1 className="text-6xl font-bold text-white mb-3">404</h1>
        <p className="text-gray-400 text-lg mb-8">
          Hmm, this page doesn&#39;t exist. Maybe the link is broken or the profile was removed.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/"
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            Go Home
          </Link>
          <Link
            href="/explore"
            className="border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            Explore Profiles
          </Link>
        </div>
      </div>
    </div>
  );
}
