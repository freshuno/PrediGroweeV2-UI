import TopNavBar from '@/components/ui/TopNavBar/TopNavBar';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Paper,
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
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Link from 'next/link';
import React from 'react';
import AdminClient from '@/Clients/AdminClient';
import { ADMIN_SERVICE_URL } from '@/Envs';

type UserSurveyName = {
  user_id?: number;
  userId?: number;
  name?: string | null;
  surname?: string | null;
};

type UserProgressRow = {
  userId: number;
  name: string;
  surname: string;
  total: number;
  correct: number;
  lastActivity?: string | null;
};


type UnknownRec = Record<string, unknown>;

function isNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function isString(v: unknown): v is string {
  return typeof v === 'string';
}

function asNumber(v: unknown, fallback = 0): number {
  if (isNumber(v)) return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function hasArrayData(x: unknown): x is { data: unknown[] } {
  if (typeof x !== 'object' || x === null) return false;
  const r = x as Record<string, unknown>;
  return Array.isArray(r['data']);
}

function pct(correct: number, total: number) {
  if (!total) return 0;
  return (correct / total) * 100;
}

function fmtPct(n: number) {
  return `${n.toFixed(1)}%`;
}

function safeStr(s?: string | null, fallback = ''): string {
  if (s === null || s === undefined) return fallback;
  return s;
}
<<<<<<< HEAD

=======
>>>>>>> 380579d3999f5542803cfd3b05122050410f9b71
function normalizeUserRow(
  rec: UnknownRec,
  namesByUser: Map<number, UserSurveyName>
): UserProgressRow | null {
  const uid: number | undefined = isNumber(rec.user_id)
    ? (rec.user_id as number)
    : isNumber(rec.userId)
      ? (rec.userId as number)
      : undefined;

  if (!uid) return null;

  const nameRec = namesByUser.get(uid) || {};
  const name = safeStr(nameRec.name, '(no name)');
  const surname = safeStr(nameRec.surname, '');

  const totalRaw =
    rec['total_answers'] ?? rec['totalAnswers'] ?? rec['answers_total'] ?? rec['total'];
  const correctRaw =
    rec['correct_answers'] ?? rec['correctAnswers'] ?? rec['answers_correct'] ?? rec['correct'];

  const total = asNumber(totalRaw, 0);
  const correct = asNumber(correctRaw, 0);

  const lastActivity: string | null = isString(rec.last_activity)
    ? (rec.last_activity as string)
    : isString(rec.lastActivity)
      ? (rec.lastActivity as string)
      : null;

  return {
    userId: uid,
    name,
    surname,
    total,
    correct,
    lastActivity,
  };
}

function exportCsv(filename: string, rows: UserProgressRow[]) {
  const header = ['user_id', 'name', 'surname', 'total_answers', 'correct_answers', 'overall_pct'];

  const lines = rows.map((r) => {
    const p = pct(r.correct, r.total);
    return [
      r.userId,
      `"${(r.name || '').replace(/"/g, '""')}"`,
      `"${(r.surname || '').replace(/"/g, '""')}"`,
      r.total,
      r.correct,
      p.toFixed(2),
    ].join(',');
  });

  const csv = [header.join(','), ...lines].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const UserProgressPage = () => {
  const adminClient = React.useMemo(() => new AdminClient(ADMIN_SERVICE_URL), []);
  const [allRows, setAllRows] = React.useState<UserProgressRow[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  // UI state
  const [query, setQuery] = React.useState('');
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(25);
  const [sortKey, setSortKey] = React.useState<'name' | 'answers' | 'correct' | 'overall'>(
    'overall'
  );
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('desc');

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const names = await adminClient.getAllUsersSurveys();
      const namesByUser = new Map<number, UserSurveyName>();
      names.forEach((n) => {
        const uid =
          (typeof n.user_id === 'number' ? n.user_id : undefined) ??
          (typeof n.userId === 'number' ? n.userId : undefined);
        if (uid) namesByUser.set(uid, n);
      });

      const statsResp: unknown = await adminClient.getAllUsersStats();

      if (process.env.NODE_ENV !== 'production') {
        try {
          const peek = Array.isArray(statsResp)
            ? statsResp[0]
            : hasArrayData(statsResp)
              ? (statsResp as { data: unknown[] }).data?.[0]
              : null;
          // eslint-disable-next-line no-console
          console.log('users-stats peek:', peek);
        } catch {
          // intentionally ignore peek errors in dev
        }
      }

      const list: UnknownRec[] = Array.isArray(statsResp)
        ? (statsResp as UnknownRec[])
        : hasArrayData(statsResp)
          ? (statsResp.data as UnknownRec[])
          : [];

      const normalized = list
        .map((rec) => normalizeUserRow(rec, namesByUser))
        .filter((x): x is UserProgressRow => Boolean(x));

      setAllRows(normalized);
    } catch (e) {
      console.error(e);
      setError('Failed to load user progress');
    } finally {
      setLoading(false);
    }
  }, [adminClient]);

  React.useEffect(() => {
    load();
  }, [load]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return allRows.filter((r) => {
      const matchesQuery =
        q.length === 0 ||
        r.userId.toString().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.surname.toLowerCase().includes(q);
      return matchesQuery;
    });
  }, [allRows, query]);

  const sorted = React.useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let av = 0;
      let bv = 0;
      switch (sortKey) {
        case 'name':
          return (
            `${a.surname} ${a.name}`.localeCompare(`${b.surname} ${b.name}`) *
            (sortDir === 'asc' ? 1 : -1)
          );
        case 'answers':
          av = a.total;
          bv = b.total;
          break;
        case 'correct':
          av = a.correct;
          bv = b.correct;
          break;
        case 'overall':
          av = pct(a.correct, a.total);
          bv = pct(b.correct, b.total);
          break;
      }
      if (av === bv) return 0;
      const res = av < bv ? -1 : 1;
      return sortDir === 'asc' ? res : -res;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const paged = React.useMemo(() => {
    const start = page * rowsPerPage;
    return sorted.slice(start, start + rowsPerPage);
  }, [sorted, page, rowsPerPage]);

  const changeSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'name' ? 'asc' : 'desc');
    }
  };

  if (loading) {
    return (
      <Box>
        <TopNavBar />
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <Typography>Loading...</Typography>
        </Box>
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
          User progress
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Card>
          <CardHeader title="Progress by user" />
          <CardContent>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={2}>
              <TextField
                label="Search (name, surname, ID)"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(0);
                }}
                fullWidth
              />
              <Box flexGrow={1} />
              <Button variant="outlined" onClick={() => exportCsv('user_progress.csv', sorted)}>
                Export CSV
              </Button>
            </Stack>

            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell onClick={() => changeSort('name')} sx={{ cursor: 'pointer' }}>
                      User {sortKey === 'name' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                    </TableCell>
                    <TableCell
                      align="right"
                      onClick={() => changeSort('answers')}
                      sx={{ cursor: 'pointer' }}
                    >
                      Answers {sortKey === 'answers' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                    </TableCell>
                    <TableCell
                      align="right"
                      onClick={() => changeSort('correct')}
                      sx={{ cursor: 'pointer' }}
                    >
                      Correct {sortKey === 'correct' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                    </TableCell>
                    <TableCell
                      align="right"
                      onClick={() => changeSort('overall')}
                      sx={{ cursor: 'pointer' }}
                    >
                      Overall {sortKey === 'overall' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paged.map((r) => {
                    const overallPct = fmtPct(pct(r.correct, r.total));
                    return (
                      <TableRow key={r.userId}>
                        <TableCell>
                          <Typography variant="body2">
                            <strong>#{r.userId}</strong> — {r.name} {r.surname}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{r.total}</TableCell>
                        <TableCell align="right">{r.correct}</TableCell>
                        <TableCell align="right">{overallPct}</TableCell>
                      </TableRow>
                    );
                  })}
                  {paged.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No data
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              rowsPerPageOptions={[10, 25, 50, 100]}
              count={sorted.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default UserProgressPage;
