import { BrowserRouter, Route, Routes } from "react-router-dom";
import { MainLayout } from "./layouts/MainLayout";
import { AIQnAPage } from "./pages/AIQnAPage";
import { DashboardPage } from "./pages/DashboardPage";
import { GuestbookPage } from "./pages/GuestbookPage";
import { GuestsPage } from "./pages/GuestsPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { TasksPage } from "./pages/TasksPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />} path="/">
          <Route element={<DashboardPage />} index />
          <Route element={<GuestsPage />} path="guests" />
          <Route element={<GuestbookPage />} path="guestbook" />
          <Route element={<TasksPage />} path="tasks" />
          <Route element={<AIQnAPage />} path="ai" />
          <Route element={<NotFoundPage />} path="*" />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
