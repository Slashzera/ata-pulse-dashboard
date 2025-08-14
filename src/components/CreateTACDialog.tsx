import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Upload, X, Building2, Calendar, DollarSign, Star, Hash, MapPin, Sparkles } from 'lucide-react';
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-white border-0 shadow-2xl rounded-2xl">
        <DialogHeader className="bg-gradient-to-r from-pink-600 via-purple-700 to-indigo-800 text-white p-6 -m-6 mb-6 rounded-t-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <DialogTitle className="flex items-center gap-3 text-xl font-bold relative z-10">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xl">Novo TAC</div>
              <div className="text-sm opacity-90 font-normal">Termo de Aceite de Contratação</div>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações da Empresa */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-800">Informações da Empresa</h3>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nomeEmpresa" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  Nome da Empresa
                </Label>
                <Input
                  id="nomeEmpresa"
                  placeholder="Digite o nome da empresa"
                  value={nomeEmpresa}
                  onChange={(e) => setNomeEmpresa(e.target.value)}
                  disabled={isSubmitting}
                  required
                  className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="numeroProcesso" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Hash className="h-4 w-4 text-blue-600" />
                  Número do Processo
                </Label>
                <Input
                  id="numeroProcesso"
                  placeholder="Digite o número do processo"
                  value={numeroProcesso}
                  onChange={(e) => setNumeroProcesso(e.target.value)}
                  disabled={isSubmitting}
                  required
                  className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Data e Valor */}
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-100">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              <h3 className="text-lg font-semibold text-emerald-800">Data e Valor</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dataEntrada" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-600" />
                  Data de Entrada
                </Label>
                <Input
                  id="dataEntrada"
                  type="date"
                  value={dataEntrada}
                  onChange={(e) => setDataEntrada(e.target.value)}
                  disabled={isSubmitting}
                  required
                  className="h-11 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valor" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  Valor
                </Label>
                <CurrencyInput
                  id="valor"
                  value={valor}
                  onChange={(value) => setValor(value)}
                  placeholder="R$ 0,00"
                  disabled={isSubmitting}
                  className="h-11 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Detalhes do TAC */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
            <div className="flex items-center gap-2 mb-4">
              <Star className="h-5 w-5 text-amber-600" />
              <h3 className="text-lg font-semibold text-amber-800">Detalhes do TAC</h3>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="assuntoObjeto" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-600" />
                  Assunto/Objeto
                </Label>
                <Input
                  id="assuntoObjeto"
                  placeholder="Digite o assunto ou objeto"
                  value={assuntoObjeto}
                  onChange={(e) => setAssuntoObjeto(e.target.value)}
                  disabled={isSubmitting}
                  required
                  className="h-11 border-slate-200 focus:border-amber-500 focus:ring-amber-500/20 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nNotas" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Hash className="h-4 w-4 text-amber-600" />
                    Nº da(s) Nota(s)
                  </Label>
                  <Input
                    id="nNotas"
                    placeholder="Digite o número da(s) nota(s)"
                    value={nNotas}
                    onChange={(e) => setNNotas(e.target.value)}
                    disabled={isSubmitting}
                    required
                    className="h-11 border-slate-200 focus:border-amber-500 focus:ring-amber-500/20 rounded-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unidadeBeneficiada" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-amber-600" />
                    Unidade Beneficiada
                  </Label>
                  <Input
                    id="unidadeBeneficiada"
                    placeholder="Digite a unidade beneficiada"
                    value={unidadeBeneficiada}
                    onChange={(e) => setUnidadeBeneficiada(e.target.value)}
                    disabled={isSubmitting}
                    required
                    className="h-11 border-slate-200 focus:border-amber-500 focus:ring-amber-500/20 rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Upload de Arquivo */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
            <div className="flex items-center gap-2 mb-4">
              <Upload className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-purple-800">Anexar Documento</h3>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="arquivo" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-purple-600" />
                  Arquivo PDF Principal
                </Label>
                <div className="flex items-center gap-2">
                  <label 
                    htmlFor="arquivo"
                    className="flex flex-1 items-center justify-center gap-3 rounded-xl border-2 border-dashed border-purple-300 bg-purple-50/50 px-6 py-8 text-sm text-purple-700 hover:bg-purple-100/50 hover:border-purple-400 cursor-pointer transition-all duration-300 hover:scale-[1.02]"
                  >
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Upload className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="text-center">
                      <div className="font-medium">
                        {arquivo ? 'Trocar arquivo' : 'Selecione um arquivo PDF'}
                      </div>
                      <div className="text-xs text-purple-600 mt-1">
                        Clique ou arraste o arquivo aqui
                      </div>
                    </div>
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
                  <div className="mt-3 flex items-center justify-between rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-4 text-sm shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <FileText className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium text-green-800 truncate max-w-[250px]" title={arquivo.name}>
                          {arquivo.name}
                        </div>
                        <div className="text-xs text-green-600 mt-1">
                          {(arquivo.size / 1024).toFixed(1)} KB • PDF
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="text-green-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors"
                      disabled={isSubmitting}
                      title="Remover arquivo"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <p className="text-xs text-purple-600 mt-2 flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Apenas arquivos PDF são permitidos (máximo 10MB)
                </p>
              </div>
            </div>
          </div>

          {/* Gerenciador de anexos adicionais */}
          <TacAttachmentsManager
            tacId={null}
            mode="create"
            additionalFiles={additionalFiles}
            onAdditionalFilesChange={setAdditionalFiles}
            disabled={isSubmitting}
          />
          
          <DialogFooter className="flex gap-4 pt-6 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 h-12 rounded-xl border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-colors"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="flex-1 h-12 bg-gradient-to-r from-pink-600 via-purple-700 to-indigo-800 hover:from-pink-700 hover:via-purple-800 hover:to-indigo-900 text-white border-0 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  <span className="font-medium">Salvando TAC...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  <span className="font-medium">Salvar TAC</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
