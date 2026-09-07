import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './db.js'; // your drizzle instance
import * as schema from '../db/schema/index.js';
import { sendPasswordResetEmail } from './resend.js';
import { multiSession } from 'better-auth/plugins';
import { expo } from '@better-auth/expo';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
  }),
  plugins: [multiSession(), expo()],

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await db.insert(schema.userPreferences).values({
            userId: user.id,
            defaultServings: '2',
            reminderEnabled: false,
            reminderDay: null,
            reminderTime: null,
            onboardingCompleted: false,
          });
        },
      },
    },
  },

  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      console.log('RESET URL:', url);

      await sendPasswordResetEmail(user.email, url);
    },
  },
  trustedOrigins: [
    'mealplanappfrontend://',

    // Development mode - Expo's exp:// scheme with local IP ranges
    ...(process.env.NODE_ENV === 'development'
      ? [
          'exp://', // Trust any host of the exp:// scheme
          'exp://**', // Trust all Expo URLs (wildcard matching)
          'exp://192.168.*.*:*/**', // Trust 192.168.x.x IP range with any port and path
        ]
      : []),
  ],
});
