'use client';

import React, { useState } from 'react';
import { ToothCondition, ToothState, ToothSurface, OdontogramMap } from '@/types/clinic';

interface OdontogramProps {
  value: OdontogramMap;
  onChange?: (val: OdontogramMap) => void;
  readOnly?: boolean;
}

const CONDITIONS: { label: string; value: ToothCondition; color: string; desc: string }[] = [
  { label: 'Sehat (Normal)', value: 'healthy', color: '#10B981', desc: 'Gigi sehat normal' },
  { label: 'Karies (Caries)', value: 'caries', color: '#EF4444', desc: 'Gigi berlubang' },
  { label: 'Tambalan Komposit', value: 'filling_composite', color: '#3B82F6', desc: 'Restorasi resin' },
  { label: 'Tambalan Amalgam', value: 'filling_amalgam', color: '#64748B', desc: 'Restorasi amalgam' },
  { label: 'Crown / Mahkota', value: 'crown', color: '#F59E0B', desc: 'Mahkota tiruan' },
  { label: 'Gigi Hilang (Missing)', value: 'missing', color: '#1E293B', desc: 'Gigi tanggal/dicabut' },
  { label: 'Impaksi (Impacted)', value: 'impacted', color: '#8B5CF6', desc: 'Gigi tertanam' },
  { label: 'Sisa Akar (Radix)', value: 'radix', color: '#DC2626', desc: 'Akar tertinggal' },
  { label: 'Perawatan Saluran Akar', value: 'rct', color: '#EC4899', desc: 'Endodontik/PSA' },
];

export const Odontogram: React.FC<OdontogramProps> = ({ value, onChange, readOnly = false }) => {
  const [activeTooth, setActiveTooth] = useState<number | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<ToothCondition>('caries');
  const [viewMode, setViewMode] = useState<'permanent' | 'deciduous' | 'both'>('both');

  // Upper permanent: 18..11, 21..28
  const q1 = [18, 17, 16, 15, 14, 13, 12, 11];
  const q2 = [21, 22, 23, 24, 25, 26, 27, 28];
  // Upper deciduous: 55..51, 61..65
  const q5 = [55, 54, 53, 52, 51];
  const q6 = [61, 62, 63, 64, 65];

  // Lower deciduous: 85..81, 71..75
  const q8 = [85, 84, 83, 82, 81];
  const q7 = [71, 72, 73, 74, 75];
  // Lower permanent: 48..41, 31..38
  const q4 = [48, 47, 46, 45, 44, 43, 42, 41];
  const q3 = [31, 32, 33, 34, 35, 36, 37, 38];

  const getToothState = (num: number): ToothState => {
    return value[num] || { toothNumber: num, condition: 'healthy', surfaces: {} };
  };

  const handleSurfaceClick = (toothNum: number, surface: ToothSurface, e: React.MouseEvent) => {
    e.stopPropagation();
    if (readOnly || !onChange) return;

    const current = getToothState(toothNum);
    const newSurfaces = { ...(current.surfaces || {}) };

    // Toggle surface
    if (newSurfaces[surface] === selectedCondition) {
      delete newSurfaces[surface];
    } else {
      newSurfaces[surface] = selectedCondition;
    }

    const hasAnySurface = Object.keys(newSurfaces).length > 0;
    const newCondition = hasAnySurface ? selectedCondition : 'healthy';

    onChange({
      ...value,
      [toothNum]: {
        ...current,
        condition: newCondition,
        surfaces: newSurfaces,
      },
    });
  };

  const handleWholeToothSet = (toothNum: number, cond: ToothCondition) => {
    if (readOnly || !onChange) return;
    const current = getToothState(toothNum);
    onChange({
      ...value,
      [toothNum]: {
        ...current,
        condition: cond,
        surfaces: cond === 'healthy' ? {} : current.surfaces,
      },
    });
  };

  const handleNoteChange = (toothNum: number, note: string) => {
    if (readOnly || !onChange) return;
    const current = getToothState(toothNum);
    onChange({
      ...value,
      [toothNum]: {
        ...current,
        notes: note,
      },
    });
  };

  const getSurfaceColor = (state: ToothState, surface: ToothSurface): string => {
    const surfaceCond = state.surfaces?.[surface];
    if (surfaceCond) {
      const match = CONDITIONS.find((c) => c.value === surfaceCond);
      return match ? match.color : '#E2E8F0';
    }
    return '#FFFFFF';
  };

  const renderSingleTooth = (num: number) => {
    const state = getToothState(num);

    return (
      <div
        key={num}
        onClick={() => setActiveTooth(num)}
        className={`flex flex-col items-center p-1 rounded cursor-pointer transition border ${
          activeTooth === num ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-300' : 'border-slate-200 hover:border-slate-400 bg-white'
        }`}
        title={`Gigi ${num}: ${state.condition} ${state.notes ? `(${state.notes})` : ''}`}
      >
        <span className="text-[11px] font-bold text-slate-700">{num}</span>
        
        {/* SVG Graphic of Tooth with 5 surfaces */}
        <div className="relative w-9 h-9 my-1">
          {state.condition === 'missing' ? (
            <svg viewBox="0 0 36 36" className="w-full h-full">
              <rect x="2" y="2" width="32" height="32" rx="4" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="1.5" />
              <line x1="4" y1="4" x2="32" y2="32" stroke="#EF4444" strokeWidth="3" />
              <line x1="32" y1="4" x2="4" y2="32" stroke="#EF4444" strokeWidth="3" />
            </svg>
          ) : state.condition === 'radix' ? (
            <svg viewBox="0 0 36 36" className="w-full h-full">
              <polygon points="18,4 32,32 4,32" fill="#FEE2E2" stroke="#DC2626" strokeWidth="2" />
              <text x="18" y="26" textAnchor="middle" fill="#DC2626" fontSize="11" fontWeight="bold">R</text>
            </svg>
          ) : (
            <svg viewBox="0 0 36 36" className="w-full h-full shadow-sm rounded">
              {/* Outer frame */}
              <rect x="1" y="1" width="34" height="34" rx="3" fill="#F8FAFC" stroke="#64748B" strokeWidth="1" />

              {/* Top Surface (Buccal/Labial) */}
              <polygon
                points="1,1 35,1 27,9 9,9"
                fill={getSurfaceColor(state, 'top')}
                stroke="#64748B"
                strokeWidth="0.75"
                onClick={(e) => handleSurfaceClick(num, 'top', e)}
                className="hover:opacity-80 transition"
              />

              {/* Bottom Surface (Lingual/Palatal) */}
              <polygon
                points="9,27 27,27 35,35 1,35"
                fill={getSurfaceColor(state, 'bottom')}
                stroke="#64748B"
                strokeWidth="0.75"
                onClick={(e) => handleSurfaceClick(num, 'bottom', e)}
                className="hover:opacity-80 transition"
              />

              {/* Left Surface (Mesial) */}
              <polygon
                points="1,1 9,9 9,27 1,35"
                fill={getSurfaceColor(state, 'left')}
                stroke="#64748B"
                strokeWidth="0.75"
                onClick={(e) => handleSurfaceClick(num, 'left', e)}
                className="hover:opacity-80 transition"
              />

              {/* Right Surface (Distal) */}
              <polygon
                points="35,1 35,35 27,27 27,9"
                fill={getSurfaceColor(state, 'right')}
                stroke="#64748B"
                strokeWidth="0.75"
                onClick={(e) => handleSurfaceClick(num, 'right', e)}
                className="hover:opacity-80 transition"
              />

              {/* Center Surface (Occlusal/Incisal) */}
              <rect
                x="9"
                y="9"
                width="18"
                height="18"
                fill={getSurfaceColor(state, 'center')}
                stroke="#64748B"
                strokeWidth="0.75"
                onClick={(e) => handleSurfaceClick(num, 'center', e)}
                className="hover:opacity-80 transition"
              />

              {/* Overlay indicators for RCT or Crown */}
              {state.condition === 'rct' && (
                <line x1="18" y1="2" x2="18" y2="34" stroke="#EC4899" strokeWidth="3" />
              )}
              {state.condition === 'crown' && (
                <circle cx="18" cy="18" r="7" fill="none" stroke="#F59E0B" strokeWidth="2.5" />
              )}
              {state.condition === 'impacted' && (
                <path d="M12,6 L24,6 L18,16 Z" fill="#8B5CF6" />
              )}
            </svg>
          )}
        </div>

        {/* Condition mini tag */}
        <span
          className={`text-[9px] px-1 py-0.2 rounded font-semibold truncate max-w-[42px] ${
            state.condition === 'healthy' ? 'text-slate-400' : 'bg-rose-50 text-rose-600'
          }`}
        >
          {state.condition === 'healthy' ? 'OK' : state.condition.slice(0, 5)}
        </span>
      </div>
    );
  };

  const activeToothState = activeTooth ? getToothState(activeTooth) : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-4">
      {/* Odontogram Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h3 className="font-semibold text-slate-900 text-base">Odontogram Digital (FDI Two-Digit)</h3>
          <p className="text-xs text-slate-500">Klik permukaan kuadran gigi untuk input karies/tambalan atau atur status gigi menyeluruh.</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => setViewMode('both')}
              className={`px-2.5 py-1 rounded ${viewMode === 'both' ? 'bg-white shadow text-teal-600' : 'text-slate-600'}`}
            >
              Semua Gigi
            </button>
            <button
              type="button"
              onClick={() => setViewMode('permanent')}
              className={`px-2.5 py-1 rounded ${viewMode === 'permanent' ? 'bg-white shadow text-teal-600' : 'text-slate-600'}`}
            >
              Dewasa (32)
            </button>
            <button
              type="button"
              onClick={() => setViewMode('deciduous')}
              className={`px-2.5 py-1 rounded ${viewMode === 'deciduous' ? 'bg-white shadow text-teal-600' : 'text-slate-600'}`}
            >
              Susu (20)
            </button>
          </div>
        </div>
      </div>

      {/* Palette tool for clicking */}
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
          <span className="font-semibold text-slate-700">Kuas Aktif:</span>
          {CONDITIONS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setSelectedCondition(c.value)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition ${
                selectedCondition === c.value
                  ? 'bg-teal-600 text-white shadow-sm ring-2 ring-teal-300'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
              {c.label}
            </button>
          ))}
        </div>
      )}

      {/* Chart Layout */}
      <div className="space-y-4 overflow-x-auto py-2">
        {/* Rahang Atas (Maxilla) */}
        <div>
          <div className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Rahang Atas (Maxilla)
          </div>

          {/* Gigi Permanen Atas (18-11 | 21-28) */}
          {(viewMode === 'both' || viewMode === 'permanent') && (
            <div className="flex justify-center items-center gap-4">
              {/* Q1: 18-11 */}
              <div className="flex items-center gap-1 bg-slate-50/60 p-1.5 rounded-lg border border-slate-100">
                {q1.map((num) => renderSingleTooth(num))}
              </div>

              {/* Midline divider */}
              <div className="h-12 w-[2px] bg-slate-300" />

              {/* Q2: 21-28 */}
              <div className="flex items-center gap-1 bg-slate-50/60 p-1.5 rounded-lg border border-slate-100">
                {q2.map((num) => renderSingleTooth(num))}
              </div>
            </div>
          )}

          {/* Gigi Susu Atas (55-51 | 61-65) */}
          {(viewMode === 'both' || viewMode === 'deciduous') && (
            <div className="flex justify-center items-center gap-4 mt-2">
              <div className="flex items-center gap-1 bg-amber-50/40 p-1 rounded-lg border border-amber-100">
                {q5.map((num) => renderSingleTooth(num))}
              </div>
              <div className="h-8 w-[2px] bg-amber-300" />
              <div className="flex items-center gap-1 bg-amber-50/40 p-1 rounded-lg border border-amber-100">
                {q6.map((num) => renderSingleTooth(num))}
              </div>
            </div>
          )}
        </div>

        {/* Center line separator */}
        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-dashed border-slate-300" />
          <span className="absolute px-3 bg-white text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Occlusal Plane / Garis Oklusal
          </span>
        </div>

        {/* Rahang Bawah (Mandibula) */}
        <div>
          {/* Gigi Susu Bawah (85-81 | 71-75) */}
          {(viewMode === 'both' || viewMode === 'deciduous') && (
            <div className="flex justify-center items-center gap-4 mb-2">
              <div className="flex items-center gap-1 bg-amber-50/40 p-1 rounded-lg border border-amber-100">
                {q8.map((num) => renderSingleTooth(num))}
              </div>
              <div className="h-8 w-[2px] bg-amber-300" />
              <div className="flex items-center gap-1 bg-amber-50/40 p-1 rounded-lg border border-amber-100">
                {q7.map((num) => renderSingleTooth(num))}
              </div>
            </div>
          )}

          {/* Gigi Permanen Bawah (48-41 | 31-38) */}
          {(viewMode === 'both' || viewMode === 'permanent') && (
            <div className="flex justify-center items-center gap-4">
              {/* Q4: 48-41 */}
              <div className="flex items-center gap-1 bg-slate-50/60 p-1.5 rounded-lg border border-slate-100">
                {q4.map((num) => renderSingleTooth(num))}
              </div>

              {/* Midline divider */}
              <div className="h-12 w-[2px] bg-slate-300" />

              {/* Q3: 31-38 */}
              <div className="flex items-center gap-1 bg-slate-50/60 p-1.5 rounded-lg border border-slate-100">
                {q3.map((num) => renderSingleTooth(num))}
              </div>
            </div>
          )}

          <div className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
            Rahang Bawah (Mandibula)
          </div>
        </div>
      </div>

      {/* Detail Inspector on Selected Tooth */}
      {activeTooth && activeToothState && (
        <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <span>Gigi #{activeTooth}</span>
              <span className="font-normal text-xs text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                Status: {activeToothState.condition}
              </span>
            </div>
            <div className="text-slate-600">
              Permukaan terisi:{' '}
              {Object.entries(activeToothState.surfaces || {}).length > 0
                ? Object.entries(activeToothState.surfaces || {})
                    .map(([surf, cond]) => `${surf.toUpperCase()} (${cond})`)
                    .join(', ')
                : 'Tidak ada permukaan abnormal'}
            </div>
          </div>

          {!readOnly && (
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Catatan khusus gigi..."
                value={activeToothState.notes || ''}
                onChange={(e) => handleNoteChange(activeTooth, e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs w-48 text-slate-800"
              />
              <button
                type="button"
                onClick={() => handleWholeToothSet(activeTooth, 'missing')}
                className="px-2 py-1 bg-slate-800 text-white rounded hover:bg-slate-900"
              >
                Tandai Hilang
              </button>
              <button
                type="button"
                onClick={() => handleWholeToothSet(activeTooth, 'rct')}
                className="px-2 py-1 bg-rose-600 text-white rounded hover:bg-rose-700"
              >
                Tandai PSA/RCT
              </button>
              <button
                type="button"
                onClick={() => handleWholeToothSet(activeTooth, 'healthy')}
                className="px-2 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
              >
                Reset Normal
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
