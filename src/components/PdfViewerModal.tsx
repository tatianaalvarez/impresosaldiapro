import React from 'react';
import { X, FileText, Download, ExternalLink } from 'lucide-react';

interface PdfViewerModalProps {
  onClose: () => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({ onClose }) => {
  const pdfUrl = '/assets/aistudio/Plataforma_de_Caja_Menor_946a3559.pdf';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl max-w-4xl w-full h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white">
                Documento de Requerimientos y Prompt Técnico (PDF Oficial)
              </h3>
              <p className="text-xs text-slate-400">
                Plataforma de Gestión de Caja Menor - Impresos El Día S.A.S. (Medellín, Antioquia)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={pdfUrl}
              download="Plataforma_de_Caja_Menor_Impresos_El_Dia.pdf"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar PDF</span>
            </a>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF viewer iframe */}
        <div className="flex-1 bg-slate-950 p-2">
          <iframe
            src={`${pdfUrl}#toolbar=1`}
            title="Documento de Requerimientos Oficial"
            className="w-full h-full rounded-xl border border-slate-800"
          />
        </div>
      </div>
    </div>
  );
};
