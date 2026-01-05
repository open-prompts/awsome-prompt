import React from 'react';
import './PromptCard.scss';

/**
 * PromptCard component.
 * Displays a single prompt template in a card format.
 * @param {Object} props - Component props
 * @param {Object} props.template - The template data
 */
const PromptCard = ({ template }) => {
  return (
    <div className="prompt-card">
      <div className="card-header">
        <h4 className="title">{template.title}</h4>
        <span className={`visibility ${template.visibility.toLowerCase()}`}>
          {template.visibility === 'VISIBILITY_PUBLIC' ? 'Public' : 'Private'}
        </span>
      </div>
      <p className="description">{template.description}</p>
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
