import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  getTemplate, 
  listTemplateVersions, 
  updateTemplate, 
  createPrompt, 
  listPrompts, 
  deletePrompt 
} from '../services/api';
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
  
  // Editor state
  const [editContent, setEditContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  // Generator state
  const [variableValues, setVariableValues] = useState([]);
  const [generationResult, setGenerationResult] = useState('');

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

  // Handle Delete Prompt
  const handleDeletePrompt = async (promptId) => {
    if (!window.confirm("Are you sure you want to delete this prompt?")) return;
    try {
      await deletePrompt(promptId);
      setPrompts(prompts.filter(p => p.id !== promptId));
    } catch (error) {
      console.error("Failed to delete prompt", error);
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

  if (loading) return <Layout><div className="loading">Loading...</div></Layout>;
  if (!template) return <Layout><div className="not-found">Template not found.</div></Layout>;

  return (
    <Layout showSidebar={false}>
      <div className="notification-container">
        {notifications.map(n => (
          <div key={n.id} className={`notification-toast ${n.type}`}>
            {n.message}
          </div>
        ))}
      </div>
      <div className="template-details-page">
        <div className="header-actions">
          <button className="back-btn" onClick={() => navigate('/')}>
            &larr; Back to Home
          </button>
          <div className="title-section">
            <h2>{template.title}</h2>
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
    </Layout>
  );
};

export default TemplateDetails;
