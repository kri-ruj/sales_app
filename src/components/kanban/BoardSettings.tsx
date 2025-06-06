import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Settings,
  Palette,
  Shield,
  Bell,
  Archive,
  Trash2,
  Plus,
  Edit3,
  Save,
  AlertTriangle,
} from 'lucide-react';
import ApiService from '../../services/apiService';
import { useToast } from '../../hooks/useToast';

interface Board {
  _id: string;
  name: string;
  description?: string;
  type: 'sales' | 'follow-up' | 'team' | 'project' | 'personal';
  columns: Array<{
    id: string;
    name: string;
    color: string;
    position: number;
    wipLimit?: number;
  }>;
  labels: Array<{
    id: string;
    name: string;
    color: string;
    description?: string;
  }>;
  settings: {
    allowMemberInvites: boolean;
    allowFileUploads: boolean;
    requireTaskApproval: boolean;
    autoArchiveCompleted: boolean;
    autoArchiveDays?: number;
    emailNotifications: boolean;
    lineNotifications: boolean;
  };
}

interface BoardSettingsProps {
  board: Board;
  onSave: (updatedBoard: Board) => void;
  onClose: () => void;
}

const BoardSettings: React.FC<BoardSettingsProps> = ({ board, onSave, onClose }) => {
  const { success, error: showError } = useToast();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: board.name,
    description: board.description || '',
    settings: { ...board.settings },
    columns: [...board.columns],
    labels: [...board.labels],
  });

  const [newLabel, setNewLabel] = useState({ name: '', color: '#3B82F6', description: '' });
  const [editingLabel, setEditingLabel] = useState<string | null>(null);

  const colorOptions = [
    '#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4',
    '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#F43F5E'
  ];

  const handleSave = async () => {
    if (!formData.name.trim()) {
      showError('Board name is required');
      return;
    }

    try {
      setSaving(true);
      const response = await ApiService.updateBoard(board._id, formData);
      if (response.success) {
        success('Board settings updated successfully');
        onSave(response.data);
      }
    } catch (error) {
      showError('Failed to update board settings');
      console.error('Error updating board:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBoard = async () => {
    try {
      setSaving(true);
      await ApiService.deleteBoard(board._id);
      success('Board deleted successfully');
      onClose();
    } catch (error) {
      showError('Failed to delete board');
      console.error('Error deleting board:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddLabel = () => {
    if (!newLabel.name.trim()) return;

    const label = {
      id: Date.now().toString(),
      name: newLabel.name.trim(),
      color: newLabel.color,
      description: newLabel.description.trim(),
    };

    setFormData(prev => ({
      ...prev,
      labels: [...prev.labels, label],
    }));

    setNewLabel({ name: '', color: '#3B82F6', description: '' });
  };

  const handleUpdateLabel = (labelId: string, updates: Partial<typeof newLabel>) => {
    setFormData(prev => ({
      ...prev,
      labels: prev.labels.map(label =>
        label.id === labelId ? { ...label, ...updates } : label
      ),
    }));
  };

  const handleDeleteLabel = (labelId: string) => {
    setFormData(prev => ({
      ...prev,
      labels: prev.labels.filter(label => label.id !== labelId),
    }));
  };

  const handleUpdateColumn = (columnId: string, updates: { wipLimit?: number }) => {
    setFormData(prev => ({
      ...prev,
      columns: prev.columns.map(column =>
        column.id === columnId ? { ...column, ...updates } : column
      ),
    }));
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'columns', label: 'Columns', icon: Palette },
    { id: 'labels', label: 'Labels', icon: Palette },
    { id: 'permissions', label: 'Permissions', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'automation', label: 'Automation', icon: Archive },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Board Settings</h2>
              <p className="text-blue-100 mt-1">{board.name}</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </motion.button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-140px)]">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
            <div className="space-y-2">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <motion.button
                    key={tab.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Board Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Describe the purpose of this board..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Board Type
                      </label>
                      <div className="bg-gray-100 px-4 py-3 rounded-lg">
                        <span className="font-medium capitalize">{board.type}</span>
                        <p className="text-sm text-gray-600 mt-1">
                          Board type cannot be changed after creation
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h3>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-medium text-red-800 mb-2">Delete Board</h4>
                    <p className="text-sm text-red-600 mb-4">
                      This action cannot be undone. All tasks and data will be permanently deleted.
                    </p>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Board</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'columns' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Column Settings</h3>
                
                <div className="space-y-4">
                  {formData.columns
                    .sort((a, b) => a.position - b.position)
                    .map(column => (
                      <div key={column.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: column.color }}
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{column.name}</h4>
                          <p className="text-sm text-gray-500">Position: {column.position}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <label className="text-sm text-gray-600">WIP Limit:</label>
                          <input
                            type="number"
                            min="0"
                            value={column.wipLimit || ''}
                            onChange={(e) => handleUpdateColumn(column.id, {
                              wipLimit: e.target.value ? parseInt(e.target.value) : undefined
                            })}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="None"
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {activeTab === 'labels' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Labels</h3>
                </div>

                {/* Existing labels */}
                <div className="space-y-3">
                  {formData.labels.map(label => (
                    <motion.div
                      key={label.id}
                      layout
                      className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg"
                    >
                      <div
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: label.color }}
                      />
                      
                      {editingLabel === label.id ? (
                        <div className="flex-1 grid grid-cols-2 gap-4">
                          <input
                            type="text"
                            value={label.name}
                            onChange={(e) => handleUpdateLabel(label.id, { name: e.target.value })}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                          <input
                            type="text"
                            value={label.description || ''}
                            onChange={(e) => handleUpdateLabel(label.id, { description: e.target.value })}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="Description (optional)"
                          />
                        </div>
                      ) : (
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{label.name}</h4>
                          {label.description && (
                            <p className="text-sm text-gray-500">{label.description}</p>
                          )}
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        {editingLabel === label.id ? (
                          <div className="flex items-center space-x-2">
                            <div className="flex space-x-1">
                              {colorOptions.map(color => (
                                <button
                                  key={color}
                                  onClick={() => handleUpdateLabel(label.id, { color })}
                                  className={`w-6 h-6 rounded-full border-2 ${
                                    label.color === color ? 'border-gray-800' : 'border-gray-300'
                                  }`}
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                            <button
                              onClick={() => setEditingLabel(null)}
                              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => setEditingLabel(label.id)}
                              className="p-2 text-gray-400 hover:text-gray-600"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteLabel(label.id)}
                              className="p-2 text-gray-400 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Add new label */}
                <div className="border-t pt-6">
                  <h4 className="font-medium text-gray-900 mb-4">Add New Label</h4>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <input
                      type="text"
                      value={newLabel.name}
                      onChange={(e) => setNewLabel(prev => ({ ...prev, name: e.target.value }))}
                      className="px-4 py-3 border border-gray-300 rounded-lg"
                      placeholder="Label name"
                    />
                    <input
                      type="text"
                      value={newLabel.description}
                      onChange={(e) => setNewLabel(prev => ({ ...prev, description: e.target.value }))}
                      className="px-4 py-3 border border-gray-300 rounded-lg"
                      placeholder="Description (optional)"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-4 mb-4">
                    <span className="text-sm text-gray-600">Color:</span>
                    <div className="flex space-x-2">
                      {colorOptions.map(color => (
                        <button
                          key={color}
                          onClick={() => setNewLabel(prev => ({ ...prev, color }))}
                          className={`w-8 h-8 rounded-full border-2 ${
                            newLabel.color === color ? 'border-gray-800' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleAddLabel}
                    disabled={!newLabel.name.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Label</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'permissions' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Permissions & Access</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Allow Member Invites</h4>
                      <p className="text-sm text-gray-500">Let members invite other users to the board</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.settings.allowMemberInvites}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          settings: { ...prev.settings, allowMemberInvites: e.target.checked }
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Allow File Uploads</h4>
                      <p className="text-sm text-gray-500">Enable file attachments on tasks</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.settings.allowFileUploads}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          settings: { ...prev.settings, allowFileUploads: e.target.checked }
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Require Task Approval</h4>
                      <p className="text-sm text-gray-500">Tasks need approval before moving to done</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.settings.requireTaskApproval}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          settings: { ...prev.settings, requireTaskApproval: e.target.checked }
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Notification Settings</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Email Notifications</h4>
                      <p className="text-sm text-gray-500">Send email updates for board activities</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.settings.emailNotifications}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          settings: { ...prev.settings, emailNotifications: e.target.checked }
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">LINE Notifications</h4>
                      <p className="text-sm text-gray-500">Send LINE messages for important updates</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.settings.lineNotifications}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          settings: { ...prev.settings, lineNotifications: e.target.checked }
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'automation' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Automation Rules</h3>
                
                <div className="space-y-4">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-medium text-gray-900">Auto-archive Completed Tasks</h4>
                        <p className="text-sm text-gray-500">Automatically archive tasks after completion</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.settings.autoArchiveCompleted}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            settings: { ...prev.settings, autoArchiveCompleted: e.target.checked }
                          }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    {formData.settings.autoArchiveCompleted && (
                      <div>
                        <label className="block text-sm text-gray-600 mb-2">Archive after (days):</label>
                        <input
                          type="number"
                          min="1"
                          max="365"
                          value={formData.settings.autoArchiveDays || 30}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            settings: { ...prev.settings, autoArchiveDays: parseInt(e.target.value) }
                          }))}
                          className="w-24 px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
          <p className="text-sm text-gray-500">
            Changes will be applied immediately
          </p>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <motion.div
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </motion.button>
          </div>
        </div>

        {/* Delete confirmation modal */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-lg p-6 max-w-md mx-4"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                  <h3 className="text-lg font-semibold text-gray-900">Delete Board</h3>
                </div>
                
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete "{board.name}"? This action cannot be undone and all tasks will be permanently deleted.
                </p>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteBoard}
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Deleting...' : 'Delete Board'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default BoardSettings;