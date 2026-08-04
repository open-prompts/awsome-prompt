/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Modal from './ui/Modal';
import Field from './ui/Field';
import { AddIcon, TrashIcon, CopyIcon } from './ui/Icons';
import { useTranslation } from 'react-i18next';
import { listAPIKeys, createAPIKey, deleteAPIKey } from '../services/api';
import Spinner from './ui/Spinner';
import './APIKeyManager.scss';

const APIKeyManager = ({ notification }) => {
  const { t, i18n } = useTranslation();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState(null);
  const [page] = useState(1);
  const [pageSize] = useState(10);

  const headers = [
    { key: 'name', header: t('api_keys.name', 'Name') },
    { key: 'prefix', header: t('api_keys.key', 'Key Prefix') },
    { key: 'created_at', header: t('api_keys.created_at', 'Created At') },
    { key: 'last_used_at', header: t('api_keys.last_used_at', 'Last Used') },
    { key: 'actions', header: '' },
  ];

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const res = await listAPIKeys({ page_size: pageSize, page: page });
      const data = res.data.api_keys || [];
      const formatted = data.map(k => ({
        id: k.id,
        name: k.name,
        prefix: k.prefix,
        created_at: new Date(k.created_at).toLocaleString(i18n.language),
        last_used_at: k.last_used_at ? new Date(k.last_used_at).toLocaleString(i18n.language) : '-',
      }));
      setKeys(formatted);
    } catch (err) {
      if (notification) notification({ kind: 'error', title: t('common.error'), subtitle: t('api_keys.error_fetch') });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, [page, pageSize]);

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;
    try {
      const res = await createAPIKey({ name: newKeyName });
      setGeneratedKey(res.data.api_key);
      setNewKeyName('');
      fetchKeys(); // Refresh list
    } catch (err) {
      if (notification) notification({ kind: 'error', title: t('common.error'), subtitle: t('api_keys.error_create') });
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAPIKey(id);
      fetchKeys();
      if (notification) notification({ kind: 'success', title: t('common.success'), subtitle: t('api_keys.success_delete') });
    } catch (err) {
      if (notification) notification({ kind: 'error', title: t('common.error'), subtitle: t('api_keys.error_delete') });
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    if (notification) notification({ kind: 'info', title: t('common.success'), subtitle: t('api_keys.success_copy') });
  };

  // Custom Close handler for Modal to clear state when fully closed
  const handleModalClose = () => {
      setIsModalOpen(false);
      // clear generated key after a delay or immediately if user closes
      setGeneratedKey(null);
      setNewKeyName('');
  }

  return (
    <>
      <div className="api-key-manager">
        <div className="header-section">
            <h3>{t('api_keys.list_title', 'Your API Keys')}</h3>
          <button className="btn btn-primary btn-sm" onClick={() => setIsModalOpen(true)}>
            <AddIcon size={15} />
            {t('api_keys.generate_new', 'Generate New Key')}
          </button>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              {headers.map((header) => (
                <th key={header.key}>{header.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {keys.map((row) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td><span className="key-prefix">{row.prefix}...</span></td>
                <td>{row.created_at}</td>
                <td>{row.last_used_at}</td>
                <td>
                  <button
                    type="button"
                    className="btn-icon btn-danger"
                    title={t('api_keys.delete')}
                    aria-label={t('api_keys.delete')}
                    onClick={() => {
                        setKeyToDelete(row.id);
                        setDeleteModalOpen(true);
                    }}
                  >
                    <TrashIcon size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {keys.length === 0 && !loading && (
                <tr>
                    <td colSpan={5}>
                        <div className="empty-state">{t('api_keys.no_keys')}</div>
                    </td>
                </tr>
            )}
            {loading && (
                <tr>
                    <td colSpan={5}>
                        <div className="loading-state"><Spinner label={t('common.loading')} /></div>
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
      </div>

      {/* Create Modal */}
      {createPortal(
        <Modal
          open={isModalOpen}
          title={!generatedKey ? t('api_keys.modal_create_title') : t('api_keys.modal_created_title')}
          primaryLabel={!generatedKey ? t('api_keys.btn_generate') : t('api_keys.btn_done')}
          secondaryLabel={!generatedKey ? t('common.cancel') : ''}
          onPrimary={!generatedKey ? handleCreate : handleModalClose}
          onClose={handleModalClose}
          className="api-key-modal"
        >
          <div className="api-key-form">
            {!generatedKey ? (
                <Field id="key-name" label={t('api_keys.label_name')}>
                    <input
                        type="text"
                        className="input"
                        placeholder={t('api_keys.placeholder_name')}
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                    />
                </Field>
            ) : (
                <div className="generated-key-display">
                    <p className="warning-text">
                        {t('api_keys.generated_warning')}
                    </p>
                    <div className="key-copy-row">
                        <div className="key-input-wrapper">
                            <Field id="generated-key" label={t('api_keys.label_key')}>
                                <input
                                    type="text"
                                    className="input"
                                    value={generatedKey}
                                    readOnly
                                />
                            </Field>
                        </div>
                        <button
                            type="button"
                            className="btn btn-secondary copy-btn"
                            title={t('api_keys.copy_desc', 'Copy')}
                            onClick={() => copyToClipboard(generatedKey)}
                        >
                            <CopyIcon size={15} />
                            {t('api_keys.copy_desc', 'Copy')}
                        </button>
                    </div>
                </div>
            )}
          </div>
        </Modal>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {createPortal(
        <Modal
          open={deleteModalOpen}
          title={t('api_keys.delete')}
          subtitle={t('common.confirmation')}
          primaryLabel={t('common.delete')}
          secondaryLabel={t('common.cancel')}
          onClose={() => {
              setDeleteModalOpen(false);
              setKeyToDelete(null);
          }}
          onPrimary={() => {
              if (keyToDelete) {
                  handleDelete(keyToDelete);
              }
              setDeleteModalOpen(false);
              setKeyToDelete(null);
          }}
          danger
          className="api-key-modal"
        >
          <div className="api-key-form">
            <p className="delete-confirmation-text">
                {t('api_keys.confirm_delete', 'Are you sure you want to delete this API Key? This action cannot be undone.')}
            </p>
          </div>
        </Modal>,
        document.body
      )}
    </>
  );
};

export default APIKeyManager;
