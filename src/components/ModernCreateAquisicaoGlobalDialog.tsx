import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useCreateAta } from '@/hooks/useAtas';
import CurrencyInput from '@/components/CurrencyInput';
import ModernCreateATADialog from '@/components/ModernCreateATADialog';

interface ModernCreateAquisicaoGlobalDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const ModernCreateAquisicaoGlobalDialog: React.FC<ModernCreateAquisicaoGlobalDialogProps> = ({ isOpen, onClose }) => {
  return (
    <ModernCreateATADialog
      isOpen={isOpen}
      onClose={onClose}
      category="aquisicao"
    />
  );
};

export default ModernCreateAquisicaoGlobalDialog;