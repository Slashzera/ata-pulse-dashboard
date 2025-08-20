import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { OptimizedCardList } from '../OptimizedCardList';

interface DroppableListProps {
  list: any;
  boardId: string;
  onUpdate?: () => void;
  children?: React.ReactNode;
}

export const DroppableList: React.FC<DroppableListProps> = ({
  list,
  boardId,
  onUpdate,
  children
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: list.id,
  });

  const cardIds = list.cards?.map((card: any) => card.id) || [];

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[20px] transition-all duration-200 rounded-lg ${
        isOver ? 'bg-gradient-to-br from-cyan-50/50 to-purple-50/50 ring-2 ring-cyan-300/50 shadow-lg' : ''
      }`}
    >
      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        <OptimizedCardList
          cards={list.cards || []}
          boardId={boardId}
          listId={list.id}
          onUpdate={onUpdate}
        />
      </SortableContext>
      {children}
    </div>
  );
};