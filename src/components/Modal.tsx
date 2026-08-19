import React from 'react';

interface Props {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  variant?: 'modal' | 'drawer';
}

const Modal: React.FC<Props> = ({ title, onClose, children, variant = 'modal' }) => (
  <div className="overlay" onMouseDown={onClose}>
    <div className={variant} onMouseDown={(e) => e.stopPropagation()}>
      <div className="panel-head">
        <h2>{title}</h2>
        <button className="ghost" onClick={onClose}>✕</button>
      </div>
      <div className="panel-body">{children}</div>
    </div>
  </div>
);

export default Modal;
