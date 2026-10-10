import React, { useState } from 'react';
import { MapPin, Search, ExternalLink, Navigation, Sparkles, Building2, Map, CheckCircle2, AlertCircle } from 'lucide-react';
import { CleanedDataset } from '../types/dataCleaner';

interface MapsGroundingPanelProps {
  cleanedDataset: CleanedDataset | null;
}

interface GroundingItem {
  maps?: {
    uri?: string;
    title?: string;
    placeAnswerSources?: {
      reviewSnippets?: {
        content?: string;
        author?: string;
      }[];
    };
  };
  web?: {
    uri?: string;
    title?: string;
  };
}

export const MapsGroundingPanel: React.FC<MapsGroundingPanelProps> = ({ cleanedDataset }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resultText, setResultText] = useState<string | null>(null);
  const [groundingChunks, setGroundingChunks] = useState<GroundingItem[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locStatus, setLocStatus] = useState<string>('');
  const [isQuotaFallback, setIsQuotaFallback] = useState<boolean>(false);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocStatus('Geolocation is not supported by your browser.');
      return;
    }
    setLocStatus('Detecting location...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        });
        setLocStatus(`Location detected (${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)})`);
      },
      () => {
        setLocStatus('Unable to retrieve location.');
      }
    );
  };

  const handleSearch = async (customQuery?: string) => {
    const q = (customQuery || query).trim();
    if (!q || isLoading) return;

    setIsLoading(true);
    setResultText(null);
    setGroundingChunks([]);
    setIsQuotaFallback(false);

    try {
      let datasetLocationContext = '';
      if (cleanedDataset) {
        const addressCols = cleanedDataset.headers.filter((h) =>
          /address|city|country|state|zip|location|postal|place/i.test(h)
        );
        if (addressCols.length > 0) {
          const sampleRows = cleanedDataset.rows
            .slice(0, 5)
            .map((r) => addressCols.map((c) => `${c}: ${r[c]}`).join(', '))
            .join('\n');
          datasetLocationContext = `Columns: [${addressCols.join(', ')}]\nSample entries:\n${sampleRows}`;
        }
      }

      const res = await fetch('/api/maps-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          latLng: userLocation,
          datasetContext: datasetLocationContext || undefined
        })
      });

      const data = await res.json();
      if (!res.ok && !data.isFallback) {
        throw new Error(data.error || 'Failed to query Google Maps');
      }

      setResultText(data.text);
      setGroundingChunks(data.groundingChunks || []);
      if (data.isQuotaError || data.isFallback) {
        setIsQuotaFallback(true);
      }
    } catch (err: any) {
      setResultText(`Error: ${err.message || 'Google Maps grounding query failed'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const mapsLinks = groundingChunks
    .map((chunk) => chunk.maps)
    .filter((m): m is NonNullable<typeof m> => Boolean(m && m.uri));

  const sampleLocationQueries = [
    'Verify address: 1600 Amphitheatre Parkway, Mountain View, CA',
    'Find postal code and coordinates for Zurich Financial District',
    'Locate Tokyo Cloud Systems KK headquarters and business district'
  ];

  return (
    <div className="bg-white rounded-xl border border-purple-100 shadow-sm overflow-hidden mb-6">
      {/* Header */}
      <div className="p-4 border-b border-purple-100 bg-purple-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Google Maps Grounding &amp; Location Intelligence</h3>
            <p className="text-xs text-slate-500">
              Grounded with real-time Google Maps data via <code className="text-[#7C3AED] font-mono">gemini-3.5-flash</code>.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={detectLocation}
          className="text-xs text-purple-700 bg-white border border-purple-200 hover:bg-purple-50 px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition self-start sm:self-auto"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>{userLocation ? 'Update My Geolocation' : 'Detect My Location'}</span>
        </button>
      </div>

      {locStatus && (
        <div className="px-4 py-1.5 bg-emerald-50 text-[11px] text-emerald-800 border-b border-emerald-100 flex items-center space-x-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{locStatus}</span>
        </div>
      )}

      {/* Query Search Form */}
      <div className="p-5">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter an address from your dataset, business name, or city to look up on Google Maps..."
              className="w-full pl-9 pr-3 py-2 text-xs text-slate-800 bg-purple-50/30 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:bg-white"
            />
          </div>
          <button
            type="button"
            onClick={() => handleSearch()}
            disabled={!query.trim() || isLoading}
            className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-40 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Querying Maps...' : 'Search Maps'}</span>
          </button>
        </div>

        {/* Suggestion buttons */}
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Example lookups:</span>
          {sampleLocationQueries.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setQuery(q);
                handleSearch(q);
              }}
              className="text-[11px] px-2.5 py-0.5 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 transition"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Quota Notice if applicable */}
        {isQuotaFallback && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Google Maps Live Grounding Note:</span>
              <p className="text-[11px] text-amber-800 mt-0.5">
                The Gemini project currently has quota limits for the Maps Grounding tool. We&apos;ve provided direct Google Maps place and routing navigation links below so your address verification is never interrupted.
              </p>
            </div>
          </div>
        )}

        {/* Results Area */}
        {resultText && (
          <div className="mt-5 p-4 rounded-xl border border-purple-100 bg-slate-50/60 space-y-4">
            <div>
              <h4 className="text-xs font-bold text-slate-900 mb-1 flex items-center space-x-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span>Google Maps Grounding Answer</span>
              </h4>
              <div className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed font-sans bg-white p-3.5 rounded-lg border border-purple-100 shadow-2xs">
                {resultText}
              </div>
            </div>

            {/* MANDATORY: Extracted Google Maps Links */}
            {mapsLinks.length > 0 && (
              <div className="pt-2 border-t border-purple-100">
                <h5 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center space-x-1">
                  <Map className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Google Maps Grounding Sources &amp; Places ({mapsLinks.length})</span>
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {mapsLinks.map((mapItem, idx) => (
                    <a
                      key={idx}
                      href={mapItem.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-lg bg-white border border-purple-200 hover:border-[#7C3AED] hover:bg-purple-50/40 transition flex items-start justify-between group"
                    >
                      <div className="pr-2">
                        <span className="text-xs font-bold text-slate-900 group-hover:text-[#7C3AED] transition block truncate">
                          {mapItem.title || 'View Location on Google Maps'}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate block mt-0.5">
                          {mapItem.uri}
                        </span>

                        {mapItem.placeAnswerSources?.reviewSnippets && mapItem.placeAnswerSources.reviewSnippets.length > 0 && (
                          <div className="mt-1 text-[10px] text-slate-500 italic">
                            &quot;{mapItem.placeAnswerSources.reviewSnippets[0].content}&quot;
                          </div>
                        )}
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#7C3AED] shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
