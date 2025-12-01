import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import dgram from 'dgram';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');

// --- UDP Server Discovery Setup ---
const udpSocket = dgram.createSocket('udp4');
const DISCOVERY_PORT = 5555;

// Helper to get local IP
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (non-127.0.0.1) and non-ipv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

udpSocket.on('error', (err) => {
  console.log(`UDP Discovery Error:\n${err.stack}`);
  udpSocket.close();
});

udpSocket.on('message', (msg, rinfo) => {
  const message = msg.toString();
  if (message === 'DISCOVER_CAFE_SERVER') {
    const serverInfo = JSON.stringify({
      ip: getLocalIpAddress(),
      port: 5000,
      name: "Cafe System Server"
    });
    
    udpSocket.send(serverInfo, rinfo.port, rinfo.address, (err) => {
      if (err) console.error('Error sending discovery response:', err);
      else console.log(`Sent discovery response to ${rinfo.address}:${rinfo.port}`);
    });
  }
});

udpSocket.bind(DISCOVERY_PORT, () => {
  console.log(`UDP Discovery Server listening on port ${DISCOVERY_PORT}`);
});
// --- End UDP Server Discovery Setup ---

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads'))
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({ storage: storage })

const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.json');
const CAFE_INFO_FILE = path.join(DATA_DIR, 'cafeInfo.json');

const app = express();
const httpServer = createServer(app);

// Configure CORS to allow connections from the Client
const io = new Server(httpServer, {
  cors: {
    origin: "*", // In production, replace with specific client URL
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Data Storage
let orders = [];
let categories = [];
let cafeInfo = {};
let products = [];
let users = [];

// Helper to read JSON file
async function readJsonFile(filePath, defaultValue) {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.log(`Creating new file: ${filePath}`);
    await fs.writeFile(filePath, JSON.stringify(defaultValue, null, 2));
    return defaultValue;
  }
}

// Helper to write JSON file
async function writeJsonFile(filePath, data) {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing to ${filePath}:`, error);
  }
}

// Load Data
async function loadData() {
  try {
    orders = await readJsonFile(ORDERS_FILE, []);
    products = await readJsonFile(PRODUCTS_FILE, []);
    users = await readJsonFile(USERS_FILE, []);
    categories = await readJsonFile(CATEGORIES_FILE, []);
    cafeInfo = await readJsonFile(CAFE_INFO_FILE, {});
    console.log('Data loaded successfully from separate files');
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

// Save Functions
async function saveOrders() { await writeJsonFile(ORDERS_FILE, orders); }
async function saveProducts() { await writeJsonFile(PRODUCTS_FILE, products); }
async function saveUsers() { await writeJsonFile(USERS_FILE, users); }
async function saveCategories() { await writeJsonFile(CATEGORIES_FILE, categories); }
async function saveCafeInfo() { await writeJsonFile(CAFE_INFO_FILE, cafeInfo); }

// Initialize Data
loadData();

// --- User Management Routes ---

// Get all users
app.get('/api/users', (req, res) => {
  // Return users without passwords for security in list view
  const safeUsers = users.map(({ password, ...u }) => u);
  res.json(safeUsers);
});

// Add a new user
app.post('/api/users', (req, res) => {
  const { username, password, role, name } = req.body;
  
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ success: false, message: 'Username already exists' });
  }

  const newUser = { username, password, role, name };
  users.push(newUser);
  saveUsers();
  
  const { password: _, ...safeUser } = newUser;
  res.json({ success: true, user: safeUser });
});

// Update a user
app.put('/api/users/:username', (req, res) => {
  const { username } = req.params;
  const index = users.findIndex(u => u.username === username);
  
  if (index !== -1) {
    // Only update fields that are provided
    const updatedUser = { ...users[index], ...req.body };
    users[index] = updatedUser;
    saveUsers();
    
    const { password: _, ...safeUser } = updatedUser;
    res.json({ success: true, user: safeUser });
  } else {
    res.status(404).json({ success: false, message: 'User not found' });
  }
});

// Delete a user
app.delete('/api/users/:username', (req, res) => {
  const { username } = req.params;
  if (username === 'admin') {
    return res.status(403).json({ success: false, message: 'Cannot delete admin user' });
  }
  
  users = users.filter(u => u.username !== username);
  saveUsers();
  res.json({ success: true, message: 'User deleted' });
});

// --- End User Management Routes ---

app.get('/', (req, res) => {
  res.send('Cafe System API is Running...');
});

// Login Endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  
  if (user) {
    // Return user info without password
    const { password, ...userInfo } = user;
    res.json({ success: true, user: userInfo });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Get all orders (useful for initial load)
app.get('/api/orders', (req, res) => {
  res.json(orders);
});

// --- Product Routes ---

// Get all products
app.get('/api/products', (req, res) => {
  res.json(products);
});

// Add a new product
app.post('/api/products', (req, res) => {
  const newProduct = {
    id: Date.now().toString(),
    ...req.body
  };
  products.push(newProduct);
  saveProducts();
  res.json({ success: true, product: newProduct });
});

// Update a product
app.put('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const index = products.findIndex(p => p.id === id);
  if (index !== -1) {
    const oldImage = products[index].image;
    const newImage = req.body.image;

    // If there is a new image and it's different from the old one
    if (newImage && oldImage && newImage !== oldImage) {
      try {
        const filename = path.basename(oldImage);
        const oldImagePath = path.join(__dirname, 'uploads', filename);
        await fs.unlink(oldImagePath);
        console.log('Deleted old image:', oldImagePath);
      } catch (err) {
        console.error('Error deleting old image:', err);
      }
    }

    products[index] = { ...products[index], ...req.body };
    saveProducts();
    res.json({ success: true, product: products[index] });
  } else {
    res.status(404).json({ success: false, message: 'Product not found' });
  }
});

// Delete a product
app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const product = products.find(p => p.id === id);
  
  if (product && product.image) {
    try {
      const filename = path.basename(product.image);
      const imagePath = path.join(__dirname, 'uploads', filename);
      await fs.unlink(imagePath);
      console.log('Deleted product image:', imagePath);
    } catch (err) {
      console.error('Error deleting image:', err);
    }
  }

  products = products.filter(p => p.id !== id);
  saveProducts();
  res.json({ success: true, message: 'Product deleted' });
});

// --- End Product Routes ---

// --- Category Routes ---

// Get all categories
app.get('/api/categories', (req, res) => {
  res.json(categories);
});

// Add a new category
app.post('/api/categories', (req, res) => {
  const newCategory = {
    id: Date.now().toString(), // Simple ID generation
    ...req.body
  };
  categories.push(newCategory);
  saveCategories();
  res.json({ success: true, category: newCategory });
});

// Update a category
app.put('/api/categories/:id', (req, res) => {
  const { id } = req.params;
  const index = categories.findIndex(c => c.id === id);
  if (index !== -1) {
    categories[index] = { ...categories[index], ...req.body };
    saveCategories();
    res.json({ success: true, category: categories[index] });
  } else {
    res.status(404).json({ success: false, message: 'Category not found' });
  }
});

// Delete a category
app.delete('/api/categories/:id', (req, res) => {
  const { id } = req.params;
  categories = categories.filter(c => c.id !== id);
  saveCategories();
  res.json({ success: true, message: 'Category deleted' });
});

// --- End Category Routes ---

// --- Cafe Info Routes ---

app.get('/api/cafe-info', (req, res) => {
  res.json(cafeInfo);
});

app.put('/api/cafe-info', (req, res) => {
  cafeInfo = { ...cafeInfo, ...req.body };
  saveCafeInfo();
  res.json({ success: true, cafeInfo });
});

// --- End Cafe Info Routes ---

// Upload Endpoint
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  // Return the path to the uploaded file
  const imagePath = `/uploads/${req.file.filename}`;
  res.json({ success: true, imagePath });
});

// Real-time connection (Socket.io)
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // 1. Customer places order -> Status: PENDING (To Kitchen)
  socket.on('place_order', (orderData) => {
    const newOrder = {
      id: Date.now().toString(), // Simple ID generation
      ...orderData,
      status: 'PENDING', 
      createdAt: new Date()
    };
    orders.push(newOrder);
    saveOrders();
    
    // Broadcast to everyone (Frontend will filter based on role)
    io.emit('order_update', newOrder);
    console.log('Order Placed:', newOrder.id);
  });

  // 2. Kitchen accepts order -> Status: PREPARING (Kitchen is working on it)
  socket.on('mark_preparing', (orderId) => {
    updateOrderStatus(orderId, 'PREPARING');
  });

  // 3. Kitchen marks as Ready -> Status: READY (To Waiter)
  socket.on('mark_ready', (orderId) => {
    updateOrderStatus(orderId, 'READY');
  });

  // 4. Waiter marks as Served -> Status: SERVED (To Cashier)
  socket.on('mark_served', (orderId) => {
    updateOrderStatus(orderId, 'SERVED');
  });

  // 5. Cashier marks as Paid -> Status: COMPLETED (Done)
  socket.on('mark_paid', (orderId) => {
    updateOrderStatus(orderId, 'COMPLETED');
  });

  function updateOrderStatus(orderId, status) {
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex !== -1) {
      orders[orderIndex].status = status;
      saveOrders();
      io.emit('order_update', orders[orderIndex]);
      console.log(`Order ${orderId} updated to ${status}`);
    }
  }

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Socket.io is ready for real-time connections`);
});
