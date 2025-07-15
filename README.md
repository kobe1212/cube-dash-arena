# Cube Dash Arena

Cube Dash Arena is a fast-paced multiplayer dodge game where two players control colorful cubes in a 3D arena. Players must avoid falling obstacles and survive as long as possible. The last cube standing wins the round.

> **Note:** This codebase has been recently refactored to improve code organization, reduce duplication, and enhance maintainability.

## 🎮 Features

- **Multiplayer gameplay** with Socket.IO for real-time communication
- **Simple movement** (left, right, jump) with responsive controls
- **Dynamic obstacles** with procedural generation and collision detection
- **Real-time synchronization** of player states and game events
- **Quick rounds** lasting 30–60 seconds for fast-paced gameplay
- **Low-poly aesthetics** with procedurally generated textures and dynamic lighting
- **Progressive difficulty system** that increases challenge over time
- **Procedural sound effects** with Web Audio API and mute option
- **Comprehensive score tracking** with multiplayer support
- **Robust error handling** with fallback rendering options
- **Modular code architecture** using ES modules for maintainability

---

## 🧱 Tech Stack

- **Three.js** – 3D graphics rendering with WebGL
- **ES Modules** – Modern JavaScript module system for code organization
- **Node.js + Express** – Backend server with RESTful endpoints
- **Socket.IO** – Real-time bidirectional event-based communication
- **Web Audio API** – Dynamic sound generation and management
- **Canvas API** – Procedural texture generation for low-poly aesthetics
- **Utility Functions** – Centralized error handling and common operations

---

## 🚀 Running the Server

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation
1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/cube-dash-arena.git
   cd cube-dash-arena
   ```

2. Install server dependencies
   ```bash
   cd server
   npm install
   cd ..
   ```

### Starting the Server
1. From the project root directory, run:
   ```bash
   node server/server.js
   ```
   Or use the provided batch file (Windows):
   ```bash
   start-server.bat
   ```

2. The server will start on port 3001 by default
   ```
   Server listening on port 3001
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:3001
   ```

### Multiplayer Setup
1. Open the game in two different browser windows or on different devices connected to the same network
2. Enter player names in each window
3. The first player to join becomes Player 1 (Host) and can start the game
4. The second player automatically joins as Player 2

---

## 📁 Project Structure

### Current Structure (ES Modules)

```
cube-dash-arena/
├── client/                # Frontend files
│   ├── modules/          # ES modules directory
│   │   ├── arena.js      # Arena creation and management
│   │   ├── constants.js   # Game constants and configuration
│   │   ├── difficulty.js # Difficulty progression system
│   │   ├── forceStart.js # Emergency rendering and fallback
│   │   ├── gameManager.js # Core game logic and state management
│   │   ├── main.js       # Main entry point and initialization
│   │   ├── obstacles.js  # Obstacle generation and management
│   │   ├── player.js     # Player cube controls and physics
│   │   ├── scene.js      # Three.js scene, camera, and renderer setup
│   │   ├── socketManager.js # Socket.IO client implementation
│   │   ├── sounds.js     # Sound effects manager
│   │   ├── textures.js   # Procedural texture generation
│   │   └── utils.js      # Utility functions and error handling
│   ├── game.html        # Game interface HTML
│   ├── index.html       # Entry point with redirect to lobby
│   ├── lobby.html       # Lobby interface for game setup
│   └── styles/          # CSS styles directory
├── server/               # Backend files
│   └── server.js         # Express and Socket.IO server
└── package.json          # Project dependencies
```

### Legacy Version (Original)

```
cube-dash-arena/
├── client/                # Frontend files
│   ├── game.js           # Main game logic with Three.js
│   ├── socket.js         # Socket.IO client implementation
│   ├── textures.js       # Procedural texture generation
│   ├── sounds.js         # Sound effects manager
│   ├── difficulty.js     # Difficulty progression system
│   ├── index.html        # Main HTML file
│   └── style.css         # CSS styles
├── server/               # Backend files
│   └── server.js         # Express and Socket.IO server
└── package.json          # Project dependencies
```

> **Note:** The legacy version is kept for reference but is no longer actively maintained.

---

## 🔄 ES Modules Architecture

This project uses ES modules for better code organization, maintainability, and modern JavaScript practices.

### Benefits of the ES Modules Architecture

- **Better Encapsulation**: Each module is responsible for its own functionality with clear boundaries
- **Explicit Dependencies**: You can see exactly what each module depends on
- **No Global State**: Eliminated all global variables, reducing potential bugs
- **Better Maintainability**: Code is more organized and easier to understand
- **Modern JavaScript**: Following ES module best practices

### Game Flow

1. `index.html` redirects to `lobby.html` for player setup
2. After player setup, the game launches in `game.html`
3. `main.js` initializes the game components and modules
4. `gameManager.js` orchestrates the game loop and state management
5. `socketManager.js` handles multiplayer communication

---

## 🔧 Recent Code Refactoring

The codebase has undergone significant refactoring to improve quality and maintainability:

### Centralized Error Handling

- Created a new `utils.js` module with utility functions for error logging
- Implemented consistent error handling patterns across all modules
- Added fallback mechanisms for critical failures

### Removed Code Duplication

- Consolidated duplicate UI update logic in `socketManager.js`
- Removed redundant light setup methods in `scene.js`
- Eliminated duplicate level display methods in `difficulty.js`
- Standardized texture settings application in `textures.js`

### Improved Modularity

- Better separation of concerns between modules
- Reduced dependencies between components
- Enhanced code reusability with helper functions

### Documentation Updates

- Cleaned up README.md to reflect current implementation
- Removed duplicate sections and outdated information
- Added detailed comments to clarify complex logic

### Game Controls
- **←/→** or **A/D**: Move left/right
- **↑** or **W** or **Space**: Jump

---

## 🌐 Deployment on Render.com

### Prerequisites
- A [Render.com](https://render.com) account
- Your project code pushed to a Git repository (GitHub, GitLab, etc.)

### Deployment Steps

1. **Sign up or log in to Render.com**
   - Go to [https://render.com](https://render.com) and create an account or log in

2. **Create a new Web Service**
   - Click on the "New +" button in the dashboard
   - Select "Web Service"

3. **Connect your repository**
   - Connect your GitHub/GitLab account or use public repository URL
   - Select the cube-dash-arena repository

4. **Configure your service**
   - Name: `cube-dash-arena` (or any name you prefer)
   - Runtime: `Node`
   - Build Command: `npm install`
   - Start Command: `node server/server.js`
   - Instance Type: Free (for testing) or Basic (for better performance)

5. **Deploy your application**
   - Click "Create Web Service"
   - Render will automatically deploy your application

6. **Access your deployed game**
   - Once deployment is complete, Render will provide you with a URL (e.g., `https://cube-dash-arena.onrender.com`)
   - Share this URL with friends to play multiplayer

### Troubleshooting

- If you encounter connection issues, check the Render logs in the dashboard
- For WebSocket connection problems, ensure your client is using the correct server URL
- If the game is slow, consider upgrading to a paid plan for better performance

### Maintenance

- Render automatically redeploys your application when you push changes to your repository
- You can manually trigger a deployment from the Render dashboard

## 🔄 Pushing Code to GitHub

To push your latest code changes to GitHub, follow these steps:

1. Navigate to your project directory:
   ```
   cd C:\Users\amiru\OneDrive\Desktop\cube-dash-arena
   ```

2. Add all changed files to staging:
   ```
   git add .
   ```

3. Commit your changes with a descriptive message:
   ```
   git commit -m "Update: latest changes to Cube Dash Arena"
   ```

4. Push your changes to the main branch:
   ```
   git push origin main
   ```

5. Your changes will now be available on GitHub and will trigger automatic redeployment if you're using Render.com



---

## 📜 License
This project is for educational purposes only.
