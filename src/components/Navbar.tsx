import { Clapperboard, Code2 } from 'lucide-react';

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center transform -rotate-6">
            <Clapperboard className="w-5 h-5 text-white" />
          </div>
          <span className="text-gray-900 font-black text-xl tracking-tight">ToonGenie AI</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="#" className="text-sm font-medium text-gray-600 hover:text-orange-500 transition-colors flex items-center gap-2">
            <Code2 className="w-4 h-4" />
            <span>View Source</span>
          </a>
        </div>
      </div>
    </nav>
  );
}