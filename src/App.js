import { useState, useEffect, useCallback, useRef } from "react";
import "@/App.css";
import axios from "axios";
import Globe from "react-globe.gl";
import { 
  MessageSquare, 
  Satellite, 
  Radio, 
  AlertTriangle,
  Send,
  X,
  MapPin,
  Calendar,
  User,
  Play,
  ChevronRight,
  Loader2,
  Plus,
  Facebook,
  Youtube,
  Heart,
  Newspaper,
  ExternalLink,
  GripVertical,
  Orbit,
  RefreshCw
} from "lucide-react";
import { Rnd } from "react-rnd";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { ScrollArea } from "./components/ui/scroll-area";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import { fetchUFOVideos } from "./services/youtubeService";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Hardcoded sightings data
const STATIC_SIGHTINGS = [
  {
    id: "s1", type: "ufo", title: "Phoenix Lights",
    description: "Mass UFO sighting over Phoenix, Arizona. Thousands of witnesses reported seeing a V-shaped formation of lights on March 13, 1997. Arizona Governor Fife Symington later admitted he too had seen it.",
    location: "Phoenix, Arizona, USA", latitude: 33.4484, longitude: -112.0740,
    date: "1997-03-13", reported_by: "Multiple Witnesses", is_user_reported: false
  },
  {
    id: "s2", type: "ufo", title: "Rendlesham Forest Incident",
    description: "Series of reported sightings of unexplained lights near RAF Woodbridge, often called Britain's Roswell. US Air Force personnel witnessed a strange craft in the forest.",
    location: "Suffolk, England, UK", latitude: 52.0833, longitude: 1.3833,
    date: "1980-12-26", reported_by: "USAF Personnel", is_user_reported: false
  },
  {
    id: "s3", type: "uap", title: "USS Nimitz Encounter",
    description: "US Navy pilots Commander David Fravor and Lt. Cmdr. Jim Slaight encountered a Tic Tac shaped UAP that demonstrated extraordinary flight capabilities, defying known physics.",
    location: "Pacific Ocean, off San Diego", latitude: 31.5000, longitude: -117.5000,
    date: "2004-11-14", reported_by: "US Navy", is_user_reported: false
  },
  {
    id: "s4", type: "ufo", title: "Belgian UFO Wave",
    description: "Multiple triangular UFO sightings reported across Belgium, tracked by NATO radar. Belgian Air Force scrambled F-16 fighters but could not catch the objects.",
    location: "Belgium", latitude: 50.5039, longitude: 4.4699,
    date: "1989-11-29", reported_by: "Belgian Air Force", is_user_reported: false
  },
  {
    id: "s5", type: "anomaly", title: "Hessdalen Lights",
    description: "Unexplained lights observed in the Hessdalen valley, Norway. Phenomenon has been ongoing since 1940s and remains scientifically unexplained despite extensive research.",
    location: "Hessdalen, Norway", latitude: 62.8000, longitude: 11.2000,
    date: "1981-12-01", reported_by: "Project Hessdalen", is_user_reported: false
  },
  {
    id: "s6", type: "uap", title: "Aguadilla UAP",
    description: "Object captured on thermal camera by DHS aircraft, showing object entering water without splash and splitting into two. Remains one of the most compelling UAP cases.",
    location: "Aguadilla, Puerto Rico", latitude: 18.4274, longitude: -67.1540,
    date: "2013-04-25", reported_by: "DHS", is_user_reported: false
  },
  {
    id: "s7", type: "anomaly", title: "Marfa Lights",
    description: "Mysterious glowing orbs appearing in the desert, observed since the 1880s. Appear randomly at night and remain unexplained despite scientific study.",
    location: "Marfa, Texas, USA", latitude: 30.3097, longitude: -104.0208,
    date: "1883-01-01", reported_by: "Local Observers", is_user_reported: false
  },
  {
    id: "s8", type: "ufo", title: "Ariel School Encounter",
    description: "62 children reported seeing a landed UFO and alien beings at their school in Zimbabwe. Dr. John Mack from Harvard investigated this remarkable case.",
    location: "Ruwa, Zimbabwe", latitude: -17.9000, longitude: 31.2500,
    date: "1994-09-16", reported_by: "Ariel School Students", is_user_reported: false
  },
  {
    id: "s9", type: "ufo", title: "Roswell Incident",
    description: "Alleged crash of a UFO near Roswell, New Mexico. The US military initially reported recovering a 'flying disc' before retracting and claiming it was a weather balloon.",
    location: "Roswell, New Mexico, USA", latitude: 33.3943, longitude: -104.5230,
    date: "1947-07-08", reported_by: "US Army Air Forces", is_user_reported: false
  },
  {
    id: "s10", type: "ufo", title: "Varginha UFO",
    description: "Multiple witnesses in Varginha, Brazil reported seeing strange creatures and military activity suggesting a UFO crash retrieval operation.",
    location: "Varginha, Brazil", latitude: -21.5556, longitude: -45.4306,
    date: "1996-01-20", reported_by: "Multiple Witnesses", is_user_reported: false
  },
  {
    id: "s11", type: "uap", title: "GIMBAL Video",
    description: "Declassified US Navy video showing a UAP rotating mid-air while being tracked by F/A-18 Super Hornet's targeting system.",
    location: "US East Coast", latitude: 35.5000, longitude: -73.5000,
    date: "2015-01-20", reported_by: "US Navy", is_user_reported: false
  },
  {
    id: "s12", type: "anomaly", title: "Min Min Lights",
    description: "Unusual lights seen in outback Queensland, Australia. Described by Aboriginal legend and witnessed by countless travelers on the Channel Country roads.",
    location: "Queensland, Australia", latitude: -24.0000, longitude: 140.0000,
    date: "1838-01-01", reported_by: "Local Witnesses", is_user_reported: false
  },
  {
    id: "s13", type: "ufo", title: "Atalanti UFO Incident",
    description: "Documented UFO incident near Megaplatanos, Atalanti, Greece. Witness reports described anomalous aerial behavior and persistent luminous manifestations during the Sept 2, 1990 event.",
    location: "Megaplatanos, Atalanti, Greece", latitude: 38.65, longitude: 23.03,
    date: "1990-09-02", reported_by: "Regional Witness Reports", is_user_reported: false
  }
];

// Hardcoded satellites data
const STATIC_SATELLITES = [
  { id: "sat-1", name: "ISS (Zarya)", norad_id: "25544", latitude: 51.64, longitude: -72.35, altitude: 408, velocity: 7.66, inclination: 51.6, period: 92.68, launch_date: "1998-11-20", country: "International" },
  { id: "sat-2", name: "Hubble Space Telescope", norad_id: "20580", latitude: 28.46, longitude: 45.23, altitude: 547, velocity: 7.59, inclination: 28.5, period: 95.42, launch_date: "1990-04-24", country: "USA" },
  { id: "sat-3", name: "Starlink-1234", norad_id: "44713", latitude: 53.23, longitude: -122.57, altitude: 550, velocity: 7.59, inclination: 53.0, period: 95.6, launch_date: "2019-05-24", country: "USA" },
  { id: "sat-4", name: "GOES-16", norad_id: "41866", latitude: 0.0, longitude: -75.2, altitude: 35786, velocity: 3.07, inclination: 0.1, period: 1436, launch_date: "2016-11-19", country: "USA" },
  { id: "sat-5", name: "Tiangong", norad_id: "48274", latitude: 41.5, longitude: 88.3, altitude: 389, velocity: 7.68, inclination: 41.5, period: 91.5, launch_date: "2021-04-29", country: "China" },
  { id: "sat-6", name: "LANDSAT 9", norad_id: "49260", latitude: -12.35, longitude: 156.79, altitude: 705, velocity: 7.5, inclination: 98.2, period: 99.0, launch_date: "2021-09-27", country: "USA" },
  { id: "sat-7", name: "NOAA-20", norad_id: "43013", latitude: 45.3, longitude: -30.0, altitude: 824, velocity: 7.44, inclination: 98.7, period: 101.4, launch_date: "2017-11-18", country: "USA" },
  { id: "sat-8", name: "Sentinel-1A", norad_id: "39634", latitude: -60.1, longitude: 20.5, altitude: 693, velocity: 7.48, inclination: 98.18, period: 98.74, launch_date: "2014-04-03", country: "ESA" }
];

// Simulate satellite orbit motion
const simulateSatellitePositions = (sats) => {
  const time = Date.now() / 1000;
  return sats.map(sat => {
    const angularVelocity = 360 / (sat.period * 60);
    const lonOffset = (time * angularVelocity) % 360;
    return {
      ...sat,
      longitude: ((sat.longitude + lonOffset + 180) % 360) - 180,
      latitude: sat.latitude + 5 * Math.sin(time / 100 + sat.inclination)
    };
  });
};


// SIRIUS AI placeholder image for news modal when article image is missing
const NEWS_PLACEHOLDER = "https://unsplash.com";

// HARDCODED video pool - 12 verified IDs
const VIDEO_POOL = [
  { video_id: "j_f7EsS9_XU", title: "SiriusAnews: Latest UFO/UAP Report", channel: "SiriusAnews", sirius: true },
  { video_id: "PfSXkfV_mhA", title: "Pentagon UFO Videos: Official Release", channel: "CBS News", sirius: false },
  { video_id: "ZBtMbBPzqHY", title: "Navy Pilots Describe UFO Encounters", channel: "60 Minutes", sirius: false },
  { video_id: "rO_M0hLlJ-Q", title: "The Rendlesham Forest Incident", channel: "History Channel", sirius: false },
  { video_id: "2TumprpOwHY", title: "Phoenix Lights: The Full Story", channel: "VICE", sirius: false },
  { video_id: "SpeSpA3e56A", title: "What We Know About UAPs", channel: "Vox", sirius: false },
  { video_id: "KQ7Hk70JjLg", title: "Top 10 Most Credible UFO Sightings", channel: "Discovery", sirius: false },
  { video_id: "mtM7NbHF0-0", title: "Unexplained Mysteries: Aliens & UFOs", channel: "Mystery Files", sirius: false },
  { video_id: "Jr0JaXfXUvU", title: "Ryan Graves on UAPs", channel: "60 Minutes", sirius: false },
  { video_id: "pWwwTSJwhmw", title: "David Fravor Tic Tac UFO Encounter", channel: "Lex Fridman", sirius: false },
  { video_id: "FCEnaC4UqAE", title: "David Grusch Whistleblower Hearing", channel: "C-SPAN", sirius: false },
  { video_id: "ZrsVVGgANC8", title: "Avi Loeb on Interstellar Objects", channel: "Lex Fridman", sirius: false }
].map(v => ({
  ...v,
  thumbnail: `https://img.youtube.com/vi/${v.video_id}/mqdefault.jpg`
}));

// Curated fallback NEO list (used when API fails)
const FALLBACK_NEOS = [
  {
    id: "2024-YR4", name: "2024 YR4",
    diameter_min: 40, diameter_max: 90,
    velocity: 13.41, distance_km: 8080000, distance_lunar: 21.0,
    approach_date: "2026-Dec-22", hazardous: true,
    nasa_url: "https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=2024%20YR4"
  },
  {
    id: "2026-AB", name: "2026 AB",
    diameter_min: 25, diameter_max: 55,
    velocity: 8.72, distance_km: 4260000, distance_lunar: 11.1,
    approach_date: "2026-Apr-30", hazardous: false,
    nasa_url: "https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html"
  },
  {
    id: "99942-Apophis", name: "99942 Apophis",
    diameter_min: 340, diameter_max: 370,
    velocity: 7.42, distance_km: 31200000, distance_lunar: 81.2,
    approach_date: "2029-Apr-13", hazardous: true,
    nasa_url: "https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=99942"
  },
  {
    id: "2023-DW", name: "2023 DW",
    diameter_min: 45, diameter_max: 70,
    velocity: 25.03, distance_km: 1800000, distance_lunar: 4.7,
    approach_date: "2026-May-14", hazardous: true,
    nasa_url: "https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html"
  },
  {
    id: "2024-MK", name: "2024 MK",
    diameter_min: 120, diameter_max: 260,
    velocity: 10.28, distance_km: 295000, distance_lunar: 0.77,
    approach_date: "2026-Jun-29", hazardous: true,
    nasa_url: "https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html"
  }
];

// Shuffle helper
const shuffleArray = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Build video list: SiriusAnews always first, others shuffled - only from the 8-video pool
const buildVideoList = () => {
  const sirius = VIDEO_POOL.find(v => v.sirius);
  const others = shuffleArray(VIDEO_POOL.filter(v => !v.sirius));
  return [sirius, ...others];
};

const STATIC_VIDEOS = buildVideoList();

// Generate unique session ID
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('chat_session_id');
  if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('chat_session_id', sessionId);
  }
  return sessionId;
};

function App() {
  const [sightings, setSightings] = useState(STATIC_SIGHTINGS);
  const [satellites, setSatellites] = useState(simulateSatellitePositions(STATIC_SATELLITES));
  const [videos, setVideos] = useState([]);
  const [videosLoading, setVideosLoading] = useState(true);
  const [videosError, setVideosError] = useState(null);
  
  const fetchVideos = async () => {
    try {
      setVideosLoading(true);
      setVideosError(null);
      const youtubeVideos = await fetchUFOVideos(12);
      setVideos(youtubeVideos);
    } catch (error) {
      console.error('Error fetching videos:', error);
      setVideosError('Failed to load videos from YouTube');
      // Fallback to static videos if API fails
      setVideos(STATIC_VIDEOS);
    } finally {
      setVideosLoading(false);
    }
  };

  const shuffleVideos = () => {
    fetchVideos(); // Re-fetch videos when shuffling
  };
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activePanel, setActivePanel] = useState(null);
  const [isRotating, setIsRotating] = useState(true);
  const [highlightedLocation, setHighlightedLocation] = useState(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [showPayPalModal, setShowPayPalModal] = useState(false);
  const [newsItems, setNewsItems] = useState([]);
  const [readerArticle, setReaderArticle] = useState(null);
  const [newsLoading, setNewsLoading] = useState(true);
  const [neos, setNeos] = useState([]);
  const [neosLoading, setNeosLoading] = useState(false);
  const globeRef = useRef();
  const chatEndRef = useRef();
  const sessionId = useRef(getSessionId());

  // Report form state
  const [reportForm, setReportForm] = useState({
    title: "",
    description: "",
    location: "",
    latitude: "",
    longitude: "",
    date: "",
    type: "ufo"
  });

  // Fetch initial data (optional - backend may not be available)
  useEffect(() => {
    // Load user-reported sightings from localStorage
    try {
      const savedSightings = JSON.parse(localStorage.getItem('user_sightings') || '[]');
      if (savedSightings.length > 0) {
        setSightings([...STATIC_SIGHTINGS, ...savedSightings]);
      }
    } catch (e) {
      console.error("LocalStorage load error:", e);
    }

    // Try to fetch live data from backend, fall back to static data
    const fetchData = async () => {
      try {
        const [sightingsRes, satellitesRes] = await Promise.all([
          axios.get(`${API}/sightings`, { timeout: 3000 }),
          axios.get(`${API}/satellites`, { timeout: 3000 })
        ]);
        const backendSightings = sightingsRes.data.sightings || [];
        if (backendSightings.length > 0) {
          const userReported = backendSightings.filter(s => s.is_user_reported);
          const localSaved = JSON.parse(localStorage.getItem('user_sightings') || '[]');
          setSightings([...STATIC_SIGHTINGS, ...userReported, ...localSaved]);
        }
        if (satellitesRes.data.satellites && satellitesRes.data.satellites.length > 0) {
          setSatellites(satellitesRes.data.satellites);
        }
      } catch (e) {
        console.log("Backend not available, using static data");
      }
    };
    fetchData();

    // Update satellite positions every 5 seconds using local simulation
    const interval = setInterval(() => {
      setSatellites(simulateSatellitePositions(STATIC_SATELLITES));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Fetch live UAP/UFO news from Google News RSS (international + Greek sources)
  const fetchNews = async () => {
    setNewsLoading(true);
    try {
      const queries = [
        { q: 'UAP+UFO+disclosure', gl: 'US', hl: 'en' },
        { q: 'UFO+sighting+latest', gl: 'GB', hl: 'en' },
        { q: 'aerospace+anomaly', gl: 'US', hl: 'en' },
        { q: 'UAP+pentagon', gl: 'US', hl: 'en' },
        { q: 'UFO+NewsNation+OR+Debrief', gl: 'US', hl: 'en' },
        { q: 'ΑΤΙΑ+UFO', gl: 'GR', hl: 'el' },
        { q: 'αγνωστα+ιπταμενα', gl: 'GR', hl: 'el' }
      ];
      const allItems = [];
      await Promise.all(queries.map(async ({ q, gl, hl }) => {
        try {
          const rssUrl = encodeURIComponent(`https://news.google.com/rss/search?q=${q}&hl=${hl}-${gl}&gl=${gl}&ceid=${gl}:${hl}`);
          const res = await axios.get(`https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}&count=10`, { timeout: 8000 });
          if (res.data?.items) {
            allItems.push(...res.data.items);
          }
        } catch (e) {
          console.log(`News fetch failed for ${q}`);
        }
      }));
      
      if (allItems.length > 0) {
        const now = Date.now();
        const recentMs = 96 * 60 * 60 * 1000;
        const seen = new Set();
        const recent = allItems
          .filter(item => {
            const pubDate = new Date(item.pubDate).getTime();
            if (isNaN(pubDate)) return false;
            if ((now - pubDate) > recentMs) return false;
            const titleKey = item.title.toLowerCase().substring(0, 50);
            if (seen.has(titleKey)) return false;
            seen.add(titleKey);
            return true;
          })
          .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
          .slice(0, 8);
        
        if (recent.length >= 5) {
          setNewsItems(recent);
        } else {
          const all = allItems.slice(0, 8).filter((item, idx, self) => 
            idx === self.findIndex(t => t.title === item.title)
          );
          setNewsItems(all.slice(0, 8));
        }
      } else {
        setNewsItems([
          { title: "UAP Disclosure Hearing Scheduled for 2026", link: "https://thedebrief.org", pubDate: new Date().toISOString(), author: "The Debrief", description: "New congressional hearing on UAP disclosure scheduled." },
          { title: "Navy Pilots Report New UAP Encounters", link: "https://newsnation.com", pubDate: new Date().toISOString(), author: "NewsNation", description: "Multiple pilots report unidentified aerial phenomena." }
        ]);
      }
    } catch (e) {
      console.log("News fetch failed entirely");
    }
    setNewsLoading(false);
  };

  useEffect(() => {
    fetchNews();
  }, []);

  // Fetch Near-Earth Objects from NASA JPL CNEOS API (no key needed)
  const fetchNeos = async () => {
    setNeosLoading(true);
    try {
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 60);
      const formatDate = (d) => d.toISOString().split('T')[0];
      
      const apiUrl = `https://ssd-api.jpl.nasa.gov/cad.api?date-min=${formatDate(today)}&date-max=${formatDate(endDate)}&dist-max=0.2&sort=date`;
      const res = await axios.get(
        `https://api.allorigins.win/raw?url=${encodeURIComponent(apiUrl)}`,
        { timeout: 15000 }
      );
      
      const allNeos = [];
      if (res.data?.data) {
        // fields: des, orbit_id, jd, cd, dist, dist_min, dist_max, v_rel, v_inf, t_sigma_f, h
        res.data.data.forEach(row => {
          const [des, , , cd, dist, , , v_rel, , , h] = row;
          const distAU = parseFloat(dist);
          const distKm = distAU * 149597870.7; // AU to km
          const distLunar = distAU * 389.17; // AU to lunar distances
          // Absolute magnitude H to approx diameter (assuming albedo 0.14)
          const absH = parseFloat(h);
          const diamM = 1329 / Math.sqrt(0.14) * Math.pow(10, -0.2 * absH) * 1000;
          
          allNeos.push({
            id: des,
            name: des,
            diameter_min: diamM * 0.7,
            diameter_max: diamM * 1.3,
            velocity: parseFloat(v_rel),
            distance_km: distKm,
            distance_lunar: distLunar,
            approach_date: cd,
            hazardous: distLunar < 20 && diamM > 100,
            nasa_url: `https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=${encodeURIComponent(des)}`
          });
        });
      }
      
      setNeos(allNeos.length > 0 ? allNeos.slice(0, 30) : FALLBACK_NEOS);
    } catch (e) {
      console.log("NEO fetch failed, using fallback:", e);
      setNeos(FALLBACK_NEOS);
    }
    setNeosLoading(false);
  };

  useEffect(() => {
    fetchNeos();
  }, []);

  // Fetch videos from YouTube API
  useEffect(() => {
    fetchVideos();
  }, []);

  // Auto-refresh videos every 3 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchVideos();
    }, 180000);
    return () => clearInterval(interval);
  }, []);

  // Open reader modal - no external fetch, just show summary and link
  const openReader = (item) => {
    setReaderArticle(item);
  };
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Globe configuration
  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.controls().autoRotate = isRotating;
      globeRef.current.controls().autoRotateSpeed = 0.3;
      globeRef.current.pointOfView({ altitude: 2.5 });
    }
  }, [isRotating]);

  // Focus on highlighted location
  useEffect(() => {
    if (highlightedLocation && globeRef.current) {
      globeRef.current.pointOfView({
        lat: highlightedLocation.latitude,
        lng: highlightedLocation.longitude,
        altitude: 1.5
      }, 1000);
      setIsRotating(false);
    }
  }, [highlightedLocation]);

  const handleSiriusChat = async () => {
    if (!chatInput.trim() || isLoading) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage
        })
      });

      const data = await response.json();
      
      if (data.response) {
        setChatMessages(prev => [...prev, { role: "assistant", content: data.response }]);
      } else {
        throw new Error(data.error || "Invalid response from API");
      }
    } catch (error) {
      setChatMessages(prev => [...prev, { role: "assistant", content: "Signal lost... Please check your connection." }]);
    } finally {
      setIsLoading(false);
    }
  };



  // Handle report submission
  const handleSubmitReport = async (e) => {
    e.preventDefault();
    
    if (!reportForm.title || !reportForm.location || !reportForm.latitude || !reportForm.longitude) {
      toast.error("Please fill in all required fields");
      return;
    }

    const newSighting = {
      id: `user-${Date.now()}`,
      ...reportForm,
      latitude: parseFloat(reportForm.latitude),
      longitude: parseFloat(reportForm.longitude),
      reported_by: "Anonymous User",
      is_user_reported: true
    };

    // Try to save to backend, but always save locally
    try {
      await axios.post(`${API}/sightings`, newSighting, { timeout: 3000 });
    } catch (e) {
      console.log("Backend not available, saving locally");
    }

    // Save to localStorage for persistence
    try {
      const saved = JSON.parse(localStorage.getItem('user_sightings') || '[]');
      saved.push(newSighting);
      localStorage.setItem('user_sightings', JSON.stringify(saved));
    } catch (e) {
      console.error("LocalStorage error:", e);
    }

    setSightings(prev => [...prev, newSighting]);
    setReportForm({
      title: "",
      description: "",
      location: "",
      latitude: "",
      longitude: "",
      date: "",
      type: "ufo"
    });
    setShowReportForm(false);
    toast.success("Sighting reported successfully!");

    setHighlightedLocation({
      latitude: parseFloat(reportForm.latitude),
      longitude: parseFloat(reportForm.longitude),
      title: reportForm.title
    });
  };

  // Prepare globe data
  const globePoints = [
    ...sightings.map(s => ({
      lat: s.latitude,
      lng: s.longitude,
      size: s.is_user_reported ? 0.4 : 0.3,
      color: s.type === 'anomaly' ? '#FF6B6B' : '#E8FF00',
      label: s.title,
      data: s
    })),
    ...satellites.map(s => ({
      lat: s.latitude,
      lng: s.longitude,
      size: 0.2,
      color: '#00F0FF',
      label: s.name,
      data: s,
      isSatellite: true
    }))
  ];

  // Add highlighted location as a special point
  if (highlightedLocation) {
    globePoints.push({
      lat: highlightedLocation.latitude,
      lng: highlightedLocation.longitude,
      size: 0.6,
      color: '#FFFFFF',
      label: highlightedLocation.title,
      isHighlight: true
    });
  }

  const handleGlobeClick = useCallback(() => {
    setIsRotating(prev => !prev);
  }, []);

  const handlePointClick = useCallback((point) => {
    if (point.data) {
      setHighlightedLocation({
        latitude: point.lat,
        longitude: point.lng,
        title: point.label
      });
      
      if (point.isSatellite) {
        setActivePanel('satellites');
      } else {
        setActivePanel('ufo');
      }
    }
  }, []);

  return (
    <div className="app-container">
      {/* Starfield Background */}
      <div className="starfield" />

      {/* Social Media + PayPal Sidebar (Top Left) */}
      <div className="social-sidebar" data-testid="social-sidebar">
        <a 
          href="https://www.tiktok.com/@siriusanews" 
          target="_blank" 
          rel="noopener noreferrer"
          className="social-btn tiktok"
          data-testid="tiktok-btn"
          title="TikTok"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1z"/>
          </svg>
        </a>
        <a 
          href="https://www.facebook.com/SiriusAnews" 
          target="_blank" 
          rel="noopener noreferrer"
          className="social-btn facebook"
          data-testid="facebook-btn"
          title="Facebook"
        >
          <Facebook size={20} />
        </a>
        <a 
          href="https://www.youtube.com/@SiriusAnews" 
          target="_blank" 
          rel="noopener noreferrer"
          className="social-btn youtube"
          data-testid="youtube-btn"
          title="YouTube"
        >
          <Youtube size={20} />
        </a>
        <button 
          onClick={() => setShowPayPalModal(true)}
          className="social-btn paypal"
          data-testid="paypal-btn"
          title="Support us via PayPal"
        >
          <Heart size={20} fill="currentColor" />
        </button>
      </div>
      
      {/* 3D Globe */}
      <div className="globe-container" data-testid="globe-container">
        <Globe
          ref={globeRef}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          backgroundImageUrl=""
          backgroundColor="rgba(0,0,0,0)"
          pointsData={globePoints}
          pointLat="lat"
          pointLng="lng"
          pointColor="color"
          pointAltitude={d => d.isSatellite ? 0.05 + (d.data?.altitude || 400) / 40000 : 0.01}
          pointRadius="size"
          pointLabel={d => `
            <div class="glass-panel p-3 text-sm">
              <div class="font-bold text-white">${d.label}</div>
              ${d.data?.location ? `<div class="text-gray-400 text-xs">${d.data.location}</div>` : ''}
              ${d.data?.altitude ? `<div class="text-cyan-400 text-xs mono">Alt: ${d.data.altitude} km</div>` : ''}
            </div>
          `}
          onPointClick={handlePointClick}
          onGlobeClick={handleGlobeClick}
          atmosphereColor="#00BFFF"
          atmosphereAltitude={0.25}
          showGraticules={true}
          labelsData={[]}
        />
      </div>

      {/* Top Navigation */}
      <div className="globe-controls">
        <h1 className="globe-title">SIRIUS AI</h1>
        <div className="nav-buttons">
          <Button 
            data-testid="ufo-uap-btn"
            className={`tech-button nav-button ${activePanel === 'ufo' ? 'active' : ''}`}
            variant="ghost"
            onClick={() => setActivePanel(activePanel === 'ufo' ? null : 'ufo')}
          >
            <AlertTriangle size={16} />
            UAP/UFO
          </Button>
          <Button 
            data-testid="anomalies-btn"
            className={`tech-button nav-button ${activePanel === 'anomalies' ? 'active' : ''}`}
            variant="ghost"
            onClick={() => setActivePanel(activePanel === 'anomalies' ? null : 'anomalies')}
          >
            <Radio size={16} />
            Anomalies
          </Button>
          <Button 
            data-testid="satellites-btn"
            className={`tech-button nav-button ${activePanel === 'satellites' ? 'active' : ''}`}
            variant="ghost"
            onClick={() => setActivePanel(activePanel === 'satellites' ? null : 'satellites')}
          >
            <Satellite size={16} />
            Satellites
          </Button>
          <Button 
            data-testid="neos-btn"
            className={`tech-button nav-button ${activePanel === 'neos' ? 'active' : ''}`}
            variant="ghost"
            onClick={() => setActivePanel(activePanel === 'neos' ? null : 'neos')}
          >
            <Orbit size={16} />
            Near-Earth Objects
          </Button>
        </div>
      </div>

      {/* Chat Panel - Draggable & Resizable */}
      <Rnd
        default={{
          x: 120,
          y: window.innerHeight - 700,
          width: 380,
          height: 500
        }}
        minWidth={320}
        minHeight={380}
        maxWidth={700}
        maxHeight={800}
        bounds="window"
        dragHandleClassName="chat-drag-handle"
        className="chat-rnd"
        style={{ zIndex: 100 }}
      >
      <div className="glass-panel chat-panel-rnd fade-in">
        <div className="list-header chat-drag-handle flex items-center justify-between" style={{ cursor: 'move' }}>
          <div className="flex items-center gap-2">
            <GripVertical size={14} className="text-gray-500" />
            <MessageSquare size={18} className="text-cyan-400" />
            <span className="font-semibold">AI Search Agent</span>
          </div>
          <Button
            data-testid="report-sighting-btn"
            variant="ghost"
            size="sm"
            className="text-xs text-yellow-400 hover:text-yellow-300"
            onClick={() => setShowReportForm(!showReportForm)}
          >
            <Plus size={14} className="mr-1" />
            Report a Sighting
          </Button>
        </div>

        {showReportForm ? (
          <form className="report-form" onSubmit={handleSubmitReport}>
            <div className="form-group">
              <label className="form-label">Title *</label>
              <Input
                data-testid="report-title-input"
                className="form-input"
                placeholder="What did you see?"
                value={reportForm.title}
                onChange={(e) => setReportForm(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <Input
                data-testid="report-description-input"
                className="form-input"
                placeholder="Describe the event..."
                value={reportForm.description}
                onChange={(e) => setReportForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Location *</label>
              <Input
                data-testid="report-location-input"
                className="form-input"
                placeholder="City, Country"
                value={reportForm.location}
                onChange={(e) => setReportForm(prev => ({ ...prev, location: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="form-group">
                <label className="form-label">Latitude *</label>
                <Input
                  data-testid="report-latitude-input"
                  className="form-input"
                  type="number"
                  step="any"
                  placeholder="51.5074"
                  value={reportForm.latitude}
                  onChange={(e) => setReportForm(prev => ({ ...prev, latitude: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Longitude *</label>
                <Input
                  data-testid="report-longitude-input"
                  className="form-input"
                  type="number"
                  step="any"
                  placeholder="-0.1278"
                  value={reportForm.longitude}
                  onChange={(e) => setReportForm(prev => ({ ...prev, longitude: e.target.value }))}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <Input
                data-testid="report-date-input"
                className="form-input"
                type="date"
                value={reportForm.date}
                onChange={(e) => setReportForm(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                data-testid="cancel-report-btn"
                type="button" 
                variant="ghost" 
                className="flex-1"
                onClick={() => setShowReportForm(false)}
              >
                Cancel
              </Button>
              <Button 
                data-testid="submit-report-btn"
                type="submit" 
                className="flex-1 submit-button"
              >
                Submit
              </Button>
            </div>
          </form>
        ) : (
          <>
            <ScrollArea className="chat-messages custom-scrollbar" style={{ height: '300px' }}>
              {chatMessages.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Ask me about UFO sightings, UAP events, or report your own experience.</p>
                </div>
              )}
              {chatMessages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`chat-message ${msg.role}`}
                  data-testid={`chat-message-${msg.role}-${idx}`}
                >
                  <p className="text-sm">{msg.content}</p>
                  {msg.location && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-yellow-400">
                      <MapPin size={12} />
                      <span>{msg.location.location}</span>
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="chat-message assistant">
                  <div className="typing-indicator">
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </ScrollArea>
            <div className="chat-input-container">
              <div className="flex gap-2">
                <Input
                  data-testid="chat-input"
                  className="form-input flex-1"
                  placeholder="Ask about UFO events..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSiriusChat()}
                  disabled={isLoading}
                />
                <Button 
                  data-testid="send-message-btn"
                  onClick={handleSiriusChat}
                  disabled={isLoading || !chatInput.trim()}
                  className="bg-cyan-500 hover:bg-cyan-400 text-black"
                >
                  {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
      </Rnd>

      {/* UFO/UAP Panel */}
      {activePanel === 'ufo' && (
        <div 
          className="floating-panel glass-panel list-panel slide-up" 
          style={{ top: '200px', right: '380px' }}
          data-testid="ufo-panel"
        >
          <button className="panel-close" onClick={() => setActivePanel(null)}>
            <X size={14} />
          </button>
          <div className="list-header">
            <h3 className="font-semibold flex items-center gap-2">
              <AlertTriangle size={16} className="text-yellow-400" />
              UAP/UFO Sightings
            </h3>
            <p className="text-xs text-gray-400 mt-1">{sightings.filter(s => s.type !== 'anomaly').length} recorded events</p>
          </div>
          <ScrollArea className="list-content custom-scrollbar">
            {sightings.filter(s => s.type !== 'anomaly').map((sighting, idx) => (
              <div 
                key={sighting.id || idx}
                className={`list-item ufo ${highlightedLocation?.title === sighting.title ? 'border-yellow-400' : ''}`}
                onClick={() => setHighlightedLocation({
                  latitude: sighting.latitude,
                  longitude: sighting.longitude,
                  title: sighting.title
                })}
                data-testid={`sighting-item-${idx}`}
              >
                <div className="flex justify-between items-start">
                  <h4 className="font-medium text-sm">{sighting.title}</h4>
                  {sighting.is_user_reported && (
                    <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">USER</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{sighting.description}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <MapPin size={10} />
                    {sighting.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={10} />
                    {sighting.date}
                  </span>
                </div>
              </div>
            ))}
          </ScrollArea>
        </div>
      )}

      {/* Anomalies Panel */}
      {activePanel === 'anomalies' && (
        <div 
          className="floating-panel glass-panel list-panel slide-up" 
          style={{ top: '200px', right: '380px' }}
          data-testid="anomalies-panel"
        >
          <button className="panel-close" onClick={() => setActivePanel(null)}>
            <X size={14} />
          </button>
          <div className="list-header">
            <h3 className="font-semibold flex items-center gap-2">
              <Radio size={16} className="text-red-400" />
              Anomalous Phenomena
            </h3>
            <p className="text-xs text-gray-400 mt-1">{sightings.filter(s => s.type === 'anomaly').length} recorded events</p>
          </div>
          <ScrollArea className="list-content custom-scrollbar">
            {sightings.filter(s => s.type === 'anomaly').map((sighting, idx) => (
              <div 
                key={sighting.id || idx}
                className="list-item anomaly"
                onClick={() => setHighlightedLocation({
                  latitude: sighting.latitude,
                  longitude: sighting.longitude,
                  title: sighting.title
                })}
                data-testid={`anomaly-item-${idx}`}
              >
                <h4 className="font-medium text-sm">{sighting.title}</h4>
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{sighting.description}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <MapPin size={10} />
                    {sighting.location}
                  </span>
                </div>
              </div>
            ))}
          </ScrollArea>
        </div>
      )}

      {/* Satellites Panel */}
      {activePanel === 'satellites' && (
        <div 
          className="floating-panel glass-panel list-panel slide-up" 
          style={{ top: '200px', right: '380px' }}
          data-testid="satellites-panel"
        >
          <button className="panel-close" onClick={() => setActivePanel(null)}>
            <X size={14} />
          </button>
          <div className="list-header">
            <h3 className="font-semibold flex items-center gap-2">
              <Satellite size={16} className="text-cyan-400" />
              Active Satellites
            </h3>
            <p className="text-xs text-gray-400 mt-1">{satellites.length} tracked objects</p>
          </div>
          <ScrollArea className="list-content custom-scrollbar">
            {satellites.map((sat, idx) => (
              <div 
                key={sat.id || idx}
                className="list-item satellite"
                onClick={() => setHighlightedLocation({
                  latitude: sat.latitude,
                  longitude: sat.longitude,
                  title: sat.name
                })}
                data-testid={`satellite-item-${idx}`}
              >
                <div className="satellite-card">
                  <div className="satellite-icon">
                    <Satellite size={20} />
                  </div>
                  <div className="satellite-data">
                    <h4 className="font-medium text-sm">{sat.name}</h4>
                    <div className="satellite-stats mono text-xs text-gray-400">
                      <span>ALT: {sat.altitude} km</span>
                      <span>VEL: {sat.velocity} km/s</span>
                      <span>LAT: {sat.latitude.toFixed(2)}</span>
                      <span>LNG: {sat.longitude.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  <span className="bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded">{sat.country}</span>
                  <span>NORAD: {sat.norad_id}</span>
                </div>
              </div>
            ))}
          </ScrollArea>
        </div>
      )}

      {/* Near-Earth Objects Panel - NASA NeoWs Live Data */}
      {activePanel === 'neos' && (
        <div 
          className="floating-panel glass-panel list-panel slide-up" 
          style={{ top: '200px', right: '380px', width: '400px' }}
          data-testid="neos-panel"
        >
          <button className="panel-close" onClick={() => setActivePanel(null)}>
            <X size={14} />
          </button>
          <div className="list-header">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Orbit size={16} className="text-orange-400" />
                Near-Earth Objects
              </h3>
              <button 
                className="news-refresh-btn"
                onClick={fetchNeos}
                disabled={neosLoading}
                data-testid="refresh-neos-btn"
                title="Refresh NASA data"
              >
                <RefreshCw size={13} className={neosLoading ? 'animate-spin' : ''} />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              NASA JPL Live Data · {neos.length} tracked
            </p>
          </div>
          <ScrollArea className="list-content custom-scrollbar">
            {neosLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={20} className="animate-spin text-orange-400" />
                <span className="ml-2 text-sm text-gray-400">Loading NASA data...</span>
              </div>
            )}
            {!neosLoading && neos.length === 0 && (
              <div className="text-xs text-gray-500 p-4 text-center">
                No near-Earth objects data available. Try refreshing.
              </div>
            )}
            {neos.map((neo, idx) => (
              <div 
                key={neo.id || idx}
                className={`list-item neo ${neo.hazardous ? 'hazardous' : ''}`}
                data-testid={`neo-item-${idx}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-sm">{neo.name}</h4>
                  {neo.hazardous && (
                    <span className="text-[0.6rem] bg-red-500/20 text-red-400 px-2 py-0.5 rounded border border-red-500/30">
                      HAZARDOUS
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 mono text-xs">
                  <div className="text-gray-500">
                    <span className="text-gray-400">SIZE:</span><br/>
                    <span className="text-white">{Math.round(neo.diameter_min)}-{Math.round(neo.diameter_max)} m</span>
                  </div>
                  <div className="text-gray-500">
                    <span className="text-gray-400">VELOCITY:</span><br/>
                    <span className="text-white">{neo.velocity.toFixed(2)} km/s</span>
                  </div>
                  <div className="text-gray-500">
                    <span className="text-gray-400">DISTANCE:</span><br/>
                    <span className="text-white">{(neo.distance_km / 1000000).toFixed(2)}M km</span>
                  </div>
                  <div className="text-gray-500">
                    <span className="text-gray-400">LUNAR:</span><br/>
                    <span className="text-white">{neo.distance_lunar.toFixed(1)} LD</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-2 text-[0.65rem] text-orange-400">
                  <Calendar size={10} />
                  <span>{neo.approach_date}</span>
                </div>
              </div>
            ))}
          </ScrollArea>
        </div>
      )}

      {/* Video Bar */}
      <div className="video-bar" data-testid="video-bar">
        <div className="video-bar-container">
          <div className="flex items-center justify-between px-6 mb-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Play size={14} className="text-red-500" />
              UFO & Mystery Videos
            </h3>
            <button 
              className="video-refresh-btn"
              onClick={shuffleVideos}
              data-testid="refresh-videos-btn"
              title="Shuffle videos"
            >
              <RefreshCw size={14} />
              <span className="text-xs ml-1">Shuffle</span>
            </button>
          </div>
          <div className="video-scroll hide-scrollbar">
            {videosLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-cyan-400 mr-2" size={20} />
                <span className="text-sm text-gray-400">Loading videos...</span>
              </div>
            ) : videosError ? (
              <div className="flex flex-col items-center justify-center py-8">
                <AlertTriangle className="text-red-400 mb-2" size={20} />
                <span className="text-sm text-red-400">{videosError}</span>
                <button 
                  onClick={fetchVideos}
                  className="mt-2 text-xs text-cyan-400 hover:text-cyan-300"
                >
                  Retry
                </button>
              </div>
            ) : videos.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <span className="text-sm text-gray-400">No videos found</span>
              </div>
            ) : (
              videos.map((video, idx) => (
                <div
                  key={video.video_id || idx}
                  onClick={() => setPlayingVideo(video)}
                  className="video-card"
                  data-testid={`video-card-${idx}`}
                >
                  {video.sirius && <span className="sirius-badge">SIRIUS</span>}
                  <img 
                    src={video.thumbnail} 
                    alt={video.title}
                    className="video-thumbnail"
                    onError={(e) => {
                      e.target.src = `https://img.youtube.com/vi/${video.video_id}/mqdefault.jpg`;
                    }}
                  />
                  <p className="video-title text-gray-300">{video.title}</p>
                  <p className="text-xs text-gray-500">{video.channel}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Live News Feed Sidebar (Top Right) */}
      <div 
        className="news-feed-sidebar" 
        data-testid="news-feed-sidebar"
      >
        <div className="news-feed-header">
          <div className="flex items-center gap-2">
            <Newspaper size={16} className="text-cyan-400" />
            <span className="font-semibold text-sm">SiriusAnews - Live Feed</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              className="news-refresh-btn"
              onClick={fetchNews}
              disabled={newsLoading}
              data-testid="refresh-news-btn"
              title="Refresh feed"
            >
              <RefreshCw size={13} className={newsLoading ? 'animate-spin' : ''} />
            </button>
            <span className="news-feed-badge">LIVE</span>
          </div>
        </div>
        <div className="news-feed-content custom-scrollbar">
          {newsLoading && (
            <div className="news-loading">
              <Loader2 size={18} className="animate-spin text-cyan-400" />
              <span className="text-xs text-gray-400 ml-2">Loading latest news...</span>
            </div>
          )}
          {!newsLoading && newsItems.length === 0 && (
            <div className="text-xs text-gray-500 p-4 text-center">
              No fresh news available. Check back later.
            </div>
          )}
          {newsItems.map((item, idx) => (
            <div 
              key={idx} 
              className="news-item"
              onClick={() => openReader(item)}
              data-testid={`news-item-${idx}`}
            >
              <h4 className="news-item-title">{item.title}</h4>
              <div className="news-item-meta">
                <span className="news-item-source">{item.author || 'News'}</span>
                <span className="news-item-time">
                  {item.pubDate ? new Date(item.pubDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reader Mode Modal - Clean text-only design */}
      {readerArticle && (
        <div 
          className="video-modal-overlay"
          onClick={() => setReaderArticle(null)}
          data-testid="reader-modal"
        >
          <div 
            className="reader-modal-clean glass-panel"
            style={{ width: '640px', maxWidth: '90vw', margin: '0 auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              className="video-modal-close"
              onClick={() => setReaderArticle(null)}
              data-testid="close-reader-btn"
            >
              <X size={20} />
            </button>
            <div className="reader-clean-body">
              <div className="reader-badge">
                <Newspaper size={14} />
                <span>SiriusAnews Reader</span>
              </div>
              <h2 className="reader-title">{readerArticle.title}</h2>
              <div className="reader-source-info">
                <span className="reader-source-label">Source:</span>
                <span className="reader-source-name">{readerArticle.author || 'News Source'}</span>
                {readerArticle.pubDate && (
                  <span className="reader-source-date">
                    {new Date(readerArticle.pubDate).toLocaleString()}
                  </span>
                )}
              </div>
              {readerArticle.link && readerArticle.link !== '#' && (
                <a 
                  href={readerArticle.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="read-full-story-btn"
                  data-testid="read-full-story-btn"
                >
                  <ExternalLink size={16} />
                  READ FULL ARTICLE
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Video Player Modal */}
      {playingVideo && (
        <div 
          className="video-modal-overlay"
          onClick={() => setPlayingVideo(null)}
          data-testid="video-modal"
        >
          <div 
            className="video-modal-content glass-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              className="video-modal-close"
              onClick={() => setPlayingVideo(null)}
              data-testid="close-video-btn"
            >
              <X size={20} />
            </button>
            <div className="video-modal-header">
              <h3 className="text-lg font-semibold">{playingVideo.title}</h3>
              <p className="text-sm text-gray-400">{playingVideo.channel}</p>
            </div>
            <div className="video-iframe-container">
              <iframe
                src={`https://www.youtube.com/embed/${playingVideo.video_id}?autoplay=1`}
                title={playingVideo.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      {/* PayPal QR Code Modal */}
      {showPayPalModal && (
        <div 
          className="video-modal-overlay"
          onClick={() => setShowPayPalModal(false)}
          data-testid="paypal-modal"
        >
          <div 
            className="paypal-modal-content glass-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              className="video-modal-close"
              onClick={() => setShowPayPalModal(false)}
              data-testid="close-paypal-btn"
            >
              <X size={20} />
            </button>
            <div className="paypal-modal-header">
              <Heart size={32} className="paypal-heart" fill="currentColor" />
              <h3 className="text-2xl font-bold">Support SIRIUS AI</h3>
              <p className="text-sm text-gray-400 mt-2">Scan the QR code with your PayPal app to donate</p>
            </div>
            <div className="paypal-qr-container">
              <img 
                src="https://customer-assets.emergentagent.com/job_mystery-globe/artifacts/bqyui4y3_qr-code.png"
                alt="PayPal QR Code"
                className="paypal-qr-code"
              />
            </div>
            <p className="text-center text-xs text-gray-500 mt-4">
              Your support helps keep SIRIUS AI exploring the unknown
            </p>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
