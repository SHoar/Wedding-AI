import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ROUTES } from "./constants/routes";
import { MainLayout } from "./layouts/MainLayout";
import { AIQnAPage } from "./pages/AIQnAPage";
import { DashboardPage } from "./pages/DashboardPage";
import { FAQDocPage } from "./pages/FAQDocPage";
import { FAQLandingPage } from "./pages/FAQLandingPage";
import { GuestbookPage } from "./pages/GuestbookPage";
import { GuestsPage } from "./pages/GuestsPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { TasksPage } from "./pages/TasksPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />} path={ROUTES.HOME}>
          <Route element={<DashboardPage />} index />
          <Route element={<GuestsPage />} path={ROUTES.GUESTS.slice(1)} />
          <Route element={<GuestbookPage />} path={ROUTES.GUESTBOOK.slice(1)} />
          <Route element={<TasksPage />} path={ROUTES.TASKS.slice(1)} />
          <Route element={<AIQnAPage />} path={ROUTES.AI.slice(1)} />
          <Route element={<FAQLandingPage />} path={ROUTES.FAQ.slice(1)} />
          <Route element={<FAQDocPage />} path={`${ROUTES.FAQ.slice(1)}/:slug`} />
          <Route element={<NotFoundPage />} path="*" />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
