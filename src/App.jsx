import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, onSnapshot, query, writeBatch, getDocs } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { 
  Users, Map as MapIcon, CheckCircle2, Circle, 
  AlertCircle, RefreshCw, Clock, BookOpen
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
  // Mini HD 1 + PAC
  "Auditorium (PAC) | Room 100A": { x: 15.1, y: 22.7 },
  "Room 507": { x: 23.9, y: 14.4 },
  "Room 509": { x: 23.9, y: 18.2 },
  "Media Center | Room 100": { x: 27.7, y: 59.7 },

  // Block 1
  "Room 120": { x: 56.4, y: 59.7 },
  "Room 121": { x: 56.7, y: 52.7 },
  "Room 122": { x: 59.6, y: 59.7 },
  "Room 123": { x: 60.2, y: 52.7 },
  "Room 124": { x: 63, y: 59.7 },
  "Room 125": { x: 63.4, y: 52.7 },
  "Room 127": { x: 66.5, y: 52.7 },
  "Room 131": { x: 69.9, y: 52.7 },

  // Mini HD 2 + Block 4
  "Room 311": { x: 63.6, y: 36.5 },
  "Room 312": { x: 64.4, y: 43.2 },
  "Room 313": { x: 68.6, y: 36.5 },
  "Room 314": { x: 68.1, y: 43.2 },

  // Block 2
  "Room 128": { x: 69.7, y: 59.7 },
  "Room 130": { x: 72.8, y: 59.7 },
  "Room 132": { x: 75.5, y: 59.7 },
  "Room 134C": { x: 81.2, y: 67.6 },
  "Room 134D": { x: 84.8, y: 67.6 },
  "Room 135": { x: 75.7, y: 52.7 },
  "Room 137": { x: 81.2, y: 52.7 },
  "Room 139": { x: 84.2, y: 52.7 },

  // Block 3
  "Room 200": { x: 81.2, y: 49.3 },
  "Room 204": { x: 82.2, y: 46.3 },
  "Room 206": { x: 81.2, y: 41.2 },
  "Room 317": { x: 75.7, y: 36.5 },
  "Room 318": { x: 75.7, y: 41.2 },
  "Room 319": { x: 81.2, y: 36.5 },

  // Block 5
  "Room 302": { x: 44.4, y: 43.2 },
  "Room 304": { x: 48.2, y: 43.2 },
  "Room 306": { x: 51.6, y: 43.2 },
  "Room 401": { x: 51.8, y: 35.3 },
  "Room 402": { x: 58.0, y: 28.1 },
  "Room 403": { x: 51.4, y: 24.5 },
};

// -- DATA CONSTANTS --
const EVENT_DATE_STR = "2026-02-17"; 

const SCHEDULE = [
  { time: "8:15 - 9:15", label: "Keynote / Breakout A", type: "session" },
  { time: "9:30 - 10:30", label: "2nd Keynote / Breakout B", type: "session" },
  { time: "10:45 - 11:45", label: "Breakout C", type: "lunch-a", note: "LUNCH A" },
  { time: "12:00 - 1:00", label: "Breakout D", type: "lunch-b", note: "LUNCH B" },
  { time: "1:15 - 2:15", label: "PM Keynote / Breakout E", type: "lunch-c", note: "LUNCH C" },
  { time: "2:30 - 3:30", label: "PM Keynote / Breakout F", type: "session" },
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
    rooms: ["Auditorium (PAC) | Room 100A", "Room 507", "Room 509", "Media Center | Room 100"]
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

// -- APP COMPONENT --

export default function App() {
  const [view, setView] = useState('dashboard'); // 'dashboard' | 'map' | 'playbook'
  const [user, setUser] = useState(null);
  const [roomStatus, setRoomStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // -- FIREBASE INIT --
  const [db, setDb] = useState(null);

  useEffect(() => {
    // Clock for timeline
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);

    // Only init if config is present
    if (firebaseConfig.apiKey !== "YOUR_API_KEY_HERE") {
      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);
      const database = getFirestore(app);
      setDb(database);

      signInAnonymously(auth).catch(console.error);
      onAuthStateChanged(auth, (u) => setUser(u));

      const q = query(collection(database, "roomchecks"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = {};
        snapshot.forEach((doc) => {
          data[doc.id] = doc.data();
        });
        setRoomStatus(data);
        setLoading(false);
      });
      return () => {
        unsubscribe();
        clearInterval(timer);
      };
    } else {
      setLoading(false);
      clearInterval(timer);
    }
  }, []);

  // -- ACTIONS --

  const toggleRoom = async (roomName) => {
    if (!db) return alert("Please configure Firebase keys in the code first.");
    const isChecked = roomStatus[roomName]?.status === 'checked';
    const newStatus = isChecked ? 'unchecked' : 'checked';
    
    // Optimistic UI update
    setRoomStatus(prev => ({
      ...prev, 
      [roomName]: { status: newStatus, timestamp: Date.now(), by: "User" }
    }));

    await setDoc(doc(db, "roomchecks", roomName), {
      status: newStatus,
      timestamp: Date.now(),
      lastUpdatedBy: user ? user.uid : 'anon'
    });
  };

  const resetAllRooms = async () => {
    if (!db) return alert("Firebase not configured.");
    
    // Safety confirm to avoid accidents
    if (!window.confirm("⚠️ ARE YOU SURE?\n\nThis will clear ALL checks from the board for the next rotation.\nOnly do this during a break.")) {
      return;
    }

    const batch = writeBatch(db);
    const querySnapshot = await getDocs(collection(db, "roomchecks"));
    querySnapshot.forEach((docSnap) => {
      batch.update(doc(db, "roomchecks", docSnap.id), { status: 'unchecked' });
    });
    
    try {
      await batch.commit();
      alert("Board has been reset.");
    } catch (e) {
      console.error(e);
      alert("Error resetting board.");
    }
  };

  // -- RENDER HELPERS --

  const isTimeSlotActive = (timeStr) => {
    const [startStr, endStr] = timeStr.split(" - ");
    const createEventDate = (timeString) => {
      const [hours, minutes] = timeString.split(":");
      const d = new Date(EVENT_DATE_STR); 
      let h = parseInt(hours);
      if (h < 7) h += 12; // e.g. 1:00 -> 13:00
      d.setHours(h, parseInt(minutes), 0);
      return d;
    };
    const start = createEventDate(startStr);
    const end = createEventDate(endStr);
    const now = currentTime;
    const isSameDay = now.toDateString() === new Date(EVENT_DATE_STR).toDateString();
    
    if (!isSameDay) return false;
    return now >= start && now <= end;
  };

  const getLunchBadge = (type) => {
    if (type === 'A') return "bg-green-100 text-green-800";
    if (type === 'B') return "bg-amber-100 text-amber-800";
    if (type === 'C') return "bg-purple-100 text-purple-800";
    return "bg-gray-100 text-gray-800";
  };

  const getTeamColor = (color) => {
    if (color === 'red') return "border-t-red-500";
    if (color === 'amber') return "border-t-amber-500";
    return "border-t-blue-500";
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      
      {/* HEADER */}
      <header className="bg-slate-900 text-white p-4 sticky top-0 z-50 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              Educate. Inform. Inspire. 2026 
              IT Support
              <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded text-slate-300 font-normal border border-slate-600">
                {currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            </h1>
            <p className="text-xs text-slate-400">Live Dashboard</p>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            <button 
              onClick={() => setView('dashboard')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-medium transition-colors ${view === 'dashboard' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            >
              <Users size={18} className="inline mr-2" />
              Teams
            </button>
            <button 
              onClick={() => setView('map')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-medium transition-colors ${view === 'map' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            >
              <MapIcon size={18} className="inline mr-2" />
              Map
            </button>
            <button 
              onClick={() => setView('playbook')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-medium transition-colors ${view === 'playbook' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            >
              <BookOpen size={18} className="inline mr-2" />
              Playbook
            </button>
            {/* RESET BUTTON */}
            <button 
              onClick={resetAllRooms}
              className="flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-medium bg-red-900/50 text-red-200 border border-red-800 hover:bg-red-900 hover:text-white transition-colors ml-2"
              title="Clear all checks"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* CONFIG WARNING */}
      {!db && (
        <div className="bg-red-50 border-b border-red-200 p-4 text-center">
          <p className="text-red-800 flex justify-center items-center gap-2">
            <AlertCircle size={20} />
            <strong>Setup Required:</strong> Add your Firebase Config keys in the code to enable live syncing.
          </p>
        </div>
      )}

      <main className="max-w-6xl mx-auto p-4">
        
        {/* DASHBOARD VIEW */}
        {view === 'dashboard' && (
          <div className="animate-in fade-in duration-300">
            
            {/* TIMELINE */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
              <div className="bg-slate-800 text-white px-4 py-2 text-sm font-bold uppercase tracking-wider flex justify-between items-center">
                <span>Event Timeline</span>
                <span className="text-xs text-slate-400 font-normal">Feb 17, 2026</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-6 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                {SCHEDULE.map((slot, i) => {
                  const isActive = isTimeSlotActive(slot.time);
                  return (
                    <div 
                      key={i} 
                      className={`
                        p-3 flex flex-col justify-between transition-colors relative
                        ${slot.note ? getSlotBg(slot.type) : ''}
                        ${isActive ? 'bg-blue-50 ring-2 ring-inset ring-blue-500 z-10' : ''}
                      `}
                    >
                      {isActive && (
                        <div className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-bl">
                          NOW
                        </div>
                      )}
                      <div>
                        <span className={`block text-xs font-bold mb-1 ${isActive ? 'text-blue-700' : 'text-slate-900'}`}>
                          {slot.time}
                        </span>
                        <span className="text-xs text-slate-600 leading-tight block">{slot.label}</span>
                      </div>
                      {slot.note && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded mt-2 w-fit ${getLunchBadgeBadge(slot.type)}`}>
                          {slot.note}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* TEAMS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {TEAMS.map((team) => (
                <div key={team.id} className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden border-t-4 ${getTeamColor(team.color)}`}>
                  <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-start">
                    <h3 className="font-bold text-lg text-slate-800">{team.name}</h3>
                  </div>
                  
                  {/* ROOM CHECKLIST */}
                  {team.rooms.length > 0 && (
                    <div className="bg-slate-50 px-5 py-3 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Room Status</p>
                      <div className="flex flex-wrap gap-2">
                        {team.rooms.map(room => {
                          const isChecked = roomStatus[room]?.status === 'checked';
                          return (
                            <button
                              key={room}
                              onClick={() => toggleRoom(room)}
                              className={`
                                text-xs px-2 py-1 rounded-md border flex items-center gap-1.5 transition-all
                                ${isChecked 
                                  ? 'bg-green-100 border-green-200 text-green-800 shadow-sm' 
                                  : 'bg-white border-red-300 text-slate-800 shadow-sm hover:bg-red-50'
                                }
                              `}
                            >
                              {isChecked ? <CheckCircle2 size={12} /> : <Circle size={12} className="text-red-500" />}
                              {room.replace("Room ", "")}
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
              ))}
            </div>

            {/* SPECIAL ASSIGNMENTS */}
            <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-bold text-slate-800 mb-4">Off-Site & Dispatch</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <SpecialCard name="Isabelle V." task="Parapro PD @ McKinley" />
                <SpecialCard name="Kevin S." task="Dispatch: RESA & NONP" />
                <SpecialCard name="Matthew C." task="Dispatch: Capac, Croslex" />
                <SpecialCard name="James M." task="Dispatch: Everything @ RESA" />
                <SpecialCard name="Nathaneal R." task="Covering MUN @ RESA" />
                <SpecialCard name="Justin R." task="Covering Everything @ RESA" />
              </div>
            </div>

          </div>
        )}

        {/* MAP VIEW */}
        {view === 'map' && (
          <InteractiveMap 
            roomStatus={roomStatus} 
            onToggle={toggleRoom}
            isConfigured={!!db}
          />
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

function InteractiveMap({ roomStatus, onToggle, isConfigured }) {
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

function MapDot({ x, y, label, status, onClick, size }) {
  const isChecked = status === 'checked';
  return (
    <button
      onClick={onClick}
      className={`
        absolute transform -translate-x-1/2 -translate-y-1/2 
        border-2 shadow-sm transition-all active:scale-95
        flex items-center justify-center font-bold text-[10px] z-20 overflow-hidden
        ${size === 'large' ? 'w-16 h-16 rounded-lg' : 'w-8 h-8 rounded-full'}
        ${isChecked 
          ? 'bg-green-500 border-green-600 text-white shadow-green-500/20' 
          : 'bg-white border-red-500 text-slate-800 shadow-lg shadow-red-500/20 hover:scale-110'
        }
      `}
      style={{ left: `${x}%`, top: `${y}%` }}
      title={label}
    >
      {isChecked ? <CheckCircle2 size={size === 'large' ? 24 : 14} /> : label.substring(0, 4)}
    </button>
  );
}

// Helpers for the timeline bg colors
function getSlotBg(type) {
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