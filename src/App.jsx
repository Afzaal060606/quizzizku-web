import { onValue, ref, remove, set, update } from "firebase/database";
import { useEffect, useState } from 'react';
import { questionsData } from "./dataSoal";
import { db } from "./firebase";

const colorClasses = [
  "bg-red-500 hover:bg-red-600 shadow-[0_4px_0_#991b1b]", 
  "bg-blue-500 hover:bg-blue-600 shadow-[0_4px_0_#1e3a8a]", 
  "bg-yellow-500 hover:bg-yellow-600 shadow-[0_4px_0_#a16207]", 
  "bg-green-500 hover:bg-green-600 shadow-[0_4px_0_#166534]"
];

function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [inputValue, setInputValue] = useState('');
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  
  // State dari Firebase
  const [players, setPlayers] = useState({});
  const [gameState, setGameState] = useState('waiting');

  // Menarik data Real-time dari Firebase
  useEffect(() => {
    const gameStateRef = ref(db, 'gameState');
    onValue(gameStateRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setGameState(data);
    });

    const playersRef = ref(db, 'players');
    onValue(playersRef, (snapshot) => {
      const data = snapshot.val();
      setPlayers(data || {});
    });
  }, []);

  // Logika Pemain Otomatis Masuk Arena jika Admin klik Mulai
  useEffect(() => {
    if (currentPage === 'lobby' && gameState === 'playing') {
      setCurrentPage('quiz');
    }
    // Jika admin mereset kuis, kembalikan semua ke layar awal
    if (gameState === 'waiting' && (currentPage === 'quiz' || currentPage === 'result')) {
      setCurrentPage('login');
      setInputValue('');
      setScore(0);
      setCurrentQuestionIndex(0);
    }
  }, [gameState, currentPage]);

  const handleJoin = (e) => {
    e.preventDefault();
    if (inputValue.trim() === '') return;
    
    if (inputValue === 'admin123') {
      setCurrentPage('admin');
    } else {
      // Masukkan nama siswa ke Firebase dengan skor awal 0
      set(ref(db, 'players/' + inputValue), { score: 0 });
      setCurrentPage('lobby');
    }
  };

  const startQuizByAdmin = () => {
    set(ref(db, 'gameState'), 'playing');
  };

  const resetQuizByAdmin = () => {
    set(ref(db, 'gameState'), 'waiting');
    remove(ref(db, 'players')); // Bersihkan daftar pemain
  };

  const handleAnswerClick = (selectedOption) => {
    const isCorrect = selectedOption === questionsData[currentQuestionIndex].answer;
    let newScore = score;
    
    if (isCorrect) {
      newScore = score + 4;
      setScore(newScore);
      // Update skor terbaru ke Firebase secara real-time
      update(ref(db, 'players/' + inputValue), { score: newScore });
    }

    const nextQuestion = currentQuestionIndex + 1;
    if (nextQuestion < questionsData.length) {
      setCurrentQuestionIndex(nextQuestion);
    } else {
      setCurrentPage('result');
    }
  };

  // HALAMAN MASUK (LOGIN)
  if (currentPage === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-quiz-dark via-black to-black">
        <div className="w-full max-w-md bg-white/5 backdrop-blur-md border border-white/10 p-10 rounded-3xl shadow-2xl text-center relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-quiz-purple rounded-full blur-[80px] opacity-50 pointer-events-none"></div>
          <h1 className="text-5xl font-bold mb-2 tracking-tight relative z-10">Quizziz<span className="text-quiz-purple">Ku</span></h1>
          <p className="text-gray-400 mb-10 text-sm font-light tracking-wide relative z-10">Media Pembelajaran Interaktif</p>
          <form onSubmit={handleJoin} className="space-y-6 relative z-10">
            <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Masukkan Nama Kamu..." className="w-full bg-black/50 border border-quiz-purple/40 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-quiz-purple transition-all text-center text-lg placeholder:text-gray-600 font-semibold" required />
            <button type="submit" className="w-full bg-quiz-purple hover:bg-quiz-purple-dark transition-all py-4 rounded-2xl font-bold text-lg shadow-[0_0_20px_rgba(126,34,206,0.4)]">MASUK</button>
          </form>
        </div>
      </div>
    );
  }

  // HALAMAN LOBBY (SISWA)
  if (currentPage === 'lobby') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-quiz-dark">
        <div className="w-full max-w-2xl bg-white/5 border border-white/10 p-10 rounded-3xl text-center shadow-2xl">
          <h2 className="text-3xl font-bold mb-2">Ruang Tunggu</h2>
          <p className="text-xl mb-8">Halo, <span className="text-quiz-purple font-bold">{inputValue}</span>!</p>
          <div className="flex flex-col items-center justify-center space-y-6 py-8">
            <div className="w-16 h-16 border-4 border-quiz-purple border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(126,34,206,0.5)]"></div>
            <p className="text-gray-400 animate-pulse text-lg">Menunggu guru memulai kuis...</p>
          </div>
        </div>
      </div>
    );
  }

  // HALAMAN ADMIN
  if (currentPage === 'admin') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-quiz-dark">
        <div className="w-full max-w-3xl bg-white/5 border border-quiz-purple/50 p-10 rounded-3xl text-center shadow-[0_0_50px_rgba(126,34,206,0.15)]">
          <h2 className="text-4xl font-bold mb-2 text-quiz-purple">Kendali Guru</h2>
          
          <div className="mb-8 p-6 bg-black/40 rounded-2xl border border-white/5 min-h-[150px]">
            <h3 className="text-lg font-bold mb-4 text-white">Daftar Siswa di Ruang Tunggu:</h3>
            <div className="flex flex-wrap justify-center gap-3">
              {Object.keys(players).length === 0 ? (
                <p className="text-gray-500 italic">Belum ada siswa yang masuk...</p>
              ) : (
                Object.keys(players).map((playerName, idx) => (
                  <span key={idx} className="bg-quiz-purple/20 border border-quiz-purple/50 text-white px-4 py-2 rounded-full">
                    {playerName}
                  </span>
                ))
              )}
            </div>
          </div>
          
          <div className="space-x-4">
            <button onClick={startQuizByAdmin} className="bg-green-500 hover:bg-green-600 transition-all px-12 py-4 rounded-2xl font-bold text-xl shadow-[0_0_20px_rgba(34,197,94,0.4)]">
              MULAI KUIS SEKARANG
            </button>
            <button onClick={resetQuizByAdmin} className="bg-red-500 hover:bg-red-600 transition-all px-8 py-4 rounded-2xl font-bold text-xl shadow-[0_0_20px_rgba(239,68,68,0.4)]">
              RESET KUIS
            </button>
          </div>
        </div>
      </div>
    );
  }

  // HALAMAN ARENA KUIS
  if (currentPage === 'quiz') {
    const currentQ = questionsData[currentQuestionIndex];
    return (
      <div className="min-h-screen flex flex-col p-4 bg-quiz-dark">
        <div className="flex justify-between items-center mb-8 bg-white/5 p-4 rounded-2xl border border-white/10">
          <span className="font-bold text-gray-400">Soal {currentQuestionIndex + 1} / {questionsData.length}</span>
          <span className="font-bold bg-quiz-purple/20 text-quiz-purple px-4 py-1 rounded-full">Skor: {score}</span>
        </div>

        <div className="flex-1 flex items-center justify-center mb-8">
          <h2 className="text-3xl md:text-5xl font-bold text-center leading-tight">{currentQ.question}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto w-full mb-8">
          {currentQ.options.map((option, index) => (
            <button key={index} onClick={() => handleAnswerClick(option)} className={`${colorClasses[index]} p-8 rounded-2xl text-white text-xl md:text-2xl font-bold active:translate-y-1 active:shadow-none transition-all flex items-center justify-center min-h-[120px]`}>
              {option}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // HALAMAN CLOSING (HASIL AKHIR & KLASEMEN)
  if (currentPage === 'result') {
    // Mengurutkan pemain berdasarkan skor tertinggi
    const sortedPlayers = Object.entries(players).sort((a, b) => b[1].score - a[1].score);

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-quiz-dark">
        <div className="w-full max-w-3xl bg-white/5 border border-quiz-purple/50 p-10 rounded-3xl text-center shadow-[0_0_50px_rgba(126,34,206,0.3)]">
          <h2 className="text-5xl font-bold mb-4 text-white">Kuis Selesai! 🎉</h2>
          
          <div className="bg-black/50 p-8 rounded-2xl mb-8 border border-white/10">
            <p className="text-gray-400 text-lg mb-2">Skor Akhir Kamu</p>
            <p className="text-7xl font-bold text-quiz-purple mb-6">{score}</p>
            
            <h3 className="text-xl font-bold text-white mb-4 border-t border-white/10 pt-6">Papan Peringkat (Klasemen)</h3>
            <div className="space-y-3">
              {sortedPlayers.map(([name, data], idx) => (
                <div key={idx} className={`flex justify-between items-center p-4 rounded-xl ${name === inputValue ? 'bg-quiz-purple/30 border border-quiz-purple' : 'bg-white/5'}`}>
                  <span className="font-bold text-lg text-white">#{idx + 1} {name}</span>
                  <span className="font-bold text-xl text-quiz-purple">{data.score} pts</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default App;