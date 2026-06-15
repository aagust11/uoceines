/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Criterion, RubricScoring, EvaluationLevel } from '../types.ts';
import { CheckCircle2, MessageSquare, HelpCircle, AlertTriangle } from 'lucide-react';

interface RubricSectionProps {
  id: string;
  title: string;
  description?: string;
  criteria: Criterion[];
  scoring: RubricScoring;
  onUpdateScoring: (scoring: RubricScoring) => void;
  readOnly?: boolean;
}

export default function RubricSection({
  title,
  description,
  criteria,
  scoring,
  onUpdateScoring,
  readOnly = false,
}: RubricSectionProps) {
  const [filterFilled, setFilterFilled] = useState<'all' | 'pending' | 'completed'>('all');
  const [expandedCriteria, setExpandedCriteria] = useState<Record<string, boolean>>({});

  // Calculate score & progress
  let totalWeight = 0;
  let earnedPercentage = 0;
  let filledCount = 0;

  criteria.forEach((c) => {
    totalWeight += c.weight;
    const scoreState = scoring[c.id];
    if (scoreState && scoreState.level !== null) {
      filledCount++;
      // Level 1: 25%, Level 2: 50%, Level 3: 75%, Level 4: 100%
      earnedPercentage += (scoreState.level / 4) * c.weight;
    }
  });

  const sectionScore = totalWeight > 0 ? (earnedPercentage / totalWeight) * 10 : 0;

  const handleLevelChange = (criterionId: string, level: EvaluationLevel) => {
    if (readOnly) return;
    const current = scoring[criterionId] || { level: null, comment: '' };
    onUpdateScoring({
      ...scoring,
      [criterionId]: {
        ...current,
        level: current.level === level ? null : level, // toggle off if same
      },
    });
  };

  const handleCommentChange = (criterionId: string, comment: string) => {
    if (readOnly) return;
    const current = scoring[criterionId] || { level: null, comment: '' };
    onUpdateScoring({
      ...scoring,
      [criterionId]: {
        ...current,
        comment,
      },
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedCriteria((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredCriteria = criteria.filter((c) => {
    const level = scoring[c.id]?.level;
    const isFilled = level !== undefined && level !== null;
    if (filterFilled === 'pending') return !isFilled;
    if (filterFilled === 'completed') return isFilled;
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Metrics Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-slate-900 text-white rounded-2xl p-6 shadow-md gap-4">
        <div>
          <h2 className="text-xl font-bold font-sans tracking-tight">{title}</h2>
          {description && <p className="text-sm text-slate-400 mt-1">{description}</p>}
        </div>
        <div className="flex items-center gap-6 mt-2 md:mt-0 self-stretch md:self-auto justify-between border-t border-slate-800 md:border-0 pt-4 md:pt-0">
          <div className="text-center md:text-right">
            <span className="text-xs uppercase tracking-wider text-slate-400 block font-semibold">Criteris Avaluats</span>
            <span className="text-2xl font-extrabold font-mono mt-0.5 block">
              {filledCount} / {criteria.length}
            </span>
          </div>
          <div className="w-px h-10 bg-slate-800 hidden md:block" />
          <div className="text-center md:text-right bg-indigo-600/30 border border-indigo-500/20 px-4 py-2 rounded-xl">
            <span className="text-xs uppercase tracking-wider text-indigo-300 block font-bold">Nota de la Secció</span>
            <span className="text-3xl font-extrabold font-mono text-indigo-300 mt-0.5 block">
              {sectionScore.toFixed(2)} <span className="text-sm font-medium text-slate-400">/ 10</span>
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-2">
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl">
          <button
            id="filter-all-btn"
            type="button"
            onClick={() => setFilterFilled('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              filterFilled === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tots ({criteria.length})
          </button>
          <button
            id="filter-pending-btn"
            type="button"
            onClick={() => setFilterFilled('pending')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              filterFilled === 'pending'
                ? 'bg-rose-50 text-rose-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pendent ({criteria.length - filledCount})
          </button>
          <button
            id="filter-completed-btn"
            type="button"
            onClick={() => setFilterFilled('completed')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              filterFilled === 'completed'
                ? 'bg-emerald-50 text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Complets ({filledCount})
          </button>
        </div>

        <button
          id="toggle-all-guidelines-btn"
          type="button"
          onClick={() => {
            const allExpanded = Object.keys(expandedCriteria).length === criteria.length;
            const target: Record<string, boolean> = {};
            if (!allExpanded) {
              criteria.forEach((c) => {
                target[c.id] = true;
              });
            }
            setExpandedCriteria(target);
          }}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline transition-all"
        >
          {Object.keys(expandedCriteria).length === criteria.length
            ? 'Col·lapsar descripcions'
            : 'Sencer: Guies de nivell'}
        </button>
      </div>

      {/* Criteria Cards */}
      <div className="flex flex-col gap-5">
        {filteredCriteria.length === 0 ? (
          <div className="text-center py-12 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl">
            <p className="text-slate-500 font-medium">No hi ha criteris que coincideixin amb el filtre seleccionat.</p>
          </div>
        ) : (
          filteredCriteria.map((criterion, idx) => {
            const itemScoring = scoring[criterion.id] || { level: null, comment: '' };
            const isCompleted = itemScoring.level !== null;
            const isDescriptionExpanded = expandedCriteria[criterion.id] || false;

            return (
              <div
                key={criterion.id}
                id={`card-${criterion.id}`}
                className={`border rounded-2xl bg-white p-4 md:p-5 transition-all duration-200 shadow-xs ${
                  isCompleted
                    ? 'border-emerald-200 ring-4 ring-emerald-500/5'
                    : 'border-slate-200'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono">
                        Ítem {idx + 1}
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-mono">
                        Pes: {criterion.weight.toFixed(2)} pts
                      </span>
                      {isCompleted ? (
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          <CheckCircle2 size={13} />
                          Completat
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                          <AlertTriangle size={13} />
                          Avaluació pendent
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-800 mt-2 hover:text-indigo-600 cursor-pointer flex items-center gap-2"
                        onClick={() => toggleExpand(criterion.id)}>
                      {criterion.name}
                      <HelpCircle size={15} className="text-slate-400" />
                    </h3>
                  </div>
                </div>

                {/* Collapsible Guideline levels */}
                {isDescriptionExpanded && (
                  <div className="mt-4 bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs text-slate-600 flex flex-col gap-2.5 leading-relaxed">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-200/50">
                      <p className="font-semibold text-slate-700 uppercase tracking-widest text-[10px]">
                        Indicadors de nivell d'avaluació (Fes clic en un nivell per puntuar directament):
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                      {/* Nivell 1 */}
                      <button
                        type="button"
                        disabled={readOnly}
                        onClick={() => handleLevelChange(criterion.id, 1)}
                        className={`text-left p-2.5 border rounded-lg transition-all ${
                          readOnly ? '' : 'cursor-pointer hover:border-rose-400 hover:ring-2 hover:ring-rose-500/10 hover:bg-rose-50/10'
                        } ${
                          itemScoring.level === 1
                            ? 'border-rose-500 bg-rose-50/30 ring-4 ring-rose-500/5 font-medium text-slate-800'
                            : 'border-slate-200 bg-white'
                        }`}
                        title="Selecciona Nivell 1: Insuficient"
                      >
                        <span className="font-bold text-rose-700 block mb-0.5 flex items-center justify-between">
                          <span>Nivell 1 (Insuficient)</span>
                          {itemScoring.level === 1 && <span className="text-[10px] bg-rose-650 text-white px-1.5 py-0.5 rounded-sm">Actiu</span>}
                        </span>
                        {criterion.levels[1]}
                      </button>

                      {/* Nivell 2 */}
                      <button
                        type="button"
                        disabled={readOnly}
                        onClick={() => handleLevelChange(criterion.id, 2)}
                        className={`text-left p-2.5 border rounded-lg transition-all ${
                          readOnly ? '' : 'cursor-pointer hover:border-amber-400 hover:ring-2 hover:ring-amber-500/10 hover:bg-amber-50/10'
                        } ${
                          itemScoring.level === 2
                            ? 'border-amber-500 bg-amber-50/30 ring-4 ring-amber-500/5 font-medium text-slate-800'
                            : 'border-slate-200 bg-white'
                        }`}
                        title="Selecciona Nivell 2: Adequat"
                      >
                        <span className="font-bold text-amber-700 block mb-0.5 flex items-center justify-between">
                          <span>Nivell 2 (Adequat)</span>
                          {itemScoring.level === 2 && <span className="text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded-sm">Actiu</span>}
                        </span>
                        {criterion.levels[2]}
                      </button>

                      {/* Nivell 3 */}
                      <button
                        type="button"
                        disabled={readOnly}
                        onClick={() => handleLevelChange(criterion.id, 3)}
                        className={`text-left p-2.5 border rounded-lg transition-all ${
                          readOnly ? '' : 'cursor-pointer hover:border-blue-400 hover:ring-2 hover:ring-blue-500/10 hover:bg-blue-50/10'
                        } ${
                          itemScoring.level === 3
                            ? 'border-blue-500 bg-blue-50/30 ring-4 ring-blue-500/5 font-medium text-slate-800'
                            : 'border-slate-200 bg-white'
                        }`}
                        title="Selecciona Nivell 3: Bo"
                      >
                        <span className="font-bold text-blue-700 block mb-0.5 flex items-center justify-between">
                          <span>Nivell 3 (Bo)</span>
                          {itemScoring.level === 3 && <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-sm">Actiu</span>}
                        </span>
                        {criterion.levels[3]}
                      </button>

                      {/* Nivell 4 */}
                      <button
                        type="button"
                        disabled={readOnly}
                        onClick={() => handleLevelChange(criterion.id, 4)}
                        className={`text-left p-2.5 border rounded-lg transition-all ${
                          readOnly ? '' : 'cursor-pointer hover:border-emerald-400 hover:ring-2 hover:ring-emerald-500/10 hover:bg-emerald-50/10'
                        } ${
                          itemScoring.level === 4
                            ? 'border-emerald-500 bg-emerald-50/30 ring-4 ring-emerald-500/5 font-medium text-slate-800'
                            : 'border-emerald-200 bg-emerald-50/10'
                        }`}
                        title="Selecciona Nivell 4: Excel·lent"
                      >
                        <span className="font-bold text-emerald-700 block mb-0.5 flex items-center justify-between">
                          <span>Nivell 4 (Excel·lent)</span>
                          {itemScoring.level === 4 && <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded-sm">Actiu</span>}
                        </span>
                        {criterion.levels[4]}
                      </button>
                    </div>
                  </div>
                )}

                {/* Level selector & comment area */}
                <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-t border-slate-100 pt-3.5">
                  <div className="flex items-center gap-1.5 shrink-0">
                    {[1, 2, 3, 4].map((level) => {
                      const isSelected = itemScoring.level === level;
                      const levelColors = {
                        1: 'bg-rose-600 border-rose-600 text-white shadow-xs focus:ring-rose-500 font-extrabold',
                        2: 'bg-amber-50 border-amber-500 text-white shadow-xs focus:ring-amber-500 font-extrabold',
                        3: 'bg-blue-600 border-blue-600 text-white shadow-xs focus:ring-blue-500 font-extrabold',
                        4: 'bg-emerald-600 border-emerald-600 text-white shadow-xs focus:ring-emerald-500 font-extrabold',
                      } as const;

                      const colors = isSelected
                        ? levelColors[level as keyof typeof levelColors]
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700 hover:text-slate-950';

                      return (
                        <button
                          key={level}
                          type="button"
                          id={`btn-level-${criterion.id}-${level}`}
                          disabled={readOnly}
                          onClick={() => handleLevelChange(criterion.id, level as EvaluationLevel)}
                          className={`w-10 h-10 rounded-xl border flex items-center justify-center text-sm font-bold font-mono transition-all duration-150 ${colors}`}
                          title={
                            level === 1 ? 'Insuficient' :
                            level === 2 ? 'Adequat' :
                            level === 3 ? 'Bo' :
                            'Excel·lent'
                          }
                        >
                          {level}
                        </button>
                      );
                    })}
                  </div>

                  {/* Comment area */}
                  <div className="flex-1 min-w-0">
                    <textarea
                      id={`comment-${criterion.id}`}
                      disabled={readOnly}
                      rows={1}
                      value={itemScoring.comment}
                      onChange={(e) => handleCommentChange(criterion.id, e.target.value)}
                      placeholder="Afegeix un comentari sobre aquest ítem si ho consideres necessari..."
                      className="w-full text-xs border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-slate-50/20 transition-all duration-150 placeholder:text-slate-400 font-sans"
                    />
                  </div>
                </div>

                {/* Level explanation guideline teaser */}
                {itemScoring.level !== null && (
                  <div className="mt-2.5 text-xs text-slate-500 bg-slate-50/50 px-3 py-2 rounded-lg border-l-2 border-slate-300 italic">
                    "{criterion.levels[itemScoring.level]}"
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
