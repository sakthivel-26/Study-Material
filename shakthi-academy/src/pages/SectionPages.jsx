import { BookOpen, PlaySquare, FileText } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import CourseCatalog from "../components/CourseCatalog.jsx";
import UploadList from "../components/UploadList.jsx";

export function CoursesPage() {
  return <><PageHeader icon={<BookOpen size={22}/>} title="Exam Courses" subtitle="Open learning for everyone — begin with a free mock, then unlock the full test series."/><CourseCatalog /></>;
}

export function VideosPage() { return <><PageHeader icon={<PlaySquare size={22}/>} title="Video Lectures" subtitle="Watch video lectures and recorded classes"/><UploadList type="video" empty="No videos uploaded yet."/></>; }
export function MaterialsPage() { return <><PageHeader icon={<FileText size={22}/>} title="Study Materials" subtitle="PDF notes, e-books and handouts"/><UploadList type="pdf" empty="No study materials yet."/></>; }
