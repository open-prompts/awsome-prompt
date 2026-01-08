import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../context/NotificationContext';
import { toggleTemplateLike, toggleTemplateFavorite } from '../services/api';
import './PromptCard.scss';

/**
 * PromptCard component.
 * Displays a single prompt template in a card format.
 * @param {Object} props - Component props
 * @param {Object} props.template - The template data
 */
const PromptCard = ({ template }) => {
  const { t } = useTranslation();
  const { addNotification } = useNotification();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(template.is_liked);
  const [likeCount, setLikeCount] = useState(template.like_count || 0);
  const [favorited, setFavorited] = useState(template.is_favorited);
  const [favCount, setFavCount] = useState(template.favorite_count || 0);

  const handleLike = async (e) => {
    e.stopPropagation();
    try {
      const resp = await toggleTemplateLike(template.id);
      setLiked(resp.data.is_liked);
      setLikeCount(resp.data.like_count);
    } catch (err) {
      console.error('Failed to toggle like', err);
      addNotification({ kind: 'error', title: t('common.error'), subtitle: t('prompt_card.error_like') });
    }
  };

  const handleFavorite = async (e) => {
    e.stopPropagation();
    try {
      const resp = await toggleTemplateFavorite(template.id);
      setFavorited(resp.data.is_favorited);
      setFavCount(resp.data.favorite_count);
    } catch (err) {
      console.error('Failed to toggle favorite', err);
      addNotification({ kind: 'error', title: t('common.error'), subtitle: t('prompt_card.error_favorite') });
    }
  };

  return (
    <div className="prompt-card" onClick={() => navigate(`/templates/${template.id}`)} style={{ cursor: 'pointer' }}>
      <div className="card-header">
        <h4 className="title">{template.title}</h4>
        <span className={`visibility ${template.visibility.toLowerCase()}`}>
          {template.visibility === 'VISIBILITY_PUBLIC' ? t('create_template.visibility_public') : t('create_template.visibility_private')}
        </span>
      </div>
      <p className="description">{template.description}</p>
      {template.latest_version && (
        <div className="content-preview">
          <pre>{template.latest_version.content}</pre>
        </div>
      )}
      <div className="card-footer">
        <div className="tags">
          {template.tags && template.tags.map((tag) => (
            <span key={tag} className="tag">#{tag}</span>
          ))}
        </div>
        <div className="stats">
          <span className="stat-item" onClick={handleLike} title={t('template_details.like')}>
            {liked ? '❤️' : '🤍'} {likeCount}
          </span>
          <span className="stat-item" onClick={handleFavorite} title={t('template_details.favorite')}>
            {favorited ? '⭐' : '☆'} {favCount}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PromptCard;
