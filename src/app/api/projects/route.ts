// src/app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const DATA_FILE = join(process.cwd(), 'data', 'projects.json');

// Ensure data directory exists
async function ensureDataFile() {
  try {
    await readFile(DATA_FILE);
  } catch {
    await writeFile(DATA_FILE, JSON.stringify([], null, 2));
  }
}

export async function GET() {
  try {
    await ensureDataFile();
    const data = await readFile(DATA_FILE, 'utf-8');
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read projects' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDataFile();
    const newProject = await request.json();
    const data = await readFile(DATA_FILE, 'utf-8');
    const projects = JSON.parse(data);
    
    const id = Math.max(...projects.map((p: any) => p.id), 0) + 1;
    const project = { ...newProject, id };
    
    projects.push(project);
    await writeFile(DATA_FILE, JSON.stringify(projects, null, 2));
    
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await ensureDataFile();
    const { id, ...updatedProject } = await request.json();
    const data = await readFile(DATA_FILE, 'utf-8');
    let projects = JSON.parse(data);
    
    projects = projects.map((p: any) => (p.id === id ? { ...p, ...updatedProject, id } : p));
    await writeFile(DATA_FILE, JSON.stringify(projects, null, 2));
    
    return NextResponse.json({ id, ...updatedProject });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await ensureDataFile();
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id') || '');
    
    const data = await readFile(DATA_FILE, 'utf-8');
    let projects = JSON.parse(data);
    
    projects = projects.filter((p: any) => p.id !== id);
    await writeFile(DATA_FILE, JSON.stringify(projects, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
