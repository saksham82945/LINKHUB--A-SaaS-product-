import PublicPortfolioClient from './PublicPortfolioClient';

async function fetchPortfolio(slug) {
  try {
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const res = await fetch(`${baseUrl}/api/portfolio-doc/public/${slug}`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const portfolio = await fetchPortfolio(slug);

  if (!portfolio) {
    return { title: 'Portfolio Not Found | LinkHub' };
  }

  const content = portfolio.content || {};
  const authorName = content.name || portfolio.author?.name || 'Developer';
  const headline = content.headline || 'Software Engineer';

  return {
    title: `${authorName} — ${headline} | LinkHub`,
    description: content.bio || `${authorName}'s professional developer portfolio and projects on LinkHub.`,
    openGraph: {
      type: 'profile',
      title: `${authorName} — ${headline}`,
      description: content.bio || '',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${authorName} — ${headline}`,
      description: content.bio || '',
    },
  };
}

export default async function PublicPortfolioPage({ params }) {
  const { slug } = await params;
  const portfolio = await fetchPortfolio(slug);

  return <PublicPortfolioClient portfolio={portfolio} slug={slug} />;
}
