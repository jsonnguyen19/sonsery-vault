export default function StudentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Students</h1>
        <p className="text-sm text-gray-400 mt-1">Manage your students</p>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
        <p className="text-gray-400">No students enrolled yet.</p>
      </div>
    </div>
  );
}
