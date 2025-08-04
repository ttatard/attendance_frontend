import React, { useState } from 'react';

const NameDialog = ({ onSubmit, isOpen }) => {
  const [fullName, setFullName] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (fullName.trim()) {
      onSubmit(fullName);
    }
  };

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Enter Your Full Name</h2>
        
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your full name"
            className="w-full p-2 border border-gray-300 rounded mb-4"
            autoFocus
          />
          
          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
            disabled={!fullName.trim()}
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
};

export default NameDialog;