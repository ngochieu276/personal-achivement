import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { GuestRoute, ProtectedRoute } from "@/components/layout/RouteGuards";
import { LoginPage } from "@/pages/auth/LoginPage";
import { GroupDetailPage } from "@/pages/groups/GroupDetailPage";
import { ProjectDetailPage } from "@/pages/projects/ProjectDetailPage";
import { ProjectsPage } from "@/pages/projects/ProjectsPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { SubjectDetailPage } from "@/pages/subjects/SubjectDetailPage";

export default function App() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<ProjectsPage />} />
          <Route path="/groups/:id" element={<GroupDetailPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/subjects/:id" element={<SubjectDetailPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
