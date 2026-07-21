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
    const courseId = searchParams.get('courseId');
    const userId = searchParams.get('userId');

    // If requesting specific course enrollment
    if (courseId) {
      const enrollment = await EnrollmentService.getEnrollment(user.uid, courseId);
      return NextResponse.json({ enrollment });
    }

    // Admin can view any user's enrollments
    if (userId && user.role === ROLES.ADMIN) {
      const enrollments = await EnrollmentService.getUserEnrollments(userId);
      return NextResponse.json({ enrollments });
    }

    // Get current user's enrollments - without orderBy to avoid index requirement
    const enrollments = await EnrollmentService.getUserEnrollments(user.uid);
    return NextResponse.json({ enrollments });
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    // Check if it's an index error
    const errorMessage = error instanceof Error ? error.message : '';
    if (errorMessage.includes('index')) {
      // Extract index creation link from error
      const match = errorMessage.match(/https:\/\/console\.firebase\.google\.com[^\s]+/);
      const indexLink = match ? match[0] : null;
      return NextResponse.json(
        { 
          error: 'Database index required',
          indexLink,
          message: 'Please create the required Firestore index'
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch enrollments' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { courseId, paymentStatus, paymentAmount, paymentId } = body;

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    const enrollment = await EnrollmentService.enrollUser({
      userId: user.uid,
      courseId,
      paymentStatus,
      paymentAmount,
      paymentId,
    });

    return NextResponse.json({ enrollment }, { status: 201 });
  } catch (error) {
    console.error('Error enrolling user:', error);
    const message = error instanceof Error ? error.message : 'Failed to enroll';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    await EnrollmentService.cancelEnrollment(user.uid, courseId);

    return NextResponse.json({ message: 'Enrollment cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling enrollment:', error);
    const message = error instanceof Error ? error.message : 'Failed to cancel';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
