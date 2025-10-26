import { useState, useEffect, useRef } from 'react'
import {
  Mic,
  Monitor,
  PhoneOff,
  MonitorOff,
  Camera,
  CameraOff,
  MicOff,
  Pencil,
  PencilOff,
} from "lucide-react";

import './App.css'

import {
  LocalUser,
  RemoteUser,
  useIsConnected,
  useJoin,
  useLocalMicrophoneTrack,
  useLocalCameraTrack,
  usePublish,
  useRemoteUsers,
  useLocalScreenTrack,
  type ILocalVideoTrack,
} from "agora-rtc-react";

const Basics = () => {
  const [calling, setCalling] = useState(false);
  const isConnected = useIsConnected();
  const [appId] = useState("691f2b1a97b44dafa9b01407d248b4b6");
  const [channel] = useState("best");
  const [token] = useState("");
  const [micOn, setMic] = useState(true);
  const [cameraOn, setCamera] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [whiteboardVisible, setWhiteboardVisible] = useState(false);

  // Fullscreen states
  const [fullscreenElement, setFullscreenElement] = useState<string | null>(null);

  const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn);
  const { localCameraTrack } = useLocalCameraTrack(cameraOn);
  const { screenTrack, error } = useLocalScreenTrack(screenSharing, {}, "auto");

  useJoin({ appid: appId, channel: channel, token: token ? token : null }, calling);

  // Publish tracks based on current state
  usePublish([localMicrophoneTrack, screenSharing && screenTrack ? screenTrack : localCameraTrack].filter(Boolean) as any[]);

  const remoteUsers = useRemoteUsers();

  // Handle screen share errors
  useEffect(() => {
    if (error) {
      console.error("Screen share error:", error);
      setScreenSharing(false);
    }
  }, [error]);

  // Toggle screen sharing
  const toggleScreenSharing = () => {
    setScreenSharing(!screenSharing);
  };

  // Toggle whiteboard
  const toggleWhiteboard = () => {
    setWhiteboardVisible(!whiteboardVisible);
  };

  // Fullscreen functions - Fixed version
  const toggleFullscreen = async (elementType: string, uid: string | number | null = null) => {
    const elementId = uid ? `${elementType}-${uid}` : elementType;

    try {
      // If already in fullscreen, exit
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        setFullscreenElement(null);
        return;
      }

      // Enter fullscreen
      const element = document.getElementById(elementId);
      if (element) {
        // Find the actual video element within the container
        const videoElement = element.querySelector('video');
        const targetElement = videoElement || element;

        if (targetElement.requestFullscreen) {
          await targetElement.requestFullscreen();
          setFullscreenElement(elementId);
        }
      }
    } catch (err) {
      console.error('Error toggling fullscreen:', err);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setFullscreenElement(null);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Check if element is currently in fullscreen
  const isFullscreen = (elementType: string, uid: string | number | null = null) => {
    const elementId = uid ? `${elementType}-${uid}` : elementType;
    return fullscreenElement === elementId;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {isConnected ? (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h1 className="text-3xl font-bold text-gray-800 text-center">Video Conference</h1>
              <p className="text-gray-600 text-center mt-2">Channel: {channel}</p>
            </div>

            {/* Video Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Local User Video */}
              <div
                id="local-video"
                className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 ${isFullscreen('local-video') ? 'fixed inset-0 z-50 w-screen h-screen bg-black' : 'relative'
                  }`}
              >
                <div className={`relative ${isFullscreen('local-video') ? 'h-full w-full' : 'h-64 lg:h-80'}`}>
                  <LocalUser
                    audioTrack={localMicrophoneTrack}
                    cameraOn={!screenSharing && cameraOn}
                    micOn={micOn}
                    playAudio={false}
                    // videoTrack={screenSharing && screenTrack ? screenTrack : localCameraTrack}
                    videoTrack={(screenSharing && screenTrack ? screenTrack : localCameraTrack) as ILocalVideoTrack | null}

                    className={`w-full h-full object-cover ${isFullscreen('local-video') ? 'rounded-none' : 'rounded-xl'
                      }`}
                  />

                  {/* Overlay info */}
                  <div className="absolute bottom-3 left-3 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-sm">
                    {screenSharing ? "📺 Screen Sharing" : "👤 You"}
                  </div>

                  {/* Status indicators */}
                  <div className="absolute top-3 left-3 flex space-x-2">
                    {!micOn && <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs">🔇 Muted</div>}
                    {!cameraOn && <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs">📷 Off</div>}
                  </div>

                  {/* Fullscreen button */}
                  <button
                    onClick={() => toggleFullscreen('local-video')}
                    className="absolute top-3 right-3 bg-black bg-opacity-60 text-white p-2 rounded-lg hover:bg-opacity-80 transition-all duration-200 z-10"
                  >
                    {isFullscreen('local-video') ? '⤢ Exit' : '⛶ Fullscreen'}
                  </button>
                </div>
              </div>

              {/* Remote Users */}
              {remoteUsers.map((user) => (
                <div
                  key={user.uid}
                  id={`remote-video-${user.uid}`}
                  className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 ${isFullscreen('remote-video', user.uid) ? 'fixed inset-0 z-50 w-screen h-screen bg-black' : 'relative'
                    }`}
                >
                  <div className={`relative ${isFullscreen('remote-video', user.uid) ? 'h-full w-full' : 'h-64 lg:h-80'}`}>
                    <RemoteUser
                      user={user}
                      className={`w-full h-full object-cover ${isFullscreen('remote-video', user.uid) ? 'rounded-none' : 'rounded-xl'
                        }`}
                    />

                    {/* Overlay info */}
                    <div className="absolute bottom-3 left-3 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-sm">
                      👤 User {user.uid}
                    </div>

                    {/* Fullscreen button */}
                    <button
                      onClick={() => toggleFullscreen('remote-video', user.uid)}
                      className="absolute top-3 right-3 bg-black bg-opacity-60 text-white p-2 rounded-lg hover:bg-opacity-80 transition-all duration-200 z-10"
                    >
                      {isFullscreen('remote-video', user.uid) ? '⤢ Exit' : '⛶ Fullscreen'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Whiteboard */}
            {whiteboardVisible && (
              <div className="bg-white rounded-xl shadow-lg p-4">
                <Whiteboard
                  isFullscreen={isFullscreen('whiteboard')}
                  onToggleFullscreen={() => toggleFullscreen('whiteboard')}
                />
              </div>
            )}
          </div>
        ) : (
          /* Join Form */
          <div className="flex items-center justify-center min-h-[80vh]">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Join Meeting</h2>
                <p className="text-gray-600">Enter your meeting details to get started</p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => setCalling(true)}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                >
                  <span>Join Channel</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Control Bar */}
        {isConnected && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-2xl shadow-xl p-4 min-w-[300px]">
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => setMic(a => !a)}
                className={`p-3 rounded-full transition-all duration-200 transform hover:scale-110 ${micOn ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                  }`}
                title={micOn ? "Mute microphone" : "Unmute microphone"}
              >
                {micOn ? <Mic /> : <MicOff />}
              </button>

              <button
                onClick={() => setCamera(a => !a)}
                className={`p-3 rounded-full transition-all duration-200 transform hover:scale-110 ${cameraOn ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                  }`}
                title={cameraOn ? "Turn off camera" : "Turn on camera"}
              >
                {cameraOn ? <Camera /> : <CameraOff />}
              </button>

              <button
                onClick={toggleScreenSharing}
                disabled={!!error}
                className={`p-3 rounded-full transition-all duration-200 transform hover:scale-110 ${screenSharing ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={screenSharing ? "Stop screen sharing" : "Share screen"}
              >
                {screenSharing ? <MonitorOff /> : <Monitor />}
              </button>

              <button
                onClick={toggleWhiteboard}
                className={`p-3 rounded-full transition-all duration-200 transform hover:scale-110 ${whiteboardVisible ? 'bg-purple-500 text-white' : 'bg-gray-500 text-white'
                  }`}
                title={whiteboardVisible ? "Hide whiteboard" : "Show whiteboard"}
              >
                {whiteboardVisible ? <PencilOff /> : <Pencil />}
              </button>

              <button
                onClick={() => setCalling(a => !a)}
                className="p-3 bg-red-500 text-white rounded-full transition-all duration-200 transform hover:scale-110 hover:bg-red-600"
                title={calling ? "Leave call" : "Start call"}
              >
                <PhoneOff />
              </button>
            </div>

            {error && (
              <div className="mt-3 p-2 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center text-sm">
                Screen sharing error: {error.message}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Basics;

// Whiteboard Component with TypeScript fixes
interface WhiteboardProps {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

const Whiteboard = ({ isFullscreen, onToggleFullscreen }: WhiteboardProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size based on fullscreen state
    if (isFullscreen) {
      canvas.width = window.innerWidth - 100;
      canvas.height = window.innerHeight - 150;
    } else {
      canvas.width = 800;
      canvas.height = 400;
    }

    // Set initial background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [isFullscreen]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div
      id="whiteboard"
      className={`bg-white rounded-xl shadow-lg transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50 w-screen h-screen rounded-none' : 'relative'
        }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 border-b border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          🎨 Collaborative Whiteboard
          {isFullscreen && <span className="text-sm font-normal text-blue-500">(Fullscreen)</span>}
        </h3>

        <div className="flex gap-2">
          <button
            onClick={clearCanvas}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
          >
            Clear
          </button>
          <button
            onClick={onToggleFullscreen}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
          >
            {isFullscreen ? '⤢ Exit Fullscreen' : '⛶ Fullscreen'}
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Color:</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-10 h-10 cursor-pointer rounded border border-gray-300"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Brush Size:</label>
            <input
              type="range"
              min="1"
              max="20"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-24 accent-blue-500"
            />
            <span className="text-sm text-gray-600 min-w-[30px]">{brushSize}px</span>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="p-4">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="border border-gray-300 rounded-lg cursor-crosshair bg-white shadow-inner mx-auto block"
          style={{
            maxWidth: isFullscreen ? 'none' : '800px',
            width: '100%'
          }}
        />
      </div>
    </div>
  );
};