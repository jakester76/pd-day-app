import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, onSnapshot, query, writeBatch, getDocs } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { 
  Users, Map as MapIcon, CheckCircle2, Circle, 
  RefreshCw, Clock, BookOpen, 
  ChevronDown, ChevronUp, Calendar, ClipboardList,
  AlertCircle
} from 'lucide-react';

/* ==========================================
  CONFIGURATION SECTION
  ==========================================
*/
const firebaseConfig = {
  apiKey: "AIzaSyCh8hUcjVLSCkYlDUm3DLROfBGannHtM90",
  authDomain: "pd-day-support.firebaseapp.com",
  projectId: "pd-day-support",
  storageBucket: "pd-day-support.firebasestorage.app",
  messagingSenderId: "385504098586",
  appId: "1:385504098586:web:aec2037f0cda82c0c5d4a3",
  measurementId: "G-50XFSKEREY"
};

// -- MAP COORDINATES --
const MAP_LOCATIONS = {
  "Auditorium (PAC) | Room 300": { x: 13.7, y: 26.8 },
  "Room 507": { x: 22.3, y: 19.3 },
  "Room 509": { x: 25.4, y: 19.3 },
  "Media Center | Room 100": { x: 26.6, y: 72.9 },
  "Band Room | 501": { x: 23.5, y: 42.8 },
  "Room 120": { x: 58.3, y: 72.1 },
  "Room 121": { x: 58.3, y: 65.8},
  "Room 122": { x: 61.1, y: 72.1 },
  "Room 123": { x: 61.1, y: 65.8 },
  "Room 124": { x: 63.8, y: 72.1 },
  "Room 125": { x: 63.8, y: 65.8 },
  "Room 127": { x: 66.3, y: 65.8 },
  "Room 131": { x: 71.7, y: 65.8 },
  "Room 311": { x: 63.7, y: 44.3 },
  "Room 312": { x: 63.7, y: 50.6 },
  "Room 313": { x: 69.3, y: 44.3 },
  "Room 314": { x: 69.3, y: 50.6 },
  "Room 128": { x: 69.1, y: 72.1 },
  "Room 130": { x: 71.7, y: 72.1 },
  "Room 132": { x: 74.5, y: 72.1 },
  "Room 134C": { x: 81.4, y: 82.4 },
  "Room 134D": { x: 85.4, y: 82.4 },
  "Room 135": { x: 77.2, y: 65.8 },
  "Room 137": { x: 81.8, y: 64.8 },
  "Room 139": { x: 85.2, y: 64.8 },
  "Room 200": { x: 81.8, y: 60.6 },
  "Room 204": { x: 81.8, y: 53.8 },
  "Room 206": { x: 81.8, y: 50.1 },
  "Room 317": { x: 75.8, y: 44.3 },
  "Room 318": { x: 75.8, y: 50.8 },
  "Room 319": { x: 81.2, y: 44.3 },
  "Room 302": { x: 43.8, y: 50.6 },
  "Room 304": { x: 47.6, y: 50.6 },
  "Room 306": { x: 50.9, y: 50.6 },
  "Room 401": { x: 52.9, y: 44.0 },
  "Room 402": { x: 60.6, y: 33.9 },
  "Room 403": { x: 52.9, y: 39.1 },
};

// -- DATA CONSTANTS --
const EVENT_DATE_STR = "2026-02-17"; 

const SCHEDULE = [
  { time: "7:30 - 8:15", label: "Morning Setup", type: "transition", task: "Contact presenters & confirm readiness." },
  { time: "8:15 - 9:15", label: "Keynote / Breakout A", type: "session", task: "Check rooms every 20 mins." },
  { time: "9:15 - 9:30", label: "Break / Transition", type: "transition", task: "Contact presenters & confirm readiness." },
  { time: "9:30 - 10:30", label: "2nd Keynote / Breakout B", type: "session", task: "Check rooms every 20 mins." },
  { time: "10:30 - 10:45", label: "Break / Transition", type: "transition", task: "Contact presenters & confirm readiness." },
  { time: "10:45 - 11:45", label: "Breakout C", type: "lunch-a", note: "LUNCH A", task: "Check rooms every 20 mins." },
  { time: "11:45 - 12:00", label: "Break / Transition", type: "transition", task: "Contact presenters & confirm readiness." },
  { time: "12:00 - 1:00", label: "Breakout D", type: "lunch-b", note: "LUNCH B", task: "Check rooms every 20 mins." },
  { time: "1:00 - 1:15", label: "Break / Transition", type: "transition", task: "Contact presenters & confirm readiness." },
  { time: "1:15 - 2:15", label: "PM Keynote / Breakout E", type: "lunch-c", note: "LUNCH C", task: "Check rooms every 20 mins." },
  { time: "2:15 - 2:30", label: "Break / Transition", type: "transition", task: "Contact presenters & confirm readiness." },
  { time: "2:30 - 3:30", label: "PM Keynote / Breakout F", type: "session", task: "Check rooms every 20 mins." },
  { time: "3:30 - 4:30", label: "Event Breakdown", type: "teardown", task: "Collect supplies, pack up, return equipment to RESA." },
];

const TEAMS = [
  {
    id: "helpdesk",
    name: "Helpdesk | Room 117",
    color: "red",
    members: [
      { name: "Benjamin A.", lunch: "A" },
      { name: "Steve R.", lunch: "B" },
      { name: "Brandon H.", lunch: "C", note: "Presenting AM" }
    ],
    rooms: [] 
  },
  {
    id: "mini_hd_1_pac",
    name: "Mini Help Desk 1 + PAC Block",
    color: "amber",
    members: [
      { name: "Keenan S.", lunch: "A" },
      { name: "Eric N.", lunch: "B" },
      { name: "Phil H.", lunch: "C" }
    ],
    rooms: ["Auditorium (PAC) | Room 100A", "Room 507", "Room 509", "Media Center | Room 100", "Band Room | 501"]
  },
  {
    id: "mini_hd_2_block4",
    name: "Mini Help Desk 2 + Block 4",
    color: "amber",
    members: [
      { name: "Austin N.", lunch: "A" },
      { name: "Kyle K.", lunch: "A" },
      { name: "Seth E.", lunch: "B" }
    ],
    rooms: ["Room 311", "Room 312", "Room 313", "Room 314"]
  },
  {
    id: "block1",
    name: "Block 1",
    color: "blue",
    members: [
      { name: "Alexandria M.", lunch: "A" },
      { name: "Mark W.", lunch: "A" },
      { name: "Kurt G.", lunch: "B" },
      { name: "Orville C.", lunch: "B" }
    ],
    rooms: ["Room 120", "Room 121", "Room 122", "Room 123", "Room 124", "Room 125", "Room 127", "Room 131"]
  },
  {
    id: "block2",
    name: "Block 2", 
    color: "blue",
    members: [
      { name: "Alex V.", lunch: "A" },
      { name: "Valeena L.", lunch: "A" },
      { name: "Brennen B.", lunch: "B" },
      { name: "Harold P.", lunch: "B" }
    ],
    rooms: ["Room 128", "Room 130", "Room 132", "Room 134C", "Room 134D", "Room 135", "Room 137", "Room 139"]
  },
  {
    id: "block3",
    name: "Block 3",
    color: "blue",
    members: [
      { name: "Henry H.", lunch: "A" },
      { name: "TJ J.", lunch: "A" },
      { name: "Joseph H.", lunch: "B" },
      { name: "Jacob O.", lunch: "B", note: "Float Blocks 3,4,5 (10:45-11:45 Only)" }
    ],
    rooms: ["Room 200", "Room 204", "Room 206", "Room 317", "Room 318", "Room 319"]
  },
  {
    id: "block5",
    name: "Block 5",
    color: "blue",
    members: [
      { name: "Brooke P.", lunch: "A" },
      { name: "Michael D.", lunch: "A" },
      { name: "John K.", lunch: "B" }
    ],
    rooms: ["Room 302", "Room 304", "Room 306", "Room 401", "Room 402", "Room 403"]
  }
];

// -- GLOBAL HELPERS --

// Make Date Object for Event Day
const makeDate = (timeStr) => {
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr);
  if (h < 5) h += 12; // Handle PM hours (1-4 PM)
  const d = new Date(EVENT_DATE_STR);
  d.setHours(h, parseInt(mStr), 0);
  return d;
};

// Calculate active slot based on Real Date Time
const getGlobalTimeStatus = (now) => {
  let activeSlot = null;
  let targetTime = null;
  let timerLabel = "";

  // 1. Find active slot
  for (const slot of SCHEDULE) {
      const [startStr, endStr] = slot.time.split(' - ');
      const start = makeDate(startStr);
      const end = makeDate(endStr);
      if (now >= start && now < end) {
          activeSlot = { ...slot, start, end };
          break;
      }
  }

  // 2. Determine Countdown
  if (activeSlot) {
      if (activeSlot.type === 'session' || activeSlot.note) {
          // IN SESSION: Count to END of session
          targetTime = activeSlot.end;
          timerLabel = `Session Ends In:`;
      } else {
          // IN TRANSITION: Count to Next Session Start
          targetTime = activeSlot.end; // Transition end is next session start
          timerLabel = `Next Session Starts In:`;
      }
  } else {
      // Check if before first event
      const firstStart = makeDate(SCHEDULE[0].time.split(' - ')[0]);
      if (now < firstStart) {
          targetTime = firstStart;
          timerLabel = "Event Starts In:";
      }
  }

  // Calculate remaining ms
  let remainingMs = 0;
  if (targetTime) {
      remainingMs = targetTime - now;
  }

  return { activeSlot, remainingMs, timerLabel };
};

// -- APP COMPONENT --

export default function App() {
  const [view, setView] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [roomStatus, setRoomStatus] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Simulation & Time State
  const [currentTime, setCurrentTime] = useState(new Date());
  const [simulatedTimeStr, setSimulatedTimeStr] = useState("LIVE"); 
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(false);
  
  // -- FIREBASE INIT --
  const [db, setDb] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
        if (simulatedTimeStr === "LIVE") {
            setCurrentTime(new Date());
        }
    }, 1000); 

    if (firebaseConfig.apiKey !== "YOUR_API_KEY_HERE") {
      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);
      const database = getFirestore(app);
      setDb(database);

      signInAnonymously(auth).catch(console.error);
      onAuthStateChanged(auth, (u) => setUser(u));

      // Live Room Status
      const qStatus = query(collection(database, "roomchecks"));
      const unsubStatus = onSnapshot(qStatus, (snapshot) => {
        const data = {};
        snapshot.forEach((doc) => {
          data[doc.id] = doc.data();
        });
        setRoomStatus(data);
        setLoading(false);
      });

      return () => {
        unsubStatus();
        clearInterval(timer);
      };
    } else {
      setLoading(false);
      clearInterval(timer);
    }
  }, [simulatedTimeStr]);

  // -- ACTIONS --

  const toggleRoom = async (roomName) => {
    if (!db) return alert("Please configure Firebase keys first.");
    
    const currentData = roomStatus[roomName] || {};
    const isChecked = currentData.status === 'checked';
    const newStatus = isChecked ? 'unchecked' : 'checked';
    
    setRoomStatus(prev => ({
      ...prev, 
      [roomName]: { ...currentData, status: newStatus, timestamp: Date.now() }
    }));

    await setDoc(doc(db, "roomchecks", roomName), {
      status: newStatus,
      timestamp: Date.now(),
      lastUpdatedBy: user ? user.uid : 'anon'
    });
  };

  const resetAllRooms = async () => {
    if (!db) return alert("Firebase not configured.");
    
    if (!window.confirm("⚠️ RESET BOARD?\n\nThis will clear all checks for the next session.\n\nProceed?")) {
      return;
    }

    try {
        const batch = writeBatch(db);
        const querySnapshot = await getDocs(collection(db, "roomchecks"));
        querySnapshot.forEach((docSnap) => {
            // Reset status only
            batch.update(doc(db, "roomchecks", docSnap.id), { 
                status: 'unchecked',
                activeNeeds: [], // Clear any legacy fields
                activeLoans: [],
                flags: []
            });
        });
        
        await batch.commit();
    } catch (e) {
        console.error("Error resetting:", e);
        alert("Error resetting board.");
    }
  };

  // -- SIMULATION LOGIC --
  const handleSimulationChange = (e) => {
      const val = e.target.value;
      setSimulatedTimeStr(val);
      
      if (val === "LIVE") {
          setCurrentTime(new Date());
      } else {
          const [hours, minutes] = val.split(':');
          const simDate = new Date(EVENT_DATE_STR);
          simDate.setHours(parseInt(hours), parseInt(minutes), 0);
          setCurrentTime(simDate);
      }
  };

  // Get status for render
  const { activeSlot, remainingMs, timerLabel } = getGlobalTimeStatus(currentTime);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      
      {/* HEADER */}
      <header className="bg-slate-900 text-white p-3 sticky top-0 z-50 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold flex items-center gap-2">
              PD Day IT
              <span className={`text-[10px] px-2 py-0.5 rounded font-normal border ${simulatedTimeStr !== "LIVE" ? "bg-amber-600 border-amber-400 text-white" : "bg-slate-700 border-slate-600 text-slate-300"}`}>
                {currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            </h1>
            
            {/* Hidden Logic for Simulation (Only visible if you know where to look or uncomment) */}
            {/* <div className="hidden sm:block">
               <select value={simulatedTimeStr} onChange={handleSimulationChange} className="bg-slate-800 text-xs border border-slate-700 rounded px-1">
                  <option value="LIVE">Live</option>
                  <option value="08:30">08:30</option>
                  <option value="10:40">10:40</option>
               </select>
            </div> */}
          </div>
          
          <div className="flex gap-1 w-full md:w-auto overflow-x-auto no-scrollbar">
            <button 
              onClick={() => setView('dashboard')}
              className={`flex-1 px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors flex items-center justify-center gap-1 ${view === 'dashboard' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            >
              <Users size={14} /> Teams
            </button>
            <button 
              onClick={() => setView('map')}
              className={`flex-1 px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors flex items-center justify-center gap-1 ${view === 'map' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            >
              <MapIcon size={14} /> Map
            </button>
            <button 
              onClick={() => setView('playbook')}
              className={`flex-1 px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors flex items-center justify-center gap-1 ${view === 'playbook' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            >
              <BookOpen size={14} /> Book
            </button>
            <button 
              onClick={resetAllRooms}
              className="px-3 py-1.5 rounded text-xs font-medium bg-red-900/50 text-red-200 border border-red-800 hover:bg-red-800 transition-colors"
              title="Reset Board"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* COMPACT TIMELINE (Expandable) */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-[60px] z-40">
        <div 
            className={`max-w-6xl mx-auto px-4 py-2 cursor-pointer hover:bg-slate-50 transition-colors ${activeSlot?.type === 'transition' ? 'bg-blue-50' : ''}`}
            onClick={() => setIsTimelineExpanded(!isTimelineExpanded)}
        >
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`p-1.5 rounded-full ${activeSlot?.type === 'transition' ? 'bg-blue-200 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                        {activeSlot?.type === 'transition' ? <RefreshCw size={16} className="animate-spin-slow"/> : <Clock size={16}/>}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Current Status</span>
                        <span className="text-sm font-bold text-slate-800 truncate">
                            {activeSlot ? activeSlot.label : "Event Offline"}
                        </span>
                    </div>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="hidden sm:inline">{isTimelineExpanded ? "Hide Schedule" : "View Schedule"}</span>
                    {isTimelineExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                </div>
            </div>
            
            {/* Active Task (Visible when collapsed) */}
            {!isTimelineExpanded && activeSlot && (
                <div className="mt-1 ml-10 text-xs text-blue-600 font-medium flex items-center gap-1">
                    <ClipboardList size={12}/> {activeSlot.task}
                </div>
            )}
        </div>

        {/* Expanded Timeline View */}
        {isTimelineExpanded && (
            <div className="max-w-6xl mx-auto border-t border-slate-100 max-h-[60vh] overflow-y-auto bg-slate-50 p-4">
                <div className="grid grid-cols-1 divide-y divide-slate-200 bg-white rounded-lg border border-slate-200">
                    {SCHEDULE.map((slot, i) => {
                        // Simple active check for list
                        const isActive = activeSlot && activeSlot.time === slot.time;
                        return (
                            <div key={i} className={`p-3 ${isActive ? 'bg-blue-50' : ''}`}>
                                <div className="flex justify-between">
                                    <span className="text-xs font-bold text-slate-900">{slot.time}</span>
                                    {slot.note && <span className="text-[10px] bg-slate-200 px-1 rounded">{slot.note}</span>}
                                </div>
                                <div className="font-medium text-sm text-slate-800">{slot.label}</div>
                                <div className="text-xs text-slate-500 mt-1">{slot.task}</div>
                            </div>
                        )
                    })}
                </div>
            </div>
        )}
      </div>

      <main className="max-w-6xl mx-auto p-4">
        
        {/* DASHBOARD VIEW */}
        {view === 'dashboard' && (
          <div className="animate-in fade-in duration-300">
            {/* TEAMS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {TEAMS.map((team) => (
                <TeamCard 
                  key={team.id} 
                  team={team} 
                  roomStatus={roomStatus} 
                  onToggleRoom={toggleRoom} 
                />
              ))}
            </div>

            {/* SPECIAL ASSIGNMENTS */}
            <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-bold text-slate-800 mb-4">Off-Site & Dispatch</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <SpecialCard name="Isabelle V." task="@McKinley (covering parapro PD support)" />
                <SpecialCard name="Kevin S." task="@RESA (dispatch for RESA & NONP as needed)" />
                <SpecialCard name="Matthew C." task="@Croslex + dispatch to Capac as needed" />
                <SpecialCard name="Nick M." task="@Marysville + dispatch to Capac as needed" />
                <SpecialCard name="Nathaneal R." task="@RESA (dispatch for MUN as needed)" />
                <SpecialCard name="James M. & Justin R." task="@RESA (supporting anything & everything)" />
              </div>
            </div>
          </div>
        )}

        {/* MAP VIEW */}
        {view === 'map' && (
          <>
            {/* COUNTDOWN CLOCK OVERLAY */}
            {remainingMs > 0 && (
                <CountdownClock ms={remainingMs} label={timerLabel} />
            )}
            
            <InteractiveMap 
                roomStatus={roomStatus} 
                isConfigured={!!db}
            />
          </>
        )}

        {/* PLAYBOOK VIEW */}
        {view === 'playbook' && (
          <PlaybookView />
        )}

      </main>
    </div>
  );
}

// -- SUB COMPONENTS --

function CountdownClock({ ms, label }) {
    if (ms < 0) return null;

    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    // Color logic
    let colorClass = "bg-blue-600";
    if (hours === 0 && minutes < 5) colorClass = "bg-red-600 animate-pulse";
    else if (hours === 0 && minutes < 15) colorClass = "bg-amber-500";

    return (
        <div className="mb-6 rounded-xl overflow-hidden shadow-lg border border-slate-200 bg-white">
            <div className={`${colorClass} text-white p-2 text-center text-xs font-bold uppercase tracking-wider`}>
                {label}
            </div>
            <div className="p-4 flex items-center justify-center gap-4">
                <div className="text-center">
                    <div className="text-4xl font-black text-slate-800 tabular-nums">
                        {hours > 0 && (
                            <span>{hours}<span className="text-slate-300 text-2xl mx-1">:</span></span>
                        )}
                        {minutes.toString().padStart(2, '0')}
                        <span className="text-slate-300 text-2xl mx-1">:</span>
                        {seconds.toString().padStart(2, '0')}
                    </div>
                </div>
            </div>
        </div>
    );
}

function TeamCard({ team, roomStatus, onToggleRoom }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden border-t-4 transition-all ${getTeamColor(team.color)}`}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-white hover:bg-slate-50 transition-colors text-left"
      >
        <h3 className="font-bold text-lg text-slate-800">{team.name}</h3>
        <div className="text-slate-400">
            {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>
      
      {isOpen && (
        <div className="animate-in slide-in-from-top-2 duration-200">
            {/* ROOM CHECKLIST */}
            {team.rooms.length > 0 && (
                <div className="bg-slate-50 px-5 py-3 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Room Status</p>
                    <div className="flex flex-wrap gap-2">
                    {team.rooms.map(room => {
                        const roomData = roomStatus[room] || {};
                        const isChecked = roomData.status === 'checked';
                        
                        // Simple Red/Green Style
                        let btnStyle = 'bg-white border-red-300 text-slate-800 hover:bg-red-50'; // Unchecked
                        let mainIcon = <Circle size={12} className="text-red-500" />;
                        
                        if (isChecked) {
                            btnStyle = 'bg-green-100 border-green-200 text-green-800';
                            mainIcon = <CheckCircle2 size={12} />;
                        }

                        return (
                            <button
                                key={room}
                                onClick={() => onToggleRoom(room)}
                                className={`
                                    text-xs px-2 py-1 rounded-md border flex items-center gap-1.5 transition-all
                                    ${btnStyle}
                                `}
                            >
                                {mainIcon}
                                <span className="font-bold">{room.replace("Room ", "")}</span>
                            </button>
                        )
                    })}
                    </div>
                </div>
            )}

            {/* MEMBER LIST */}
            <table className="w-full text-sm text-left">
            <thead className="bg-white text-xs text-slate-400 uppercase">
                <tr>
                <th className="px-5 py-2 font-medium">Name</th>
                <th className="px-5 py-2 font-medium w-20">Lunch</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
                {team.members.map((member, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3 text-slate-700">
                    <div className="font-medium">{member.name}</div>
                    {member.note && <div className="text-[10px] text-slate-400">{member.note}</div>}
                    </td>
                    <td className="px-5 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${getLunchBadge(member.lunch)}`}>
                        Lunch {member.lunch}
                    </span>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      )}
    </div>
  );
}

function PlaybookView() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Title Header */}
        <div className="bg-slate-900 text-white p-6 md:p-8">
          <div className="text-blue-400 text-sm font-bold uppercase tracking-wider mb-2">PD Day IT Support Playbook</div>
          <h2 className="text-3xl md:text-4xl font-bold mb-2">Educate. Inform. Inspire.</h2>
          <p className="text-slate-400 text-lg">2026 Operational Expectations & Support Strategy</p>
        </div>

        <div className="p-6 md:p-8 space-y-10">
          
          <section>
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Users className="text-blue-600" size={24}/>
              Support Model
            </h3>
            <div className="bg-slate-50 rounded-lg p-5 border border-slate-100">
              <p className="mb-3 font-medium text-slate-700">IT support operates in block-based teams.</p>
              <ul className="space-y-2 text-slate-600 list-disc pl-5">
                <li>Your team is responsible for your assigned block of rooms.</li>
                <li>Ensure presenter readiness before every session.</li>
                <li>Conduct ongoing room checks throughout sessions (approx every 20 mins).</li>
              </ul>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Clock className="text-blue-600" size={24}/>
              Daily Timeline Expectations
            </h3>
            
            <div className="space-y-6">
              <div className="relative pl-6 border-l-2 border-slate-200">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-200"></div>
                <h4 className="font-bold text-slate-900 mb-2">Start of Day</h4>
                <ul className="space-y-1 text-slate-600 text-sm">
                  <li>Group up with your assigned block team.</li>
                  <li>Decide who is covering which specific rooms.</li>
                  <li>Review assigned lunch schedules and coverage plans.</li>
                  <li className="font-medium text-blue-700">Be in your blocks before the first session begins.</li>
                </ul>
              </div>

              <div className="relative pl-6 border-l-2 border-slate-200">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-200"></div>
                <h4 className="font-bold text-slate-900 mb-2">Before Each Session</h4>
                <div className="text-sm text-slate-600 mb-2">Visit each classroom and verify:</div>
                <ul className="space-y-1 text-slate-600 text-sm list-disc pl-4">
                  <li>Device is connected</li>
                  <li>Display and audio are working</li>
                  <li>Wi-Fi is connected and stable</li>
                </ul>
                <div className="mt-2 text-xs font-bold text-slate-500 uppercase tracking-wide">Goal: No presenter starts with unresolved issues.</div>
              </div>

              <div className="relative pl-6 border-l-2 border-slate-200">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-200"></div>
                <h4 className="font-bold text-slate-900 mb-2">During Sessions</h4>
                <p className="text-sm text-slate-600 mb-2">Once all rooms are verified, you may fall back to Helpdesk (Rm 117), but you remain responsible for your block.</p>
                <p className="text-sm text-slate-600 italic">Continue checks every ~20 minutes.</p>
              </div>

              <div className="relative pl-6 border-l-2 border-slate-200">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-200"></div>
                <h4 className="font-bold text-slate-900 mb-2">Breaks & Transitions</h4>
                <p className="text-sm text-slate-600 mb-2">Return to your block <strong>just before</strong> the break starts.</p>
                <ul className="space-y-1 text-slate-600 text-sm list-disc pl-4">
                  <li>Be visible as presenters exit/enter.</li>
                  <li>Catch transition issues immediately.</li>
                  <li>Ensure rooms are fully ready before the next start time.</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <AlertCircle className="text-blue-600" size={24}/>
              Support & Escalation
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <h4 className="font-bold text-slate-900 mb-2">When to Escalate</h4>
                <ul className="text-sm text-slate-600 space-y-1 list-disc pl-4">
                  <li>Issue you cannot resolve quickly</li>
                  <li>Need for additional equipment</li>
                  <li>Situation requires more hands</li>
                </ul>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <h4 className="font-bold text-slate-900 mb-2">How to Escalate</h4>
                <p className="text-sm text-slate-600 mb-2">Use <strong>Google Chat</strong> to request support.</p>
                <p className="text-sm text-slate-600">Presenter support &gt; Helpdesk walk-ups.</p>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <h4 className="font-bold text-blue-900 mb-1 flex items-center gap-2">
                <Users size={18}/>
                Flexibility Expectations
              </h4>
              <p className="text-sm text-blue-800">
                Flex where possible to assist nearby rooms or other blocks, but always return to your assigned block or the Helpdesk when cleared.
              </p>
            </div>
          </section>

          {/* KEY PRINCIPLE FOOTER */}
          <div className="bg-slate-900 text-white p-6 rounded-xl text-center">
            <div className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-3">Key Principle</div>
            <h3 className="text-xl md:text-2xl font-bold mb-2">Be visible, calm, and proactive.</h3>
            <p className="text-slate-400">If something doesn’t fit the plan, escalate rather than improvising alone.</p>
          </div>

        </div>
      </div>
    </div>
  );
}

function SpecialCard({ name, task }) {
  return (
    <div className="p-3 border border-slate-100 rounded-lg bg-slate-50">
      <div className="font-medium text-slate-900 text-sm">{name}</div>
      <div className="text-xs text-slate-500">{task}</div>
    </div>
  );
}

function InteractiveMap({ roomStatus, isConfigured }) {
  // Use the uploaded file path (User must place this file in their public folder)
  const mapImageUrl = "/phhs-map.jpg";
  
  // Quick-edit mode to let user click to place dots (simulated persistence for session)
  const [editMode, setEditMode] = useState(false);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-800">Interactive Floorplan</h3>
            <p className="text-xs text-slate-500">View current room status (Read Only)</p>
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
          {Object.entries(MAP_LOCATIONS).map(([label, coords]) => {
            let displayLabel = label.replace("Room ", "").replace("Auditorium (PAC) | ", "").replace("Media Center | ", "").replace("Band Room | ", "");
            
            // Custom label overrides
            if (label.includes("Auditorium")) displayLabel = "PAC";
            if (label.includes("Media Center")) displayLabel = "Media";
            if (label.includes("Band Room")) displayLabel = "501";

            const roomData = roomStatus[label] || {};

            return (
              <MapDot 
                key={label}
                x={coords.x} 
                y={coords.y} 
                label={displayLabel} 
                status={roomData.status}
                // Removed onClick={onToggle} to make it read-only
                
                // Make PAC/Media larger squares
                size={label.includes("Auditorium") || label.includes("Media") ? "square" : "normal"}
              />
            );
          })}

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

function MapDot({ x, y, label, status, onClick, size }) {
  const isChecked = status === 'checked';
  return (
    <button
      onClick={onClick}
      className={`
        absolute transform -translate-x-1/2 -translate-y-1/2 
        border-[3px] shadow-sm
        flex items-center justify-center font-black z-20 overflow-hidden tracking-tighter
        ${size === 'large' ? 'w-20 h-12 rounded-xl text-xs' : 'w-10 h-10 rounded-full text-xs'}
        ${isChecked 
          ? 'bg-green-600 border-green-800 text-white shadow-green-900/20' 
          : 'bg-white border-red-600 text-red-700 shadow-xl shadow-red-600/40'
        }
      `}
      style={{ left: `${x}%`, top: `${y}%` }}
      title={label}
    >
      {/* Logic to show label always, even when checked. No icons. */}
      {label.substring(0, 5)}
    </button>
  );
}

// Helpers for the timeline bg colors
function getSlotBg(type) {
  if (type === 'transition') return "bg-blue-50/50 border-l-4 border-l-blue-400"; // New Transition Style
  if (type === 'teardown') return "bg-slate-100 border-l-4 border-l-slate-400"; // Breakdown Style
  if (type === 'lunch-a') return "bg-green-50/50";
  if (type === 'lunch-b') return "bg-amber-50/50";
  if (type === 'lunch-c') return "bg-purple-50/50";
  return "";
}

function getLunchBadgeBadge(type) {
  if (type === 'lunch-a') return "bg-green-100 text-green-800";
  if (type === 'lunch-b') return "bg-amber-100 text-amber-800";
  if (type === 'lunch-c') return "bg-purple-100 text-purple-800";
  return "";
}

function getLunchBadge(type) {
  if (type === 'A') return "bg-green-100 text-green-800";
  if (type === 'B') return "bg-amber-100 text-amber-800";
  if (type === 'C') return "bg-purple-100 text-purple-800";
  return "bg-gray-100 text-gray-800";
}

function getTeamColor(color) {
  if (color === 'red') return "border-t-red-500";
  if (color === 'amber') return "border-t-amber-500";
  return "border-t-blue-500";
}