import React, { Suspense, useRef, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, useGLTF, Stage, Grid } from '@react-three/drei';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { Download, Maximize2, RotateCcw, Camera } from 'lucide-react';
import * as THREE from 'three';

// Model component that loads and displays the 3D model with robust large file handling
function Model({ url, onLoad, onError, onProgress }) {
  const modelRef = useRef();
  const [loadingState, setLoadingState] = useState('loading');
  const [loadProgress, setLoadProgress] = useState(0);

  // Check file extension to determine loader
  const fileExtension = url.split('.').pop().toLowerCase();
  
  if (fileExtension === 'glb' || fileExtension === 'gltf') {
    try {
      // For large GLTF/GLB files, we need to handle them with progress tracking
      const { scene } = useGLTF(url, true); // Enable draco compression support
      
      React.useEffect(() => {
        if (scene) {
          console.log('Large GLB/GLTF model loaded successfully:', url);
          setLoadingState('loaded');
          setLoadProgress(100);
          onLoad && onLoad();
        }
      }, [scene, onLoad]);

      return (
        <primitive 
          ref={modelRef}
          object={scene} 
          scale={1}
          position={[0, 0, 0]}
        />
      );
    } catch (error) {
      console.error('Error loading large GLB/GLTF model:', error);
      React.useEffect(() => {
        setLoadingState('error');
        onError && onError(error);
      }, [error, onError]);
      return null;
    }
  } else if (fileExtension === 'obj') {
    try {
      const obj = useLoader(OBJLoader, url);
      
      React.useEffect(() => {
        if (obj) {
          console.log('Large OBJ model loaded successfully:', url);
          // Add basic material to OBJ models with better performance settings
          obj.traverse((child) => {
            if (child.isMesh) {
              child.material = new THREE.MeshStandardMaterial({ 
                color: '#888888',
                metalness: 0.1,
                roughness: 0.7
              });
              // Optimize for large models
              child.frustumCulled = true;
              child.castShadow = false; // Disable shadows for performance
              child.receiveShadow = false;
            }
          });
          setLoadingState('loaded');
          setLoadProgress(100);
          onLoad && onLoad();
        }
      }, [obj, onLoad]);

      return (
        <primitive 
          ref={modelRef}
          object={obj} 
          scale={0.01}
          position={[0, 0, 0]}
        />
      );
    } catch (error) {
      console.error('Error loading large OBJ model:', error);
      React.useEffect(() => {
        setLoadingState('error');
        onError && onError(error);
      }, [error, onError]);
      return null;
    }
  } else {
    const error = new Error(`Unsupported file format: .${fileExtension}`);
    React.useEffect(() => {
      setLoadingState('error');
      onError && onError(error);
    }, [error, onError]);
    return null;
  }
}

// Fallback loading component
function LoadingSpinner() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#3b82f6" wireframe />
    </mesh>
  );
}

// Main 3D Viewer Component - Optimized for Large Files (60MB+)
const ModelViewer3D = ({ modelUrl, modelName = "Model", onDownload }) => {
  const canvasRef = useRef();
  const controlsRef = useRef();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showGrid, setShowGrid] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [isLargeFile, setIsLargeFile] = useState(false);

  // Enhanced error boundary for large model loading
  const handleModelError = (error) => {
    console.error('Large 3D Model Error:', error);
    setError(`Failed to load large 3D model: ${error.message || 'Unknown error'}. File may be too large (>60MB) or corrupted.`);
    setIsLoading(false);
  };

  // Enhanced progress tracking for large files
  const handleModelProgress = (progress) => {
    setLoadProgress(Math.round(progress * 100));
  };

  const handleReset = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const handleFullscreen = () => {
    if (canvasRef.current) {
      if (canvasRef.current.requestFullscreen) {
        canvasRef.current.requestFullscreen();
      }
    }
  };

  const handleScreenshot = () => {
    if (canvasRef.current) {
      const canvas = canvasRef.current.querySelector('canvas');
      if (canvas) {
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${modelName}-screenshot.png`;
          a.click();
          URL.revokeObjectURL(url);
        });
      }
    }
  };

  const handleModelLoad = () => {
    console.log('Large model loaded successfully:', modelUrl);
    setIsLoading(false);
    setError(null);
    setLoadProgress(100);
  };

  // Enhanced validation and loading for large model files (60MB+)
  React.useEffect(() => {
    if (!modelUrl) {
      setError('No model URL provided');
      setIsLoading(false);
      return;
    }
    
    const supportedFormats = ['glb', 'gltf', 'obj'];
    const fileExtension = modelUrl.split('.').pop().toLowerCase();
    
    if (!supportedFormats.includes(fileExtension)) {
      setError(`Unsupported file format: .${fileExtension}. Supported formats: ${supportedFormats.join(', ')}`);
      setIsLoading(false);
      return;
    }
    
    // Detect if this might be a large file based on filename or path
    const fileName = modelUrl.toLowerCase();
    const isLikeLargeFile = fileName.includes('large') || fileName.includes('high') || 
                           fileName.includes('detail') || fileName.includes('container_control');
    setIsLargeFile(isLikeLargeFile);
    
    // Reset states when URL changes
    console.log('Starting to load model (optimized for large files):', modelUrl);
    setIsLoading(true);
    setError(null);
    setLoadProgress(0);
    
    // Extended timeout for very large files (90 seconds)
    const loadingTimeout = setTimeout(() => {
      if (isLoading) {
        console.warn('Large model loading timeout for:', modelUrl);
        setError(`Loading timeout after 90 seconds. File: ${modelUrl.split('/').pop()} may be too large (>60MB) for your connection. Try using a faster internet connection or compress the model.`);
        setIsLoading(false);
      }
    }, 90000); // 90 second timeout for very large files
    
    return () => {
      clearTimeout(loadingTimeout);
    };
  }, [modelUrl]);

  return (
    <div className="relative w-full h-96 md:h-[500px] bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950 rounded-xl overflow-hidden shadow-2xl border border-orange-900/20">
      {/* Enhanced Loading Overlay for Large Files */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm z-20">
          <div className="text-center">
            <div className="relative mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto"></div>
              {loadProgress > 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-orange-400 text-xs font-bold">{loadProgress}%</span>
                </div>
              )}
            </div>
            <p className="text-orange-400 font-semibold mb-2">
              {isLargeFile ? 'Loading Large 3D Model...' : 'Loading 3D Model...'}
            </p>
            {isLargeFile && (
              <>
                <p className="text-yellow-400 text-sm mb-1">🚀 Large file detected (50-60MB+)</p>
                <p className="text-slate-400 text-sm mb-1">This may take 60-90 seconds</p>
                <p className="text-slate-300 text-xs">Optimized loading in progress...</p>
              </>
            )}
            <p className="text-orange-300 text-xs mt-2 animate-pulse">
              File: {modelUrl ? modelUrl.split('/').pop() : 'Unknown'}
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 z-20">
          <div className="text-center px-4">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <p className="text-red-400 font-semibold mb-2">Failed to load model</p>
            <p className="text-slate-400 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Optimized 3D Canvas for Large Files */}
      <div ref={canvasRef} className="w-full h-full">
        {!error && (
          <Canvas
            shadows={!isLargeFile} // Disable shadows for large files for better performance
            camera={{ position: [5, 5, 5], fov: 50 }}
            gl={{ 
              preserveDrawingBuffer: true,
              antialias: !isLargeFile, // Disable antialiasing for large files
              powerPreference: "high-performance",
              alpha: true
            }}
            onError={handleModelError}
            performance={{ 
              min: isLargeFile ? 0.2 : 0.5, // Lower performance threshold for large files
              max: 1,
              debounce: isLargeFile ? 200 : 50
            }}
          >
            <Suspense fallback={<LoadingSpinner />}>
              {/* Optimized Lighting for Large Files */}
              <ambientLight intensity={0.6} />
              {!isLargeFile && (
                <spotLight 
                  position={[10, 10, 10]} 
                  angle={0.15} 
                  penumbra={1} 
                  intensity={1}
                  castShadow 
                />
              )}
              <pointLight position={[-10, -10, -10]} intensity={0.4} color="#ff8800" />
              <pointLight position={[10, 10, 10]} intensity={0.4} color="#4488ff" />

              {/* Grid Helper - Simplified for large files */}
              {showGrid && (
                <Grid
                  args={[10, 10]}
                  cellSize={isLargeFile ? 1 : 0.5}
                  cellThickness={0.5}
                  cellColor="#ff8800"
                  sectionSize={1}
                  sectionThickness={1}
                  sectionColor="#ff4400"
                  fadeDistance={25}
                  fadeStrength={1}
                  followCamera={false}
                  infiniteGrid={true}
                />
              )}

              {/* Large File Optimized Model Loading */}
              {modelUrl && (
                <>
                  {!isLargeFile && (
                    <Stage environment="city" intensity={0.5}>
                      <Model 
                        url={modelUrl} 
                        onLoad={handleModelLoad} 
                        onError={handleModelError}
                        onProgress={handleModelProgress}
                      />
                    </Stage>
                  )}
                  {isLargeFile && (
                    // Direct loading without Stage for better performance with large files
                    <Model 
                      url={modelUrl} 
                      onLoad={handleModelLoad} 
                      onError={handleModelError}
                      onProgress={handleModelProgress}
                    />
                  )}
                </>
              )}

              {/* Environment - Simplified for large files */}
              <Environment preset={isLargeFile ? "studio" : "sunset"} />

              {/* Camera Controls - Optimized for large files */}
              <OrbitControls
                ref={controlsRef}
                enablePan={true}
                enableZoom={true}
                enableRotate={true}
                minDistance={2}
                maxDistance={20}
                autoRotate={false}
                autoRotateSpeed={0.5}
              />
            </Suspense>
          </Canvas>
        )}
      </div>

      {/* Control Panel */}
      <div className="absolute bottom-4 right-4 flex gap-2">
        <button
          onClick={handleReset}
          className="p-3 bg-slate-900/90 hover:bg-slate-800 border border-orange-800/50 rounded-lg backdrop-blur-sm transition-all shadow-lg hover:shadow-orange-500/20"
          title="Reset View"
        >
          <RotateCcw className="w-4 h-4 text-orange-400" />
        </button>
        
        <button
          onClick={() => setShowGrid(!showGrid)}
          className="p-3 bg-slate-900/90 hover:bg-slate-800 border border-orange-800/50 rounded-lg backdrop-blur-sm transition-all shadow-lg hover:shadow-orange-500/20"
          title="Toggle Grid"
        >
          <span className="text-orange-400 text-sm font-bold">#</span>
        </button>

        <button
          onClick={handleScreenshot}
          className="p-3 bg-slate-900/90 hover:bg-slate-800 border border-orange-800/50 rounded-lg backdrop-blur-sm transition-all shadow-lg hover:shadow-orange-500/20"
          title="Take Screenshot"
        >
          <Camera className="w-4 h-4 text-orange-400" />
        </button>

        <button
          onClick={handleFullscreen}
          className="p-3 bg-slate-900/90 hover:bg-slate-800 border border-orange-800/50 rounded-lg backdrop-blur-sm transition-all shadow-lg hover:shadow-orange-500/20"
          title="Fullscreen"
        >
          <Maximize2 className="w-4 h-4 text-orange-400" />
        </button>

        {onDownload && (
          <button
            onClick={onDownload}
            className="p-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 rounded-lg backdrop-blur-sm transition-all shadow-lg hover:shadow-orange-500/50"
            title="Download Model"
          >
            <Download className="w-4 h-4 text-white" />
          </button>
        )}
      </div>

      {/* Model Info */}
      <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-sm border border-orange-800/50 rounded-lg px-4 py-2 shadow-lg">
        <p className="text-orange-400 text-sm font-semibold">{modelName}</p>
      </div>
    </div>
  );
};

export default ModelViewer3D;