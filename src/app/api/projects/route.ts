// src/app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { verifyAdminRequest } from '@/lib/adminAuth';
import {
  getProjects,
  hasProjectDatabase,
  normalizeProject,
  readLocalProjects,
  writeLocalProjects,
  type Project,
} from '@/lib/projectsStore';

export const dynamic = 'force-dynamic';

const databaseUrl = process.env.DATABASE_URL?.trim();
const sql = databaseUrl ? neon(databaseUrl) : null;
const allowedSizes = new Set([
  'md:col-span-1',
  'md:col-span-2',
  'md:col-span-2 md:row-span-2',
]);

function unauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

function badRequestResponse(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getStringField(payload: Record<string, unknown>, field: string, maxLength: number) {
  const value = payload[field];

  if (typeof value !== 'string') {
    return { error: `${field} is required` };
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return { error: `${field} is required` };
  }

  if (trimmed.length > maxLength) {
    return { error: `${field} must be ${maxLength} characters or fewer` };
  }

  return { value: trimmed };
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isAllowedImageUrl(value: string) {
  if (value.startsWith('/images/')) {
    return true;
  }

  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'i.ibb.co';
  } catch {
    return false;
  }
}

function validateProjectPayload(payload: unknown, requireId = false) {
  if (!isRecord(payload)) {
    return { error: 'Invalid project payload' };
  }

  const id = Number(payload.id);
  if (requireId && (!Number.isInteger(id) || id <= 0)) {
    return { error: 'id must be a positive integer' };
  }

  const title = getStringField(payload, 'title', 255);
  if (title.error) return { error: title.error };

  const description = getStringField(payload, 'description', 3000);
  if (description.error) return { error: description.error };

  const link = getStringField(payload, 'link', 255);
  if (link.error) return { error: link.error };
  if (!isHttpUrl(link.value!)) {
    return { error: 'link must be a valid http or https URL' };
  }

  const size = getStringField(payload, 'size', 50);
  if (size.error) return { error: size.error };
  if (!allowedSizes.has(size.value!)) {
    return { error: 'size is not allowed' };
  }

  const image = getStringField(payload, 'image', 255);
  if (image.error) return { error: image.error };
  if (!isAllowedImageUrl(image.value!)) {
    return { error: 'image must be a local /images path or an ImgBB URL' };
  }

  if (!Array.isArray(payload.tech)) {
    return { error: 'tech must be an array of strings' };
  }

  const tech = payload.tech
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);

  if (tech.length > 12) {
    return { error: 'tech must contain 12 items or fewer' };
  }

  if (tech.some((item) => item.length > 40)) {
    return { error: 'each tech item must be 40 characters or fewer' };
  }

  return {
    project: {
      ...(requireId ? { id } : {}),
      title: title.value!,
      description: description.value!,
      link: link.value!,
      tech,
      size: size.value!,
      image: image.value!,
    },
  };
}

export async function GET() {
  try {
    return NextResponse.json(await getProjects());
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ error: 'Failed to read projects' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await verifyAdminRequest(request))) {
    return unauthorizedResponse();
  }

  try {
    const validation = validateProjectPayload(await request.json());
    if (validation.error) {
      return badRequestResponse(validation.error);
    }

    const project = validation.project!;
    const techJson = JSON.stringify(project.tech);

    if (hasProjectDatabase()) {
      const rows = await sql!`
        INSERT INTO projects (title, description, link, tech, size, image)
        VALUES (${project.title}, ${project.description}, ${project.link}, ${techJson}::jsonb, ${project.size}, ${project.image})
        RETURNING *;
      `;

      return NextResponse.json(normalizeProject(rows[0] as Project), { status: 201 });
    }

    const projects = await readLocalProjects();
    const nextId = projects.length > 0 ? Math.max(...projects.map((item) => item.id)) + 1 : 1;
    const newProject = normalizeProject({ id: nextId, ...project });
    await writeLocalProjects([...projects, newProject]);

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!(await verifyAdminRequest(request))) {
    return unauthorizedResponse();
  }

  try {
    const validation = validateProjectPayload(await request.json(), true);
    if (validation.error) {
      return badRequestResponse(validation.error);
    }

    const project = validation.project!;
    const techJson = JSON.stringify(project.tech);

    if (hasProjectDatabase()) {
      const rows = await sql!`
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

      return NextResponse.json(normalizeProject(rows[0] as Project));
    }

    const projects = await readLocalProjects();
    const index = projects.findIndex((item) => item.id === Number(project.id));

    if (index === -1) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const updatedProject = normalizeProject({ ...project, id: Number(project.id) });
    projects[index] = updatedProject;
    await writeLocalProjects(projects);

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await verifyAdminRequest(request))) {
    return unauthorizedResponse();
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
       return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      return badRequestResponse('ID must be a positive integer');
    }
    
    if (hasProjectDatabase()) {
      const rows = await sql!`DELETE FROM projects WHERE id = ${numericId} RETURNING id`;
      if (rows.length === 0) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true });
    }

    const projects = await readLocalProjects();
    await writeLocalProjects(projects.filter((project) => project.id !== numericId));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
