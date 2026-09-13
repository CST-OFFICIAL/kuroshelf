import { getAuthHeaders } from './authService';

export interface PollOptionItem {
  id: number;
  option_text: string;
  votes: number;
  percentage: number;
}

export interface PredictionPollItem {
  id: number;
  title: string;
  anime_id: number | null;
  question: string;
  status: 'upcoming' | 'active' | 'closed';
  starts_at: string;
  ends_at: string;
  total_votes: number;
  user_voted_option_id: number | null;
  options: PollOptionItem[];
}

export async function fetchServerPolls(): Promise<PredictionPollItem[]> {
  try {
    const res = await fetch('/api/polls', {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch (err) {
    console.warn('[Poll Service] Failed to fetch polls:', err);
    return [];
  }
}

export async function voteInPoll(pollId: number, optionId: number): Promise<{ success: boolean; data?: PredictionPollItem; error?: string }> {
  try {
    const res = await fetch(`/api/polls/${pollId}/vote`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ optionId }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.error || 'Failed to record vote' };
    }
    return { success: true, data: json.data };
  } catch (err) {
    return { success: false, error: 'Network error submitting vote' };
  }
}
