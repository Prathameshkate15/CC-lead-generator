/**
 * YouTube Data API v3 Service
 * Handles channel verification, subscriber counts, and upload activity checks
 */

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

interface YouTubeChannelSnippet {
  title: string;
  customUrl?: string;
  publishedAt: string;
}

interface YouTubeChannelStatistics {
  subscriberCount: string;
  videoCount: string;
}

interface YouTubeChannel {
  id: string;
  snippet: YouTubeChannelSnippet;
  statistics: YouTubeChannelStatistics;
}

interface YouTubeSearchResult {
  id: {
    channelId: string;
  };
  snippet: {
    channelTitle: string;
  };
}

export interface VerifiedChannelData {
  channelId: string;
  channelName: string;
  subscriberCount: string; // Formatted (e.g., "127K")
  actualSubscribers: number; // Raw number
  channelUrl: string;
  verified: boolean;
  lastUpload?: string;
  hasRecentUpload: boolean;
}

/**
 * Format subscriber count to readable format (e.g., 127000 -> "127K")
 */
function formatSubscriberCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  } else if (count >= 1000) {
    const inK = count / 1000;
    // Show decimal for values like 1.5K, but not for whole numbers like 127K
    return inK >= 10 ? `${Math.round(inK)}K` : `${inK.toFixed(1)}K`;
  }
  return count.toString();
}

// Approximate days in a month (used for display purposes only)
const APPROX_DAYS_PER_MONTH = 30;

/**
 * Calculate days ago from a date string
 */
function getDaysAgo(dateString: string): number {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Format date to "X days ago" or "X months ago"
 */
function formatLastUpload(dateString: string): string {
  const days = getDaysAgo(dateString);
  
  if (days === 0) {
    return 'Today';
  } else if (days === 1) {
    return '1 day ago';
  } else if (days < APPROX_DAYS_PER_MONTH) {
    return `${days} days ago`;
  } else if (days < APPROX_DAYS_PER_MONTH * 2) {
    return '1 month ago';
  } else {
    const months = Math.floor(days / APPROX_DAYS_PER_MONTH);
    return `${months} months ago`;
  }
}

/**
 * Search for a YouTube channel by name
 * Returns the first matching channel ID
 */
async function searchChannel(channelName: string, apiKey: string): Promise<string | null> {
  try {
    const url = new URL(`${YOUTUBE_API_BASE}/search`);
    url.searchParams.append('part', 'snippet');
    url.searchParams.append('q', channelName);
    url.searchParams.append('type', 'channel');
    url.searchParams.append('maxResults', '1');
    url.searchParams.append('key', apiKey);

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      if (response.status === 403) {
        console.error('YouTube API quota exceeded or invalid API key');
        return null;
      }
      throw new Error(`YouTube API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      const channel = data.items[0] as YouTubeSearchResult;
      return channel.id.channelId;
    }
    
    return null;
  } catch (error) {
    console.error(`Error searching for channel "${channelName}":`, error);
    return null;
  }
}

/**
 * Get channel details including subscriber count
 */
async function getChannelDetails(channelId: string, apiKey: string): Promise<YouTubeChannel | null> {
  try {
    const url = new URL(`${YOUTUBE_API_BASE}/channels`);
    url.searchParams.append('part', 'snippet,statistics');
    url.searchParams.append('id', channelId);
    url.searchParams.append('key', apiKey);

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      if (response.status === 403) {
        console.error('YouTube API quota exceeded or invalid API key');
        return null;
      }
      throw new Error(`YouTube API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      return data.items[0] as YouTubeChannel;
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching channel details for ${channelId}:`, error);
    return null;
  }
}

/**
 * Check if channel has uploaded a video in the last 30 days
 * Returns the date of the most recent upload if found
 */
async function checkRecentUploads(channelId: string, apiKey: string): Promise<string | null> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const publishedAfter = thirtyDaysAgo.toISOString();

    const url = new URL(`${YOUTUBE_API_BASE}/search`);
    url.searchParams.append('part', 'snippet');
    url.searchParams.append('channelId', channelId);
    url.searchParams.append('type', 'video');
    url.searchParams.append('order', 'date');
    url.searchParams.append('maxResults', '1');
    url.searchParams.append('publishedAfter', publishedAfter);
    url.searchParams.append('key', apiKey);

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      if (response.status === 403) {
        console.error('YouTube API quota exceeded or invalid API key');
        return null;
      }
      throw new Error(`YouTube API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      return data.items[0].snippet.publishedAt;
    }
    
    return null;
  } catch (error) {
    console.error(`Error checking recent uploads for ${channelId}:`, error);
    return null;
  }
}

/**
 * Verify a channel and get complete data from YouTube API
 * This is the main function called by the lead generation service
 */
export async function verifyChannel(
  channelName: string,
  apiKey: string
): Promise<VerifiedChannelData | null> {
  if (!apiKey) {
    console.warn('YouTube API key is missing');
    return null;
  }

  try {
    // Step 1: Search for the channel
    const channelId = await searchChannel(channelName, apiKey);
    if (!channelId) {
      console.log(`Channel not found: ${channelName}`);
      return null;
    }

    // Step 2: Get channel details (subscriber count)
    const channelDetails = await getChannelDetails(channelId, apiKey);
    if (!channelDetails) {
      console.log(`Could not fetch details for: ${channelName}`);
      return null;
    }

    // Step 3: Check for recent uploads (last 30 days)
    const lastUploadDate = await checkRecentUploads(channelId, apiKey);
    const hasRecentUpload = lastUploadDate !== null;

    if (!hasRecentUpload) {
      console.log(`Channel "${channelName}" has not posted in the last 30 days - skipping`);
      return null;
    }

    // Step 4: Format and return verified data
    const actualSubscribers = parseInt(channelDetails.statistics.subscriberCount, 10);
    const formattedCount = formatSubscriberCount(actualSubscribers);
    const channelUrl = `https://www.youtube.com/channel/${channelId}`;

    return {
      channelId,
      channelName: channelDetails.snippet.title,
      subscriberCount: formattedCount,
      actualSubscribers,
      channelUrl,
      verified: true,
      lastUpload: lastUploadDate ? formatLastUpload(lastUploadDate) : undefined,
      hasRecentUpload,
    };
  } catch (error) {
    console.error(`Error verifying channel "${channelName}":`, error);
    return null;
  }
}

/**
 * Verify multiple channels in batch
 * Returns only channels that pass verification (exist + posted in last 30 days)
 */
export async function verifyChannels(
  channelNames: string[],
  apiKey: string,
  onProgress?: (current: number, total: number) => void
): Promise<VerifiedChannelData[]> {
  const verified: VerifiedChannelData[] = [];
  
  for (let i = 0; i < channelNames.length; i++) {
    const channelName = channelNames[i];
    
    if (onProgress) {
      onProgress(i + 1, channelNames.length);
    }

    const result = await verifyChannel(channelName, apiKey);
    if (result) {
      verified.push(result);
    }
    
    // Small delay to avoid rate limiting (100ms between requests)
    if (i < channelNames.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return verified;
}
