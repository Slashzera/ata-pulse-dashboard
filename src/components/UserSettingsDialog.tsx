
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings } from 'lucide-react';
import { useUserSettings, useUpdateUserSettings } from '@/hooks/useUserSettings';

interface UserSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserSettingsDialog: React.FC<UserSettingsDialogProps> = ({
  isOpen,
  onClose
}) => {
  const { data: settings } = useUserSettings();
  const updateSettingsMutation = useUpdateUserSettings();
  
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [expirationAlertMonths, setExpirationAlertMonths] = useState(3);
  const [notificationEmail, setNotificationEmail] = useState('');

  useEffect(() => {
    if (settings) {
      setEmailNotifications(settings.email_notifications);
      setExpirationAlertMonths(settings.expiration_alert_months);
      setNotificationEmail(settings.notification_email || '');
    }
  }, [settings]);

  const handleSave = () => {
    updateSettingsMutation.mutate({
      email_notifications: emailNotifications,
      expiration_alert_months: expirationAlertMonths,
      notification_email: notificationEmail
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações do Usuário
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Notificações por E-mail</Label>
              <p className="text-sm text-gray-600">Receber alertas de vencimento e atualizações</p>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>

          <div>
            <Label htmlFor="notification-email">E-mail para Notificações</Label>
            <Input
              id="notification-email"
              type="email"
              value={notificationEmail}
              onChange={(e) => setNotificationEmail(e.target.value)}
              placeholder="seu@email.com"
              disabled={!emailNotifications}
            />
          </div>

          <div>
            <Label htmlFor="alert-months">Alerta de Vencimento (meses de antecedência)</Label>
            <Select 
              value={expirationAlertMonths.toString()} 
              onValueChange={(value) => setExpirationAlertMonths(parseInt(value))}
              disabled={!emailNotifications}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 mês</SelectItem>
                <SelectItem value="2">2 meses</SelectItem>
                <SelectItem value="3">3 meses</SelectItem>
                <SelectItem value="6">6 meses</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={updateSettingsMutation.isPending}>
            Salvar Configurações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserSettingsDialog;
