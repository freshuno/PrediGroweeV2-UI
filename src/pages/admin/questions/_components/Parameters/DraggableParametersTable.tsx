import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Parameter } from '@/types';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import SortableRow from './SortableRow';
import { useEffect, useState } from 'react';

interface ParametersTableProps {
  parameters: Parameter[];
  onOrderChange: (updatedParams: Parameter[]) => Promise<void>;
  isEditMode?: boolean;
}

const DraggableParametersTable = ({
  parameters,
  onOrderChange,
  isEditMode = false,
}: ParametersTableProps) => {
  const [items, setItems] = useState<Parameter[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setItems(parameters);
  }, [parameters]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === Number(active.id));
        const newIndex = items.findIndex((item) => item.id === Number(over?.id));

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSaveOrder = async () => {
    setIsSaving(true);
    try {
      const updatedParams = items.map((item, index) => ({
        ...item,
        order: index,
      }));
      await onOrderChange(updatedParams);
      setItems(updatedParams);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box>
      {isEditMode && (
        <Button variant="contained" onClick={handleSaveOrder} disabled={isSaving} sx={{ m: 2 }}>
          Save Order
        </Button>
      )}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell width="75px">
                <strong>ID</strong>
              </TableCell>
              <TableCell width="165px">
                <strong>Name</strong>
              </TableCell>
              <TableCell>
                <strong>Description</strong>
              </TableCell>
              <TableCell width="115px">
                <strong>Reference value</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={items.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                {items.map((param) => (
                  <SortableRow key={param.id} item={param} isEditMode={isEditMode} />
                ))}
              </SortableContext>
            </DndContext>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default DraggableParametersTable;
