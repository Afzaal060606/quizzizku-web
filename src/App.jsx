import React, { useState, useEffect } from 'react';
import { ref, set, onValue, update, remove, increment } from "firebase/database";
import { db } from "./firebase";
import { questionsData } from "./dataSoal";

const baseColorClasses = [
  "bg-red-500 shadow-[0_4px_0_#991b1b]", 
  "bg-blue-500 shadow-[0_4px_0_#1e3a8a]", 
  "bg-yellow-500 shadow-[0_4px_0_#a16207]", 
  "bg-green-500 shadow-[0_4px_0_#166534]"
];

function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [inputValue, setInputValue] = useState('');
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [isAnswered, setIsAnswered] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  
  const [players, setPlayers] = useState({});
  const [gameState, setGameState] = useState('waiting');
  const [wrongStats, setWrongStats] = useState({});

  useEffect(() => {
    const gameStateRef = ref(db, 'gameState');
    onValue(gameStateRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setGameState(data);
    });

    const playersRef = ref(db, 'players');
    onValue(playersRef, (snapshot) => setPlayers(snapshot.val() || {}));

    const statsRef = ref(db, 'quizStats');
    onValue(statsRef, (snapshot) => setWrongStats(snapshot.val() || {}));
  }, []);

  useEffect(() => {
    if (currentPage === 'lobby' && gameState === 'playing') {
      setCurrentPage('quiz');
      setTimeLeft(10);
    }
    if (gameState === 'evaluation' && (currentPage === 'result' || currentPage === 'admin_result' || currentPage === 'admin' || currentPage === 'quiz')) {
      setCurrentPage('evaluation');
    }
    if (gameState === 'waiting' && (currentPage === 'quiz' || currentPage === 'result' || currentPage === 'admin_result' || currentPage === 'evaluation')) {
      setCurrentPage('login');
      setInputValue('');
      setScore(0);
      setCurrentQuestionIndex(0);
      setIsAnswered(false);
    }
  }, [gameState, currentPage]);

  useEffect(() => {
    if (currentPage === 'quiz' && !isAnswered) {
      if (timeLeft > 0) {
        const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
        return () => clearTimeout(timerId);
      } else {
        handleTimeUp();
      }
    }
  }, [timeLeft, currentPage, isAnswered]);

  const handleJoin = (e) => {
    e.preventDefault();
    if (inputValue.trim() === '') return;
    
    if (inputValue === 'admin123') {
      setCurrentPage('admin');
    } else {
      set(ref(db, 'players/' + inputValue), { score: 0 });
      setCurrentPage('lobby');
    }
  };

  const startQuizByAdmin = () => set(ref(db, 'gameState'), 'playing');
  const showEvaluationByAdmin = () => set(ref(db, 'gameState'), 'evaluation');
  const resetQuizByAdmin = () => {
    set(ref(db, 'gameState'), 'waiting');
    remove(ref(db, 'players')); 
    remove(ref(db, 'quizStats'));
  };

  const handleTimeUp = () => {
    setIsAnswered(true);
    setSelectedOption(null);
    update(ref(db, 'quizStats'), { [currentQuestionIndex]: increment(1) });
    setTimeout(goToNextQuestion, 3000);
  };

  const handleAnswerClick = (option) => {
    if (isAnswered) return;
    setIsAnswered(true);
    setSelectedOption(option);
    
    const isCorrect = option === questionsData[currentQuestionIndex].answer;
    if (isCorrect) {
      const newScore = score + 4;
      setScore(newScore);
      update(ref(db, 'players/' + inputValue), { score: newScore });
    } else {
      update(ref(db, 'quizStats'), { [currentQuestionIndex]: increment(1) });
    }
    setTimeout(goToNextQuestion, 3000);
  };

  const goToNextQuestion = () => {
    setIsAnswered(false);
    setSelectedOption(null);
    setTimeLeft(10);
    const nextQuestion = currentQuestionIndex + 1;
    if (nextQuestion < questionsData.length) {
      setCurrentQuestionIndex(nextQuestion);
    } else {
      setCurrentPage(inputValue === 'admin123' ? 'admin_result' : 'result');
    }
  };

  const getOptionStyle = (option, index) => {
    const correctAnswer = questionsData[currentQuestionIndex].answer;
    const baseClass = baseColorClasses[index % 4];

    if (!isAnswered) return `${baseClass} hover:opacity-90 active:translate-y-1 active:shadow-none`;
    if (option === correctAnswer) return "bg-green-500 shadow-[0_0_30px_#22c55e] border-4 border-white z-10 animate-pulse scale-105";
    if (option === selectedOption) return "bg-red-600 shadow-inner border-4 border-red-900 opacity-80";
    return `${baseClass} opacity-30 grayscale`;
  };

  // ================= BUNGKUSAN RENDER HALAMAN ================= //
  const renderPage = () => {
    if (currentPage === 'login') {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-quiz-dark via-black to-black">
          <div className="w-full max-w-md bg-white/5 backdrop-blur-md border border-white/10 p-10 rounded-3xl shadow-2xl text-center">
            <h1 className="text-5xl font-bold mb-2 tracking-tight">Quizziz<span className="text-quiz-purple">Ku</span></h1>
            <p className="text-gray-400 mb-10 text-sm">Media Pembelajaran Interaktif</p>
            <form onSubmit={handleJoin} className="space-y-6">
              <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Masukkan Nama Kamu..." className="w-full bg-black/50 border border-quiz-purple/40 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-quiz-purple text-center text-lg font-semibold" required />
              <button type="submit" className="w-full bg-quiz-purple hover:bg-quiz-purple-dark transition-all py-4 rounded-2xl font-bold text-lg shadow-[0_0_20px_rgba(126,34,206,0.4)]">MASUK</button>
            </form>
          </div>
        </div>
      );
    }

    if (currentPage === 'lobby') {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-quiz-dark">
          <div className="w-full max-w-2xl bg-white/5 border border-white/10 p-10 rounded-3xl text-center shadow-2xl">
            <h2 className="text-3xl font-bold mb-2">Ruang Tunggu</h2>
            <p className="text-xl mb-8">Halo, <span className="text-quiz-purple font-bold">{inputValue}</span>!</p>
            <div className="flex flex-col items-center justify-center space-y-6 py-8">
              <div className="w-16 h-16 border-4 border-quiz-purple border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-400 animate-pulse text-lg">Menunggu guru memulai kuis...</p>
            </div>
          </div>
        </div>
      );
    }

    if (currentPage === 'admin') {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-quiz-dark">
          <div className="w-full max-w-3xl bg-white/5 border border-quiz-purple/50 p-10 rounded-3xl text-center">
            <h2 className="text-4xl font-bold mb-8 text-quiz-purple">Kendali Guru</h2>
            
            <div className="mb-8 p-6 bg-black/40 rounded-2xl border border-white/5 min-h-[150px]">
              <h3 className="text-lg font-bold mb-4 text-white">
                {gameState === 'playing' ? '🟢 Kuis Sedang Berlangsung!' : 'Daftar Siswa di Ruang Tunggu:'}
              </h3>
              <div className="flex flex-wrap justify-center gap-3">
                {Object.keys(players).length === 0 ? <p className="text-gray-500 italic">Belum ada siswa...</p> : Object.keys(players).map((name, idx) => (
                  <span key={idx} className="bg-quiz-purple/20 border border-quiz-purple/50 px-4 py-2 rounded-full text-white">{name}</span>
                ))}
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4">
              {gameState === 'waiting' && (
                <button onClick={startQuizByAdmin} className="bg-green-500 hover:bg-green-600 px-12 py-4 rounded-2xl font-bold text-xl shadow-[0_0_20px_rgba(34,197,94,0.4)]">
                  MULAI KUIS SEKARANG
                </button>
              )}
              
              {gameState === 'playing' && (
                <>
                  <button onClick={() => setCurrentPage('admin_result')} className="bg-quiz-purple hover:bg-quiz-purple-dark px-8 py-4 rounded-2xl font-bold text-xl shadow-[0_0_20px_rgba(126,34,206,0.4)]">
                    LIHAT KLASEMEN LIVE
                  </button>
                  <button onClick={showEvaluationByAdmin} className="bg-blue-500 hover:bg-blue-600 px-8 py-4 rounded-2xl font-bold text-xl shadow-[0_0_20px_rgba(59,130,246,0.4)]">
                    TAMPILKAN EVALUASI KE SISWA
                  </button>
                </>
              )}

              <button onClick={resetQuizByAdmin} className="bg-red-500 hover:bg-red-600 px-8 py-4 rounded-2xl font-bold text-xl shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                RESET KUIS
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (currentPage === 'quiz') {
      const currentQ = questionsData[currentQuestionIndex];
      return (
        <div className="min-h-screen flex flex-col p-4 bg-quiz-dark pb-16">
          <div className="flex justify-between items-center mb-8 bg-white/5 p-4 rounded-2xl border border-white/10">
            <span className="font-bold text-gray-400">Soal {currentQuestionIndex + 1} / {questionsData.length}</span>
            <div className={`text-3xl font-black ${timeLeft <= 3 ? 'text-red-500 animate-bounce' : 'text-quiz-purple animate-pulse'}`}>
              ⏱ {timeLeft}s
            </div>
            <span className="font-bold bg-quiz-purple/20 text-quiz-purple px-4 py-1 rounded-full">Skor: {score}</span>
          </div>

          <div className="flex-1 flex items-center justify-center mb-8">
            <h2 className="text-3xl md:text-5xl font-bold text-center leading-tight">{currentQ.question}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto w-full mb-8">
            {currentQ.options.map((option, index) => (
              <button 
                key={index} 
                onClick={() => handleAnswerClick(option)} 
                className={`p-8 rounded-2xl text-white text-xl md:text-2xl font-bold transition-all flex items-center justify-center min-h-[120px] ${getOptionStyle(option, index)}`}
                disabled={isAnswered}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (currentPage === 'result' || currentPage === 'admin_result') {
      const isAdmin = currentPage === 'admin_result';
      const sortedPlayers = Object.entries(players).sort((a, b) => b[1].score - a[1].score);
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-quiz-dark">
          <div className="w-full max-w-3xl bg-white/5 border border-quiz-purple/50 p-10 rounded-3xl text-center shadow-[0_0_50px_rgba(126,34,206,0.3)]">
            <h2 className="text-5xl font-bold mb-8 text-white">Kuis Selesai! 🎉</h2>
            
            <div className="bg-black/50 p-8 rounded-2xl mb-8">
              {!isAdmin && (
                <>
                  <p className="text-gray-400 text-lg mb-2">Skor Akhir Kamu</p>
                  <p className="text-7xl font-bold text-quiz-purple mb-6">{score}</p>
                </>
              )}
              <h3 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-4">Papan Peringkat (Klasemen)</h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {sortedPlayers.map(([name, data], idx) => (
                  <div key={idx} className={`flex justify-between items-center p-5 rounded-xl ${name === inputValue ? 'bg-quiz-purple/40 border border-quiz-purple' : 'bg-white/5 border border-white/10'}`}>
                    <span className="font-bold text-xl text-white">#{idx + 1} {name}</span>
                    <span className="font-bold text-2xl text-quiz-purple">{data.score} pts</span>
                  </div>
                ))}
              </div>
            </div>

            {isAdmin && (
               <div className="flex justify-center gap-4 mt-8">
                 <button onClick={showEvaluationByAdmin} className="bg-blue-500 hover:bg-blue-600 px-8 py-4 rounded-xl font-bold text-lg">Tampilkan Evaluasi Soal</button>
                 <button onClick={resetQuizByAdmin} className="bg-red-500 hover:bg-red-600 px-8 py-4 rounded-xl font-bold text-lg">Tutup & Reset Kuis</button>
               </div>
            )}
          </div>
        </div>
      );
    }

    if (currentPage === 'evaluation') {
      const sortedWrongStats = Object.entries(wrongStats)
        .sort((a, b) => b[1] - a[1])
        .filter(item => item[1] > 0);

      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-quiz-dark pb-16">
          <div className="w-full max-w-4xl bg-white/5 border border-blue-500/50 p-10 rounded-3xl">
            <h2 className="text-4xl font-bold mb-2 text-blue-400 text-center">Analisis Evaluasi Belajar</h2>
            <p className="text-gray-400 text-center mb-8">Daftar soal yang paling banyak dijawab salah atau tidak terjawab (Timeout)</p>
            
            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-4">
              {sortedWrongStats.length === 0 ? (
                 <p className="text-center text-green-400 font-bold text-2xl py-10">Luar Biasa! Semua siswa menjawab semua soal dengan benar!</p>
              ) : (
                sortedWrongStats.slice(0, 10).map(([qIndex, wrongCount], idx) => (
                  <div key={qIndex} className="bg-black/50 p-6 rounded-2xl border border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-red-500/20 text-red-400 font-bold px-4 py-2 rounded-bl-2xl">
                      Gagal: {wrongCount} Siswa
                    </div>
                    <h3 className="text-xl font-bold text-quiz-purple mb-2">Soal No. {parseInt(qIndex) + 1}</h3>
                    <p className="text-lg text-white pr-24">{questionsData[qIndex].question}</p>
                  </div>
                ))
              )}
            </div>

            {inputValue === 'admin123' && (
              <div className="mt-10 text-center">
                <button onClick={resetQuizByAdmin} className="bg-red-500 hover:bg-red-600 px-10 py-4 rounded-xl font-bold text-lg">Selesai & Reset Kuis</button>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // KEMBALIKAN HALAMAN + WATERMARK GLOBAL
  return (
    <div className="relative font-poppins">
      {renderPage()}
      
      {/* GLOBAL WATERMARK FOOTER */}
      <div className="fixed bottom-4 left-0 w-full text-center pointer-events-none z-50">
        <p className="text-white/30 text-[10px] md:text-xs font-light tracking-widest drop-shadow-md">
          DEVELOPED BY <span className="font-semibold text-white/50">AFZAAL MAWLA SYAMSHER ULHAQ</span> (24051130095)
        </p>
      </div>
    </div>
  );
}

export default App;