import { Navigate, Route, Routes } from "react-router-dom";

import { LoginScreen } from "./screens/LoginScreen";
import { DashboardScreen } from "./screens/DashboardScreen";
import { NotesScreen } from "./screens/NotesScreen";
import { NoteEditorScreen } from "./screens/NoteEditorScreen";
import { ContactsScreen } from "./screens/ContactsScreen";
import { ContactEditorScreen } from "./screens/ContactEditorScreen";
import { LinksScreen } from "./screens/LinksScreen";
import { LinkEditorScreen } from "./screens/LinkEditorScreen";
import { ProtectedLayout } from "./screens/ProtectedLayout";
import { useAuth } from "./lib/auth";
import { Spinner } from "./components/ui";

function RootRedirect() {
  const { user, hydrated } = useAuth();
  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size={28} />
      </div>
    );
  }
  return <Navigate to={user ? "/dashboard" : "/login"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginScreen />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard" element={<DashboardScreen />} />
        <Route path="/dashboard/notes" element={<NotesScreen />} />
        <Route path="/dashboard/notes/new" element={<NoteEditorScreen mode="create" />} />
        <Route path="/dashboard/notes/:id" element={<NoteEditorScreen mode="edit" />} />
        <Route path="/dashboard/contacts" element={<ContactsScreen />} />
        <Route path="/dashboard/contacts/new" element={<ContactEditorScreen mode="create" />} />
        <Route path="/dashboard/contacts/:id" element={<ContactEditorScreen mode="edit" />} />
        <Route path="/dashboard/links" element={<LinksScreen />} />
        <Route path="/dashboard/links/new" element={<LinkEditorScreen mode="create" />} />
        <Route path="/dashboard/links/:id" element={<LinkEditorScreen mode="edit" />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
