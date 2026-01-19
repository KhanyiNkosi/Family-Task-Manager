// app/api/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '@/app/middleware/auth';

const prisma = new PrismaClient();

export const POST = authMiddleware(async (request: NextRequest) => {
  try {
    const user = (request as any).user;
    const body = await request.json();
    
    console.log('Received task data:', body);
    console.log('User creating task:', user.userId);

    const { title, description, points, dueDate, assignedToId } = body;

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Set default points if not provided
    const pointsNum = points ? parseInt(points) : 10;
    if (isNaN(pointsNum)) {
      return NextResponse.json(
        { error: 'Points must be a number' },
        { status: 400 }
      );
    }

    // Validate assignedToId exists if provided
    let assignedToIdValue = assignedToId;
    if (assignedToId && assignedToId.trim() !== '') {
      const assignedUser = await prisma.user.findUnique({
        where: { id: assignedToId }
      });
      
      if (!assignedUser) {
        return NextResponse.json(
          { error: 'Assigned user not found' },
          { status: 400 }
        );
      }
    } else {
      // If no assignedToId, assign to the creator (self-assigned)
      assignedToIdValue = user.userId;
    }

    // Prepare task data according to schema
    const taskData: any = {
      title,
      description: description || '',
      points: pointsNum,
      assignedToId: assignedToIdValue,
      createdById: user.userId,
      completed: false
    };

    // Add dueDate if provided
    if (dueDate) {
      taskData.dueDate = new Date(dueDate);
    }

    console.log('Creating task with data:', taskData);

    // Create task
    const task = await prisma.task.create({
      data: taskData,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    });

    console.log('Task created successfully:', task.id);

    return NextResponse.json(
      { message: 'Task created successfully', task },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create task error details:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message
      },
      { status: 500 }
    );
  }
});

export const GET = authMiddleware(async (request: NextRequest) => {
  try {
    const user = (request as any).user;
    const { searchParams } = new URL(request.url);
    
    // Get query parameters
    const completed = searchParams.get('completed');
    const assignedToId = searchParams.get('assignedToId');
    const createdById = searchParams.get('createdById');
    
    // Build query conditions
    const where: any = {};
    
    if (completed !== null) {
      where.completed = completed === 'true';
    }
    
    if (assignedToId) {
      where.assignedToId = assignedToId;
    }
    
    if (createdById) {
      where.createdById = createdById;
    }
    
    // If child user, can only see tasks assigned to them
    if (user.role === 'CHILD') {
      where.assignedToId = user.userId;
    }

    console.log('Fetching tasks with where clause:', where);

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ tasks });
  } catch (error: any) {
    console.error('Get tasks error details:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message
      },
      { status: 500 }
    );
  }
});
