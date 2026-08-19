import React from 'react';
import Modal from './Modal';

interface Props {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const Confirm: React.FC<Props> = ({ title, message, confirmLabel = 'Confirm', danger, onConfirm, onCancel }) => (
  <Modal title={title} onClose={onCancel}>
    <p className="mb">{message}</p>
    <div className="row" style={{ justifyContent: 'flex-end' }}>
      <button className="secondary" onClick={onCancel}>Cancel</button>
      <button className={danger ? 'danger' : ''} onClick={onConfirm}>{confirmLabel}</button>
    </div>
  </Modal>
);

export default Confirm;
