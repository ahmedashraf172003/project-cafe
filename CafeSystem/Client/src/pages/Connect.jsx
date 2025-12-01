import React, { useState, useEffect } from 'react';
import { Wifi, Search, AlertCircle, CheckCircle, Server } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

export default function Connect() {
  const [status, setStatus] = useState('idle'); // idle, scanning, found, error
  const [serverIp, setServerIp] = useState('');
  const [manualIp, setManualIp] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we are already connected or have a saved IP
    const savedIp = localStorage.getItem('cafe_server_ip');
    if (savedIp) {
      checkConnection(savedIp);
    } else {
      startScan();
    }
  }, []);

  const checkConnection = async (ip) => {
    setStatus('scanning');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      // Try to fetch cafe info
      const res = await fetch(`http://${ip}:5000/api/cafe-info`, { 
        signal: controller.signal 
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        setStatus('found');
        setServerIp(ip);
        localStorage.setItem('cafe_server_ip', ip);
        // Redirect to main app after a brief delay
        setTimeout(() => {
            // Force reload to apply new API_URL if needed (handled in config.js)
            window.location.href = '/'; 
        }, 1000);
      } else {
        throw new Error('Server responded but with error');
      }
    } catch (error) {
      console.log('Connection failed to', ip);
      setStatus('error');
    }
  };

  const startScan = async () => {
    setStatus('scanning');
    
    // Simple heuristic: Scan common local subnets
    // Note: In a real browser environment, we can't easily get the local IP.
    // We will try to guess based on window.location if available, or just ask user.
    // Since this is intended for the "APK" which might load from localhost or file://,
    // we might need to rely on manual input or a native plugin.
    
    // However, for this demo, we will simulate a scan or default to manual input
    // because pure JS scanning is very slow and limited.
    
    // If we are running on localhost (dev mode), try localhost
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        checkConnection('localhost');
        return;
    }

    // If we are in the APK (file://), we can't guess the subnet easily without a plugin.
    // So we will show the manual input immediately after a fake "scan" fails.
    setTimeout(() => {
        setStatus('error');
    }, 1500);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualIp) {
      checkConnection(manualIp);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700">
        <div className="text-center mb-8">
          <div className="bg-blue-500/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Server size={40} className="text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Cafe System Connect</h1>
          <p className="text-slate-400">Connect to your main server</p>
        </div>

        {status === 'scanning' && (
          <div className="text-center py-8">
            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-blue-400 font-bold">Searching for server...</p>
          </div>
        )}

        {status === 'found' && (
          <div className="text-center py-8">
            <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
            <p className="text-green-400 font-bold text-xl">Server Found!</p>
            <p className="text-slate-400 mt-2">{serverIp}</p>
          </div>
        )}

        {(status === 'error' || status === 'idle') && (
          <div className="space-y-6">
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start gap-3">
              <AlertCircle className="text-red-400 shrink-0" />
              <p className="text-sm text-red-200">
                Could not find server automatically. Please enter the IP address displayed on your main computer.
              </p>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2 ml-1">Server IP Address</label>
                <input 
                  type="text" 
                  placeholder="e.g., 192.168.1.5"
                  value={manualIp}
                  onChange={(e) => setManualIp(e.target.value)}
                  className="w-full p-4 rounded-xl bg-slate-900 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none font-mono text-lg"
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Wifi size={20} />
                Connect
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
