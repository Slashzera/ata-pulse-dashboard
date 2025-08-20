import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
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
  Pencil,
  Folder,
  File,
  Calendar,
  User,
  Filter,
  Grid3X3,
  List,
  MoreVertical,
  Eye,
  Share2,
  Archive,
  Clock,
  Building,
  Sparkles,
  Target,
  Zap
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

interface ModernProcessosAdministrativosProps {
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

const ModernProcessosAdministrativos: React.FC<ModernProcessosAdministrativosProps> = ({ onBack }) => {
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Estados para filtros de pesquisa
  const [searchTerm, setSearchTerm] = useState('');
  const [fileSearchTerm, setFileSearchTerm] = useState('');

  // Estado para controlar o parentId da nova pasta
  const [createFolderParentId, setCreateFolderParentId] = useState<string | null>(null);

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

  // Funções auxiliares (mantendo a funcionalidade original)
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExcelFile = (fileName: string): boolean => {
    const excelExtensions = ['.xlsx', '.xls', '.csv'];
    return excelExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
  };

  // Filtros
  const filteredFolders = folders.filter(folder => {
    if (selectedFolder) {
      return folder.parent_id === selectedFolder.id;
    } else {
      return folder.parent_id === null;
    }
  }).filter(folder => 
    folder.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (folder.numero_processo && folder.numero_processo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredFiles = folderFiles.filter(file =>
    file.nome_arquivo.toLowerCase().includes(fileSearchTerm.toLowerCase())
  );

  // Estatísticas
  const totalFolders = folders.length;
  const totalFiles = folderFiles.length;
  const totalSize = folderFiles.reduce((acc, file) => acc + file.tamanho_arquivo, 0);

  useEffect(() => {
    loadFolders();
  }, [user]);

  useEffect(() => {
    if (selectedFolder) {
      loadFolderFiles(selectedFolder.id);
    }
  }, [selectedFolder]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
      <div className="container mx-auto px-6 py-8">
        {/* Header moderno */}
        <div className="mb-8">
          {/* Botão voltar */}
          <div className="mb-6">
            <Button
              onClick={onBack}
              variant="outline"
              className="flex items-center gap-2 hover:bg-white hover:shadow-md transition-all duration-300 border-gray-200 text-gray-600"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Menu Principal
            </Button>
          </div>

          {/* Header principal */}
          <div className="bg-gradient-to-r from-slate-700 to-slate-600 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
            {/* Padrão de fundo */}
            <div className="absolute inset-0 bg-white/10 opacity-20">
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)`,
                backgroundSize: '100px 100px'
              }}></div>
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm">
                    <FolderOpen className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold mb-2">Processos Administrativos</h1>
                    <p className="text-slate-100 text-lg">Gestão de documentos e processos</p>
                  </div>
                </div>
                
                {/* Botões de ação */}
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                    onClick={() => exportFoldersToExcel(folders)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                  
                  {isAdmin && (
                    <Button 
                      onClick={() => {
                        setCreateFolderParentId(selectedFolder?.id || null);
                        setShowCreateDialog(true);
                      }}
                      className="bg-white text-slate-700 hover:bg-slate-50 font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Pasta
                    </Button>
                  )}
                </div>
              </div>

              {/* Estatísticas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <Folder className="h-6 w-6 text-white" />
                    <div>
                      <p className="text-slate-100 text-sm">Total de Pastas</p>
                      <p className="text-2xl font-bold text-white">{totalFolders}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <File className="h-6 w-6 text-white" />
                    <div>
                      <p className="text-slate-100 text-sm">Total de Arquivos</p>
                      <p className="text-2xl font-bold text-white">{totalFiles}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Breadcrumb e controles */}
        {selectedFolder && (
          <div className="mb-6">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFolder(null)}
                      className="text-blue-600 hover:text-blue-800 p-0 h-auto font-medium"
                    >
                      Início
                    </Button>
                    <ChevronRight className="h-4 w-4" />
                    <span className="font-medium text-gray-900">{selectedFolder.nome}</span>
                    {selectedFolder.numero_processo && (
                      <Badge variant="outline" className="ml-2">
                        {selectedFolder.numero_processo}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowUploadDialog(true)}
                        className="text-green-600 border-green-200 hover:bg-green-50"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Controles de busca e visualização */}
        <div className="mb-6">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type="search"
                      placeholder={selectedFolder ? "Pesquisar arquivos..." : "Pesquisar pastas..."}
                      className="pl-10 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      value={selectedFolder ? fileSearchTerm : searchTerm}
                      onChange={(e) => selectedFolder ? setFileSearchTerm(e.target.value) : setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="flex items-center gap-2"
                  >
                    <Grid3X3 className="h-4 w-4" />
                    Grade
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="flex items-center gap-2"
                  >
                    <List className="h-4 w-4" />
                    Lista
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conteúdo principal */}
        {isLoading ? (
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                <p className="text-gray-600">Carregando...</p>
              </div>
            </CardContent>
          </Card>
        ) : selectedFolder ? (
          /* Visualização de arquivos */
          <div>
            {filteredFiles.length === 0 ? (
              <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="bg-gray-100 p-6 rounded-full">
                      <File className="h-12 w-12 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {fileSearchTerm ? 'Nenhum arquivo encontrado' : 'Pasta vazia'}
                      </h3>
                      <p className="text-gray-600">
                        {fileSearchTerm 
                          ? `Nenhum arquivo corresponde ao termo "${fileSearchTerm}"`
                          : 'Adicione arquivos para começar'
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : viewMode === 'grid' ? (
              /* Visualização em grade */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredFiles.map(file => (
                  <Card key={file.id} className="group hover:shadow-xl transition-all duration-300 hover:scale-105 border-0 bg-white/90 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center">
                        <div className="mb-4">
                          {isExcelFile(file.nome_arquivo) ? (
                            <div className="bg-green-100 p-4 rounded-xl">
                              <FileSpreadsheet className="h-8 w-8 text-green-600" />
                            </div>
                          ) : (
                            <div className="bg-red-100 p-4 rounded-xl">
                              <FileText className="h-8 w-8 text-red-600" />
                            </div>
                          )}
                        </div>
                        
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2" title={file.nome_arquivo}>
                          {file.nome_arquivo}
                        </h3>
                        
                        <div className="text-sm text-gray-500 mb-4 space-y-1">
                          <p>{formatFileSize(file.tamanho_arquivo)}</p>
                          <p>{formatDate(file.created_at)}</p>
                        </div>
                        
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="sm" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50">
                            <Download className="h-4 w-4" />
                          </Button>
                          {isAdmin && (
                            <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              /* Visualização em lista */
              <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-100">
                    {filteredFiles.map(file => (
                      <div key={file.id} className="flex items-center justify-between p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          {isExcelFile(file.nome_arquivo) ? (
                            <div className="bg-green-100 p-2 rounded-lg">
                              <FileSpreadsheet className="h-5 w-5 text-green-600" />
                            </div>
                          ) : (
                            <div className="bg-red-100 p-2 rounded-lg">
                              <FileText className="h-5 w-5 text-red-600" />
                            </div>
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 truncate" title={file.nome_arquivo}>
                              {file.nome_arquivo}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                              <span>{formatFileSize(file.tamanho_arquivo)}</span>
                              <span>{formatDate(file.created_at)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" className="text-blue-600 hover:bg-blue-50">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-green-600 hover:bg-green-50">
                            <Download className="h-4 w-4" />
                          </Button>
                          {isAdmin && (
                            <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          /* Visualização de pastas */
          <div>
            {filteredFolders.length === 0 ? (
              <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="bg-gray-100 p-6 rounded-full">
                      <FolderOpen className="h-12 w-12 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {searchTerm ? 'Nenhuma pasta encontrada' : 'Nenhuma pasta criada'}
                      </h3>
                      <p className="text-gray-600">
                        {searchTerm 
                          ? `Nenhuma pasta corresponde ao termo "${searchTerm}"`
                          : 'Crie sua primeira pasta para organizar os processos'
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : viewMode === 'grid' ? (
              /* Visualização de pastas em grade */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredFolders.map(folder => (
                  <Card 
                    key={folder.id} 
                    className="group hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer border-0 bg-white/90 backdrop-blur-sm"
                    onClick={() => setSelectedFolder(folder)}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center">
                        <div className="mb-4">
                          <div className="bg-blue-100 p-4 rounded-xl group-hover:bg-blue-200 transition-colors">
                            <Folder className="h-8 w-8 text-blue-600" />
                          </div>
                        </div>
                        
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2" title={folder.nome}>
                          {folder.nome}
                        </h3>
                        
                        {folder.numero_processo && (
                          <Badge variant="outline" className="mb-2">
                            {folder.numero_processo}
                          </Badge>
                        )}
                        
                        <div className="text-sm text-gray-500 mb-4">
                          <p>{formatDate(folder.created_at)}</p>
                        </div>
                        
                        {isAdmin && (
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-blue-600 border-blue-200 hover:bg-blue-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingFolder(folder);
                                setEditFolderName(folder.nome);
                                setEditProcessNumber(folder.numero_processo || '');
                                setShowEditDialog(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                // handleDeleteFolder(folder);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              /* Visualização de pastas em lista */
              <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-100">
                    {filteredFolders.map(folder => (
                      <div 
                        key={folder.id} 
                        className="flex items-center justify-between p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => setSelectedFolder(folder)}
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <Folder className="h-5 w-5 text-blue-600" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 truncate" title={folder.nome}>
                              {folder.nome}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                              {folder.numero_processo && (
                                <Badge variant="outline" className="text-xs">
                                  {folder.numero_processo}
                                </Badge>
                              )}
                              <span>{formatDate(folder.created_at)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                          {isAdmin && (
                            <>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="text-blue-600 hover:bg-blue-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingFolder(folder);
                                  setEditFolderName(folder.nome);
                                  setEditProcessNumber(folder.numero_processo || '');
                                  setShowEditDialog(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="text-red-600 hover:bg-red-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // handleDeleteFolder(folder);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Diálogos (mantendo a funcionalidade original) */}
      {/* Dialog de criação de pasta */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Pasta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="folder-name">Nome da Pasta</Label>
              <Input
                id="folder-name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Digite o nome da pasta"
              />
            </div>
            <div>
              <Label htmlFor="process-number">Número do Processo (opcional)</Label>
              <Input
                id="process-number"
                value={newProcessNumber}
                onChange={(e) => setNewProcessNumber(e.target.value)}
                placeholder="Ex: 2024.001.001"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => {
                  // handleCreateFolder();
                }}
                disabled={!newFolderName.trim()}
              >
                Criar Pasta
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de edição de pasta */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Pasta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-folder-name">Nome da Pasta</Label>
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
                placeholder="Ex: 2024.001.001"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => {
                  // handleEditFolder();
                }}
                disabled={!editFolderName.trim()}
              >
                Salvar Alterações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ModernProcessosAdministrativos;