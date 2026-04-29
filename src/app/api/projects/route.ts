// src/app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL || '');

// Fungsi untuk memastikan tabel database ada
async function ensureTableExists() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        link VARCHAR(255) NOT NULL,
        tech JSONB NOT NULL,
        size VARCHAR(50) NOT NULL,
        image VARCHAR(255) NOT NULL
      );
    `;
  } catch (error) {
    console.error('Error creating table:', error);
  }
}

export async function GET() {
  try {
    await ensureTableExists();
    const rows = await sql`SELECT * FROM projects ORDER BY id ASC`;
    return NextResponse.json(rows);
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ error: 'Failed to read projects' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureTableExists();
    const project = await request.json();
    const techJson = JSON.stringify(project.tech);
    
    const rows = await sql`
      INSERT INTO projects (title, description, link, tech, size, image)
      VALUES (${project.title}, ${project.description}, ${project.link}, ${techJson}::jsonb, ${project.size}, ${project.image})
      RETURNING *;
    `;
    
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await ensureTableExists();
    const project = await request.json();
    const techJson = JSON.stringify(project.tech);
    
    const rows = await sql`
      UPDATE projects 
      SET title = ${project.title}, 
          description = ${project.description}, 
          link = ${project.link}, 
          tech = ${techJson}::jsonb, 
          size = ${project.size}, 
          image = ${project.image}
      WHERE id = ${project.id}
      RETURNING *;
    `;
    
    if (rows.length === 0) {
       return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await ensureTableExists();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
       return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    
    await sql`DELETE FROM projects WHERE id = ${id}`;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
