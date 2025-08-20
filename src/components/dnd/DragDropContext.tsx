import React from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { TrelloCard } from '../TrelloCard';

interface DragDropContextProps {
  children: React.ReactNode;
  lists: any[];
  onCardMove: (cardId: string, sourceListId: string, targetListId: string, newPosition: number) => void;
  onCardReorder: (listId: string, cardId: string, newPosition: number) => void;
}

export const TrelloDragDropContext: React.FC<DragDropContextProps> = ({
  children,
  lists,
  onCardMove,
  onCardReorder,
}) => {
  const [activeCard, setActiveCard] = React.useState<any>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 1, // Mínimo para resposta instantânea
        tolerance: 2, // Reduzido para maior sensibilidade
        delay: 0, // Zero delay para início imediato
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    // Prevenir novo drag se já estiver processando
    if (isProcessing) return;
    
    const { active } = event;
    setIsDragging(true);
    
    // Encontrar o cartão ativo
    for (const list of lists) {
      const card = list.cards?.find((c: any) => c.id === active.id);
      if (card) {
        setActiveCard({ ...card, listId: list.id });
        break;
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    // Limpar estados de drag IMEDIATAMENTE
    setActiveCard(null);
    setIsDragging(false);

    // Prevenir processamento duplo
    if (isProcessing) {
      console.log('⚠️ Já processando, ignorando...');
      return;
    }

    if (!over || !active) {
      console.log('⚠️ Drag cancelado - sem destino válido');
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) {
      console.log('⚠️ Mesmo local - sem movimentação');
      return;
    }

    // Encontrar listas de origem e destino
    const sourceList = lists.find(list => 
      list.cards?.some((card: any) => card.id === activeId)
    );

    if (!sourceList) {
      console.warn('❌ Lista de origem não encontrada para o cartão:', activeId);
      return;
    }

    // Verificar se estamos soltando sobre uma lista ou sobre um cartão
    const targetList = lists.find(list => list.id === overId) || 
                      lists.find(list => list.cards?.some((card: any) => card.id === overId));

    if (!targetList) {
      console.warn('❌ Lista de destino não encontrada para:', overId);
      return;
    }

    // Calcular nova posição
    let newPosition = 0;

    if (overId === targetList.id) {
      // Soltando na área vazia da lista
      newPosition = targetList.cards?.length || 0;
    } else {
      // Soltando sobre um cartão específico
      const overCardIndex = targetList.cards?.findIndex((card: any) => card.id === overId);
      newPosition = overCardIndex !== undefined ? overCardIndex : 0;
    }

    // ATUALIZAÇÃO OTIMISTA - Mover cartão na UI imediatamente
    const cardToMove = sourceList.cards?.find((card: any) => card.id === activeId);
    if (cardToMove) {
      // Remover da lista de origem
      sourceList.cards = sourceList.cards?.filter((card: any) => card.id !== activeId) || [];
      
      // Adicionar na lista de destino na posição correta
      const targetCards = [...(targetList.cards || [])];
      targetCards.splice(newPosition, 0, { ...cardToMove, list_id: targetList.id });
      targetList.cards = targetCards;
    }

    // Marcar como processando IMEDIATAMENTE
    setIsProcessing(true);

    try {
      // Executar a ação no servidor em background
      if (sourceList.id === targetList.id) {
        // Reordenação dentro da mesma lista
        const activeCardIndex = sourceList.cards?.findIndex((card: any) => card.id === activeId);
        if (activeCardIndex !== undefined && activeCardIndex !== newPosition) {
          console.log('🔄 Reordenando na mesma lista:', { activeCardIndex, newPosition });
          await onCardReorder(sourceList.id, activeId, newPosition);
        }
      } else {
        // Movimentação entre listas diferentes
        console.log('🔄 Movendo entre listas:', { sourceList: sourceList.id, targetList: targetList.id, newPosition });
        await onCardMove(activeId, sourceList.id, targetList.id, newPosition);
      }
    } catch (error) {
      console.error('❌ Erro durante drag and drop:', error);
      // Em caso de erro, reverter a mudança otimista
      window.location.reload(); // Força reload para sincronizar
    } finally {
      // Limpar o estado de processamento RAPIDAMENTE
      setTimeout(() => {
        setIsProcessing(false);
      }, 50); // Delay ainda menor para máxima responsividade
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {children}
      
      <DragOverlay>
        {activeCard && isDragging ? (
          <div className="rotate-2 opacity-95 shadow-lg">
            <TrelloCard
              card={activeCard}
              boardId=""
              listId=""
              isDragging={true}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};