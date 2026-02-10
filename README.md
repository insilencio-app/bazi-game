# BaZi Game - Interactive React Learning App

## 🎮 What You Get

A fully functional React-based BaZi learning game with:

✅ **Interactive Elements Learning** - Five Elements wheel visualization  
✅ **Course System** - Structured lessons with real BaZi knowledge  
✅ **Quiz Games** - Multiple choice, true/false, and matching questions with instant feedback  
✅ **Progress Tracking** - User stats dashboard with lesson completion  
✅ **Traditional Chinese UI** - Full Traditional Chinese (繁體中文) interface  
✅ **Fully Responsive** - Optimized for mobile, tablet, and desktop  
✅ **Live on Vercel** - Play online from any device  
✅ **Mock Data** - Real BaZi knowledge database built-in  

---

## 🚀 Quick Start

### Online (Recommended for Mobile)
**Play instantly on your phone or browser:**
1. Visit: `https://bazi-game.vercel.app`
2. No installation needed!
3. Works on all devices with internet

### Local Development (Windows)
**Option A: Quick Start with Batch File**
1. Double-click `Start Game.bat` in the folder
2. A command window will open and start the server
3. Your browser will automatically launch the game at `http://localhost:5173`
4. Press Ctrl+C to stop when done

**Option B: Manual Start**
1. Open the `BaZi Game` folder in VS Code
2. Open terminal and run:
```bash
npm install
npm run dev
```
3. Click the URL that appears: `http://localhost:5173`

### 4. Start Learning!
- Click **五行基礎** to explore Five Elements
- Click **天干地支** to learn Heavenly Stems & Earthly Branches  
- Click **十神詳解** to discover the Ten Gods
- Click **課程與測驗** to take structured lessons and quizzes
- Complete quizzes to earn points and track your progress

---

## 📁 Project Structure

```
bazi-game/
├── src/
│   ├── components/
│   │   ├── ElementCard.tsx       # Element display card
│   │   ├── QuizGame.tsx          # Quiz game component
│   │   └── ElementWheel.tsx      # 5 Elements visualization
│   ├── pages/
│   │   ├── HomePage.tsx          # Main game hub (all modes)
│   │   ├── LessonPage.tsx        # Lesson viewer & quiz handler
│   │   └── QuizPage.tsx          # Quiz completion results
│   ├── data/
│   │   └── mockData.ts           # All BaZi knowledge data
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── Start Game.bat                # Windows launcher
└── postcss.config.js
```

---

## 🎯 Features Implemented

### 1. **Main Menu**
- Dashboard with user progress stats (lessons completed, quizzes passed, total score)
- 7 learning paths to choose from:
  - 五行基礎 (Five Elements Basics)
  - 十天干入門 (Heavenly Stems Intro)
  - 十二地支入門 (Earthly Branches Intro)
  - 十神詳解 (Ten Gods Detailed)
  - 十二地支藏干 (Hidden Stems in Branches)
  - 地支關係 (Branch Relationships)
  - 全部課程 (All Courses View)

### 2. **Five Elements Learning**
- Interactive element wheel diagram with clickable elements
- Element cards showing emojis and colors
- Detailed element information panel (direction, season, emotion, color, description)
- Fully responsive for mobile devices

### 3. **Heavenly Stems & Earthly Branches**
- Visual grid display of all 10 heavenly stems with yin/yang, element, and traits
- Visual grid display of all 12 earthly branches with zodiac animals, elements, hour ranges
- Color-coded by element type
- Mobile-optimized grid layouts

### 4. **Ten Gods**
- Card-based display of all 10 gods
- Personality traits (positive & negative aspects)
- Detailed descriptions

### 5. **Course & Lesson System**
- Structured lesson content with multiple content types
- Card displays for visual learning
- Interactive quiz questions embedded in lessons
- Progress bar showing lesson completion
- Completion tracking and scoring

### 6. **Quiz Game Features**
- **Multiple Choice (MCQ)** - 4-option questions with instant feedback
- **True/False** - Quick true/false assessments
- **Matching Game** - Match left items with right items (with bug fix for duplicate values)
- Real-time feedback (correct/incorrect with explanations)
- Progress bar and score tracking
- Detailed explanations for each answer
- Results summary with percentage and analysis
- Responsive buttons for all device sizes

---

## 🎨 Recent Improvements

### Mobile Optimization (Feb 2026)
✅ Responsive typography - text scales perfectly from 320px phones to 4K displays  
✅ Flexible grid layouts - adapts from 1 column on mobile to 5+ on desktop  
✅ Touch-friendly buttons - larger padding and spacing for mobile users  
✅ Optimized headers - flexbox layout works on all screen sizes  
✅ Smart padding - different padding for mobile (p-3 sm:p-6) vs desktop  
✅ Mobile-first approach - works great on iPhone SE and modern phones

### Bug Fixes
✅ Fixed matching game bug where multiple selections would highlight simultaneously  
✅ Improved match tracking to handle duplicate right-side values correctly  
✅ Better state management for matching pairs

### UI Enhancements
✅ Made "Return to Menu" buttons more prominent with red color and larger size  
✅ Added home emoji (🏠) for quick visual recognition  
✅ Better button feedback with hover scale effects

---

## 🎨 Customization

### Change Color Scheme
Edit [src/pages/HomePage.tsx](src/pages/HomePage.tsx) - gradient colors in buttons and headers

### Add More Content
Edit `src/data/mockData.ts`:
```typescript
export const mockLessons = [
  // Add more lessons here
];

export const mockQuizzes = [
  // Add more quizzes here
];
```

### Modify Quiz Questions
```typescript
{
  id: 1,
  question: "你的問題？",
  options: ["選項 A", "選項 B", "選項 C", "選項 D"],
  correct: 0, // Index of correct answer
  explanation: "解釋為什麼這是正確答案"
}
```

---

## 🌐 Deployment

### Already Live on Vercel
Your game is **already deployed** and live!
- **URL:** https://bazi-game.vercel.app
- **Status:** Automatic deployments on every GitHub push
- **Deployment Platform:** Vercel (Free tier)

To push updates:
```bash
git add .
git commit -m "Your changes"
git push
```
Vercel will automatically rebuild and redeploy within 1-2 minutes!

### Self-Hosting Options
- **Vercel** (recommended) - Already set up
- **Netlify** - Similar to Vercel, also free
- **GitHub Pages** - Free but limited features
- **Any Node.js host** - DigitalOcean, Heroku, AWS, etc.

---

## 🔌 Next Steps: Connect to Backend

When ready to connect to a real database:

1. **Create API Service**
```typescript
// src/services/api.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:3000/api'
});

export const fetchElements = () => api.get('/elements');
export const fetchQuizzes = () => api.get('/quizzes');
export const submitQuizAttempt = (quizId, answers) => 
  api.post(`/quizzes/${quizId}/attempts`, answers);
```

2. **Replace Mock Data**
```typescript
// Instead of mockElements
const [elements, setElements] = useState([]);

useEffect(() => {
  api.fetchElements().then(res => setElements(res.data));
}, []);
```

3. **Set Up State Management**
- Already installed `zustand` and `react-i18next`
- Use them to manage global game state and translations

---

## 📦 Build for Production

```bash
npm run build
```

Creates optimized production build in `dist/` folder (automatically handled by Vercel)

---

## 🐛 Troubleshooting

### Start Game Button (Windows)
If `Start Game.bat` doesn't work:
- Make sure you're in the `BaZi Game` folder
- Right-click the file and select "Run as administrator"
- Or open PowerShell/Command Prompt and run: `npm run dev`

### Dependencies Error
```bash
npm install
npm run build
```

### Port Already in Use
```bash
npm run dev -- --port 5174
```

### Mobile Display Issues
- Ensure you're using a modern browser (Chrome, Safari, Firefox, Edge)
- On iOS: Use Safari or Chrome
- On Android: Use Chrome or Firefox
- Clear browser cache if styling looks wrong
- The app is optimized for screens 320px and up

### Performance Issues
- Clear browser cache (Ctrl+Shift+Delete)
- Close other browser tabs
- Restart the development server

### Deployment Issues on Vercel
If deployment fails:
1. Check that all files were committed: `git status`
2. Push to GitHub: `git push`
3. Check Vercel dashboard for build logs
4. Make sure package.json build script is correct

---

## 🎓 Learning Path for Users

**Beginner Level:**
1. Learn Five Elements (五行基礎)
2. Learn Heavenly Stems & Branches (天干地支)
3. Complete Five Elements Quiz

**Intermediate Level:**
4. Learn Ten Gods (十神詳解)
5. Learn Pillar System
6. Complete comprehensive quiz

**Advanced Level:**
7. BaZi Chart Analysis
8. Personality Reading
9. Prediction Methods

---

## 📝 Notes

- All content is in **Traditional Chinese (繁體中文)**
- Real BaZi knowledge database built into the app
- Fully mobile-responsive (tested on iPhone SE to iPad)
- Already deployed on Vercel with automatic updates
- All quiz types: MCQ, True/False, and Matching games
- Bug fixes and optimizations completed Feb 2026

---

## 🎓 Learning Path for Users

**Beginner Level:**
1. Learn Five Elements (五行基礎)
2. Learn Heavenly Stems & Earthly Branches  
3. Complete Five Elements lesson and quiz

**Intermediate Level:**
4. Learn Ten Gods (十神詳解)
5. Learn Hidden Stems in Branches
6. Complete all intermediate quizzes

**Advanced Level:**
7. Study Branch Relationships (地支關係)
8. Explore all course modules
9. Master BaZi fundamentals

---

## 🎉 Ready to Use!

✅ **For Mobile Users:** Visit https://bazi-game.vercel.app  
✅ **For Desktop Development:** Double-click Start Game.bat or run `npm run dev`  
✅ **All Features Working:** Lessons, quizzes, matching games, progress tracking  
✅ **Fully Responsive:** Optimized for all screen sizes  
✅ **Live & Updated:** Any code changes auto-deploy to Vercel

Share it with friends learning BaZi and help them master this ancient wisdom in an interactive way! 🧠✨
