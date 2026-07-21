import { NextRequest, NextResponse } from 'next/server';
import { EnrollmentService } from '@/lib/services/enrollment';
import { getCurrentUser } from '@/lib/auth/session';
import { ROLES } from '@/lib/auth/roles';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    // Admin can view any user's stats
    const targetUserId = userId && user.role === ROLES.ADMIN ? userId : user.uid;

    const stats = await EnrollmentService.getEnrollmentStats(targetUserId);

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching enrollment stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
