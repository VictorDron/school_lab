import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import * as api from '@/lib/api';

interface TenantRow {
  id: string;
  slug: string;
  name: string;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
  _count: { users: number; leads: number };
}

interface CreateForm {
  slug: string;
  name: string;
  adminEmail: string;
  adminFullName: string;
  adminPassword: string;
}

const EMPTY_CREATE: CreateForm = {
  slug: '',
  name: '',
  adminEmail: '',
  adminFullName: '',
  adminPassword: '',
};

export default function PlatformTenantsPage() {
  const { user } = useAuthStore();
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<CreateForm>(EMPTY_CREATE);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Hard-stop for non-platform-admins. The backend also enforces this,
  // but routing them away client-side avoids a useless network round-trip.
  if (user && !user.isPlatformAdmin) {
    return <Navigate to="/launcher" replace />;
  }

  async function loadTenants() {
    setError(null);
    try {
      const res = await api.get<TenantRow[]>('/platform/tenants');
      setTenants(res.data ?? []);
    } catch (err) {
      setError(api.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTenants();
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      await api.post('/platform/tenants', {
        slug: createForm.slug,
        name: createForm.name,
        admin: {
          email: createForm.adminEmail,
          fullName: createForm.adminFullName,
          password: createForm.adminPassword || undefined,
        },
      });
      setCreateForm(EMPTY_CREATE);
      await loadTenants();
    } catch (err) {
      setCreateError(api.getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  async function toggleStatus(tenant: TenantRow) {
    const next = tenant.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await api.patch(`/platform/tenants/${tenant.id}/status`, { status: next });
      await loadTenants();
    } catch (err) {
      setError(api.getErrorMessage(err));
    }
  }

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-neutral-900">Plataforma — Tenants</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Gestão cross-tenant — visível apenas para platform admins.
        </p>
      </header>

      {error && (
        <div className="card border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {/* Tenants list */}
      <section className="card p-6">
        <h2 className="text-base font-semibold text-neutral-900 mb-4">Tenants existentes</h2>
        {loading ? (
          <p className="text-neutral-500 text-sm">Carregando…</p>
        ) : tenants.length === 0 ? (
          <p className="text-neutral-500 text-sm">Nenhum tenant cadastrado.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-neutral-500 border-b">
              <tr>
                <th className="pb-2">Slug</th>
                <th className="pb-2">Nome</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Users</th>
                <th className="pb-2">Leads</th>
                <th className="pb-2">Criado</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id} className="border-b last:border-0">
                  <td className="py-2 font-mono text-xs">{t.slug}</td>
                  <td className="py-2">{t.name}</td>
                  <td className="py-2">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs ${
                        t.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="py-2">{t._count.users}</td>
                  <td className="py-2">{t._count.leads}</td>
                  <td className="py-2 text-xs text-neutral-500">
                    {new Date(t.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="py-2 text-right">
                    <button
                      type="button"
                      onClick={() => toggleStatus(t)}
                      className="text-xs underline text-neutral-700 hover:text-neutral-900"
                    >
                      {t.status === 'ACTIVE' ? 'Suspender' : 'Reativar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Create form */}
      <section className="card p-6">
        <h2 className="text-base font-semibold text-neutral-900 mb-4">Criar novo tenant</h2>
        <form onSubmit={onCreate} className="space-y-4 max-w-xl">
          {createError && (
            <div className="card border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {createError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Slug</label>
              <input
                className="input font-mono"
                value={createForm.slug}
                onChange={(e) => setCreateForm({ ...createForm, slug: e.target.value })}
                placeholder="acme"
                required
              />
            </div>
            <div>
              <label className="label">Nome</label>
              <input
                className="input"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="Acme Academy"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Email do admin inicial</label>
              <input
                className="input"
                type="email"
                value={createForm.adminEmail}
                onChange={(e) => setCreateForm({ ...createForm, adminEmail: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Nome do admin</label>
              <input
                className="input"
                value={createForm.adminFullName}
                onChange={(e) => setCreateForm({ ...createForm, adminFullName: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <label className="label">Senha inicial (opcional)</label>
            <input
              className="input"
              type="password"
              value={createForm.adminPassword}
              onChange={(e) => setCreateForm({ ...createForm, adminPassword: e.target.value })}
              placeholder="Vazio = admin precisa redefinir senha no primeiro login"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-md" disabled={creating}>
            {creating ? 'Criando…' : 'Criar tenant'}
          </button>
        </form>
      </section>
    </div>
  );
}
