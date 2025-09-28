import React from 'react';
import {
  Box,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Parameter, ParameterValue, QuestionData } from '@/types';
import AdminClient from '@/Clients/AdminClient';

type ParametersEditorProps = {
  editMode: boolean;
  question: QuestionData;
  onChange: (question: QuestionData) => void;
  adminClient: AdminClient;
};

const validateNumber = (value: string): number => {
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
};

const createEmptyParameterValue = (parameterId: number): ParameterValue => ({
  id: parameterId,
  value1: 0,
  value2: 0,
  value3: 0,
});

const ParametersEditor: React.FC<ParametersEditorProps> = ({
  editMode,
  question,
  onChange,
  adminClient,
}) => {
  const [availableParameters, setAvailableParameters] = React.useState<Parameter[]>([]);
  const [selectedNewParameter, setSelectedNewParameter] = React.useState<number>(0);

  React.useEffect(() => {
    const fetchParameters = async () => {
      try {
        const allParams = await adminClient.getAllParameters();
        setAvailableParameters(
          allParams.filter((p: Parameter) => !question.case.parameters.some((ep) => ep.id === p.id))
        );
      } catch (error) {
        console.error('Failed to fetch parameters:', error);
      }
    };
    fetchParameters();
  }, [adminClient, question.case.parameters]);

  const handleParameterValueChange = (
    index: number,
    field: keyof ParameterValue,
    value: string
  ) => {
    const updatedQuestion = { ...question };
    const values = [...updatedQuestion.case.parametersValues];
    values[index] = {
      ...values[index],
      [field]: validateNumber(value),
    };
    updatedQuestion.case.parametersValues = values;
    onChange(updatedQuestion);
  };

  const handleAddParameter = () => {
    if (!selectedNewParameter) return;

    const newParameter = availableParameters.find((p) => p.id === selectedNewParameter);
    if (!newParameter) return;

    const updatedQuestion = { ...question };
    updatedQuestion.case.parameters = [...updatedQuestion.case.parameters, newParameter];
    updatedQuestion.case.parametersValues = [
      ...updatedQuestion.case.parametersValues,
      createEmptyParameterValue(selectedNewParameter),
    ];
    onChange(updatedQuestion);
    setSelectedNewParameter(0);
    setAvailableParameters((prev) => prev.filter((p) => p.id !== selectedNewParameter));
  };

  const handleRemoveParameter = (index: number) => {
    const updatedQuestion = { ...question };
    const removedParameter = updatedQuestion.case.parameters[index];

    updatedQuestion.case.parameters = updatedQuestion.case.parameters.filter((_, i) => i !== index);
    updatedQuestion.case.parametersValues = updatedQuestion.case.parametersValues.filter(
      (_, i) => i !== index
    );

    onChange(updatedQuestion);
    setAvailableParameters((prev) => [...prev, removedParameter]);
  };

  return (
    <Paper sx={{ p: 2 }}>
      {editMode && availableParameters.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Select
              value={selectedNewParameter}
              onChange={(e) => setSelectedNewParameter(Number(e.target.value))}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value={0}>Select parameter to add</MenuItem>
              {availableParameters.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name}
                </MenuItem>
              ))}
            </Select>
            <IconButton
              onClick={handleAddParameter}
              disabled={!selectedNewParameter}
              color="primary"
            >
              <AddIcon />
            </IconButton>
          </Stack>
        </Box>
      )}

      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Parameters
      </Typography>

      {question.case.parameters.map((param, index) => (
        <Box key={param.id} sx={{ my: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="subtitle2" sx={{ flex: 1 }}>
              {param.name}
            </Typography>
            {editMode && (
              <IconButton size="small" color="error" onClick={() => handleRemoveParameter(index)}>
                <DeleteIcon />
              </IconButton>
            )}
          </Stack>
          <Grid container spacing={2}>
            {['value1', 'value2', 'value3'].map((field) => (
              <Grid item xs={4} key={field}>
                {editMode ? (
                  <TextField
                    fullWidth
                    size="small"
                    value={question.case.parametersValues[index][field as keyof ParameterValue]}
                    onChange={(e) =>
                      handleParameterValueChange(
                        index,
                        field as keyof ParameterValue,
                        e.target.value
                      )
                    }
                    type="number"
                  />
                ) : (
                  <Typography>
                    {question.case.parametersValues[index][field as keyof ParameterValue]}
                  </Typography>
                )}
              </Grid>
            ))}
          </Grid>
        </Box>
      ))}
    </Paper>
  );
};

export default ParametersEditor;
