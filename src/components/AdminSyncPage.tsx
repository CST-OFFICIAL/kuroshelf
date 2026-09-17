import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Activity, Play, CheckCircle, XCircle } from 'lucide-react';

export function AdminSyncPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    if (!isSupabaseConfigured) {
      setError("Supabase not configured");
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('sync_jobs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(20);
    
    if (error) {
      setError(error.message);
    } else {
      setJobs(data || []);
    }
    setLoading(false);
  };

  const startSync = async (type: string) => {
    setRunning(true);
    try {
      const res = await fetch(`/api/admin/sync?type=${type}`, { method: 'POST' });
      if (res.ok) {
        setTimeout(fetchJobs, 2000);
      } else {
        setError('Failed to trigger sync');
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Sync Monitor</h1>
          <p className="text-gray-400">Manage and monitor Jikan anime catalog ingestion jobs.</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => startSync('airing')}
            disabled={running}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50"
          >
            <Play className="w-4 h-4" /> Sync Airing
          </button>
          <button
            onClick={() => startSync('popular')}
            disabled={running}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50"
          >
            <Play className="w-4 h-4" /> Sync Popular
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-md mb-8">
          {error}
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-800/50 text-gray-400 border-b border-gray-800">
            <tr>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Job Type</th>
              <th className="px-6 py-4 font-medium">Started At</th>
              <th className="px-6 py-4 font-medium">Duration</th>
              <th className="px-6 py-4 font-medium text-right">Processed</th>
              <th className="px-6 py-4 font-medium text-right">Updated</th>
              <th className="px-6 py-4 font-medium text-right">Failed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {loading ? (
              <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">Loading jobs...</td></tr>
            ) : jobs.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">No sync history found.</td></tr>
            ) : (
              jobs.map(job => (
                <tr key={job.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4">
                    {job.status === 'completed' && <span className="flex items-center gap-2 text-green-400"><CheckCircle className="w-4 h-4"/> Success</span>}
                    {job.status === 'running' && <span className="flex items-center gap-2 text-blue-400"><Activity className="w-4 h-4 animate-pulse"/> Running</span>}
                    {job.status === 'failed' && <span className="flex items-center gap-2 text-red-400"><XCircle className="w-4 h-4"/> Failed</span>}
                  </td>
                  <td className="px-6 py-4 capitalize">{job.job_type}</td>
                  <td className="px-6 py-4 text-gray-400">{new Date(job.started_at).toLocaleString()}</td>
                  <td className="px-6 py-4 text-gray-400">
                    {job.completed_at ? `\${Math.round((new Date(job.completed_at).getTime() - new Date(job.started_at).getTime()) / 1000)}s` : '-'}
                  </td>
                  <td className="px-6 py-4 text-right">{job.records_processed}</td>
                  <td className="px-6 py-4 text-right text-green-400">{job.records_updated}</td>
                  <td className="px-6 py-4 text-right text-red-400">{job.failures}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
