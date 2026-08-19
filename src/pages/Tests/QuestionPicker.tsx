import React, { useEffect, useMemo, useState } from 'react';
import Modal from '../../components/Modal';
import { useToast } from '../../components/Toast';
import {
  listMcq,
  listProblems,
  setSectionQuestions,
  type McqQuestion,
  type ProblemSummary,
  type Section,
  type SectionQuestion,
} from '../../lib/api';

// Attach questions to a section. Coding sections draw from the problem-service
// problem list (problem_id); MCQ and descriptive sections draw from the MCQ bank
// (mcq_question_id). setSectionQuestions is a full replace, matching the backend.
interface Item {
  id: string;
  label: string;
  meta: string;
}

const QuestionPicker: React.FC<{
  assessmentId: string;
  section: Section;
  onClose: () => void;
  onSaved: () => void;
}> = ({ assessmentId, section, onClose, onSaved }) => {
  const { push } = useToast();
  const isCoding = section.kind === 'coding';
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    section.questions?.forEach((q) => {
      const id = isCoding ? q.problem_id : q.mcq_question_id;
      if (id) init[id] = q.marks || 1;
    });
    return init;
  });

  useEffect(() => {
    (async () => {
      try {
        if (isCoding) {
          const probs: ProblemSummary[] = await listProblems();
          setItems(probs.map((p) => ({ id: p.id, label: p.title, meta: p.difficulty })));
        } else {
          const res = await listMcq('pageSize=300');
          setItems(
            (res.questions || []).map((q: McqQuestion) => ({
              id: q.id!,
              label: q.body,
              meta: `${q.topic} · ${q.difficulty} · ${q.kind}`,
            })),
          );
        }
      } catch (e: any) {
        push('error', e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [isCoding, push]);

  const filtered = useMemo(() => {
    const v = search.trim().toLowerCase();
    if (!v) return items;
    return items.filter((it) => it.label.toLowerCase().includes(v) || it.meta.toLowerCase().includes(v));
  }, [items, search]);

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = { ...s };
      if (next[id] != null) delete next[id];
      else next[id] = 1;
      return next;
    });

  const setMarks = (id: string, marks: number) => setSelected((s) => ({ ...s, [id]: marks }));

  const save = async () => {
    setBusy(true);
    try {
      const questions: SectionQuestion[] = Object.entries(selected).map(([id, marks], i) =>
        isCoding
          ? { problem_id: id, marks: Number(marks) || 1, order_index: i }
          : { mcq_question_id: id, marks: Number(marks) || 1, order_index: i },
      );
      await setSectionQuestions(assessmentId, section.id!, questions);
      push('success', `${questions.length} question(s) attached`);
      onSaved();
    } catch (e: any) {
      push('error', e.message);
    } finally {
      setBusy(false);
    }
  };

  const count = Object.keys(selected).length;
  const emptyMsg = isCoding
    ? 'No coding problems available. Seed problems in the problem-service first.'
    : 'The question bank is empty. Add questions under Question Bank first.';

  return (
    <Modal title={`Questions — ${section.title}`} onClose={onClose} variant="drawer">
      <input
        className="mb"
        placeholder={isCoding ? 'Search problems…' : 'Search question bank…'}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <div className="muted">Loading…</div>
      ) : items.length === 0 ? (
        <div className="muted">{emptyMsg}</div>
      ) : (
        <div>
          {filtered.map((it) => {
            const on = selected[it.id] != null;
            return (
              <div key={it.id} className="card card-pad mb" style={{ background: on ? '#f3ead9' : 'var(--surface)' }}>
                <label className="row" style={{ alignItems: 'flex-start', gap: 8 }}>
                  <input
                    type="checkbox"
                    style={{ width: 'auto', marginTop: 3 }}
                    checked={on}
                    onChange={() => toggle(it.id)}
                  />
                  <span className="grow">
                    <div>{it.label}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{it.meta}</div>
                  </span>
                </label>
                {on && (
                  <div className="row mt" style={{ gap: 6 }}>
                    <span className="muted" style={{ fontSize: 12 }}>Marks</span>
                    <input
                      type="number"
                      min={1}
                      style={{ width: 80 }}
                      value={selected[it.id]}
                      onChange={(e) => setMarks(it.id, Number(e.target.value))}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="row mt" style={{ justifyContent: 'space-between', position: 'sticky', bottom: 0, background: 'var(--bg)', paddingTop: 10 }}>
        <span className="muted">{count} selected</span>
        <div className="row">
          <button className="secondary" onClick={onClose}>Cancel</button>
          <button disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save questions'}</button>
        </div>
      </div>
    </Modal>
  );
};

export default QuestionPicker;
