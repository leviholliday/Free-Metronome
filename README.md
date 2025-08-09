# Professional Piano Metronome

A sophisticated, web-based metronome application designed for musicians, featuring advanced rhythm training capabilities and a beautiful, responsive interface.

## 🎵 Features

### Core Metronome Functionality
- **Tempo Range**: 40-208 BPM with fine and coarse adjustment
- **Time Signatures**: Support for 2/4, 3/4, 4/4, 5/4, 6/8, 7/8, 9/8, 12/8
- **Subdivisions**: Quarter, Eighth, Triplet, and Sixteenth notes
- **Visual Feedback**: Animated pendulum and beat indicators
- **Multiple Sounds**: Classic Click, Wood Block, Digital Beep, Cowbell, Rimshot

### Advanced Features
- **Tap Tempo**: Tap to set tempo with multiple key support (T, Q, W, E, R, Enter)
- **Accent Patterns**: Customizable beat emphasis
- **Polyrhythm Support**: Create complex rhythmic patterns
- **Preset System**: Save and load custom configurations
- **Keyboard Shortcuts**: Full keyboard control for desktop users

### User Experience
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Mobile-First Controls**: Slide-out control panel for mobile devices
- **Beautiful UI**: Modern gradient design with glassmorphism effects
- **Accessibility**: High contrast and clear visual indicators

## 🚀 Deployment

This project is ready for deployment on Netlify with zero configuration required.

### Netlify Deployment Steps

1. **Push to Git Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Professional Metronome"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Deploy on Netlify**
   - Go to [Netlify](https://app.netlify.com/)
   - Click "New site from Git"
   - Connect your repository
   - Deploy automatically

### Manual Deployment
- Drag and drop the project folder to Netlify's deploy area
- Your site will be live instantly

## 🛠️ Local Development

### Quick Start
1. Clone the repository
2. Open `index.html` in your browser
3. Or use a local server:
   ```bash
   python3 -m http.server 8000
   # Then visit http://localhost:8000
   ```

### Netlify CLI (Optional)
```bash
npm install -g netlify-cli
netlify dev
```

## 📱 Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile**: iOS Safari, Chrome Mobile, Samsung Internet
- **Features**: Web Audio API, CSS Grid, Flexbox

## 🎹 Usage

### Basic Controls
- **Space**: Start/Stop metronome
- **↑/↓**: Fine tempo adjustment (±1 BPM)
- **←/→**: Coarse tempo adjustment (±5 BPM)
- **T, Q, W, E, R, Enter**: Tap tempo

### Mobile Controls
- Tap the gear icon (⚙️) to access the control panel
- Swipe or tap outside to close controls

## 🔧 Technical Details

- **Pure HTML/CSS/JavaScript**: No frameworks or build tools required
- **Web Audio API**: High-quality sound generation
- **CSS Grid & Flexbox**: Responsive layout system
- **Local Storage**: Preset saving and loading
- **Progressive Web App Ready**: Can be installed on mobile devices

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

---

**Ready for Netlify deployment!** 🚀
