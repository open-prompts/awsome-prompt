import React from 'react';
import { useNavigate } from 'react-router-dom';
import './PromptCard.scss';

/**
 * PromptCard component.
 * Displays a single prompt template in a card format.
 * @param {Object} props - Component props
 * @param {Object} props.template - The template data
 */
const PromptCard = ({ template }) => {
  const navigate = useNavigate();

  return (
    <div className="prompt-card" onClick={() => navigate(`/template/${template.id}`)} style={{ cursor: 'pointer' }}>
      <div className="card-header">
        <h4 className="title">{template.title}</h4>
        <span className={`visibility ${template.visibility.toLowerCase()}`}>
          {template.visibility === 'VISIBILITY_PUBLIC' ? 'Public' : 'Private'}
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
          {/* Placeholder for stats if available in template object */}
          {/* <span>❤️ {template.liked_by?.length || 0}</span> */}
        </div>
      </div>
    </div>
  );
};

export default PromptCard;
