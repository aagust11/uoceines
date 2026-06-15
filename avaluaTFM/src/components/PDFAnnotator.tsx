/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  FileUp, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  MapPin, 
  Highlighter, 
  PenTool, 
  Type, 
  Check, 
  X, 
  HelpCircle, 
  AlertTriangle, 
  Star, 
  MessageSquare,
  Undo2,
  ListCollapse,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { PDFAnnotation } from '../types';

interface PDFAnnotatorProps {
  tfmId: string;
  pdfFileName: string | null;
  annotations: PDFAnnotation[];
  onSaveAnnotations: (annotations: PDFAnnotation[]) => void;
  onUploadPdf: (blob: Blob, name: string) => void;
  onRemovePdf: () => void;
  pdfBlob: Blob | null;
  generalComments?: string;
  onSaveGeneralComments?: (comments: string) => void;
  isStandalone?: boolean;
}

export default function PDFAnnotator({
  tfmId,
  pdfFileName,
  annotations,
  onSaveAnnotations,
  onUploadPdf,
  onRemovePdf,
  pdfBlob,
  generalComments = '',
  onSaveGeneralComments,
  isStandalone = false
}: PDFAnnotatorProps) {
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(1.1);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  // SpeedGrader toolbar tool state
  // 'select' = normal navigation/view, 'pin' = add markers, 'highlight' = draw rectangle highlights, 'draw' = brush / freehand drawing, 'text' = add labels
  const [activeTool, setActiveTool] = useState<'select' | 'pin' | 'highlight' | 'draw' | 'text'>('select');
  const [activeColor, setActiveColor] = useState<string>('#ef4444'); // Red standard
  const [activeIcon, setActiveIcon] = useState<string>('comment'); // comment, check, close, star, question

  // Freehand / Drag highlights drawing transient states
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [drawPoints, setDrawPoints] = useState<{ x: number; y: number }[]>([]);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null);

  // Sidebar controls
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [editingAnnotationId, setEditingAnnotationId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState<string>('');

  // Floating comments box state and dragging utilities
  const [showFloatingComments, setShowFloatingComments] = useState<boolean>(true);
  const [floatingPosition, setFloatingPosition] = useState<{ x: number; y: number }>({ x: 25, y: 150 });
  const [isDraggingComments, setIsDraggingComments] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // only left click
    setIsDraggingComments(true);
    const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  useEffect(() => {
    if (!isDraggingComments) return;

    const handleMouseMove = (mouseEvent: MouseEvent) => {
      let newX = mouseEvent.clientX - dragOffset.x;
      let newY = mouseEvent.clientY - dragOffset.y;

      // Restrict positioning boundaries safely
      newX = Math.max(10, Math.min(window.innerWidth - 320, newX));
      newY = Math.max(10, Math.min(window.innerHeight - 250, newY));

      setFloatingPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDraggingComments(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingComments, dragOffset]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // 1. Load PDF document
  useEffect(() => {
    if (!pdfBlob) {
      setPdfDoc(null);
      setNumPages(0);
      setCurrentPage(1);
      return;
    }

    let isMounted = true;
    const loadPdf = async () => {
      try {
        setRenderError(null);
        // Load dynamically to prevent any initialization or worker conflicts inside Vite SSR/bundling
        const pdfjsLib = await import('pdfjs-dist');
        const version = pdfjsLib.version || '6.0.227';
        // Configure jsDelivr (the real-time CDN mirror for NPM packages) to serve the modern .min.mjs worker of version 6
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;

        const arrayBuffer = await pdfBlob.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        if (isMounted) {
          setPdfDoc(pdf);
          setNumPages(pdf.numPages);
          setCurrentPage(1);
        }
      } catch (err: any) {
        console.error('Error carregant el PDF en pdfjs:', err);
        if (isMounted) {
          setRenderError(`No s'ha pogut renderitzar el llibre/PDF de forma interactiva: ${err.message || err}`);
        }
      }
    };

    loadPdf();

    return () => {
      isMounted = false;
    };
  }, [pdfBlob]);

  // 2. Render Page to Canvas
  const renderPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) return;

    try {
      setIsRendering(true);
      const page = await pdfDoc.getPage(currentPage);
      const viewport = page.getViewport({ scale: zoom });

      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;

      canvas.height = viewport.height;
      canvas.width = viewport.width;
      setContainerSize({ width: viewport.width, height: viewport.height });

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;
      setIsRendering(false);
    } catch (err: any) {
      console.error('Error renderitzant la pàgina del PDF:', err);
      setIsRendering(false);
    }
  }, [pdfDoc, currentPage, zoom]);

  useEffect(() => {
    renderPage();
  }, [renderPage]);

  // 3. Coordinate translation helper to percentages
  const getRelativeCoords = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    return { x, y };
  };

  // 4. Handle Actions on Canvas Overlay
  const handleOverlayMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool === 'select') return;
    const coords = getRelativeCoords(e);

    if (activeTool === 'pin') {
      // Create new colored pin with comment placeholder
      const newAnn: PDFAnnotation = {
        id: `ann-${Date.now()}`,
        type: 'pin',
        pageNumber: currentPage,
        x: coords.x,
        y: coords.y,
        color: activeColor,
        icon: activeIcon,
        text: '',
        createdAt: new Date().toISOString()
      };
      
      const updated = [...annotations, newAnn];
      onSaveAnnotations(updated);
      setEditingAnnotationId(newAnn.id);
      setEditCommentText('');
      // Reset back to select after adding to allow typing feedback easily
      setActiveTool('select');
    } else if (activeTool === 'text') {
      // Create a floating text label
      const newAnn: PDFAnnotation = {
        id: `ann-${Date.now()}`,
        type: 'text',
        pageNumber: currentPage,
        x: coords.x,
        y: coords.y,
        color: activeColor,
        text: 'Nova anotació de text',
        createdAt: new Date().toISOString()
      };

      const updated = [...annotations, newAnn];
      onSaveAnnotations(updated);
      setEditingAnnotationId(newAnn.id);
      setEditCommentText('Nova anotació de text');
      setActiveTool('select');
    } else if (activeTool === 'draw') {
      setIsDrawing(true);
      setDrawPoints([coords]);
    } else if (activeTool === 'highlight') {
      setIsDrawing(true);
      setDragStart(coords);
      setDragCurrent(coords);
    }
  };

  const handleOverlayMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing) return;
    const coords = getRelativeCoords(e);

    if (activeTool === 'draw') {
      setDrawPoints((prev) => [...prev, coords]);
    } else if (activeTool === 'highlight' && dragStart) {
      setDragCurrent(coords);
    }
  };

  const handleOverlayMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (activeTool === 'draw' && drawPoints.length > 1) {
      const newAnn: PDFAnnotation = {
        id: `ann-${Date.now()}`,
        type: 'draw',
        pageNumber: currentPage,
        x: 0,
        y: 0,
        color: activeColor,
        points: drawPoints,
        createdAt: new Date().toISOString()
      };

      onSaveAnnotations([...annotations, newAnn]);
      setDrawPoints([]);
    } else if (activeTool === 'highlight' && dragStart && dragCurrent) {
      const left = Math.min(dragStart.x, dragCurrent.x);
      const top = Math.min(dragStart.y, dragCurrent.y);
      const width = Math.abs(dragStart.x - dragCurrent.x);
      const height = Math.abs(dragStart.y - dragCurrent.y);

      // Save highlight if it has reasonable size
      if (width > 0.5 && height > 0.5) {
        const newAnn: PDFAnnotation = {
          id: `ann-${Date.now()}`,
          type: 'highlight',
          pageNumber: currentPage,
          x: left,
          y: top,
          width,
          height,
          color: activeColor,
          createdAt: new Date().toISOString()
        };

        onSaveAnnotations([...annotations, newAnn]);
      }
      setDragStart(null);
      setDragCurrent(null);
    }
  };

  // 5. File upload handler
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      onUploadPdf(file, file.name);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === 'application/pdf') {
      onUploadPdf(file, file.name);
    }
  };

  // 6. Delete annotation
  const handleDeleteAnnotation = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const filtered = annotations.filter((ann) => ann.id !== id);
    onSaveAnnotations(filtered);
    if (editingAnnotationId === id) {
      setEditingAnnotationId(null);
    }
  };

  // 7. Save comment changes
  const handleSaveComment = (id: string) => {
    const updated = annotations.map((ann) => {
      if (ann.id === id) {
        return { ...ann, text: editCommentText };
      }
      return ann;
    });
    onSaveAnnotations(updated);
    setEditingAnnotationId(null);
  };

  const handleStartEditing = (ann: PDFAnnotation, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingAnnotationId(ann.id);
    setEditCommentText(ann.text || '');
  };

  // Filters annotations for the current page
  const pageAnnotations = annotations.filter((ann) => ann.pageNumber === currentPage);

  // Group annotations with comments to render in the right sidebar
  const commentedAnnotations = annotations.filter(ann => ann.type === 'pin' || ann.type === 'text');

  // Multi-colored pin icons helper
  const renderIcon = (type: string, color: string, size = 16) => {
    switch (type) {
      case 'check':
        return <Check size={size} style={{ color }} />;
      case 'close':
        return <X size={size} style={{ color }} />;
      case 'star':
        return <Star size={size} fill={color} style={{ color }} />;
      case 'question':
        return <HelpCircle size={size} style={{ color }} />;
      case 'comment':
      default:
        return <MessageSquare size={size} style={{ color }} />;
    }
  };

  const colors = [
    { name: 'Vermell', hex: '#ef4444' },
    { name: 'Verd', hex: '#10b981' },
    { name: 'Blau', hex: '#3b82f6' },
    { name: 'Groc', hex: '#f59e0b' },
    { name: 'Lila', hex: '#8b5cf6' },
  ];

  const tools = [
    { id: 'select', label: 'Navegar', icon: <Maximize size={15} /> },
    { id: 'pin', label: 'Comentari', icon: <MapPin size={15} /> },
    { id: 'highlight', label: 'Subratllar', icon: <Highlighter size={15} /> },
    { id: 'draw', label: 'Dibuix Lliure', icon: <PenTool size={15} /> },
    { id: 'text', label: 'Text Flotant', icon: <Type size={15} /> },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-xs flex flex-col gap-4">
      {/* PDF Header controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 text-[15px] leading-tight flex items-center gap-1.5">
              SpeedGrader Interactiu UOC
            </h3>
            <p className="text-xs text-slate-500 font-medium leading-none">
              {pdfFileName ? `📂 Document vinculat: ${pdfFileName}` : 'Anoteu directament sobre la feina de l\'estudiant'}
            </p>
          </div>
        </div>

        {pdfFileName && (
          <button
            type="button"
            onClick={onRemovePdf}
            className="text-[11px] font-bold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 px-3 py-1.5 rounded-xl transition-all self-end sm:self-auto flex items-center gap-1"
            title="Desvincula el fitxer PDF"
          >
            <Trash2 size={13} />
            <span>Desvincula PDF</span>
          </button>
        )}
      </div>

      {!pdfBlob ? (
        /* Upload UI */
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/5 rounded-2xl p-8 py-12 transition-all flex flex-col items-center justify-center text-center cursor-pointer group"
          onClick={() => document.getElementById('pdf-file-upload')?.click()}
        >
          <input
            id="pdf-file-upload"
            type="file"
            accept="application/pdf"
            onChange={handleFileInputChange}
            className="hidden"
          />
          <div className="p-4 bg-white shadow-xs rounded-2xl border border-slate-200/80 mb-4 group-hover:scale-105 transition-transform text-slate-400 group-hover:text-indigo-600">
            <FileUp size={28} />
          </div>
          <span className="text-sm font-extrabold text-slate-800 mb-1">
            Penja o arrossega el TFM de l'alumne
          </span>
          <span className="text-xs text-slate-500 font-medium max-w-sm mb-4">
            El fitxer PDF quedarà vinculat a aquest alumne i es desarà localment o dins del vostre directori de treball. No s'envia a cap servidor extern.
          </span>
          <span className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer">
            Selecciona el fitxer PDF
          </span>
        </div>
      ) : (
        /* SpeedGrader Visual Workspace Wrapper */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch min-h-[550px]" id="speedgrader-panel">
          
          {/* Main Workspace Column */}
          <div className="lg:col-span-8 flex flex-col gap-3 min-w-0">
            
            {/* Context Toolbar */}
            <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl flex flex-wrap items-center justify-between gap-3">
              
              {/* Pagination controls */}
              <div className="flex items-center gap-1.5 select-none bg-white border border-slate-200 rounded-lg p-0.5">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-bold text-slate-700 px-1 text-center min-w-[75px]">
                  {currentPage} / {numPages || '?'}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= numPages}
                  onClick={() => setCurrentPage(prev => Math.min(numPages, prev + 1))}
                  className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Tools list */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider select-none hidden sm:inline">Eines:</span>
                <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs gap-0.5">
                  {tools.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setActiveTool(t.id as any);
                        setEditingAnnotationId(null);
                      }}
                      className={`px-2 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        activeTool === t.id
                          ? 'bg-indigo-600 text-white shadow-3xs'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                      title={t.label}
                    >
                      {t.icon}
                      <span className="hidden xl:inline">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color list and extra utilities */}
              <div className="flex items-center gap-2">
                {activeTool !== 'select' && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase select-none hidden sm:inline">Color:</span>
                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
                      {colors.map((c) => (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => setActiveColor(c.hex)}
                          className={`w-4 h-4 rounded-full transition-all border ${
                            activeColor === c.hex
                              ? 'ring-2 ring-slate-400/85 scale-110 border-white'
                              : 'border-transparent hover:scale-105'
                          }`}
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Pin specific icons preview */}
                {activeTool === 'pin' && (
                  <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 gap-0.5">
                    {['comment', 'check', 'close', 'star', 'question'].map((ic) => (
                      <button
                        key={ic}
                        type="button"
                        onClick={() => setActiveIcon(ic)}
                        className={`p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer ${
                          activeIcon === ic ? 'bg-slate-100 ring-1 ring-slate-300' : ''
                        }`}
                        title={`Pin: ${ic}`}
                      >
                        {renderIcon(ic, activeColor, 13)}
                      </button>
                    ))}
                  </div>
                )}

                {/* Zoom tools */}
                <div className="flex items-center gap-0.5 bg-white border border-slate-200 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => setZoom(z => Math.max(0.6, z - 0.1))}
                    className="p-1 rounded hover:bg-slate-100 text-slate-600"
                    title="Allunya"
                  >
                    <ZoomOut size={14} />
                  </button>
                  <span className="text-[10px] font-bold text-slate-600 px-1 select-none w-10 text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoom(z => Math.min(2.5, z + 0.1))}
                    className="p-1 rounded hover:bg-slate-100 text-slate-600"
                    title="Apropa"
                  >
                    <ZoomIn size={14} />
                  </button>
                </div>

                {/* Independent window opening & floating comments toggling */}
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => setShowFloatingComments(prev => !prev)}
                    className={`p-1 shadow-3xs rounded-md text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      showFloatingComments
                        ? 'bg-amber-100 text-amber-800 font-extrabold ring-1 ring-amber-200'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                    title={showFloatingComments ? "Amaga els comentaris generals" : "Mostra comentari general flotant"}
                  >
                    <MessageSquare size={13} className={showFloatingComments ? "text-amber-600 animate-pulse" : "text-slate-500"} />
                    <span className="hidden md:inline">Notes</span>
                  </button>

                  {!isStandalone && (
                    <button
                      type="button"
                      onClick={() => {
                        const url = `${window.location.origin}${window.location.pathname}?speedgrader=true&tfmId=${tfmId}`;
                        window.open(url, '_blank', 'noopener,noreferrer');
                      }}
                      className="p-1 rounded-md text-xs font-bold text-indigo-700 hover:bg-slate-50 transition-all flex items-center gap-1 cursor-pointer border border-slate-100"
                      title="Obre l'SpeedGrader en una finestra independent i pantalla completa"
                    >
                      <ExternalLink size={13} />
                      <span className="hidden md:inline font-bold">Pantalla Completa</span>
                    </button>
                  )}

                  {isStandalone && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Voleu tancar aquesta finestra de SpeedGrader? Tots els canvis estan sincronitzats.')) {
                          window.close();
                        }
                      }}
                      className="p-1 rounded-md text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-700 transition-all flex items-center gap-1 cursor-pointer"
                      title="Tanca aquesta pestanya"
                    >
                      <X size={13} />
                      <span>Tanca</span>
                    </button>
                  )}
                </div>

              </div>
            </div>

            {/* Error loading PDF warning */}
            {renderError && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertTriangle size={15} />
                <span>{renderError}</span>
              </div>
            )}

            {/* PDF Viewport Area */}
            <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 overflow-auto flex items-start justify-center max-h-[700px] shadow-inner relative">
              {isRendering && (
                <div className="absolute right-4 top-4 bg-slate-900/80 text-[10px] text-white px-2 py-1 rounded-md font-semibold font-mono animate-pulse select-none z-30">
                  REFRESCANT DOCUMENT...
                </div>
              )}

              {/* Central canvas package container */}
              <div 
                ref={containerRef}
                className="relative bg-white shadow-lg border border-slate-300 rounded-sm select-none"
                style={{
                  width: containerSize.width || 'auto',
                  height: containerSize.height || 'auto'
                }}
              >
                {/* PDF Page Canvas */}
                <canvas ref={canvasRef} className="block pointer-events-none" />

                {/* SVG & HTML Interactive Annotation Layer overlay */}
                <div
                  className={`absolute inset-0 z-20 overflow-hidden ${
                    activeTool !== 'select' ? 'cursor-crosshair' : 'cursor-default'
                  }`}
                  onMouseDown={handleOverlayMouseDown}
                  onMouseMove={handleOverlayMouseMove}
                  onMouseUp={handleOverlayMouseUp}
                >
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    {/* Render Page highlights */}
                    {pageAnnotations
                      .filter((ann) => ann.type === 'highlight')
                      .map((ann) => (
                        <rect
                          key={ann.id}
                          x={`${ann.x}%`}
                          y={`${ann.y}%`}
                          width={`${ann.width}%`}
                          height={`${ann.height}%`}
                          fill={ann.color}
                          fillOpacity={0.25}
                          stroke={ann.color}
                          strokeWidth={1.5}
                          className="transition-all"
                        />
                    ))}

                    {/* Render Page brush freehand drawings */}
                    {pageAnnotations
                      .filter((ann) => ann.type === 'draw' && ann.points && ann.points.length > 0)
                      .map((ann) => {
                        const pathData = ann.points!
                          .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x}% ${pt.y}%`)
                          .join(' ');
                        return (
                          <path
                            key={ann.id}
                            d={pathData}
                            fill="none"
                            stroke={ann.color}
                            strokeWidth={3}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        );
                    })}

                    {/* Rendering temporary freehand brush line in-progress */}
                    {isDrawing && activeTool === 'draw' && drawPoints.length > 1 && (
                      <path
                        d={drawPoints
                          .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x}% ${pt.y}%`)
                          .join(' ')}
                        fill="none"
                        stroke={activeColor}
                        strokeWidth={3}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {/* Drawing temporary highlight box preview */}
                    {isDrawing && activeTool === 'highlight' && dragStart && dragCurrent && (
                      <rect
                        x={`${Math.min(dragStart.x, dragCurrent.x)}%`}
                        y={`${Math.min(dragStart.y, dragCurrent.y)}%`}
                        width={`${Math.abs(dragStart.x - dragCurrent.x)}%`}
                        height={`${Math.abs(dragStart.y - dragCurrent.y)}%`}
                        fill={activeColor}
                        fillOpacity={0.2}
                        stroke={activeColor}
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                      />
                    )}
                  </svg>

                  {/* HTML Absolutely Rendered pins & editable notes */}
                  {pageAnnotations
                    .filter((ann) => ann.type === 'pin' || ann.type === 'text')
                    .map((ann) => {
                      const isEditing = editingAnnotationId === ann.id;
                      const isPin = ann.type === 'pin';

                      return (
                        <div
                          key={ann.id}
                          style={{
                            left: `${ann.x}%`,
                            top: `${ann.y}%`,
                            transform: isPin ? 'translate(-50%, -100%)' : 'translate(-50%, -50%)',
                          }}
                          className="absolute z-35 flex flex-col items-center pointer-events-auto"
                        >
                          {isPin ? (
                            /* Pins marker */
                            <button
                              type="button"
                              onClick={(e) => {
                                handleStartEditing(ann, e);
                              }}
                              style={{ borderColor: ann.color }}
                              className="w-8 h-8 rounded-full bg-white border-2 shadow-md flex items-center justify-center hover:scale-115 transition-transform active:scale-95"
                            >
                              {renderIcon(ann.icon || 'comment', ann.color, 15)}
                            </button>
                          ) : (
                            /* Floating Text notes */
                            <div
                              onClick={(e) => handleStartEditing(ann, e)}
                              style={{ borderLeftColor: ann.color }}
                              className="px-3 py-1.5 bg-white/95 border-l-4 rounded-r-lg shadow-sm font-sans font-bold text-slate-800 text-[11px] whitespace-nowrap hover:scale-105 transition-all hover:bg-white"
                            >
                              {ann.text || '...'}
                            </div>
                          )}

                          {/* Float editable card comments beside the item */}
                          {isEditing && (
                            <div 
                              className="absolute left-1/2 bottom-full mb-2 bg-slate-900 text-white rounded-xl shadow-xl p-3 z-40 w-64 -translate-x-1/2 text-left pointer-events-auto"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center justify-between gap-1 mb-1.5 border-b border-slate-750 pb-1.5">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                  {isPin ? 'Escriu el Comentari' : 'Modifica el text'}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteAnnotation(ann.id, e)}
                                  className="text-slate-400 hover:text-rose-400 transition-colors"
                                  title="Elimina anotació"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                              <textarea
                                required
                                rows={2}
                                value={editCommentText}
                                onChange={(e) => setEditCommentText(e.target.value)}
                                className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg p-1.5 text-white focus:outline-hidden focus:border-indigo-400 resize-none font-sans font-normal"
                                placeholder={isPin ? "Escriviu comentari del SpeedGrader..." : "Escriviu l'anotació..."}
                                autoFocus
                              />
                              <div className="flex justify-end gap-1.5 mt-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingAnnotationId(null)}
                                  className="text-[10px] text-slate-400 hover:text-white font-bold"
                                >
                                  Tanca
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveComment(ann.id)}
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm"
                                >
                                  Desa
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                  })}
                </div>

              </div>
            </div>

            {/* Hint details */}
            <div className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200/85 p-3 rounded-xl flex items-center gap-2">
              <span className="font-extrabold text-slate-700 select-none">💡 Consell SpeedGrader:</span>
              <span>Per afegir un pin, seleccioneu l'eina "Comentari" i feu clic a qualsevol punt del text per enganxar un aclariment de color i desar-lo.</span>
            </div>

          </div>

          {/* Right Sidebar of annotations/comments column */}
          <div className="lg:col-span-4 flex flex-col gap-3 min-w-0">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3 h-full max-h-[770px] overflow-auto">
              
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 select-none">
                  📋 Comentaris de la Rúbrica ({commentedAnnotations.length})
                </span>
                <span className="text-[10px] bg-indigo-105 text-indigo-700 px-2 py-0.5 rounded-full font-bold select-none">
                  SpeedGrader
                </span>
              </div>

              {commentedAnnotations.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400 italic">
                  <MessageSquare size={24} className="stroke-[1.5] mb-2 text-slate-350" />
                  <p className="text-xs">No hi ha comentaris contextuals.</p>
                  <p className="text-[10px] mt-1 max-w-xs">Feu servir l'eina "Comentari" o "Text" a l'esquerra per assenyalar millores.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5 overflow-y-auto flex-1 pr-1">
                  {commentedAnnotations
                    .sort((a, b) => a.pageNumber - b.pageNumber)
                    .map((ann) => {
                      const isCurrentPage = ann.pageNumber === currentPage;
                      return (
                        <div
                          key={ann.id}
                          onClick={() => setCurrentPage(ann.pageNumber)}
                          className={`group p-3 rounded-xl border transition-all text-left cursor-pointer ${
                            isCurrentPage
                              ? 'bg-indigo-50/60 border-indigo-200 shadow-3xs'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="text-[10px] font-extrabold font-mono text-slate-400 flex items-center gap-1">
                              PÀG. {ann.pageNumber}
                              {isCurrentPage && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />}
                            </span>
                            <div className="flex items-center gap-1">
                              <span
                                className="w-2.5 h-2.5 rounded-full border border-black/5"
                                style={{ backgroundColor: ann.color }}
                              />
                              <button
                                type="button"
                                onClick={(e) => handleDeleteAnnotation(ann.id, e)}
                                className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-rose-600 rounded transition-opacity"
                                title="Elimina comentari"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>

                          <p className="text-xs text-slate-700 leading-relaxed font-medium break-all">
                            {ann.text ? ann.text : <span className="text-slate-400 italic">Sense descripció formatada...</span>}
                          </p>

                          <div className="flex items-center justify-end gap-1.5 mt-2 pt-2 border-t border-slate-100 opacity-80 text-[10px] font-bold text-slate-500">
                            <button
                              type="button"
                              onClick={(e) => handleStartEditing(ann, e)}
                              className="hover:text-indigo-600 transition-colors"
                            >
                              Edita comentari
                            </button>
                          </div>
                        </div>
                      );
                  })}
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 text-[10px] text-slate-400 leading-normal">
                Els comentaris i pins s'emmagatzeman en el fitxer de dades conjunt, de manera que quan s'exporta i s'importa, tot el panell d'anotacions del SpeedGrader es manté perfectament intacte.
              </div>

            </div>
          </div>

        </div>
      )}

      {/* DRAGGABLE, RESIZABLE FLOATING GENERAL COMMENTS PANEL FOR SPEEDGRADER */}
      {pdfFileName && showFloatingComments && (
        <div
          id="speedgrader-floating-comments"
          style={{
            position: 'fixed',
            left: `${floatingPosition.x}px`,
            top: `${floatingPosition.y}px`,
            zIndex: 9999,
          }}
          className="bg-white border-2 border-indigo-600 rounded-2xl shadow-2xl w-80 md:w-96 flex flex-col pointer-events-auto filter drop-shadow-md overflow-hidden select-none"
        >
          {/* Draggable Header Handlebar */}
          <div
            onMouseDown={handleMouseDown}
            className="bg-indigo-600 text-white px-3.5 py-2.5 text-xs font-black uppercase tracking-widest flex items-center justify-between cursor-move select-none"
          >
            <div className="flex items-center gap-1.5">
              <Sparkles size={13} className="text-amber-300 animate-pulse" />
              <span>📝 Comentaris Generals</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-indigo-200 bg-indigo-700/50 px-1.5 py-0.5 rounded font-bold">
                Mòbil
              </span>
              <button
                type="button"
                onClick={() => setShowFloatingComments(false)}
                className="text-white hover:bg-rose-600 px-1.5 py-0.5 rounded transition-colors duration-100 text-[10px] uppercase font-black"
                title="Tanca o amaga els comentaris flotants"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Internal resizable body */}
          <div className="p-3.5 bg-slate-50 flex flex-col gap-2.5">
            <textarea
              id="floating-general-comments-textarea"
              value={generalComments}
              onChange={(e) => {
                if (onSaveGeneralComments) {
                  onSaveGeneralComments(e.target.value);
                }
              }}
              placeholder="Escriu aquí notes generals de l'alumne durant l'avaluació de la feina escrita..."
              style={{ resize: 'both' }}
              className="w-full h-36 md:h-48 text-xs p-3 font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-xs"
            />
            <div className="flex items-center justify-between text-[9px] text-slate-400 font-extrabold tracking-wide">
              <span>🔀 Estireu la cantonada per redimensionar</span>
              <span className="text-emerald-555">✓ Sincronitzat en directe</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
