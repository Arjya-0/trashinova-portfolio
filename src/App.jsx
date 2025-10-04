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
  const [settings, setSettings] = useState({ tagline: '', about: '', siteTitle: 'Trashinova', heroDesc: '' });
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
      title: "Container Control Module",
      description: "Advanced 3D model of ORCA's Container Control Module - a key component for automated waste sorting and processing in Mars habitats.",
      tags: ["3D", "ORCA"],
      modelUrl: "/assets/models/container_control_module.glb",
      metrics: { format: ".glb", category: "MIRU Component" }
    },
    {
      id: 2,
      title: "Modular Inorganic Recycling Unit",
      description: "Visual Computer-Aided Design Model of the MIRU system - the core recycling unit that processes inorganic waste materials in Mars habitats using advanced sorting and processing algorithms.",
      tags: ["3D", "ORCA", "CAD"],
      modelUrl: "/assets/models/Modular Inorganic Recycling Unit - Visual Computer-Aided Design Model.obj",
      metrics: { format: ".obj", category: "MIRU Core System" }
    }
  ];

  const teamMembers = [
    { 
      name: "Arjya Arindam", 
      email: "arjyaarindam@gmail.com",
      role: "Team Lead & Systems Architect", 
      bio: "Leading ORCA systems architecture and project vision. Passionate about sustainable space exploration.",
      img: "/assets/team/arjya.jpg"
    },
    { 
      name: "Debojite Chandra", 
      email: "debojitechandra@gmail.com",
      role: "Technical Lead & 3D Designer", 
      bio: "Designing MIRU components and managing technical infrastructure for Mars recycling systems.",
      img: "/assets/team/debojite.jpg"
    },
    { 
      name: "Rafsan Ahmed", 
      email: "rafsan.ahmed@gmail.com",
      role: "Research Coordinator", 
      bio: "Research specialist in space material recycling and waste management technologies.",
      img: "/assets/team/rafsan.jpg"
    },
    { 
      name: "Naimul Islam", 
      email: "naimul.islam@gmail.com",
      role: "Platform Engineer", 
      bio: "Building ORCA's technical infrastructure and web portal development.",
      img: "/assets/team/naimul.jpg"
    },
    { 
      name: "Sakib Rahman", 
      email: "sakib.rahman@gmail.com",
      role: "Data Analyst", 
      bio: "Analyzing Mars habitat data and optimizing recycling algorithms for maximum efficiency.",
      img: "/assets/team/sakib.jpg"
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
                T
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-yellow-400 bg-clip-text text-transparent">
                Trashinova
              </span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#home" className="hover:text-orange-400 transition-colors">Home</a>
              <a href="#projects" className="hover:text-orange-400 transition-colors">Projects</a>
              <a href="#team" className="hover:text-orange-400 transition-colors">Team</a>
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
                   {settings.siteTitle || 'Trashinova'}
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
                href="https://github.com/trashinova/Orbital-Recycling-Circularity-Architecture-ORCA-Mars-Recycling"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white border-2 border-orange-700/50 rounded-lg font-semibold transition-all"
              >
                GitHub
              </a>
              <a 
                href="https://youtu.be/cdW8Pyqrz4k?si=KNJP6FuIOkTR7JCQ"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 bg-red-900 hover:bg-red-800 text-white border-2 border-red-700/50 rounded-lg font-semibold transition-all flex items-center gap-2"
              >
                <Play className="w-5 h-5" />
                30 Seconds of Glory
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
                  <p className="text-slate-300 mb-4">Real-time mission and recycling interface.</p>
                  <a 
                    href="https://arjya-0.github.io/mars-wastenet-dashboard/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg font-semibold transition-all shadow-lg"
                  >
                    <ExternalLink className="w-5 h-5" />
                    ORCA Live Portal Link
                  </a>
                </div>
              )}
              
              {activeTab === 'details' && (
                <div id="details-panel" role="tabpanel" className="p-6 bg-slate-800/50 rounded-lg space-y-6">
                  <h3 className="text-2xl font-semibold text-orange-400 mb-4">Details of ORCA</h3>
                  
                  {/* Summary Section */}
                  <div className="bg-gradient-to-r from-orange-900/20 to-red-900/20 p-6 rounded-lg border border-orange-500/20">
                    <h4 className="text-xl font-bold text-orange-300 mb-3">Summary</h4>
                    <p className="text-slate-200 leading-relaxed">
                      ORCA (Orbital Recycling & Circularity Architecture) is a youth-led innovation tackling Mars waste challenges, where traditional disposal is impossible and resupply limited. Designed by a dynamic youth team, all high schoolers from Dhaka, showcasing fresh talent in space innovation, it fuses MIRU's mechanical shred/melt/extrude tech with BICL's bio-inspired metabolism, transforming inorganics into habitat resources. This zero-waste system supports Renovations (reusing foams/alloys for structures), Celebrations (turning pouches into morale-boosting décor), and Discoveries (repurposing carbon-based waste into advanced material loops)—maximizing recovery with minimal energy and water. A global "Wish Wall" portal connects Earthlings to Martians, fostering cultural ties and STEM inspiration. ORCA shifts exploration from exploitative to regenerative, proving young innovators can pioneer sustainable space futures.
                    </p>
                  </div>

                  {/* Detailed Project Description */}
                  <div className="space-y-6">
                    <h4 className="text-xl font-bold text-blue-300">Detailed Project Description</h4>
                    
                    <div className="bg-slate-700/30 p-5 rounded-lg">
                      <p className="text-slate-200 font-medium mb-3">A scalable architecture turning trash into resources, minimizing energy/water while boosting morale via cultural outputs.</p>
                      
                      <p className="text-slate-300 leading-relaxed mb-4">
                        In Apollo missions, astronauts faced regolith adhesion and scattering under low gravity—today, Mars missions encounter a mounting waste crisis, with ~12,600 kg of inorganics (plastics, metals, fabrics) accumulating over three years for an 8-crew habitat at Jezero Crater. Mars' thin atmosphere and limited resupply windows exacerbate this challenge, posing risks to safety, storage, and sustainability.
                      </p>
                      
                      <p className="text-slate-300 leading-relaxed">
                        ORCA (Orbital Recycling & Circularity Architecture) is a scalable architecture turning trash into resources, minimizing energy/water while boosting morale via cultural outputs. Alignment with NASA Challenge: Directly tackles sustainable recycling for Mars habitats, focusing on reuse (max recovery, min inputs/outputs) across scenarios.
                      </p>
                    </div>

                    {/* Core ORCA System */}
                    <div className="space-y-4">
                      <h5 className="text-lg font-bold text-cyan-300">Core ORCA System</h5>
                      
                      {/* MIRU Section */}
                      <div className="bg-slate-700/20 p-4 rounded-lg border-l-4 border-orange-400">
                        <h6 className="font-bold text-orange-300 mb-2">2.1 Modular Intelligent Recycling Unit (MIRU)</h6>
                        <p className="text-slate-300 text-sm leading-relaxed mb-3">
                          A plug-and-play core processing inorganics, leveraging AI-sorting (optical/thermal/magnetic sensors) to handle ~4 kg/sol. Design principles: Compact sealed modules for dust/radiation protection, scalable for colony growth (TRL 5–7, inspired by NASA's Refabricator/Trash Compaction Processing System (TCPS)). Regolith and waste mixing enhance material durability, addressing in-space manufacturing gaps.
                        </p>
                        
                        <div className="grid md:grid-cols-2 gap-3 text-sm">
                          <div className="space-y-1">
                            <p><strong className="text-orange-200">Plastics:</strong> <span className="text-slate-300">Shredded, melted, extruded into 3D-printing filament</span></p>
                            <p><strong className="text-orange-200">Metals:</strong> <span className="text-slate-300">Induction melting + reshaping into tools/alloys</span></p>
                            <p><strong className="text-orange-200">Fabrics/Clothing:</strong> <span className="text-slate-300">Shredded and repurposed into insulation/filters</span></p>
                            <p><strong className="text-orange-200">Rubber/Elastomers:</strong> <span className="text-slate-300">Patching/devulcanization for seals/dampers</span></p>
                          </div>
                          <div className="space-y-1">
                            <p><strong className="text-orange-200">Electronics:</strong> <span className="text-slate-300">Dismantling for component salvage</span></p>
                            <p><strong className="text-orange-200">Glass/Ceramics:</strong> <span className="text-slate-300">Crushed into shielding tiles/fillers</span></p>
                            <p><strong className="text-orange-200">Composites:</strong> <span className="text-slate-300">Precision cutting for reinforcement</span></p>
                            <p><strong className="text-orange-200">Foams/Insulation:</strong> <span className="text-slate-300">Compaction/reshaping for substrates</span></p>
                          </div>
                        </div>
                      </div>

                      {/* BICL Section */}
                      <div className="bg-slate-700/20 p-4 rounded-lg border-l-4 border-green-400">
                        <h6 className="font-bold text-green-300 mb-2">2.2 Bio-Inspired Closed Loop (BICL)</h6>
                        <p className="text-slate-300 text-sm leading-relaxed mb-3">
                          A sealed booster chamber inside MIRU, drawing from fungal binding techniques as a horizon vision to reinforce and repurpose inorganic wastes into composite materials. Inspiration: Indigenous weaving/mycelial processes for cultural value. Inorganic waste categorization guides its focus, with myco-material feasibility tested against in-space needs.
                        </p>
                        
                        <div className="space-y-2 text-sm">
                          <p><strong className="text-green-200">Fungal-Inspired Binding:</strong> <span className="text-slate-300">Reinforces microplastics/foams into myco-panels</span></p>
                          <p><strong className="text-green-200">Myco-Architecture Bricks & Panels:</strong> <span className="text-slate-300">Integration of regolith/inorganics into sturdy elements</span></p>
                          <p><strong className="text-green-200">Foam Binding & Recycling:</strong> <span className="text-slate-300">Reinforces insulation with fungal-inspired networks</span></p>
                          <p><strong className="text-green-200">Microplastic Capture & Rebinding:</strong> <span className="text-slate-300">Traps/resolidifies residues into usable composites</span></p>
                        </div>
                      </div>

                      {/* Hydraulic Press */}
                      <div className="bg-slate-700/20 p-4 rounded-lg border-l-4 border-blue-400">
                        <h6 className="font-bold text-blue-300 mb-2">2.3 Hydraulic Press Module</h6>
                        <p className="text-slate-300 text-sm leading-relaxed mb-2">
                          Dual units (external for oversized inputs &gt;2x2m door, internal for output reduction) as preprocessing step, reducing volume and preparing feedstock.
                        </p>
                        <div className="space-y-1 text-sm">
                          <p><strong className="text-blue-200">Foam Compaction:</strong> <span className="text-slate-300">Reduces storage needs for habitat use</span></p>
                          <p><strong className="text-blue-200">Regolith Blending:</strong> <span className="text-slate-300">Integrates Jezero minerals for shielding composites</span></p>
                          <p><strong className="text-blue-200">Panel Formation:</strong> <span className="text-slate-300">Shapes outputs for repairs</span></p>
                        </div>
                      </div>

                      {/* Digital Layer */}
                      <div className="bg-slate-700/20 p-4 rounded-lg border-l-4 border-purple-400">
                        <h6 className="font-bold text-purple-300 mb-2">2.4 Core Digital Layer</h6>
                        <p className="text-slate-300 text-sm leading-relaxed mb-3">
                          Real-Time Portal: AI dashboard with NASA APIs (e.g., Mars Weather for env optimization, Power for energy scheduling). The portal promotes STEM challenges and citizen participation, inspiring global collaboration in Mars missions.
                        </p>
                        <div className="space-y-2 text-sm">
                          <p><strong className="text-purple-200">Onboard Dashboard:</strong> <span className="text-slate-300">Monitors system health with real-time metrics</span></p>
                          <p><strong className="text-purple-200">Earth Integration:</strong> <span className="text-slate-300">"Wish Wall" for citizen messages/art submissions, plus STEM challenges</span></p>
                          <p><strong className="text-purple-200">Future Accord Readiness:</strong> <span className="text-slate-300">Blockchain for audits under Interplanetary Waste Accord</span></p>
                        </div>
                      </div>
                    </div>

                    {/* How Does It Work */}
                    <div className="bg-gradient-to-r from-slate-800/40 to-slate-700/40 p-5 rounded-lg">
                      <h5 className="text-lg font-bold text-yellow-300 mb-3">How Does It Work?</h5>
                      <p className="text-slate-300 text-sm leading-relaxed mb-4">
                        ORCA's workflow transforms waste into resources through seamless integration: Waste → External Press → MIRU Intake → AI Sort → BICL Enhance → Internal Press → Outputs. Adaptive via APIs for Martian conditions.
                      </p>
                      
                      <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div className="bg-red-900/20 p-3 rounded border border-red-600/20">
                          <h6 className="font-bold text-red-300 mb-2">3.1 Residence Renovations</h6>
                          <p className="text-slate-300 text-xs">Recycling habitat cubes, foam packaging, aluminum structures for structural repairs and upgrades.</p>
                        </div>
                        <div className="bg-yellow-900/20 p-3 rounded border border-yellow-600/20">
                          <h6 className="font-bold text-yellow-300 mb-2">3.2 Cosmic Celebrations</h6>
                          <p className="text-slate-300 text-xs">Repurposing materials into party supplies and morale-boosting décor with Earth contributions.</p>
                        </div>
                        <div className="bg-green-900/20 p-3 rounded border border-green-600/20">
                          <h6 className="font-bold text-green-300 mb-2">3.3 Daring Discoveries</h6>
                          <p className="text-slate-300 text-xs">Recycling EVA waste, filters, and scientific equipment for operational reuse.</p>
                        </div>
                      </div>
                    </div>

                    {/* Advantages */}
                    <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 p-5 rounded-lg">
                      <h5 className="text-lg font-bold text-blue-300 mb-3">Advantages over Previous Systems</h5>
                      <div className="space-y-2 text-sm">
                        <p><strong className="text-blue-200">Maximized Resource Recovery:</strong> <span className="text-slate-300">Converts all inorganic waste streams into reusable materials</span></p>
                        <p><strong className="text-blue-200">Bio-Hybrid Reinforcement:</strong> <span className="text-slate-300">BICL leverages fungal-inspired binding for enhanced durability</span></p>
                        <p><strong className="text-blue-200">Global Engagement:</strong> <span className="text-slate-300">"Wish Wall" and STEM challenges connect Earth youth with Mars missions</span></p>
                        <p><strong className="text-blue-200">Scalable Design:</strong> <span className="text-slate-300">MIRU and BICL modules adapt to Moon or asteroid habitats</span></p>
                        <p><strong className="text-blue-200">Environmental Optimization:</strong> <span className="text-slate-300">NASA API integration ensures adaptive operation under Martian conditions</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'features' && (
                <div id="features-panel" role="tabpanel" className="p-6 bg-slate-800/50 rounded-lg space-y-6">
                  <h3 className="text-2xl font-semibold text-orange-400 mb-4">Functions and Features</h3>
                  
                  {/* MIRU Core */}
                  <div className="bg-gradient-to-r from-orange-900/20 to-red-900/20 p-6 rounded-lg border border-orange-500/20">
                    <h4 className="text-xl font-bold text-orange-300 mb-4 flex items-center gap-2">
                      <Box className="w-6 h-6" />
                      1. MIRU Core
                    </h4>
                    
                    <div className="space-y-4">
                      <div className="bg-slate-700/30 p-4 rounded-lg">
                        <h5 className="font-bold text-orange-200 mb-2">Waste Intake & Classification:</h5>
                        <ul className="text-slate-300 text-sm space-y-1 list-disc list-inside">
                          <li>Automated multi-sensor scanning (visual, spectral, density)</li>
                          <li>Intelligent sorting of plastics, metals, composites, and organics</li>
                          <li>Detection of contamination or hazardous materials</li>
                        </ul>
                      </div>
                      
                      <div className="bg-slate-700/30 p-4 rounded-lg">
                        <h5 className="font-bold text-orange-200 mb-2">Mechanical Processing:</h5>
                        <ul className="text-slate-300 text-sm space-y-1 list-disc list-inside">
                          <li>Shredding, grinding, pulverizing, and compaction into modular blocks</li>
                          <li>Particle size adjustment for optimized bio-processing</li>
                        </ul>
                      </div>
                      
                      <div className="bg-slate-700/30 p-4 rounded-lg">
                        <h5 className="font-bold text-orange-200 mb-2">Adaptive Workflow:</h5>
                        <ul className="text-slate-300 text-sm space-y-1 list-disc list-inside">
                          <li>Dynamic adjustment of processing strategy based on incoming waste composition and volume</li>
                          <li>Prioritization of critical or high-value waste streams</li>
                        </ul>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-slate-700/30 p-4 rounded-lg">
                          <h5 className="font-bold text-orange-200 mb-2">Modular Integration:</h5>
                          <ul className="text-slate-300 text-sm space-y-1 list-disc list-inside">
                            <li>Seamless interfacing with BICL reactor, storage units, or future modules</li>
                          </ul>
                        </div>
                        <div className="bg-slate-700/30 p-4 rounded-lg">
                          <h5 className="font-bold text-orange-200 mb-2">Monitoring & Diagnostics:</h5>
                          <ul className="text-slate-300 text-sm space-y-1 list-disc list-inside">
                            <li>Continuous sensor tracking of system efficiency and potential failures</li>
                            <li>Predictive maintenance alerts to ensure uninterrupted operation</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* BICL Reactor */}
                  <div className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 p-6 rounded-lg border border-green-500/20">
                    <h4 className="text-xl font-bold text-green-300 mb-4 flex items-center gap-2">
                      <Zap className="w-6 h-6" />
                      2. BICL Reactor
                    </h4>
                    
                    <div className="space-y-4">
                      <div className="bg-slate-700/30 p-4 rounded-lg">
                        <h5 className="font-bold text-green-200 mb-2">Bio-Conversion:</h5>
                        <ul className="text-slate-300 text-sm space-y-1 list-disc list-inside">
                          <li>Engineered microbes and fungi convert processed waste into reusable compounds</li>
                          <li>Capable of processing both organic and select inorganic materials</li>
                        </ul>
                      </div>
                      
                      <div className="bg-slate-700/30 p-4 rounded-lg">
                        <h5 className="font-bold text-green-200 mb-2">Closed-Loop Resource Management:</h5>
                        <ul className="text-slate-300 text-sm space-y-1 list-disc list-inside">
                          <li>Recycling of water, nutrients, and byproducts for habitat sustainability</li>
                          <li>Minimization of overall waste footprint</li>
                        </ul>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-slate-700/30 p-4 rounded-lg">
                          <h5 className="font-bold text-green-200 mb-2">Real-Time Monitoring & Feedback:</h5>
                          <ul className="text-slate-300 text-sm space-y-1 list-disc list-inside">
                            <li>Sensors track microbial health, conversion efficiency, and byproduct quality</li>
                            <li>Adaptive regulation of temperature, airflow, and moisture levels</li>
                          </ul>
                        </div>
                        <div className="bg-slate-700/30 p-4 rounded-lg">
                          <h5 className="font-bold text-green-200 mb-2">Integration with Habitat Systems:</h5>
                          <ul className="text-slate-300 text-sm space-y-1 list-disc list-inside">
                            <li>Directing usable byproducts for in-situ resource utilization, including bio-plastics, fertilizer, and energy precursors</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dual Hydraulic Press */}
                  <div className="bg-gradient-to-r from-blue-900/20 to-cyan-900/20 p-6 rounded-lg border border-blue-500/20">
                    <h4 className="text-xl font-bold text-blue-300 mb-4 flex items-center gap-2">
                      <Database className="w-6 h-6" />
                      3. Dual Hydraulic Press
                    </h4>
                    
                    <div className="space-y-4">
                      <div className="bg-slate-700/30 p-4 rounded-lg">
                        <h5 className="font-bold text-blue-200 mb-2">High-Efficiency Compaction:</h5>
                        <ul className="text-slate-300 text-sm space-y-1 list-disc list-inside">
                          <li>Reduces waste volume by 50–70%, optimized for Martian gravity</li>
                          <li>Standardizes waste modules for storage, transport, or bio-processing</li>
                        </ul>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-slate-700/30 p-4 rounded-lg">
                          <h5 className="font-bold text-blue-200 mb-2">Automated Operation:</h5>
                          <ul className="text-slate-300 text-sm space-y-1 list-disc list-inside">
                            <li>Fully integrated with MIRU processing cycles</li>
                            <li>Safety sensors prevent overpressure and misalignment</li>
                          </ul>
                        </div>
                        <div className="bg-slate-700/30 p-4 rounded-lg">
                          <h5 className="font-bold text-blue-200 mb-2">Energy Optimization:</h5>
                          <ul className="text-slate-300 text-sm space-y-1 list-disc list-inside">
                            <li>Intelligent hydraulic control minimizes energy consumption per cycle</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Earth Portal */}
                  <div className="bg-gradient-to-r from-purple-900/20 to-indigo-900/20 p-6 rounded-lg border border-purple-500/20">
                    <h4 className="text-xl font-bold text-purple-300 mb-4 flex items-center gap-2">
                      <ExternalLink className="w-6 h-6" />
                      4. Earth Portal (Website)
                    </h4>
                    
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-slate-700/30 p-4 rounded-lg">
                          <h5 className="font-bold text-purple-200 mb-2">Live Monitoring:</h5>
                          <ul className="text-slate-300 text-sm space-y-1 list-disc list-inside">
                            <li>Real-time streaming of waste flows, processing stages, and module status</li>
                          </ul>
                        </div>
                        <div className="bg-slate-700/30 p-4 rounded-lg">
                          <h5 className="font-bold text-purple-200 mb-2">Control & Suggestion Interface:</h5>
                          <ul className="text-slate-300 text-sm space-y-1 list-disc list-inside">
                            <li>Remote operators can propose adjustments or trigger automated protocols</li>
                          </ul>
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-slate-700/30 p-4 rounded-lg">
                          <h5 className="font-bold text-purple-200 mb-2">Data Logging & Research:</h5>
                          <ul className="text-slate-300 text-sm space-y-1 list-disc list-inside">
                            <li>Long-term analytics for waste processing efficiency, microbial health, and resource utilization</li>
                            <li>Public awareness & collaboration: Educational visualization of the Mars recycling system</li>
                          </ul>
                        </div>
                        <div className="bg-slate-700/30 p-4 rounded-lg">
                          <h5 className="font-bold text-purple-200 mb-2">Community Engagement:</h5>
                          <ul className="text-slate-300 text-sm space-y-1 list-disc list-inside">
                            <li>Gamified elements allow Earth users to contribute virtually and track system impact</li>
                            <li>Enables scientific collaboration and community engagement</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Future Features */}
                  <div className="bg-gradient-to-r from-yellow-900/20 to-amber-900/20 p-6 rounded-lg border border-yellow-500/20">
                    <h4 className="text-xl font-bold text-yellow-300 mb-4 flex items-center gap-2">
                      <Star className="w-6 h-6" />
                      5. Horizon/Future-Ready Features
                    </h4>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="bg-slate-700/30 p-3 rounded">
                          <h5 className="font-bold text-yellow-200 text-sm mb-1">Nano-Recycler Swarm:</h5>
                          <p className="text-slate-300 text-xs">Autonomous microbots targeting hard-to-reach or dispersed waste</p>
                        </div>
                        <div className="bg-slate-700/30 p-3 rounded">
                          <h5 className="font-bold text-yellow-200 text-sm mb-1">AI-Driven Optimization:</h5>
                          <p className="text-slate-300 text-xs">Machine learning predicts waste surges, schedules modules, and minimizes energy consumption</p>
                        </div>
                        <div className="bg-slate-700/30 p-3 rounded">
                          <h5 className="font-bold text-yellow-200 text-sm mb-1">Advanced Bio-Engineering:</h5>
                          <p className="text-slate-300 text-xs">Genetically tailored microbes and fungi optimized for Martian conditions</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="bg-slate-700/30 p-3 rounded">
                          <h5 className="font-bold text-yellow-200 text-sm mb-1">Brain Interface:</h5>
                          <p className="text-slate-300 text-xs">Neural control for direct human interaction with ORCA modules via neural networks</p>
                        </div>
                        <div className="bg-slate-700/30 p-3 rounded">
                          <h5 className="font-bold text-yellow-200 text-sm mb-1">Interplanetary Waste Accord:</h5>
                          <p className="text-slate-300 text-xs">Global collaboration protocols for standardized space waste management</p>
                        </div>
                        <div className="bg-slate-700/30 p-3 rounded">
                          <h5 className="font-bold text-yellow-200 text-sm mb-1">Bio-Artistic Weaving:</h5>
                          <p className="text-slate-300 text-xs">Transformation of recycled materials into functional and artistic habitat structures</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'roadmap' && (
                <div id="roadmap-panel" role="tabpanel" className="p-6 bg-slate-800/50 rounded-lg space-y-6">
                  <h3 className="text-2xl font-semibold text-orange-400 mb-4">ORCA Project Roadmap</h3>
                  
                  {/* Phase-based Roadmap */}
                  <div className="space-y-6">
                    <h4 className="text-xl font-bold text-blue-300 mb-4">Development Phases</h4>
                    
                    {/* Phase 0 */}
                    <div className="bg-gradient-to-r from-slate-800/40 to-slate-700/40 p-6 rounded-lg border-l-4 border-orange-400">
                      <h5 className="text-lg font-bold text-orange-300 mb-3">Phase 0 — Conceptual Foundation (Now)</h5>
                      <p className="text-slate-300 mb-3"><strong>Objective:</strong> Define the vision, modules, and system goals.</p>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h6 className="font-bold text-orange-200 mb-2">Key Actions:</h6>
                          <ul className="text-slate-300 text-sm space-y-1 list-disc list-inside">
                            <li>Map Mars waste types and volumes</li>
                            <li>Define recycling goals: reuse, repurpose, reduce</li>
                            <li>Split ORCA into core modules</li>
                            <li>Identify data sources and simulations for feasibility</li>
                          </ul>
                        </div>
                        <div>
                          <h6 className="font-bold text-orange-200 mb-2">Core Modules:</h6>
                          <ul className="text-slate-300 text-sm space-y-1 list-disc list-inside">
                            <li>MIRU Core (modular recycling ecosystem)</li>
                            <li>BICL Reactor (bio-inspired closed loop)</li>
                            <li>Dual Hydraulic Press (mechanical compaction)</li>
                            <li>Astronaut UI (real-time control)</li>
                            <li>Earth Portal (remote monitoring & awareness)</li>
                          </ul>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <h6 className="font-bold text-orange-200 mb-2">Deliverables:</h6>
                        <p className="text-slate-300 text-sm">Concept diagrams, preliminary system architecture, initial feasibility report</p>
                      </div>
                    </div>

                    {/* Phase 1 */}
                    <div className="bg-gradient-to-r from-slate-800/40 to-slate-700/40 p-6 rounded-lg border-l-4 border-green-400">
                      <h5 className="text-lg font-bold text-green-300 mb-3">Phase 1 — Feasibility & Prototype</h5>
                      <p className="text-slate-300 mb-3"><strong>Objective:</strong> Build working prototypes for each module.</p>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h6 className="font-bold text-green-200 mb-2">Key Actions:</h6>
                          <ul className="text-slate-300 text-sm space-y-1 list-disc list-inside">
                            <li>MIRU Modules: Design and 3D print compact functional models</li>
                            <li>BICL Reactor: Test microbial efficiency in Earth analog conditions</li>
                            <li>Hydraulic Press: Prototype press mechanics for Martian gravity</li>
                            <li>UI Development: Astronaut dashboard + Earth portal basics</li>
                          </ul>
                        </div>
                        <div>
                          <h6 className="font-bold text-green-200 mb-2">Testing:</h6>
                          <ul className="text-slate-300 text-sm space-y-1 list-disc list-inside">
                            <li>Conduct simulations for energy use</li>
                            <li>Test waste throughput capabilities</li>
                            <li>Validate safety protocols</li>
                          </ul>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <h6 className="font-bold text-green-200 mb-2">Deliverables:</h6>
                        <p className="text-slate-300 text-sm">Prototype videos, functional demos, feasibility report</p>
                      </div>
                    </div>

                    {/* Phase 2 */}
                    <div className="bg-gradient-to-r from-slate-800/40 to-slate-700/40 p-6 rounded-lg border-l-4 border-blue-400">
                      <h5 className="text-lg font-bold text-blue-300 mb-3">Phase 2 — Integrated Testing</h5>
                      <p className="text-slate-300 mb-3"><strong>Objective:</strong> Merge modules into a single ORCA system for coordinated operation.</p>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h6 className="font-bold text-blue-200 mb-2">Key Actions:</h6>
                          <ul className="text-slate-300 text-sm space-y-1 list-disc list-inside">
                            <li>Synchronize MIRU + BICL + Press modules</li>
                            <li>Implement astronaut UI controls for real-time optimization</li>
                            <li>Test full waste flow: collection → compaction → bio-recycling → repurpose</li>
                          </ul>
                        </div>
                        <div>
                          <h6 className="font-bold text-blue-200 mb-2">Metrics:</h6>
                          <ul className="text-slate-300 text-sm space-y-1 list-disc list-inside">
                            <li>Measure efficiency</li>
                            <li>Track processing time</li>
                            <li>Monitor volume reduction</li>
                          </ul>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <h6 className="font-bold text-blue-200 mb-2">Deliverables:</h6>
                        <p className="text-slate-300 text-sm">Integrated system demo, data dashboard, performance metrics</p>
                      </div>
                    </div>

                    {/* Phase 3 */}
                    <div className="bg-gradient-to-r from-slate-800/40 to-slate-700/40 p-6 rounded-lg border-l-4 border-purple-400">
                      <h5 className="text-lg font-bold text-purple-300 mb-3">Phase 3 — Optimization & Simulation</h5>
                      <p className="text-slate-300 mb-3"><strong>Objective:</strong> Fine-tune system for Mars environment.</p>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h6 className="font-bold text-purple-200 mb-2">Key Actions:</h6>
                          <ul className="text-slate-300 text-sm space-y-1 list-disc list-inside">
                            <li>Run Mars gravity & atmosphere simulations</li>
                            <li>Optimize energy consumption and automation</li>
                            <li>Incorporate predictive AI for maintenance and scheduling</li>
                            <li>Conduct iterative UI/UX improvements based on astronaut workflow</li>
                          </ul>
                        </div>
                        <div>
                          <h6 className="font-bold text-purple-200 mb-2">Deliverables:</h6>
                          <ul className="text-slate-300 text-sm space-y-1 list-disc list-inside">
                            <li>Optimized system specs</li>
                            <li>Simulation results</li>
                            <li>Astronaut training manual</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Timeline Roadmap */}
                  <div className="space-y-6">
                    <h4 className="text-xl font-bold text-cyan-300 mb-4">Timeline Roadmap</h4>
                    
                    {/* 2025 */}
                    <div className="bg-gradient-to-r from-orange-900/20 to-red-900/20 p-6 rounded-lg border border-orange-500/20">
                      <h5 className="text-lg font-bold text-orange-300 mb-3">2025 — Foundation & Prototype</h5>
                      <ul className="text-slate-300 text-sm space-y-2 list-disc list-inside">
                        <li>Launch conceptual designs and system architecture</li>
                        <li>Develop initial prototypes of MIRU Core and BICL Reactor</li>
                        <li>Set up a functional Earth Portal for remote monitoring and data visualization</li>
                        <li>Establish partnerships, mentorship channels, and secure community/scientific contributions</li>
                        <li>Conduct initial feasibility tests in Earth analog environments</li>
                      </ul>
                    </div>

                    {/* 2026 */}
                    <div className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 p-6 rounded-lg border border-green-500/20">
                      <h5 className="text-lg font-bold text-green-300 mb-3">2026 — Integrated Testing & Optimization</h5>
                      <ul className="text-slate-300 text-sm space-y-2 list-disc list-inside">
                        <li>Merge MIRU, BICL, and Dual Hydraulic Press into a coordinated system</li>
                        <li>Test full waste flow: collection → compaction → bio-recycling → repurpose</li>
                        <li>Implement predictive AI for workflow optimization</li>
                        <li>Optimize processing parameters and energy efficiency based on test data</li>
                        <li>Expand Earth Portal capabilities: real-time monitoring, data logging, and collaborative research interface</li>
                      </ul>
                    </div>

                    {/* 2027 */}
                    <div className="bg-gradient-to-r from-blue-900/20 to-cyan-900/20 p-6 rounded-lg border border-blue-500/20">
                      <h5 className="text-lg font-bold text-blue-300 mb-3">2027 — Advanced Prototype Deployment & Research</h5>
                      <ul className="text-slate-300 text-sm space-y-2 list-disc list-inside">
                        <li>Deploy ORCA prototypes in extended analog Mars habitats</li>
                        <li>Introduce adaptive automation and modular upgrades based on test results</li>
                        <li>Collect detailed performance metrics: efficiency, throughput, volume reduction</li>
                        <li>Begin feasibility studies for Nano-Recycler Swarm and advanced microbial strains</li>
                        <li>Strengthen mentorship and inter-institutional partnerships for future scaling</li>
                      </ul>
                    </div>

                    {/* 2028 */}
                    <div className="bg-gradient-to-r from-purple-900/20 to-indigo-900/20 p-6 rounded-lg border border-purple-500/20">
                      <h5 className="text-lg font-bold text-purple-300 mb-3">2028 — Horizon Technologies & Visionary Expansion</h5>
                      <ul className="text-slate-300 text-sm space-y-2 list-disc list-inside">
                        <li>Integrate Nano-Recycler Swarm for autonomous micro-level recycling</li>
                        <li>Implement AI-assisted waste routing and predictive maintenance</li>
                        <li>Test advanced bio-engineered microbes/fungi for Martian conditions</li>
                        <li>Pilot initial Brain Interface interaction for human-ORCA control</li>
                        <li>Expand Earth Portal to include gamified educational modules and global collaboration dashboards</li>
                      </ul>
                    </div>

                    {/* 2029 */}
                    <div className="bg-gradient-to-r from-yellow-900/20 to-amber-900/20 p-6 rounded-lg border border-yellow-500/20">
                      <h5 className="text-lg font-bold text-yellow-300 mb-3">2029 — Interplanetary Scaling & Deployment</h5>
                      <ul className="text-slate-300 text-sm space-y-2 list-disc list-inside">
                        <li>Deploy full ORCA system with integrated MIRU, BICL, Hydraulic Press, and AI optimization</li>
                        <li>Establish protocols under Interplanetary Waste Accord for standardized space recycling</li>
                        <li>Expand Bio-Artistic Weaving programs: functional and aesthetic habitat materials from recycled waste</li>
                        <li>Monitor long-term performance and refine operations through Earth-Mars feedback loop</li>
                      </ul>
                    </div>

                    {/* 2030+ */}
                    <div className="bg-gradient-to-r from-slate-800/60 to-slate-700/60 p-6 rounded-lg border border-slate-400/20">
                      <h5 className="text-lg font-bold text-slate-200 mb-3">2030+ — Long-Term Sustainability</h5>
                      <ul className="text-slate-300 text-sm space-y-2 list-disc list-inside">
                        <li>Scale ORCA for multiple habitats and interplanetary missions</li>
                        <li>Fully implement Brain Interface control and autonomous optimization</li>
                        <li>Integrate all modules into a circular ecosystem for Mars habitats</li>
                        <li>Share system blueprint globally for interplanetary collaboration and education</li>
                      </ul>
                    </div>
                  </div>
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
                 {member.email && (
                   <p className="text-sm text-blue-400 mb-2 hover:text-blue-300 transition-colors">
                     <a href={`mailto:${member.email}`} className="flex items-center justify-center gap-1">
                       <Mail className="w-3 h-3" />
                       {member.email}
                     </a>
                   </p>
                 )}
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
              <a href="https://github.com/trashinova/Orbital-Recycling-Circularity-Architecture-ORCA-Mars-Recycling" target="_blank" rel="noopener noreferrer" className="hover:text-orange-400 transition-colors">GitHub</a>
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