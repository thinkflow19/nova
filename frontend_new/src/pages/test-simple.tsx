export default function TestSimple() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Nova.ai Test Page</h1>
        <p className="text-gray-600 mb-8">This is a simple test page to verify the app is working.</p>
        <div className="space-y-2">
          <p className="text-sm text-gray-500">✅ React is working</p>
          <p className="text-sm text-gray-500">✅ TypeScript is working</p>
          <p className="text-sm text-gray-500">✅ Tailwind CSS is working</p>
          <p className="text-sm text-gray-500">✅ Next.js routing is working</p>
        </div>
        <div className="mt-8">
          <a 
            href="/login" 
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </a>
        </div>
      </div>
    </div>
  );
} 