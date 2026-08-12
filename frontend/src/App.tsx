import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { CreditsPage } from "./pages/CreditsPage";
import { EntryPage } from "./pages/EntryPage";
import { EvidenceSubmissionPage } from "./pages/EvidenceSubmissionPage";
import { HelpPage } from "./pages/HelpPage";
import { NewWorkflowPage } from "./pages/NewWorkflowPage";
import { SettingsPage } from "./pages/SettingsPage";
import { WorkflowInboxPage } from "./pages/WorkflowInboxPage";
import { WorkflowRoomPage } from "./pages/WorkflowRoomPage";

export function AppRoutes() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<EntryPage />} />
        <Route path="/workflows" element={<WorkflowInboxPage />} />
        <Route path="/workflows/new" element={<NewWorkflowPage />} />
        <Route path="/workflows/:workflowId" element={<WorkflowRoomPage />} />
        <Route
          path="/workflows/:workflowId/evidence/:stepId"
          element={<EvidenceSubmissionPage />}
        />
        <Route path="/credits" element={<CreditsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
