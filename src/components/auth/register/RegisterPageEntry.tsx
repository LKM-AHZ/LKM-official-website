import { AuthProvider } from '../AuthProvider';
import { RegisterPage } from './RegisterPage';

interface Props {
  baseUrl: string;
}

export default function RegisterPageEntry({ baseUrl }: Props) {
  return (
    <AuthProvider baseUrl={baseUrl}>
      <RegisterPage />
    </AuthProvider>
  );
}
