import { AuthProvider } from '../AuthProvider';
import { RecoveryPage } from './RecoveryPage';

interface Props {
  baseUrl: string;
}

export default function RecoveryPageEntry({ baseUrl }: Props) {
  return (
    <AuthProvider baseUrl={baseUrl}>
      <RecoveryPage />
    </AuthProvider>
  );
}
