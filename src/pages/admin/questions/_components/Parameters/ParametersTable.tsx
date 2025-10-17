import React from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Alert,
  Button,
  ToggleButton,
} from '@mui/material';
import ParametersTableRow from './ParametersTableRow';
import { Parameter } from '@/types';
import AdminClient from '@/Clients/AdminClient';
import { ADMIN_SERVICE_URL, IMAGES_SERVICE_URL } from '@/Envs';
import NewParameterRow from './NewParameterRow';
import ImagesClient from '@/Clients/ImagesClient';
import DraggableParametersTable from './DraggableParametersTable';
import { Reorder } from '@mui/icons-material';
import ButtonTooltipWrapper from '@/components/ui/ButtonTooltipWrapper';
import { useAuthContext } from '@/components/contexts/AuthContext';

const ParametersTable = () => {
  const [parameters, setParameters] = React.useState<Parameter[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showNewRow, setShowNewRow] = React.useState(false);
  const [editOrder, setEditOrder] = React.useState(false);
  const role = useAuthContext().userData.role;
  const canEdit = role === 'admin';

  const adminClient = React.useMemo(() => new AdminClient(ADMIN_SERVICE_URL), []);
  const imagesClient = React.useMemo(() => new ImagesClient(IMAGES_SERVICE_URL), []);

  const loadParameters = async () => {
    try {
      const data = await adminClient.getAllParameters();
      setParameters(data);
    } catch {
      setError('Failed to load parameters');
    } finally {
      setIsLoading(false);
    }
  };
  React.useEffect(() => {
    loadParameters();
  }, [adminClient]);

  const handleUpdate = async (param: Parameter, image?: File) => {
    try {
      await adminClient.updateParameter(param.id.toString(), param);
      if (image) {
        await imagesClient.uploadParamImage(param.id, image);
      }
      setParameters(parameters.map((p) => (p.id === param.id ? param : p)));
    } catch {
      setError('Failed to update parameter');
    }
  };

  const handleCreate = async (param: Omit<Parameter, 'id'>, image: File | null) => {
    try {
      const newParameter = await adminClient.createParameter(param);
      setParameters([...parameters, newParameter]);
      if (image && newParameter.id) {
        await imagesClient.uploadParamImage(newParameter.id, image);
      }
      setShowNewRow(false);
    } catch {
      setError('Failed to create parameter');
    }
  };

  const handleOrderChange = async (updatedParams: Parameter[]) => {
    try {
      await adminClient.updateParametersOrder(updatedParams);
      setParameters(updatedParams);
    } catch {
      setError('Failed to update parameters order');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await adminClient.deleteParameter(String(id));
      try {
        await imagesClient.deleteParamImage(id);
      } catch (e) {
<<<<<<< HEAD
=======
        // "no-empty" fix
>>>>>>> 380579d3999f5542803cfd3b05122050410f9b71
        console.warn(`Couldn't delete image for param ${id}:`, e);
      }
      setParameters((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setError('Failed to delete parameter');
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <>
      <TableContainer component={Paper}>
        <ButtonTooltipWrapper
          tooltipText="You are not allowed to edit parameters order"
          active={!canEdit}
        >
          <ToggleButton
            value="editOrder"
            selected={editOrder}
            disabled={!canEdit}
            onChange={() => {
              if (editOrder) {
                loadParameters();
              }
              setEditOrder(!editOrder);
            }}
            sx={{ m: 2 }}
          >
            <Reorder /> {editOrder ? 'Stop edit order mode' : 'Start edit order mode'}
          </ToggleButton>
        </ButtonTooltipWrapper>
        {editOrder ? (
          <DraggableParametersTable
            parameters={parameters}
            onOrderChange={handleOrderChange}
            isEditMode={true}
          />
        ) : (
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
                <TableCell width="100px" align="right">
                  <strong>Actions</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {parameters.map((param) => (
                <ParametersTableRow
                  key={param.id}
                  parameter={param}
                  handleUpdate={handleUpdate}
                  handleDelete={handleDelete}
                />
              ))}
              {showNewRow && (
                <NewParameterRow onSave={handleCreate} onCancel={() => setShowNewRow(false)} />
              )}
              <TableRow>
                <TableCell colSpan={6}>
                  <ButtonTooltipWrapper
                    tooltipText="You are not allowed to add new parameters"
                    active={!canEdit}
                  >
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      onClick={() => setShowNewRow(true)}
                      disabled={showNewRow || !canEdit}
                    >
                      Add new parameter
                    </Button>
                  </ButtonTooltipWrapper>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
      </TableContainer>
    </>
  );
};

export default ParametersTable;
