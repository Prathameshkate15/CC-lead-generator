export interface Lead {
  channelName: string;
  subscriberCount: string;
  actualSubscribers?: number; // Actual number from YouTube API
  niche: string;
  editGap: string;
  verified?: boolean; // Whether data is from YouTube API
  lastUpload?: string; // e.g., "5 days ago"
  channelUrl?: string; // YouTube channel URL
}

export enum SearchStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export type ChannelCategory = 'Documentary' | 'Gaming' | 'Vlog' | 'Tech' | 'Education' | 'Business' | 'Lifestyle';

export interface SearchFilters {
  category: ChannelCategory;
  minSubs: string;
  maxSubs: string;
}

export const CATEGORY_KEYWORDS: Record<ChannelCategory, string[]> = {
  Documentary: [
    "Maritime History / Shipwrecks",
    "Internet Mysteries / Lost Media",
    "Corporate Fraud / Business Scams",
    "Aviation Disasters / Black Box",
    "Mega Projects / Engineering Fails",
    "Cult Analysis / Psychology",
    "Urban Planning / Geography",
    "Speculative Biology / Evolution",
    "True Crime / Cold Cases"
  ],
  Gaming: [
    "Video Game Essays",
    "Speedrunning History",
    "Retro Gaming / Consoles",
    "MMO Journalism",
    "Esports Documentaries",
    "Game Design Analysis",
    "Horror Gaming",
    "Challenge Runs"
  ],
  Vlog: [
    "Cinematic Travel",
    "Van Life / Tiny Home",
    "Digital Nomad",
    "Daily Life / Aesthetic",
    "Street Food / Culinary",
    "Fitness Journey",
    "Solo Travel"
  ],
  Tech: [
    "Retro Tech / Restoration",
    "PC Building",
    "Cybersecurity / Hacking",
    "Tech Reviews / Unboxing",
    "Coding / Software Engineering",
    "Future Tech / AI"
  ],
  Education: [
    "Science / Physics",
    "Math / Visualizations",
    "History / Cartography",
    "Language Learning",
    "Philosophy",
    "Psychology"
  ],
  Business: [
    "Case Studies",
    "Marketing Strategy",
    "Finance / Investing",
    "Real Estate",
    "Entrepreneurship",
    "Crypto / Web3 Analysis"
  ],
  Lifestyle: [
    "Minimalism",
    "Interior Design",
    "Men's Fashion",
    "Self Improvement",
    "Photography / Filmmaking",
    "Car Culture / Mods"
  ]
};