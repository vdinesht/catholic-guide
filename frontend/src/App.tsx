import { BrowserRouter, Link, Outlet, Route, Routes } from 'react-router-dom';
import { PrefsProvider } from './lib/prefs';
import { ActivityPage } from './portal/ActivityPage';
import { DashboardPage } from './portal/DashboardPage';
import { AuthProvider, RequireAuth } from './portal/PortalContext';
import { PortalLayout } from './portal/PortalLayout';
import { PrayerEditorPage } from './portal/PrayerEditorPage';
import { PrayersListPage } from './portal/PrayersListPage';
import { ReadingEditorPage } from './portal/ReadingEditorPage';
import { ReadingsCalendarPage } from './portal/ReadingsCalendarPage';
import { SettingsPage } from './portal/SettingsPage';
import { SignInPage } from './portal/SignInPage';
import { SongEditorPage } from './portal/SongEditorPage';
import { SongsListPage } from './portal/SongsListPage';
import { UsersPage } from './portal/UsersPage';
import { PrayersPage } from './site/PrayersPage';
import { ReadingsPage } from './site/ReadingsPage';
import { SearchPage } from './site/SearchPage';
import { SiteProvider } from './site/SiteContext';
import { SiteLayout } from './site/SiteLayout';
import { SongsPage } from './site/SongsPage';
import { TodayPage } from './site/TodayPage';

function PublicRoot() {
  return (
    <SiteProvider>
      <SiteLayout />
    </SiteProvider>
  );
}

function PortalRoot() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

function NotFound() {
  return (
    <div className="wrap" style={{ padding: '64px 16px' }}>
      <h1 className="p-title">Page not found</h1>
      <p className="muted">
        <Link to="/" style={{ textDecoration: 'underline' }}>
          Go to today's readings
        </Link>
      </p>
    </div>
  );
}

export function App() {
  return (
    <PrefsProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicRoot />}>
            <Route index element={<TodayPage />} />
            <Route path="readings" element={<ReadingsPage />} />
            <Route path="readings/:date" element={<ReadingsPage />} />
            <Route path="prayers" element={<PrayersPage />} />
            <Route path="prayers/:slug" element={<PrayersPage />} />
            <Route path="songs" element={<SongsPage />} />
            <Route path="songs/:slug" element={<SongsPage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route path="portal" element={<PortalRoot />}>
            <Route path="sign-in" element={<SignInPage />} />
            <Route element={<PortalLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="readings" element={<ReadingsCalendarPage />} />
              <Route path="readings/:date" element={<ReadingEditorPage />} />
              <Route path="prayers" element={<PrayersListPage />} />
              <Route path="prayers/:id" element={<PrayerEditorPage />} />
              <Route path="songs" element={<SongsListPage />} />
              <Route path="songs/:id" element={<SongEditorPage />} />
              <Route path="users" element={<RequireAuth admin><UsersPage /></RequireAuth>} />
              <Route path="activity" element={<RequireAuth admin><ActivityPage /></RequireAuth>} />
              <Route path="settings" element={<RequireAuth admin><SettingsPage /></RequireAuth>} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </PrefsProvider>
  );
}
