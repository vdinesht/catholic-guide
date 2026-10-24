import { useEffect, useRef, useState, type FormEvent } from 'react';
import { api } from '../lib/api';
import { relativeTime } from '../lib/dates';
import type { Role, UserRow } from '../lib/types';
import { useApi } from '../lib/useApi';
import { initials } from './PortalLayout';
import { useToast } from './PortalContext';

const STATUS: Record<UserRow['status'], { label: string; dot: string; color: string }> = {
  ACTIVE: { label: 'Active', dot: 'PUBLISHED', color: 'var(--season-ordinary)' },
  INVITED: { label: 'Invited', dot: 'DRAFT', color: 'var(--ink-muted)' },
  DEACTIVATED: { label: 'Deactivated', dot: 'MISSING', color: 'var(--ink-muted)' },
};

export function UsersPage() {
  const { data, error, setData } = useApi<UserRow[]>('/api/portal/users');
  const { show, fail } = useToast();
  const [inviting, setInviting] = useState(false);

  const replace = (u: UserRow) => setData((data ?? []).map((x) => (x.id === u.id ? u : x)));

  const changeRole = async (u: UserRow, role: Role) => {
    try {
      replace(await api.put<UserRow>(`/api/portal/users/${u.id}`, { role }));
      show(`${u.name} is now ${role === 'ADMIN' ? 'an Admin' : 'an Editor'}.`);
    } catch (e) {
      fail(e);
    }
  };

  const toggle = async (u: UserRow) => {
    const status = u.status === 'DEACTIVATED' ? 'ACTIVE' : 'DEACTIVATED';
    try {
      replace(await api.put<UserRow>(`/api/portal/users/${u.id}`, { status }));
      show(status === 'DEACTIVATED' ? `${u.name} can no longer sign in.` : `${u.name} can sign in again.`);
    } catch (e) {
      fail(e);
    }
  };

  const resend = async (u: UserRow) => {
    try {
      await api.post(`/api/portal/users/${u.id}/resend-invite`);
      show(`Invite sent again to ${u.email}.`);
    } catch (e) {
      fail(e);
    }
  };

  return (
    <>
      <div className="page-bar">
        <div>
          <h1 className="ptitle">Users</h1>
          <p className="muted" style={{ margin: '6px 0 0', fontSize: 15 }}>
            People who can sign in to the portal. There are no passwords — each sign-in sends a one-time code to their email.
          </p>
        </div>
        <button type="button" className="btn btn-p" onClick={() => setInviting(true)}>
          Invite user
        </button>
      </div>
      {error && <p className="empty-state">{error.message}</p>}
      <section className="card tblwrap">
        <table className="tbl" style={{ minWidth: 760 }}>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Role</th>
              <th scope="col">Status</th>
              <th scope="col">Last sign-in</th>
              <th scope="col">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((u) => {
              const st = STATUS[u.status];
              return (
                <tr key={u.id}>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span className="avatar" aria-hidden="true" style={{ width: 32, height: 32, fontSize: 13 }}>
                        {initials(u.name)}
                      </span>
                      <span>
                        <span style={{ display: 'block', fontWeight: 600 }}>{u.name}</span>
                        <span className="muted" style={{ display: 'block', fontSize: 13 }}>
                          {u.email}
                        </span>
                      </span>
                    </span>
                  </td>
                  <td>
                    <select className="inp auto btn-sm" aria-label={`Role for ${u.name}`} value={u.role} disabled={u.isMe} onChange={(e) => changeRole(u, e.target.value as Role)} style={{ height: 36, fontSize: 14 }}>
                      <option value="ADMIN">Admin</option>
                      <option value="EDITOR">Editor</option>
                    </select>
                  </td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600, color: st.color }}>
                      <span className={`status-dot status-${st.dot}`} style={{ width: 8, height: 8 }} aria-hidden="true" />
                      {st.label}
                    </span>
                  </td>
                  <td className="muted" style={{ whiteSpace: 'nowrap' }}>
                    {relativeTime(u.lastSignInAt)}
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {u.status === 'INVITED' && (
                      <button type="button" className="btn btn-g btn-sm" onClick={() => resend(u)}>
                        Resend invite
                      </button>
                    )}
                    {u.isMe ? (
                      <span className="muted" style={{ fontSize: 13 }}>
                        You
                      </span>
                    ) : (
                      <button type="button" className="btn btn-g btn-sm" onClick={() => toggle(u)}>
                        {u.status === 'DEACTIVATED' ? 'Reactivate' : 'Deactivate'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
      <section className="card" style={{ padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: '12px 32px', fontSize: 14, lineHeight: '20px' }}>
        <div style={{ flex: '1 1 260px' }}>
          <strong style={{ display: 'block', fontWeight: 600 }}>Admin</strong>
          <span className="muted">Everything an Editor can do, plus invite and remove users, change roles and edit portal settings.</span>
        </div>
        <div style={{ flex: '1 1 260px' }}>
          <strong style={{ display: 'block', fontWeight: 600 }}>Editor</strong>
          <span className="muted">Create, edit, publish and unpublish readings, prayers and songs in every language.</span>
        </div>
      </section>

      {inviting && (
        <InviteDialog
          onClose={() => setInviting(false)}
          onInvited={(u) => {
            setData([...(data ?? []), u]);
            setInviting(false);
            show(`Invite sent to ${u.email}.`);
          }}
        />
      )}
    </>
  );
}

function InviteDialog({ onClose, onInvited }: { onClose: () => void; onInvited: (u: UserRow) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('EDITOR');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const first = useRef<HTMLInputElement>(null);

  useEffect(() => {
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      onInvited(await api.post<UserRow>('/api/portal/users', { name, email, role }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the invite.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form role="dialog" aria-modal="true" aria-labelledby="inv-h" className="dialog" onSubmit={submit}>
        <h2 id="inv-h" className="h3" style={{ fontSize: 20, lineHeight: '26px' }}>
          Invite a user
        </h2>
        <div>
          <label className="lbl" htmlFor="inv-n">
            Full name
          </label>
          <input ref={first} id="inv-n" className="inp" placeholder="e.g. Teresa Thomas" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="lbl" htmlFor="inv-e">
            Email
          </label>
          <input id="inv-e" className="inp" type="email" placeholder="name@example.org" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <p className="hint">They'll get an email with a link to the portal. After that, they sign in with a code sent to this address.</p>
        </div>
        <fieldset style={{ margin: 0, padding: 0, border: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <legend className="lbl">Role</legend>
          {(
            [
              ['EDITOR', 'Editor', 'Manage and publish content'],
              ['ADMIN', 'Admin', 'Content, users and settings'],
            ] as [Role, string, string][]
          ).map(([v, l, d]) => (
            <label key={v} className={role === v ? 'choice on' : 'choice'}>
              <input type="radio" name="role" checked={role === v} onChange={() => setRole(v)} />
              <span>
                <strong style={{ display: 'block', fontSize: 14 }}>{l}</strong>
                <span className="muted" style={{ fontSize: 13 }}>
                  {d}
                </span>
              </span>
            </label>
          ))}
        </fieldset>
        {error && (
          <p role="alert" className="field-error" style={{ margin: 0 }}>
            {error}
          </p>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-p" disabled={busy}>
            Send invite
          </button>
        </div>
      </form>
    </div>
  );
}
