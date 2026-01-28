function InteractiveMap({ roomStatus, onToggle, isConfigured }) {
  // Use the uploaded file path (User must place this file in their public folder)
  // UPDATED: Renamed to simple web-safe format
  const mapImageUrl = "/phhs-map.jpg"; 
  
  // Quick-edit mode to let user click to place dots (simulated persistence for session)
  const [editMode, setEditMode] = useState(false);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-800">Interactive Floorplan</h3>
            <p className="text-xs text-slate-500">Click a room to check it off.</p>
          </div>
          <button 
            onClick={() => setEditMode(!editMode)}
            className={`text-xs px-3 py-1.5 rounded border transition-colors ${editMode ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-white border-slate-300'}`}
          >
            {editMode ? 'Finish Editing' : 'Edit Map Locations'}
          </button>
        </div>

        <div className="relative w-full bg-slate-100 overflow-hidden group">
          {/* Map Image Layer */}
          <img src={mapImageUrl} alt="School Map" className="w-full h-auto object-contain opacity-90" />
          
          {/* Render All Configured Dots */}
          {Object.entries(MAP_LOCATIONS).map(([label, coords]) => (
            <MapDot 
              key={label}
              x={coords.x} 
              y={coords.y} 
              label={label.replace("Room ", "").replace("Auditorium (PAC) | ", "").replace("Media Center | ", "")} 
              status={roomStatus[label]?.status} 
              onClick={() => onToggle(label)}
              // Make PAC dot larger
              size={label.includes("Auditorium") ? "large" : "normal"}
            />
          ))}

          {/* Edit Mode Helper */}
          {editMode && (
            <div 
              className="absolute inset-0 bg-blue-500/10 cursor-crosshair z-50"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                // Just log to alert for user to copy
                alert(`X: ${x.toFixed(1)}, Y: ${y.toFixed(1)}`);
              }}
            >
              <div className="absolute top-4 left-4 bg-white px-3 py-2 rounded shadow text-sm font-bold border border-blue-200">
                Click map to get X/Y coordinates
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}