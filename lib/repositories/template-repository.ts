import { BaseRepository } from './base-repository';
import type { Template } from '@/types/models';

// Database row types
interface TemplateRow {
  id: string;
  name: string;
  created_at: number;
  updated_at: number;
}

interface SectionRow {
  id: string;
  name: string;
  order_index: number;
}

/**
 * Repository for Template-related database operations
 */
export class TemplateRepository extends BaseRepository {
  private static instance: TemplateRepository;

  static getInstance(): TemplateRepository {
    if (!TemplateRepository.instance) {
      TemplateRepository.instance = new TemplateRepository();
    }
    return TemplateRepository.instance;
  }

  /**
   * Get all templates
   */
  async getAll(): Promise<Template[]> {
    return this.execute(async (db) => {
      const rows = await db.getAllAsync<TemplateRow>(
        `SELECT id, name, created_at, updated_at
         FROM templates
         WHERE deleted_at IS NULL
         ORDER BY name ASC`
      );

      const templates: Template[] = [];
      for (const row of rows) {
        const sections = await this.getSectionsForTemplate(row.id);
        templates.push(this.mapToTemplate(row, sections));
      }

      return templates;
    });
  }

  /**
   * Get a single template by ID
   */
  async getById(id: string): Promise<Template | null> {
    return this.execute(async (db) => {
      const row = await db.getFirstAsync<TemplateRow>(
        `SELECT id, name, created_at, updated_at
         FROM templates
         WHERE id = ? AND deleted_at IS NULL`,
        [id]
      );

      if (!row) return null;

      const sections = await this.getSectionsForTemplate(id);
      return this.mapToTemplate(row, sections);
    });
  }

  /**
   * Get template by name
   */
  async getByName(name: string): Promise<Template | null> {
    return this.execute(async (db) => {
      const row = await db.getFirstAsync<TemplateRow>(
        `SELECT id, name, created_at, updated_at
         FROM templates
         WHERE name = ? COLLATE NOCASE AND deleted_at IS NULL`,
        [name]
      );

      if (!row) return null;

      const sections = await this.getSectionsForTemplate(row.id);
      return this.mapToTemplate(row, sections);
    });
  }

  /**
   * Search templates by name
   */
  async search(query: string): Promise<Template[]> {
    const searchTerm = `%${query}%`;

    return this.execute(async (db) => {
      const rows = await db.getAllAsync<TemplateRow>(
        `SELECT id, name, created_at, updated_at
         FROM templates
         WHERE deleted_at IS NULL AND name LIKE ? COLLATE NOCASE
         ORDER BY name ASC`,
        [searchTerm]
      );

      const templates: Template[] = [];
      for (const row of rows) {
        const sections = await this.getSectionsForTemplate(row.id);
        templates.push(this.mapToTemplate(row, sections));
      }

      return templates;
    });
  }

  /**
   * Create a new template with sections
   */
  async create(data: {
    name: string;
    sections: Array<{ name: string }>;
  }): Promise<Template> {
    return this.execute(async (db) => {
      const id = this.generateId();
      const now = this.now();

      // Use explicit transaction
      await db.execAsync('BEGIN TRANSACTION');

      try {
        await db.runAsync(
          `INSERT INTO templates (id, name, created_at, updated_at)
           VALUES (?, ?, ?, ?)`,
          [id, data.name, now, now]
        );

        // Insert sections
        for (let i = 0; i < data.sections.length; i++) {
          await db.runAsync(
            `INSERT INTO template_sections (id, template_id, name, order_index, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [this.generateId(), id, data.sections[i].name, i, now, now]
          );
        }

        await db.execAsync('COMMIT');
      } catch (error) {
        await db.execAsync('ROLLBACK');
        throw error;
      }

      const template = await this.getById(id);
      if (!template) throw new Error('Failed to create template');
      return template;
    });
  }

  /**
   * Update an existing template
   */
  async update(
    id: string,
    data: {
      name?: string;
      sections?: Array<{ id?: string; name: string }>;
    }
  ): Promise<Template> {
    return this.execute(async (db) => {
      const now = this.now();

      // Use explicit transaction
      await db.execAsync('BEGIN TRANSACTION');

      try {
        // Update template name if provided
        if (data.name !== undefined) {
          await db.runAsync(
            'UPDATE templates SET name = ?, updated_at = ? WHERE id = ?',
            [data.name, now, id]
          );
        }

        // Update sections if provided
        if (data.sections !== undefined) {
          // Delete existing template sections
          await db.runAsync(
            'DELETE FROM template_sections WHERE template_id = ?',
            [id]
          );

          // Insert new sections with fresh IDs
          for (let i = 0; i < data.sections.length; i++) {
            const section = data.sections[i];
            await db.runAsync(
              `INSERT INTO template_sections (id, template_id, name, order_index, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [this.generateId(), id, section.name, i, now, now]
            );
          }
        }

        await db.execAsync('COMMIT');
      } catch (error) {
        await db.execAsync('ROLLBACK');
        throw error;
      }

      const template = await this.getById(id);
      if (!template) throw new Error('Template not found after update');
      return template;
    });
  }

  /**
   * Soft delete a template
   */
  async delete(id: string): Promise<void> {
    return this.execute(async (db) => {
      await db.runAsync(
        'UPDATE templates SET deleted_at = ? WHERE id = ?',
        [this.now(), id]
      );
    });
  }

  /**
   * Get the default template (first one, or create a default)
   */
  async getDefault(): Promise<Template> {
    return this.execute(async (db) => {
      const templates = await this.getAll();

      if (templates.length > 0) {
        return templates[0];
      }

      // Create a default template if none exist
      return this.create({
        name: 'Default',
        sections: [{ name: 'Instructions' }],
      });
    });
  }

  // Private helper methods

  private async getSectionsForTemplate(
    templateId: string
  ): Promise<Array<{ id: string; name: string }>> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<SectionRow>(
      `SELECT id, name
       FROM template_sections
       WHERE template_id = ?
       ORDER BY order_index ASC`,
      [templateId]
    );

    return rows.map((row) => ({ id: row.id, name: row.name }));
  }

  private mapToTemplate(
    row: TemplateRow,
    sections: Array<{ id: string; name: string }>
  ): Template {
    return {
      id: row.id,
      name: row.name,
      instructionSections: sections,
      lastEdited: new Date(row.updated_at).toLocaleDateString(),
      isDefault: false,
    };
  }
}

// Export singleton instance
export const templateRepository = TemplateRepository.getInstance();
