import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from '@google/genai';
import { google } from 'googleapis';

const ai = new GoogleGenAI({});

async function startServer() {
  const app = express();

  app.use(express.json());

  app.post("/api/chat", async (req, res) => {
    try {
      const { message } = req.body;
      let calendarStatus = "Processing...";

      // 🕵️‍♂️ 1. BULLETPROOF AUTHENTICATION BLOCK
      let authClient;
      let calendar;
      try {
        const rawSecret = process.env.GOOGLE_CREDENTIALS || '{}';
        const credentials = JSON.parse(rawSecret);

        // Force exactly correct newline formatting for the PEM key
        let safeKey = credentials.private_key || '';
        safeKey = safeKey.split('\\n').join('\n');

        const auth = new google.auth.GoogleAuth({
          credentials: {
            client_email: credentials.client_email,
            private_key: safeKey,
          },
          scopes: ['https://www.googleapis.com/auth/calendar.events'],
        });
        
        authClient = await auth.getClient();
        calendar = google.calendar({ version: 'v3', auth: authClient as any });
      } catch (authError: any) {
        console.error("Critical Auth Setup Error:", authError);
        calendarStatus = "Failed to configure Google Auth. Check Secret JSON.";
      }

      // 📅 2. FETCH EVENTS (Fails gracefully if Auth is broken)
      let busySchedule = "User has no upcoming events.";
      if (calendar) {
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        try {
          const eventsRes = await calendar.events.list({
            calendarId: 'therajsharma.20@gmail.com',
            timeMin: now.toISOString(),
            timeMax: tomorrow.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
          });
          const events = eventsRes.data.items || [];
          if (events.length > 0) {
            busySchedule = events.map((e: any) => 
              `- ${e.summary}: from ${e.start?.dateTime} to ${e.end?.dateTime}`
            ).join('\n');
          }
        } catch (readError) {
          console.log("Could not read calendar, assuming open schedule.");
        }
      }

      // 🧠 3. GEMINI AI LOGIC (WITH AUTOMATIC OVERLOAD FALLBACK)
      let response: any;
      const fallbackChain = [
        'gemini-3.5-flash',      // First choice: The newest frontier model
        'gemini-3.1-flash-lite', // Backup 1: The ultra-fast, high-volume workhorse
        'gemini-2.5-flash'       // Backup 2: The stable, older generation
      ];
      
      for (const currentModel of fallbackChain) {
        try {
          console.log(`Attempting generation with: ${currentModel}...`);
          response = await ai.models.generateContent({
            model: currentModel, 
            contents: message,
            config: {
              systemInstruction: `You are an elite, proactive productivity assistant. Your goal is to ensure the user never misses a deadline. 
              
              CRITICAL SCHEDULING RULES:
              1. The user's current local time is: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}.
              2. NEVER schedule blocks between 10:00 PM and 8:00 AM.
              3. 🚨 CONFLICT AVOIDANCE: Here is the user's existing schedule for the next 24 hours:\n${busySchedule}\n
              You MUST read this schedule. If your planned focus block overlaps with any of these existing events, you must autonomously search for the next available gap and schedule it there instead. Do NOT double-book the user.
              4. Output start_time and end_time using the explicit Indian Standard Time offset like this: 'YYYY-MM-DDTHH:mm:ss+05:30'. Do NOT use 'Z' (UTC).
              
              CRITICAL RULE - THE BURNOUT PROTOCOL:
              You are an emotion-aware agent. Analyze the user's prompt for signs of high stress, panic, or exhaustion.
              If you detect high stress, you MUST trigger the schedule_productivity_block tool TWICE.
              1. The first block must be a 20-minute "Mandatory Decompression (Walk/Nap)" scheduled immediately.
              2. The second block must be the actual deep-work session, scheduled to start right after the decompression block.`,
              
              temperature: 0.7,
              tools: [{
                functionDeclarations: [
                  {
                    name: "schedule_productivity_block",
                    description: "Call this tool autonomously to schedule focus time.",
                    parameters: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING, description: "Clear title of the focus session" },
                        start_time: { type: Type.STRING, description: "Start time string in ISO format" },
                        end_time: { type: Type.STRING, description: "End time string in ISO format" },
                        priority_level: { type: Type.STRING, description: "'HIGH', 'MEDIUM', or 'CRITICAL'" }
                      },
                      required: ["title", "start_time", "end_time", "priority_level"]
                    }
                  }
                ]
              }]
            }
          });
          
          console.log(`Success! ${currentModel} handled the request.`);
          break; // The request succeeded, break out of the fallback loop!

        } catch (apiError: any) {
          console.warn(`[WARNING] ${currentModel} failed:`, apiError.message);
          
          if (currentModel === fallbackChain[fallbackChain.length - 1]) {
            throw new Error("All backup models are currently overloaded. Please try again in 5 minutes.");
          }
        }
      }

      // 🎯 THE FIX: Safely extract variables AFTER the loop finishes successfully
      const functionCalls = response?.functionCalls || [];
      const responseText = response?.text || "Calendar task processed successfully.";
      
      // ⚡ 4. EXECUTE CALENDAR INJECTION
      if (!calendar) {
         calendarStatus = "Calendar execution failed: Backend container auth handshake dropped.";
      } else {
        for (const call of functionCalls) {
          if (call.name === "schedule_productivity_block") {
            try {
              const result = await calendar.events.insert({
                calendarId: 'therajsharma.20@gmail.com', 
                requestBody: {
                  summary: `🔥 [${call.args.priority_level}] ${call.args.title}`,
                  start: { dateTime: call.args.start_time },
                  end: { dateTime: call.args.end_time },
                  colorId: '11', 
                },
              });
              if (result.data.id) {
                 calendarStatus = "Successfully injected into Google Calendar!";
              }
            } catch (calError: any) {
              console.error("Calendar Write Error:", calError.message);
              calendarStatus = `Calendar execution failed: ${calError.message}`;
            }
          }
        }
      }

      res.json({
        text: responseText,
        functionCalls: functionCalls,
        calendarStatus: calendarStatus
      });

    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message || "Failed to process request" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
  });

}

startServer().catch((err) => console.error(err));
