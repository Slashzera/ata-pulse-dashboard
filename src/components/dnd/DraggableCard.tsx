import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TrelloCard } from '../TrelloCard';

interface DraggableCardProps {
  card: any;
  boardId: string;
  listId: string;
  onUpdate?: () => void;
}

export const DraggableCard: React.FC<DraggableCardProps> = ({
  card,
  boardId,
  listId,
  onUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    disabled: isEditing, // Desabilitar drag quando estiver editando
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Aplicar listeners condicionalmente
  const dragProps = isEditing ? {} : { ...attributes, ...listeners };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...dragProps}
      className={isEditing ? "cursor-default" : "cursor-grab active:cursor-grabbing"}
    >
      <TrelloCard
        card={card}
        boardId={boardId}
        listId={listId}
        onUpdate={onUpdate}
        isDragging={isDragging}
        onEditingChange={setIsEditing} // Passar callback para controlar estado de edição
      />
    </div>
  );
};