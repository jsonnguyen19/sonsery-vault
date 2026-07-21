import FileUploader from "@/components/file-uploader";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-slate-900 text-white">
      <FileUploader />
    </main>
  );
}
