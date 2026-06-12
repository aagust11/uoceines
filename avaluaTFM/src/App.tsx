/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { TFM, RubricScoring } from './types.ts';
import { TREBALL_CRITERIA, VIDEO_CRITERIA, DEFENSA_CRITERIA } from './criteriaData.ts';
import {
  getStoredFileHandle,
  saveFileHandle,
  writeFileContents,
  readFileContents,
  clearStoredFileHandle,
} from './fileManager.ts';
import RubricSection from './components/RubricSection.tsx';
import EvaluationSummary from './components/EvaluationSummary.tsx';
import RichTextEditor from './components/RichTextEditor.tsx';
import {
  FileJson,
  Plus,
  Trash2,
  FolderOpen,
  User,
  GraduationCap,
  BookOpen,
  Sliders,
  Sparkles,
  ClipboardList,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  Video,
  FileCheck,
  ChevronRight,
  UserCheck,
  RotateCcw,
} from 'lucide-react';

// Prepopulated sample TFM consistent with the student name screenshot
const SAMPLE_TFM: TFM = {
  id: 'albert-mallol-miron-2024',
  studentName: 'Albert Mallol Miron',
  evaluatorRole: 'tutor',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  procesScore: 8.5,
  procesComment: "Molt bon seguiment de les tasques de disseny de la recerca. L'alumnat ha respost bé a les indicacions del canvas i ha mantingut un calendari constant i eficient de treball pautat.",
  tutorRubric: {
    pregunta: { level: 4, comment: "La pregunta està clarament delimitada i és coherent amb l'àmbit d'estudi de professorat." },
    context: { level: 3, comment: "Bona contextualització, tot i que es podria aprofundir una mica més en el marc institucional." },
    planificacio: { level: 4, comment: "Cronograma excel·lent i totalment viable." },
    metodologia: { level: 3, comment: "El disseny metodològic és correcte, es proposa anàlisi de casos." },
    eines: { level: 3, comment: "Selecció d'eines correcta." },
  },
  avaluadorRubric: {
    pregunta: { level: 4, comment: "Pregunta perfectament formulada i d'alta rellevància." },
    context: { level: 4, comment: "Exhaustiva presentació dels fonaments." },
    planificacio: { level: 3, comment: "Planificació ben resolta." },
    metodologia: { level: 3, comment: "Disseny ben explicat d'acord amb el marc d'investigació." },
  },
  videoRubric: {
    video_estructura: { level: 4, comment: "El vídeo té una estructura impecable i les transicions són molt fluides." },
    video_sintesi: { level: 3, comment: "Bona capacitat de síntesi cobrint tot el projecte." },
    video_verbals: { level: 4, comment: "Llenguatge tècnic i molt bona vocalització de les idees." },
  },
  defensaRubric: {
    defensa_claredat: { level: 4, comment: "Respostes altament professionals i directes." },
    defensa_argumentacio: { level: 3, comment: "Bona defensa argumental." },
    defensa_informacio: { level: 3, comment: "Aporta dades del context addicionals rellevants." },
  },
  videoNotes: "<p><strong>Observacions generals de la presentació en vídeo:</strong></p><ul><li>Bona expressió corporal i seguretat en l'explicació.</li><li>Suport de diapositives clar i sense sobrecàrrega visual.</li><li>Vocalització i ritme adequats.</li></ul>",
  defensaNotes: "<p>La defensa s'ha desenvolupat correctament, l'estudiant respon amb confiança a les preguntes formulades per la comissió.</p>",
  commonNotes: "<p>L'estudiant <strong>Albert Mallol Miron</strong> ha defensat el seu TFM demostrant un gran bagatge pràctic i teòric. S'aprecien competències adquirides de nivell excel·lent, especialment en el disseny i comunicació dels resultats de l'aprenentatge del professorat.</p>",
};

export default function App() {
  const [tfms, setTfms] = useState<TFM[]>([]);
  const [activeTfmId, setActiveTfmId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'proces' | 'treball' | 'video' | 'defensa' | 'comu' | 'summary'>('treball');
  const [activeFileHandle, setActiveFileHandle] = useState<FileSystemFileHandle | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  
  // Create / Input student fields
  const [newStudentName, setNewStudentName] = useState('');
  const [newDefaultRole, setNewDefaultRole] = useState<'tutor' | 'avaluador'>('tutor');
  const [isCreating, setIsCreating] = useState(false);

  // 1. Initial State Load (LocalStorage Hot Cash Fallback + Checking previous DB Session file handle)
  useEffect(() => {
    const cached = localStorage.getItem('avaluacions_tfm_uoc_state');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && Array.isArray(parsed)) {
          setTfms(parsed);
          if (parsed.length > 0) {
            setActiveTfmId(parsed[0].id);
          }
        }
      } catch (err) {
        console.error('Error llegint el localStorage hot-cache:', err);
      }
    } else {
      // First time loading - add standard mock student so user sees immediate results
      setTfms([SAMPLE_TFM]);
      setActiveTfmId(SAMPLE_TFM.id);
    }

    // Check IndexedDB stored file handle
    getStoredFileHandle().then((handle) => {
      if (handle) {
        setActiveFileHandle(handle);
      }
    });
  }, []);

  // 2. LocalStorage sync side effect for absolute resiliency
  useEffect(() => {
    if (tfms.length > 0) {
      localStorage.setItem('avaluacions_tfm_uoc_state', JSON.stringify(tfms));
    }
  }, [tfms]);

  // 3. Automated File System Writer Trigger
  const triggerAutoSaveToFile = useCallback(async (currentTfms: TFM[], handle: FileSystemFileHandle) => {
    try {
      setFileError(null);
      const payload = {
        version: '1.0',
        lastUpdated: new Date().toISOString(),
        tfms: currentTfms,
      };
      await writeFileContents(handle, JSON.stringify(payload, null, 2));
    } catch (err: any) {
      console.error('Error escrivint al fitxer en desar automàticament:', err);
      // We don't block user flow since localStorage cached it anyway, but we show a small warning indicator
      setFileError("No s'ha pogut desar automàticament al fitxer del disc (falten permisos d'escriptura).");
    }
  }, []);

  // Sync to file whenever tfms changes
  useEffect(() => {
    if (activeFileHandle && tfms.length > 0) {
      triggerAutoSaveToFile(tfms, activeFileHandle);
    }
  }, [tfms, activeFileHandle, triggerAutoSaveToFile]);

  // Try to connect to existing file handle (requests permission dialog from user onClick)
  const reconnectFileHandle = async () => {
    if (!activeFileHandle) return;
    try {
      setFileError(null);
      const content = await readFileContents(activeFileHandle);
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.tfms)) {
        setTfms(parsed.tfms);
        if (parsed.tfms.length > 0) {
          setActiveTfmId(parsed.tfms[0].id);
        }
        alert(`📂 S'han carregat correctament ${parsed.tfms.length} TFM des de "${activeFileHandle.name}"!`);
      }
    } catch (err: any) {
      console.error('Error recuperant permís del fitxer:', err);
      setFileError("S'ha denegat o ha fallat la llicència de lectura per al fitxer seleccionat.");
    }
  };

  // 4. File picker actions
  const handleOpenLocalFile = async () => {
    try {
      setFileError(null);
      
      if (!('showOpenFilePicker' in window)) {
        throw new Error('API_NOT_SUPPORTED');
      }

      // Open file picker
      const [handle] = await (window as any).showOpenFilePicker({
        types: [
          {
            description: 'Fitxer de dades d\'Avaluacions JSON',
            accept: {
              'application/json': ['.json'],
            },
          },
        ],
        multiple: false,
      });

      if (handle) {
        const content = await readFileContents(handle);
        const parsed = JSON.parse(content);
        
        let loadedTfms = tfms;
        if (parsed && Array.isArray(parsed.tfms)) {
          loadedTfms = parsed.tfms;
        } else if (Array.isArray(parsed)) {
          loadedTfms = parsed;
        }

        setTfms(loadedTfms);
        if (loadedTfms.length > 0) {
          setActiveTfmId(loadedTfms[0].id);
        }

        setActiveFileHandle(handle);
        await saveFileHandle(handle);
        setFileError(`✅ Fitxer vinculat correctament: ${handle.name}`);
        setTimeout(() => setFileError(null), 8000);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('Error carregant fitxer local:', err);

      const isIframeConstraint = 
        err.name === 'SecurityError' || 
        err.message?.includes('sub-frame') ||
        err.message?.includes('sub frame') ||
        err.message?.includes('SecurityError') ||
        err.message?.includes('cross-origin') ||
        err.message?.includes('allowed') ||
        err.message?.includes('showOpenFilePicker') ||
        err.message?.includes('File System Access') ||
        err.message === 'API_NOT_SUPPORTED';

      if (isIframeConstraint) {
        setFileError("⚠️ L'entorn limita la vinculació directa en segon pla (Iframe actiu). S'ha obert el selector estàndard de fitxers, si us plau selecciona el teu fitxer JSON.");
        // Programmatically trigger custom file input
        setTimeout(() => {
          document.getElementById('legacy-import-input')?.click();
        }, 150);
      } else {
        setFileError(`No s'ha pogut obrir el fitxer JSON: ${err.message || err}. Pots utilitzar el selector manual.`);
      }
    }
  };

  const handleCreateNewFile = async () => {
    try {
      setFileError(null);
      
      if (!('showSaveFilePicker' in window)) {
        throw new Error('API_NOT_SUPPORTED');
      }

      const handle = await (window as any).showSaveFilePicker({
        suggestedName: 'tfm_uoc_avaluacions.json',
        types: [
          {
            description: 'Fitxer JSON d\'Avaluacions',
            accept: {
              'application/json': ['.json'],
            },
          },
        ],
      });

      if (handle) {
        // Prepare template structured data
        const payload = {
          version: '1.0',
          lastUpdated: new Date().toISOString(),
          tfms: tfms, // preserve current items in the new file
        };
        await writeFileContents(handle, JSON.stringify(payload, null, 2));

        setActiveFileHandle(handle);
        await saveFileHandle(handle);
        setFileError(`✅ Nou fitxer JSON creat i vinculat: "${handle.name}"`);
        setTimeout(() => setFileError(null), 8000);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('Error creant fitxer local:', err);

      const isIframeConstraint = 
        err.name === 'SecurityError' || 
        err.message?.includes('sub-frame') ||
        err.message?.includes('sub frame') ||
        err.message?.includes('SecurityError') ||
        err.message?.includes('cross-origin') ||
        err.message?.includes('allowed') ||
        err.message?.includes('showSaveFilePicker') ||
        err.message?.includes('File System Access') ||
        err.message === 'API_NOT_SUPPORTED';

      if (isIframeConstraint) {
        setFileError("⚠️ L'entorn limita la creació directa de fitxers al disc (Iframe actiu). S'està descarregant directament el teu fitxer de còpia de seguretat JSON.");
        setTimeout(() => {
          handleLegacyExport();
        }, 150);
      } else {
        setFileError(`No s'ha pogut crear el fitxer JSON: ${err.message || err}. Pots descarregar la còpia mitjançant la icona de descàrrega.`);
      }
    }
  };

  const handleDisconnectFile = async () => {
    if (confirm('Vols desconnectar el fitxer actiu? Les dades continuaran desades a la memòria local (LocalStorage).')) {
      setActiveFileHandle(null);
      await clearStoredFileHandle();
    }
  };

  // Fallback Import/Export for old browsers or iframe conditions where window.showOpenFilePicker is restricted
  const handleLegacyExport = () => {
    const payload = {
      version: '1.0',
      lastUpdated: new Date().toISOString(),
      tfms: tfms,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tfm_uoc_avaluacions_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLegacyImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        let loaded: TFM[] = [];
        if (parsed && Array.isArray(parsed.tfms)) {
          loaded = parsed.tfms;
        } else if (Array.isArray(parsed)) {
          loaded = parsed;
        }

        if (loaded.length > 0) {
          setTfms(loaded);
          setActiveTfmId(loaded[0].id);
          alert(`📂 S'han carregat correctament ${loaded.length} registres de TFM amb el mètode de seguretat.`);
        } else {
          alert('El fitxer importat no conté registres vàlids.');
        }
      } catch (err) {
        alert('Error en parsejar el fitxer JSON seleccionat.');
      }
    };
    reader.readAsText(file);
  };

  // 5. Evaluation list management (New TFM, delete, active update)
  const handleCreateNewTfm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) {
      alert("S'ha d'introduir un nom per a l'estudiant.");
      return;
    }

    const newTfm: TFM = {
      id: `tfm-${Date.now()}`,
      studentName: newStudentName.trim(),
      evaluatorRole: newDefaultRole,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      procesScore: 0,
      procesComment: '',
      tutorRubric: {},
      avaluadorRubric: {},
      videoRubric: {},
      defensaRubric: {},
      videoNotes: '',
      defensaNotes: '',
      commonNotes: '',
    };

    setTfms((prev) => [newTfm, ...prev]);
    setActiveTfmId(newTfm.id);
    setNewStudentName('');
    setIsCreating(false);
    setActiveTab('treball'); // start directly on the grading rubric view
  };

  const handleDeleteTfm = (id: string, name: string) => {
    if (confirm(`Vols eliminar l'avaluació de l'estudiant "${name}"? Aquesta acció és irreversible.`)) {
      const updated = tfms.filter((t) => t.id !== id);
      setTfms(updated);
      if (activeTfmId === id) {
        setActiveTfmId(updated.length > 0 ? updated[0].id : null);
      }
    }
  };

  // Live update the chosen active TFM state record
  const updateActiveTfm = (updater: (prev: TFM) => TFM) => {
    if (!activeTfmId) return;
    setTfms((prev) =>
      prev.map((t) => {
        if (t.id === activeTfmId) {
          const updated = updater(t);
          return {
            ...updated,
            updatedAt: new Date().toISOString(),
          };
        }
        return t;
      })
    );
  };

  // Active student object helper
  const activeTfm = tfms.find((t) => t.id === activeTfmId) || null;

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen font-sans flex flex-col justify-between">
      
      {/* Visual Workspace Bar */}
      <header className="sticky top-0 bg-white border-b border-rose-100/40 shadow-xs z-30 selection:bg-indigo-100">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <GraduationCap className="stroke-[2.2]" size={22} />
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5 select-none">
                <span>Avaluació TFM</span>
                <span className="text-[10px] bg-indigo-550 text-white px-2 py-0.5 rounded-full font-extrabold normal-case font-mono">
                  UOC 2024
                </span>
              </h1>
              <p className="text-xs text-slate-500 font-medium">Formació de Professorat • Gestor local d'actes</p>
            </div>
          </div>

          {/* Local File Management Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {activeFileHandle ? (
              <div className="flex items-center bg-emerald-50 border border-emerald-150 px-3.5 py-1.5 rounded-xl text-xs gap-3">
                <span className="flex items-center gap-1.5 font-bold text-emerald-800">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-550"></span>
                  </span>
                  <span>Sincronitzat en directe: {activeFileHandle.name}</span>
                </span>
                
                <div className="flex items-center gap-1.5">
                  <span className="w-px h-3 bg-emerald-200" />
                  <button
                    id="disconnect-file-btn"
                    type="button"
                    onClick={handleDisconnectFile}
                    className="hover:bg-rose-100 px-2 py-0.5 text-rose-700 font-bold uppercase rounded-md transition-colors text-[10px]"
                  >
                    Desconnecta fitxer
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center bg-slate-100 border border-slate-200 p-1.5 rounded-xl gap-1">
                <button
                  id="open-local-file-btn"
                  type="button"
                  onClick={handleOpenLocalFile}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 hover:text-slate-900 bg-white shadow-xs rounded-lg hover:bg-slate-50 transition-colors"
                  title="Vincula un fitxer JSON del teu ordinador per desar-hi els canvis de forma automàtica"
                >
                  <FolderOpen size={13} />
                  <span>Vincula JSON existent</span>
                </button>
                <button
                  id="create-new-file-btn"
                  type="button"
                  onClick={handleCreateNewFile}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-150 animate-pulse"
                  title="Crea un nou fitxer JSON on es desaran de forma automàtica totes les qualificacions en directe"
                >
                  <Plus size={13} />
                  <span>Crea Nou JSON</span>
                </button>
              </div>
            )}
            
            {/* Direct Export/Import Legacy fallbacks */}
            <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
              <button
                id="legacy-export-btn"
                type="button"
                onClick={handleLegacyExport}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                title="Descarrega una còpia JSON al vol"
              >
                <Download size={14} />
              </button>
              <label
                htmlFor="legacy-import-input"
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer transition-colors"
                title="Carrega una còpia JSON"
              >
                <Upload size={14} />
                <input
                  id="legacy-import-input"
                  type="file"
                  accept=".json"
                  onChange={handleLegacyImport}
                  className="hidden"
                />
              </label>
            </div>
          </div>

        </div>
      </header>

      {/* Global File Notification Banner */}
      {fileError && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className={`p-4 rounded-xl border flex items-start justify-between gap-3 text-xs md:text-sm shadow-xs transition-all duration-200 ${
            fileError.includes('✅') 
              ? 'bg-emerald-50 border-emerald-250 text-emerald-800' 
              : fileError.includes('⚠️') 
                ? 'bg-amber-50 border-amber-200 text-amber-900 ring-2 ring-amber-500/5' 
                : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            <div className="flex items-start gap-2.5">
              <span className="text-base select-none mt-0.5">
                {fileError.includes('✅') ? '⚡' : fileError.includes('⚠️') ? '🛎️' : '🚨'}
              </span>
              <div className="flex-1">
                <p className="font-semibold">{fileError}</p>
              </div>
            </div>
            <button 
              type="button" 
              onClick={() => setFileError(null)} 
              className="p-1.5 hover:bg-slate-500/10 rounded-lg text-slate-500 hover:text-slate-800 transition-colors shrink-0 font-mono text-xs font-bold leading-none cursor-pointer"
              title="Tanca aquest avís"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace Body Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Left Side: Student List & Creator */}
        <section className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col gap-5 sticky top-24">
          
          {/* File state verification for permissions alert */}
          {activeFileHandle && fileError && (
            <div className="flex flex-col p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs gap-2">
              <div className="flex items-start gap-1.5">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5 text-rose-600" />
                <span><strong>Permisos requerits:</strong> S'ha de verificar la connexió al fitxer per a poder desar canvis automàticament.</span>
              </div>
              <button
                id="reconnect-permissions-btn"
                type="button"
                onClick={reconnectFileHandle}
                className="bg-rose-600 text-white font-bold py-1 px-2.5 rounded-lg hover:bg-rose-700 transition-colors uppercase text-[10px] tracking-wide self-start"
              >
                Atorga permís fitxer
              </button>
            </div>
          )}

          {/* Title Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider flex items-center gap-1.5 select-none">
              <User size={14} />
              <span>Estudiants ({tfms.length})</span>
            </h2>
            <button
              id="new-student-view-toggle"
              type="button"
              onClick={() => setIsCreating(!isCreating)}
              className="p-1 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-all"
              title="Crear un nou TFM"
            >
              <Plus size={18} className="stroke-[2.5]" />
            </button>
          </div>

          {/* Inline TFM registration formulation form */}
          {isCreating && (
            <form onSubmit={handleCreateNewTfm} className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="student-name-input" className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  Nom Complet de l'Estudiant
                </label>
                <input
                  id="student-name-input"
                  type="text"
                  required
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="Ex: Albert Mallol Miron"
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-hidden focus:border-indigo-500 bg-white"
                />
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Rol per Defecte</span>
                <div className="grid grid-cols-2 gap-1 bg-slate-200 p-0.5 rounded-lg text-[10px] font-bold">
                  <button
                    id="new-role-tutor-btn"
                    type="button"
                    onClick={() => setNewDefaultRole('tutor')}
                    className={`py-1 rounded-md transition-all ${
                      newDefaultRole === 'tutor'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    Tutor/a
                  </button>
                  <button
                    id="new-role-avaluador-btn"
                    type="button"
                    onClick={() => setNewDefaultRole('avaluador')}
                    className={`py-1 rounded-md transition-all ${
                      newDefaultRole === 'avaluador'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    Avaluador/a
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 mt-2 text-[10px]">
                <button
                  id="cancel-create-btn"
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-2.5 py-1 text-slate-500 hover:text-slate-800 font-bold uppercase transition-all"
                >
                  Cancel·la
                </button>
                <button
                  id="submit-create-btn"
                  type="submit"
                  className="bg-indigo-600 hover:bg-slate-900 text-white px-3 py-1 font-extrabold uppercase rounded-lg transition-all shadow-xs"
                >
                  Afegeix TFM
                </button>
              </div>
            </form>
          )}

          {/* List of elements */}
          <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-1">
            {tfms.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 font-medium">
                No hi ha TFM guardats en el fitxer de dades actiu.
              </div>
            ) : (
              tfms.map((t) => {
                const isActive = t.id === activeTfmId;
                return (
                  <div
                    key={t.id}
                    id={`student-item-${t.id}`}
                    onClick={() => {
                      setActiveTfmId(t.id);
                    }}
                    className={`group w-full text-left p-3.5 rounded-xl cursor-pointer border flex flex-col justify-between transition-all ${
                      isActive
                        ? 'bg-indigo-600 border-indigo-700 text-white shadow-md shadow-indigo-200/50 scale-[1.01]'
                        : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5 w-full">
                      <div className="flex items-center gap-1.5">
                        <UserCheck size={14} className={isActive ? 'text-indigo-200' : 'text-slate-400'} />
                        <span className="text-sm font-bold tracking-tight pr-5 break-all">{t.studentName}</span>
                      </div>
                      
                      <button
                        id={`delete-btn-${t.id}`}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTfm(t.id, t.studentName);
                        }}
                        className={`opacity-0 group-hover:opacity-100 p-1 rounded-md transition-opacity -mt-1 -mr-1 hover:bg-slate-900/10 ${
                          isActive ? 'text-indigo-200 hover:text-white' : 'text-slate-400 hover:text-rose-600'
                        }`}
                        title="Eliminar aquest TFM"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-3 text-[10px]">
                      <span className={`px-2 py-0.5 rounded font-extrabold uppercase font-sans tracking-wide ${
                        isActive ? 'bg-indigo-500/50 text-indigo-100' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {t.evaluatorRole === 'tutor' ? 'Tutor/a' : 'Avaluador/a'}
                      </span>
                      <span className={isActive ? 'text-indigo-200' : 'text-slate-400'}>
                        {new Date(t.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="text-[10px] text-slate-500 font-medium leading-relaxed border-t border-slate-150 pt-3 flex flex-col gap-1.5 select-none bg-slate-50/50 p-2.5 rounded-xl border">
            <span className="font-bold text-slate-700">🔄 Sincronització Automàtica Activa:</span>
            <span>Un cop vinculat o creat el fitxer JSON, cada canvi, valoració, o anotació que introdueixis es desa automàticament al fitxer JSON i en la memòria segura del navegador (LocalStorage). No cal prémer cap botó per desar.</span>
          </div>

        </section>

        {/* Right Side: Evaluation Workspace panel */}
        <section className="col-span-1 lg:col-span-3">
          
          {activeTfm ? (
            <div className="flex flex-col gap-6">
              
              {/* Workspace Header for Selected Student */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                      <GraduationCap size={14} />
                      Treball de Final de Màster UOC
                    </span>
                    <span className="text-xs text-slate-300">•</span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                      Creat el {new Date(activeTfm.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black font-sans tracking-tight text-slate-800 mt-1">
                    {activeTfm.studentName}
                  </h2>
                </div>

                {/* Switch Role Controls */}
                <div className="flex flex-col gap-1.5 self-stretch md:self-auto">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block text-left md:text-right select-none">
                    Vols analitzar / actuar com a:
                  </span>
                  
                  <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200/55 shadow-xs">
                    <button
                      id="role-switch-tutor-btn"
                      type="button"
                      onClick={() => updateActiveTfm((prev) => ({ ...prev, evaluatorRole: 'tutor' }))}
                      className={`py-1.5 px-4 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                        activeTfm.evaluatorRole === 'tutor'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-800'
                      }`}
                    >
                      <UserCheck size={13} />
                      <span>Sóc Tutor/a</span>
                    </button>
                    <button
                      id="role-switch-avaluador-btn"
                      type="button"
                      onClick={() => updateActiveTfm((prev) => ({ ...prev, evaluatorRole: 'avaluador' }))}
                      className={`py-1.5 px-4 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                        activeTfm.evaluatorRole === 'avaluador'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-800'
                      }`}
                    >
                      <FileCheck size={13} />
                      <span>Sóc Avaluador/a</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs - Dynamically configured based on selected role */}
              <div className="flex items-center border-b border-slate-200 gap-1 overflow-x-auto scroller-hidden select-none pb-px">
                
                {/* Specific tabs for Tutor Mode */}
                {activeTfm.evaluatorRole === 'tutor' && (
                  <>
                    <button
                      id="tab-proces"
                      type="button"
                      onClick={() => setActiveTab('proces')}
                      className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
                        activeTab === 'proces'
                          ? 'border-indigo-600 text-indigo-600 font-extrabold'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      1. Procés (20%)
                    </button>
                    <button
                      id="tab-treball-tutor"
                      type="button"
                      onClick={() => setActiveTab('treball')}
                      className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
                        activeTab === 'treball'
                          ? 'border-indigo-600 text-indigo-600 font-extrabold'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      2. Treball (60%)
                    </button>
                  </>
                )}

                {/* Specific tabs for Avaluador Extern Mode */}
                {activeTfm.evaluatorRole === 'avaluador' && (
                  <>
                    <button
                      id="tab-treball-avaluador"
                      type="button"
                      onClick={() => setActiveTab('treball')}
                      className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
                        activeTab === 'treball'
                          ? 'border-indigo-600 text-indigo-600 font-extrabold'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      1. Treball (60%)
                    </button>
                    <button
                      id="tab-video"
                      type="button"
                      onClick={() => setActiveTab('video')}
                      className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
                        activeTab === 'video'
                          ? 'border-indigo-600 text-indigo-600 font-extrabold'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      2. Vídeo (10%)
                    </button>
                    <button
                      id="tab-defensa"
                      type="button"
                      onClick={() => setActiveTab('defensa')}
                      className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
                        activeTab === 'defensa'
                          ? 'border-indigo-600 text-indigo-600 font-extrabold'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      3. Defensa (10%)
                    </button>
                    <button
                      id="tab-comu"
                      type="button"
                      onClick={() => setActiveTab('comu')}
                      className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
                        activeTab === 'comu'
                          ? 'border-indigo-600 text-indigo-600 font-extrabold'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      📓 Notes de Defensa
                    </button>
                  </>
                )}

                <div className="flex-1" />

                {/* Summary View Tab for both worlds */}
                <button
                  id="tab-summary-results"
                  type="button"
                  onClick={() => setActiveTab('summary')}
                  className={`px-5 py-2.5 text-xs font-extrabold uppercase tracking-widest border-b-2 transition-all bg-indigo-50/40 rounded-t-xl shrink-0 flex items-center gap-1.5 ${
                    activeTab === 'summary'
                      ? 'border-indigo-600 text-indigo-700 bg-indigo-50 font-black'
                      : 'border-transparent text-indigo-600/85 hover:text-indigo-950'
                  }`}
                >
                  <Sparkles size={13} className="text-secondary" />
                  <span>Avaluació Final UOC</span>
                </button>
              </div>

              {/* TAB VIEWS WORKSPACE CONTROLLERS: */}
              
              {/* Tab 1: Procés (Tutor only) */}
              {activeTab === 'proces' && activeTfm.evaluatorRole === 'tutor' && (
                <div className="flex flex-col gap-6">
                  {/* General Procés score & Guidelines */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col gap-5">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-800 tracking-tight uppercase flex items-center gap-1.5">
                        <BookOpen size={16} className="text-indigo-600" />
                        <span>Procés d'Aula Canvas del TFM</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Aquesta secció és responsabilitat exclusiva del tutor. Es trasllada de forma directa la nota de procés de l'estudiant de la plataforma Canvas i val un <strong>20% de la nota final del TFM</strong>.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start mt-2">
                      <div className="md:col-span-1 flex flex-col gap-2">
                        <label htmlFor="proces-score-slider" className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">
                          Qualificació de Procés (0-10)
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            id="proces-score-slider"
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            value={activeTfm.procesScore}
                            onChange={(e) => {
                              const val = Math.min(10, Math.max(0, parseFloat(e.target.value) || 0));
                              updateActiveTfm((prev) => ({ ...prev, procesScore: val }));
                            }}
                            className="w-24 text-center font-bold font-mono text-base border border-slate-200 rounded-lg p-2 bg-slate-50/50"
                          />
                          <span className="text-sm text-slate-400 font-medium">/ 10</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="10"
                          step="0.1"
                          value={activeTfm.procesScore}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            updateActiveTfm((prev) => ({ ...prev, procesScore: val }));
                          }}
                          className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-200 accent-indigo-600 mt-2"
                        />
                      </div>

                      <div className="md:col-span-3 flex flex-col gap-2">
                        <label htmlFor="proces-comments-textarea" className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">
                          Observacions Generals de Procés
                        </label>
                        <textarea
                          id="proces-comments-textarea"
                          rows={4}
                          value={activeTfm.procesComment}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateActiveTfm((prev) => ({ ...prev, procesComment: val }));
                          }}
                          placeholder="Afegeix comentaris de l'esforç, reunions de tutoria, segbment de fites i lliuraments parcials..."
                          className="w-full text-sm border border-slate-200 rounded-xl p-3 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Rúbrica de Treball TFM (Tutor / Evaluator depends on active role state) */}
              {activeTab === 'treball' && (
                <RubricSection
                  id="section-rubric-treball"
                  title="2. Rúbrica del Procés i Contingut del Treball Escrit (60% de la nota final)"
                  description="Criteris generals puntuats en nivell de 1 a 4: Excel·lent (4), Bo (3), Adequat (2) i Insuficient (1). Ambdós rols avaluen aquesta part per tal de computar-ne la mitjana."
                  criteria={TREBALL_CRITERIA}
                  scoring={activeTfm.evaluatorRole === 'tutor' ? activeTfm.tutorRubric : activeTfm.avaluadorRubric}
                  onUpdateScoring={(updated) => {
                    updateActiveTfm((prev) => {
                      if (prev.evaluatorRole === 'tutor') {
                        return { ...prev, tutorRubric: updated };
                      } else {
                        return { ...prev, avaluadorRubric: updated };
                      }
                    });
                  }}
                />
              )}

              {/* Tab 3: Defensa Vídeo (Avaluador only) */}
              {activeTab === 'video' && activeTfm.evaluatorRole === 'avaluador' && (
                <div className="flex flex-col gap-6">
                  <RubricSection
                    id="section-rubric-video"
                    title="Vídeo de la Presentació del TFM (Marcador de Vídeo)"
                    description="Vídeo d'exposició: estructura, capacitat de síntesi i habilitats comunicatives verbals."
                    criteria={VIDEO_CRITERIA}
                    scoring={activeTfm.videoRubric}
                    onUpdateScoring={(updated) => {
                      updateActiveTfm((prev) => ({ ...prev, videoRubric: updated }));
                    }}
                  />
                  
                  {/* Rich notes specifically for video */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col gap-4">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Notes de la Defensa (Compartit amb Defensa Presencial)
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Anotacions per a l'avaluació de la defensa i presentació en vídeo (compromeses en ambdues pestanyes).
                      </p>
                    </div>

                    <RichTextEditor
                      id="video-rich-notes"
                      value={activeTfm.defensaNotes}
                      onChange={(updated) => {
                        updateActiveTfm((prev) => ({ ...prev, videoNotes: updated, defensaNotes: updated }));
                      }}
                      placeholder="Identifica i escriu segons minutatge (p. ex., Minut 2:15 - Concreta de forma excel·lent...) i altres qüestions..."
                    />
                  </div>
                </div>
              )}

              {/* Tab 4: Defensa Presencial (Avaluador only) */}
              {activeTab === 'defensa' && activeTfm.evaluatorRole === 'avaluador' && (
                <div className="flex flex-col gap-6">
                  <RubricSection
                    id="section-rubric-defensa"
                    title="Defensa Oral Presencial o Síncrona"
                    description="Avalua en detall la claredat de les respostes de l'estudiant, la qualitat de l'argumentació i l'aportació d'informació addicional durant la tisorada de preguntes."
                    criteria={DEFENSA_CRITERIA}
                    scoring={activeTfm.defensaRubric}
                    onUpdateScoring={(updated) => {
                      updateActiveTfm((prev) => ({ ...prev, defensaRubric: updated }));
                    }}
                  />

                  {/* Rich notes specifically for oral defense */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col gap-4">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Notes de la Defensa (Compartit amb Defensa Vídeo)
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Anotacions per a l'avaluació de la defensa i presentació en vídeo (compromeses en ambdues pestanyes).
                      </p>
                    </div>

                    <RichTextEditor
                      id="defensa-rich-notes"
                      value={activeTfm.defensaNotes}
                      onChange={(updated) => {
                        updateActiveTfm((prev) => ({ ...prev, videoNotes: updated, defensaNotes: updated }));
                      }}
                      placeholder="Anotacions de les qüestions i respostes de l'estudiant durant la defensa..."
                    />
                  </div>
                </div>
              )}

              {/* Tab 5: Escriptura Comú i Notes (Avaluador only) */}
              {activeTab === 'comu' && activeTfm.evaluatorRole === 'avaluador' && (
                <div className="grid grid-cols-1 gap-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 tracking-tight uppercase flex items-center gap-1.5">
                      <ClipboardList size={16} className="text-indigo-600" />
                      <span>Apartat d'escriptura comú i síntesi dels avaluadors</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Espai enriquit col·laboratiu per recopilar les conclusions conjuntes del vídeo, la defensa presencial, i redactar el global de l'acta. Pots posar negretes, enllaços o llistes de punts.
                    </p>
                  </div>

                  <RichTextEditor
                    id="common-rich-notes"
                    value={activeTfm.commonNotes}
                    onChange={(updated) => {
                      updateActiveTfm((prev) => ({ ...prev, commonNotes: updated }));
                    }}
                    placeholder="Escriu les teves notes finals d'escriptura per a l'acta, incloent recomanacions, justificacions de l'Excel·lent o àrees transversals de millora..."
                    label="ACTA RESUM DE DEFENSES"
                  />
                  
                  <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">💡 Guia d'escriptura recomanada per a l'avaludador/a:</h4>
                    <ul className="list-disc pl-5 text-xs text-slate-600 mt-2 flex flex-col gap-1.5 leading-relaxed">
                      <li><strong>Síntesi del treball escrit:</strong> Destaca breument l'aportació del TFM al context educatiu (metodologia de la pregunta).</li>
                      <li><strong>Valoració de la comunicació:</strong> Concreta si l'estudiant sintetitza bé el seu missatge en l'espai del vídeo.</li>
                      <li><strong>Claredat i qualitat de respostes:</strong> Comenta l'oratòria durant la ronda presencial síncrona de preguntes.</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Tab 6: Summary Scores and Copy Report Acta (Both roles) */}
              {activeTab === 'summary' && (
                <EvaluationSummary tfm={activeTfm} />
              )}

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 bg-white border border-slate-200 rounded-2xl text-center min-h-[380px]">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
                <BookOpen size={30} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">No hi ha cap TFM seleccionat</h3>
              <p className="text-slate-500 text-sm mt-1.5 max-w-sm">
                Selecciona un estudiant existent a la barra lateral o crea'n un de nou per començar amb les rúbriques d'avaluació.
              </p>
              
              <button
                id="select-mock-fallback-btn"
                type="button"
                onClick={() => {
                  setTfms([SAMPLE_TFM]);
                  setActiveTfmId(SAMPLE_TFM.id);
                }}
                className="mt-5 text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl border border-indigo-100 hover:bg-indigo-150 transition-colors"
              >
                Carrega Estudiant d'Exemple (Albert Mallol Miron)
              </button>
            </div>
          )}

        </section>
      </main>

      {/* Visual Workspace footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400/80 text-xs mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col gap-1 text-center md:text-left">
            <span className="font-extrabold text-white text-sm tracking-wide select-none">
              AVALUACIÓ CONJUNTA TFM • UOC
            </span>
            <span>Unió del model del tutor i avaluador extern de la Formació de Professorat 2024.</span>
          </div>

          <div className="flex items-center gap-2 select-none">
            <span className="w-2 h-2 rounded-full bg-emerald-500 block animate-pulse" />
            <span className="text-[11px] text-slate-400">Totalment segregat i emmagatzemat de manera segura a nivell local</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
