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
      
      // Track the active model for the frontend
      let usedModel = "gemini-3.5-flash"; 
      
      let busySchedule = "User has no upcoming events in the next 24 hours.";
      let upcomingContext = "No immediate events found.";

      // 🕵️‍♂️ 1. AUTHENTICATION
      let authClient;
      let calendar;
      try {
        const rawSecret = process.env.GOOGLE_CREDENTIALS || '{}';
        const credentials = JSON.parse(rawSecret);
        let safeKey = credentials.private_key?.split('\\n').join('\n') || '';

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
        console.error("Auth Setup Error:", authError);
      }

      // 🕵 2. CONTEXT FETCHING
      if (calendar) {
        try {
          const now = new Date();
          const dayAhead = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          const twoHoursAhead = new Date(now.getTime() + 2 * 60 * 60 * 1000);

          const [events24h, events2h] = await Promise.all([
            calendar.events.list({ calendarId: 'therajsharma.20@gmail.com', timeMin: now.toISOString(), timeMax: dayAhead.toISOString(), singleEvents: true, orderBy: 'startTime' }),
            calendar.events.list({ calendarId: 'therajsharma.20@gmail.com', timeMin: now.toISOString(), timeMax: twoHoursAhead.toISOString(), singleEvents: true, orderBy: 'startTime' })
          ]);

          if (events24h.data.items?.length) {
            busySchedule = events24h.data.items.map(e => `- ${e.summary}: ${new Date(e.start?.dateTime!).toLocaleTimeString()}`).join('\n');
          }
          if (events2h.data.items?.length) {
            upcomingContext = events2h.data.items.map(e => `- ${e.summary} at ${new Date(e.start?.dateTime!).toLocaleTimeString()}`).join('\n');
          }
        } catch (e) {
          console.log("Calendar fetch skipped.");
        }
      }

      //  3. GEMINI AI LOGIC
      let response: any;
      const fallbackChain = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-2.5-flash'];
      
      for (const currentModel of fallbackChain) {
        try {
          response = await ai.models.generateContent({
            model: currentModel, 
            contents: message,
            config: {
              systemInstruction: `You are an elite, proactive productivity assistant. 
              
              CRITICAL SCHEDULING RULES:
              1. Local Time: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}.
              2. DO NOT schedule between 10:00 PM and 8:00 AM.
              3. CONFLICT AVOIDANCE: Current 24h schedule:\n${busySchedule}
              4. IMMEDIATE CONTEXT: Upcoming next 2h events:\n${upcomingContext}
              Warn the user if their request clashes with an immediate event.
              5. Output format: 'YYYY-MM-DDTHH:mm:ss+05:30'.
              
              BURNOUT PROTOCOL: If stress is detected, trigger 'schedule_productivity_block' TWICE (Decompression first, then Deep Work).`,
              
              temperature: 0.7,
              tools: [{
                functionDeclarations: [{
                  name: "schedule_productivity_block",
                  description: "Schedule focus time.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      start_time: { type: Type.STRING },
                      end_time: { type: Type.STRING },
                      priority_level: { type: Type.STRING }
                    },
                    required: ["title", "start_time", "end_time", "priority_level"]
                  }
                }]
              }]
            }
          });
          
          //  Mark the successful model
          usedModel = currentModel;
          break;
          
        } catch (e) { 
          console.warn(`[WARNING] ${currentModel} failed, trying next...`);
          continue; 
        }
      }

      // ⚡ 4. EXECUTION
      const functionCalls = response?.functionCalls || [];
      if (calendar && functionCalls.length > 0) {
        for (const call of functionCalls) {
          if (call.name === "schedule_productivity_block") {
            try {
              await calendar.events.insert({
                calendarId: 'therajsharma.20@gmail.com', 
                requestBody: {
                  summary: ` [${call.args.priority_level}] ${call.args.title}`,
                  start: { dateTime: call.args.start_time },
                  end: { dateTime: call.args.end_time },
                  colorId: '11', 
                },
              });
              calendarStatus = "Successfully injected into Google Calendar!";
            } catch (e) { calendarStatus = "Calendar write error."; }
          }
        }
      }

      // Return the tracked model to the frontend UI
      res.json({ 
        text: response?.text || "Task processed.", 
        functionCalls, 
        calendarStatus,
        modelUsed: usedModel 
      });
      
    } catch (error: any) {
      console.error("Server Error:", error);
      res.status(500).json({ error: error.message });
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
  app.listen(PORT, '0.0.0.0', () => console.log(`Server running on ${PORT}`));
}

startServer().catch((err) => console.error(err));
