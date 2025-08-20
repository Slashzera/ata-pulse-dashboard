import React, { memo, useMemo } from 'react';
import { DraggableCard } from './dnd/DraggableCard';

interface OptimizedCardListProps {
  cards: any[];
  boardId: string;
  listId: string;
  onUpdate?: () => void;
}

export const OptimizedCardList: React.FC<OptimizedCardListProps> = memo(({
  cards,
  boardId,
  listId,
  onUpdate
}) => {
  // Memoizar a renderização dos cartões para evitar re-renders desnecessários
  const renderedCards = useMemo(() => {
    return cards.map((card: any) => (
      <DraggableCard
        key={card.id}
        card={card}
        boardId={boardId}
        listId={listId}
        onUpdate={onUpdate}
      />
    ));
  }, [cards, boardId, listId, onUpdate]);

  return (
    <div className="space-y-1">
      {renderedCards}
    </div>
  );
});

OptimizedCardList.displayName = 'OptimizedCardList';