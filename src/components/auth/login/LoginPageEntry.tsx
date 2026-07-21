import { AuthProvider } from '../AuthProvider';
import { LoginPage } from './LoginPage';

interface Props {
  baseUrl: string;
}

export default function LoginPageEntry({ baseUrl }: Props) {
  return (
    <AuthProvider baseUrl={baseUrl}>
      <LoginPage />
    </AuthProvider>
  );
}
