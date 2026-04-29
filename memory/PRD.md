# Mystery Globe - AI Search Agent for Unexplained Phenomena

## Original Problem Statement
Create a website featuring an AI Search Agent for unexplained phenomena (UFOs, UAPs). Features include:
- 3D Globe that rotates slowly and stops on click
- AI chat that responds and displays dots on the globe at event locations
- User sighting reports stored permanently with yellow glow markers
- Three floating list buttons (UAP/UFO, Anomalous Phenomena, Satellites)
- Black space background with white dots to simulate outer space
- YouTube video bar at bottom

## User Choices
- AI Integration: OpenAI GPT-5.2 with Emergent LLM key
- 3D Globe: react-globe.gl with Three.js
- Satellite Data: Mock/simulated data
- YouTube Videos: Hardcoded for demo (YouTube API key needed for full integration)
- Data Storage: Permanent MongoDB storage

## Architecture

### Backend (FastAPI)
- `/api/chat` - AI conversation with location extraction
- `/api/sightings` - CRUD for UFO/UAP sightings
- `/api/phenomena` - Anomalous phenomena data
- `/api/satellites` - Mock satellite tracking data
- `/api/videos` - YouTube video list

### Frontend (React)
- react-globe.gl for 3D globe
- Glassmorphism UI panels
- Starfield CSS background
- Sonner for toast notifications

### Database (MongoDB)
- `sightings` collection - UFO/UAP/Anomaly reports
- `chat_messages` collection - Chat history
- `videos` collection - Video metadata

## What's Been Implemented (Jan 18, 2026)
- ✅ 3D Interactive Globe with auto-rotation (click to stop)
- ✅ AI Chat with OpenAI GPT-5.2 integration
- ✅ Location extraction from AI responses displayed on globe
- ✅ User sighting report form with coordinates
- ✅ UAP/UFO, Anomalies, Satellites floating panels
- ✅ YouTube video bar at bottom
- ✅ Starfield CSS background
- ✅ Glassmorphism UI design
- ✅ 8 pre-seeded UFO/UAP sightings
- ✅ 6 mock satellites with simulated positions

## P0 Features Remaining
None - Core MVP complete

## P1 Features (Backlog)
- YouTube Data API integration for dynamic video loading
- Real satellite API integration (N2YO or CelesTrak)
- User authentication for personalized sightings
- Globe point clustering for dense areas

## P2 Features (Future)
- Admin panel for managing sightings
- Email notifications for new reports
- Social sharing of sightings
- Mobile-optimized responsive design
