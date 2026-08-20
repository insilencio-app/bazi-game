import { HomePage } from './pages/HomePage';
import { MailboxAdminPage } from './pages/MailboxAdminPage';
import { MailboxPage } from './pages/MailboxPage';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { LESSON_ROUTE_PATTERN, ROUTES } from './routes';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path={ROUTES.home} element={<HomePage />} />
          <Route path={ROUTES.elements} element={<HomePage />} />
          <Route path={ROUTES.lessons} element={<HomePage />} />
          <Route path={LESSON_ROUTE_PATTERN} element={<HomePage />} />
          <Route path={ROUTES.badges} element={<HomePage />} />
          <Route path={ROUTES.stems} element={<HomePage />} />
          <Route path={ROUTES.gods} element={<HomePage />} />
          <Route path={ROUTES.totalQuiz} element={<HomePage />} />
          <Route path={ROUTES.mailbox} element={<MailboxPage />} />
          <Route path={ROUTES.mailboxAdmin} element={<MailboxAdminPage />} />
          <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
