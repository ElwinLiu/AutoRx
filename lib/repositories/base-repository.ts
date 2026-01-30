import { SQLiteDatabase } from 'expo-sqlite';
import { getDatabase } from '@/lib/db';

/**
 * Base repository class that provides common database operations.
 * All repositories should extend this class.
 */
export abstract class BaseRepository {
  protected async getDb(): Promise<SQLiteDatabase> {
    return getDatabase();
  }

  /**
   * Execute a database operation with consistent error handling
   */
  protected async execute<T>(operation: (db: SQLiteDatabase) => Promise<T>): Promise<T> {
    try {
      const db = await this.getDb();
      return await operation(db);
    } catch (error) {
      console.error(`[${this.constructor.name}] Database error:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Transform database errors into application-specific errors
   */
  private handleError(error: unknown): Error {
    if (error instanceof Error) {
      // SQLite constraint violations
      if (error.message.includes('UNIQUE constraint failed')) {
        return new Error('A record with this identifier already exists');
      }
      if (error.message.includes('FOREIGN KEY constraint failed')) {
        return new Error('Referenced record does not exist');
      }
      if (error.message.includes('NOT NULL constraint failed')) {
        return new Error('Required field is missing');
      }
      return error;
    }
    return new Error('An unexpected database error occurred');
  }

  /**
   * Generate a unique ID for new records
   */
  protected generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current timestamp in milliseconds
   */
  protected now(): number {
    return Date.now();
  }
}
