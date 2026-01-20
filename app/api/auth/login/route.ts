import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    // Simple demo authentication (replace with real auth in production)
    if (email && password) {
      // For demo purposes, accept any credentials
      const user = {
        id: "1",
        name: "Parent User",
        email: email,
        role: "parent"
      };
      
      return NextResponse.json({ 
        success: true, 
        user,
        message: "Login successful" 
      });
    }
    
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
