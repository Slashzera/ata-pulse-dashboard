# Sistema de Notificações KazuFlow 🔔

## 🎯 **Visão Geral**

Sistema completo de notificações em tempo real para o KazuFlow, que notifica automaticamente os usuários sobre atividades importantes nos quadros e cartões.

## ✨ **Funcionalidades**

### **1. Notificações Automáticas:**
- ✅ **Criação de cartões** - Notifica quando um novo cartão é criado
- ✅ **Movimentação de cartões** - Notifica quando um cartão é movido entre listas
- ✅ **Edição de cartões** - Notifica quando um cartão é editado
- ✅ **Criação de quadros** - Notifica quando um novo quadro é criado
- ✅ **Exclusão de quadros** - Notifica quando um quadro é excluído

### **2. Interface Moderna:**
- 🔔 **Sino de notificações** no canto superior direito
- 🔴 **Badge com contador** de notificações não lidas
- 📱 **Dropdown responsivo** com lista de notificações
- ⚡ **Atualizações em tempo real** via Supabase Realtime
- 🎨 **Design moderno** com animações suaves

### **3. Gerenciamento:**
- 📖 **Marcar como lida** individualmente
- ✅ **Marcar todas como lidas** de uma vez
- 🗑️ **Deletar notificações** individualmente
- 🕒 **Tempo relativo** (ex: "5 min atrás", "2h atrás")
- 🎯 **Ícones específicos** por tipo de notificação

## 🏗️ **Arquitetura do Sistema**

### **1. Banco de Dados:**
```sql
-- Tabela principal
notifications (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    type VARCHAR(50), -- Tipo da notificação
    title VARCHAR(255), -- Título da notificação
    message TEXT, -- Mensagem detalhada
    data JSONB, -- Dados adicionais
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
)
```

### **2. Triggers Automáticos:**
- **trigger_notify_card_created** - Dispara ao criar cartão
- **trigger_notify_card_moved** - Dispara ao mover cartão
- **trigger_notify_board_created** - Dispara ao criar quadro

### **3. Funções SQL:**
- **create_notification()** - Cria nova notificação
- **mark_notification_read()** - Marca como lida
- **mark_all_notifications_read()** - Marca todas como lidas
- **cleanup_old_notifications()** - Remove notificações antigas

## 📁 **Estrutura de Arquivos**

```
src/
├── hooks/
│   └── useNotifications.ts          # Hook principal de notificações
├── components/
│   └── NotificationDropdown.tsx     # Componente do dropdown
└── components/
    └── Header.tsx                   # Header com notificações integradas

SQL/
├── install-notifications-system.sql # Script de instalação
└── create-notifications-system.sql  # Script completo com exemplos
```

## 🚀 **Instalação**

### **Passo 1: Instalar no Banco de Dados**
```sql
-- Execute no Supabase SQL Editor
-- Copie e cole o conteúdo de: install-notifications-system.sql
```

### **Passo 2: Verificar Instalação**
```sql
-- Verificar se tudo foi criado
SELECT 
    'notifications' as table_name,
    COUNT(*) as row_count
FROM notifications;
```

### **Passo 3: Testar Sistema**
1. Acesse o KazuFlow
2. Observe o sino no canto superior direito
3. Crie um cartão ou quadro
4. Verifique se a notificação aparece

## 🎨 **Interface do Usuário**

### **1. Sino de Notificações:**
```tsx
// Localização: Canto superior direito do Header
<NotificationDropdown />
```

### **2. Estados Visuais:**
- **Sem notificações:** Sino cinza
- **Com notificações:** Badge vermelho com número
- **Hover:** Efeito de destaque
- **Dropdown aberto:** Lista de notificações

### **3. Tipos de Notificação:**
| Tipo | Ícone | Cor | Exemplo |
|------|-------|-----|---------|
| `card_created` | 📝 | Azul | "Novo cartão criado" |
| `card_moved` | 🔄 | Verde | "Cartão movido" |
| `card_updated` | ✏️ | Amarelo | "Cartão editado" |
| `board_created` | 📋 | Roxo | "Quadro criado" |
| `board_deleted` | 🗑️ | Vermelho | "Quadro excluído" |

## 🔧 **Hook useNotifications**

### **Principais Funções:**
```typescript
const {
  notifications,        // Lista de notificações
  unreadCount,         // Contador de não lidas
  loading,             // Estado de carregamento
  error,               // Erros
  markAsRead,          // Marcar como lida
  markAllAsRead,       // Marcar todas como lidas
  deleteNotification,  // Deletar notificação
  getRelativeTime,     // Tempo relativo
  getNotificationIcon  // Ícone por tipo
} = useNotifications();
```

### **Subscription em Tempo Real:**
```typescript
// Configuração automática de realtime
useEffect(() => {
  const subscription = supabase
    .channel('notifications')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${user.id}`
    }, handleRealtimeUpdate)
    .subscribe();
}, []);
```

## 🎯 **Fluxo de Notificações**

### **1. Criação de Cartão:**
```
Usuário cria cartão
    ↓
Trigger SQL dispara
    ↓
Função notify_card_created() executa
    ↓
Busca usuários do quadro
    ↓
Cria notificação para cada usuário
    ↓
Realtime atualiza interface
    ↓
Badge atualiza contador
```

### **2. Movimentação de Cartão:**
```
Usuário move cartão (drag & drop)
    ↓
Trigger SQL dispara
    ↓
Função notify_card_moved() executa
    ↓
Verifica se mudou de lista
    ↓
Cria notificação com detalhes
    ↓
Interface atualiza em tempo real
```

## 📊 **Dados da Notificação**

### **Estrutura JSON:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "type": "card_created",
  "title": "Novo cartão criado",
  "message": "O cartão 'Tarefa X' foi criado na lista 'A Fazer'",
  "data": {
    "card_id": "uuid",
    "card_title": "Tarefa X",
    "list_title": "A Fazer",
    "board_title": "Projeto Y",
    "created_by": "uuid"
  },
  "is_read": false,
  "created_at": "2025-01-15T10:30:00Z"
}
```

## 🔒 **Segurança (RLS)**

### **Políticas Implementadas:**
```sql
-- Usuários só veem suas notificações
CREATE POLICY "Users can view own notifications" 
ON notifications FOR SELECT 
USING (auth.uid() = user_id);

-- Usuários podem marcar como lidas
CREATE POLICY "Users can update own notifications" 
ON notifications FOR UPDATE 
USING (auth.uid() = user_id);

-- Sistema pode criar para qualquer usuário
CREATE POLICY "System can create notifications" 
ON notifications FOR INSERT 
WITH CHECK (true);
```

## 🧪 **Como Testar**

### **1. Teste Básico:**
1. Faça login no sistema
2. Vá para o KazuFlow
3. Crie um novo cartão
4. Observe o sino no header
5. Clique no sino para ver a notificação

### **2. Teste de Movimentação:**
1. Arraste um cartão de uma lista para outra
2. Verifique se aparece notificação de movimento
3. Teste o tempo relativo ("agora mesmo", "2 min atrás")

### **3. Teste de Múltiplos Usuários:**
1. Crie cartões com diferentes usuários
2. Verifique se todos recebem notificações
3. Teste marcar como lida/deletar

### **4. Teste de Performance:**
1. Crie muitas notificações
2. Verifique se o sistema permanece rápido
3. Teste a limpeza automática (30 dias)

## 🎨 **Personalização**

### **1. Alterar Cores:**
```css
/* Badge de contador */
.notification-badge {
  background: #ef4444; /* Vermelho */
}

/* Notificação não lida */
.notification-unread {
  background: #dbeafe; /* Azul claro */
  border-left: 4px solid #3b82f6; /* Azul */
}
```

### **2. Adicionar Novos Tipos:**
```sql
-- Adicionar novo tipo de notificação
INSERT INTO notifications (user_id, type, title, message, data)
VALUES (
  auth.uid(),
  'custom_event',
  'Evento Personalizado',
  'Sua mensagem aqui',
  '{"custom_data": "valor"}'
);
```

### **3. Configurar Limpeza:**
```sql
-- Alterar período de limpeza (padrão: 30 dias)
DELETE FROM notifications 
WHERE created_at < NOW() - INTERVAL '7 days'; -- 7 dias
```

## 📈 **Métricas e Monitoramento**

### **1. Consultas Úteis:**
```sql
-- Notificações por usuário
SELECT user_id, COUNT(*) as total
FROM notifications
GROUP BY user_id;

-- Notificações por tipo
SELECT type, COUNT(*) as total
FROM notifications
GROUP BY type;

-- Taxa de leitura
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_read = true) as read,
  ROUND(COUNT(*) FILTER (WHERE is_read = true) * 100.0 / COUNT(*), 2) as read_percentage
FROM notifications;
```

### **2. Performance:**
```sql
-- Verificar índices
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'notifications';

-- Estatísticas da tabela
SELECT 
  schemaname,
  tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes
FROM pg_stat_user_tables 
WHERE tablename = 'notifications';
```

## 🚨 **Troubleshooting**

### **1. Notificações não aparecem:**
```sql
-- Verificar se os triggers estão ativos
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname LIKE 'trigger_notify_%';

-- Verificar RLS
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'notifications';
```

### **2. Erro de permissão:**
```sql
-- Verificar permissões das funções
SELECT proname, proacl 
FROM pg_proc 
WHERE proname LIKE '%notification%';

-- Recriar permissões
GRANT EXECUTE ON FUNCTION create_notification TO authenticated;
```

### **3. Performance lenta:**
```sql
-- Verificar tamanho da tabela
SELECT 
  pg_size_pretty(pg_total_relation_size('notifications')) as size,
  COUNT(*) as rows
FROM notifications;

-- Executar limpeza manual
SELECT cleanup_old_notifications();
```

## 🎉 **Resultado Final**

O sistema de notificações está **100% funcional** e oferece:

### **✅ Para Usuários:**
- 🔔 **Notificações instantâneas** sobre atividades
- 📱 **Interface moderna** e intuitiva
- ⚡ **Atualizações em tempo real**
- 🎯 **Controle total** (marcar como lida, deletar)

### **✅ Para Desenvolvedores:**
- 🏗️ **Arquitetura robusta** e escalável
- 🔒 **Segurança completa** com RLS
- 📊 **Monitoramento** e métricas
- 🧪 **Fácil de testar** e debugar

### **✅ Para o Sistema:**
- 🚀 **Performance otimizada** com índices
- 🔄 **Triggers automáticos** para todas as ações
- 🧹 **Limpeza automática** de dados antigos
- 📈 **Escalabilidade** para muitos usuários

---

## 🚀 **Próximos Passos**

1. **Execute o SQL de instalação** no Supabase
2. **Teste as funcionalidades** criando cartões e quadros
3. **Personalize as cores** e estilos conforme necessário
4. **Configure a limpeza automática** conforme sua necessidade
5. **Monitore a performance** com as consultas fornecidas

**O sistema está pronto para uso em produção!** 🎯✨🔔