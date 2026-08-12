import { BookOpen, PlaySquare, FileText } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import CategoryGrid from "../components/CategoryGrid.jsx";
import ContinueLearning from "../components/ContinueLearning.jsx";
import UploadList from "../components/UploadList.jsx";
import { useApp } from "../store.jsx";

export function CoursesPage() {
  return (
    <>
      <PageHeader icon={<BookOpen size={22} />} title="Courses" subtitle="Your enrolled programs across categories" />
      <div className="space-y-10">
        <ContinueLearning />
        <CategoryGrid />
      </div>
    </>
  );
}

export function VideosPage() {
  return (
    <>
      <PageHeader icon={<PlaySquare size={22} />} title="Video Lectures" subtitle="Watch video lectures and recorded classes" />
      <UploadList type="video" empty="No videos uploaded yet." />
    </>
  );
}

export function MaterialsPage() {
  return (
    <>
      <PageHeader icon={<FileText size={22} />} title="Study Materials" subtitle="PDF notes, e-books and handouts" />
      <UploadList type="pdf" empty="No study materials yet." />
    </>
  );
}

