import React, { useState } from 'react';
import Modal from '../../components/Modal';
import { useToast } from '../../components/Toast';
import { bulkImport } from '../../lib/api';
import { useCourses } from '../../lib/courses';

const ROLES = ['student', 'recruiter', 'admin'];

// A single manual add reuses the bulk-import endpoint with a one-row payload —
// same validation and phone/course handling, no separate backend path needed.
const AddUserModal: React.FC<{ onClose: () => void; onCreated: () => void }> = ({
  onClose,
  onCreated,
}) => {
  const { push } = useToast();
  const catalog = useCourses();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [courses, setCourses] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const toggleCourse = (id: string) =>
    setCourses((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !email.trim() || !password) {
      setError('Name, email and password are required.');
      return;
    }
    setBusy(true);
    try {
      const res = await bulkImport([
        {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          password,
          role,
          course_ids: courses,
        },
      ]);
      const row = res.results[0];
      if (row && !row.success) {
        setError(row.message);
        return;
      }
      push('success', `User ${email} created`);
      onCreated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Add user" onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field">
          <label>Full name *</label>
          <input value={name} autoFocus onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label>Email *</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="row">
          <div className="field grow">
            <label>Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="field grow">
            <label>Temporary password *</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label>Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Enrolled courses</label>
          <div className="row wrap">
            {catalog.map((c) => (
              <label key={c.id} className="chip" style={{ cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  style={{ width: 'auto', marginRight: 6 }}
                  checked={courses.includes(c.id)}
                  onChange={() => toggleCourse(c.id)}
                />
                {c.name}
              </label>
            ))}
          </div>
        </div>

        {error && <div className="err mb">{error}</div>}

        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="secondary" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create user'}</button>
        </div>
      </form>
    </Modal>
  );
};

export default AddUserModal;
