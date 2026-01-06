import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  TextInput, 
  TextArea, 
  Select, 
  SelectItem,
  InlineNotification 
} from '@carbon/react';
import { useTranslation } from 'react-i18next';
import { createTemplate, getCategories } from '../services/api';

/**
 * CreateTemplateModal Component
 * A modal form for creating a new prompt template.
 * @param {Object} props - Component properties
 * @param {boolean} props.open - Whether the modal is open
 * @param {Function} props.onRequestClose - Function to call when closing the modal
 * @param {Function} props.onSuccess - Function to call when creation is successful
 */
const CreateTemplateModal = ({ open, onRequestClose, onSuccess }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    visibility: 'public',
    category: '',
    tags: '',
  });
  const [categories, setCategories] = useState([]);
  const [customCategory, setCustomCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch categories when the modal opens
  useEffect(() => {
    if (open) {
      loadCategories();
      // Reset form
      setFormData({
        title: '',
        description: '',
        content: '',
        visibility: 'public',
        category: '',
        tags: '',
      });
      setCustomCategory('');
      setError('');
    }
  }, [open]);

  const loadCategories = async () => {
    try {
      const response = await getCategories();
      const data = response.data;
      if (data && Array.isArray(data.categories)) {
        // Extract names from CategoryStats objects
        setCategories(data.categories.map(c => c.name));
      } else if (Array.isArray(data)) {
        setCategories(data);
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.error('Failed to load categories', err);
      // Fallback categories if API fails
      setCategories(['General', 'Writing', 'Coding', 'Business']);
    }
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!formData.title || !formData.content) {
      setError(t('create_template.error_required_fields')); // Ensure translation key exists or fallback
      return;
    }

    // Validate custom category if selected
    if (formData.category === 'create_new' && !customCategory.trim()) {
      setError(t('create_template.error_required_category') || "Please enter a category name");
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Prepare payload
      const payload = {
        ...formData,
        category: formData.category === 'create_new' ? customCategory.trim() : formData.category,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        type: 'user', // Default to user type
      };

      await createTemplate(payload);
      setLoading(false);
      onRequestClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Create template error:', err);
      setLoading(false);
      setError(t('create_template.error_submit'));
    }
  };

  return (
    <Modal
      open={open}
      modalHeading={t('create_template.title') || "Create New Template"}
      primaryButtonText={loading ? t('common.saving') || "Saving..." : t('common.create') || "Create"}
      secondaryButtonText={t('common.cancel') || "Cancel"}
      onRequestClose={onRequestClose}
      onRequestSubmit={handleSubmit}
      danger={false}
      selectorPrimaryFocus="#title"
    >
      {error && (
        <InlineNotification
          kind="error"
          title="Error"
          subtitle={error}
          lowContrast
          hideCloseButton
        />
      )}
      <div className="create-template-form">
        <TextInput
          id="title"
          labelText={t('create_template.label_title') || "Title"}
          placeholder="e.g. Code Review Assistant"
          value={formData.title}
          onChange={handleChange}
          required
          className="form-field"
        />
        
        <Select
          id="category"
          labelText={t('create_template.label_category') || "Category"}
          value={formData.category}
          onChange={handleChange}
          className="form-field"
        >
          <SelectItem value="" text="Choose a category" />
          {categories.map((cat, idx) => (
            <SelectItem key={idx} value={cat} text={cat} />
          ))}
          <SelectItem value="create_new" text={t('create_template.create_new_category') || "Create new category..."} />
        </Select>

        {formData.category === 'create_new' && (
          <TextInput
            id="customCategory"
            labelText={t('create_template.label_new_category') || "New Category Name"}
            placeholder="Enter new category name"
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            className="form-field"
            style={{ marginTop: '0.5rem' }}
          />
        )}

        <TextInput
          id="tags"
          labelText={t('create_template.label_tags') || "Tags"}
          placeholder="e.g. python, coding, review (comma separated)"
          value={formData.tags}
          onChange={handleChange}
          className="form-field"
        />

        <Select
          id="visibility"
          labelText={t('create_template.label_visibility') || "Visibility"}
          value={formData.visibility}
          onChange={handleChange}
          className="form-field"
        >
          <SelectItem value="public" text="Public" />
          <SelectItem value="private" text="Private" />
        </Select>

        <TextArea
          id="description"
          labelText={t('create_template.label_description') || "Description"}
          placeholder="Brief description of what this template does"
          value={formData.description}
          onChange={handleChange}
          className="form-field"
        />

        <TextArea
          id="content"
          labelText={t('create_template.label_content') || "Prompt Content"}
          placeholder="You are a helpful assistant..."
          value={formData.content}
          onChange={handleChange}
          required
          rows={10}
          className="form-field"
        />
      </div>
    </Modal>
  );
};

export default CreateTemplateModal;
