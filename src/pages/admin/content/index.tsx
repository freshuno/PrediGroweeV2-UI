import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  Card,
  IconButton,
  Stack,
  Typography,
  TextField,
  CircularProgress,
  Switch,
  FormControlLabel,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import axios from 'axios';
import TopNavBar from '@/components/ui/TopNavBar/TopNavBar';
import Link from 'next/link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import Security from '@mui/icons-material/Security';
import Email from '@mui/icons-material/Email';
import Google from '@mui/icons-material/Google';
import Storage from '@mui/icons-material/Storage';
import Gavel from '@mui/icons-material/Gavel';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

// Icon map for PrivacyContent sections
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const iconMap = {
  Security,
  Email,
  Google,
  Storage,
  Gavel,
};

// Types
type AboutContent = {
  introduction: {
    title: string;
    content: string;
  };
  publications: {
    authors: string;
    year: string;
    title: string;
    publication: string;
    doi: string;
  }[];
  faq: {
    title: string;
    content: string;
  }[];
  team: {
    coordinator: {
      role: string;
      name: string;
      affiliation: string;
    };
    support: {
      name: string;
      affiliation: string;
    }[];
    developer: {
      role: string;
      name: string;
      affiliation: string;
    };
  };
};

type PrivacyContent = {
  sections: {
    title: string;
    icon: keyof typeof iconMap;
    content: string[];
  }[];
};

type Content = AboutContent | PrivacyContent | Record<string, unknown>;

const ContentAdminPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [content, setContent] = useState<Content>({});
  const [rawJson, setRawJson] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    open: boolean;
    path: string;
    index: number;
  }>({ open: false, path: '', index: -1 });

  const tabs = useMemo(() => ['about', 'contact', 'privacy'], []);

  const fetchContent = async (page: string) => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`/api/content/${page}`);
      setContent(response.data.content);
      setRawJson(JSON.stringify(response.data.content, null, 2));
    } catch {
      setError('Failed to fetch content');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (newValue: number) => {
    setActiveTab(newValue);
    fetchContent(tabs[newValue]);
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      await axios.post(`/api/content/${tabs[activeTab]}`, {
        content: isAdvancedMode ? JSON.parse(rawJson) : content,
      });
      setError(''); // Clear any previous errors
    } catch {
      setError('Failed to save content');
    } finally {
      setLoading(false);
    }
  };

  const getDefaultValue = (path: string): unknown => {
    const tab = tabs[activeTab];
    const pathParts = path.split(/\[|\]|\./).filter(Boolean);

    // Determine array type based on full path structure
    const fullPath = pathParts.join('.');

    switch (tab) {
      case 'about':
        if (fullPath.startsWith('publications'))
          return {
            authors: '',
            year: '',
            title: '',
            publication: '',
            doi: '',
          };
        if (fullPath.startsWith('faq')) return { title: '', content: '' };
        if (fullPath.startsWith('team.support'))
          return {
            name: '',
            affiliation: '',
          };
        if (fullPath.startsWith('team.coordinator'))
          return {
            role: '',
            name: '',
            affiliation: '',
          };
        if (fullPath.startsWith('team.developer'))
          return {
            role: '',
            name: '',
            affiliation: '',
          };
        return '';
      case 'privacy':
        if (fullPath.includes('content')) {
          return '';
        }
        if (fullPath.startsWith('sections'))
          return {
            title: '',
            icon: 'Security',
            content: [''],
          };
        return '';
      case 'contact':
        // Add contact-specific array types if needed
        return '';
      default:
        return '';
    }
  };

  const handleFieldChange = (path: string, value: unknown) => {
    const keys = path.split(/\.|\[|\]/).filter(Boolean);
    const updatedContent = JSON.parse(JSON.stringify(content));
    let current: Record<string, unknown> = updatedContent;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      const nextKey = keys[i + 1];

      if (!current[key]) {
        current[key] = isNaN(Number(nextKey)) ? {} : [];
      }

      if (Array.isArray(current[key]) && !current[key][Number(nextKey)]) {
        const index = Number(nextKey);
        if (!isNaN(index)) {
          current[key][index] = getDefaultValue(path);
        }
      }

      current = current[key] as Record<string, unknown>;
    }

    const lastKey = keys[keys.length - 1];
    if (Array.isArray(current) && !isNaN(Number(lastKey))) {
      current[Number(lastKey)] = value;
    } else {
      current[lastKey] = value;
    }

    setContent(updatedContent);
  };

  const handleAddItem = (path: string) => {
    const keys = path.split(/\.|\[|\]/).filter(Boolean);
    const updatedContent = JSON.parse(JSON.stringify(content));
    let current: Record<string, unknown> = updatedContent;

    // Traverse to the parent array
    for (const key of keys) {
      if (!current[key]) {
        current[key] = [];
      }
      current = current[key] as Record<string, unknown>;
    }

    // Get properly typed default value based on full path
    const defaultValue = getDefaultValue(path);

    // Handle nested arrays in content (e.g., privacy sections content)
    if (Array.isArray(current) && typeof defaultValue === 'object') {
      current.push(JSON.parse(JSON.stringify(defaultValue)));
    } else {
      (current as unknown as unknown[]).push(defaultValue);
    }

    setContent(updatedContent);
  };

  const handleRemoveItem = (path: string, index: number) => {
    setDeleteConfirmation({ open: true, path, index });
  };

  const confirmRemoveItem = () => {
    const { path, index } = deleteConfirmation;
    const keys = path.split(/\.|\[|\]/).filter(Boolean);
    const updatedContent = JSON.parse(JSON.stringify(content));
    let current: Record<string, unknown> = updatedContent;

    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]] as Record<string, unknown>;
    }

    const array = current[keys[keys.length - 1]] as unknown[];
    array.splice(index, 1);
    setContent(updatedContent);
    setDeleteConfirmation({ open: false, path: '', index: -1 });
  };

  const renderField = (label: string, value: unknown, path: string) => {
    if (typeof value === 'string') {
      return (
        <TextField
          fullWidth
          label={label}
          variant="outlined"
          value={value}
          onChange={(e) => handleFieldChange(path, e.target.value)}
          sx={{ mb: 2 }}
        />
      );
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      return (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>{label}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {Object.entries(value as Record<string, unknown>).map(([key, val]) => (
                <Grid item xs={12} key={key}>
                  {renderField(key, val, `${path}.${key}`)}
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>
      );
    } else if (Array.isArray(value)) {
      return (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>{label}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {value.map((item, index) => (
                <Grid item xs={12} key={index}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {renderField(`${label} ${index + 1}`, item, `${path}[${index}]`)}
                    <IconButton onClick={() => handleRemoveItem(path, index)}>
                      <RemoveIcon />
                    </IconButton>
                  </Box>
                </Grid>
              ))}
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => handleAddItem(path)}
                >
                  Add Item
                </Button>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      );
    }
    return null;
  };

  const renderContentForm = () => {
    return (
      <Grid container spacing={2}>
        {Object.entries(content).map(([key, value]) => (
          <Grid item xs={12} key={key}>
            {renderField(key, value, key)}
          </Grid>
        ))}
        <Grid item xs={12}>
          <Button variant="contained" color="primary" onClick={handleSave} disabled={loading}>
            Save
          </Button>
        </Grid>
      </Grid>
    );
  };

  useEffect(() => {
    fetchContent(tabs[activeTab]);
  }, [activeTab, tabs]);

  return (
    <Box>
      <TopNavBar />
      <Box py={3} maxWidth="lg" mx="auto" px={{ md: 2, xs: 1 }}>
        <Typography variant="h4" gutterBottom>
          <IconButton LinkComponent={Link} href="/admin" sx={{ mr: 2 }}>
            <ArrowBackIcon color="primary" />
          </IconButton>
          Content Administration
        </Typography>
        <Stack direction="row" gap={2} mb={2}>
          {tabs.map((tab, index) => (
            <Button
              key={index}
              variant={activeTab === index ? 'contained' : 'outlined'}
              onClick={() => handleTabChange(index)}
              sx={{
                backgroundColor: activeTab === index ? 'primary.main' : '#ffff',
                borderRadius: 3,
                textTransform: 'capitalize',
              }}
            >
              <Typography>{tab}</Typography>
            </Button>
          ))}
        </Stack>
        <Card>
          <Box sx={{ p: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={isAdvancedMode}
                  onChange={(e) => setIsAdvancedMode(e.target.checked)}
                  color="primary"
                />
              }
              label="Advanced Mode"
              sx={{ mb: 2 }}
            />
            {loading ? (
              <CircularProgress />
            ) : error ? (
              <Typography color="error">{error}</Typography>
            ) : isAdvancedMode ? (
              <>
                <TextField
                  fullWidth
                  multiline
                  rows={20}
                  variant="outlined"
                  value={rawJson}
                  onChange={(e) => setRawJson(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <Button variant="contained" color="primary" onClick={handleSave} disabled={loading}>
                  Save
                </Button>
              </>
            ) : (
              renderContentForm()
            )}
          </Box>
        </Card>
      </Box>
      <ConfirmationModal
        open={deleteConfirmation.open}
        title="Confirm Deletion"
        message="Are you sure you want to delete this item?"
        onConfirm={confirmRemoveItem}
        onCancel={() => setDeleteConfirmation({ open: false, path: '', index: -1 })}
      />
    </Box>
  );
};

export default ContentAdminPage;
