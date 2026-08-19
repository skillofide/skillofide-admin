import React, { useMemo, useRef, useState } from 'react';
import Layout from '../../components/Layout';
import { useToast } from '../../components/Toast';
import { parseFile, toImportRows, downloadTemplate, downloadCredentials, type ParsedRow } from '../../lib/excel';
import { bulkImport, type BulkImportResponse } from '../../lib/api';
import { courseName } from '../../lib/courses';

const BulkImport: React.FC = () => {
  const { push } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<BulkImportResponse | null>(null);
  const [importedRows, setImportedRows] = useState<ParsedRow[]>([]);

  const validRows = useMemo(() => rows.filter((r) => r.errors.length === 0), [rows]);
  const invalidCount = rows.length - validRows.length;

  const onPick = async (file: File) => {
    setResult(null);
    setFileName(file.name);
    try {
      const parsed = await parseFile(file);
      setRows(parsed);
      if (parsed.length === 0) push('info', 'The file had no data rows.');
    } catch (e: any) {
      push('error', `Could not read file: ${e.message}`);
      setRows([]);
    }
  };

  const runImport = async () => {
    if (validRows.length === 0) return;
    setBusy(true);
    try {
      const res = await bulkImport(toImportRows(validRows));
      setImportedRows(validRows);
      setResult(res);
      push('success', `Imported ${res.success} of ${res.total}`);
    } catch (e: any) {
      push('error', e.message);
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setRows([]);
    setResult(null);
    setFileName('');
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <Layout
      title="Bulk import users"
      actions={<button className="secondary" onClick={downloadTemplate}>Download template</button>}
    >
      <div className="card card-pad mb">
        <p className="muted" style={{ marginTop: 0 }}>
          Upload an <strong>.xlsx</strong> or <strong>.csv</strong> file with columns:{' '}
          <code>name, email, phone, password, role, courses</code>. Password auto-generates when
          blank; <code>courses</code> is a comma-separated list of course ids or names. Existing
          emails are updated, not duplicated.
        </p>
        <div className="row">
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            style={{ maxWidth: 340 }}
            onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0])}
          />
          {rows.length > 0 && <button className="ghost" onClick={reset}>Clear</button>}
        </div>
        {fileName && <div className="muted mt">Loaded: {fileName}</div>}
      </div>

      {rows.length > 0 && !result && (
        <>
          <div className="row between mb">
            <div className="row">
              <span className="badge published">{validRows.length} ready</span>
              {invalidCount > 0 && <span className="badge archived">{invalidCount} with issues</span>}
            </div>
            <div className="row">
              <button className="secondary" disabled={validRows.length === 0} onClick={() => downloadCredentials(validRows)}>Download credentials</button>
              <button disabled={busy || validRows.length === 0} onClick={runImport}>
                {busy ? 'Importing…' : `Import ${validRows.length} user${validRows.length === 1 ? '' : 's'}`}
              </button>
            </div>
          </div>

          <div className="scroll-x">
            <table className="card">
              <thead>
                <tr>
                  <th>#</th><th>Name</th><th>Email</th><th>Phone</th>
                  <th>Role</th><th>Courses</th><th>Password</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.row} style={r.errors.length ? { background: 'var(--danger-bg)' } : undefined}>
                    <td>{r.row}</td>
                    <td>{r.name}</td>
                    <td>{r.email}</td>
                    <td>{r.phone || '—'}</td>
                    <td><span className={`badge ${r.role}`}>{r.role}</span></td>
                    <td>{r.course_ids.map((c) => <span key={c} className="chip">{courseName(c)}</span>)}</td>
                    <td className="muted">{r.password}</td>
                    <td>
                      {r.errors.length === 0
                        ? <span className="badge published">ok</span>
                        : <span className="err">{r.errors.join('; ')}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {result && (
        <>
          <div className="row mb">
            <div className="card stat"><div className="n">{result.total}</div><div className="l">Total</div></div>
            <div className="card stat"><div className="n" style={{ color: 'var(--success)' }}>{result.success}</div><div className="l">Imported</div></div>
            <div className="card stat"><div className="n" style={{ color: 'var(--danger)' }}>{result.failed}</div><div className="l">Failed</div></div>
            <button className="secondary" onClick={() => downloadCredentials(importedRows)}>Download credentials</button>
            <button className="secondary" onClick={reset}>Import another file</button>
          </div>
          <div className="scroll-x">
            <table className="card">
              <thead><tr><th>Email</th><th>Result</th><th>Message</th></tr></thead>
              <tbody>
                {result.results.map((r, i) => (
                  <tr key={i}>
                    <td>{r.email}</td>
                    <td>{r.success ? <span className="badge published">success</span> : <span className="badge archived">failed</span>}</td>
                    <td className="muted">{r.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Layout>
  );
};

export default BulkImport;
