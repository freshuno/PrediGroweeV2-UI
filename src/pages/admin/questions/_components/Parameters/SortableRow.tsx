import { TableCell, TableRow } from '@mui/material';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { Parameter } from '@/types';

interface Props {
  item: Parameter;
  isEditMode?: boolean;
}

export default function SortableRow({ item, isEditMode }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item?.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isEditMode ? 'grab' : 'default',
    backgroundColor: isDragging ? '#f5f5f5' : 'transparent',
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      {isEditMode && (
        <TableCell {...attributes} {...listeners}>
          <DragIndicatorIcon />
        </TableCell>
      )}
      <TableCell>{item?.id}</TableCell>
      <TableCell>{item?.name}</TableCell>
      <TableCell>{item?.description}</TableCell>
      <TableCell>{item?.referenceValues}</TableCell>
    </TableRow>
  );
}
