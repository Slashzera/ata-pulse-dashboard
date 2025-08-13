import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DraggableCard } from './DraggableCard';

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
      className={`min-h-[100px] transition-colors ${
        isOver ? 'bg-blue-50 ring-2 ring-blue-200' : ''
      }`}
    >
      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-1">
          {list.cards?.map((card: any) => (
            <DraggableCard
              key={card.id}
              card={card}
              boardId={boardId}
              listId={list.id}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      </SortableContext>
      {children}
    </div>
  );
};