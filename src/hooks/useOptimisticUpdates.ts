import { useState, useCallback } from 'react';

interface Card {
  id: string;
  title: string;
  description?: string;
  position: number;
  list_id: string;
  created_by: string;
}

interface List {
  id: string;
  title: string;
  cards: Card[];
}

export const useOptimisticUpdates = () => {
  const [optimisticState, setOptimisticState] = useState<{
    pendingCards: Card[];
    pendingMoves: { cardId: string; fromListId: string; toListId: string; position: number }[];
  }>({
    pendingCards: [],
    pendingMoves: []
  });

  const addOptimisticCard = useCallback((listId: string, card: Partial<Card>) => {
    const tempCard: Card = {
      id: `temp-${Date.now()}`,
      title: card.title || '',
      description: card.description,
      position: card.position || 0,
      list_id: listId,
      created_by: 'current-user'
    };

    setOptimisticState(prev => ({
      ...prev,
      pendingCards: [...prev.pendingCards, tempCard]
    }));

    return tempCard;
  }, []);

  const addOptimisticMove = useCallback((cardId: string, fromListId: string, toListId: string, position: number) => {
    setOptimisticState(prev => ({
      ...prev,
      pendingMoves: [...prev.pendingMoves, { cardId, fromListId, toListId, position }]
    }));
  }, []);

  const clearOptimisticCard = useCallback((tempId: string) => {
    setOptimisticState(prev => ({
      ...prev,
      pendingCards: prev.pendingCards.filter(card => card.id !== tempId)
    }));
  }, []);

  const clearOptimisticMove = useCallback((cardId: string) => {
    setOptimisticState(prev => ({
      ...prev,
      pendingMoves: prev.pendingMoves.filter(move => move.cardId !== cardId)
    }));
  }, []);

  const applyOptimisticUpdates = useCallback((lists: List[]): List[] => {
    let updatedLists = [...lists];

    // Aplicar cartões pendentes
    optimisticState.pendingCards.forEach(pendingCard => {
      const listIndex = updatedLists.findIndex(list => list.id === pendingCard.list_id);
      if (listIndex !== -1) {
        updatedLists[listIndex] = {
          ...updatedLists[listIndex],
          cards: [...updatedLists[listIndex].cards, pendingCard]
        };
      }
    });

    // Aplicar movimentações pendentes
    optimisticState.pendingMoves.forEach(move => {
      const fromListIndex = updatedLists.findIndex(list => list.id === move.fromListId);
      const toListIndex = updatedLists.findIndex(list => list.id === move.toListId);
      
      if (fromListIndex !== -1 && toListIndex !== -1) {
        const cardToMove = updatedLists[fromListIndex].cards.find(card => card.id === move.cardId);
        
        if (cardToMove) {
          // Remover da lista de origem
          updatedLists[fromListIndex] = {
            ...updatedLists[fromListIndex],
            cards: updatedLists[fromListIndex].cards.filter(card => card.id !== move.cardId)
          };

          // Adicionar na lista de destino
          const targetCards = [...updatedLists[toListIndex].cards];
          targetCards.splice(move.position, 0, { ...cardToMove, list_id: move.toListId });
          
          updatedLists[toListIndex] = {
            ...updatedLists[toListIndex],
            cards: targetCards
          };
        }
      }
    });

    return updatedLists;
  }, [optimisticState]);

  return {
    addOptimisticCard,
    addOptimisticMove,
    clearOptimisticCard,
    clearOptimisticMove,
    applyOptimisticUpdates,
    optimisticState
  };
};