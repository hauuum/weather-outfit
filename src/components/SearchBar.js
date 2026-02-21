import React, { useState } from 'react';

const SearchBar = ({ onSearch }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    onSearch(input);
  };

  return (
    <form onSubmit={handleSubmit} className="flex-col sm:flex-row w-full flex justify-center gap-2">
      <input 
		type="text" 
		className="flex-auto w-full flex px-4 py-3 rounded-xl border-none ring-2 ring-gray-200 focus:ring-blue-500 outline-none transition-all shadow-sm placeholder:text-sm"
		placeholder="서울시 자치구를 입력해주세요 (예시: 강남구)"
		value={input}
		onChange={(e) => setInput(e.target.value)}
      />
      <button 
        type="submit" 
        className="b-submit justify-center sm:justify-start flex-shrink-0 flex items-center px-8 py-3 text-white font-bold rounded-xl active:scale-95 transition-all shadow-lg"
      >
        검색
      </button>
    </form>
  );
};

export default SearchBar;