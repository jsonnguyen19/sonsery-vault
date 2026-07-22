const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

exports.onEnrollmentCreate = onDocumentCreated('enrollments/{enrollmentId}', async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    console.log('No data associated with the event');
    return;
  }

  const enrollmentData = snapshot.data();
  const { userId, courseId } = enrollmentData;

  console.log(`New enrollment detected: userId=${userId}, courseId=${courseId}`);

  try {
    // Fetch course details
    const courseDoc = await db.collection('courses').doc(courseId).get();
    if (!courseDoc.exists) {
      console.error(`Course ${courseId} not found`);
      return;
    }
    const courseTitle = courseDoc.data().title;

    // Create notification
    await db.collection('notifications').add({
      userId: userId,
      title: '🎉 Course Enrolled!',
      message: `You have successfully enrolled in "${courseTitle}". Start learning now!`,
      type: 'success',
      link: '/dashboard/progress',
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Notification created for user ${userId}`);
  } catch (error) {
    console.error('Error creating notification:', error);
  }
});
