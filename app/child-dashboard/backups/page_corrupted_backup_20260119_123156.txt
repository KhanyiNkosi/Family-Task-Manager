"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ChildDashboardPage() {
  const [points, setPoints] = useState(12);
  const [tasks, setTasks] = useState([
    { id: 1, title: "Hockey practice", points: 5, completed: false, category: "sports" },
    { id: 2, title: "Homework", points: 10, completed: true, category: "school" },
    { id: 3, title: "Clean Room", points: 2, completed: true, category: "chores" }
  ]);
  const [rewards, setRewards] = useState([
    { id: 1, name: "Ice Cream Trip", description: "A special trip to your favorite shop.", points: 50, redeemed: false },
    { id: 2, name: "Movie Night Pick", description: "Choose the movie for family night", points: 30, redeemed: true }
  ]);
  const [toast, setToast] = useState({ show: false, message: "" });

  const pathname = usePathname();
  
  const navItems = [
    { href: "/", icon: "fas fa-home", label: "Home" },
    { href: "/child-dashboard", icon: "fas fa-th-large", label: "My Dashboard" },
    { href: "/rewards-store", icon: "fas fa-gift", label: "Rewards Store" },
    { href: "/ai-suggester", icon: "fas fa-magic", label: "AI Suggester" },
  ];
  
  const bottomItems = [
    { href: "/settings", icon: "fas fa-cog", label: "Settings" },
    { href: "/logout", icon: "fas fa-sign-out-alt", label: "Logout" },
  ];

  const completeTask = (taskId: number) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: true } : task
    ));
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setPoints(prev => prev + task.points);
      
      setToast({ 
        show: true, 
        message: `Completed "${task.title}"! Earned ${task.points} points!` 
      });
      setTimeout(() => setToast({ ...toast, show: false }), 3000);
    }
  };

  const redeemReward = (rewardId: number) => {
    const reward = rewards.find(r => r.id === rewardId);
    if (reward && points >= reward.points && !reward.redeemed) {
      setRewards(rewards.map(r => 
        r.id === rewardId ? { ...r, redeemed: true } : r
      ));
      setPoints(prev => prev - reward.points);
      
      setToast({ 
        show: true, 
        message: `Request for "${reward.name}" sent for approval!` 
      });
      setTimeout(() => setToast({ ...toast, show: false }), 4000);
    } else if (reward && points < reward.points) {
      alert(`You need ${reward.points} points to redeem this reward!`);
    }
  };

  const getPepTalk = () => {
    const pepTalks = [
      "You're doing amazing! Keep up the great work!",
      "Every task you complete brings you closer to awesome rewards!",
      "Your consistency is inspiring!",
      "Keep going, superstar! You've got this!"
    ];
    alert(pepTalks[Math.floor(Math.random() * pepTalks.length)]);
  };

  const stats = {
    todo: tasks.filter(t => !t.completed).length,
    completed: tasks.filter(t => t.completed).length,
    redeemed: rewards.filter(r => r.redeemed).length
  };

  const todoTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  return (
    <div className="child-dashboard-container">
      <aside className="child-sidebar">
        <div className="child-logo">
          <i className="far fa-smile-beam"></i> FamilyTask
        </div>
        
        <nav className="flex-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`child-nav-link ${pathname === item.href ? "active" : ""}`}
            >
              <i className={item.icon}></i> {item.label}
            </Link>
          ))}
        </nav>
        
        <div className="child-sidebar-bottom">
          {bottomItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="child-nav-link"
            >
              <i className={item.icon}></i> {item.label}
            </Link>
          ))}
        </div>
      </aside>

      <main className="child-main-content">
        <div className="child-header-bar">
          <h1 style={{color: "#00C2E0", fontWeight: "800"}}>Hi, Child!</h1>
          <div style={{display: "flex", gap: "15px", alignItems: "center"}}>
            <div style={{color: "#00C2E0", fontSize: "20px"}}>
              <i className="far fa-bell"></i>
            </div>
            <div className="child-points-pill">
              <i className="fas fa-star"></i> <span>{points}</span> Points
            </div>
          </div>
        </div>

        <div className="child-stats-grid">
          <div className="child-stat-card">
            <h3>Tasks To-Do</h3>
            <div className="value">{stats.todo}</div>
            <i className="fas fa-clipboard-list child-stat-icon-bg"></i>
          </div>
          
          <div className="child-stat-card">
            <h3>Tasks Completed</h3>
            <div className="value">{stats.completed}</div>
            <i className="fas fa-check-circle child-stat-icon-bg"></i>
          </div>
          
          <div className="child-stat-card">
            <h3>Rewards Redeemed</h3>
            <div className="value">{stats.redeemed}</div>
            <i className="fas fa-gift child-stat-icon-bg"></i>
          </div>
        </div>

        <div className="child-challenge-banner">
          <h2 style={{color: "#007A8C"}}>Ready for a challenge?</h2>
          <p style={{color: "#64748B"}}>Complete your tasks to earn points and unlock cool rewards!</p>
          <button 
            onClick={getPepTalk}
            className="child-pep-talk-btn"
          >
            <i className="fas fa-sparkles"></i> Get a Pep Talk!
          </button>
        </div>

        <h2 className="child-section-header">Your Tasks</h2>
        
        <div className="child-task-group">
          <div className="child-group-label child-todo-bg">To Do ({stats.todo})</div>
          {todoTasks.map(task => (
            <div key={task.id} className="child-task-item">
              <div style={{display: "flex", alignItems: "center"}}>
                <div 
                  className="child-checkbox"
                  onClick={() => completeTask(task.id)}
                ></div>
                <span>{task.title}</span>
              </div>
              <div style={{display: "flex", gap: "10px", alignItems: "center"}}>
                <span style={{color: "#00C2E0", fontSize: "12px", fontWeight: "600"}}>Child</span>
                <span style={{fontSize: "13px", color: "#64748B"}}>
                  <i className="far fa-star"></i> {task.points} pts
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="child-task-group">
          <div className="child-group-label child-done-bg">Completed ({stats.completed})</div>
          {completedTasks.map(task => (
            <div key={task.id} className="child-task-item" style={{opacity: 0.7}}>
              <span>{task.title}</span>
              <span style={{fontSize: "13px", color: "#64748B"}}>
                <i className="fas fa-star"></i> {task.points} pts
              </span>
            </div>
          ))}
        </div>

        <h2 className="child-section-header">Featured Rewards</h2>
        <div className="child-rewards-grid">
          {rewards.map(reward => (
            <div 
              key={reward.id} 
              className={`child-reward-card ${reward.redeemed ? "redeemed" : ""}`}
            >
              {reward.redeemed ? (
                <>
                  <i className="fas fa-check-circle" style={{color: "#2D3748", fontSize: "24px", marginBottom: "10px"}}></i>
                  <div style={{fontWeight: "700"}}>Redeemed</div>
                  <div style={{fontSize: "12px"}}>{reward.name}</div>
                </>
              ) : (
                <>
                  <i className="fas fa-ice-cream child-reward-icon"></i>
                  <h4 style={{marginBottom: "5px"}}>{reward.name}</h4>
                  <p style={{fontSize: "12px", color: "#64748B"}}>{reward.description}</p>
                  <button 
                    onClick={() => redeemReward(reward.id)}
                    className="child-redeem-btn"
                    disabled={points < reward.points}
                  >
                    {points >= reward.points 
                      ? `Redeem for ${reward.points} pts`
                      : `Need ${reward.points} pts`
                    }
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </main>

      {toast.show && (
        <div className="child-toast">
          <div style={{fontWeight: "800", marginBottom: "5px"}}>Request Sent!</div>
          <div style={{fontSize: "14px", color: "#64748B"}}>{toast.message}</div>
        </div>
      )}
    </div>
  );
}
