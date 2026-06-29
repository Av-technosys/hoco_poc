import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── In-memory store ───────────────────────────────────────────────
const sessions = {}; // { mobile: { mobile, messages: [] } }

const HOCCO_CATALOG = {
  categories: [
    {
      name: "Ice Cream Cones",
      description: "Crispy wafer cones with creamy premium fillings",
      products: [
        {
          id: 1,
          name: "Cookies & Cream Cone",
          packSize: "135 ml",
          mrp: 100,
          description:
            "Crunchy wafer cone filled with rich cookies & cream ice cream, swirled with chocolate cookie crumbles and smooth vanilla ice cream.",
        },
        {
          id: 2,
          name: "Hazelnut Mudslide Cone",
          packSize: "135 ml",
          mrp: 100,
          description:
            "Premium hazelnut ice cream in a crispy cone, drizzled with a luxurious chocolate mudslide ripple.",
        },
        {
          id: 3,
          name: "Strawberry Cheesecake Cone",
          packSize: "135 ml",
          mrp: 90,
          description:
            "Creamy cheesecake-flavoured ice cream blended with real strawberry pieces in a crunchy waffle cone.",
        },
        {
          id: 4,
          name: "Chillo Dark Chocolate Cone",
          packSize: "135 ml",
          mrp: 90,
          description:
            "Intense dark chocolate ice cream in a crisp cone — bold, bittersweet, topped with chocolate drizzle.",
        },
        {
          id: 5,
          name: "Chillo Kesar Pista Cone",
          packSize: "135 ml",
          mrp: 90,
          description:
            "Aromatic saffron and pistachio ice cream in a crunchy wafer cone. Fragrant and festive.",
        },
      ],
    },
    {
      name: "Cups & Tubs",
      description: "Single-serve cups and family sharing tubs",
      products: [
        {
          id: 6,
          name: "Aamchi Mango Cup",
          packSize: "120 ml",
          mrp: 200,
          description:
            "Bold Alphonso mango flavour — tangy-sweet desi mango experience in every bite.",
        },
        {
          id: 7,
          name: "Belgian Choconut Cup",
          packSize: "120 ml",
          mrp: 200,
          description:
            "Premium Belgian chocolate and roasted nuts in a convenient cup. Rich and crunchy.",
        },
        {
          id: 8,
          name: "Blueberry Cheesecake Tub",
          packSize: "750 ml",
          mrp: 320,
          description:
            "Velvety cheesecake ice cream swirled with luscious blueberry compote. Café-style dessert.",
        },
        {
          id: 9,
          name: "Hazelnut Mudslide Tub",
          packSize: "750 ml",
          mrp: 360,
          description:
            "Creamy hazelnut ice cream layered with rich chocolate mudslide ripples. Perfect family tub.",
        },
        {
          id: 10,
          name: "Kesar Kali Cup",
          packSize: "100 ml",
          mrp: 150,
          description:
            "Saffron-infused cup ice cream enriched with cashews and almonds. Luxuriously smooth.",
        },
      ],
    },
    {
      name: "Candies & Bars",
      description: "Ice cream sticks, bars, and kulfi on a stick",
      products: [
        {
          id: 11,
          name: "Charcoal Lychee Candy",
          packSize: "80 ml",
          mrp: 70,
          description:
            "Exotic lychee flavour with activated charcoal for a dramatic look and refreshing tropical taste.",
        },
        {
          id: 12,
          name: "Death by Chocolate Boss Bar",
          packSize: "90 ml",
          mrp: 65,
          description:
            "Triple-layered chocolate ice cream coated in a thick dark chocolate shell.",
        },
        {
          id: 13,
          name: "Mango Candy Bar",
          packSize: "80 ml",
          mrp: 50,
          description:
            "Smooth creamy mango ice cream on a stick — classic summer sunshine in every lick.",
        },
        {
          id: 14,
          name: "Mini Chocobar",
          packSize: "35 ml",
          mrp: 35,
          description:
            "Bite-sized vanilla ice cream centre in a crisp milk chocolate coating. Nostalgic anytime snack.",
        },
        {
          id: 15,
          name: "Shahi Kulfi",
          packSize: "100 ml",
          mrp: 60,
          description:
            "Traditional kulfi with thickened milk, cardamom, and rose — slow-frozen for authentic dense texture.",
        },
      ],
    },
  ],
  bulkOffers: [
    "Order 100+ units → 5% discount on total bill",
    "Order 200+ units → 10% discount on total bill",
    "Order 500+ units → 15% discount + priority delivery",
    "Free delivery on orders above ₹5000",
    "Mix & match across categories allowed for bulk discount eligibility",
  ],
};

const SYSTEM_PROMPT = `
You are Hocco AI Field Rep — a smart, friendly sales agent for Hocco Ice Cream (India).
You chat with dealers/distributors directly, just like a trusted local field sales rep would.

YOUR PERSONALITY:
- Talk in Hinglish (natural Hindi + English mix), short WhatsApp-style messages
- Be warm, familiar, and proactive — like a rep who knows the dealer personally
- Use dealer's shop name or mobile number to personalize
- Be patient, never rush, always helpful — available 24/7
- Sound human, not like a bot or a form

YOUR CORE JOBS:
1. PROACTIVE ENGAGEMENT — Start conversation, greet with context (season, weather, local demand)
2. ORDER BUILDING — Help dealer add items to order, maintain a running cart in the conversation
3. UPSELLING — After initial order, suggest new/trending/seasonal flavors at the right moment
4. PLANOGRAM INTELLIGENCE — If dealer sends a freezer photo, analyze stock shelf by shelf, identify what's missing from Hocco catalog, suggest reorder quantities
5. ORDER SUMMARY — Before confirming, show a clean itemized summary (product, qty, pack size, price, total, discount)
6. ORDER CONFIRMATION — Give a mock order number (e.g. #HC-XXXX) and estimated delivery time
7. TRACKING SUPPORT — Answer "where is my order?" with a friendly status update

FAVORITE REFILLS:
If the dealer has ordered before (check message history), open with their usual items pre-suggested as "Favourite Refills" so reorder is just one confirmation.

Hocco Ice Cream Catalog:
${JSON.stringify(HOCCO_CATALOG, null, 2)}


BULK OFFERS:
100+ units → 5% off | 200+ units → 10% off | 500+ units → 15% off + priority delivery | Free delivery above ₹5000

CART MANAGEMENT:
- Maintain a running cart throughout the conversation
- When user adds items, confirm: "✅ 48x Mango Candy add kar diye! Cart total: ₹2,400"
- Before checkout show full summary with discount applied

ORDER SUMMARY FORMAT (when dealer confirms):
---
🧾 Order #HC-[random 4 digit number]
[Item] x[Qty] — ₹[subtotal]
...
Subtotal: ₹XXXX
Discount: X% → -₹XXX
Total: ₹XXXX
Delivery: [Free / ₹XX]
ETA: 2-3 business days
---

PLANOGRAM (when dealer sends freezer photo):
- Identify visible Hocco products shelf by shelf
- List what IS in stock
- List what is MISSING from the catalog
- Suggest quantities to reorder based on gaps
- Add missing items to cart if dealer agrees

EXAMPLE TONE:
"Raj bhai! 🙏 Garmi mein cones tezi se bik rahe hain — aaj ka refill bhej doon?
Aapka usual order tha: 48x Mango Candy + 24x Kesar Pista Cone. Wahi confirm karoon? 😊"

RULES:
- Never make up products outside the catalog
- Always end with a follow-up question
- Keep messages short — max 4-5 lines per reply
- Never sound like a form or a bot
`;

// ─── Routes ────────────────────────────────────────────────────────

// Register / start session
router.post("/session/start", (req, res) => {
  const { mobile } = req.body;

  if (!mobile || mobile.length < 10) {
    return res.status(400).json({ error: "Valid mobile number required" });
  }

  if (!sessions[mobile]) {
    sessions[mobile] = { mobile, messages: [] };
  }

  res.json({
    success: true,
    mobile,
    isNew: sessions[mobile].messages.length === 0,
  });
});

// Chat endpoint with SSE streaming
router.post("/chat", async (req, res) => {
  const { mobile, message } = req.body;

  if (!sessions[mobile]) {
    return res
      .status(404)
      .json({ error: "Session not found. Please login again." });
  }

  const session = sessions[mobile];

  // Add user message to history
  session.messages.push({ role: "user", content: message });

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      stream: true,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...session.messages,
      ],
    });

    let fullResponse = "";

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || "";
      if (text) {
        fullResponse += text;
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    // Save assistant response to history
    session.messages.push({ role: "assistant", content: fullResponse });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    console.error(err);
    res.write(`data: ${JSON.stringify({ error: "Something went wrong" })}\n\n`);
    res.end();
  }
});

export default router;
