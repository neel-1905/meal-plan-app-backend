import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../../lib/db.js';
import { userPreferences } from '../../db/schema/user-preferences.schema.js';
import { eq } from 'drizzle-orm';
import { UpdateUserPreferencesDto } from './dto/update-user-preferences.dto.js';

@Injectable()
export class UserPreferencesService {
  async getPreferences(userId: string) {
    const [preferences] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    if (!preferences) {
      throw new NotFoundException('User preferences not found');
    }

    return preferences;
  }

  async updatePreferences(userId: string, dto: UpdateUserPreferencesDto) {
    const [preferences] = await db
      .insert(userPreferences)
      .values({
        userId,
        defaultServings: dto.defaultServings,
        onboardingCompleted: dto.onboardingCompleted,
      })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: {
          defaultServings: dto.defaultServings,
          onboardingCompleted: dto.onboardingCompleted,
          updatedAt: new Date(),
        },
      })
      .returning();

    return preferences;
  }
}
