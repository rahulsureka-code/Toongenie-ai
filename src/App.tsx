import React from 'react';
import { Navbar } from './components/Navbar';
import { Generator } from './components/Generator';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-orange-200">
      <Navbar />
      <main>
        <Generator />
      </main>
    </div>
  );
}