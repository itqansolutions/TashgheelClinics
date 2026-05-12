import { useNavigate } from 'react-router-dom';
import { ShieldOff, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function ForbiddenPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-red-50 mx-auto mb-4">
          <ShieldOff className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
        <p className="text-sm text-gray-500 mt-2 mb-6">
          You don't have permission to view this page.
        </p>
        <Button onClick={() => navigate('/dashboard')} leftIcon={<Home className="w-4 h-4" />}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center">
        <p className="text-7xl font-black text-gray-200 mb-4">404</p>
        <h1 className="text-xl font-bold text-gray-900">Page not found</h1>
        <p className="text-sm text-gray-500 mt-2 mb-6">
          The page you're looking for doesn't exist.
        </p>
        <Button onClick={() => navigate('/dashboard')} leftIcon={<Home className="w-4 h-4" />}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
