'use client';
import { useState } from 'react';
import { ExtractedTask, getTasksSummary } from '@/lib/task-parser';
import { TONE_COLORS } from '@/lib/data';
import Icon from './Icon';

interface TaskReviewProps {
  tasks: ExtractedTask[];
  onConfirm: (selectedTasks: ExtractedTask[]) => void;
  onClose: () => void;
}

const PRIORITY_COLORS = {
  high: '#e05c3c',
  medium: '#c9943a',
  low: '#7a9e7e',
};

export default function TaskReview({ tasks, onConfirm, onClose }: TaskReviewProps) {
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(
    new Set(tasks.map((_, i) => i))
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedTasks, setEditedTasks] = useState<ExtractedTask[]>([...tasks]);

  const toggleTask = (index: number) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedTasks(newSelected);
  };

  const updateTask = (index: number, field: keyof ExtractedTask, value: any) => {
    const updated = [...editedTasks];
    updated[index] = { ...updated[index], [field]: value };
    setEditedTasks(updated);
  };

  const removeTask = (index: number) => {
    const newSelected = new Set(selectedTasks);
    newSelected.delete(index);
    setSelectedTasks(newSelected);

    const updated = editedTasks.filter((_, i) => i !== index);
    setEditedTasks(updated);
  };

  const handleConfirm = () => {
    const tasksToAdd = editedTasks.filter((_, i) => selectedTasks.has(i));
    onConfirm(tasksToAdd);
  };

  const selectedCount = selectedTasks.size;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      zIndex: 1001,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-elev)',
          borderRadius: 16,
          maxWidth: 600,
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(0,0,0,0.24)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--line)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <h3 style={{ fontSize: 20, fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 28 }}>✨</span>
              Review Tasks
            </h3>
            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: 8, border: 'none',
              background: 'var(--bg-sunk)', cursor: 'pointer',
              display: 'grid', placeItems: 'center', transition: 'all 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--line)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-sunk)'}
            >
              <Icon name="x" size={16} />
            </button>
          </div>
          <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: 0 }}>
            {getTasksSummary(editedTasks)} · Review and edit before adding
          </p>
        </div>

        {/* Task list */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 24px',
        }}>
          {editedTasks.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: 'var(--ink-faint)',
              fontSize: 13,
            }}>
              No tasks to review
            </div>
          )}

          {editedTasks.map((task, index) => (
            <div
              key={index}
              style={{
                marginBottom: 12,
                padding: 16,
                background: selectedTasks.has(index) ? 'var(--bg)' : 'var(--bg-sunk)',
                border: `1px solid ${selectedTasks.has(index) ? 'var(--accent)' : 'var(--line)'}`,
                borderRadius: 10,
                transition: 'all 0.15s',
                opacity: selectedTasks.has(index) ? 1 : 0.6,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                {/* Checkbox */}
                <button
                  onClick={() => toggleTask(index)}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 6,
                    border: `2px solid ${selectedTasks.has(index) ? 'var(--accent)' : 'var(--line)'}`,
                    background: selectedTasks.has(index) ? 'var(--accent)' : 'transparent',
                    cursor: 'pointer',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                    marginTop: 2,
                    transition: 'all 0.15s',
                  }}
                >
                  {selectedTasks.has(index) && (
                    <Icon name="check" size={12} style={{ color: '#fff' }} />
                  )}
                </button>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Title */}
                  {editingIndex === index ? (
                    <input
                      type="text"
                      value={task.title}
                      onChange={e => updateTask(index, 'title', e.target.value)}
                      onBlur={() => setEditingIndex(null)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') setEditingIndex(null);
                        if (e.key === 'Escape') setEditingIndex(null);
                      }}
                      autoFocus
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid var(--accent)',
                        borderRadius: 6,
                        fontSize: 14,
                        fontWeight: 500,
                        background: 'var(--bg)',
                        color: 'var(--ink)',
                        outline: 'none',
                        fontFamily: 'var(--font-sans)',
                      }}
                    />
                  ) : (
                    <div
                      onClick={() => setEditingIndex(index)}
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: 'var(--ink)',
                        cursor: 'text',
                        marginBottom: 8,
                      }}
                    >
                      {task.title}
                    </div>
                  )}

                  {/* Metadata */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Priority */}
                    <select
                      value={task.priority}
                      onChange={e => updateTask(index, 'priority', e.target.value as any)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: 6,
                        border: `1px solid ${PRIORITY_COLORS[task.priority]}40`,
                        background: `${PRIORITY_COLORS[task.priority]}10`,
                        color: PRIORITY_COLORS[task.priority],
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        outline: 'none',
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em',
                      }}
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>

                    {/* Due date */}
                    <select
                      value={task.due || 'none'}
                      onChange={e => updateTask(index, 'due', e.target.value === 'none' ? null : e.target.value)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: 6,
                        border: '1px solid var(--line)',
                        background: 'var(--bg-sunk)',
                        color: 'var(--ink-soft)',
                        fontSize: 11,
                        fontWeight: 500,
                        cursor: 'pointer',
                        outline: 'none',
                      }}
                    >
                      <option value="none">No due date</option>
                      <option value="today">Today</option>
                      <option value="tomorrow">Tomorrow</option>
                      <option value="this week">This week</option>
                    </select>

                    {/* Notes */}
                    {task.notes && (
                      <span style={{
                        fontSize: 11,
                        color: 'var(--ink-faint)',
                        fontStyle: 'italic',
                      }}>
                        ({task.notes})
                      </span>
                    )}
                  </div>
                </div>

                {/* Remove button */}
                <button
                  onClick={() => removeTask(index)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                    color: 'var(--ink-faint)',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(224,92,60,0.1)';
                    e.currentTarget.style.color = '#e05c3c';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--ink-faint)';
                  }}
                >
                  <Icon name="trash" size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--line)',
          display: 'flex',
          gap: 12,
          justifyContent: 'flex-end',
        }}>
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedCount === 0}
            className="btn btn-primary"
            style={{
              opacity: selectedCount === 0 ? 0.5 : 1,
              cursor: selectedCount === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            Add {selectedCount} Task{selectedCount !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
