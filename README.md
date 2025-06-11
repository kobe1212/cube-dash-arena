# Cube Dash Arena

Cube Dash Arena is a fast-paced multiplayer dodge game where two players control colorful cubes in a 3D arena. Players must avoid falling obstacles and survive as long as possible. The last cube standing wins the round.

## 🌐 Live Demo
> Add your Render.com URL here once deployed.

---

## 🎮 Features

- Multiplayer gameplay with Socket.IO
- Simple movement (left, right, jump)
- Falling obstacles with collision detection
- Real-time sync of player states
- Quick 30–60 second rounds
- Low-poly visuals with textures and lighting

---

## 🧱 Tech Stack

- **Three.js** – 3D graphics rendering
- **Node.js + Express** – Backend server
- **Socket.IO** – Real-time multiplayer
- **Render.com** – Hosting

---

## 🚀 Deployment on Render.com

### 1. Upload Your Code to GitHub
- Push this full project to a public GitHub repo (e.g., `cube-dash-arena`)

### 2. Create an Account on Render
- Go to [https://render.com](https://render.com) and sign up with GitHub

### 3. Deploy Your App
- Click **"New Web Service"**
- Connect your GitHub repository
- Set the following configuration:
  - **Build Command:** `npm install`
  - **Start Command:** `node server/server.js`
  - **Root Directory:** Leave as `.`

### 4. Static File Serving Fix
Ensure `server.js` can serve static files:
```js
const path = require('path');
app.use(express.static(path.join(__dirname, '../client')));
```

### 5. Done!
Once deployed, you’ll get a public link like:
```
https://cube-dash-arena.onrender.com
```
Open it in two browser windows (or send to a friend) to play together.

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
