import { NextResponse } from "next/server";

// Simple in-memory task storage for demo
let demoInMemoryTasks = [
  {
    id: "1",
    title: "Complete Science Project",
    description: "Finish the solar system model",
    points: 25,
    status: "pending",
    assignedTo: "Alex",
    createdBy: "parent",
    dueDate: new Date(Date.now() + 86400000).toISOString(),
    createdAt: new Date().toISOString()
  }
];

export async function GET() {
  return NextResponse.json({ 
    success: true, 
    tasks: demoInMemoryTasks,
    count: demoInMemoryTasks.length
  });
}

export async function POST(request: Request) {
  try {
    const taskData = await request.json();
    
    // Basic validation
    if (!taskData.title || !taskData.points) {
      return NextResponse.json(
        { error: "Title and points are required" },
        { status: 400 }
      );
    }
    
    // Create new task
    const newTask = {
      id: (demoInMemoryTasks.length + 1).toString(),
      ...taskData,
      status: taskData.status || "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add to in-memory storage (in real app, save to database)
    demoInMemoryTasks.push(newTask);
    
    return NextResponse.json({ 
      success: true, 
      task: newTask,
      message: "Task created successfully" 
    });
    
  } catch (error) {
    console.error("Task creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...updates } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );
    }
    
    const taskIndex = demoInMemoryTasks.findIndex(task => task.id === id);
    
    if (taskIndex === -1) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }
    
    // Update the task
    demoInMemoryTasks[taskIndex] = {
      ...demoInMemoryTasks[taskIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    return NextResponse.json({ 
      success: true, 
      task: demoInMemoryTasks[taskIndex],
      message: "Task updated successfully" 
    });
    
  } catch (error) {
    console.error("Task update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
