import { NextPage } from 'next';
import Link from 'next/link';

const NotFoundPage: NextPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">404 - Page Not Found</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link href="/" className="mt-4 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
        Go back home
      </Link>
    </div>
  );
};

export default NotFoundPage; 