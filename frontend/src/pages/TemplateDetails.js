import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
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
import Layout from '../components/Layout';
import './TemplateDetails.scss';

const TemplateDetails = () => {
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

  // Notifications
  const [notifications, setNotifications] = useState([]);

  const showNotification = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  }, []);

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
        // Handle error (e.g. redirect or show message)
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
      showNotification('Template updated and new version created!', 'success');
    } catch (error) {
      console.error("Failed to update template", error);
      showNotification('Failed to update template.', 'error');
    }
  };

  const handleLike = async () => {
    if (!user) {
        showNotification("Please login to like templates", "error");
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
        showNotification("Failed to toggle like", "error");
    }
  };

  const handleFavorite = async () => {
    if (!user) {
        showNotification("Please login to favorite templates", "error");
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
        showNotification("Failed to toggle favorite", "error");
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
        showNotification("Please login to save prompts.", "error");
        return;
    }
    try {
      const promptData = {
        template_id: template.id,
        version_id: selectedVersionId,
        owner_id: user.id,
        variables: variableValues
      };
      const res = await createPrompt(promptData);
      setPrompts([res.data.prompt, ...prompts]);
      showNotification("Prompt saved successfully!", "success");
    } catch (error) {
      console.error("Failed to create prompt", error);
      showNotification("Failed to create prompt.", "error");
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
    try {
      await deletePrompt(promptToDelete);
      setPrompts(prompts.filter(p => p.id !== promptToDelete));
      showNotification("Prompt deleted successfully", "success");
    } catch (error) {
      console.error("Failed to delete prompt", error);
      showNotification("Failed to delete prompt", "error");
    } finally {
      setIsDeleteModalOpen(false);
      setPromptToDelete(null);
    }
  };

  // Handle Template Actions
  const handleShare = async () => {
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
      showNotification("Template is now Public", "success");
    } catch (error) {
      console.error("Failed to share template", error);
      showNotification("Failed to share template", "error");
    }
  };

  const handleUnshare = async () => {
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
      showNotification("Template is now Private", "success");
    } catch (error) {
      console.error("Failed to unshare template", error);
      showNotification("Failed to unshare template", "error");
    }
  };

  const handleFork = () => {
    setIsForkModalOpen(true);
  };

  const confirmFork = async () => {
    try {
        const res = await forkTemplate(template.id);
        setIsForkModalOpen(false);
        showNotification("Template forked successfully!", "success");
        // Navigate to the new template
        // Assuming API returns { template: { id: ... }, version: ... }
        const newId = res.data.template.id;
        navigate(`/templates/${newId}`);
    } catch (error) {
        console.error("Failed to fork template", error);
        showNotification("Failed to fork template", "error");
        setIsForkModalOpen(false);
    }
  };

  const confirmDeleteTemplate = async () => {
      try {
          await deleteTemplate(template.id);
          showNotification("Template deleted successfully", "success");
          // Navigate home after a short delay so user sees notification
          setTimeout(() => navigate('/'), 1000);
      } catch (error) {
          console.error("Failed to delete template", error);
          showNotification("Failed to delete template", "error");
          setIsTemplateDeleteModalOpen(false);
      }
  };

  // Copy to Clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent).then(() => {
        showNotification("Copied to clipboard!", "success");
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

  if (loading) return <Layout showCreateButton={false}><div className="loading">Loading...</div></Layout>;
  if (!template) return <Layout showCreateButton={false}><div className="not-found">Template not found.</div></Layout>;

  return (
    <Layout showSidebar={false} showCreateButton={false}>
      <div className="notification-container">
        {notifications.map(n => (
          <div key={n.id} className={`notification-toast ${n.type}`}>
            {n.message}
          </div>
        ))}
      </div>
      <div className="template-details-page">
        <div className="header-actions">
          <div className="title-section">
            <div className="title-row">
              <h2>{template.title}</h2>
              <div className="social-actions">
                <button
                  className={`social-btn like ${isLiked ? 'active' : ''}`}
                  onClick={handleLike}
                  title={isLiked ? "Unlike" : "Like"}
                >
                  <span className="icon">{isLiked ? '❤️' : '🤍'}</span>
                  <span className="count">{likesCount}</span>
                </button>
                <button
                  className={`social-btn favorite ${isFavorited ? 'active' : ''}`}
                  onClick={handleFavorite}
                  title={isFavorited ? "Unfavorite" : "Favorite"}
                >
                  <span className="icon">{isFavorited ? '⭐' : '☆'}</span>
                  <span className="count">{favoritesCount}</span>
                </button>
              </div>
            </div>
            <div className="meta">
                <span>By {template.owner_id}</span>
                <span>•</span>
                <span className={`visibility ${template.visibility.toLowerCase()}`}>{template.visibility}</span>
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
                            <button className="action-btn share" onClick={handleShare}>Share (Public)</button>
                        ) : (
                            <button className="action-btn unshare" onClick={handleUnshare}>Unshare (Private)</button>
                        )}
                        <button className="action-btn delete" onClick={() => setIsTemplateDeleteModalOpen(true)}>Delete Template</button>
                      </>
                  ) : (
                      <button className="action-btn fork" onClick={handleFork}>Fork Template</button>
                  )}
              </div>
          )}
        </div>

        <div className="content-layout">
          <div className="main-column">
            {/* Version Selection & Editor */}
            <div className="section template-content">
              <h3>Template Content</h3>

              <div className="version-selector">
                <label>Version:</label>
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
                        <button className="cancel-btn" onClick={() => setIsEditing(false)}>Cancel</button>
                        <button className="save-btn" onClick={handleSaveContent}>Save New Version</button>
                    </>
                ) : (
                    user && user.id === template.owner_id && (
                        <button className="edit-btn" onClick={() => setIsEditing(true)}>Edit Template</button>
                    )
                )}
              </div>
            </div>

            {/* Prompt Generator */}
            <div className="section prompt-generator">
                <h3>Generate Prompt</h3>

                {variableCount > 0 ? (
                    <div className="variables-form">
                        {Array.from({ length: variableCount }).map((_, idx) => (
                            <div key={idx} className="form-group">
                                <label>Variable {idx + 1}</label>
                                <input
                                    type="text"
                                    value={variableValues[idx] || ''}
                                    onChange={(e) => handleVariableChange(idx, e.target.value)}
                                    placeholder="Enter value..."
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="no-vars">No variables ($$) found in this template.</p>
                )}

                <div className="preview-area">
                    <label>Result Preview:</label>
                    <pre>{generatedContent}</pre>
                </div>

                <div className="generator-actions">
                    <button className="secondary" onClick={handleCopy}>Copy to Clipboard</button>
                    <button className="primary" onClick={handleCreatePrompt}>Save Prompt</button>
                </div>
            </div>
          </div>

          <div className="sidebar-column">
            <div className="instruction-card">
                <h4>How to use</h4>
                <p>Use <code>$$</code> as a placeholder in your template.</p>
                <p>Example: <code>Translate $$ to Spanish.</code></p>
                <p>When generating, inputs will appear for each placeholder.</p>
            </div>

            <div className="prompt-history">
                <h3>Your Saved Prompts</h3>
                <div className="prompt-list">
                    {prompts.length === 0 ? (
                        <div className="no-prompts">No prompts saved yet.</div>
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
                                        Variables: {p.variables ? p.variables.join(', ') : 'None'}
                                    </div>
                                    <div className="prompt-actions">
                                        <button
                                            className="load-btn"
                                            onClick={() => handleLoadPrompt(p)}
                                        >
                                            Load
                                        </button>
                                        <button
                                            className="delete-btn"
                                            onClick={() => handleDeletePrompt(p.id)}
                                        >
                                            Delete
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
        modalHeading="Delete Prompt"
        modalLabel="Confirmation"
        primaryButtonText="Delete"
        secondaryButtonText="Cancel"
        danger
        onRequestClose={() => setIsDeleteModalOpen(false)}
        onRequestSubmit={confirmDeletePrompt}
      >
        <p>Are you sure you want to delete this prompt? This action cannot be undone.</p>
      </Modal>

      <Modal
        open={isTemplateDeleteModalOpen}
        modalHeading="Delete Template"
        modalLabel="Confirmation"
        primaryButtonText="Delete"
        secondaryButtonText="Cancel"
        danger
        onRequestClose={() => setIsTemplateDeleteModalOpen(false)}
        onRequestSubmit={confirmDeleteTemplate}
      >
        <p>Are you sure you want to delete this entire template? All associated prompts and versions will be lost. This action cannot be undone.</p>
      </Modal>

      <Modal
        open={isForkModalOpen}
        modalHeading="Fork Template"
        modalLabel="Confirmation"
        primaryButtonText="Fork"
        secondaryButtonText="Cancel"
        onRequestClose={() => setIsForkModalOpen(false)}
        onRequestSubmit={confirmFork}
      >
        <p>Are you sure you want to fork this template to your private library? The latest version content will be copied.</p>
      </Modal>
    </Layout>
  );
};

export default TemplateDetails;
