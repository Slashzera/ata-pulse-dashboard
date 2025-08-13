import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Upload, X } from 'lucide-react';
import CurrencyInput from '@/components/CurrencyInput';
import TacAttachmentsManager from '@/components/TacAttachmentsManager';

interface CreateTACDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    nomeEmpresa: string;
    numeroProcesso: string;
    dataEntrada: string;
    assuntoObjeto: string;
    nNotas: string;
    valor: number;
    unidadeBeneficiada: string;
    arquivo: File;
    additionalFiles?: File[];
  }) => Promise<void>;
}

export default function CreateTACDialog({ isOpen, onClose, onSubmit }: CreateTACDialogProps) {
  const [nomeEmpresa, setNomeEmpresa] = useState('');
  const [numeroProcesso, setNumeroProcesso] = useState('');
  const [dataEntrada, setDataEntrada] = useState('');
  const [assuntoObjeto, setAssuntoObjeto] = useState('');
  const [nNotas, setNNotas] = useState('');
  const [valor, setValor] = useState<number | ''>('');
  const [unidadeBeneficiada, setUnidadeBeneficiada] = useState('');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [additionalFiles, setAdditionalFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação dos campos obrigatórios
    if (!nomeEmpresa || !numeroProcesso || !dataEntrada || !assuntoObjeto || !nNotas || valor === '' || !unidadeBeneficiada) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    
    // Validação do arquivo
    if (!arquivo) {
      alert('Por favor, selecione um arquivo para upload.');
      return;
    }
    
    // Verifica se o arquivo é um PDF
    if (arquivo.type !== 'application/pdf') {
      alert('Por favor, selecione um arquivo no formato PDF.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Here you would typically upload the file and save the TAC data
      // For now, we'll just log the data and close the dialog
      console.log({
        nomeEmpresa,
        numeroProcesso,
        arquivo: arquivo.name,
        tipo: arquivo.type,
        tamanho: arquivo.size
      });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Call the onSubmit callback if provided
      if (onSubmit) {
        try {
          await onSubmit({
            nomeEmpresa,
            numeroProcesso,
            dataEntrada,
            assuntoObjeto,
            nNotas,
            valor: Number(valor),
            unidadeBeneficiada,
            arquivo: arquivo, // Garante que o arquivo não é null aqui
            additionalFiles: additionalFiles.length > 0 ? additionalFiles : undefined
          });
        } catch (error) {
          console.error('Erro ao salvar TAC:', error);
          throw error; // Propaga o erro para ser tratado no catch externo
        }
      }
      
      // Close the dialog
      onClose();
      
      // Reset form
      setNomeEmpresa('');
      setNumeroProcesso('');
      setDataEntrada('');
      setAssuntoObjeto('');
      setNNotas('');
      setValor('');
      setUnidadeBeneficiada('');
      setArquivo(null);
      setAdditionalFiles([]);
    } catch (error) {
      console.error('Erro ao salvar TAC:', error);
      alert('Ocorreu um erro ao salvar o TAC. Por favor, tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file) {
        setArquivo(file);
      }
    }
  };

  const removeFile = () => {
    setArquivo(null);
    // Reset the file input
    const fileInput = document.getElementById('arquivo') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto bg-white border shadow-xl">
        <DialogHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 -m-6 mb-4 rounded-t-lg">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <FileText className="h-5 w-5" />
            Novo TAC
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nomeEmpresa" className="text-sm font-medium">Nome da Empresa</Label>
            <Input
              id="nomeEmpresa"
              placeholder="Digite o nome da empresa"
              value={nomeEmpresa}
              onChange={(e) => setNomeEmpresa(e.target.value)}
              disabled={isSubmitting}
              required
              className="h-9"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="numeroProcesso" className="text-sm font-medium">Número do Processo</Label>
            <Input
              id="numeroProcesso"
              placeholder="Digite o número do processo"
              value={numeroProcesso}
              onChange={(e) => setNumeroProcesso(e.target.value)}
              disabled={isSubmitting}
              required
              className="h-9"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataEntrada" className="text-sm font-medium">Data de Entrada</Label>
              <Input
                id="dataEntrada"
                type="date"
                value={dataEntrada}
                onChange={(e) => setDataEntrada(e.target.value)}
                disabled={isSubmitting}
                required
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valor" className="text-sm font-medium">Valor</Label>
              <CurrencyInput
                id="valor"
                value={valor}
                onChange={(value) => setValor(value)}
                placeholder="R$ 0,00"
                disabled={isSubmitting}
                className="h-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assuntoObjeto" className="text-sm font-medium">Assunto/Objeto</Label>
            <Input
              id="assuntoObjeto"
              placeholder="Digite o assunto ou objeto"
              value={assuntoObjeto}
              onChange={(e) => setAssuntoObjeto(e.target.value)}
              disabled={isSubmitting}
              required
              className="h-9"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nNotas" className="text-sm font-medium">Nº da(s) Nota(s)</Label>
            <Input
              id="nNotas"
              placeholder="Digite o número da(s) nota(s)"
              value={nNotas}
              onChange={(e) => setNNotas(e.target.value)}
              disabled={isSubmitting}
              required
              className="h-9"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unidadeBeneficiada" className="text-sm font-medium">Unidade Beneficiada</Label>
            <Input
              id="unidadeBeneficiada"
              placeholder="Digite a unidade beneficiada"
              value={unidadeBeneficiada}
              onChange={(e) => setUnidadeBeneficiada(e.target.value)}
              disabled={isSubmitting}
              required
              className="h-9"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="arquivo" className="text-sm font-medium">Anexar PDF</Label>
            <div className="flex items-center gap-2">
              <label 
                htmlFor="arquivo"
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm text-gray-600 hover:bg-gray-100 hover:border-gray-400 cursor-pointer transition-colors"
              >
                <Upload className="h-4 w-4" />
                <span>
                  {arquivo ? 'Trocar arquivo' : 'Selecione um arquivo PDF'}
                </span>
              </label>
              <input
                id="arquivo"
                name="arquivo"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
                disabled={isSubmitting}
                required={!arquivo}
              />
            </div>
            
            {arquivo && (
              <div className="mt-2 flex items-center justify-between rounded-lg bg-green-50 border border-green-200 p-3 text-sm">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-green-600" />
                  <div>
                    <span className="truncate max-w-[200px] font-medium text-gray-700">{arquivo.name}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      ({(arquivo.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="text-gray-400 hover:text-red-500 p-1"
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Apenas arquivos PDF são permitidos (máx. 10MB)
            </p>
          </div>

          {/* Gerenciador de anexos adicionais */}
          <TacAttachmentsManager
            tacId={null}
            mode="create"
            additionalFiles={additionalFiles}
            onAdditionalFilesChange={setAdditionalFiles}
            disabled={isSubmitting}
          />
          
          <DialogFooter className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                'Salvar TAC'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
