import { AuthProvider } from '../AuthProvider';
import { SettingsPage } from './SettingsPage';

export default function SettingsPageEntry() {
  return (
    <AuthProvider>
      <SettingsPage />
    </AuthProvider>
  );
}
