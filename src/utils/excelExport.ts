
import * as XLSX from 'xlsx';

interface ProcessFolder {
  id: string;
  nome: string;
  numero_processo?: string;
  created_at: string;
  updated_at: string;
}

interface ProcessFile {
  id: string;
  nome_arquivo: string;
  tamanho_arquivo: number;
  created_at: string;
}

export const exportFoldersToExcel = (folders: ProcessFolder[], fileName: string = 'pastas_processos') => {
  try {
    const workbook = XLSX.utils.book_new();
    
    // Preparar dados das pastas
    const foldersData = folders.map(folder => ({
      'Nome da Pasta': folder.nome,
      'Número do Processo': folder.numero_processo || '',
      'Data de Criação': new Date(folder.created_at).toLocaleDateString('pt-BR'),
      'Última Atualização': new Date(folder.updated_at).toLocaleDateString('pt-BR')
    }));

    // Criar planilha das pastas
    const foldersWorksheet = XLSX.utils.json_to_sheet(foldersData);
    XLSX.utils.book_append_sheet(workbook, foldersWorksheet, 'Pastas');

    // Salvar arquivo
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
    
    return true;
  } catch (error) {
    console.error('Erro ao exportar para Excel:', error);
    return false;
  }
};

export const exportFilesToExcel = (files: ProcessFile[], folderName: string, fileName: string = 'arquivos_pasta') => {
  try {
    const workbook = XLSX.utils.book_new();
    
    // Preparar dados dos arquivos
    const filesData = files.map(file => ({
      'Nome do Arquivo': file.nome_arquivo,
      'Tamanho': formatFileSize(file.tamanho_arquivo),
      'Data de Upload': new Date(file.created_at).toLocaleDateString('pt-BR')
    }));

    // Criar planilha dos arquivos
    const filesWorksheet = XLSX.utils.json_to_sheet(filesData);
    XLSX.utils.book_append_sheet(workbook, filesWorksheet, 'Arquivos');

    // Adicionar informações da pasta como uma segunda planilha
    const folderInfo = [{
      'Pasta': folderName,
      'Total de Arquivos': files.length,
      'Data da Exportação': new Date().toLocaleDateString('pt-BR')
    }];
    const folderWorksheet = XLSX.utils.json_to_sheet(folderInfo);
    XLSX.utils.book_append_sheet(workbook, folderWorksheet, 'Informações');

    // Salvar arquivo
    XLSX.writeFile(workbook, `${fileName}_${folderName.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
    
    return true;
  } catch (error) {
    console.error('Erro ao exportar arquivos para Excel:', error);
    return false;
  }
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
