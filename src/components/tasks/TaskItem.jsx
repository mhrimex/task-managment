/**
 * src/components/tasks/TaskItem.jsx
 *
 * Renders a single task row.
 * Action buttons (complete, skip, cancel, edit, delete) are shown/hidden
 * based on the current user's role permissions from AuthContext.
 */
import React, { useState } from 'react';
import { Edit2, Trash2, Calendar, AlertCircle, XCircle, FastForward, Briefcase, User, CheckCircle, RotateCcw } from 'lucide-react';
import { format, parseISO, isPast } from 'date-fns';
import Button from '../common/Button';
import Modal from '../common/Modal';
import { useAuthContext } from '../../contexts/AuthContext';
import styles from './TaskItem.module.css';

const TaskItem = ({ task, onUpdateStatus, onEdit, onDelete }) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { permissions } = useAuthContext();

  const isCompleted = task.status === 'completed';
  const isSkipped   = task.status === 'skipped';
  const isCancelled = task.status === 'cancelled';
  const isFinished  = isCompleted || isSkipped || isCancelled;

  const getPriorityColor = () => {
    switch (task.priority) {
      case 'high':   return 'var(--priority-high)';
      case 'medium': return 'var(--priority-medium)';
      case 'low':    return 'var(--priority-low)';
      default:       return 'var(--color-text-muted)';
    }
  };

  const isOverdue = task.dueDate && !isCompleted &&
    isPast(parseISO(task.dueDate)) &&
    format(new Date(), 'yyyy-MM-dd') !== task.dueDate;

  // Derive whether any action buttons should show at all
  const hasAnyAction = permissions.canUpdateStatus || permissions.canEditTask || permissions.canDeleteTask;

  return (
    <div className={`${styles.taskItem} ${isCompleted ? styles.completed : ''} ${isSkipped ? styles.skipped : ''} ${isCancelled ? styles.cancelled : ''}`}>

      <div
        className={styles.content}
        onClick={() => setIsDetailsOpen(true)}
        style={{ cursor: 'pointer' }}
      >
        <h3 className={styles.title}>{task.title}</h3>
        {task.description && <p className={styles.description}>{task.description}</p>}

        <div className={styles.meta}>
          <span className={styles.tag} style={{ borderColor: getPriorityColor(), color: getPriorityColor() }}>
            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </span>
          {task.status !== 'pending' && task.status !== 'completed' && (
            <span className={styles.tag} style={{ borderColor: 'var(--color-text-muted)', color: 'var(--color-text-muted)' }}>
              {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
            </span>
          )}

          {task.requesterName && (
            <span className={styles.dueDate} title="Requester">
              <User size={14} /> {task.requesterName}
            </span>
          )}
          {task.companyName && (
            <span className={styles.dueDate} title="Company">
              <Briefcase size={14} /> {task.companyName}
            </span>
          )}
          {task.assignedUser && (
            <span className={styles.dueDate} title="Assigned To">
              <User size={14} style={{ color: 'var(--color-primary)' }} /> {task.assignedUser}
            </span>
          )}

          {task.dueDate && (
            <span className={`${styles.dueDate} ${isOverdue ? styles.overdue : ''}`}>
              <Calendar size={14} />
              {format(parseISO(task.dueDate), 'MMM d, yyyy')}
              {isOverdue && <AlertCircle size={14} className={styles.alertIcon} />}
            </span>
          )}
        </div>
      </div>

      {/* Action buttons — only render the ones the user has permission for */}
      {hasAnyAction && (
        <div className={styles.actions}>
          {/* Status actions */}
          {permissions.canUpdateStatus && (
            !isFinished ? (
              <>
                <Button
                  variant="ghost" size="sm"
                  onClick={() => onUpdateStatus(task.id, 'completed')}
                  aria-label="Complete task" title="Complete Task"
                  style={{ color: 'var(--color-success)' }}
                >
                  <CheckCircle size={16} />
                </Button>
                <Button
                  variant="ghost" size="sm"
                  onClick={() => onUpdateStatus(task.id, 'skipped')}
                  aria-label="Skip task" title="Skip Task"
                >
                  <FastForward size={16} />
                </Button>
                <Button
                  variant="ghost" size="sm"
                  onClick={() => onUpdateStatus(task.id, 'cancelled')}
                  aria-label="Cancel task" title="Cancel Task"
                >
                  <XCircle size={16} />
                </Button>
              </>
            ) : (
              <Button
                variant="ghost" size="sm"
                onClick={() => onUpdateStatus(task.id, 'pending')}
                aria-label="Undo status" title="Undo"
              >
                <RotateCcw size={16} />
              </Button>
            )
          )}

          {/* Edit */}
          {permissions.canEditTask && (
            <Button
              variant="ghost" size="sm"
              onClick={() => onEdit(task)}
              aria-label="Edit task"
            >
              <Edit2 size={16} />
            </Button>
          )}

          {/* Delete */}
          {permissions.canDeleteTask && (
            <Button
              variant="ghost" size="sm"
              className={styles.deleteBtn}
              onClick={() => onDelete(task.id)}
              aria-label="Delete task"
            >
              <Trash2 size={16} />
            </Button>
          )}
        </div>
      )}

      {/* Task details modal */}
      <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title={task.title}>
        <div style={{ padding: '0.5rem 0 1.5rem', color: 'var(--color-text)' }}>
          {task.description ? (
            <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', marginBottom: '1.5rem' }}>{task.description}</p>
          ) : (
            <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', marginBottom: '1.5rem' }}>No description provided for this task.</p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', backgroundColor: 'var(--color-bg)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            <div><strong style={{ color: 'var(--color-text-muted)' }}>Status:</strong> {task.status.charAt(0).toUpperCase() + task.status.slice(1)}</div>
            <div><strong style={{ color: 'var(--color-text-muted)' }}>Priority:</strong> {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</div>
            {task.dueDate && <div><strong style={{ color: 'var(--color-text-muted)' }}>Due Date:</strong> {format(parseISO(task.dueDate), 'MMMM d, yyyy')}</div>}
            {task.requesterName && <div><strong style={{ color: 'var(--color-text-muted)' }}>Requester:</strong> {task.requesterName}</div>}
            {task.companyName && <div><strong style={{ color: 'var(--color-text-muted)' }}>Company:</strong> {task.companyName}</div>}
            {task.assignedUser && <div><strong style={{ color: 'var(--color-text-muted)' }}>Assigned To:</strong> {task.assignedUser}</div>}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TaskItem;
