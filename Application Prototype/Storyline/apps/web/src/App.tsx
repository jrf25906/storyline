import { Routes, Route } from 'react-router-dom';
import { Layout } from '@components/layout/Layout';
import { EditorPage } from '@pages/EditorPage';
import { HomePage } from '@pages/HomePage';
import { DocumentsPage } from '@pages/DocumentsPage';
import { SettingsPage } from '@pages/SettingsPage';
import { useAuthStore } from '@stores/authStore';
import { AuthGuard } from '@components/common/AuthGuard';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route 
          path="editor/:documentId?" 
          element={
            <AuthGuard>
              <EditorPage />
            </AuthGuard>
          } 
        />
        <Route 
          path="documents" 
          element={
            <AuthGuard>
              <DocumentsPage />
            </AuthGuard>
          } 
        />
        <Route 
          path="settings" 
          element={
            <AuthGuard>
              <SettingsPage />
            </AuthGuard>
          } 
        />
      </Route>
    </Routes>
  );
}

export default App;