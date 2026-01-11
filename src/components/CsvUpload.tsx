'use client';
import { useState } from 'react';
import Papa from 'papaparse';

export default function CsvUpload() {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const response = await fetch('/api/users/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ leads: results.data }),
          });

          if (response.ok) {
            alert('Caricamento completato con successo!');
            window.location.reload();
          }
        } catch (error) {
          console.error("Errore upload:", error);
          alert('Errore durante il caricamento');
        } finally {
          setUploading(false);
        }
      }
    });
  };

  return (
    <div className="p-6 border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-900/50">
      <h3 className="text-lg font-semibold mb-4 text-white">Importazione Massiva CSV</h3>
      <p className="text-sm text-zinc-400 mb-6">
        Il file deve avere le intestazioni: <code className="text-amber-500">email, full_name, industry, notes</code>
      </p>
      
      <label className="cursor-pointer bg-white text-black px-6 py-3 rounded-lg font-medium hover:bg-zinc-200 transition-colors">
        {uploading ? 'Caricamento in corso...' : 'Seleziona File CSV'}
        <input 
          type="file" 
          accept=".csv" 
          className="hidden" 
          onChange={handleFileUpload}
          disabled={uploading}
        />
      </label>
    </div>
  );
}