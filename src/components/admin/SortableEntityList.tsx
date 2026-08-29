"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface SortableItem {
  id: string;
  label: string;
}

interface SortableEntityListProps {
  items: SortableItem[];
  onReorder(orderedIds: string[]): Promise<void> | void;
  onSelect?: (id: string) => void;
  selectedId?: string | undefined;
}

export function SortableEntityList({
  items,
  onReorder,
  onSelect,
  selectedId,
}: SortableEntityListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  async function handleDragEnd(event: DragEndEvent): Promise<void> {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const next = arrayMove(items, oldIndex, newIndex).map((item) => item.id);
    await onReorder(next);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={(event) => {
        void handleDragEnd(event);
      }}
    >
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="grid gap-2" aria-label="Список записей">
          {items.map((item) => (
            <SortableRow
              key={item.id}
              item={item}
              selected={item.id === selectedId}
              {...(onSelect ? { onSelect } : {})}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({
  item,
  selected,
  onSelect,
}: {
  item: SortableItem;
  selected: boolean;
  onSelect?: ((id: string) => void) | undefined;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`flex items-center gap-3 rounded-card border px-3 py-3 ${
        selected ? "border-forest bg-forest/5" : "border-sage/40 bg-background"
      }`}
    >
      <button
        type="button"
        className="cursor-grab rounded-control px-2 py-1 font-sans text-sm text-secondary"
        aria-label={`Переместить «${item.label}»`}
        {...attributes}
        {...listeners}
      >
        ⋮⋮
      </button>
      <button
        type="button"
        className="flex-1 text-left font-sans text-primary"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={() => onSelect?.(item.id)}
      >
        {item.label}
      </button>
    </li>
  );
}
