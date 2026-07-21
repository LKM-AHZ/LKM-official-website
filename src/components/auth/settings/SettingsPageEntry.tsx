import { AuthProvider } from '../AuthProvider';
import { SettingsPage } from './SettingsPage';

interface Props {
  baseUrl: string;
}

export default function SettingsPageEntry({ baseUrl }: Props) {
  return (
    <AuthProvider baseUrl={baseUrl}>
      <SettingsPage />
    </AuthProvider>
  );
}
