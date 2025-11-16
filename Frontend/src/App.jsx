import { useState, useMemo } from "react";
import "./App.css";
import Dashboard from "./Pages/Dashboard";
import GenerateNotes from "./Pages/GenerateNotes";
import MyNotes from "./Pages/MyNotes";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import HeroSection from "./Components/HeroSection";
import Navbar from "./Components/Navbar";
import TargetCursor from "./Components/TargetCursor";
import Dock from "./Components/Dock";
import { useAuth } from "./Context/AuthContext";
import {
  LayoutDashboard,
  Plus,
  FolderOpen,
  LogOut,
  Home,
} from "lucide-react";

function App() {
  const [authView, setAuthView] = useState("login");
  const [currentPage, setCurrentPage] = useState("home");
  const { user, loading, logout } = useAuth();

  const dockItems = useMemo(() => {
    if (!user) return [];
    return [
      { 
        id: "home", 
        label: "Home", 
        icon: <Home className="w-6 h-6" />,
        onClick: () => setCurrentPage("home")
      },
      { 
        id: "dashboard", 
        label: "Dashboard", 
        icon: <LayoutDashboard className="w-6 h-6" />,
        onClick: () => setCurrentPage("dashboard")
      },
      { 
        id: "generate", 
        label: "Generate", 
        icon: <Plus className="w-6 h-6" />,
        onClick: () => setCurrentPage("generate")
      },
      { 
        id: "notes", 
        label: "My Notes", 
        icon: <FolderOpen className="w-6 h-6" />,
        onClick: () => setCurrentPage("notes")
      },
      { 
        id: "logout", 
        label: "Logout", 
        icon: <LogOut className="w-6 h-6" />,
        onClick: logout
      },
    ];
  }, [user, logout]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <p className="text-lg font-medium">Loading your workspace...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <TargetCursor spinDuration={2} hideDefaultCursor={true} parallaxOn={true} />
        {authView === "login" ? (
          <Login onSwitch={() => setAuthView("register")} />
        ) : (
          <Register onSwitch={() => setAuthView("login")} />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TargetCursor spinDuration={2} hideDefaultCursor={true} parallaxOn={true} />
      
      {currentPage !== "home" && (
        <Navbar onNavigate={setCurrentPage} currentPage={currentPage} />
      )}

      <main className={currentPage !== "home" ? "pt-16" : ""}>
        {currentPage === "home" && <HeroSection onNavigate={setCurrentPage} />}
        {currentPage === "dashboard" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
            <Dashboard />
          </div>
        )}
        {currentPage === "generate" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
            <GenerateNotes />
          </div>
        )}
        {currentPage === "notes" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
            <MyNotes />
          </div>
        )}
      </main>

      {user && currentPage !== "home" && <Dock items={dockItems} />}
    </div>
  );
}

export default App;
