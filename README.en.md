# 🚀 CubeCity: Modern 3D City-Building Simulation

<a href="https://hellogithub.com/repository/hexianWeb/CubeCity" target="_blank"><img src="https://abroad.hellogithub.com/v1/widgets/recommend.svg?rid=f72043c7eb9145a58e98b5c66eb213cc&claim_uid=hTox9fKc5AdjLus&theme=dark" alt="Featured｜HelloGitHub" style="width: 250px; height: 54px;" width="250" height="54" /></a>

[中文版 README](./README.md) | [User Guide](./docs/新手指南.md) | [Developer Guide](./docs/新手开发指南.md)

**CubeCity** is a lightweight, responsive 3D city-builder simulation game built with **Three.js** and **Vue 3**. Beyond a simple visual demo, it features a complete economic loop, deep interaction logic, and a robust archiving system.

![Gameplay Demo](README/游玩时动图.gif)

---

## ✨ Core Features (Secondary Dev Edition)

### 🏗️ Immersive Construction Experience
*   **Full-Screen Canvas**: A borderless 3D rendering layout with floating UI, supporting WASD panning and QE rotation for a pro-gaming feel.
*   **Ghost Building Preview**: Real-time holographic previews before placing buildings. Features color-coded feedback (Green for valid, Red for invalid/blocked).
*   **Tactile Animations (GSAP)**: Dynamic "Bounce-in" effects for construction, "Elastic Pulse" for upgrades, and "Smooth Shrink" for demolition.

### 🎮 Modern HUD & Hotkeys
*   **Draggable ModeHUD**: A floating central control panel. Supports double-clicking the Demolish icon to toggle between "Safe Confirm" and "Quick Erase" modes.
*   **Pro-Level Hotkeys**:
    *   `1` `2` `3` `4`: Instant mode switching (Select, Build, Relocate, Demolish).
    *   `W` `A` `S` `D`: Smooth camera panning aligned with view direction.
    *   `Q` `E` / `ArrowKeys`: Fixed-angle perspective rotation.
    *   `I`: Toggle/Collapse the right-side building detail panel.

### 📊 Strategy & Management
*   **RCI Economic Balance**: Simulates the interdependent needs of Residential (R), Commercial (C), and Industrial (I) zones.
*   **ESG Metrics**: Monitor city health via Environment (E), Social (S), and Governance (G) indicators.
*   **Satellite Mini-Map**: Real-time synchronized map with category color-coding and coordinate tracking.

### 💾 Archive Management System
*   **Multi-Slot Saving**: Built-in 3 local storage slots with timestamps, city names, and level tracking.
*   **JSON Portability**: Export your city to a `.json` file to share with friends or import files to migrate your progress.

---

## 🎮 How to Play

Manage every detail of your metropolis through four core interaction modes:

*   **🔍 1 - SELECT Mode**: Inspect building details, monitor production efficiency, and handle maintenance.
*   **🏗️ 2 - BUILD Mode**: Plan your city using **Ghost Previews**. Note: Most buildings must be placed adjacent to roads.
*   **🚚 3 - RELOCATE Mode**: Move existing structures to empty tiles. Press `R` to rotate the model before placing.
*   **💥 4 - DEMOLISH Mode**: Clear old zones. Toggle **"Quick Mode"** via the HUD or by pressing `4` again for rapid urban renewal.

---

## 🛠️ Tech Stack

| Category | Technology |
| :--- | :--- |
| **Engine** | [Three.js](https://threejs.org/) (WebGL) |
| **Framework** | [Vue 3](https://vuejs.org/) (Composition API) |
| **State** | [Pinia](https://pinia.vuejs.org/) (with PersistedState) |
| **Animation** | [GSAP](https://greensock.com/gsap/) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) |
| **Tooling** | [mitt](https://github.com/developit/mitt), [Vite](https://vitejs.dev/) |

---

## 🔄 Building Status System (Looping mechanism)

The project includes an intelligent status feedback system displayed via floating icons:

1.  **Debuff Priority**: Critical issues like power outages, disconnected roads, or overpopulation are prioritized in the rotation.
2.  **Buff Display**: When requirements are met, gain positive indicators for production boosts or available upgrades.
3.  **Visual Polish**: Smooth fade-in/out transitions ensure the UI doesn't distract from the gameplay.

---

## 🚀 Quick Start

### Development
```bash
# Clone the repository
git clone https://github.com/hexianWeb/CubeCity.git

# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Build
```bash
npm run build
```

---

## 🧑‍💻 Author & License

*   **Author**: [hexianWeb](https://github.com/hexianWeb)
*   **License**: [MIT License](LICENSE)
*   **Contributors**: Special thanks to everyone who participated in the secondary development and UX optimization.

---

## 💖 Support the Project

If this project helped you learn Three.js or Vue 3, please consider giving it a **Star** 🌟 or buying the author a coffee:

![Donation QR](README/coffe.jpg)

---
*CubeCity - Bringing life to your voxel metropolis.*