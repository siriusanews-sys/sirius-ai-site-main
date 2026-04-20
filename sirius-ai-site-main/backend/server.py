from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from emergentintegrations.llm.chat import LlmChat, UserMessage
import json
import re
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Store chat sessions
chat_sessions = {}

# ==================== Models ====================

class Sighting(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str  # "ufo", "uap", "anomaly"
    title: str
    description: str
    location: str
    latitude: float
    longitude: float
    date: str
    reported_by: str = "AI Database"
    is_user_reported: bool = False
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SightingCreate(BaseModel):
    type: str
    title: str
    description: str
    location: str
    latitude: float
    longitude: float
    date: str
    reported_by: Optional[str] = "Anonymous User"

class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    role: str  # "user" or "assistant"
    content: str
    extracted_location: Optional[dict] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatRequest(BaseModel):
    session_id: str
    message: str

class Video(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    video_id: str
    title: str
    thumbnail: str
    channel: str
    category: str = "ufo"

class Satellite(BaseModel):
    id: str
    name: str
    norad_id: str
    latitude: float
    longitude: float
    altitude: float  # km
    velocity: float  # km/s
    inclination: float
    period: float  # minutes
    launch_date: str
    country: str

# ==================== Seed Data ====================

SEED_SIGHTINGS = [
    {
        "type": "ufo",
        "title": "Phoenix Lights",
        "description": "Mass UFO sighting over Phoenix, Arizona. Thousands of witnesses reported seeing a V-shaped formation of lights.",
        "location": "Phoenix, Arizona, USA",
        "latitude": 33.4484,
        "longitude": -112.0740,
        "date": "1997-03-13",
        "reported_by": "Multiple Witnesses"
    },
    {
        "type": "ufo",
        "title": "Rendlesham Forest Incident",
        "description": "Series of reported sightings of unexplained lights near RAF Woodbridge, often called Britain's Roswell.",
        "location": "Suffolk, England, UK",
        "latitude": 52.0833,
        "longitude": 1.3833,
        "date": "1980-12-26",
        "reported_by": "USAF Personnel"
    },
    {
        "type": "uap",
        "title": "USS Nimitz Encounter",
        "description": "US Navy pilots encountered a Tic Tac shaped UAP that demonstrated extraordinary flight capabilities.",
        "location": "Pacific Ocean, off San Diego",
        "latitude": 31.5000,
        "longitude": -117.5000,
        "date": "2004-11-14",
        "reported_by": "US Navy"
    },
    {
        "type": "ufo",
        "title": "Belgian UFO Wave",
        "description": "Multiple triangular UFO sightings reported across Belgium, tracked by NATO radar.",
        "location": "Belgium",
        "latitude": 50.5039,
        "longitude": 4.4699,
        "date": "1989-11-29",
        "reported_by": "Belgian Air Force"
    },
    {
        "type": "anomaly",
        "title": "Hessdalen Lights",
        "description": "Unexplained lights observed in the Hessdalen valley, Norway. Phenomenon has been ongoing since 1940s.",
        "location": "Hessdalen, Norway",
        "latitude": 62.8000,
        "longitude": 11.2000,
        "date": "1981-12-01",
        "reported_by": "Project Hessdalen"
    },
    {
        "type": "uap",
        "title": "Aguadilla UAP",
        "description": "Object captured on thermal camera by DHS aircraft, showing object entering water.",
        "location": "Aguadilla, Puerto Rico",
        "latitude": 18.4274,
        "longitude": -67.1540,
        "date": "2013-04-25",
        "reported_by": "DHS"
    },
    {
        "type": "anomaly",
        "title": "Marfa Lights",
        "description": "Mysterious glowing orbs appearing in the desert, observed since the 1880s.",
        "location": "Marfa, Texas, USA",
        "latitude": 30.3097,
        "longitude": -104.0208,
        "date": "1883-01-01",
        "reported_by": "Local Observers"
    },
    {
        "type": "ufo",
        "title": "Ariel School Encounter",
        "description": "62 children reported seeing a landed UFO and alien beings at their school.",
        "location": "Ruwa, Zimbabwe",
        "latitude": -17.9000,
        "longitude": 31.2500,
        "date": "1994-09-16",
        "reported_by": "Ariel School Students"
    },
    {
        "type": "ufo",
        "title": "Atalanti UFO Incident",
        "description": "Documented UFO incident near Megaplatanos, Atalanti, Greece with witness reports of anomalous aerial behavior.",
        "location": "Megaplatanos, Atalanti, Greece",
        "latitude": 38.65,
        "longitude": 23.03,
        "date": "1990-09-02",
        "reported_by": "Regional Witness Reports"
    }
]

SEED_SATELLITES = [
    {"id": "sat-1", "name": "ISS (Zarya)", "norad_id": "25544", "latitude": 51.6435, "longitude": -72.3456, "altitude": 408, "velocity": 7.66, "inclination": 51.6, "period": 92.68, "launch_date": "1998-11-20", "country": "International"},
    {"id": "sat-2", "name": "Hubble Space Telescope", "norad_id": "20580", "latitude": 28.4567, "longitude": 45.2341, "altitude": 547, "velocity": 7.59, "inclination": 28.5, "period": 95.42, "launch_date": "1990-04-24", "country": "USA"},
    {"id": "sat-3", "name": "Starlink-1234", "norad_id": "44713", "latitude": 53.2341, "longitude": -122.5678, "altitude": 550, "velocity": 7.59, "inclination": 53.0, "period": 95.6, "launch_date": "2019-05-24", "country": "USA"},
    {"id": "sat-4", "name": "GOES-16", "norad_id": "41866", "latitude": 0.0, "longitude": -75.2, "altitude": 35786, "velocity": 3.07, "inclination": 0.1, "period": 1436, "launch_date": "2016-11-19", "country": "USA"},
    {"id": "sat-5", "name": "Tiangong", "norad_id": "48274", "latitude": 41.5, "longitude": 88.3, "altitude": 389, "velocity": 7.68, "inclination": 41.5, "period": 91.5, "launch_date": "2021-04-29", "country": "China"},
    {"id": "sat-6", "name": "LANDSAT 9", "norad_id": "49260", "latitude": -12.345, "longitude": 156.789, "altitude": 705, "velocity": 7.5, "inclination": 98.2, "period": 99.0, "launch_date": "2021-09-27", "country": "USA"},
]

SEED_VIDEOS = [
    {"video_id": "PfSXkfV_mhA", "title": "Pentagon UFO Videos: Official Release", "thumbnail": "https://img.youtube.com/vi/PfSXkfV_mhA/mqdefault.jpg", "channel": "CBS News", "category": "ufo"},
    {"video_id": "ZBtMbBPzqHY", "title": "Navy Pilots Describe UFO Encounters", "thumbnail": "https://img.youtube.com/vi/ZBtMbBPzqHY/mqdefault.jpg", "channel": "60 Minutes", "category": "uap"},
    {"video_id": "SKsLK_Na7iw", "title": "UAP Congressional Hearing Highlights", "thumbnail": "https://img.youtube.com/vi/SKsLK_Na7iw/mqdefault.jpg", "channel": "C-SPAN", "category": "uap"},
    {"video_id": "rO_M0hLlJ-Q", "title": "The Rendlesham Forest Incident Documentary", "thumbnail": "https://img.youtube.com/vi/rO_M0hLlJ-Q/mqdefault.jpg", "channel": "History Channel", "category": "documentary"},
    {"video_id": "2TumprpOwHY", "title": "Phoenix Lights: The Full Story", "thumbnail": "https://img.youtube.com/vi/2TumprpOwHY/mqdefault.jpg", "channel": "VICE", "category": "documentary"},
    {"video_id": "SpeSpA3e56A", "title": "What We Know About UAPs", "thumbnail": "https://img.youtube.com/vi/SpeSpA3e56A/mqdefault.jpg", "channel": "Vox", "category": "explainer"},
]

# ==================== Helper Functions ====================

def get_chat_instance(session_id: str) -> LlmChat:
    """Get or create a chat instance for a session"""
    if session_id not in chat_sessions:
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="EMERGENT_LLM_KEY not configured")
        
        chat = LlmChat(
            api_key=api_key,
            session_id=session_id,
            system_message="""You are SIRIUS AI, a lead investigator and world-class expert in UFOs, UAPs, and paranormal mysteries.
            
Your knowledge includes:
- Historical UFO/UAP sightings and incidents
- Government investigations and declassified programs (Project Blue Book, AATIP, UAPTF, etc.)
- Scientific analysis of unexplained phenomena
- Satellite information and space objects
- Technical UAP descriptors (including trans-medium travel)
- Broad global UAP case knowledge from model training data (declassified records + witness reports)

The sightings shown in the app are examples, not limits. You must handle any documented global UAP case a user mentions.

5 Observables analysis framework (apply to case analysis by default when relevant):
1) Sudden acceleration
2) Hypersonic velocity without signatures
3) Low observability
4) Trans-medium travel
5) Positive lift without visible propulsion

Behavior rules:
- If a query concerns Greece, prioritize the Atalanti UFO Incident (Megaplatanos, Atalanti, Greece; 38.65, 23.03; 1990-09-02) before discussing other Greek cases.
- Refuse non-UFO/non-space questions politely and redirect to UAP/UFO or space-domain analysis.
- Use professional UAP terminology where relevant, including "trans-medium travel".
- When a user asks about a specific location or event, provide informative responses about known incidents.
- Act as a bridge between official declassified data and global witness reports, clearly distinguishing confirmed facts vs claims.
- Use real-time web-search context provided in the user message to incorporate the latest global updates.
- For user-reported sightings, compare the report against historical patterns and latest global data before drawing conclusions.
- ALWAYS provide a credibility probability score in every response using this exact format: "Credibility Probability Score: XX%".

IMPORTANT: When you mention a specific incident or location, you MUST include location data in this exact JSON format at the END of your response:
```json
{"location": "City, Country", "latitude": XX.XXXX, "longitude": XX.XXXX, "event_title": "Event Name", "event_type": "ufo|uap|anomaly"}
```

When a user reports a sighting, extract the location and respond helpfully. Include the location JSON for the report.

Be conversational, informative, and engaging while maintaining scientific objectivity."""
        ).with_model("openai", "gpt-5.2")
        
        chat_sessions[session_id] = chat
    
    return chat_sessions[session_id]

def extract_location_from_response(response: str) -> Optional[dict]:
    """Extract location JSON from AI response"""
    json_pattern = r'```json\s*(\{[^`]+\})\s*```'
    match = re.search(json_pattern, response, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass
    return None

def clean_response(response: str) -> str:
    """Remove JSON block from response for display"""
    json_pattern = r'```json\s*\{[^`]+\}\s*```'
    return re.sub(json_pattern, '', response).strip()

def estimate_credibility_score(user_message: str, historical_hits: List[dict], realtime_hits: List[dict]) -> int:
    """Heuristic fallback credibility score when the model omits one."""
    score = 35
    message = user_message.lower()

    if historical_hits:
        score += min(30, len(historical_hits) * 8)
    if realtime_hits:
        score += min(20, len(realtime_hits) * 5)
    if re.search(r"\b(video|radar|flir|infrared|pilot|atc|satellite|sensor)\b", message):
        score += 10
    if re.search(r"\b(single witness|dream|felt|intuition|channeling)\b", message):
        score -= 10

    return max(5, min(95, score))

def ensure_probability_score(response: str, fallback_score: int) -> str:
    """Ensure every response contains a credibility probability score."""
    if re.search(r"credibility probability score\s*:\s*\d{1,3}\s*%", response, re.IGNORECASE):
        return response
    return f"{response.strip()}\n\nCredibility Probability Score: {fallback_score}%"

def build_historical_pattern_context(user_message: str, sightings: List[dict]) -> List[dict]:
    """Find sightings that match location/event keywords from user query."""
    tokens = [t for t in re.findall(r"[a-zA-Z0-9\-]+", user_message.lower()) if len(t) > 3]
    matches = []

    for sighting in sightings:
        searchable = f"{sighting.get('title', '')} {sighting.get('description', '')} {sighting.get('location', '')}".lower()
        score = sum(1 for token in tokens if token in searchable)
        if score > 0:
            matches.append({
                "title": sighting.get("title"),
                "location": sighting.get("location"),
                "date": sighting.get("date"),
                "type": sighting.get("type"),
                "score": score
            })

    matches.sort(key=lambda x: x["score"], reverse=True)
    return matches[:5]

async def search_tavily(query: str, api_key: str) -> List[dict]:
    payload = {
        "query": query,
        "search_depth": "advanced",
        "max_results": 5,
        "topic": "news"
    }
    async with httpx.AsyncClient(timeout=12.0) as client:
        response = await client.post(
            "https://api.tavily.com/search",
            headers={"Content-Type": "application/json"},
            json={**payload, "api_key": api_key}
        )
        response.raise_for_status()
        data = response.json()
    return data.get("results", [])

async def search_serper(query: str, api_key: str) -> List[dict]:
    payload = {
        "q": query,
        "num": 5
    }
    async with httpx.AsyncClient(timeout=12.0) as client:
        response = await client.post(
            "https://google.serper.dev/news",
            headers={
                "X-API-KEY": api_key,
                "Content-Type": "application/json"
            },
            json=payload
        )
        response.raise_for_status()
        data = response.json()
    return data.get("news", [])

async def fetch_realtime_updates(query: str) -> List[dict]:
    """Fetch latest web updates via Tavily or Serper."""
    tavily_key = "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"
    serper_key = os.environ.get("SERPER_API_KEY")

    try:
        if tavily_key:
            results = await search_tavily(query, tavily_key)
            return [
                {
                    "title": item.get("title", ""),
                    "url": item.get("url", ""),
                    "source": item.get("source", "Tavily"),
                    "date": item.get("published_date", ""),
                    "snippet": item.get("content", "")
                }
                for item in results
            ]
        if serper_key:
            results = await search_serper(query, serper_key)
            return [
                {
                    "title": item.get("title", ""),
                    "url": item.get("link", ""),
                    "source": item.get("source", "Serper"),
                    "date": item.get("date", ""),
                    "snippet": item.get("snippet", "")
                }
                for item in results
            ]
    except Exception as e:
        logger.warning(f"Real-time web search failed: {e}")

    return []

def build_investigation_context(user_message: str, historical_hits: List[dict], realtime_hits: List[dict]) -> str:
    """Create context block for lead-investigator style analysis."""
    historical_lines = []
    for hit in historical_hits[:3]:
        historical_lines.append(
            f"- {hit['title']} ({hit['date']}, {hit['location']}, type={hit['type']}, similarity={hit['score']})"
        )

    realtime_lines = []
    for item in realtime_hits[:3]:
        realtime_lines.append(
            f"- {item.get('title', 'Untitled')} | {item.get('source', 'Unknown')} | {item.get('date', 'Unknown date')} | {item.get('url', '')}"
        )

    if not historical_lines:
        historical_lines = ["- No close historical pattern match found in current local database."]
    if not realtime_lines:
        realtime_lines = ["- Real-time search unavailable or no relevant fresh updates found."]

    return (
        "INVESTIGATION BRIEF:\n"
        f"User report/query: {user_message}\n"
        "Historical pattern matches:\n"
        + "\n".join(historical_lines)
        + "\nLatest global updates (real-time web search):\n"
        + "\n".join(realtime_lines)
        + "\nInstructions:\n"
        "- Compare the user case against historical patterns and latest updates.\n"
        "- Distinguish verified facts from claims.\n"
        "- Include a clear credibility assessment with 'Credibility Probability Score: XX%'."
    )

# ==================== Routes ====================

@api_router.get("/")
async def root():
    return {"message": "Mystery Globe API - Exploring the Unknown"}

# ===== Chat Routes =====

@api_router.post("/chat")
async def chat(request: ChatRequest):
    """Process a chat message and return AI response with potential location data"""
    try:
        chat_instance = get_chat_instance(request.session_id)
        
        # Get chat history for context
        history = await db.chat_messages.find(
            {"session_id": request.session_id},
            {"_id": 0}
        ).sort("timestamp", 1).to_list(20)
        
        # Build context from history
        for msg in history:
            if msg["role"] == "user":
                await chat_instance.send_message(UserMessage(text=msg["content"]))
        
        # Build dynamic investigation context (historical + real-time web)
        all_sightings = await db.sightings.find({}, {"_id": 0}).to_list(2000)
        if not all_sightings:
            all_sightings = SEED_SIGHTINGS

        historical_hits = build_historical_pattern_context(request.message, all_sightings)
        realtime_hits = await fetch_realtime_updates(f"UFO UAP paranormal {request.message}")
        context_brief = build_investigation_context(request.message, historical_hits, realtime_hits)

        # Send new message with enriched context
        user_message = UserMessage(text=f"{context_brief}\n\nUSER MESSAGE:\n{request.message}")
        response = await chat_instance.send_message(user_message)
        
        # Extract location if present
        location_data = extract_location_from_response(response)
        clean_text = clean_response(response)
        fallback_score = estimate_credibility_score(request.message, historical_hits, realtime_hits)
        clean_text = ensure_probability_score(clean_text, fallback_score)
        
        # Save user message
        user_msg = ChatMessage(
            session_id=request.session_id,
            role="user",
            content=request.message
        )
        user_doc = user_msg.model_dump()
        user_doc['timestamp'] = user_doc['timestamp'].isoformat()
        await db.chat_messages.insert_one(user_doc)
        
        # Save assistant message
        assistant_msg = ChatMessage(
            session_id=request.session_id,
            role="assistant",
            content=clean_text,
            extracted_location=location_data
        )
        assistant_doc = assistant_msg.model_dump()
        assistant_doc['timestamp'] = assistant_doc['timestamp'].isoformat()
        await db.chat_messages.insert_one(assistant_doc)
        
        return {
            "response": clean_text,
            "location": location_data,
            "session_id": request.session_id
        }
        
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/chat/history/{session_id}")
async def get_chat_history(session_id: str):
    """Get chat history for a session"""
    messages = await db.chat_messages.find(
        {"session_id": session_id},
        {"_id": 0}
    ).sort("timestamp", 1).to_list(100)
    return {"messages": messages}

@api_router.delete("/chat/history/{session_id}")
async def clear_chat_history(session_id: str):
    """Clear chat history for a session"""
    await db.chat_messages.delete_many({"session_id": session_id})
    if session_id in chat_sessions:
        del chat_sessions[session_id]
    return {"message": "Chat history cleared"}

# ===== Sightings Routes =====

@api_router.get("/sightings")
async def get_sightings(type: Optional[str] = None):
    """Get all sightings, optionally filtered by type"""
    query = {}
    if type:
        query["type"] = type
    
    sightings = await db.sightings.find(query, {"_id": 0}).to_list(1000)
    return {"sightings": sightings}

@api_router.post("/sightings")
async def create_sighting(sighting: SightingCreate):
    """Create a new user-reported sighting"""
    sighting_data = sighting.model_dump()
    sighting_data["is_user_reported"] = True
    if not sighting_data.get("reported_by"):
        sighting_data["reported_by"] = "Anonymous User"
    
    sighting_obj = Sighting(**sighting_data)
    
    doc = sighting_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    await db.sightings.insert_one(doc)
    return sighting_obj

@api_router.get("/sightings/{sighting_id}")
async def get_sighting(sighting_id: str):
    """Get a specific sighting"""
    sighting = await db.sightings.find_one({"id": sighting_id}, {"_id": 0})
    if not sighting:
        raise HTTPException(status_code=404, detail="Sighting not found")
    return sighting

# ===== Phenomena Routes =====

@api_router.get("/phenomena")
async def get_phenomena():
    """Get anomalous phenomena (separate from UFO/UAP)"""
    phenomena = await db.sightings.find({"type": "anomaly"}, {"_id": 0}).to_list(1000)
    return {"phenomena": phenomena}

# ===== Satellites Routes =====

@api_router.get("/satellites")
async def get_satellites():
    """Get satellite data (mock data with simulated positions)"""
    import math
    import time
    
    satellites = []
    base_time = time.time()
    
    for sat in SEED_SATELLITES:
        # Simulate orbit motion
        angular_velocity = 360 / (sat["period"] * 60)  # degrees per second
        lon_offset = (base_time * angular_velocity) % 360
        
        sat_copy = sat.copy()
        sat_copy["longitude"] = (sat["longitude"] + lon_offset) % 360 - 180
        sat_copy["latitude"] = sat["latitude"] + 5 * math.sin(base_time / 100 + sat["inclination"])
        satellites.append(sat_copy)
    
    return {"satellites": satellites}

# ===== Videos Routes =====

@api_router.get("/videos")
async def get_videos():
    """Get UFO/UAP related videos"""
    videos = await db.videos.find({}, {"_id": 0}).to_list(100)
    if not videos:
        return {"videos": SEED_VIDEOS}
    return {"videos": videos}

@api_router.post("/videos")
async def add_video(video: Video):
    """Add a new video"""
    doc = video.model_dump()
    await db.videos.insert_one(doc)
    return video

# ===== Database Seeding =====

@api_router.post("/seed")
async def seed_database():
    """Seed the database with initial data"""
    # Check if already seeded
    existing = await db.sightings.count_documents({})
    if existing > 0:
        return {"message": "Database already seeded", "sightings_count": existing}
    
    # Seed sightings
    for sighting_data in SEED_SIGHTINGS:
        sighting = Sighting(**sighting_data)
        doc = sighting.model_dump()
        doc['timestamp'] = doc['timestamp'].isoformat()
        await db.sightings.insert_one(doc)
    
    # Seed videos
    for video_data in SEED_VIDEOS:
        video = Video(**video_data)
        await db.videos.insert_one(video.model_dump())
    
    return {"message": "Database seeded successfully", "sightings_count": len(SEED_SIGHTINGS)}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    """Seed database on startup if empty"""
    try:
        count = await db.sightings.count_documents({})
        if count == 0:
            for sighting_data in SEED_SIGHTINGS:
                sighting = Sighting(**sighting_data)
                doc = sighting.model_dump()
                doc['timestamp'] = doc['timestamp'].isoformat()
                await db.sightings.insert_one(doc)
            logger.info("Database seeded with initial data")
    except Exception as e:
        logger.error(f"Error seeding database: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
