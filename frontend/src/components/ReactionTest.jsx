import React, { useState } from 'react';
import ReactionPicker from './ReactionPicker';

const ReactionTest = () => {
  const [currentReaction, setCurrentReaction] = useState(null);
  const [reactionCounts, setReactionCounts] = useState({
    like: 5,
    love: 3,
    wow: 2,
    laugh: 1,
    sad: 0,
    angry: 0
  });

  const handleReaction = (reactionType) => {
    console.log('🎯 Reação recebida:', reactionType);
    setCurrentReaction(reactionType);
    
    // Simular atualização de contadores
    if (reactionType) {
      setReactionCounts(prev => ({
        ...prev,
        [reactionType]: (prev[reactionType] || 0) + 1
      }));
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Teste do Reaction Picker</h2>
        
        <div className="bg-gray-100 p-4 rounded-lg mb-4">
          <p className="text-sm text-gray-600 mb-2">
            <strong>Instruções:</strong>
          </p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• <strong>Click rápido:</strong> Like/Unlike</li>
            <li>• <strong>Segurar (300ms):</strong> Mostrar picker de reações</li>
          </ul>
        </div>

        <div className="flex items-center justify-center py-8">
          <ReactionPicker
            onReaction={handleReaction}
            currentReaction={currentReaction}
            reactionCounts={reactionCounts}
            className="text-2xl"
          />
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Estado Atual:</h3>
          <p className="text-sm text-blue-700">
            <strong>Reação atual:</strong> {currentReaction || 'Nenhuma'}
          </p>
          <p className="text-sm text-blue-700 mt-1">
            <strong>Contadores:</strong> {JSON.stringify(reactionCounts)}
          </p>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          <p>Abra o console do navegador para ver os logs de debug</p>
        </div>
      </div>
    </div>
  );
};

export default ReactionTest;
