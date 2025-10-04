import React, { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { LogIn, LogOut, Shield } from 'lucide-react';

const AdminAuth = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isTeamMember, setIsTeamMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Emergency override for known admin emails
        const adminEmails = [
          "arjyaarindam@gmail.com",
          "aishwarjaaa@gmail.com",
          "adibajafna72@gmail.com",
          "kayerx7@gmail.com",
          "abidhossain3112078@gmail.com"
        ];
        
        if (adminEmails.includes(currentUser.email) || currentUser.uid === "rd5VwwDKPvOUFB4HupzFKTC2HND2") {
          setIsTeamMember(true);
          return setLoading(false);
        }
        
        try {
          const teamMemberDoc = await getDoc(doc(db, 'teamMembers', currentUser.uid));
          setIsTeamMember(teamMemberDoc.exists());
        } catch (err) {
          console.error('Error checking team member status:', err);
          setIsTeamMember(false);
        }
      } else {
        setIsTeamMember(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setEmail('');
      setPassword('');
    } catch (err) {
      setError('Invalid credentials. Only team members can access admin features.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-slate-900 border border-orange-800/30 rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Team Access</h2>
            <p className="text-slate-400">Sign in to manage content</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="team@trashinova.space"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-orange-500/50"
            >
              <LogIn className="w-5 h-5" />
              Sign In
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => window.location.href = '/'}
              className="text-orange-400 hover:text-orange-300 text-sm font-medium"
            >
              ← Back to Portfolio
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show access denied if authenticated but not a team member
  if (!isTeamMember) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-slate-900 border border-orange-800/30 rounded-2xl shadow-2xl p-8 text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-slate-400 mb-6">
            You are not registered as a team member.
          </p>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // Render children with admin access
  return (
    <div>
      {/* Admin Bar */}
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 py-2 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <span className="font-semibold">Admin Mode</span>
            <span className="text-orange-200 text-sm">({user.email})</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
      
      {/* Add padding to account for admin bar */}
      <div className="pt-12">
        {children}
      </div>
    </div>
  );
};

export default AdminAuth;