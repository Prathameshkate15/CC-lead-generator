import React from 'react';
import { Lead } from '../types';

interface ResultsTableProps {
  leads: Lead[];
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ leads }) => {
  if (leads.length === 0) return null;

  return (
    <div className="w-full overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50 shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-900 text-zinc-400 border-b border-zinc-800 uppercase tracking-wider text-xs font-semibold">
            <tr>
              <th className="px-6 py-4">Channel Name</th>
              <th className="px-6 py-4">Subscribers</th>
              <th className="px-6 py-4">Niche</th>
              <th className="px-6 py-4">The "Edit Gap"</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {leads.map((lead, index) => (
              <tr 
                key={index} 
                className="group hover:bg-emerald-900/10 transition-colors duration-150"
              >
                <td className="px-6 py-4 font-medium text-white group-hover:text-emerald-400">
                  {lead.channelName}
                </td>
                <td className="px-6 py-4 text-zinc-400 font-mono">
                  {lead.subscriberCount}
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center rounded-md bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-300 ring-1 ring-inset ring-zinc-700">
                    {lead.niche}
                  </span>
                </td>
                <td className="px-6 py-4 text-zinc-400 italic">
                  "{lead.editGap}"
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-zinc-900 px-6 py-3 border-t border-zinc-800 text-xs text-zinc-500 flex justify-between items-center">
        <span>Showing {leads.length} verified leads</span>
        <span className="text-emerald-500 font-medium">Input List Cleaned & Checked</span>
      </div>
    </div>
  );
};