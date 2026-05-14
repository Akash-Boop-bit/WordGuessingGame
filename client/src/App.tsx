import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GameState, 
  ClientToServerEvents, 
  ServerToClientEvents, 
  Player 
} from '@shared/types';
import { User, Users, Clock, Send, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io('http://localhost:3001');

export default function App() {
  const [name, setName] = useState('');
  const [joined, setJoined] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [answer, setAnswer] = useState('');

  useEffect(() => {
    socket.on('gameStateUpdate', (state) => {
      setGameState(state);
    });

    return () => {
      socket.off('gameStateUpdate');
    };
  }, []);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      socket.emit('joinRoom', name);
      setJoined(true);
    }
  };

  const me = gameState?.players.find(p => p.id === socket.id);

  if (!joined) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-stars">
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="glass p-8 rounded-2xl w-full max-w-md glow-cyan"
        >
          <h1 className="text-4xl font-bold text-center mb-8 text-neon-cyan tracking-tighter uppercase italic">
            Imposter Word Game
          </h1>
          <form onSubmit={handleJoin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 opacity-70">Pilot Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-space-800 border border-white border-opacity-20 rounded-lg p-3 focus:outline-none focus:border-neon-cyan transition-colors"
                placeholder="Enter your name..."
                maxLength={12}
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-neon-cyan text-space-900 font-bold py-3 rounded-lg hover:bg-opacity-80 transition-all uppercase tracking-widest"
            >
              Join Crew
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  if (!gameState) return <div className="flex items-center justify-center min-h-screen">Connecting...</div>;

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto flex flex-col bg-stars">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 glass p-4 rounded-xl">
        <div className="flex items-center gap-2">
          <Clock className="text-neon-cyan" />
          <span className="text-2xl font-mono">{gameState.timer}s</span>
        </div>
        <div className="text-sm opacity-50 uppercase tracking-widest font-bold">
          Phase: {gameState.phase}
        </div>
        <div className="flex items-center gap-2">
          <Users className="text-neon-cyan" />
          <span>{gameState.players.length}/8</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {gameState.phase === 'lobby' && (
          <motion.div 
            key="lobby"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {gameState.players.map(player => (
                <div key={player.id} className="glass p-4 rounded-xl flex items-center justify-between border-l-4" style={{ borderColor: player.avatarColor }}>
                  <div className="flex items-center gap-3">
                    <User style={{ color: player.avatarColor }} />
                    <span className="font-bold">{player.name} {player.id === socket.id && "(You)"}</span>
                  </div>
                  {player.isReady ? <CheckCircle className="text-green-500 w-5 h-5" /> : <div className="w-5 h-5 rounded-full border border-white opacity-20" />}
                </div>
              ))}
            </div>
            
            <div className="flex justify-center mt-12">
              <button 
                onClick={() => socket.emit('toggleReady')}
                className={`px-12 py-4 rounded-full font-bold text-xl transition-all ${
                  me?.isReady 
                  ? 'bg-green-500 text-white' 
                  : 'bg-neon-cyan text-space-900 glow-cyan'
                }`}
              >
                {me?.isReady ? 'READY!' : 'READY UP'}
              </button>
            </div>
            {gameState.players.length < 4 && (
              <p className="text-center mt-4 opacity-50 italic">Waiting for at least 4 players...</p>
            )}
          </motion.div>
        )}

        {gameState.phase === 'answering' && (
          <motion.div 
            key="answering"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto text-center"
          >
            <h2 className="text-2xl mb-2 opacity-50 uppercase tracking-widest">The Theme is {gameState.currentTheme?.theme}</h2>
            <p className="text-3xl font-bold mb-12">
              {me?.role === 'imposter' ? gameState.currentTheme?.imposterQuestion : gameState.currentTheme?.innocentQuestion}
            </p>

            {me?.answer ? (
              <div className="glass p-8 rounded-2xl glow-cyan text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <p className="text-xl">Answer Transmitted: <span className="text-neon-cyan font-bold uppercase">{me.answer}</span></p>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); socket.emit('submitAnswer', answer); setAnswer(''); }} className="w-full flex gap-2">
                <input 
                  autoFocus
                  type="text"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="flex-1 bg-space-800 border border-white border-opacity-20 rounded-lg p-4 text-xl focus:outline-none focus:border-neon-cyan"
                  placeholder="Type your one-word answer..."
                />
                <button className="bg-neon-cyan text-space-900 p-4 rounded-lg"><Send /></button>
              </form>
            )}
          </motion.div>
        )}

        {gameState.phase === 'reveal' && (
          <motion.div 
            key="reveal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {gameState.players.map(player => (
              <div key={player.id} className="glass p-6 rounded-xl text-center border-t-4" style={{ borderColor: player.avatarColor }}>
                <p className="text-sm opacity-50 mb-2 uppercase">{player.name}</p>
                <p className="text-2xl font-bold uppercase text-neon-cyan tracking-wider">{player.answer || '???'}</p>
              </div>
            ))}
          </motion.div>
        )}

        {gameState.phase === 'voting' && (
          <motion.div 
            key="voting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col"
          >
            <h2 className="text-3xl font-bold text-center mb-12 text-neon-red">VOTE OUT THE IMPOSTER</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {gameState.players.map(player => (
                <button
                  key={player.id}
                  disabled={!!me?.vote || player.id === socket.id}
                  onClick={() => socket.emit('submitVote', player.id)}
                  className={`glass p-6 rounded-xl text-center transition-all flex flex-col items-center gap-4 ${
                    me?.vote === player.id ? 'ring-4 ring-neon-red scale-105' : 'hover:bg-opacity-10'
                  } ${player.id === socket.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: player.avatarColor }}>
                    <User size={32} />
                  </div>
                  <span className="font-bold">{player.name}</span>
                  {me?.vote === player.id && <AlertTriangle className="text-neon-red" />}
                  {gameState.players.filter(p => p.vote === player.id).length > 0 && (
                    <div className="flex gap-1">
                      {gameState.players.filter(p => p.vote === player.id).map(voter => (
                        <div key={voter.id} className="w-3 h-3 rounded-full" style={{ backgroundColor: voter.avatarColor }} />
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {gameState.phase === 'results' && (
          <motion.div 
            key="results"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center text-center"
          >
            <div className={`text-6xl font-black mb-8 uppercase italic tracking-tighter ${
              gameState.winner === 'innocent' ? 'text-green-500' : 'text-neon-red'
            }`}>
              {gameState.winner === 'innocent' ? 'Imposter Defeated' : 'Imposter Won'}
            </div>

            <div className="glass p-8 rounded-2xl max-w-lg w-full mb-12">
              {gameState.votedOutPlayerId ? (
                <p className="text-xl mb-4">
                  <span className="font-bold text-neon-cyan">
                    {gameState.players.find(p => p.id === gameState.votedOutPlayerId)?.name}
                  </span> was voted out.
                </p>
              ) : (
                <p className="text-xl mb-4">No one was voted out.</p>
              )}
              
              <div className="space-y-4">
                <div className="flex justify-between border-b border-white border-opacity-10 pb-2">
                  <span>Theme:</span>
                  <span className="font-bold text-neon-cyan">{gameState.currentTheme?.theme}</span>
                </div>
                <div className="text-left space-y-2">
                  <p className="text-sm opacity-50">Innocent Question: {gameState.currentTheme?.innocentQuestion}</p>
                  <p className="text-sm opacity-50">Imposter Question: {gameState.currentTheme?.imposterQuestion}</p>
                </div>
                <div className="pt-4 border-t border-white border-opacity-10">
                  <p className="text-sm opacity-50 uppercase mb-2">The Imposter Was</p>
                  <p className="text-2xl font-bold text-neon-red uppercase">
                    {gameState.players.find(p => p.role === 'imposter')?.name}
                  </p>
                </div>
              </div>
            </div>

            {me?.isHost && (
              <button 
                onClick={() => socket.emit('playAgain')}
                className="flex items-center gap-2 bg-neon-cyan text-space-900 px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform"
              >
                <RefreshCw size={20} />
                PLAY AGAIN
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
