import { AuthProvider } from '../AuthProvider';
import { LoginPage } from './LoginPage';

export default function LoginPageEntry() {
  return (
    <AuthProvider>
      <LoginPage />
    </AuthProvider>
  );
}
