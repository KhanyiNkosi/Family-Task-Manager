import { NextResponse } from "next/server";

// Simple in-memory user storage for demo
const demoUsers = [
  { id: "1", email: "parent@example.com", name: "Parent User", role: "parent" }
];

export async function POST(request: Request) {
  try {
    const { email, password, name, role = "parent" } = await request.json();
    
    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }
    
    // Check if user already exists (demo logic)
    const existingUser = demoUsers.find(user => user.email === email);
    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }
    
    // Create new user (in real app, hash the password!)
    const newUser = {
      id: (demoUsers.length + 1).toString(),
      email,
      name: name || email.split('@')[0],
      role,
      createdAt: new Date().toISOString()
    };
    
    // In demo, just add to array (in real app, save to database)
    demoUsers.push(newUser);
    
    return NextResponse.json({ 
      success: true, 
      user: { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role },
      message: "Registration successful" 
    });
    
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
