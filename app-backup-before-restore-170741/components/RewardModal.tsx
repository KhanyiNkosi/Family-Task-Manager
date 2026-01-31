// app/components/RewardModal.tsx
"use client";

import { useState } from 'react';

interface RewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (rewardData: { name: string; description: string; points: number; icon: string }) => void;
}

const availableIcons = [
  { value: 'fas fa-book', label: 'Book' },
  { value: 'fas fa-film', label: 'Movie' },
  { value: 'fas fa-ice-cream', label: 'Ice Cream' },
  { value: 'fas fa-gamepad', label: 'Game' },
  { value: 'fas fa-music', label: 'Music' },
  { value: 'fas fa-pizza-slice', label: 'Pizza' },
  { value: 'fas fa-basketball', label: 'Sports' },
  { value: 'fas fa-palette', label: 'Art' },
  { value: 'fas fa-robot', label: 'Toy' },
  { value: 'fas fa-car', label: 'Trip' }
];

export default function RewardModal({ isOpen, onClose, onCreate }: RewardModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('fas fa-gift');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !points.trim() || !selectedIcon) return;
    
    onCreate({
      name,
      description,
      points: parseInt(points),
      icon: selectedIcon
    });
    
    // Reset form
    setName('');
    setDescription('');
    setPoints('');
    setSelectedIcon('fas fa-gift');
  };

  if (!isOpen) return null;

  return (
    <div className="modal fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
      <div className="modal-content bg-white p-8 rounded-2xl w-[450px] shadow-[0_10px_25px_rgba(0,0,0,0.08)]">
        <h2 className="text-[#00C2E0] text-2xl font-bold mb-6 flex items-center gap-2">
          <i className="fas fa-gift"></i> Create New Reward
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#142229] mb-1.5">Reward Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full py-3 px-4 rounded-xl border border-[#E2E8F0] outline-none focus:border-[#00C2E0]"
              placeholder="e.g., Movie Night Pick"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#142229] mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full py-3 px-4 rounded-xl border border-[#E2E8F0] outline-none focus:border-[#00C2E0] min-h-[80px]"
              placeholder="Describe the reward..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#142229] mb-1.5">Points Required *</label>
            <input
              type="number"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              className="w-full py-3 px-4 rounded-xl border border-[#E2E8F0] outline-none focus:border-[#00C2E0]"
              placeholder="e.g., 100"
              min="1"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#142229] mb-1.5">Icon</label>
            <div className="grid grid-cols-5 gap-2 mb-2">
              {availableIcons.map((icon) => (
                <button
                  key={icon.value}
                  type="button"
                  onClick={() => setSelectedIcon(icon.value)}
                  className={`p-3 rounded-lg flex items-center justify-center ${
                    selectedIcon === icon.value
                      ? 'bg-[#00C2E0] text-white'
                      : 'bg-[#F1F5F9] text-[#5A6A7E] hover:bg-[#E2E8F0]'
                  }`}
                >
                  <i className={icon.value}></i>
                </button>
              ))}
            </div>
            <div className="text-xs text-[#5A6A7E]">Selected: <i className={selectedIcon + " mr-1"}></i> {selectedIcon.replace('fas fa-', '')}</div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="btn-create flex-1 bg-[#00C2E0] text-white border-none py-3 rounded-xl font-bold cursor-pointer flex justify-center items-center gap-2"
            >
              <i className="fas fa-plus"></i> Create Reward
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-circle flex-1 py-3 rounded-xl border border-[#E2E8F0] bg-white cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
