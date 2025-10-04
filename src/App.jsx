import React, { useState, useEffect } from 'react';
// Simple Error Boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    // Log error if needed
  }
  render() {
    if (this.state.hasError) {
      return <div style={{color:'red',padding:'2rem'}}><h2>Something went wrong.</h2><pre>{this.state.error && this.state.error.toString()}</pre></div>;
    }
    return this.props.children;
  }
}
import { 
  Camera, Download, ExternalLink, Github, Mail, Linkedin, 
  Menu, X, Search, Filter, FileText, Database, Box, 
  Rocket, Users, ChevronRight, Play, Star, Zap
} from 'lucide-react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from './config/firebase';
import ModelViewer3D from './components/ModelViewer3D';

// Project Card Component
const ProjectCard = ({ project, onClick }) => {
  const getIcon = (type) => {
    switch(type) {
      case '3D': return <Box className="w-5 h-5" />;
      case 'dataset': return <Database className="w-5 h-5" />;
      case 'research': return <FileText className="w-5 h-5" />;
      case 'demo': return <Rocket className="w-5 h-5" />;
      default: return <Box className="w-5 h-5" />;
    }
  };

  return (
    <div 
      onClick={onClick}
      className="group bg-slate-900 border border-orange-800/30 rounded-xl shadow-lg hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-300 cursor-pointer overflow-hidden"
    >
      <div className="relative h-48 bg-gradient-to-br from-orange-600 via-red-600 to-yellow-600 overflow-hidden">
        <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-slate-950/20 transition-colors"></div>
        <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm">
          <div className="text-white">
            {getIcon(project.tags[0])}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 to-transparent p-4">
          <span className="text-white font-bold text-lg">{project.title}</span>
        </div>
      </div>
      <div className="p-6">
        <div className="flex flex-wrap gap-2 mb-3">
          {project.tags.map((tag, i) => (
            <span key={i} className="px-3 py-1 bg-orange-900/30 border border-orange-700/50 text-orange-400 text-xs rounded-full font-medium">
              {tag}
            </span>
          ))}
        </div>
        <p className="text-slate-400 text-sm mb-4 line-clamp-2">
          {project.description}
        </p>
        <div className="flex items-center text-orange-400 text-sm font-semibold">
          View Details <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
};

// Project Detail Modal
const ProjectDetailModal = ({ project, onClose }) => {

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 overflow-y-auto">
      <div className="min-h-screen px-4 py-8">
        <div className="max-w-5xl mx-auto bg-slate-900 border border-orange-800/30 rounded-2xl shadow-2xl">
          <div className="sticky top-0 bg-slate-900 border-b border-orange-800/30 p-6 rounded-t-2xl z-10">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">{project.title}</h2>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag, i) => (
                    <span key={i} className="px-3 py-1 bg-orange-900/30 border border-orange-700/50 text-orange-400 text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3 text-white">Overview</h3>
              <p className="text-slate-300">{project.description}</p>
            </div>

            {project.metrics && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-white">Key Metrics</h3>
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(project.metrics).map(([key, value]) => (
                    <div key={key} className="bg-slate-800 border border-orange-800/30 p-4 rounded-lg">
                      <div className="text-sm text-orange-400 mb-1 capitalize">{key}</div>
                      <div className="text-xl font-bold text-white">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {project.modelUrl && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-white">3D Model Viewer</h3>
                <ModelViewer3D 
                  modelUrl={project.modelUrl}
                  modelName={project.title}
                  onDownload={() => window.open(project.modelUrl, '_blank')}
                />
              </div>
            )}

            {project.demoUrl && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-white">Live Demo</h3>
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-orange-800/30 rounded-lg p-8 text-center">
                  <Rocket className="w-16 h-16 mx-auto mb-4 text-orange-400" />
                  <p className="text-slate-300 mb-4">Interactive demo available</p>
                  <a 
                    href={project.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-orange-500/50"
                  >
                    Launch Demo <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold mb-3 text-white">Downloads</h3>
              <div className="flex flex-wrap gap-3">
                {project.modelUrl && (
                  <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-orange-700/50 hover:bg-slate-700 text-orange-400 rounded-lg transition-colors">
                    <Download className="w-4 h-4" />
                    <span className="text-sm font-medium">3D Model (.glb)</span>
                  </button>
                )}
                {project.dataUrl && (
                  <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-orange-700/50 hover:bg-slate-700 text-orange-400 rounded-lg transition-colors">
                    <Download className="w-4 h-4" />
                    <span className="text-sm font-medium">Dataset</span>
                  </button>
                )}
                {project.pdfUrl && (
                  <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-orange-700/50 hover:bg-slate-700 text-orange-400 rounded-lg transition-colors">
                    <Download className="w-4 h-4" />
                    <span className="text-sm font-medium">Research Paper (PDF)</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App Component
const TrashinovaApp = () => {
  // Settings state (load from Firestore)
  const [settings, setSettings] = useState({ tagline: '', about: '', siteTitle: 'ORCA', heroDesc: '' });
  const [settingsLoading, setSettingsLoading] = useState(true);
  // Load settings from Firestore
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'site');
        const snap = await import('firebase/firestore').then(m => m.getDoc(docRef));
        if (snap.exists()) {
          // Merge cloud settings with any locally pending edits
          const cloud = snap.data();
          let merged = { ...settings, ...cloud };
          try {
            const pending = JSON.parse(localStorage.getItem('pendingSettingsEdits') || '{}');
            if (pending && Object.keys(pending).length) {
              merged = { ...merged, ...pending };
              // Show notice that there are pending local edits
              setPendingSaveNotice('You have local edits that are not saved to cloud. Sign in at /admin to sync them.');
            }
          } catch (err) {
            // ignore malformed local storage
          }
          setSettings(merged);
        }
      } catch (e) {
        // fallback to default
      } finally {
        setSettingsLoading(false);
      }
    };
    fetchSettings();
  }, []);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Persist editMode in localStorage
  const [editMode, setEditMode] = useState(() => {
    const stored = localStorage.getItem('editMode');
    return stored === 'true';
  });

  useEffect(() => {
    localStorage.setItem('editMode', editMode);
  }, [editMode]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState('all');
  const [activeTab, setActiveTab] = useState('3d-model');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sample data (will be replaced with Firebase data)
  const sampleProjects = [
    {
      id: 1,
      title: "3D Object Model",
      description: "High-resolution 3D model of a space-related object, visualized interactively.",
      tags: ["3D"],
      modelUrl: "/assets/models/object.glb",
      metrics: { polygons: "1.2M", format: ".glb" }
    }
  ];

  const teamMembers = [
    { 
      name: "Member One", 
      role: "Systems Lead", 
      bio: "Leading ORCA systems architecture",
      img: "/assets/team/member1.jpg"
    },
    { 
      name: "Member Two", 
      role: "Orbital Analytics", 
      bio: "Specializing in debris tracking and analysis",
      img: "/assets/team/member2.jpg"
    },
    { 
      name: "Member Three", 
      role: "Materials Specialist", 
      bio: "Research in space material recycling",
      img: "/assets/team/member3.jpg"
    },
    { 
      name: "Member Four", 
      role: "Platform Engineer", 
      bio: "Building ORCA's technical infrastructure",
      img: "/assets/team/member4.jpg"
    },
    { 
      name: "Member Five", 
      role: "Visualization Lead", 
      bio: "Creating interactive 3D experiences",
      img: "/assets/team/member5.jpg"
    }
  ];

  useEffect(() => {
    // Load projects from Firebase
    const loadProjects = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'projects'));
        const loadedProjects = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        if (loadedProjects.length > 0) {
          setProjects(loadedProjects);
        } else {
          setProjects(sampleProjects);
        }

      } catch (error) {
        console.error('Error loading projects:', error);
        setProjects(sampleProjects);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterTag === 'all' || p.tags.includes(filterTag);
    return matchesSearch && matchesFilter;
  });

   // Save About/Tagline edits
   const [pendingSaveNotice, setPendingSaveNotice] = useState('');

   const handleSettingsEdit = async (field, value) => {
     // Optimistically update local state so the UI reflects the change immediately
     setSettings(s => ({ ...s, [field]: value }));

     // Save to Firestore; if it fails (permissions), persist locally and notify the user
     try {
       await updateDoc(doc(db, 'settings', 'site'), { [field]: value });
       // If saved successfully, clear any pending notice
       setPendingSaveNotice('');
     } catch (e) {
       // Persist pending edits locally so they survive reloads
       try {
         const pending = JSON.parse(localStorage.getItem('pendingSettingsEdits') || '{}');
         pending[field] = value;
         localStorage.setItem('pendingSettingsEdits', JSON.stringify(pending));
       } catch (err) {
         console.warn('Could not persist pending edits locally:', err);
       }
       // Inform the user how to sync: sign in at /admin
       setPendingSaveNotice('Your changes were saved locally. Sign in at /admin as a team member to save them to the cloud.');
       console.warn('Settings update failed; saved locally instead.', e);
     }
   };

   // Save Team bio edits
   const handleTeamEdit = async (idx, field, value) => {
     // Save to Firestore (assumes team is in Firestore, not just static)
     // ...existing code for team update if needed...
   };

   if (settingsLoading) return <div className="min-h-screen flex items-center justify-center text-xl text-orange-400">Loading...</div>;
   return (
     <ErrorBoundary>
     <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-lg border-b border-orange-900/30">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 via-red-600 to-yellow-500 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-orange-500/50">
                O
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-yellow-400 bg-clip-text text-transparent">
                ORCA
              </span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#home" className="hover:text-orange-400 transition-colors">Home</a>
              <a href="#projects" className="hover:text-orange-400 transition-colors">Projects</a>
              <a href="#team" className="hover:text-orange-400 transition-colors">Team</a>
              <a href="#research" className="hover:text-orange-400 transition-colors">Research</a>
              <a href="#contact" className="hover:text-orange-400 transition-colors">Contact</a>
              <a 
                href="/admin" 
                className="px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-orange-500/30"
              >
                Admin
              </a>
            </div>

            <button 
              className="md:hidden p-2 hover:bg-slate-900 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-orange-900/30 bg-slate-950">
            <div className="px-4 py-4 space-y-3">
              <a href="#home" className="block py-2 hover:text-orange-400 transition-colors">Home</a>
              <a href="#projects" className="block py-2 hover:text-orange-400 transition-colors">Projects</a>
              <a href="#team" className="block py-2 hover:text-orange-400 transition-colors">Team</a>
              <a href="#research" className="block py-2 hover:text-orange-400 transition-colors">Research</a>
              <a href="#contact" className="block py-2 hover:text-orange-400 transition-colors">Contact</a>
              <a href="/admin" className="block py-2 text-orange-400 font-semibold">Admin Panel</a>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section id="home" className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-950/50 via-slate-950 to-red-950/50"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(251, 146, 60, 0.15) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
             <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-900/30 border border-orange-700/50 text-orange-400 rounded-full text-sm font-semibold mb-8 backdrop-blur-sm">
               <Rocket className="w-4 h-4" />
               NASA Space Apps Challenge 2025
             </div>
            
             <h1 className="text-5xl md:text-7xl font-bold mb-6">
               <span
                   className="bg-gradient-to-r from-orange-400 via-red-400 to-yellow-400 bg-clip-text text-transparent"
                   contentEditable={editMode}
                   suppressContentEditableWarning={true}
                   onBlur={e => editMode && handleSettingsEdit('siteTitle', e.target.innerText)}
                 >
                   {settings.siteTitle || 'ORCA'}
                 </span>
             </h1>
             <p
               className="text-xl md:text-2xl text-slate-300 mb-4 max-w-3xl mx-auto"
               contentEditable={editMode}
               suppressContentEditableWarning={true}
               onBlur={e => editMode && handleSettingsEdit('tagline', e.target.innerText)}
             >
               {settings.tagline || 'Innovating Space Exploration Through Data Science & 3D Visualization'}
             </p>
             <p
               className="text-lg text-slate-400 mb-12 max-w-2xl mx-auto"
               contentEditable={editMode}
               suppressContentEditableWarning={true}
               onBlur={e => editMode && handleSettingsEdit('heroDesc', e.target.innerText)}
             >
               {settings.heroDesc || 'We transform complex space data into interactive experiences, building tools for sustainable space exploration and orbital debris management.'}
             </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <a 
                href="#projects"
                className="group px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white rounded-lg font-semibold transition-all shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50"
              >
                <span className="flex items-center gap-2">
                  Explore ORCA
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </a>
              <a 
                href="https://github.com/"
                className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white border-2 border-orange-700/50 rounded-lg font-semibold transition-all"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>

        {/* Floating particles effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-2 h-2 bg-orange-500 rounded-full animate-pulse" style={{top: '20%', left: '10%'}}></div>
          <div className="absolute w-1 h-1 bg-red-500 rounded-full animate-pulse" style={{top: '60%', left: '80%', animationDelay: '1s'}}></div>
          <div className="absolute w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" style={{top: '40%', left: '90%', animationDelay: '2s'}}></div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              ORCA - Orbital Recycling and Circularity Architecture
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Explore our collection of 3D models, datasets, and research findings
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-orange-800/30 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* ORCA Tabs Section */}
          <div className="mb-8">
            <div role="tablist" className="flex flex-wrap gap-2 mb-6 border-b border-slate-700">
              {[
                { id: '3d-model', label: '3D Object Model' },
                { id: 'web-portal', label: 'Live Web Portal' },
                { id: 'details', label: 'Details of ORCA' },
                { id: 'features', label: 'Functions and Features' },
                { id: 'roadmap', label: 'Roadmap' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`${tab.id}-panel`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? 'text-orange-400 border-orange-400'
                      : 'text-slate-400 border-transparent hover:text-orange-300 hover:border-orange-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content Panels */}
            <div className="min-h-[200px]">
              {activeTab === '3d-model' && (
                <div id="3d-model-panel" role="tabpanel" className="space-y-4">
                  <select
                    value={filterTag}
                    onChange={(e) => setFilterTag(e.target.value)}
                    className="px-4 py-3 bg-slate-900 border border-orange-800/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="all">All Tags</option>
                    <option value="3D">3D Models</option>
                    <option value="dataset">Datasets</option>
                    <option value="research">Research</option>
                    <option value="demo">Demos</option>
                  </select>
                </div>
              )}
              
              {activeTab === 'web-portal' && (
                <div id="web-portal-panel" role="tabpanel" className="p-6 bg-slate-800/50 rounded-lg">
                  <h3 className="text-xl font-semibold text-orange-400 mb-3">Live Web Portal</h3>
                  <p className="text-slate-300">Coming soon: real-time mission and recycling interface.</p>
                </div>
              )}
              
              {activeTab === 'details' && (
                <div id="details-panel" role="tabpanel" className="p-6 bg-slate-800/50 rounded-lg">
                  <h3 className="text-xl font-semibold text-orange-400 mb-3">Details of ORCA</h3>
                  <p className="text-slate-300">Technical architecture, subsystem interactions, and deployment model (placeholder).</p>
                </div>
              )}
              
              {activeTab === 'features' && (
                <div id="features-panel" role="tabpanel" className="p-6 bg-slate-800/50 rounded-lg">
                  <h3 className="text-xl font-semibold text-orange-400 mb-3">Functions and Features</h3>
                  <p className="text-slate-300">Catalog of ORCA capabilities (placeholder).</p>
                </div>
              )}
              
              {activeTab === 'roadmap' && (
                <div id="roadmap-panel" role="tabpanel" className="p-6 bg-slate-800/50 rounded-lg">
                  <h3 className="text-xl font-semibold text-orange-400 mb-3">Roadmap</h3>
                  <p className="text-slate-300">Planned milestones (placeholder).</p>
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-slate-400">Loading projects...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProjects.map(project => (
                <ProjectCard 
                  key={project.id}
                  project={project}
                  onClick={() => setSelectedProject(project)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="py-20 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              Our Team
            </h2>
            <p className="text-xl text-slate-400">
              Meet the innovators behind ORCA
            </p>
            {/* About Team ORCA section */}
             {settings && (
               <div
                 className="mt-6 max-w-2xl mx-auto text-slate-300 text-lg bg-slate-900/60 p-6 rounded-xl border border-orange-800/30"
                 contentEditable={editMode}
                 suppressContentEditableWarning={true}
                 onBlur={e => editMode && handleSettingsEdit('about', e.target.innerText)}
               >
                 {settings.about || 'ORCA (Orbital Recycling and Circularity Architecture) is an initiative to identify, classify, and repurpose orbital debris through intelligent modeling, material tracing, and autonomous recovery planning. This platform unifies data, simulation, and operational tooling to accelerate sustainable space infrastructure.'}
               </div>
             )}
          </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
             {teamMembers.map((member, i) => (
               <div key={i} className="text-center group">
                 <div className="w-32 h-32 mx-auto mb-4 relative">
                   <img 
                     src={member.img} 
                     alt={`Photo of ${member.name}`}
                     className="w-full h-full rounded-full object-cover shadow-lg shadow-orange-500/30 group-hover:shadow-orange-500/50 transition-shadow"
                     onError={(e) => {
                       e.target.style.display = 'none';
                       e.target.nextSibling.style.display = 'flex';
                     }}
                   />
                   <div className="w-full h-full bg-gradient-to-br from-orange-500 via-red-600 to-yellow-500 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-orange-500/30 group-hover:shadow-orange-500/50 transition-shadow hidden">
                     {member.name.split(' ').map(n => n[0]).join('')}
                   </div>
                 </div>
                 <h3
                   className="text-xl font-bold mb-1 text-white"
                   contentEditable={editMode}
                   suppressContentEditableWarning={true}
                   onBlur={e => editMode && handleTeamEdit(i, 'name', e.target.innerText)}
                 >{member.name}</h3>
                 <p
                   className="text-orange-400 font-medium mb-2"
                   contentEditable={editMode}
                   suppressContentEditableWarning={true}
                   onBlur={e => editMode && handleTeamEdit(i, 'role', e.target.innerText)}
                 >{member.role}</p>
                 <p
                   className="text-sm text-slate-400"
                   contentEditable={editMode}
                   suppressContentEditableWarning={true}
                   onBlur={e => editMode && handleTeamEdit(i, 'bio', e.target.innerText)}
                 >{member.bio}</p>
               </div>
             ))}
           </div>
        </div>
      </section>

      {/* Research Section */}
      <section id="research" className="py-20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              Research
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Advancing the science of orbital debris management and space sustainability
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-800/50 p-6 rounded-lg border border-orange-800/30">
              <h3 className="text-xl font-semibold text-orange-400 mb-3">Overview</h3>
              <p className="text-slate-300">Our research focuses on developing innovative approaches to identify, track, and repurpose orbital debris for sustainable space exploration.</p>
            </div>

            <div className="bg-slate-800/50 p-6 rounded-lg border border-orange-800/30">
              <h3 className="text-xl font-semibold text-orange-400 mb-3">Publications</h3>
              <ul className="text-slate-300 space-y-2">
                <li>• Autonomous Debris Classification Systems (2024)</li>
                <li>• Material Recovery in Low Earth Orbit (2024)</li>
                <li>• Predictive Orbital Decay Models (2023)</li>
              </ul>
            </div>

            <div className="bg-slate-800/50 p-6 rounded-lg border border-orange-800/30">
              <h3 className="text-xl font-semibold text-orange-400 mb-3">Open Problems</h3>
              <ul className="text-slate-300 space-y-2">
                <li>• Micro-debris tracking accuracy</li>
                <li>• Cost-effective retrieval mechanisms</li>
                <li>• International debris sharing protocols</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              Contact Us
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Get in touch to collaborate on orbital sustainability initiatives
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="bg-slate-900/50 p-8 rounded-lg border border-orange-800/30">
              <form className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="your.email@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-slate-300 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={6}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Tell us about your project or collaboration idea..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white rounded-lg font-semibold transition-all shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50"
                >
                  Send Message
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-slate-700 text-center">
                <p className="text-slate-400">
                  Or reach us directly at{' '}
                  <a href="mailto:contact@placeholder.domain" className="text-orange-400 hover:text-orange-300 transition-colors">
                    contact@placeholder.domain
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>





      {/* Footer */}
      <footer className="py-12 border-t border-orange-900/30 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-slate-500">
              © 2024 ORCA. Licensed under MIT License.
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <a href="#" className="hover:text-orange-400 transition-colors">Privacy</a>
              <a href="#" className="hover:text-orange-400 transition-colors">Terms</a>
              <a href="https://github.com/orca" className="hover:text-orange-400 transition-colors">GitHub</a>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Deployed on Firebase
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Project Detail Modal */}
      {selectedProject && (
        <ProjectDetailModal 
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </div>
  </ErrorBoundary>);
}

export default TrashinovaApp;