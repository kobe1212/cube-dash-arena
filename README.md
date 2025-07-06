# Cube Dash Arena

Cube Dash Arena is a fast-paced multiplayer dodge game where two players control colorful cubes in a 3D arena. Players must avoid falling obstacles and survive as long as possible. The last cube standing wins the round.

## 🎮 Features

- Multiplayer gameplay with Socket.IO
- Simple movement (left, right, jump)
- Falling obstacles with collision detection
- Real-time sync of player states
- Quick 30–60 second rounds
- Low-poly visuals with textures and lighting
- Progressive difficulty system
- Sound effects and mute option
- Score tracking system

---

## 🧱 Tech Stack

- **Three.js** – 3D graphics rendering
- **Node.js + Express** – Backend server
- **Socket.IO** – Real-time multiplayer
- **Web Audio API** - Sound generation
- **Canvas API** - Procedural textures

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

### ES Modules Version (Recommended)

```
cube-dash-arena/
├── client/                # Frontend files
│   ├── modules/          # ES modules directory
│   │   ├── arena.js      # Arena creation and management
│   │   ├── difficulty.js # Difficulty progression system
│   │   ├── gameManager.js # Core game logic and state management
│   │   ├── main.js       # Main entry point and initialization
│   │   ├── obstacles.js  # Obstacle generation and management
│   │   ├── player.js     # Player cube controls and physics
│   │   ├── scene.js      # Three.js scene, camera, and renderer setup
│   │   ├── socketManager.js # Socket.IO client implementation
│   │   ├── sounds.js     # Sound effects manager
│   │   └── textures.js   # Procedural texture generation
│   ├── index-modules.html # ES modules entry point HTML
│   ├── index.html        # Legacy entry point HTML
│   └── style.css         # CSS styles
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

---

## 🔄 ES Modules vs Legacy Version

This project has been refactored to use ES modules for better code organization, maintainability, and modern JavaScript practices.

### Benefits of the ES Modules Version

- **Better Encapsulation**: Each module is responsible for its own functionality with clear boundaries
- **Explicit Dependencies**: You can see exactly what each module depends on
- **No Global State**: Eliminated all global variables, reducing potential bugs
- **Better Maintainability**: Code is more organized and easier to understand
- **Modern JavaScript**: Following ES module best practices

### How to Use the ES Modules Version

The ES modules version is now the default version of the game. Simply open the root URL after starting the server:

```
http://localhost:3001/
```

The legacy version is still available at:

```
http://localhost:3001/index-legacy.html
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)

### Installation
1. Clone the repository or download the source code
2. Navigate to the project directory:
   ```
   cd C:\Users\amiru\OneDrive\Desktop\cube-dash-arena
   ```
3. Install dependencies:
   ```
   npm install
   ```

### Running the Game
1. Start the server:
   ```
   node server/server.js
   ```
2. Open your web browser and navigate to:
   ```
   http://localhost:3001
   ```
3. To play multiplayer, open another browser window with the same URL

Notes:

C:\Users\amiru\OneDrive\Desktop\cube-dash-arena>netstat -ano | findstr :3001
  TCP    0.0.0.0:3001           0.0.0.0:0              LISTENING       7540
  TCP    [::]:3001              [::]:0                 LISTENING       7540

C:\Users\amiru\OneDrive\Desktop\cube-dash-arena>taskkill /PID [7540] /F
ERROR: The process "[7540]" not found.

C:\Users\amiru\OneDrive\Desktop\cube-dash-arena>taskkill /PID 7540 /F
SUCCESS: The process with PID 7540 has been terminated.

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

## 📁 Project Structure
```
cube-dash-arena/
├── client/
│   ├── index.html
│   ├── style.css
│   ├── game.js
│   └── socket.js
├── server/
│   ├── server.js
│   └── package.json
└── assets/
    ├── textures/
    └── sounds/
```

---

## 📜 License
This project is for educational purposes only.
