// This dynamically sets the API URL based on the current browser location or saved settings
// If you open the app from 192.168.1.5, it will look for the server at 192.168.1.5:5000
const savedIp = localStorage.getItem('SERVER_IP');
export const API_URL = savedIp ? `http://${savedIp}:5000` : `http://${window.location.hostname}:5000`;

