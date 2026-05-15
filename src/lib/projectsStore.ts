import { neon } from '@neondatabase/serverless';
import { promises as fs } from 'fs';
import path from 'path';

export type Project = {
  id: number;
  title: string;
  description: string;
  link: string;
  tech: string[];
  size: string;
  image: string;
};

const databaseUrl = process.env.DATABASE_URL?.trim();
const sql = databaseUrl ? neon(databaseUrl) : null;
const dataFilePath = path.join(process.cwd(), 'data', 'projects.json');

export function hasProjectDatabase() {
  return Boolean(sql);
}

export function normalizeProject(project: Project): Project {
  return {
    ...project,
    tech: Array.isArray(project.tech)
      ? project.tech
      : JSON.parse(String(project.tech || '[]')),
  };
}

export async function readLocalProjects() {
  try {
    const data = await fs.readFile(dataFilePath, 'utf8');
    return JSON.parse(data).map(normalizeProject) as Project[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }

    throw error;
  }
}

export async function writeLocalProjects(projects: Project[]) {
  await fs.mkdir(path.dirname(dataFilePath), { recursive: true });
  await fs.writeFile(dataFilePath, JSON.stringify(projects, null, 2), 'utf8');
}

export async function seedDatabaseFromLocalFile() {
  if (!sql) {
    return [];
  }

  const localProjects = await readLocalProjects();

  for (const project of localProjects) {
    const techJson = JSON.stringify(project.tech);

    await sql`
      INSERT INTO projects (id, title, description, link, tech, size, image)
      VALUES (${project.id}, ${project.title}, ${project.description}, ${project.link}, ${techJson}::jsonb, ${project.size}, ${project.image})
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        link = EXCLUDED.link,
        tech = EXCLUDED.tech,
        size = EXCLUDED.size,
        image = EXCLUDED.image;
    `;
  }

  if (localProjects.length > 0) {
    await sql`
      SELECT setval(
        pg_get_serial_sequence('projects', 'id'),
        (SELECT MAX(id) FROM projects)
      );
    `;
  }

  return localProjects;
}

export async function getDatabaseProjects() {
  if (!sql) {
    return [];
  }

  const rows = await sql`SELECT * FROM projects ORDER BY id ASC`;
  return rows.map(normalizeProject);
}

export async function getProjects() {
  if (sql) {
    let projects = await getDatabaseProjects();

    if (projects.length === 0) {
      await seedDatabaseFromLocalFile();
      projects = await getDatabaseProjects();
    }

    return projects;
  }

  return readLocalProjects();
}

export async function getProjectById(id: number) {
  const projects = await getProjects();

  return projects.find((project) => project.id === id) ?? null;
}
