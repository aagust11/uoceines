/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { TFM } from '../types.ts';
import { TREBALL_CRITERIA, VIDEO_CRITERIA, DEFENSA_CRITERIA } from '../criteriaData.ts';
import { Clipboard, Check, Trophy, FileText, UserCheck, AlertCircle, Sparkles } from 'lucide-react';

interface EvaluationSummaryProps {
  tfm: TFM;
}

export default function EvaluationSummary({ tfm }: EvaluationSummaryProps) {
  const [copied, setCopied] = useState(false);

  // Helper to compute a single evaluator's Section 2 Treball score based on evaluated items
  const computeSection2Score = (rubric: typeof tfm.tutorRubric) => {
    let totalWeight = 0;
    let earnedWeight = 0;
    let evaluatedCount = 0;

    TREBALL_CRITERIA.forEach((c) => {
      const scoringState = rubric[c.id];
      if (scoringState && scoringState.level !== null) {
        evaluatedCount++;
        totalWeight += c.weight;
        earnedWeight += (scoringState.level / 4) * c.weight;
      }
    });

    if (evaluatedCount === 0) return { score: 0, count: 0, total: TREBALL_CRITERIA.length };
    return {
      score: (earnedWeight / totalWeight) * 10,
      count: evaluatedCount,
      total: TREBALL_CRITERIA.length,
    };
  };

  const tutorTreball = computeSection2Score(tfm.tutorRubric);
  const avaluadorTreball = computeSection2Score(tfm.avaluadorRubric);

  // Combine them: if both evaluated, average. If only one evaluated, use that.
  let combinedTreballScore = 0;
  let statusTreball = '';
  
  if (tutorTreball.count > 0 && avaluadorTreball.count > 0) {
    combinedTreballScore = (tutorTreball.score + avaluadorTreball.score) / 2;
    statusTreball = 'Mitjana de Tutor i Avaluador Extern';
  } else if (tutorTreball.count > 0) {
    combinedTreballScore = tutorTreball.score;
    statusTreball = 'Només avaluat pel Tutor/a';
  } else if (avaluadorTreball.count > 0) {
    combinedTreballScore = avaluadorTreball.score;
    statusTreball = "Només avaluat per l'Avaluador/a Extern";
  } else {
    combinedTreballScore = 0;
    statusTreball = 'Pendent de qualificació';
  }

  // Helper to compute Section 3 Video + Defensa score (Evaluator only)
  const computeSection3Score = () => {
    let totalWeight = 0;
    let earnedWeight = 0;
    let evaluatedCount = 0;

    // Video portion
    VIDEO_CRITERIA.forEach((c) => {
      const scoringState = tfm.videoRubric[c.id];
      if (scoringState && scoringState.level !== null) {
        evaluatedCount++;
        totalWeight += c.weight;
        earnedWeight += (scoringState.level / 4) * c.weight;
      }
    });

    // Defensa portion
    DEFENSA_CRITERIA.forEach((c) => {
      const scoringState = tfm.defensaRubric[c.id];
      if (scoringState && scoringState.level !== null) {
        evaluatedCount++;
        totalWeight += c.weight;
        earnedWeight += (scoringState.level / 4) * c.weight;
      }
    });

    if (evaluatedCount === 0) return { score: 0, count: 0, total: 6 };
    return {
      score: (earnedWeight / totalWeight) * 10,
      count: evaluatedCount,
      total: 6,
    };
  };

  const defensaSummary = computeSection3Score();

  // Final Grade Formula:
  // Procés (Tutor) = 20%
  // Treball TFM = 60%
  // Defensa/Video = 20%
  const finalGrade = (tfm.procesScore * 0.20) + (combinedTreballScore * 0.60) + (defensaSummary.score * 0.20);

  // Categorize grade
  let pQualificacio = '';
  let colorClass = '';
  let badgeLetter = '';

  if (finalGrade >= 9.0) {
    pQualificacio = 'Excel·lent';
    colorClass = 'text-indigo-600 bg-indigo-50 border-indigo-200';
    badgeLetter = 'A';
  } else if (finalGrade >= 7.0) {
    pQualificacio = 'Notable';
    colorClass = 'text-teal-600 bg-teal-50 border-teal-200';
    badgeLetter = 'B';
  } else if (finalGrade >= 5.0) {
    pQualificacio = 'Aprovat';
    colorClass = 'text-amber-600 bg-amber-50 border-amber-200';
    badgeLetter = 'C+';
  } else {
    pQualificacio = 'Suspès';
    colorClass = 'text-rose-600 bg-rose-50 border-rose-200';
    badgeLetter = 'D';
  }

  // Generate HTML synthesis feedback for canvas
  const getActaHTML = () => {
    let html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; color: #334155; max-width: 650px; line-height: 1.6; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; background-color: #ffffff;">
      <h2 style="color: #4f46e5; margin-top: 0; font-size: 20px; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px;">📑 Acta conjunta d'avaluació TFM (UOC)</h2>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; margin-top: 10px;">
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #475569; width: 150px;">Estudiant:</td>
          <td style="padding: 6px 0; color: #1e293b; font-size: 15px;">${tfm.studentName || 'Albert Mallol Miron'}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #475569;">Qualificació Final:</td>
          <td style="padding: 6px 0; font-weight: bold; color: #4f46e5; font-size: 16px;">${finalGrade.toFixed(2)} / 10 (${pQualificacio})</td>
        </tr>
      </table>

      <h3 style="color: #1e293b; font-size: 15px; border-left: 3px solid #6366f1; padding-left: 8px; margin-top: 24px;">📝 1. Procés del Treball (Pes: 20%)</h3>
      <p style="font-size: 14px; margin: 8px 0;"><strong>Valoració global de tutoria:</strong> ${tfm.procesScore.toFixed(2)} sobre 10</p>
      ${tfm.procesComment ? `<p style="font-size: 13.5px; background: #f8fafc; padding: 10px; border-radius: 6px; border-left: 2px solid #94a3b8; font-style: italic; margin-top: 5px;">"${tfm.procesComment}"</p>` : ''}

      <h3 style="color: #1e293b; font-size: 15px; border-left: 3px solid #6366f1; padding-left: 8px; margin-top: 24px;">📘 2. Treball Escrit - Rúbrica (Pes: 60%)</h3>
      <p style="font-size: 14px; margin: 8px 0;"><strong>Qualificació Treball escrit:</strong> ${combinedTreballScore.toFixed(2)} sobre 10</p>
      
      <p style="font-size: 13px; color: #64748b;"><em>Resum dels criteris avaluats per les dues parts (Tutor i Avaluador Extern):</em></p>
      <ul style="font-size: 13.5px; padding-left: 20px; margin-top: 6px;">`;

    TREBALL_CRITERIA.forEach((c) => {
      const tState = tfm.tutorRubric[c.id];
      const aState = tfm.avaluadorRubric[c.id];
      if ((tState && tState.level) || (aState && aState.level)) {
        html += `<li style="margin-bottom: 6px;">
          <strong>${c.name.split(' (')[0]}:</strong> 
          Tutor: ${tState?.level ? `Nivell ${tState.level}` : '-'} | 
          Avaluador: ${aState?.level ? `Nivell ${aState.level}` : '-'}
          ${tState?.comment ? `<br/><span style="color: #64748b; font-size: 12.5px;">💬 Tutor: ${tState.comment}</span>` : ''}
          ${aState?.comment ? `<br/><span style="color: #64748b; font-size: 12.5px;">💬 Avaluador: ${aState.comment}</span>` : ''}
        </li>`;
      }
    });

    html += `</ul>

      <h3 style="color: #1e293b; font-size: 15px; border-left: 3px solid #6366f1; padding-left: 8px; margin-top: 24px;">🎥 3. Presentació en Vídeo i Defensa (Pes: 20%)</h3>
      <p style="font-size: 14px; margin: 8px 0;"><strong>Qualificació Vídeo i Defensa:</strong> ${defensaSummary.score.toFixed(2)} sobre 10</p>
      
      <table style="width: 100%; font-size: 13px; text-align: left; margin-top: 8px; border: 1px solid #f1f5f9; border-collapse: collapse;">
        <tr style="background: #f8fafc;">
          <th style="padding: 6px; border: 1px solid #f1f5f9;">Criteri de Vídeo o Defensa</th>
          <th style="padding: 6px; border: 1px solid #f1f5f9; width: 80px;">Nivell (1-4)</th>
        </tr>`;

    VIDEO_CRITERIA.forEach((c) => {
      const vState = tfm.videoRubric[c.id];
      html += `<tr>
        <td style="padding: 6px; border: 1px solid #f1f5f9;">${c.name.split(' (')[0]} (Vídeo)</td>
        <td style="padding: 6px; border: 1px solid #f1f5f9; text-align: center; font-weight: bold;">${vState?.level || '-'}</td>
      </tr>`;
    });

    DEFENSA_CRITERIA.forEach((c) => {
      const dState = tfm.defensaRubric[c.id];
      html += `<tr>
        <td style="padding: 6px; border: 1px solid #f1f5f9;">${c.name.split(' (')[0]} (Defensa)</td>
        <td style="padding: 6px; border: 1px solid #f1f5f9; text-align: center; font-weight: bold;">${dState?.level || '-'}</td>
      </tr>`;
    });

    html += `</table>`;

    if (tfm.commonNotes && tfm.commonNotes.replace(/<[^>]*>/g, '').trim()) {
      html += `<div style="margin-top: 24px; padding: 14px; border-radius: 8px; background-color: #f5f3ff; border: 1px solid #ddd6fe;">
        <h4 style="color: #6d28d9; margin-top: 0; margin-bottom: 8px; font-size: 14px;">📝 Notes i Síntesi de la Defensa Directa:</h4>
        <div style="font-size: 13px; color: #1e293b;">${tfm.commonNotes}</div>
      </div>`;
    }

    html += `
      <div style="margin-top: 30px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 12px;">
        Acta generada mitjançant l'aplicació d'Avaluacions de TFM (UOC 2024 / Formació de Professorat).
      </div>
    </div>`;

    return html;
  };

  const copyToClipboard = () => {
    const rawHTML = getActaHTML();
    navigator.clipboard.writeText(rawHTML).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Visual Report Score Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Combined Score */}
        <div className="lg:col-span-1 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 border border-indigo-950 text-white rounded-2xl p-6 flex flex-col justify-between shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none">
            <Trophy size={140} className="stroke-[1.5]" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-widest block">
              QUALIFICACIÓ GLOBAL CONJUNTA
            </span>
            <h3 className="text-xl font-bold font-sans tracking-tight mt-1 text-slate-100">
              {tfm.studentName || 'Albert Mallol Miron'}
            </h3>
          </div>
          
          <div className="my-8 text-center flex flex-col items-center">
            <div className="w-28 h-28 rounded-full border-4 border-indigo-400/30 flex items-center justify-center relative bg-indigo-950/40">
              <span className="text-4xl font-extrabold font-mono text-indigo-200">
                {finalGrade.toFixed(2)}
              </span>
              <div className="absolute -top-1 -right-1 w-9 h-9 rounded-full bg-indigo-500 text-white font-extrabold text-xs flex items-center justify-center border-2 border-indigo-900 shadow-sm">
                {badgeLetter}
              </div>
            </div>
            <span className={`mt-4 px-4 py-1.5 rounded-full text-xs font-bold font-sans uppercase tracking-widest border ${colorClass}`}>
              {pQualificacio}
            </span>
          </div>

          <div className="text-[11px] text-indigo-300 border-t border-indigo-900/50 pt-3 flex justify-between tracking-wide font-medium">
            <span>Fòrmula UOC 2024</span>
            <span className="font-mono">P:20% + T:60% + D:20%</span>
          </div>
        </div>

        {/* Weighted Formula Breakdown details */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-xs">
          <div>
            <h3 className="text-base font-extrabold text-slate-800 tracking-tight flex items-center gap-1.5 uppercase select-none">
              <Sparkles size={16} className="text-indigo-500" />
              <span>Descomposició de la Nota</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Fòrmula basada en el percentatge de pes de cadascuna de les rúbriques oficials.
            </p>
          </div>

          <div className="flex flex-col gap-4 my-5">
            {/* Sec 1 */}
            <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">1. Procés del TFM (Tutor/a)</span>
                <span className="font-mono font-bold text-indigo-600">
                  {tfm.procesScore.toFixed(2)} / 10 <span className="text-slate-400 font-normal">({(tfm.procesScore * 0.20).toFixed(2)} pts)</span>
                </span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full rounded-full transition-all" style={{ width: `${tfm.procesScore * 10}%` }} />
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-400">
                <span>Pes: 20%</span>
                <span className="max-w-[75%] truncate">"{tfm.procesComment || 'Sense comentari general'}"</span>
              </div>
            </div>

            {/* Sec 2 */}
            <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">2. Treball escrit del TFM (Tutor + Avaluador)</span>
                <span className="font-mono font-bold text-indigo-600">
                  {combinedTreballScore.toFixed(2)} / 10 <span className="text-slate-400 font-normal">({(combinedTreballScore * 0.60).toFixed(2)} pts)</span>
                </span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-teal-500 h-full rounded-full transition-all" style={{ width: `${combinedTreballScore * 10}%` }} />
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-400">
                <span>Pes: 60%</span>
                <span>{statusTreball}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-1 border-t border-slate-200/50 pt-2 text-[10px] text-slate-500">
                <span>Tutor/a: {tutorTreball.count} de {tutorTreball.total} items ({tutorTreball.score.toFixed(2)} /10)</span>
                <span>Avaluador/a: {avaluadorTreball.count} de {avaluadorTreball.total} items ({avaluadorTreball.score.toFixed(2)} /10)</span>
              </div>
            </div>

            {/* Sec 3 */}
            <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">3. Presentació en Vídeo i Defensa (Avaluador)</span>
                <span className="font-mono font-bold text-indigo-600">
                  {defensaSummary.score.toFixed(2)} / 10 <span className="text-slate-400 font-normal">({(defensaSummary.score * 0.20).toFixed(2)} pts)</span>
                </span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full transition-all" style={{ width: `${defensaSummary.score * 10}%` }} />
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-400">
                <span>Pes: 20%</span>
                <span>{defensaSummary.count} de {defensaSummary.total} críteris d'avaluació en vídeo/defensa completats</span>
              </div>
            </div>
          </div>
          
          {/* Missing data alert block */}
          {(tutorTreball.count < TREBALL_CRITERIA.length || avaluadorTreball.count < TREBALL_CRITERIA.length || defensaSummary.count < 6) && (
            <div className="flex items-center gap-2 text-rose-700 bg-rose-50 px-3 py-2 rounded-xl text-xs border border-rose-200/50 mt-1">
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>
                <strong>Nota Parcial:</strong> Encara falten ítems per avaluar en aquesta fitxa. La nota final es recalcularà dinàmicament quan es completin.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Copy Report / Export Action Area */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-100 pb-4 mb-4 gap-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-800 tracking-tight flex items-center gap-1.5 uppercase select-none">
              <FileText size={16} className="text-indigo-600" />
              <span>Acta de Síntesi i Feedback del Canvas</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Copia l'acta estructurada i formatejada directament amb un sol clic per a descarregar-la o enganxar-la directament a les aules Canvas o al resum final.
            </p>
          </div>
          
          <button
            type="button"
            id="copy-acta-btn"
            onClick={copyToClipboard}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition-all duration-200 ${
              copied
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {copied ? (
              <>
                <Check size={14} className="stroke-[2.5]" />
                <span>COPIAT HTML!</span>
              </>
            ) : (
              <>
                <Clipboard size={14} />
                <span>COPIA ACTA CONJUNTA</span>
              </>
            )}
          </button>
        </div>

        {/* Live Container Preview of Feedback Acta */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 overflow-x-auto max-h-[420px]">
          <div className="scale-95 origin-top min-w-[500px]" dangerouslySetInnerHTML={{ __html: getActaHTML() }} />
        </div>
      </div>
    </div>
  );
}
