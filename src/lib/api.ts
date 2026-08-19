// Thin REST client for the admin + recruiter endpoints on the api-gateway.
// Every request carries the admin Bearer token. A 401 clears the session and
// bounces to /login.
import { getToken, logout } from './auth';

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const resp = await fetch(path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (resp.status === 401) {
    logout();
    window.location.href = '/login';
    throw new Error('Session expired. Please sign in again.');
  }

  const text = await resp.text();
  const data = text ? safeJson(text) : null;

  if (!resp.ok) {
    const msg =
      (data && (data.error || data.message)) || `Request failed (${resp.status})`;
    throw new Error(msg);
  }
  return data as T;
}

function safeJson(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminUserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  course_ids: string[];
  created_at: string;
}

export interface ListUsersResponse {
  users: AdminUserRow[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ImportUserRow {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role?: string;
  course_ids?: string[];
}

export interface ImportRowResult {
  email: string;
  success: boolean;
  message: string;
}

export interface BulkImportResponse {
  total: number;
  success: number;
  failed: number;
  results: ImportRowResult[];
}

// ─── Users (admin) ──────────────────────────────────────────────────────────

export const listUsers = (page = 1, pageSize = 50, search = '') =>
  request<ListUsersResponse>(
    'GET',
    `/api/admin/users?page=${page}&page_size=${pageSize}&search=${encodeURIComponent(search)}`,
  );

export const bulkImport = (users: ImportUserRow[]) =>
  request<BulkImportResponse>('POST', '/api/admin/bulk-import', { users });

export const updateUserRole = (id: string, role: string) =>
  request<{ success: boolean }>('PATCH', `/api/admin/users/${id}`, { role });

export interface UserPatch {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
}

// Only the provided fields are changed server-side. Phone is written to the
// profile row; name/email/role to the users row.
export const updateUser = (id: string, patch: UserPatch) =>
  request<{ success: boolean }>('PATCH', `/api/admin/users/${id}`, patch);

export const deleteUser = (id: string) =>
  request<{ success: boolean }>('DELETE', `/api/admin/users/${id}`);

export const grantCourse = (id: string, courseId: string) =>
  request<{ success: boolean }>('POST', `/api/admin/users/${id}/courses`, {
    course_id: courseId,
  });

export const revokeCourse = (id: string, courseId: string) =>
  request<{ success: boolean }>(
    'DELETE',
    `/api/admin/users/${id}/courses/${encodeURIComponent(courseId)}`,
  );

// ─── Course catalog ─────────────────────────────────────────────────────────

export interface CourseDto {
  id: string;
  name: string;
}

export const fetchCourses = () =>
  request<{ courses: CourseDto[] }>('GET', '/api/admin/courses');

// ─── Assessments / tests (recruiter API; admin passes the guard) ────────────

export interface McqOption {
  id?: string;
  body: string;
  is_correct?: boolean;
  order_index: number;
}

export interface McqQuestion {
  id?: string;
  company_id?: string;
  topic: string;
  difficulty: string; // Easy | Medium | Hard
  body: string;
  kind: string; // single | multiple | numeric
  explanation?: string;
  is_active: boolean;
  options: McqOption[];
}

export interface SectionQuestion {
  id?: string;
  section_id?: string;
  mcq_question_id?: string;
  problem_id?: string;
  marks: number;
  order_index: number;
  title?: string;
  difficulty?: string;
}

export interface Section {
  id?: string;
  assessment_id?: string;
  title: string;
  kind: string; // mcq | coding | descriptive
  order_index: number;
  duration_minutes?: number;
  cutoff_marks?: number;
  questions?: SectionQuestion[];
}

export interface Assessment {
  id?: string;
  company_id?: string;
  title: string;
  description?: string;
  purpose?: string; // practice | hiring
  duration_minutes: number;
  total_marks?: number;
  passing_marks?: number;
  negative_marking?: number;
  shuffle_questions?: boolean;
  shuffle_options?: boolean;
  allow_backtrack?: boolean;
  reveal_results?: boolean;
  status?: string; // draft | published | archived
  max_attempts?: number;
  sections?: Section[];
  question_count?: number;
  attempt_count?: number;
  created_at?: string;
}

export const listAssessments = (params = '') =>
  request<{ assessments: Assessment[]; total: number }>(
    'GET',
    `/api/recruiter/assessments${params ? `?${params}` : ''}`,
  );

export const createAssessment = (a: Assessment) =>
  request<{ id: string }>('POST', '/api/recruiter/assessments', a);

export const getAssessment = (id: string) =>
  request<Assessment>('GET', `/api/recruiter/assessments/${id}`);

export const updateAssessment = (id: string, a: Assessment) =>
  request<unknown>('PATCH', `/api/recruiter/assessments/${id}`, a);

export const deleteAssessment = (id: string) =>
  request<unknown>('DELETE', `/api/recruiter/assessments/${id}`);

export const publishAssessment = (id: string, publish: boolean) =>
  request<unknown>('POST', `/api/recruiter/assessments/${id}/publish`, {
    publish,
  });

export const upsertSection = (assessmentId: string, s: Section) =>
  request<{ id: string }>(
    'POST',
    `/api/recruiter/assessments/${assessmentId}/sections`,
    s,
  );

export const deleteSection = (assessmentId: string, sectionId: string) =>
  request<unknown>(
    'DELETE',
    `/api/recruiter/assessments/${assessmentId}/sections/${sectionId}`,
  );

export const setSectionQuestions = (
  assessmentId: string,
  sectionId: string,
  questions: SectionQuestion[],
) =>
  request<unknown>(
    'PUT',
    `/api/recruiter/assessments/${assessmentId}/sections/${sectionId}/questions`,
    { questions },
  );

// ─── Coding problems (problem-service, via GraphQL) ─────────────────────────

export interface ProblemSummary {
  id: string;
  title: string;
  difficulty: string;
}

async function graphql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const resp = await fetch('/api/graphql', {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });
  const body = await resp.json();
  if (body.errors?.length) throw new Error(body.errors[0].message || 'GraphQL error');
  return body.data as T;
}

export async function listProblems(search = ''): Promise<ProblemSummary[]> {
  const data = await graphql<{ listProblems: { problems: ProblemSummary[] } }>(
    `query($pageSize: Int){ listProblems(pageSize: $pageSize){ problems { id title difficulty } } }`,
    { pageSize: 300 },
  );
  const all = data.listProblems?.problems || [];
  const v = search.trim().toLowerCase();
  return v ? all.filter((p) => p.title.toLowerCase().includes(v)) : all;
}

// ─── MCQ bank ────────────────────────────────────────────────────────────────

export const listMcq = (params = '') =>
  request<{ questions: McqQuestion[]; total: number }>(
    'GET',
    `/api/recruiter/mcq-bank${params ? `?${params}` : ''}`,
  );

export const upsertMcq = (q: McqQuestion) =>
  request<{ id: string }>('POST', '/api/recruiter/mcq-bank', q);

export const deleteMcq = (id: string) =>
  request<unknown>('DELETE', `/api/recruiter/mcq-bank/${id}`);

export const importMcq = (questions: McqQuestion[]) =>
  request<{ imported: number }>('POST', '/api/recruiter/mcq-bank/import', {
    questions,
  });

// ─── Results ─────────────────────────────────────────────────────────────────

export interface AttemptSummary {
  id?: string;
  assessment_id?: string;
  user_name?: string;
  user_email?: string;
  attempt_no?: number;
  status?: string;
  started_at?: string;
  submitted_at?: string;
  score?: number;
  max_score?: number;
  percent?: number;
  passed?: boolean;
}

export const listAttempts = (assessmentId: string) =>
  request<{ attempts: AttemptSummary[]; total?: number }>(
    'GET',
    `/api/recruiter/assessments/${assessmentId}/attempts`,
  );

// The export endpoint needs the Bearer token, so we fetch it as a blob and
// trigger a client-side download rather than navigating to a bare URL.
export async function downloadResultsCsv(
  assessmentId: string,
  filename: string,
): Promise<void> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const resp = await fetch(
    `/api/recruiter/assessments/${assessmentId}/export.csv`,
    { headers },
  );
  if (!resp.ok) throw new Error(`Export failed (${resp.status})`);

  const blob = await resp.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
