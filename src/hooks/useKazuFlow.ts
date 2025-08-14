import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Board {
  id: string;
  title: string;
  description?: string;
  background_color: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  member_role: string;
}

interface List {
  id: string;
  board_id: string;
  title: string;
  position: number;
  cards: Card[];
}

interface Card {
  id: string;
  list_id: string;
  title: string;
  description?: string;
  position: number;
  due_date?: string;
  created_by: string;
  labels?: Label[];
  members?: CardMember[];
  checklists?: Checklist[];
  attachments?: Attachment[];
}

interface Label {
  id: string;
  name: string;
  color: string;
}

interface CardMember {
  id: string;
  user_id: string;
  user_name?: string;
}

interface Checklist {
  id: string;
  title: string;
  items: ChecklistItem[];
}

interface ChecklistItem {
  id: string;
  text: string;
  is_completed: boolean;
  position: number;
}

interface Attachment {
  id: string;
  filename: string;
  file_url: string;
  file_size?: number;
  mime_type?: string;
}

export const useKazuFlow = () => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [currentBoard, setCurrentBoard] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBoards = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Tentar usar a função RPC primeiro, depois fallback para consulta direta
      try {
        const { data, error } = await supabase.rpc('get_user_boards_simple');
        if (error) throw error;
        setBoards(data || []);
      } catch (rpcError) {
        // Fallback: buscar quadros diretamente da tabela
        const { data, error } = await supabase
          .from('trello_boards')
          .select(`
            id,
            title,
            description,
            background_color,
            created_by,
            created_at,
            updated_at
          `)
          .eq('is_deleted', false)
          .eq('created_by', user.id)
          .order('updated_at', { ascending: false });
        
        if (error) throw error;
        
        // Adicionar role como 'owner' para quadros criados pelo usuário
        const boardsWithRole = (data || []).map(board => ({
          ...board,
          member_role: 'owner'
        }));
        
        setBoards(boardsWithRole);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createBoard = useCallback(async (boardData: { 
    title: string; 
    description?: string; 
    background_color?: string 
  }) => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('trello_boards')
        .insert([{
          title: boardData.title,
          description: boardData.description,
          background_color: boardData.background_color || '#0079bf',
          created_by: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateBoard = useCallback(async (boardId: string, updates: { 
    title?: string; 
    description?: string; 
    background_color?: string 
  }) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('trello_boards')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', boardId)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const archiveBoard = useCallback(async (boardId: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log('Iniciando arquivamento do quadro:', boardId);

      // Tentar usar a função SQL primeiro
      try {
        const { data, error } = await supabase.rpc('archive_board_cascade', {
          board_uuid: boardId
        });

        if (error) throw error;
        
        console.log('Quadro arquivado via função SQL:', data);
        return data;
      } catch (rpcError) {
        console.warn('Função SQL falhou, usando método alternativo:', rpcError);
        
        // Método alternativo: passo a passo
        console.log('Buscando listas do quadro...');
        
        // First, get all lists in the board
        const { data: lists, error: listsQueryError } = await supabase
          .from('trello_lists')
          .select('id')
          .eq('board_id', boardId)
          .eq('is_deleted', false);

        if (listsQueryError) {
          console.error('Erro ao buscar listas:', listsQueryError);
          throw listsQueryError;
        }

        console.log(`Encontradas ${lists?.length || 0} listas`);

        // Archive all cards in the lists (if there are any lists)
        if (lists && lists.length > 0) {
          const listIds = lists.map(list => list.id);
          console.log('Arquivando cards das listas:', listIds);
          
          const { error: cardsError } = await supabase
            .from('trello_cards')
            .update({ is_deleted: true })
            .in('list_id', listIds);

          if (cardsError) {
            console.error('Erro ao arquivar cards:', cardsError);
            throw cardsError;
          }
          
          console.log('Cards arquivados com sucesso');
        }

        // Archive all lists in the board
        console.log('Arquivando listas do quadro...');
        const { error: listsError } = await supabase
          .from('trello_lists')
          .update({ is_deleted: true })
          .eq('board_id', boardId);

        if (listsError) {
          console.error('Erro ao arquivar listas:', listsError);
          throw listsError;
        }
        
        console.log('Listas arquivadas com sucesso');

        // Finally, archive the board
        console.log('Arquivando quadro...');
        const { error: boardError } = await supabase
          .from('trello_boards')
          .update({ is_deleted: true })
          .eq('id', boardId);

        if (boardError) {
          console.error('Erro ao arquivar quadro:', boardError);
          throw boardError;
        }
        
        console.log('Quadro arquivado com sucesso');
        return { success: true, message: 'Quadro arquivado com sucesso' };
      }
    } catch (err: any) {
      console.error('Erro detalhado ao arquivar quadro:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBoardDetails = useCallback(async (boardId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Tentar usar a função RPC primeiro
      try {
        const { data, error } = await supabase.rpc('get_board_details_simple', {
          board_uuid: boardId
        });
        if (error) throw error;
        setCurrentBoard(data);
        return data;
      } catch (rpcError) {
        // Fallback: buscar dados manualmente
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        // Buscar dados do quadro
        const { data: boardData, error: boardError } = await supabase
          .from('trello_boards')
          .select('*')
          .eq('id', boardId)
          .eq('is_deleted', false)
          .eq('created_by', user.id)
          .single();

        if (boardError) throw boardError;

        // Buscar listas do quadro
        const { data: listsData, error: listsError } = await supabase
          .from('trello_lists')
          .select('*')
          .eq('board_id', boardId)
          .eq('is_deleted', false)
          .order('position');

        if (listsError) throw listsError;

        // Buscar cartões para cada lista
        const listsWithCards = await Promise.all(
          (listsData || []).map(async (list) => {
            const { data: cardsData, error: cardsError } = await supabase
              .from('trello_cards')
              .select('*')
              .eq('list_id', list.id)
              .eq('is_deleted', false)
              .order('position');

            if (cardsError) throw cardsError;

            return {
              ...list,
              cards: cardsData || []
            };
          })
        );

        const result = {
          board: boardData,
          lists: listsWithCards
        };

        setCurrentBoard(result);
        return result;
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createList = useCallback(async (boardId: string, title: string) => {
    try {
      setError(null);

      // Get the highest position
      const { data: lists } = await supabase
        .from('trello_lists')
        .select('position')
        .eq('board_id', boardId)
        .eq('is_deleted', false)
        .order('position', { ascending: false })
        .limit(1);

      const newPosition = lists && lists.length > 0 ? lists[0].position + 1 : 0;

      const { data, error } = await supabase
        .from('trello_lists')
        .insert([{
          board_id: boardId,
          title,
          position: newPosition
        }])
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const updateList = useCallback(async (listId: string, updates: { title?: string; position?: number }) => {
    try {
      setError(null);

      const { data, error } = await supabase
        .from('trello_lists')
        .update(updates)
        .eq('id', listId)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const archiveList = useCallback(async (listId: string) => {
    try {
      setError(null);

      // Archive the list
      const { error: listError } = await supabase
        .from('trello_lists')
        .update({ is_deleted: true })
        .eq('id', listId);

      if (listError) throw listError;

      // Archive all cards in the list
      const { error: cardsError } = await supabase
        .from('trello_cards')
        .update({ is_deleted: true })
        .eq('list_id', listId);

      if (cardsError) throw cardsError;

      return true;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const createCard = useCallback(async (listId: string, title: string, description?: string) => {
    try {
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Get the highest position in the list
      const { data: cards } = await supabase
        .from('trello_cards')
        .select('position')
        .eq('list_id', listId)
        .eq('is_deleted', false)
        .order('position', { ascending: false })
        .limit(1);

      const newPosition = cards && cards.length > 0 ? cards[0].position + 1 : 0;

      const { data, error } = await supabase
        .from('trello_cards')
        .insert([{
          list_id: listId,
          title,
          description,
          position: newPosition,
          created_by: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const updateCard = useCallback(async (cardId: string, updates: Partial<Card>) => {
    try {
      setError(null);

      const { data, error } = await supabase
        .from('trello_cards')
        .update(updates)
        .eq('id', cardId)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const moveCard = useCallback(async (cardId: string, newListId: string, newPosition: number) => {
    try {
      setError(null);

      const { data, error } = await supabase
        .from('trello_cards')
        .update({
          list_id: newListId,
          position: newPosition
        })
        .eq('id', cardId)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const createLabel = useCallback(async (boardId: string, name: string, color: string) => {
    try {
      setError(null);

      const { data, error } = await supabase
        .from('trello_labels')
        .insert([{
          board_id: boardId,
          name,
          color
        }])
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const addLabelToCard = useCallback(async (cardId: string, labelId: string) => {
    try {
      setError(null);

      const { data, error } = await supabase
        .from('trello_card_labels')
        .insert([{
          card_id: cardId,
          label_id: labelId
        }])
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const createChecklist = useCallback(async (cardId: string, title: string) => {
    try {
      setError(null);

      const { data, error } = await supabase
        .from('trello_checklists')
        .insert([{
          card_id: cardId,
          title
        }])
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const addChecklistItem = useCallback(async (checklistId: string, text: string) => {
    try {
      setError(null);

      // Get the highest position
      const { data: items } = await supabase
        .from('trello_checklist_items')
        .select('position')
        .eq('checklist_id', checklistId)
        .order('position', { ascending: false })
        .limit(1);

      const newPosition = items && items.length > 0 ? items[0].position + 1 : 0;

      const { data, error } = await supabase
        .from('trello_checklist_items')
        .insert([{
          checklist_id: checklistId,
          text,
          position: newPosition
        }])
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const toggleChecklistItem = useCallback(async (itemId: string, isCompleted: boolean) => {
    try {
      setError(null);

      const { data, error } = await supabase.rpc('toggle_checklist_item', {
        item_uuid: itemId,
        is_completed: isCompleted
      });

      if (error) throw error;

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const updateCardDescription = useCallback(async (cardId: string, description: string) => {
    try {
      setError(null);

      const { data, error } = await supabase.rpc('update_card_description', {
        card_uuid: cardId,
        new_description: description
      });

      if (error) throw error;

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const updateCardTitle = useCallback(async (cardId: string, title: string) => {
    try {
      setError(null);

      // Primeiro, tentar usar a RPC
      try {
        const { data, error } = await supabase.rpc('update_card_title', {
          card_uuid: cardId,
          new_title: title
        });

        if (error) throw error;
        return data;
      } catch (rpcError) {
        console.warn('RPC failed, trying direct update:', rpcError);
        
        // Se a RPC falhar, usar UPDATE direto
        const { data, error } = await supabase
          .from('trello_cards')
          .update({ 
            title: title,
            updated_at: new Date().toISOString()
          })
          .eq('id', cardId)
          .eq('is_deleted', false)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const getCardDetails = useCallback(async (cardId: string) => {
    try {
      setError(null);

      const { data, error } = await supabase.rpc('get_card_details', {
        card_uuid: cardId
      });

      if (error) throw error;

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const updateChecklistItem = useCallback(async (itemId: string, text: string) => {
    try {
      setError(null);

      const { data, error } = await supabase.rpc('update_checklist_item', {
        item_uuid: itemId,
        new_text: text
      });

      if (error) throw error;

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const deleteChecklistItem = useCallback(async (itemId: string) => {
    try {
      setError(null);

      const { data, error } = await supabase.rpc('delete_checklist_item', {
        item_uuid: itemId
      });

      if (error) throw error;

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const deleteChecklist = useCallback(async (checklistId: string) => {
    try {
      setError(null);

      const { data, error } = await supabase.rpc('delete_checklist', {
        checklist_uuid: checklistId
      });

      if (error) throw error;

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const archiveCard = useCallback(async (cardId: string) => {
    try {
      setError(null);

      const { data, error } = await supabase.rpc('archive_card', {
        card_uuid: cardId
      });

      if (error) throw error;

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const setCardDueDate = useCallback(async (cardId: string, dueDate: string) => {
    try {
      setError(null);

      const { data, error } = await supabase.rpc('set_card_due_date', {
        card_uuid: cardId,
        due_date: dueDate
      });

      if (error) throw error;

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const moveCardToList = useCallback(async (cardId: string, listId: string, position?: number) => {
    try {
      setError(null);

      const { data, error } = await supabase.rpc('move_card_to_list', {
        card_uuid: cardId,
        target_list_uuid: listId,
        new_position: position
      });

      if (error) throw error;

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const getBoardLabels = useCallback(async (boardId: string) => {
    try {
      setError(null);

      const { data, error } = await supabase
        .from('trello_labels')
        .select('*')
        .eq('board_id', boardId)
        .order('name');

      if (error) throw error;

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const updateLabel = useCallback(async (labelId: string, name: string, color: string) => {
    try {
      setError(null);

      const { data, error } = await supabase
        .from('trello_labels')
        .update({ name, color })
        .eq('id', labelId)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const deleteLabel = useCallback(async (labelId: string) => {
    try {
      setError(null);

      const { data, error } = await supabase
        .from('trello_labels')
        .delete()
        .eq('id', labelId);

      if (error) throw error;

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const manageCardLabels = useCallback(async (cardId: string, labelIds: string[]) => {
    try {
      setError(null);

      const { data, error } = await supabase.rpc('manage_card_labels', {
        card_uuid: cardId,
        label_ids: labelIds
      });

      if (error) throw error;

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const getUserNotifications = useCallback(async (limit = 50) => {
    try {
      setError(null);

      const { data, error } = await supabase.rpc('get_user_notifications', {
        limit_count: limit
      });

      if (error) throw error;

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const getBoardTypes = useCallback(async () => {
    try {
      setError(null);

      const { data, error } = await supabase.rpc('get_board_types');

      if (error) throw error;

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const createBoardWithType = useCallback(async (boardData: {
    title: string;
    description?: string;
    background_color?: string;
    board_type_id: string;
    process_number?: string;
    responsible_person?: string;
    company?: string;
    object_description?: string;
    process_value?: number;
  }) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.rpc('create_board_with_type', {
        board_title: boardData.title,
        board_description: boardData.description,
        background_color: boardData.background_color || '#0079bf',
        board_type_uuid: boardData.board_type_id,
        process_number: boardData.process_number,
        responsible_person: boardData.responsible_person,
        company: boardData.company,
        object_description: boardData.object_description,
        process_value: boardData.process_value
      });

      if (error) throw error;

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    boards,
    currentBoard,
    loading,
    error,
    fetchBoards,
    createBoard,
    updateBoard,
    archiveBoard,
    fetchBoardDetails,
    createList,
    updateList,
    archiveList,
    createCard,
    updateCard,
    moveCard,
    createLabel,
    addLabelToCard,
    createChecklist,
    addChecklistItem,
    toggleChecklistItem,
    updateCardDescription,
    updateCardTitle,
    getCardDetails,
    updateChecklistItem,
    deleteChecklistItem,
    deleteChecklist,
    archiveCard,
    setCardDueDate,
    moveCardToList,
    getBoardLabels,
    updateLabel,
    deleteLabel,
    manageCardLabels,
    getUserNotifications,
    getBoardTypes,
    createBoardWithType
  };
};