"use client";

import React from 'react';

interface ChildProgressProps {
  name: string;
  initial: string;
  age: number;
  grade: string;
  tasksCompleted: number;
  points: number;
  streak: number;
  completionRate: number;
  lastActive: string;
  color: string;
}

export default function ChildProgressCard({
  name,
  initial,
  age,
  grade,
  tasksCompleted,
  points,
  streak,
  completionRate,
  lastActive,
  color = "blue"
}: ChildProgressProps): JSX.Element {
  
  const colorClasses = {
    blue: {
      bg: "bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200",
      text: "text-blue-700",
      darkText: "text-blue-900",
      progress: "bg-blue-500"
    },
    green: {
      bg: "bg-gradient-to-br from-green-50 to-green-100/50 border-green-200",
      text: "text-green-700",
      darkText: "text-green-900",
      progress: "bg-green-500"
    }
  };

  const currentColor = colorClasses[color as keyof typeof colorClasses] || colorClasses.blue;

  return (
    <div className={`${currentColor.bg} max-h-96 overflow-y-auto border-2 border-red-500 rounded-2xl shadow-lg p-6 border hover:shadow-xl transition-shadow w-full h-full`}>
      {/* Child Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold text-white bg-gradient-to-r from-cyan-500 to-teal-500`}>
          {initial}
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800">{name}</h3>
          <p className="text-gray-600">
            {age} years • {grade}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-3 bg-white/70 rounded-xl">
          <p className="text-sm text-gray-600">Tasks Done</p>
          <p className="text-2xl font-bold text-gray-800">{tasksCompleted}</p>
        </div>
        <div className="text-center p-3 bg-white/70 rounded-xl">
          <p className="text-sm text-gray-600">Points</p>
          <p className="text-2xl font-bold text-gray-800">{points}</p>
        </div>
        <div className="text-center p-3 bg-white/70 rounded-xl">
          <p className="text-sm text-gray-600">Day Streak</p>
          <p className="text-2xl font-bold text-gray-800">{streak} 🔥</p>
        </div>
        <div className="text-center p-3 bg-white/70 rounded-xl">
          <p className="text-sm text-gray-600">Completion</p>
          <p className="text-2xl font-bold text-gray-800">{completionRate}%</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Task Completion</span>
          <span>{completionRate}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full ${currentColor.progress} rounded-full transition-all duration-500`}
            style={{ width: `${completionRate}%` }}
          ></div>
        </div>
      </div>

      {/* Last Active */}
      <div className="text-sm text-gray-500 mt-4">
        <i className="fas fa-clock mr-2"></i>
        Last active: {lastActive}
      </div>
    </div>
  );
}



