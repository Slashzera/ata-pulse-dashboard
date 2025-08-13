import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  FolderOpen, 
  Upload, 
  FileText, 
  Download, 
  Trash2, 
  ArrowLeft, 
  Plus,
  Edit,
  FileSpreadsheet,
  FileX,
  Search,
  X,
  ChevronRight,
  Pencil
} from 'lucide-react';
import { exportFoldersToExcel, exportFilesToExcel } from '@/utils/excelExport';
import ExcelEditor from '@/components/ExcelEditor';

interface ProcessFolder {
  id: string;
  nome: string;
  numero_processo?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  parent_id?: string;
}

interface ProcessFile {
  id: string;
  nome_arquivo: string;
  tamanho_arquivo: number;
  url_arquivo: string;
  created_at: string;
  pasta_id: string;
  user_id: string;
  updated_at: string;
}

interface ProcessosAdministrativosProps {
  onBack: () => void;
}

// Função para mesclar PDFs usando pdf-lib
const mergePDFs = async (files: File[]): Promise<Blob> => {
  const { PDFDocument } = await import('pdf-lib');
  
  const mergedPdf = await PDFDocument.create();
  
  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }
  
  const pdfBytes = await mergedPdf.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
};

const ProcessosAdministrativos: React.FC<ProcessosAdministrativosProps> = ({ onBack }) => {
  const { user } = useAuth();
  
  // Verificar se o usuário atual é o Felipe Rodrigues (administrador)
  const isAdmin = user?.email === 'drfeliperodrigues@outlook.com';
  const [folders, setFolders] = useState<ProcessFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<ProcessFolder | null>(null);
  const [folderFiles, setFolderFiles] = useState<ProcessFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newProcessNumber, setNewProcessNumber] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [shouldMergePDFs, setShouldMergePDFs] = useState(false);
  const [mergedFileName, setMergedFileName] = useState('');
  const [editingFolder, setEditingFolder] = useState<ProcessFolder | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editFolderName, setEditFolderName] = useState('');
  const [editProcessNumber, setEditProcessNumber] = useState('');
  const [showExcelEditor, setShowExcelEditor] = useState(false);
  const [selectedExcelFile, setSelectedExcelFile] = useState<ProcessFile | null>(null);
  
  // Estados para filtros de pesquisa
  const [searchTerm, setSearchTerm] = useState('');
  const [fileSearchTerm, setFileSearchTerm] = useState('');

  // Carregar todas as pastas para visualização compartilhada
  const loadFolders = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Carregar todas as pastas para visualização compartilhada
      const { data, error } = await supabase
        .from('processos_pastas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar pastas:', error);
        toast.error('Erro ao carregar pastas');
        return;
      }

      setFolders(data || []);
    } catch (error) {
      console.error('Erro geral ao carregar pastas:', error);
      toast.error('Erro ao carregar pastas');
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar arquivos e subpastas de uma pasta
  const loadFolderFiles = async (folderId: string | null) => {
    setIsLoading(true);
    try {
      // Se folderId for null, estamos na raiz
      if (folderId === null) {
        // Carregar pastas raiz
        const { data: rootFolders, error: rootError } = await supabase
          .from('processos_pastas')
          .select('*')
          .is('parent_id', null)
          .order('created_at', { ascending: false });

        if (rootError) throw rootError;
        
        setFolders(prev => {
          const newFolders = [...prev];
          rootFolders.forEach(folder => {
            const existingIndex = newFolders.findIndex(f => f.id === folder.id);
            if (existingIndex >= 0) {
              newFolders[existingIndex] = folder;
            } else {
              newFolders.push(folder);
            }
          });
          return newFolders;
        });
        setFolderFiles([]);
        return;
      }

      // Carregar arquivos da pasta
      const { data: filesData, error: filesError } = await supabase
        .from('processos_arquivos')
        .select('*')
        .eq('pasta_id', folderId)
        .order('created_at', { ascending: false });

      if (filesError) throw filesError;

      // Carregar subpastas da pasta atual
      const { data: subfoldersData, error: subfoldersError } = await supabase
        .from('processos_pastas')
        .select('*')
        .eq('parent_id', folderId)
        .order('created_at', { ascending: false });

      if (subfoldersError) throw subfoldersError;

      // Atualiza o estado das pastas de forma segura
      setFolders(prevFolders => {
        // Cria um mapa das novas subpastas para fácil acesso
        const newSubfoldersMap = new Map(subfoldersData.map(sf => [sf.id, sf]));
        
        // Remove as subpastas antigas da pasta pai e mantém todas as outras pastas
        const filteredFolders = prevFolders.filter(folder => folder.parent_id !== folderId);
        
        // Adiciona as novas subpastas à lista filtrada
        const updatedFolders = [...filteredFolders, ...subfoldersData];
        
        return updatedFolders;
      });

      setFolderFiles(filesData || []);
    } catch (error) {
      console.error('Erro ao carregar conteúdo da pasta:', error);
      toast.error('Erro ao carregar conteúdo da pasta');
    } finally {
      setIsLoading(false);
    }
  };

  // Estado para controlar o parentId da nova pasta
  const [createFolderParentId, setCreateFolderParentId] = useState<string | null>(null);

  // Criar nova pasta ou subpasta
  const handleCreateFolder = async () => {
    if (!user || !newFolderName.trim()) {
      toast.error('Digite um nome para a pasta');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('processos_pastas')
        .insert([{
          nome: newFolderName.trim(),
          numero_processo: newProcessNumber.trim() || null,
          user_id: user.id,
          parent_id: createFolderParentId
        }])
        .select()
        .single();

      if (error) throw error;

      // Atualizar a lista de pastas com a nova pasta criada
      setFolders(prev => [data, ...prev]);
      setNewFolderName('');
      setNewProcessNumber('');
      setShowCreateDialog(false);
      
      // Recarregar a visualização da pasta correta
      if (createFolderParentId) {
        await loadFolderFiles(createFolderParentId);
      } else {
        await loadFolderFiles(null);
      }
      
      toast.success(createFolderParentId ? 'Subpasta criada com sucesso!' : 'Pasta criada com sucesso!');
    } catch (error) {
      console.error('Erro ao criar pasta:', error);
      toast.error('Erro ao criar pasta');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Obter subpastas de uma pasta
  const getSubfolders = (folderId: string) => {
    return folders.filter(folder => folder.parent_id === folderId);
  };
  
  // Verificar se uma pasta tem subpastas
  const hasSubfolders = (folderId: string) => {
    return folders.some(folder => folder.parent_id === folderId);
  };

  const handleUploadFiles = async () => {
    if (!selectedFiles || !selectedFolder || !user) {
      toast.error('Selecione os arquivos para upload');
      return;
    }

    console.log(`Iniciando upload de ${selectedFiles.length} arquivos`);

    // Validar tipos de arquivo permitidos - incluindo Excel
    const allowedTypes = [
      'application/pdf', 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
      'application/vnd.ms-excel'
    ];
    const invalidFiles = Array.from(selectedFiles).filter(file => !allowedTypes.includes(file.type));
    if (invalidFiles.length > 0) {
      toast.error(`Apenas arquivos PDF e Excel são permitidos. Arquivos inválidos: ${invalidFiles.map(f => f.name).join(', ')}`);
      return;
    }

    // Verificar tamanho dos arquivos (limite de 50MB por arquivo)
    const oversizedFiles = Array.from(selectedFiles).filter(file => file.size > 50 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error(`Arquivos muito grandes (limite 50MB): ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }

    // Separar PDFs de outros arquivos
    const pdfFiles = Array.from(selectedFiles).filter(file => file.type === 'application/pdf');
    const otherFiles = Array.from(selectedFiles).filter(file => file.type !== 'application/pdf');

    setIsLoading(true);

    try {
      // Se há PDFs e merge está ativado
      if (shouldMergePDFs && pdfFiles.length > 1) {
        if (!mergedFileName.trim()) {
          toast.error('Digite um nome para o arquivo mesclado');
          setIsLoading(false);
          return;
        }

        console.log('Mesclando', pdfFiles.length, 'arquivos PDF em um único arquivo');
        
        const mergedBlob = await mergePDFs(pdfFiles as any);
        const finalFileName = mergedFileName.endsWith('.pdf') ? mergedFileName : `${mergedFileName}.pdf`;
        
        // Upload do arquivo mesclado
        const timestamp = Date.now();
        const fileName = `${user.id}/${selectedFolder.id}/${timestamp}_${finalFileName}`;
        
        console.log('Fazendo upload do arquivo mesclado:', fileName);
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('processos-administrativos')
          .upload(fileName, mergedBlob);

        if (uploadError) {
          console.error('Erro no upload do arquivo mesclado:', uploadError);
          throw new Error(`Erro ao fazer upload do arquivo mesclado: ${uploadError.message}`);
        }

        // Obter URL pública do arquivo
        const { data: { publicUrl } } = supabase.storage
          .from('processos-administrativos')
          .getPublicUrl(fileName);

        // Salvar informações do arquivo no banco
        const { data: fileData, error: dbError } = await supabase
          .from('processos_arquivos')
          .insert([{
            pasta_id: selectedFolder.id,
            nome_arquivo: finalFileName,
            tamanho_arquivo: mergedBlob.size,
            url_arquivo: publicUrl,
            user_id: user.id
          }])
          .select()
          .single();

        if (dbError) {
          console.error('Erro ao salvar no banco:', dbError);
          throw new Error(`Erro ao salvar informações do arquivo mesclado: ${dbError.message}`);
        }

        setFolderFiles(prev => [fileData, ...prev]);
        toast.success('Arquivo PDF mesclado e adicionado com sucesso!');
      }

      // Upload individual dos arquivos (PDFs não mesclados + outros arquivos)
      const filesToUpload = shouldMergePDFs && pdfFiles.length > 1 ? otherFiles : Array.from(selectedFiles);
      
      if (filesToUpload.length > 0) {
        console.log('Fazendo upload individual de', filesToUpload.length, 'arquivos');
        const uploadedFiles: ProcessFile[] = [];
        const failedFiles: string[] = [];
        
        for (let i = 0; i < filesToUpload.length; i++) {
          const file = filesToUpload[i];
          console.log(`Processando arquivo ${i + 1}/${filesToUpload.length}:`, file.name);
          
          try {
            // Upload do arquivo para o Supabase Storage
            const timestamp = Date.now();
            const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const fileName = `${user.id}/${selectedFolder.id}/${timestamp}_${safeFileName}`;
            
            console.log('Fazendo upload para:', fileName);
            
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('processos-administrativos')
              .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
              });

            if (uploadError) {
              console.error(`Erro no upload do arquivo ${file.name}:`, uploadError);
              failedFiles.push(`${file.name}: ${uploadError.message}`);
              continue;
            }

            // Obter URL pública do arquivo
            const { data: { publicUrl } } = supabase.storage
              .from('processos-administrativos')
              .getPublicUrl(fileName);

            // Salvar informações do arquivo no banco
            const { data: fileData, error: dbError } = await supabase
              .from('processos_arquivos')
              .insert([{
                pasta_id: selectedFolder.id,
                nome_arquivo: file.name,
                tamanho_arquivo: file.size,
                url_arquivo: publicUrl,
                user_id: user.id
              }])
              .select()
              .single();

            if (dbError) {
              console.error(`Erro ao salvar ${file.name} no banco:`, dbError);
              failedFiles.push(`${file.name}: Erro ao salvar no banco`);
              continue;
            }

            uploadedFiles.push(fileData);
            
          } catch (error) {
            console.error(`Erro geral com arquivo ${file.name}:`, error);
            failedFiles.push(`${file.name}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
          }
        }

        // Atualizar UI com arquivos enviados com sucesso
        if (uploadedFiles.length > 0) {
          setFolderFiles(prev => [...uploadedFiles, ...prev]);
          toast.success(`${uploadedFiles.length} arquivo(s) adicionado(s) com sucesso!`);
        }

        // Mostrar erros se houver
        if (failedFiles.length > 0) {
          console.error('Arquivos que falharam:', failedFiles);
          toast.error(`Falha em ${failedFiles.length} arquivo(s). Verifique o console para detalhes.`);
        }
      }

      // Limpar formulário
      setSelectedFiles(null);
      setShouldMergePDFs(false);
      setMergedFileName('');
      setShowUploadDialog(false);
      
    } catch (error) {
      console.error('Erro geral no upload:', error);
      toast.error(error instanceof Error ? error.message : 'Erro durante o upload dos arquivos');
    } finally {
      setIsLoading(false);
    }
  };

  // Editar pasta
  const handleEditFolder = async () => {
    if (!editingFolder || !editFolderName.trim()) {
      toast.error('Digite um nome para a pasta');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('processos_pastas')
        .update({
          nome: editFolderName.trim(),
          numero_processo: editProcessNumber.trim() || null
        })
        .eq('id', editingFolder.id)
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao editar pasta:', error);
        toast.error('Erro ao editar pasta');
        return;
      }

      setFolders(prev => prev.map(folder => 
        folder.id === editingFolder.id ? data : folder
      ));
      
      if (selectedFolder?.id === editingFolder.id) {
        setSelectedFolder(data);
      }

      setShowEditDialog(false);
      setEditingFolder(null);
      toast.success('Pasta editada com sucesso!');
    } catch (error) {
      console.error('Erro geral ao editar pasta:', error);
      toast.error('Erro ao editar pasta');
    } finally {
      setIsLoading(false);
    }
  };

  // Excluir pasta
  const handleDeleteFolder = async (folder: ProcessFolder) => {
    if (!window.confirm(`Tem certeza que deseja excluir a pasta "${folder.nome}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    setIsLoading(true);
    try {
      // Primeiro, excluir todos os arquivos da pasta
      const { error: filesError } = await supabase
        .from('processos_arquivos')
        .delete()
        .eq('pasta_id', folder.id);

      if (filesError) {
        console.error('Erro ao excluir arquivos:', filesError);
        toast.error('Erro ao excluir arquivos da pasta');
        return;
      }

      // Depois, excluir a pasta
      const { error: folderError } = await supabase
        .from('processos_pastas')
        .delete()
        .eq('id', folder.id)
        .eq('user_id', user?.id);

      if (folderError) {
        console.error('Erro ao excluir pasta:', folderError);
        toast.error('Erro ao excluir pasta');
        return;
      }

      setFolders(prev => prev.filter(f => f.id !== folder.id));
      if (selectedFolder?.id === folder.id) {
        setSelectedFolder(null);
        setFolderFiles([]);
      }
      toast.success('Pasta excluída com sucesso!');
    } catch (error) {
      console.error('Erro geral ao excluir pasta:', error);
      toast.error('Erro ao excluir pasta');
    } finally {
      setIsLoading(false);
    }
  };

  // Excluir arquivo
  const handleDeleteFile = async (file: ProcessFile) => {
    if (!window.confirm(`Tem certeza que deseja excluir o arquivo "${file.nome_arquivo}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('processos_arquivos')
        .delete()
        .eq('id', file.id)
        .eq('user_id', user?.id);

      if (error) {
        console.error('Erro ao excluir arquivo:', error);
        toast.error('Erro ao excluir arquivo');
        return;
      }

      setFolderFiles(prev => prev.filter(f => f.id !== file.id));
      toast.success('Arquivo excluído com sucesso!');
    } catch (error) {
      console.error('Erro geral ao excluir arquivo:', error);
      toast.error('Erro ao excluir arquivo');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para baixar arquivo
  const handleDownloadFile = (file: ProcessFile) => {
    window.open(file.url_arquivo, '_blank');
  };

  // Função para formatar tamanho do arquivo
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Verificar se arquivo é Excel
  const isExcelFile = (filename: string) => {
    const excelExtensions = ['.xlsx', '.xls'];
    return excelExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  };

  // Abrir editor Excel
  const handleOpenExcelEditor = (file: ProcessFile) => {
    setSelectedExcelFile(file);
    setShowExcelEditor(true);
  };

  // Callback para quando arquivo Excel é salvo
  const handleExcelFileSaved = () => {
    if (selectedFolder) {
      loadFolderFiles(selectedFolder.id);
    }
  };

  // Exportar pastas para Excel
  const handleExportFolders = () => {
    const success = exportFoldersToExcel(folders);
    if (success) {
      toast.success('Relatório de pastas exportado com sucesso!');
    } else {
      toast.error('Erro ao exportar relatório de pastas');
    }
  };

  // Exportar arquivos da pasta para Excel
  const handleExportFolderFiles = () => {
    if (!selectedFolder) return;
    
    const success = exportFilesToExcel(folderFiles, selectedFolder.nome);
    if (success) {
      toast.success('Relatório de arquivos exportado com sucesso!');
    } else {
      toast.error('Erro ao exportar relatório de arquivos');
    }
  };

  // Filtrar pastas baseado no termo de pesquisa
  const filteredFolders = folders.filter(folder => {
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const nameMatch = folder.nome.toLowerCase().includes(searchLower);
    const processMatch = folder.numero_processo?.toLowerCase().includes(searchLower);
    
    return nameMatch || processMatch;
  });

  // Filtrar arquivos baseado no termo de pesquisa
  const filteredFiles = folderFiles.filter(file => {
    if (!fileSearchTerm.trim()) return true;
    
    const searchLower = fileSearchTerm.toLowerCase();
    return file.nome_arquivo.toLowerCase().includes(searchLower);
  });

  // Limpar filtro de pastas
  const clearFolderSearch = () => {
    setSearchTerm('');
  };

  // Limpar filtro de arquivos
  const clearFileSearch = () => {
    setFileSearchTerm('');
  };

  // Renderização de subpastas
  const renderSubfolders = () => {
    if (!selectedFolder) return null;

    const subfolders = folders.filter(f => f.parent_id === selectedFolder?.id);

    const filteredSubfolders = subfolders.filter(sub => 
      sub.nome.toLowerCase().includes(fileSearchTerm.toLowerCase()) ||
      (sub.numero_processo && sub.numero_processo.toLowerCase().includes(fileSearchTerm.toLowerCase()))
    );

    if (subfolders.length === 0) return null;

    if (filteredSubfolders.length === 0 && fileSearchTerm) {
      return <p className="text-center text-gray-500 mt-4">Nenhuma subpasta encontrada com o termo "{fileSearchTerm}".</p>;
    }

    return (
      <div className="space-y-2 mb-4">
        <h3 className="text-sm font-semibold text-gray-600">Subpastas</h3>
        {filteredSubfolders.map(subfolder => (
          <div 
            key={subfolder.id} 
            className="flex items-center justify-between p-3 bg-white rounded-lg border hover:bg-gray-50 cursor-pointer transition-all"
            onClick={() => {
              setSelectedFolder(subfolder);
              loadFolderFiles(subfolder.id);
            }}
          >
            <div className="flex items-center space-x-3">
              <FolderOpen className="h-5 w-5 text-yellow-500" />
              <span className="font-medium text-gray-800">{subfolder.nome}</span>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </div>
        ))}
      </div>
    );
  };

  // Renderização dos arquivos e subpastas da pasta selecionada
  const renderFolderFiles = () => {
    if (isLoading) {
      return <div className="text-center py-8">Carregando...</div>;
    }

    const hasSubfolders = folders.some(f => f.parent_id === selectedFolder?.id);
    const hasFiles = filteredFiles.length > 0;

    if (!hasSubfolders && !hasFiles) {
      return (
        <div className="text-center py-12">
          <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Pasta Vazia</h3>
          <p className="mt-1 text-sm text-gray-500">Adicione arquivos ou crie uma subpasta.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {renderSubfolders()}
        
        {hasFiles && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-600">Arquivos</h3>
            {filteredFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-3 bg-white rounded-lg border hover:bg-gray-50 transition-all">
                <div className="flex items-center space-x-3 min-w-0">
                  {isExcelFile(file.nome_arquivo) ? (
                    <FileSpreadsheet className="h-5 w-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <FileText className="h-5 w-5 text-red-600 flex-shrink-0" />
                  )}
                  <span className="font-medium text-gray-800 truncate" title={file.nome_arquivo}>{file.nome_arquivo}</span>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <span className="text-sm text-gray-500 w-24 text-right">{formatFileSize(file.tamanho_arquivo)}</span>
                  {isExcelFile(file.nome_arquivo) && (
                    <Button variant="secondary" size="sm" onClick={() => handleOpenExcelEditor(file)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="secondary" size="sm" onClick={() => handleDownloadFile(file)}>
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => handleDeleteFile(file)} className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!hasFiles && fileSearchTerm && (
           <p className="text-center text-gray-500 mt-4">Nenhum arquivo encontrado com o termo "{fileSearchTerm}".</p>
        )}
      </div>
    );
  };

  useEffect(() => {
    loadFolders();
  }, [user]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              onBack();
            }}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            Processos Administrativos
          </h1>
        </div>
        
        <div className="flex gap-2">
          {!selectedFolder && (
            <>
              <Button
                onClick={handleExportFolders}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Exportar Pastas
              </Button>
              <Button
                onClick={() => {
                  setCreateFolderParentId(null);
                  setShowCreateDialog(true);
                }}
                className="bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Nova Pasta
              </Button>
            </>
          )}
          
          {selectedFolder && (
            <>
              <Button
                onClick={handleExportFolderFiles}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Exportar Arquivos
              </Button>
              <Button
                onClick={() => {
                  setNewFolderName('');
                  setNewProcessNumber('');
                  setCreateFolderParentId(selectedFolder ? selectedFolder.id : null);
                  setShowCreateDialog(true);
                }}
                variant="secondary"
                className="flex items-center gap-2 bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
              >
                <FolderOpen className="h-4 w-4" />
                Nova Subpasta
              </Button>
              <Button
                onClick={() => setShowUploadDialog(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload Arquivos
              </Button>
            </>
          )}
        </div>
      </div>

      {!selectedFolder ? (
        // Lista de pastas com filtro
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Todas as Pastas</h2>
            <p className="text-gray-600">{filteredFolders.length} de {folders.length} pasta(s)</p>
          </div>
          
          {/* Filtro de pesquisa para pastas */}
          <Card className="p-4 bg-gray-50 border-2 border-dashed border-gray-200">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Pesquisar por nome da pasta, número do processo ou criador..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-10 bg-white"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFolderSearch}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
          
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <p>Carregando pastas...</p>
            </div>
          ) : filteredFolders.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-48">
                <div className="text-center">
                  <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  {searchTerm ? (
                    <>
                      <p className="text-gray-600">Nenhuma pasta encontrada</p>
                      <p className="text-sm text-gray-500">Tente pesquisar com outros termos</p>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-600">Nenhuma pasta encontrada</p>
                      <p className="text-sm text-gray-500">Clique em "Nova Pasta" para começar</p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFolders.map((folder) => (
                <Card key={folder.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div 
                        className="flex-1 min-w-0"
                        onClick={() => {
                          setSelectedFolder(folder);
                          loadFolderFiles(folder.id);
                        }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <FolderOpen className="h-5 w-5 text-teal-600" />
                          <h3 className="font-medium text-gray-900 truncate">
                            {folder.nome}
                          </h3>
                        </div>
                        {folder.numero_processo && (
                          <p className="text-sm text-gray-600 mb-2">
                            Processo: {folder.numero_processo}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          Criada em: {new Date(folder.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      {/* Apenas mostrar botões de edição/exclusão para o criador ou admin */}
                      {(folder.user_id === user?.id || isAdmin) && (
                        <div className="flex gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingFolder(folder);
                              setEditFolderName(folder.nome);
                              setEditProcessNumber(folder.numero_processo || '');
                              setShowEditDialog(true);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFolder(folder);
                            }}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      {/* Indicador quando a pasta é de outro usuário */}
                      {folder.user_id !== user?.id && !isAdmin && (
                        <div className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          Pasta de outro usuário
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Lista de arquivos da pasta selecionada com filtro
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Button
                variant="secondary"
                onClick={() => {
                  setSelectedFolder(null);
                  setFolderFiles([]);
                  setFileSearchTerm(''); // Limpar filtro ao voltar
                }}
                className="mb-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar às Pastas
              </Button>
              <h2 className="text-xl font-semibold">
                Pasta: {selectedFolder.nome}
              </h2>
              {selectedFolder.numero_processo && (
                <p className="text-gray-600">
                  Processo: {selectedFolder.numero_processo}
                </p>
              )}
            </div>
            <p className="text-gray-600">{filteredFiles.length} de {folderFiles.length} arquivo(s)</p>
          </div>

          {/* Filtro de pesquisa para arquivos */}
          <Card className="p-4 bg-gray-50 border-2 border-dashed border-gray-200">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Buscar em arquivos e subpastas..."
                  value={fileSearchTerm}
                  onChange={(e) => setFileSearchTerm(e.target.value)}
                  className="w-64"
                />
                {fileSearchTerm && (
                  <Button variant="ghost" size="sm" onClick={clearFileSearch}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <p>Carregando conteúdo...</p>
            </div>
          ) : (
            renderFolderFiles()
          )}
        </div>
      )}

      {/* Dialog para criar nova pasta */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedFolder ? 'Criar Subpasta' : 'Criar Nova Pasta'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedFolder && (
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-500">Pasta pai: <span className="font-medium">{selectedFolder.nome}</span></p>
              </div>
            )}
            <div>
              <Label htmlFor="folderName">
                {selectedFolder ? 'Nome da Subpasta' : 'Nome da Pasta'}
              </Label>
              <Input
                id="folderName"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder={selectedFolder ? "Digite o nome da subpasta" : "Digite o nome da pasta"}
              />
            </div>
            <div>
              <Label htmlFor="processNumber">Número do Processo (opcional)</Label>
              <Input
                id="processNumber"
                value={newProcessNumber}
                onChange={(e) => setNewProcessNumber(e.target.value)}
                placeholder="Número do processo administrativo"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="secondary" onClick={() => setShowCreateDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateFolder} 
                disabled={isLoading || !newFolderName.trim()}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isLoading ? 'Criando...' : (createFolderParentId ? 'Criar Subpasta' : 'Criar Pasta')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Pasta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-folder-name">Nome da Pasta *</Label>
              <Input
                id="edit-folder-name"
                value={editFolderName}
                onChange={(e) => setEditFolderName(e.target.value)}
                placeholder="Digite o nome da pasta"
              />
            </div>
            <div>
              <Label htmlFor="edit-process-number">Número do Processo (opcional)</Label>
              <Input
                id="edit-process-number"
                value={editProcessNumber}
                onChange={(e) => setEditProcessNumber(e.target.value)}
                placeholder="Digite o número do processo"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowEditDialog(false);
                  setEditingFolder(null);
                  setEditFolderName('');
                  setEditProcessNumber('');
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleEditFolder}
                disabled={isLoading || !editFolderName.trim()}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {isLoading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para upload de arquivos */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload de Arquivos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="file-input">Selecionar Arquivos (PDF, Excel)</Label>
              <Input
                id="file-input"
                type="file"
                multiple
                accept=".pdf,.xlsx,.xls"
                onChange={(e) => setSelectedFiles(e.target.files)}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Tipos permitidos: PDF, XLSX, XLS (máximo 50MB por arquivo)
              </p>
            </div>

            {selectedFiles && Array.from(selectedFiles).filter(f => f.type === 'application/pdf').length > 1 && (
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="merge-pdfs"
                    checked={shouldMergePDFs}
                    onCheckedChange={(checked) => setShouldMergePDFs(checked as boolean)}
                  />
                  <Label htmlFor="merge-pdfs" className="text-sm font-medium">
                    Mesclar arquivos PDF em um único arquivo
                  </Label>
                </div>
                
                {shouldMergePDFs && (
                  <div>
                    <Label htmlFor="merged-filename" className="text-sm">
                      Nome do arquivo mesclado
                    </Label>
                    <Input
                      id="merged-filename"
                      value={mergedFileName}
                      onChange={(e) => setMergedFileName(e.target.value)}
                      placeholder="Digite o nome do arquivo (sem extensão)"
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
            )}

            {selectedFiles && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Arquivos selecionados:</p>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {Array.from(selectedFiles).map((file, index) => (
                    <div key={index} className="text-xs bg-gray-100 p-2 rounded flex justify-between">
                      <span className="truncate">{file.name}</span>
                      <span className="text-gray-500 ml-2">{formatFileSize(file.size)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowUploadDialog(false);
                  setSelectedFiles(null);
                  setShouldMergePDFs(false);
                  setMergedFileName('');
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUploadFiles}
                disabled={isLoading || !selectedFiles || selectedFiles.length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? 'Enviando...' : 'Enviar Arquivos'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Editor Excel */}
      <ExcelEditor
        isOpen={showExcelEditor}
        onClose={() => {
          setShowExcelEditor(false);
          setSelectedExcelFile(null);
        }}
        file={selectedExcelFile}
        onFileSaved={handleExcelFileSaved}
      />
    </div>
  );
};

export default ProcessosAdministrativos;
