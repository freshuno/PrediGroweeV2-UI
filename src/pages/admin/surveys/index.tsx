import React from 'react';
import {
  Alert,
  Box,
  Card,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  Button,
  IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import Link from 'next/link';

import TopNavBar from '@/components/ui/TopNavBar/TopNavBar';
import AdminClient from '@/Clients/AdminClient';
import { ADMIN_SERVICE_URL } from '@/Envs';
import { UserSurvey } from '@/types';

type SurveyRow = {
  userId: number;
  name: string;
  surname: string;
  gender: string | null;
  age: number | null;
  visionDefect: string | null;
  education: string | null;
  experience: string | null;
  country: string | null;
};

type SortKey = keyof SurveyRow;
type SortDir = 'asc' | 'desc';

const normalize = (s: UserSurvey | Record<string, unknown>): SurveyRow => {
  const r = s as Record<string, unknown>;
  const getStr = (a: string, b?: string): string | null => {
    const v = r[a] ?? (b ? r[b] : undefined);
    return typeof v === 'string' ? v : v == null ? null : String(v);
  };
  const getNum = (a: string, b?: string): number | null => {
    const v = r[a] ?? (b ? r[b] : undefined);
    if (typeof v === 'number') return Number.isFinite(v) ? v : null;
    if (typeof v === 'string') {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  };

  return {
    userId: getNum('userId', 'user_id') ?? -1,
    name: getStr('name') ?? '',
    surname: getStr('surname') ?? '',
    gender: getStr('gender'),
    age: getNum('age'),
    visionDefect: getStr('visionDefect', 'vision_defect'),
    education: getStr('education'),
    experience: getStr('experience'),
    country: getStr('country'),
  };
};

const SurveysAdminPage: React.FC = () => {
  const [rows, setRows] = React.useState<SurveyRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // filters
  const [query, setQuery] = React.useState('');
  const [gender, setGender] = React.useState('all');
  const [education, setEducation] = React.useState('all');
  const [experience, setExperience] = React.useState('all');

  // sorting
  const [sortKey, setSortKey] = React.useState<SortKey>('userId');
  const [sortDir, setSortDir] = React.useState<SortDir>('asc');

  // pagination
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(20);

  const adminClient = React.useMemo(() => new AdminClient(ADMIN_SERVICE_URL), []);

  React.useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await adminClient.getAllSurveyResponses(); // /api/admin/users/-/surveys
        const normalized = (Array.isArray(data) ? data : [data])
          .map(normalize)
          .filter((r) => r.userId !== -1);
        setRows(normalized);
      } catch {
        setError('Failed to load surveys');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [adminClient]);

  // options
  const genders = React.useMemo(
    () => Array.from(new Set(rows.map((r) => r.gender).filter(Boolean))) as string[],
    [rows]
  );
  const educations = React.useMemo(
    () => Array.from(new Set(rows.map((r) => r.education).filter(Boolean))) as string[],
    [rows]
  );
  const experiences = React.useMemo(
    () => Array.from(new Set(rows.map((r) => r.experience).filter(Boolean))) as string[],
    [rows]
  );

  // filtering
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      const matchQ =
        !q ||
        [r.name, r.surname, r.country, r.visionDefect, r.education, r.experience]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q)) ||
        String(r.userId).includes(q);
      const matchGender = gender === 'all' || (r.gender ?? '') === gender;
      const matchEdu = education === 'all' || (r.education ?? '') === education;
      const matchExp = experience === 'all' || (r.experience ?? '') === experience;
      return matchQ && matchGender && matchEdu && matchExp;
    });
  }, [rows, query, gender, education, experience]);

  // sorting
  const sorted = React.useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortDir === 'asc' ? va - vb : vb - va;
      }
      const sa = (va ?? '').toString().toLowerCase();
      const sb = (vb ?? '').toString().toLowerCase();
      if (sa < sb) return sortDir === 'asc' ? -1 : 1;
      if (sa > sb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  // pagination
  const paged = React.useMemo(() => {
    const start = page * rowsPerPage;
    return sorted.slice(start, start + rowsPerPage);
  }, [sorted, page, rowsPerPage]);

  const changeSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const exportCSV = () => {
    const header = [
      'user_id',
      'name',
      'surname',
      'gender',
      'age',
      'vision_defect',
      'education',
      'experience',
      'country',
    ];
    const lines = [header.join(',')];
    sorted.forEach((r) => {
      const vals = [
        r.userId,
        r.name,
        r.surname,
        r.gender ?? '',
        r.age ?? '',
        r.visionDefect ?? '',
        r.education ?? '',
        r.experience ?? '',
        r.country ?? '',
      ].map((v) => {
        const s = String(v);
        return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
      });
      lines.push(vals.join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `surveys_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const SortMark: React.FC<{ active: boolean }> = ({ active }) => {
    if (!active) return null;
    return sortDir === 'asc' ? (
      <ArrowDropUpIcon fontSize="inherit" />
    ) : (
      <ArrowDropDownIcon fontSize="inherit" />
    );
  };

  // --------- render like Users page ---------
  if (isLoading) {
    return (
      <Box>
        <TopNavBar />
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <Typography>Loading...</Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <TopNavBar />
        <Alert severity="error" sx={{ m: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <TopNavBar />
      <Box py={3} maxWidth="lg" mx="auto" px={{ md: 2, xs: 1 }}>
        <Typography variant="h4" gutterBottom>
          <IconButton LinkComponent={Link} href="/admin" sx={{ mr: 2 }}>
            <ArrowBackIcon color="primary" />
          </IconButton>
          Surveys
        </Typography>

        {/* Filters row */}
        <Box mb={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems="stretch">
            <TextField
              size="small"
              label="Search (name, country, ...)"
              sx={{ minWidth: { xs: '100%', md: 260 } }}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
            />
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Gender</InputLabel>
              <Select
                label="Gender"
                value={gender}
                onChange={(e: SelectChangeEvent) => {
                  setGender(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="all">All</MenuItem>
                {genders.map((g) => (
                  <MenuItem key={g} value={g}>
                    {g}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel>Education</InputLabel>
              <Select
                label="Education"
                value={education}
                onChange={(e: SelectChangeEvent) => {
                  setEducation(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="all">All</MenuItem>
                {educations.map((x) => (
                  <MenuItem key={x} value={x}>
                    {x}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Experience</InputLabel>
              <Select
                label="Experience"
                value={experience}
                onChange={(e: SelectChangeEvent) => {
                  setExperience(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="all">All</MenuItem>
                {experiences.map((x) => (
                  <MenuItem key={x} value={x}>
                    {x}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box flex={1} />
            <Button variant="outlined" onClick={exportCSV}>
              Export CSV
            </Button>
          </Stack>
        </Box>

        <Card>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell onClick={() => changeSort('userId')} sx={{ cursor: 'pointer' }}>
                    User ID <SortMark active={sortKey === 'userId'} />
                  </TableCell>
                  <TableCell onClick={() => changeSort('name')} sx={{ cursor: 'pointer' }}>
                    Name <SortMark active={sortKey === 'name'} />
                  </TableCell>
                  <TableCell onClick={() => changeSort('surname')} sx={{ cursor: 'pointer' }}>
                    Surname <SortMark active={sortKey === 'surname'} />
                  </TableCell>
                  <TableCell onClick={() => changeSort('gender')} sx={{ cursor: 'pointer' }}>
                    Gender <SortMark active={sortKey === 'gender'} />
                  </TableCell>
                  <TableCell onClick={() => changeSort('age')} sx={{ cursor: 'pointer' }}>
                    Age <SortMark active={sortKey === 'age'} />
                  </TableCell>
                  <TableCell>Vision defect</TableCell>
                  <TableCell>Education</TableCell>
                  <TableCell>Experience</TableCell>
                  <TableCell>Country</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paged.map((row) => (
                  <TableRow key={row.userId}>
                    <TableCell>{row.userId}</TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.surname}</TableCell>
                    <TableCell>
                      {row.gender ? (
                        <Chip size="small" label={row.gender} />
                      ) : (
                        <Chip size="small" variant="outlined" label="—" />
                      )}
                    </TableCell>
                    <TableCell>{row.age ?? '—'}</TableCell>
                    <TableCell>{row.visionDefect ?? '—'}</TableCell>
                    <TableCell>{row.education ?? '—'}</TableCell>
                    <TableCell>{row.experience ?? '—'}</TableCell>
                    <TableCell>{row.country ?? '—'}</TableCell>
                  </TableRow>
                ))}
                {paged.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <Box py={3} textAlign="center" color="text.secondary">
                        No results for current filters.
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={sorted.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 20, 50, 100]}
            labelRowsPerPage="Rows per page"
          />
        </Card>
      </Box>
    </Box>
  );
};

export default SurveysAdminPage;
