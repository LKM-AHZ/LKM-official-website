import { AuthProvider } from '../AuthProvider';
import { RegisterPage } from './RegisterPage';

export default function RegisterPageEntry() {
  return (
    <AuthProvider>
      <RegisterPage />
    </AuthProvider>
  );
}
