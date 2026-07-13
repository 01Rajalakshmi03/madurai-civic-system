import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { FiCrosshair, FiFilter, FiX, FiChevronDown } from 'react-icons/fi';
import { complaintAPI } from '../../utils/api';

const STATUS_COLORS = {
  filed: '#eab308',
  assigned: '#3b82f6',
  in_progress: '#f97316',
  resolved: '#22c55e',
  rejected: '#ef4444',
};

const STATUS_LABELS = {
  filed: 'Filed',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  rejected: 'Rejected',
};

const CATEGORIES = [
  'road_damage', 'garbage_accumulation', 'water_leakage',
  'drainage_problem', 'streetlight_failure', 'illegal_dumping',
  'infrastructure_damage', 'other',
];

const CATEGORY_LABELS = {
  road_damage: 'Road Damage',
  garbage_accumulation: 'Garbage',
  water_leakage: 'Water Supply',
  drainage_problem: 'Drainage',
  streetlight_failure: 'Streetlight',
  illegal_dumping: 'Illegal Dumping',
  infrastructure_damage: 'Infrastructure',
  other: 'Other',
};

function createIcon(color, opacity = 1) {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 14px; height: 14px;
      background: ${color};
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 1px 4px rgba(0,0,0,0.4);
      opacity: ${opacity};
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -10],
  });
}

function RecenterMap({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, 15);
    }
  }, [position, map]);
  return null;
}

function LocateButton({ onLocate }) {
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onLocate([pos.coords.latitude, pos.coords.longitude]);
        setLoading(false);
      },
      () => {
        setLoading(false);
        alert('Unable to retrieve your location.');
      }
    );
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="absolute bottom-4 right-4 z-[1000] bg-white dark:bg-gray-800 p-3 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      title="Detect my location"
    >
      <FiCrosshair
        size={20}
        className={`text-gray-700 dark:text-gray-200 ${loading ? 'animate-spin' : ''}`}
      />
    </button>
  );
}

function Legend() {
  return (
    <div className="absolute bottom-4 left-4 z-[1000] bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold mb-1.5 text-gray-800 dark:text-gray-100">Status Legend</p>
      <div className="space-y-1">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full inline-block border border-gray-300"
              style={{ background: color }}
            />
            <span className="text-gray-600 dark:text-gray-300">{STATUS_LABELS[status]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MapView() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterWard, setFilterWard] = useState('');

  const isDark = typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-color-scheme: dark)').matches;

  const [darkMode, setDarkMode] = useState(isDark);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setDarkMode(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchComplaints = async () => {
      try {
        setLoading(true);
        const res = await complaintAPI.getAll({ per_page: 500 });
        if (!cancelled) {
          setComplaints(res.data?.complaints || res.complaints || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load complaints');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchComplaints();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    return complaints.filter((c) => {
      if (filterCategory && c.category !== filterCategory) return false;
      if (filterStatus && c.status !== filterStatus) return false;
      if (filterWard && String(c.ward) !== filterWard) return false;
      return true;
    });
  }, [complaints, filterCategory, filterStatus, filterWard]);

  const densityMap = useMemo(() => {
    const counts = {};
    filtered.forEach((c) => {
      const ward = String(c.ward || 'unknown');
      counts[ward] = (counts[ward] || 0) + 1;
    });
    const max = Math.max(...Object.values(counts), 1);
    const opacities = {};
    Object.entries(counts).forEach(([ward, count]) => {
      opacities[ward] = 0.4 + (count / max) * 0.6;
    });
    return opacities;
  }, [filtered]);

  const handleLocate = useCallback((pos) => {
    setUserLocation(pos);
  }, []);

  const tileUrl = darkMode
    ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  const activeFilters = [filterCategory, filterStatus, filterWard].filter(Boolean).length;

  return (
    <div className="relative w-full h-full min-h-[600px] rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-900">
      {loading && (
        <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-600 dark:text-gray-300">Loading complaints map...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[2000] bg-red-100 dark:bg-red-900/80 text-red-700 dark:text-red-200 px-4 py-2 rounded-lg shadow-lg text-sm">
          {error}
        </div>
      )}

      <MapContainer
        center={[9.9252, 78.1198]}
        zoom={13}
        className="w-full h-full"
        style={{ height: '100%', minHeight: '600px' }}
        zoomControl={false}
      >
        <TileLayer url={tileUrl} attribution="&copy; OpenStreetMap contributors" />
        <RecenterMap position={userLocation} />

        {filtered.map((c) => {
          const coords = c.location?.coordinates;
          const lng = coords ? parseFloat(coords[0]) : parseFloat(c.longitude);
          const lat = coords ? parseFloat(coords[1]) : parseFloat(c.latitude);
          if (isNaN(lat) || isNaN(lng)) return null;

          const color = STATUS_COLORS[c.status] || '#9ca3af';
          const opacity = densityMap[String(c.ward)] || 1;

          return (
            <Marker
              key={c.complaint_id || c.id}
              position={[lat, lng]}
              icon={createIcon(color, opacity)}
            >
              <Popup>
                <div className="min-w-[180px] text-sm space-y-1">
                  <p className="font-semibold text-gray-900">
                    {c.title || 'Untitled Complaint'}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">ID:</span>{' '}
                    <code className="bg-gray-100 px-1 rounded text-xs">{c.complaint_id || c.id}</code>
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Status:</span>{' '}
                    <span
                      className="inline-block px-1.5 py-0.5 rounded text-white text-xs font-medium"
                      style={{ background: color }}
                    >
                      {STATUS_LABELS[c.status] || c.status}
                    </span>
                  </p>
                  {c.category && (
                    <p className="text-gray-600">
                      <span className="font-medium">Category:</span> {c.category}
                    </p>
                  )}
                  {c.ward && (
                    <p className="text-gray-600">
                      <span className="font-medium">Ward:</span> {c.ward}
                    </p>
                  )}
                  <Link
                    to={`/dashboard/track/${c.complaint_id || c.id}`}
                    className="inline-block mt-1 text-blue-600 hover:underline text-xs font-medium"
                  >
                    View Details &rarr;
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <LocateButton onLocate={handleLocate} />

      <Legend />

      <div className="absolute top-4 right-4 z-[1000]">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg text-sm font-medium transition-colors ${
            showFilters
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <FiFilter size={14} />
          Filters
          {activeFilters > 0 && (
            <span className="bg-white/30 text-white text-xs px-1.5 py-0.5 rounded-full">
              {activeFilters}
            </span>
          )}
        </button>

        {showFilters && (
          <div className="mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 w-64 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Filters</h4>
              <button
                onClick={() => {
                  setFilterCategory('');
                  setFilterStatus('');
                  setFilterWard('');
                }}
                className="text-xs text-blue-500 hover:underline"
              >
                Clear all
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                Category
              </label>
              <div className="relative">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full appearance-none bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{CATEGORY_LABELS[cat] || cat}</option>
                  ))}
                </select>
                <FiChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                Status
              </label>
              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full appearance-none bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Statuses</option>
                  {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
                <FiChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                Ward Number
              </label>
              <input
                type="number"
                min="1"
                value={filterWard}
                onChange={(e) => setFilterWard(e.target.value)}
                placeholder="e.g. 1"
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      <div className="absolute top-4 left-4 z-[1000] bg-white dark:bg-gray-800 rounded-lg shadow-lg px-3 py-2 text-xs text-gray-600 dark:text-gray-300">
        Showing <span className="font-semibold text-gray-900 dark:text-white">{filtered.length}</span> of{' '}
        <span className="font-semibold">{complaints.length}</span> complaints
      </div>
    </div>
  );
}
