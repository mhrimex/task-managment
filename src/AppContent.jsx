/**
 * src/App.jsx
 */
import React, { useState } from 'react';
import DashboardLayout from './components/layout/DashboardLayout';
import TaskList from './components/tasks/TaskList';
import TaskForm from './components/tasks/TaskForm';
import Modal from './components/common/Modal';
import { useTaskContext } from './contexts/TaskContext';
import { useAuthContext } from './contexts/AuthContext';
import DashboardView from './components/views/DashboardView';
import CalendarView from './components/views/CalendarView';
import SettingsView from './components/views/SettingsView';
import UserManagementView from './components/views/UserManagementView';

function AppContent() {
  const { addTask, updateTask } = useTaskContext();
  const { logout, isAdmin } = useAuthContext();
  
  const [activeTab, setActiveTab] = useState('tasks');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const handleOpenAdd = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleSubmitTask = async (formData) => {
    try {
      if (editingTask) {
        await updateTask(editingTask.id, formData);
      } else {
        await addTask(formData);
      }
      handleCloseModal();
    } catch (error) {
      alert('Failed to save task. Please try again.');
    }
  };

  return (
    <DashboardLayout activeTab={activeTab} setActiveTab={setActiveTab} onLogout={logout}>
      {activeTab === 'dashboard' && (
        <DashboardView onAddTask={handleOpenAdd} onEditTask={handleOpenEdit} />
      )}
      
      {activeTab === 'tasks' && (
        <TaskList 
          onAddTask={handleOpenAdd} 
          onEditTask={handleOpenEdit} 
        />
      )}

      {activeTab === 'calendar' && <CalendarView />}

      {activeTab === 'settings' && <SettingsView />}

      {/* Admin-only: User Management */}
      {activeTab === 'users' && isAdmin && <UserManagementView />}

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        title={editingTask ? 'Edit Task' : 'Create New Task'}
      >
        <TaskForm 
          initialData={editingTask} 
          onSubmit={handleSubmitTask} 
          onCancel={handleCloseModal}
        />
      </Modal>
    </DashboardLayout>
  );
}

export default AppContent;
