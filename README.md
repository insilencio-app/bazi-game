# BaZi Game - Interactive React Prototype

## 🎮 What You Get

A fully functional React-based BaZi learning game prototype with:

✅ **Interactive Elements Learning** - Five Elements wheel visualization  
✅ **Course System** - Structured lessons with content  
✅ **Quiz Games** - Multiple choice questions with instant feedback  
✅ **Progress Tracking** - User stats dashboard  
✅ **Traditional Chinese UI** - Full Traditional Chinese interface  
✅ **Responsive Design** - Works on desktop and mobile  
✅ **Mock Data** - Real BaZi knowledge data ready to learn  

---

## 🚀 Quick Start (5 minutes)

### 1. Open in VS Code
Open the `bazi-game-starter` folder in VS Code

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```

The app will automatically open at `http://localhost:5173`

### 4. Start Learning!
- Click **五行基礎** to explore Five Elements
- Click **課程與測驗** to take lessons and quizzes
- Complete quizzes to earn points and track progress

---

## 📁 Project Structure

```
bazi-game-starter/
├── src/
│   ├── components/
│   │   ├── ElementCard.tsx       # Element display card
│   │   ├── QuizGame.tsx          # Quiz game component
│   │   └── ElementWheel.tsx      # 5 Elements visualization
│   ├── pages/
│   │   ├── HomePage.tsx          # Main game hub (all modes)
│   │   ├── LessonPage.tsx        # Lesson viewer
│   │   └── QuizPage.tsx          # Quiz interface
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
└── postcss.config.js
```

---

## 🎯 Features Implemented

### 1. **Main Menu**
- Dashboard with user progress stats
- 4 learning modes to choose from:
  - 五行基礎 (Five Elements)
  - 天干地支 (Heavenly Stems & Earthly Branches)
  - 十神詳解 (Ten Gods)
  - 課程與測驗 (Courses & Quizzes)

### 2. **Five Elements Learning**
- Interactive element wheel diagram
- Element cards with properties
- Detailed element information panel
- Properties: direction, season, emotion, color

### 3. **Heavenly Stems & Earthly Branches**
- Visual grid display of all 10 stems
- Visual grid display of all 12 branches
- Color-coded by element

### 4. **Ten Gods**
- Card-based display of all 10 gods
- Personality traits (positive & negative)
- Detailed descriptions

### 5. **Course System**
- Lesson list with metadata
- Lesson content viewer
- Integration with quizzes
- Completion tracking

### 6. **Quiz Game**
- Multiple choice questions
- Real-time feedback (correct/incorrect)
- Progress bar and score tracking
- Detailed explanations for each answer
- Results summary with performance analysis
- Option to retake quiz

---

## 🎨 Customization

### Change Color Scheme
Edit `src/pages/HomePage.tsx` - gradient colors in buttons and headers

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

Creates optimized production build in `dist/` folder

---

## 🐛 Troubleshooting

### Port already in use
```bash
npm run dev -- --port 5174
```

### Build errors
```bash
npm install
npm run build
```

### Clear Vite cache
```bash
rm -rf node_modules/.vite
npm run dev
```

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
- Mock data matches the database schema from `initial_data_setup.md`
- Ready to integrate with PostgreSQL or MongoDB
- Responsive design works on mobile, tablet, and desktop

---

## 🎉 Enjoy!

Your BaZi learning game is ready to use! Share it with friends learning BaZi and help them master this ancient wisdom in an interactive way.

Need to connect to a real database? Let me know and I can set up the Node.js backend API!
