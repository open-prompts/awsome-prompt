import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { TrashIcon } from './ui/Icons';
import { listTemplateAliases, createTemplateAlias, updateTemplateAlias, deleteTemplateAlias } from '../services/api';
import './TemplateAliasManager.scss';
import { useNotification } from '../context/NotificationContext';
import Spinner from './ui/Spinner';

const TemplateAliasManager = ({ templateId, versions = [] }) => {
  const { t } = useTranslation();
  const { addNotification } = useNotification();
  const [aliases, setAliases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newAliasName, setNewAliasName] = useState('');
  const [newAliasVersionId, setNewAliasVersionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAliases = useCallback(async () => {
    try {
      setLoading(true);
      const res = await listTemplateAliases(templateId);
      setAliases(res.data.aliases || []);
    } catch (err) {
      console.error('Failed to fetch aliases', err);
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    if (templateId) {
       fetchAliases();
    }
  }, [templateId, fetchAliases]);

  const handleCreateOrUpdate = async () => {
    if (!newAliasName || !newAliasVersionId) return;

    try {
      setIsSubmitting(true);
      const existing = aliases.find(a => a.alias_name === newAliasName);

      if (existing) {
        await updateTemplateAlias(templateId, newAliasName, { version_id: parseInt(newAliasVersionId) });
        addNotification({ kind: 'success', title: t('common.success'), subtitle: t('template_alias.success_update') });
      } else {
        await createTemplateAlias(templateId, { alias_name: newAliasName, version_id: parseInt(newAliasVersionId) });
        addNotification({ kind: 'success', title: t('common.success'), subtitle: t('template_alias.success_create') });
      }

      setNewAliasName('');
      setNewAliasVersionId('');
      fetchAliases();
    } catch (err) {
      addNotification({
        kind: 'error',
        title: t('common.error'),
        subtitle: t('template_alias.error_save')
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (aliasName) => {
    if (!window.confirm(t('template_alias.confirm_delete'))) return;

    try {
      await deleteTemplateAlias(templateId, aliasName);
      addNotification({ kind: 'success', title: t('common.success'), subtitle: t('template_alias.success_delete') });
      fetchAliases();
    } catch (err) {
      addNotification({ kind: 'error', title: t('common.error'), subtitle: t('template_alias.error_delete') });
    }
  };

  if (loading) return <Spinner label={t('common.loading')} />;

  return (
    <div className="template-alias-manager">
      <h3>{t('template_alias.title')}</h3>
      <p className="alias-manager-desc">
        {t('template_alias.description')}
      </p>

      <div className="alias-list">
        {aliases.length === 0 && (
          <div className="no-aliases">{t('template_alias.no_aliases')}</div>
        )}
        {aliases.map(alias => {
          const v = versions.find(v => v.id === alias.version_id);
          const vName = v ? `v${v.version}` : `ID: ${alias.version_id}`;
          return (
            <div key={alias.alias_name} className="alias-item">
              <div className="alias-info">
                <span className="alias-badge">{alias.alias_name}</span>
                <span className="icon-arrow"> → </span>
                <span className="alias-version">{vName}</span>
              </div>
              <button
                type="button"
                className="btn-icon btn-danger"
                aria-label={t('common.delete')}
                title={t('common.delete')}
                onClick={() => handleDelete(alias.alias_name)}
                disabled={alias.alias_name === 'latest'}
              >
                <TrashIcon size={15} />
              </button>
            </div>
          );
        })}
      </div>

      <div className="alias-form">
        <div className="field alias-field">
          <label className="field-label" htmlFor="alias-name">{t('template_alias.alias_name')}</label>
          <input
            id="alias-name"
            type="text"
            className="input"
            value={newAliasName}
            onChange={(e) => setNewAliasName(e.target.value)}
            placeholder={t('template_alias.alias_placeholder')}
          />
        </div>
        <div className="field alias-field">
          <label className="field-label" htmlFor="alias-version">{t('template_alias.target_version')}</label>
          <select
            id="alias-version"
            className="select"
            value={newAliasVersionId}
            onChange={(e) => setNewAliasVersionId(e.target.value)}
          >
            <option value="" disabled>{t('common.select')}</option>
            {versions.map(v => (
              <option key={v.id} value={v.id}>v{v.version}</option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="btn btn-primary alias-btn"
          onClick={handleCreateOrUpdate}
          disabled={!newAliasName || !newAliasVersionId || isSubmitting || newAliasName === 'latest'}
        >
          {aliases.some(a => a.alias_name === newAliasName)
            ? t('template_alias.update_btn')
            : t('template_alias.create_btn')}
        </button>
      </div>
    </div>
  );
};

export default TemplateAliasManager;
