import React, { useState, useRef } from 'react';
import { Play } from 'lucide-react';

const VIDEO_POOL = [
  { id: 1, title: 'Pentagon UAP Report', videoId: 'PfSXkfV_mhA' },
  { id: 2, title: 'Navy Pilots UFO Encounter', videoId: 'ZBtMbBPzqHY' },
  { id: 3, title: 'Phoenix Lights Story', videoId: '2TumprpOwHY' },
  { id: 4, title: 'What We Know About UAPs', videoId: 'SpeSpA3e56A' },
  { id: 5, title: 'David Fravor Tic Tac Encounter', videoId: 'pWwwTSJwhmw' },
  { id: 6, title: 'David Grusch Hearing', videoId: 'FCEnaC4UqAE' },
  { id: 7, title: 'Avi Loeb on Interstellar Objects', videoId: 'ZrsVVGgANC8' },
  { id: 8, title: 'SiriusAnews: Latest UFO Update', videoId: 'j_f7EsS9_XU' }
];

export default function LiveMediaFooter({ onVideoSelect }) {
  const [videoData] = useState(VIDEO_POOL);
  const scrollRef = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const dragDistance = useRef(0);

  const onMouseDown = (e) => {
    if (!scrollRef.current) return;
    isDragging.current = true;
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeft.current = scrollRef.current.scrollLeft;
    dragDistance.current = 0;
  };

  const onMouseMove = (e) => {
    if (!isDragging.current || !scrollRef.current) return;
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    scrollRef.current.scrollLeft = scrollLeft.current - walk;
    dragDistance.current = Math.abs(x - startX.current);
  };

  const onMouseUpOrLeave = () => {
    isDragging.current = false;
  };

  const onCardMouseUp = (video) => {
    isDragging.current = false;
    if (dragDistance.current < 8) {
      if (typeof onVideoSelect === 'function') {
        onVideoSelect(video);
      }
    }
  };

  return (
    <div className="fixed bottom-0 left-0 w-full bg-slate-950/90 backdrop-blur-md border-t border-cyan-500/30 p-4 z-50 select-none">
      <div className="text-cyan-400 font-bold mb-2 px-2 flex items-center gap-2 text-xs uppercase tracking-wider">
        <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span> Live Media
      </div>

      <div
        ref={scrollRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUpOrLeave}
        onMouseLeave={onMouseUpOrLeave}
        className="flex gap-4 overflow-x-auto scrollbar-none cursor-grab active:cursor-grabbing pb-2"
        style={{ scrollBehavior: isDragging.current ? 'auto' : 'smooth' }}
      >
        {videoData.map((video) => (
          <div
            key={video.id}
            onMouseUp={() => onCardMouseUp(video)}
            className="flex-shrink-0 w-64 bg-slate-900/80 border border-slate-800 rounded-lg p-2 hover:border-cyan-500/50 transition-colors cursor-pointer"
          >
            <img
              src={`https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`}
              alt={video.title}
              className="w-full h-32 object-cover rounded-md pointer-events-none mb-2"
              onError={(e) => { e.target.src = "https://via.placeholder.com/320x180?text=No+Thumbnail"; }}
            />
            <p className="text-white text-xs font-medium truncate pointer-events-none">{video.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
