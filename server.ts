import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function buildMealBuddyFallback(payload: {
  message?: string;
  vegOnly?: boolean;
  examMode?: boolean;
  creditsLeft?: number;
}) {
  const msg = (payload.message || '').toLowerCase();
  const isVeg = payload.vegOnly;
  if (msg.includes('protein') || msg.includes('gym')) {
    return isVeg
      ? 'For high protein near DBS Global University, head to **Healthy Bowl Kitchen** (0.85 km, 5.0★ Hygiene) for their **Roasted Paneer & Spiced Chickpea Millet Bowl** (1 CampusCrave credit, ~32g protein) or **Pahadi Rasoi Dhaba** for Double Dal Tadka + Curd.'
      : 'For high protein, try **Healthy Bowl Kitchen** (0.85 km) for the **Grilled Chicken / Roasted Paneer Protein Bowl** (1 credit, ~38g protein) or **Tandoor Junction** for Chicken Tikka + 2 Tandoori Rotis.';
  }
  if (msg.includes('late') || msg.includes('study') || msg.includes('night') || payload.examMode) {
    return 'Exam-week brain fuel! **Chai & Parantha Point** (0.15 km from Selakui gate) stays open till 11:30 PM — grab **2 Aloo Pyaz Paranthas + Adrak Chai** for 1 credit (₹48 partner value vs ₹190 on delivery apps). Light, hot, and zero delivery wait.';
  }
  if (msg.includes('cheap') || msg.includes('filling') || msg.includes('budget')) {
    return 'Best value-for-stomach pick today: **Pahadi Rasoi Dhaba** (0.35 km) — **Pahadi Rajma Chawal + 2 Butter Rotis + Mint Chutney** (1 credit). It keeps you full for 6 hours and saves you ~₹145 compared to ordering a thali on Zomato/Swiggy.';
  }
  return `You have **${payload.creditsLeft ?? 18} meal credits** left! Today's top verified match is **South Spice Corner** (0.50 km, 4.9★ Hygiene) for **Crispy Masala Dosa + Sambar + Coconut Chutney** (1 credit, low rush right now), or **Campus Café** for a quick Veg Paneer Wrap between lectures.`;
}

function buildWeeklyPlanFallback(vegOnly?: boolean) {
  return [
    {
      day: 'Monday',
      lunch: { eatery: 'Pahadi Rasoi Dhaba', dish: 'Pahadi Rajma Chawal & Mint Chutney', credits: 1, tag: 'Filling' },
      dinner: { eatery: 'South Spice Corner', dish: 'Crispy Masala Dosa + Sambar', credits: 1, tag: 'Light & Crisp' },
    },
    {
      day: 'Tuesday',
      lunch: { eatery: 'Healthy Bowl Kitchen', dish: vegOnly ? 'Roasted Paneer Millet Bowl' : 'Herb Chicken & Chickpea Bowl', credits: 1, tag: 'High Protein' },
      dinner: { eatery: 'Chai & Parantha Point', dish: '2 Gobhi Paranthas + Curd', credits: 1, tag: 'Comfort' },
    },
    {
      day: 'Wednesday',
      lunch: { eatery: 'Campus Café', dish: 'Grilled Paneer Tikka Wrap + Lemon Iced Tea', credits: 1, tag: 'Quick Break' },
      dinner: { eatery: 'Tandoor Junction', dish: 'Dal Makhani + 2 Butter Rotis', credits: 1, tag: 'Rich & Warm' },
    },
    {
      day: 'Thursday',
      lunch: { eatery: 'South Spice Corner', dish: 'Idli Vada Combo + Filter Coffee', credits: 1, tag: 'Gut-Friendly' },
      dinner: { eatery: 'Pahadi Rasoi Dhaba', dish: 'Kadhi Pakora Chawal Thali', credits: 1, tag: 'Homestyle' },
    },
    {
      day: 'Friday',
      lunch: { eatery: 'Tandoor Junction', dish: vegOnly ? 'Paneer Lababdar Mini Thali' : 'Chicken Curry + 2 Tandoori Rotis', credits: 1, tag: 'Friday Treat' },
      dinner: { eatery: 'Campus Café', dish: 'Masala Maggi + Cold Coffee', credits: 1, tag: 'Light' },
    },
    {
      day: 'Saturday',
      lunch: { eatery: 'Healthy Bowl Kitchen', dish: 'Quinoa Sprout & Paneer Salad', credits: 1, tag: 'Clean Fuel' },
      dinner: { eatery: 'Pahadi Rasoi Dhaba', dish: 'Aloo Jeera + Dal Fry + 3 Rotis', credits: 1, tag: 'Balanced' },
    },
    {
      day: 'Sunday',
      lunch: { eatery: 'Tandoor Junction', dish: 'Sunday Special Amritsari Kulcha Thali', credits: 1, tag: 'Weekend Special' },
      dinner: { eatery: 'Chai & Parantha Point', dish: 'Mix Veg Parantha + Adrak Chai', credits: 1, tag: 'Study Prep' },
    },
  ];
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'CampusCrave API' });
  });

  app.post('/api/ai/meal-buddy', async (req, res) => {
    const {
      message = '',
      studentName = 'Student',
      vegOnly = false,
      examMode = false,
      creditsLeft = 18,
      monthlyBudget = 2000,
      eateriesSummary = [],
    } = req.body || {};

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        reply: buildMealBuddyFallback({ message, vegOnly, examMode, creditsLeft }),
        source: 'smart-fallback',
      });
    }

    try {
      const systemInstruction = `You are CampusCrave Meal Buddy, a friendly, practical food advisor for hostel and PG students near DBS Global University in Selakui, Dehradun.
Keep responses crisp (under 90 words), grounded in the provided verified partner eateries near campus, and highlight savings vs ₹150-250 Zomato/Swiggy orders (CampusCrave is ₹50-55/meal, zero delivery/platform fees).
Respect dietary preference: ${vegOnly ? 'STRICTLY VEGETARIAN ONLY' : 'Veg & Non-Veg allowed'}.
Exam-week mode: ${examMode ? 'ON (prioritize brain fuel, warm comfort, late-night energy, light digestion)' : 'OFF'}.
Student: ${studentName}, Credits remaining: ${creditsLeft}, Monthly food budget goal: ₹${monthlyBudget}.`;

      const prompt = `Partner eateries & today's specials near DBS Global University, Selakui:
${JSON.stringify(eateriesSummary)}

Student asks: "${message}"
Recommend 1-2 specific dishes from these partner eateries with distance, hygiene rating, and why it fits their request.`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction,
        },
      });

      const reply = response.text?.trim();
      if (!reply) {
        throw new Error('Empty response from Gemini');
      }
      return res.json({ reply, source: 'gemini' });
    } catch (err) {
      console.error('Gemini meal-buddy error:', err);
      return res.json({
        reply: buildMealBuddyFallback({ message, vegOnly, examMode, creditsLeft }),
        source: 'smart-fallback',
      });
    }
  });

  app.post('/api/ai/weekly-plan', async (req, res) => {
    const {
      vegOnly = false,
      examMode = false,
      creditsLeft = 18,
      monthlyBudget = 2000,
      eateriesSummary = [],
    } = req.body || {};

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        plan: buildWeeklyPlanFallback(vegOnly),
        summary: `7-day balanced Selakui meal plan using 14 credits (~₹740 partner value, saving ~₹1,990 vs delivery apps).`,
        source: 'smart-fallback',
      });
    }

    try {
      const prompt = `Create a 7-day (Monday to Sunday) Lunch + Dinner CampusCrave meal plan for a student near DBS Global University, Selakui, Dehradun.
Rules:
- Use ONLY the listed partner eateries and realistic dishes from their menus.
- Dietary rule: ${vegOnly ? 'STRICTLY VEGETARIAN ONLY' : 'Balanced mix of Veg & Non-Veg'}.
- Exam-week mode: ${examMode ? 'ON (include high-focus, light-digestion, comforting dinners)' : 'OFF'}.
- Student has ${creditsLeft} credits and monthly budget goal ₹${monthlyBudget}.
Partner eateries: ${JSON.stringify(eateriesSummary)}`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              plan: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    day: { type: Type.STRING },
                    lunch: {
                      type: Type.OBJECT,
                      properties: {
                        eatery: { type: Type.STRING },
                        dish: { type: Type.STRING },
                        credits: { type: Type.INTEGER },
                        tag: { type: Type.STRING },
                      },
                    },
                    dinner: {
                      type: Type.OBJECT,
                      properties: {
                        eatery: { type: Type.STRING },
                        dish: { type: Type.STRING },
                        credits: { type: Type.INTEGER },
                        tag: { type: Type.STRING },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      const raw = (response.text || '').trim();
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed.plan) || parsed.plan.length === 0) {
        throw new Error('Malformed weekly plan JSON');
      }
      return res.json({
        plan: parsed.plan,
        summary: parsed.summary || '7-day AI meal plan tailored for DBS Global University.',
        source: 'gemini',
      });
    } catch (err) {
      console.error('Gemini weekly-plan error:', err);
      return res.json({
        plan: buildWeeklyPlanFallback(vegOnly),
        summary: `7-day balanced Selakui meal plan using 14 credits (~₹740 partner value, saving ~₹1,990 vs delivery apps).`,
        source: 'smart-fallback',
      });
    }
  });

  app.post('/api/ai/admin-insights', async (req, res) => {
    const { kpis, unitEconomics, pilotProgress, scenario } = req.body || {};

    const fallbackInsights = [
      {
        title: 'Push 3-Day ₹199 Trial Pass at First-Year Hostel Gates',
        impact: 'High Impact · Conversion',
        action: `You are at ${pilotProgress?.trialsSold ?? 42}/50 trial passes sold. Run a 48-hour "First-Year Mess Detox" booth outside DBS Hostel Block B to hit 50+ trials and convert 40%+ into ₹1,999 Monthly Passes.`,
      },
      {
        title: 'Shift Lunch Traffic to Off-Peak 1:45 PM – 3:00 PM Window',
        impact: 'Margin + Vendor Retention',
        action: 'Offer a complimentary Masala Chai or extra roti for QR scans after 1:45 PM at Pahadi Rasoi Dhaba and Tandoor Junction to cut peak queue wait times and lower vendor payout cost by ₹3–5/meal.',
      },
      {
        title: 'Activate Roommate Duo Referral Loop Before Exam Week',
        impact: 'CAC Reduction',
        action: `With contribution at ₹${unitEconomics?.contributionPerSale ?? 399}/subscriber, shifting 25% of acquisition to "Refer 3 friends = 1 free meal" drops blended CAC below ₹80 while driving organic hostel word-of-mouth.`,
      },
    ];

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({ insights: fallbackInsights, source: 'smart-fallback' });
    }

    try {
      const prompt = `Analyze these live CampusCrave pilot & unit economics metrics for DBS Global University, Selakui, Dehradun and return 3 concrete, actionable founder growth recommendations:
KPIs: ${JSON.stringify(kpis)}
Scenario (${scenario}): ${JSON.stringify(unitEconomics)}
Pilot Targets: ${JSON.stringify(pilotProgress)}`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                impact: { type: Type.STRING },
                action: { type: Type.STRING },
              },
            },
          },
        },
      });

      const parsed = JSON.parse((response.text || '[]').trim());
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('Empty admin insights');
      }
      return res.json({ insights: parsed, source: 'gemini' });
    } catch (err) {
      console.error('Gemini admin-insights error:', err);
      return res.json({ insights: fallbackInsights, source: 'smart-fallback' });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CampusCrave server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
