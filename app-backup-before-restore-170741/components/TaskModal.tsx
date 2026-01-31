// app/components/TaskModal.tsx
"use client";

import { useState } from 'react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (taskData: { title: string; points: number; description?: string }) => void;
}

export default function TaskModal({ isOpen, onClose, onCreate }: TaskModalProps) {
  const [taskName, setTaskName] = useState('');
  const [taskPoints, setTaskPoints] = useState('');
  const [taskDescription, setTaskDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim() || !taskPoints.trim()) return;
    
    onCreate({
      title: taskName,
      points: parseInt(taskPoints),
      description: taskDescription
    });
    
    // Reset form
    setTaskName('');
    setTaskPoints('');
    setTaskDescription('');
  };

  if (!isOpen) return null;

  return (
    <div className="modal fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
      <div className="modal-content bg-white p-9 rounded-3xl w-[400px] shadow-[0_10px_25px_rgba(0,0,0,0.05)]">
        <h2 className="text-[#00C2E0] text-2xl font-bold mb-5">New Task</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            className="w-full py-3 px-4 rounded-xl border-2 border-[#E2E8F0] outline-none"
            placeholder="Task Name"
            required
          />
          
          <input
            type="number"
            value={taskPoints}
            onChange={(e) => setTaskPoints(e.target.value)}
            className="w-full py-3 px-4 rounded-xl border-2 border-[#E2E8F0] outline-none"
            placeholder="Points"
            min="1"
            required
          />
          
          <textarea
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
            className="w-full py-3 px-4 rounded-xl border-2 border-[#E2E8F0] outline-none min-h-[100px]"
            placeholder="Description (optional)"
          />
          
          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="btn-create flex-1 bg-[#00C2E0] text-white border-none py-3 rounded-xl font-bold cursor-pointer flex justify-center items-center gap-2"
            >
              Create
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-circle flex-1 py-3 rounded-xl border-2 border-[#E2E8F0] bg-white cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
