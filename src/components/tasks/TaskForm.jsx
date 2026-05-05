/**
 * src/components/tasks/TaskForm.jsx
 */
import React, { useState, useEffect } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import { useAuthContext } from '../../contexts/AuthContext';
import styles from './TaskForm.module.css';

const TaskForm = ({ initialData, onSubmit, onCancel }) => {
  const { permissions, users } = useAuthContext();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    requesterName: '',
    companyName: '',
    assignedUser: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      // For editing, populate with existing data
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        priority: initialData.priority || 'medium',
        dueDate: initialData.dueDate || '',
        requesterName: initialData.requesterName || '',
        companyName: initialData.companyName || '',
        assignedUser: initialData.assignedUser || '',
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for the field being edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (formData.title.length > 50) newErrors.title = 'Title must be less than 50 characters';
    
    // Optional: add more validations (e.g. date cannot be in the past)
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      <Input
        label="Task Title *"
        name="title"
        value={formData.title}
        onChange={handleChange}
        placeholder="e.g., Update project documentation"
        error={errors.title}
        autoFocus
      />
      
      <Input
        type="textarea"
        label="Description (Optional)"
        name="description"
        value={formData.description}
        onChange={handleChange}
        placeholder="Add details about this task..."
      />

      <div className={styles.row}>
        <div className={styles.col}>
          <Input
            type="select"
            label="Priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </Input>
        </div>
        <div className={styles.col}>
          <Input
            type="date"
            label="Due Date (Optional)"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.col}>
          <Input
            label="Requester Name"
            name="requesterName"
            value={formData.requesterName}
            onChange={handleChange}
            placeholder="Who requested this?"
          />
        </div>
        <div className={styles.col}>
          <Input
            label="Company Name"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            placeholder="From which company?"
          />
        </div>
      </div>

      {permissions.canAssignTask && (
        <Input
          type="select"
          label="Assigned User"
          name="assignedUser"
          value={formData.assignedUser}
          onChange={handleChange}
        >
          <option value="">-- Assign to a user --</option>
          {users.map(u => (
            <option key={u.id} value={u.username}>{u.fullName || u.username}</option>
          ))}
        </Input>
      )}

      <div className={styles.actions}>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          {initialData ? 'Update Task' : 'Create Task'}
        </Button>
      </div>
    </form>
  );
};

export default TaskForm;
