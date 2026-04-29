import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// POST /api/seed - Trigger re-seeding of the database
export async function POST() {
  try {
    console.log('[SEED] Triggering database re-seed...');

    const { stdout, stderr } = await execAsync('npx prisma db seed', {
      cwd: '/home/z/my-project',
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL,
      },
    });

    if (stderr && !stderr.includes('warning')) {
      console.error('Seed stderr:', stderr);
    }

    console.log('Seed output:', stdout);

    return NextResponse.json({
      message: 'Database re-seeded successfully',
      output: stdout,
    });
  } catch (error: unknown) {
    console.error('Error seeding database:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to seed database';
    return NextResponse.json(
      { error: 'Failed to seed database', details: errorMessage },
      { status: 500 }
    );
  }
}
