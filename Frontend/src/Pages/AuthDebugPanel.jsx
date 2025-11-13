import { useAuth } from "../Context/AuthContext";

function AuthDebugPanel() {
  const { user, token, loading, isAuthenticated } = useAuth();

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const tokenPreview = token 
    ? `${token.substring(0, 20)}...${token.substring(token.length - 10)}`
    : 'No token';

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-xl max-w-sm z-50 text-xs font-mono">
      <div className="font-bold text-yellow-400 mb-2">🔐 Auth Debug</div>
      
      <div className="space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-400">Status:</span>
          <span className={isAuthenticated ? "text-green-400" : "text-red-400"}>
            {isAuthenticated ? "✅ Authenticated" : "❌ Not Auth"}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">Loading:</span>
          <span className="text-blue-400">{loading ? "Yes" : "No"}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">User:</span>
          <span className="text-purple-400">{user?.email || "None"}</span>
        </div>

        <div className="border-t border-gray-700 pt-2 mt-2">
          <div className="text-gray-400 mb-1">Token:</div>
          <div className="text-green-400 break-all text-[10px]">
            {tokenPreview}
          </div>
        </div>

        <div className="border-t border-gray-700 pt-2 mt-2">
          <div className="text-gray-400 mb-1">LocalStorage:</div>
          <div className="text-orange-400">
            {localStorage.getItem("token") ? "✅ Has token" : "❌ No token"}
          </div>
        </div>
      </div>

      <button
        onClick={() => {
          console.log("=== AUTH STATE ===");
          console.log("User:", user);
          console.log("Token:", token);
          console.log("LocalStorage token:", localStorage.getItem("token"));
          console.log("Is authenticated:", isAuthenticated);
        }}
        className="mt-3 w-full bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs"
      >
        Log to Console
      </button>
    </div>
  );
}

export default AuthDebugPanel;