// This dynamically sets the API URL based on the current browser location
// If you open the app from 192.168.1.5, it will look for the server at 192.168.1.5:5000

// Check if we have a saved server IP (from the Connect page)
const savedIp = localStorage.getItem('cafe_server_ip');

export const API_URL = savedIp 
  ? `http://${savedIp}:5000`
  : `http://${window.location.hostname}:5000`;

