'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function EmailListPage() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscribers = async () => {
      try {
        const res = await api.get('/email-list');
        setSubscribers(res.data);
      } catch (err) {
        toast.error('Failed to load subscribers');
      } finally {
        setLoading(false);
      }
    };
    fetchSubscribers();
  }, []);

  const handleExportCSV = () => {
    const headers = ['Email', 'Name', 'Subscribed At'];
    const csvContent = [
      headers.join(','),
      ...subscribers.map((s) => [s.email, s.name || '', new Date(s.subscribedAt).toISOString()].join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'subscribers.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">Email Subscribers</h1>
          <button
            onClick={handleExportCSV}
            disabled={subscribers.length === 0}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Export to CSV
          </button>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : subscribers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              You don't have any subscribers yet. Your profile will automatically show an email subscription form!
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 text-xs uppercase tracking-wider text-gray-500">
                  <th className="p-4 font-medium">Email</th>
                  <th className="p-4 font-medium">Name</th>
                  <th className="p-4 font-medium">Subscribed Date</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {subscribers.map((sub) => (
                  <tr key={sub.id} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors">
                    <td className="p-4 text-gray-300">{sub.email}</td>
                    <td className="p-4 text-gray-400">{sub.name || '—'}</td>
                    <td className="p-4 text-gray-500">
                      {new Date(sub.subscribedAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
