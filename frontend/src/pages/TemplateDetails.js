import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  getTemplate,
  listTemplateVersions,
  updateTemplate,
  createPrompt,
  listPrompts,
  deletePrompt,
  deleteTemplate,
  toggleTemplateLike,
  toggleTemplateFavorite,
  forkTemplate
} from '../services/api';
import { Modal } from '@carbon/react';
import { useNotification } from '../context/NotificationContext';
import Layout from '../components/Layout';
import './TemplateDetails.scss';

const TemplateDetails = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [template, setTemplate] = useState(null);
  const [versions, setVersions] = useState([]);
  const [selectedVersionId, setSelectedVersionId] = useState(null);
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Social Stats
  const [isLiked, setIsLiked] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);

  // Loading States
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isDeletingTemplate, setIsDeletingTemplate] = useState(false);
  const [isDeletingPrompt, setIsDeletingPrompt] = useState(false);
  const [isForking, setIsForking] = useState(false);

  // Editor state
  const [editContent, setEditContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Generator state
  const [variableValues, setVariableValues] = useState([]);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [promptToDelete, setPromptToDelete] = useState(null);

  // Template Delete Modal State
  const [isTemplateDeleteModalOpen, setIsTemplateDeleteModalOpen] = useState(false);

  // Template Fork Modal State
  const [isForkModalOpen, setIsForkModalOpen] = useState(false);

  const { addNotification } = useNotification();

  // Initial Data Fetch
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [tplRes, verRes, pmtRes] = await Promise.all([
          getTemplate(id),
          listTemplateVersions(id, { page_size: 100 }), // Fetch enough versions
          user ? listPrompts({ template_id: id, owner_id: user.id }) : Promise.resolve({ data: { prompts: [] } })
        ]);

        setTemplate(tplRes.data.template);
        setVersions(verRes.data.versions || []);
        setPrompts(pmtRes.data.prompts || []);

        setIsLiked(tplRes.data.template.is_liked || false);
        setIsFavorited(tplRes.data.template.is_favorited || false);
        setLikesCount(tplRes.data.template.likes_count || 0);
        setFavoritesCount(tplRes.data.template.favorites_count || 0);

        // Select latest version by default
        if (tplRes.data.latest_version) {
          setSelectedVersionId(tplRes.data.latest_version.id);
          setEditContent(tplRes.data.latest_version.content);
        } else if (verRes.data.versions && verRes.data.versions.length > 0) {
            // Fallback if latest_version isn't in getTemplate response (e.g. older backend)
            setSelectedVersionId(verRes.data.versions[0].id);
            setEditContent(verRes.data.versions[0].content);
        }
      } catch (error) {
        console.error("Failed to load template data", error);
        addNotification({
          kind: 'error',
          title: t('common.error'),
          subtitle: t('template_details.error_load')
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, user]);

  // Handle Version Change
  const handleVersionChange = (e) => {
    const vId = parseInt(e.target.value);
    setSelectedVersionId(vId);
    const version = versions.find(v => v.id === vId);
    if (version) {
      setEditContent(version.content);
    }
  };

  // Handle Edit Save
  const handleSaveContent = async () => {
    setIsSaving(true);
    try {
      // Assuming updateTemplate creates a new version if content changes
      const updateData = {
        template_id: template.id,
        owner_id: template.owner_id,
        title: template.title,
        description: template.description,
        visibility: template.visibility,
        category: template.category,
        tags: template.tags,
        content: editContent
      };

      const res = await updateTemplate(template.id, updateData);

      // Update local state with new version
      const newVersion = res.data.new_version;
      setVersions([newVersion, ...versions]);
      setSelectedVersionId(newVersion.id);
      setIsEditing(false);
      addNotification({ kind: 'success', title: t('common.success'), subtitle: t('template_details.success_update') });
    } catch (error) {
      console.error("Failed to update template", error);
      addNotification({ kind: 'error', title: t('common.error'), subtitle: t('template_details.error_update') });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
        addNotification({ kind: 'error', title: t('common.error'), subtitle: t('template_details.error_login_like') });
        return;
    }
    const oldState = isLiked;
    setIsLiked(!oldState);
    setLikesCount(prev => oldState ? prev - 1 : prev + 1);

    try {
        await toggleTemplateLike(template.id);
    } catch (error) {
        // Revert
        setIsLiked(oldState);
        setLikesCount(prev => oldState ? prev + 1 : prev - 1);
        addNotification({ kind: 'error', title: t('common.error'), subtitle: t('template_details.error_like') });
    }
  };

  const handleFavorite = async () => {
    if (!user) {
        addNotification({ kind: 'error', title: t('common.error'), subtitle: t('template_details.error_login_favorite') });
        return;
    }
    const oldState = isFavorited;
    setIsFavorited(!oldState);
    setFavoritesCount(prev => oldState ? prev - 1 : prev + 1);

    try {
        await toggleTemplateFavorite(template.id);
    } catch (error) {
        // Revert
        setIsFavorited(oldState);
        setFavoritesCount(prev => oldState ? prev + 1 : prev - 1);
        addNotification({ kind: 'error', title: t('common.error'), subtitle: t('template_details.error_favorite') });
    }
  };

  // Parse Contnet for Placeholders ($$)
  // Returns array of static strings. Variables are between them.
  // e.g. "Hello $$, how are $$" -> ["Hello ", ", how are ", ""]
  const contentParts = useMemo(() => {
    const currentContent = isEditing ? editContent : (versions.find(v => v.id === selectedVersionId)?.content || '');
    return currentContent.split('$$');
  }, [editContent, isEditing, versions, selectedVersionId]);

  const variableCount = contentParts.length - 1;

  // Initialize variable inputs when content changes
  useEffect(() => {
    setVariableValues(new Array(variableCount).fill(''));
  }, [variableCount]);

  const handleVariableChange = (index, value) => {
    const newValues = [...variableValues];
    newValues[index] = value;
    setVariableValues(newValues);
  };

  // Generate Prompt Result
  const generatedContent = useMemo(() => {
    let result = '';
    contentParts.forEach((part, index) => {
      result += part;
      if (index < variableValues.length) {
        result += variableValues[index] || '';
      }
    });
    return result;
  }, [contentParts, variableValues]);

  // Handle Create Prompt
  const handleCreatePrompt = async () => {
    if (!user) {
        addNotification({ kind: 'error', title: t('common.error'), subtitle: t('template_details.error_login_save') });
        return;
    }
    setIsGenerating(true);
    try {
      const promptData = {
        template_id: template.id,
        version_id: selectedVersionId,
        owner_id: user.id,
        variables: variableValues
      };
      const res = await createPrompt(promptData);
      setPrompts([res.data.prompt, ...prompts]);
      addNotification({ kind: 'success', title: t('common.success'), subtitle: t('template_details.success_save_prompt') });
    } catch (error) {
      console.error("Failed to create prompt", error);
      addNotification({ kind: 'error', title: t('common.error'), subtitle: t('template_details.error_save_prompt') });
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Delete Prompt (Open Modal)
  const handleDeletePrompt = (promptId) => {
    setPromptToDelete(promptId);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete
  const confirmDeletePrompt = async () => {
    if (!promptToDelete) return;
    setIsDeletingPrompt(true);
    try {
      await deletePrompt(promptToDelete);
      setPrompts(prompts.filter(p => p.id !== promptToDelete));
      addNotification({ kind: 'success', title: t('common.success'), subtitle: t('template_details.success_delete_prompt') });
      setIsDeleteModalOpen(false); // Close ONLY on success or handle error carefully
    } catch (error) {
      console.error("Failed to delete prompt", error);
      addNotification({ kind: 'error', title: t('common.error'), subtitle: t('template_details.error_delete_prompt') });
    } finally {
      setIsDeletingPrompt(false);
      if (!isDeleteModalOpen) setPromptToDelete(null); // Clean up if closed
    }
  };

  // Handle Template Actions
  const handleShare = async () => {
    setIsSharing(true);
    try {
      // Create update payload with ALL required fields + new visibility
      const updateData = {
         template_id: template.id,
         owner_id: template.owner_id,
         title: template.title,
         description: template.description,
         category: template.category,
         tags: template.tags,
         visibility: "VISIBILITY_PUBLIC", // Change to public
         content: editContent // Keep current content
      };
      const res = await updateTemplate(template.id, updateData);
      setTemplate(res.data.template); // Update local state
      addNotification({ kind: 'success', title: t('common.success'), subtitle: t('template_details.success_share') });
    } catch (error) {
      console.error("Failed to share template", error);
      addNotification({ kind: 'error', title: t('common.error'), subtitle: t('template_details.error_share') });
    } finally {
      setIsSharing(false);
    }
  };

  const handleUnshare = async () => {
    setIsSharing(true);
    try {
      const updateData = {
         template_id: template.id,
         owner_id: template.owner_id,
         title: template.title,
         description: template.description,
         category: template.category,
         tags: template.tags,
         visibility: "VISIBILITY_PRIVATE", // Change to private
         content: editContent
      };
      const res = await updateTemplate(template.id, updateData);
      setTemplate(res.data.template);
      addNotification({ kind: 'success', title: t('common.success'), subtitle: t('template_details.success_unshare') });
    } catch (error) {
      console.error("Failed to unshare template", error);
      addNotification({ kind: 'error', title: t('common.error'), subtitle: t('template_details.error_unshare') });
    } finally {
      setIsSharing(false);
    }
  };

  const handleFork = () => {
    setIsForkModalOpen(true);
  };

  const confirmFork = async () => {
    setIsForking(true);
    try {
        const res = await forkTemplate(template.id);
        setIsForkModalOpen(false);
        addNotification({ kind: 'success', title: t('common.success'), subtitle: t('template_details.success_fork') });
        // Navigate to the new template
        // Assuming API returns { template: { id: ... }, version: ... }
        const newId = res.data.template.id;
        navigate(`/templates/${newId}`);
    } catch (error) {
        console.error("Failed to fork template", error);
        addNotification({ kind: 'error', title: t('common.error'), subtitle: t('template_details.error_fork') });
        setIsForkModalOpen(false); // Close on error too? Or let user retry? Carbon Modal usually closes.
    } finally {
        setIsForking(false);
    }
  };

  const confirmDeleteTemplate = async () => {
      setIsDeletingTemplate(true);
      try {
          await deleteTemplate(template.id);
          addNotification({ kind: 'success', title: t('common.success'), subtitle: t('template_details.success_delete') });
          // Navigate home after a short delay so user sees notification
          setTimeout(() => navigate('/'), 1000);
      } catch (error) {
          console.error("Failed to delete template", error);
          addNotification({ kind: 'error', title: t('common.error'), subtitle: t('template_details.error_delete') });
          setIsTemplateDeleteModalOpen(false); // Close on error
      } finally {
          setIsDeletingTemplate(false);
      }
  };

  // Copy to Clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent).then(() => {
        addNotification({ kind: 'success', title: t('common.success'), subtitle: t('card.copied') });
    });
  };

  // Handle Load Prompt
  const handleLoadPrompt = (prompt) => {
      if (prompt.variables && prompt.variables.length > 0) {
          // Note: If the version doesn't match the current selected version, variables mapping might be wrong.
          // Ideally we should switch to the prompt's version too, but keeping it simple for now.
          // Or at least warn if versions differ.
          setVariableValues(prompt.variables);
      }
  };

  if (loading) return <Layout showCreateButton={false}><div className="loading">{t('common.loading')}</div></Layout>;
  if (!template) return <Layout showCreateButton={false}><div className="not-found">{t('template_details.not_found')}</div></Layout>;

  return (
    <Layout showSidebar={false} showCreateButton={false}>
      <div className="template-details-page">
        <div className="header-actions">
          <div className="title-section">
            <div className="title-row">
              <h2>{template.title}</h2>
              <div className="social-actions">
                <button
                  className={`social-btn like ${isLiked ? 'active' : ''}`}
                  onClick={handleLike}
                  title={isLiked ? t('template_details.unlike') : t('template_details.like')}
                >
                  <span className="icon">{isLiked ? '❤️' : '🤍'}</span>
                  <span className="count">{likesCount}</span>
                </button>
                <button
                  className={`social-btn favorite ${isFavorited ? 'active' : ''}`}
                  onClick={handleFavorite}
                  title={isFavorited ? t('template_details.unfavorite') : t('template_details.favorite')}
                >
                  <span className="icon">{isFavorited ? '⭐' : '☆'}</span>
                  <span className="count">{favoritesCount}</span>
                </button>
              </div>
            </div>
            <div className="meta">
                <span>By {template.owner_id}</span>
                <span>•</span>
                <span className={`visibility ${template.visibility.toLowerCase()}`}>
                  {template.visibility === 'VISIBILITY_PUBLIC'
                    ? t('create_template.visibility_public')
                    : t('create_template.visibility_private')}
                </span>
                {template.tags && template.tags.map(tag => (
                    <span key={tag} className="tag">#{tag}</span>
                ))}
            </div>
            <p>{template.description}</p>
          </div>

          {user && (
              <div className="template-actions">
                  {user.id === template.owner_id ? (
                      <>
                        {template.visibility === 'VISIBILITY_PRIVATE' ? (
                            <button className="action-btn share" onClick={handleShare} disabled={isSharing}>
                                {isSharing ? 'Processing...' : t('template_details.share_public')}
                            </button>
                        ) : (
                            <button className="action-btn unshare" onClick={handleUnshare} disabled={isSharing}>
                                {isSharing ? 'Processing...' : t('template_details.unshare_private')}
                            </button>
                        )}
                        <button className="action-btn delete" onClick={() => setIsTemplateDeleteModalOpen(true)}>{t('template_details.delete_template')}</button>
                      </>
                  ) : (
                      <button className="action-btn fork" onClick={handleFork}>{t('template_details.fork_template')}</button>
                  )}
              </div>
          )}
        </div>

        <div className="content-layout">
          <div className="main-column">
            {/* Version Selection & Editor */}
            <div className="section template-content">
              <h3>{t('template_details.content_title')}</h3>

              <div className="version-selector">
                <label>{t('template_details.version_label')}</label>
                <select
                    value={selectedVersionId || ''}
                    onChange={handleVersionChange}
                    disabled={isEditing}
                >
                    {versions.map(v => (
                        <option key={v.id} value={v.id}>
                            v{v.version} ({new Date(v.created_at).toLocaleDateString()})
                        </option>
                    ))}
                </select>
              </div>

              {isEditing ? (
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                  />
              ) : (
                  <div className="preview-area">
                      <pre>{versions.find(v => v.id === selectedVersionId)?.content}</pre>
                  </div>
              )}

              <div className="actions">
                {isEditing ? (
                    <>
                        <button className="cancel-btn" onClick={() => setIsEditing(false)} disabled={isSaving}>{t('common.cancel')}</button>
                        <button className="save-btn" onClick={handleSaveContent} disabled={isSaving}>
                            {isSaving ? t('common.saving') : t('template_details.save_new_version')}
                        </button>
                    </>
                ) : (
                    user && user.id === template.owner_id && (
                        <button className="edit-btn" onClick={() => setIsEditing(true)}>{t('template_details.edit_template')}</button>
                    )
                )}
              </div>
            </div>

            {/* Prompt Generator */}
            <div className="section prompt-generator">
                <h3>{t('template_details.generate_prompt')}</h3>

                {variableCount > 0 ? (
                    <div className="variables-form">
                        {Array.from({ length: variableCount }).map((_, idx) => (
                            <div key={idx} className="form-group">
                                <label>{t('template_details.variable')} {idx + 1}</label>
                                <input
                                    type="text"
                                    value={variableValues[idx] || ''}
                                    onChange={(e) => handleVariableChange(idx, e.target.value)}
                                    placeholder={t('template_details.enter_value')}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="no-vars">{t('template_details.no_vars')}</p>
                )}

                <label className="result-label">{t('template_details.result_preview')}</label>
                <div className="preview-area">
                    <pre>{generatedContent}</pre>
                </div>

                <div className="generator-actions">
                    <button className="secondary" onClick={handleCopy}>{t('card.copy')}</button>
                    <button className="primary" onClick={handleCreatePrompt} disabled={isGenerating}>
                        {isGenerating ? t('common.saving') : t('template_details.save_prompt')}
                    </button>
                </div>
            </div>
          </div>

          <div className="sidebar-column">
            <div className="instruction-card">
                <h4>{t('template_details.how_to_use')}</h4>
                <p dangerouslySetInnerHTML={{ __html: t('template_details.instruction_1') }}></p>
                <p dangerouslySetInnerHTML={{ __html: t('template_details.instruction_2') }}></p>
                <p>{t('template_details.instruction_3')}</p>
            </div>

            <div className="prompt-history">
                <h3>{t('template_details.saved_prompts')}</h3>
                <div className="prompt-list">
                    {prompts.length === 0 ? (
                        <div className="no-prompts">{t('template_details.no_saved_prompts')}</div>
                    ) : (
                        prompts.map(p => {
                            // Reconstruct content for display
                            // Note: This matches the *current* template version logic, but saved prompts
                            // refer to specific versions. Complex to reconstruct perfectly without fetching that specific version content
                            // For MVP, we just list them.
                            return (
                                <div key={p.id} className="prompt-item">
                                    <div className="prompt-meta">
                                        {new Date(p.created_at).toLocaleDateString()}
                                    </div>
                                    <div className="prompt-content">
                                        {t('template_details.variables_label')}: {p.variables ? p.variables.join(', ') : t('common.none')}
                                    </div>
                                    <div className="prompt-actions">
                                        <button
                                            className="load-btn"
                                            onClick={() => handleLoadPrompt(p)}
                                        >
                                            {t('template_details.load')}
                                        </button>
                                        <button
                                            className="delete-btn"
                                            onClick={() => handleDeletePrompt(p.id)}
                                        >
                                            {t('common.delete')}
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={isDeleteModalOpen}
        modalHeading={t('template_details.delete_prompt_title')}
        modalLabel={t('common.confirmation')}
        primaryButtonText={isDeletingPrompt ? t('common.deleting') : t('common.delete')}
        primaryButtonDisabled={isDeletingPrompt}
        secondaryButtonText={t('common.cancel')}
        danger
        onRequestClose={() => setIsDeleteModalOpen(false)}
        onRequestSubmit={confirmDeletePrompt}
      >
        <p>{t('template_details.delete_prompt_confirm')}</p>
      </Modal>

      <Modal
        open={isTemplateDeleteModalOpen}
        modalHeading={t('template_details.delete_template_title')}
        modalLabel={t('common.confirmation')}
        primaryButtonText={isDeletingTemplate ? t('common.deleting') : t('common.delete')}
        primaryButtonDisabled={isDeletingTemplate}
        secondaryButtonText={t('common.cancel')}
        danger
        onRequestClose={() => setIsTemplateDeleteModalOpen(false)}
        onRequestSubmit={confirmDeleteTemplate}
      >
        <p>{t('template_details.delete_template_confirm')}</p>
      </Modal>

      <Modal
        open={isForkModalOpen}
        modalHeading={t('template_details.fork_template_title')}
        modalLabel={t('common.confirmation')}
        primaryButtonText={isForking ? t('common.saving') : t('template_details.fork')}
        primaryButtonDisabled={isForking}
        secondaryButtonText={t('common.cancel')}
        onRequestClose={() => setIsForkModalOpen(false)}
        onRequestSubmit={confirmFork}
      >
        <p>{t('template_details.fork_template_confirm')}</p>
      </Modal>
    </Layout>
  );
};

export default TemplateDetails;
