import { useState, useEffect } from 'react';
import { Icon } from '../components/primitives/Icon';
import { PageHeader } from '../components/primitives/PageHeader';
import { Empty } from '../components/primitives/Empty';
import { useLang } from '../contexts/LangContext';
import { getApiKeys, createApiKey, deleteApiKey } from '../lib/api';
import { useToast } from '../contexts/ToastContext';

interface ApiKey {
  id: string;
  name: string;
  key_masked: string;
  last_used_at: string | null;
  created_at: string;
  raw_key?: string; // 생성 직후에만 포함
}

export function ApiKeys() {
  const lang = useLang();
  const { showToast } = useToast();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [newKeyId, setNewKeyId] = useState<string | null>(null); // 방금 생성된 키 id
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    getApiKeys().then(r => setKeys(r.data)).catch(() => {
      showToast(lang === 'en' ? 'Failed to load API keys.' : 'API 키 목록을 불러오지 못했습니다.', 'error');
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || creating) return;
    setCreating(true);
    try {
      const r = await createApiKey(newName.trim());
      setKeys(k => [r.data, ...k]);
      setNewKeyId(r.data.id);
      setNewName('');
      showToast(lang === 'en' ? 'API key created. Copy it now — it won\'t be shown again.' : 'API 키가 생성되었습니다. 지금 복사하세요.', 'success');
    } catch {
      showToast(lang === 'en' ? 'Failed to create API key.' : 'API 키 생성에 실패했습니다.', 'error');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(lang === 'en' ? 'Delete this API key? This action cannot be undone.' : 'API 키를 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.')) return;
    try {
      await deleteApiKey(id);
      setKeys(k => k.filter(x => x.id !== id));
      if (newKeyId === id) setNewKeyId(null);
      showToast(lang === 'en' ? 'API key deleted.' : 'API 키가 삭제되었습니다.', 'success');
    } catch {
      showToast(lang === 'en' ? 'Failed to delete API key.' : 'API 키 삭제에 실패했습니다.', 'error');
    }
  }

  function copyKey(id: string, value: string) {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 1800);
  }

  return (
    <div className="view-in" style={{ padding: '20px 24px 40px', maxWidth: 820, margin: '0 auto' }}>
      <PageHeader
        title={lang === 'en' ? 'API Keys' : 'API 키'}
        subtitle={lang === 'en'
          ? 'Create and manage API keys for programmatic access to your services.'
          : '서비스에 프로그래밍 방식으로 접근하기 위한 API 키를 생성하고 관리하세요.'}
      />

      {/* create form */}
      <div className="card card-pad" style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>
          {lang === 'en' ? 'Create new key' : '새 키 생성'}
        </div>
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: 10 }}>
          <input
            className="field"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder={lang === 'en' ? 'Key name (e.g. Production app)' : '키 이름 (예: 프로덕션 앱)'}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary" disabled={!newName.trim() || creating}>
            <Icon name="add" size={17} />
            {creating ? (lang === 'en' ? 'Creating…' : '생성 중…') : (lang === 'en' ? 'Create key' : '키 생성')}
          </button>
        </form>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 10 }}>
          {lang === 'en'
            ? 'The key will be shown once after creation. Store it securely.'
            : '키는 생성 후 한 번만 표시됩니다. 안전한 곳에 보관하세요.'}
        </div>
      </div>

      {/* key list */}
      {keys.length === 0 ? (
        <Empty
          icon="key"
          title={lang === 'en' ? 'No API keys yet' : 'API 키가 없어요'}
          sub={lang === 'en' ? 'Create a key above to get started.' : '위에서 키를 생성해 시작하세요.'}
        />
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ paddingTop: 14 }}>{lang === 'en' ? 'Name' : '이름'}</th>
                <th>{lang === 'en' ? 'Key' : '키'}</th>
                <th>{lang === 'en' ? 'Last used' : '마지막 사용'}</th>
                <th>{lang === 'en' ? 'Created' : '생성일'}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {keys.map(k => {
                const isNew = newKeyId === k.id && !!k.raw_key;
                const displayKey = isNew ? k.raw_key! : k.key_masked;
                return (
                  <tr key={k.id}>
                    <td style={{ fontWeight: 600 }}>{k.name}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <code className="t-mono" style={{ fontSize: 12.5, color: isNew ? 'var(--accent)' : 'var(--text-sec)' }}>
                          {displayKey}
                        </code>
                        {isNew && (
                          <button
                            className="icon-btn"
                            style={{ width: 26, height: 26 }}
                            title={lang === 'en' ? 'Copy' : '복사'}
                            onClick={() => copyKey(k.id, k.raw_key!)}
                          >
                            <Icon
                              name={copied === k.id ? 'check' : 'content_copy'}
                              size={14}
                              style={{ color: copied === k.id ? 'var(--success)' : 'var(--muted)' }}
                            />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="t-meta">
                      {k.last_used_at
                        ? new Date(k.last_used_at).toLocaleDateString()
                        : (lang === 'en' ? 'Never' : '사용 안 함')}
                    </td>
                    <td className="t-meta">{new Date(k.created_at).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleDelete(k.id)}
                        title={lang === 'en' ? 'Delete' : '삭제'}
                        style={{ color: 'var(--error)' }}
                      >
                        <Icon name="delete_outline" size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
