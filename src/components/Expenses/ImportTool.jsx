import React, { useState } from 'react';
import Papa from 'papaparse';
import { Upload, FileText, Check, AlertCircle, X } from 'lucide-react';
import { useExpenses } from '../../context/ExpenseContext';
import { toast } from 'react-hot-toast';

const ImportTool = ({ onComplete }) => {
  const { addExpense } = useExpenses();
  const [file, setFile] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setLoading(true);
      
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setData(results.data);
          setLoading(false);
          toast.success(`${results.data.length} filas detectadas`);
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
          toast.error('Error al leer el archivo');
          setLoading(false);
        }
      });
    }
  };

  const handleImport = async () => {
    if (data.length === 0) return;
    setLoading(true);
    let successCount = 0;
    
    // Identificar columnas comunes (mapeo básico automático)
    const findCol = (names) => {
      const keys = Object.keys(data[0]);
      return keys.find(k => names.some(n => k.toLowerCase().includes(n.toLowerCase())));
    };

    const dateCol = findCol(['fecha', 'date', 'day']);
    const amountCol = findCol(['monto', 'amount', 'valor', 'total']);
    const descCol = findCol(['descripcion', 'description', 'detalle', 'glosa']);
    const catCol = findCol(['categoria', 'category']);

    if (!amountCol) {
      toast.error('No se encontró columna de "Monto"');
      setLoading(false);
      return;
    }

    toast.loading(`Importando ${data.length} registros...`, { id: 'import' });

    for (const row of data) {
      try {
        const amount = parseFloat(row[amountCol]?.toString().replace(/[$.]/g, '').replace(',', '.')) || 0;
        if (amount === 0) continue;

        const dateStr = row[dateCol] || new Date().toISOString().split('T')[0];
        // Intentar normalizar fecha básica YYYY-MM-DD
        let date = dateStr;
        if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            date = parts.length === 3 ? `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}` : dateStr;
        }

        await addExpense({
          amount,
          description: row[descCol] || 'Importado',
          category: row[catCol] || 'Financiero',
          date: date,
        });
        successCount++;
      } catch (e) {
        console.error('Error importando fila:', e);
      }
    }

    toast.dismiss('import');
    toast.success(`${successCount} gastos importados exitosamente`);
    setLoading(false);
    onComplete();
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-2">
          <Upload size={18} className="text-indigo-500" />
          Importar desde CSV
        </h3>
        <button onClick={onComplete} className="text-slate-400 hover:text-slate-600">
          <X size={18} />
        </button>
      </div>

      {!file ? (
        <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl hover:border-indigo-500/50 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all cursor-pointer group">
          <FileText size={32} className="text-slate-400 group-hover:text-indigo-500 mb-2" />
          <span className="text-xs font-bold text-slate-500">Haz clic para buscar archivo CSV</span>
          <p className="text-[10px] text-slate-400 mt-1">Formato: Fecha, Monto, Descripción</p>
          <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
        </label>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-lg">
              <Check size={16} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{file.name}</p>
              <p className="text-[10px] text-slate-400">{data.length} filas listas</p>
            </div>
            <button onClick={() => setFile(null)} className="text-slate-400 hover:text-rose-500 p-1">
              <X size={16} />
            </button>
          </div>

          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-3 rounded-xl flex gap-3">
            <AlertCircle size={16} className="text-amber-500 shrink-0" />
            <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
              Asegúrate de que las columnas tengan nombres descriptivos como "Monto", "Fecha" y "Descripción".
            </p>
          </div>

          <button
            onClick={handleImport}
            disabled={loading}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-lg shadow-indigo-600/10"
          >
            {loading ? 'Procesando...' : 'Confirmar Importación'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ImportTool;
