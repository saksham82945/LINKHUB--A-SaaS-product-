import { notFound } from 'next/navigation';
import PublicProfileClient from './PublicProfileClient';

async function fetchProfile(username) {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const res = await fetch(
      `${backendUrl}/api/profile/${username}`,
      { next: { revalidate: 30 } },
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { username } = await params;
  const profile = await fetchProfile(username);

  if (!profile) {
    return { title: 'Profile not found | LinkPort' };
  }

  return {
    title: profile.seoTitle || `${profile.displayName} (@${profile.username}) | LinkPort`,
    description:
      profile.seoDescription ||
      profile.bio ||
      `View ${profile.displayName}'s professional links, projects, and achievements on LinkPort.`,
    openGraph: {
      type: 'profile',
      title: `${profile.displayName} | LinkPort`,
      description: profile.bio || '',
      images: profile.avatarUrl ? [{ url: profile.avatarUrl }] : [],
    },
    twitter: {
      card: 'summary',
      title: `${profile.displayName} | LinkPort`,
      description: profile.bio || '',
      images: profile.avatarUrl ? [profile.avatarUrl] : [],
    },
  };
}

export default async function PublicProfilePage({ params }) {
  const { username } = await params;
  const profile = await fetchProfile(username);

  if (!profile) notFound();

  return <PublicProfileClient profile={profile} />;
}
