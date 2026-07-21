import { AuthProvider } from '../AuthProvider';
import { RecoveryPage } from './RecoveryPage';

export default function RecoveryPageEntry() {
  return (
    <AuthProvider>
      <RecoveryPage />
    </AuthProvider>
  );
}
