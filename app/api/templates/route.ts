import { NextRequest, NextResponse } from 'next/server';

// This is a simple in-memory store for demo purposes
// In production, you'd use a database
let templates: any[] = [];

export async function GET() {
  return NextResponse.json({ templates });
}

export async function POST(request: NextRequest) {
  try {
    const template = await request.json();
    
    const newTemplate = {
      ...template,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    templates.push(newTemplate);
    
    return NextResponse.json({ template: newTemplate });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }
    
    templates = templates.filter(t => t.id !== id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}