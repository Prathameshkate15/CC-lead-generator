import React, { useState, useCallback } from 'react';
import { findLeads } from './services/geminiService';
import { Lead, SearchStatus, SearchFilters, ChannelCategory } from './types';
import { ResultsTable } from './components/ResultsTable';
import { KeywordBank } from './components/KeywordBank';
import { Radar, Sparkles, AlertCircle, RefreshCw, Trash2, Search, SlidersHorizontal, FileSpreadsheet, ListPlus, Check, Copy } from 'lucide-react';

const App: React.FC = () => {
  const [blockList, setBlockList] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter State
  const [filters, setFilters] = useState<SearchFilters>({
    category: 'Documentary',
    minSubs: '50k',
    maxSubs: '1M'
  });

  const [leads, setLeads] = useState<Lead[]>([]);
  const [status, setStatus] = useState<SearchStatus>(SearchStatus.IDLE);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // UI State for buttons
  const [copied, setCopied] = useState(false);
  const [addedCount, setAddedCount] = useState(0);

  const handleSearch = useCallback(async () => {
    if (!blockList.trim() && !searchQuery.trim()) {
        if(!window.confirm("Searching broadly without specific inputs? This might return generic results.")) {
            return;
        }
    }

    setStatus(SearchStatus.LOADING);
    setErrorMsg(null);
    setLeads([]); 

    try {
      const result = await findLeads(blockList, searchQuery, filters);
      setLeads(result);
      setStatus(SearchStatus.SUCCESS);
    } catch (err) {
      setStatus(SearchStatus.ERROR);
      setErrorMsg("Failed to generate leads. The API might be busy or the input was too confusing.");
    }
  }, [blockList, searchQuery, filters]);

  const handleKeywordSelect = (keyword: string) => {
    setSearchQuery((prev) => {
      const cleanKeyword = keyword.split('/')[0].trim();
      return prev ? `${prev}, ${cleanKeyword}` : cleanKeyword;
    });
  };

  const clearInput = () => {
    setBlockList('');
    setSearchQuery('');
    setLeads([]);
    setStatus(SearchStatus.IDLE);
  };

  // Format leads for Excel (Tab Separated Values) and copy to clipboard
  const handleCopy = () => {
    if (leads.length === 0) return;
    
    // Create TSV content
    // We don't necessarily need headers if pasting into an existing sheet, 
    // but it's safer to include them or just raw data. 
    // Let's do raw data rows for easy appending to lists.
    const rows = leads.map(l => `${l.channelName}\t${l.subscriberCount}\t${l.niche}\t${l.editGap}`).join('\n');
    
    navigator.clipboard.writeText(rows);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Add current results to the blocklist input
  const handleAddToBlocklist = () => {
    if (leads.length === 0) return;

    const newNames = leads.map(l => l.channelName).join('\n');
    setBlockList(prev => {
        const trimmed = prev.trim();
        return trimmed ? `${trimmed}\n${newNames}` : newNames;
    });

    setAddedCount(leads.length);
    setTimeout(() => setAddedCount(0), 3000);
  };

  const categories: ChannelCategory[] = ['Documentary', 'Gaming', 'Vlog', 'Tech', 'Education', 'Business', 'Lifestyle'];

  return (
    <div className="min-h-screen bg-zinc-950 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-950/20 via-zinc-950 to-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-600 p-1.5 rounded-lg">
              <Radar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">
                ClearCut <span className="text-emerald-500">Lead Hunter</span>
              </h1>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium leading-none">
                Internal Tool v1.3
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
             {status === SearchStatus.SUCCESS && (
                 <span className="text-xs text-emerald-500 font-medium bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 animate-pulse">
                     Ready for Outreach
                 </span>
             )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Input & Configuration */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Blocklist Section */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 shadow-lg relative group">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Blocklist (Excel Paste)
                </h2>
                <button onClick={clearInput} className="text-xs text-zinc-500 hover:text-red-400 flex items-center gap-1 transition-colors">
                    <Trash2 className="w-3 h-3" /> Reset All
                </button>
              </div>
              <textarea
                value={blockList}
                onChange={(e) => setBlockList(e.target.value)}
                placeholder={`Channel NameDark Docs\nPlainly Difficult\nEsoterica...`}
                className="w-full h-32 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-300 font-mono focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none resize-none placeholder-zinc-700 transition-all"
                spellCheck={false}
              />
              {addedCount > 0 && (
                 <div className="absolute inset-0 bg-emerald-900/20 rounded-xl flex items-center justify-center pointer-events-none animate-in fade-in duration-300">
                     <div className="bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-2">
                        <Check className="w-3 h-3" /> Added {addedCount} channels
                     </div>
                 </div>
              )}
            </div>

            {/* Search & Filter Section */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 shadow-lg transition-all duration-300">
                
                {/* Search Filters Header */}
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-800/50">
                    <SlidersHorizontal className="w-4 h-4 text-blue-500" />
                    <h2 className="text-sm font-semibold text-zinc-100">Search Filters</h2>
                </div>

                {/* Filters Grid */}
                <div className="grid grid-cols-2 gap-4 mb-5">
                    <div className="col-span-2">
                        <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1.5">
                            Category
                        </label>
                        <select 
                            value={filters.category}
                            onChange={(e) => setFilters({...filters, category: e.target.value as ChannelCategory})}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1.5">
                            Min Subs
                        </label>
                        <input 
                            type="text" 
                            value={filters.minSubs}
                            onChange={(e) => setFilters({...filters, minSubs: e.target.value})}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-300 text-center focus:ring-2 focus:ring-emerald-500/50 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1.5">
                            Max Subs
                        </label>
                        <input 
                            type="text" 
                            value={filters.maxSubs}
                            onChange={(e) => setFilters({...filters, maxSubs: e.target.value})}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-300 text-center focus:ring-2 focus:ring-emerald-500/50 outline-none"
                        />
                    </div>
                </div>

                {/* Main Search Input */}
                <div className="relative">
                    <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1.5">
                        Target / Lookalike Search
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-zinc-600" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={`Enter ${filters.category} topic or Channel Name...`}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 pl-9 text-sm text-zinc-300 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none"
                        />
                    </div>
                </div>
                
                <KeywordBank category={filters.category} onSelect={handleKeywordSelect} />
            </div>

            {/* Action Button */}
            <button
              onClick={handleSearch}
              disabled={status === SearchStatus.LOADING}
              className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide uppercase shadow-lg transition-all duration-300 flex items-center justify-center gap-2
                ${status === SearchStatus.LOADING 
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-emerald-500/20 hover:-translate-y-0.5'
                }`}
            >
              {status === SearchStatus.LOADING ? (
                <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Hunting Leads...
                </>
              ) : (
                <>
                    <Sparkles className="w-4 h-4" />
                    Find {filters.category} Clients
                </>
              )}
            </button>
            
            {errorMsg && (
                <div className="p-4 rounded-lg bg-red-900/20 border border-red-900/50 flex items-start gap-3 text-red-200 text-xs">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {errorMsg}
                </div>
            )}

          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-8">
             {status === SearchStatus.IDLE && leads.length === 0 && (
                 <div className="h-full min-h-[400px] border-2 border-dashed border-zinc-800 rounded-xl flex flex-col items-center justify-center text-zinc-600 p-8 text-center">
                     <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                         <Radar className="w-8 h-8 opacity-50" />
                     </div>
                     <h3 className="text-lg font-medium text-zinc-400">Ready to Hunt</h3>
                     <p className="max-w-sm mt-2 text-sm">
                        Configure your filters (Category, Subs) and enter a topic or channel name to find targeted leads.
                     </p>
                 </div>
             )}

             {status === SearchStatus.SUCCESS && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-end justify-between border-b border-zinc-800/50 pb-4">
                        <div>
                            <h2 className="text-xl font-bold text-white">Detected Opportunities</h2>
                            <div className="flex gap-2 mt-1.5">
                                <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-400 border border-zinc-700 font-mono">{filters.category}</span>
                                <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-400 border border-zinc-700 font-mono">{filters.minSubs} - {filters.maxSubs}</span>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            {/* Update Blocklist Button */}
                            <button 
                                onClick={handleAddToBlocklist}
                                disabled={addedCount > 0}
                                className="group flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-500 rounded-lg transition-all"
                                title="Add results to blocklist and prepare for next search"
                            >
                                {addedCount > 0 ? (
                                    <>
                                        <Check className="w-4 h-4 text-emerald-500" />
                                        <span className="text-emerald-500">Added!</span>
                                    </>
                                ) : (
                                    <>
                                        <ListPlus className="w-4 h-4 group-hover:text-white" />
                                        <span>Update Blocklist</span>
                                    </>
                                )}
                            </button>

                            {/* Copy Button */}
                            <button 
                                onClick={handleCopy}
                                className="group flex items-center gap-2 px-3 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-lg shadow-blue-900/20 transition-all"
                            >
                                {copied ? (
                                    <>
                                        <Check className="w-4 h-4" />
                                        <span>Copied</span>
                                    </>
                                ) : (
                                    <>
                                        <FileSpreadsheet className="w-4 h-4" />
                                        <span>Copy for Excel</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                    
                    <ResultsTable leads={leads} />
                    
                    <div className="flex items-center justify-between p-4 bg-emerald-900/10 border border-emerald-900/30 rounded-lg">
                         <p className="text-xs text-emerald-200/80">
                            <span className="font-bold">Next Step:</span> Copy these to Excel, then click "Update Blocklist" to exclude them from your next search.
                         </p>
                    </div>
                </div>
             )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;