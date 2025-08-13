
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Save, Plus, Trash2, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExcelEditorProps {
  isOpen: boolean;
  onClose: () => void;
  file: {
    id: string;
    nome_arquivo: string;
    url_arquivo: string;
    pasta_id: string;
  } | null;
  onFileSaved: () => void;
}

interface CellData {
  [key: string]: any;
}

const ExcelEditor: React.FC<ExcelEditorProps> = ({ isOpen, onClose, file, onFileSaved }) => {
  const { user } = useAuth();
  const [worksheetData, setWorksheetData] = useState<CellData[]>([]);
  const [worksheetHeaders, setWorksheetHeaders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Carregar dados do arquivo Excel
  const loadExcelFile = async () => {
    if (!file) return;

    setIsLoading(true);
    try {
      const response = await fetch(file.url_arquivo);
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Pegar a primeira planilha
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Converter para JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length > 0) {
        const headers = jsonData[0] as string[];
        const data = jsonData.slice(1).map((row: any[], index) => {
          const rowData: CellData = { _id: index };
          headers.forEach((header, colIndex) => {
            rowData[header] = row[colIndex] || '';
          });
          return rowData;
        });
        
        setWorksheetHeaders(headers);
        setWorksheetData(data);
      }
    } catch (error) {
      console.error('Erro ao carregar arquivo Excel:', error);
      toast.error('Erro ao carregar arquivo Excel');
    } finally {
      setIsLoading(false);
    }
  };

  // Salvar alterações no arquivo
  const saveChanges = async () => {
    if (!file || !user) return;

    setIsSaving(true);
    try {
      // Criar novo workbook
      const workbook = XLSX.utils.book_new();
      
      // Preparar dados para salvar
      const dataToSave = [
        worksheetHeaders,
        ...worksheetData.map(row => 
          worksheetHeaders.map(header => row[header] || '')
        )
      ];
      
      // Criar worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(dataToSave);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Planilha1');
      
      // Converter para buffer
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Upload do arquivo atualizado
      const timestamp = Date.now();
      const fileName = `${user.id}/${file.pasta_id}/${timestamp}_${file.nome_arquivo}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('processos-administrativos')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Erro ao fazer upload: ${uploadError.message}`);
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('processos-administrativos')
        .getPublicUrl(fileName);

      // Atualizar registro no banco
      const { error: updateError } = await supabase
        .from('processos_arquivos')
        .update({
          url_arquivo: publicUrl,
          tamanho_arquivo: blob.size,
          updated_at: new Date().toISOString()
        })
        .eq('id', file.id)
        .eq('user_id', user.id);

      if (updateError) {
        throw new Error(`Erro ao atualizar registro: ${updateError.message}`);
      }

      toast.success('Arquivo Excel salvo com sucesso!');
      onFileSaved();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar arquivo:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar arquivo');
    } finally {
      setIsSaving(false);
    }
  };

  // Atualizar célula
  const updateCell = (rowIndex: number, header: string, value: any) => {
    setWorksheetData(prev => 
      prev.map((row, index) => 
        index === rowIndex ? { ...row, [header]: value } : row
      )
    );
  };

  // Adicionar nova linha
  const addRow = () => {
    const newRow: CellData = { _id: worksheetData.length };
    worksheetHeaders.forEach(header => {
      newRow[header] = '';
    });
    setWorksheetData(prev => [...prev, newRow]);
  };

  // Remover linha
  const removeRow = (rowIndex: number) => {
    setWorksheetData(prev => prev.filter((_, index) => index !== rowIndex));
  };

  // Adicionar nova coluna
  const addColumn = () => {
    const newHeader = `Coluna ${worksheetHeaders.length + 1}`;
    setWorksheetHeaders(prev => [...prev, newHeader]);
    setWorksheetData(prev => 
      prev.map(row => ({ ...row, [newHeader]: '' }))
    );
  };

  // Baixar arquivo atual
  const downloadFile = () => {
    if (file) {
      window.open(file.url_arquivo, '_blank');
    }
  };

  useEffect(() => {
    if (isOpen && file) {
      loadExcelFile();
    }
  }, [isOpen, file]);

  if (!file) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Editar Excel: {file.nome_arquivo}</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadFile}
                title="Baixar arquivo original"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={addColumn}
                disabled={isLoading}
              >
                <Plus className="h-4 w-4 mr-1" />
                Coluna
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={addRow}
                disabled={isLoading}
              >
                <Plus className="h-4 w-4 mr-1" />
                Linha
              </Button>
              <Button
                onClick={saveChanges}
                disabled={isSaving || isLoading}
                className="bg-teal-600 hover:bg-teal-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto border rounded-lg">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <p>Carregando arquivo Excel...</p>
            </div>
          ) : worksheetData.length === 0 ? (
            <div className="flex items-center justify-center h-48">
              <p>Nenhum dado encontrado no arquivo</p>
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="min-w-full border-collapse">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="border border-gray-300 px-2 py-1 text-left text-xs font-medium w-12">
                      #
                    </th>
                    {worksheetHeaders.map((header, index) => (
                      <th key={index} className="border border-gray-300 px-2 py-1 text-left text-xs font-medium min-w-32">
                        <Input
                          value={header}
                          onChange={(e) => {
                            const newHeaders = [...worksheetHeaders];
                            const oldHeader = newHeaders[index];
                            newHeaders[index] = e.target.value;
                            setWorksheetHeaders(newHeaders);
                            // Atualizar dados com novo nome da coluna
                            setWorksheetData(prev => 
                              prev.map(row => {
                                const newRow = { ...row };
                                if (oldHeader !== e.target.value) {
                                  newRow[e.target.value] = newRow[oldHeader];
                                  delete newRow[oldHeader];
                                }
                                return newRow;
                              })
                            );
                          }}
                          className="h-6 text-xs border-0 bg-transparent p-0 font-medium"
                        />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {worksheetData.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-2 py-1 text-center text-xs bg-gray-50">
                        <div className="flex items-center justify-center gap-1">
                          <span>{rowIndex + 1}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRow(rowIndex)}
                            className="h-5 w-5 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                      {worksheetHeaders.map((header, colIndex) => (
                        <td key={colIndex} className="border border-gray-300 p-0">
                          <Input
                            value={row[header] || ''}
                            onChange={(e) => updateCell(rowIndex, header, e.target.value)}
                            className="h-8 text-xs border-0 rounded-none"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExcelEditor;
