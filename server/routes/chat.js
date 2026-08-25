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
          image:
            "https://supex-feedback.s3.ap-south-1.amazonaws.com/cookies_and_cream_corn.png",
          packSize: "135 ml",
          mrp: 100,
          description:
            "Crunchy wafer cone filled with rich cookies & cream ice cream, swirled with chocolate cookie crumbles and smooth vanilla ice cream.",
        },
        {
          id: 2,
          name: "Hazelnut Mudslide Cone",
          image:
            "https://supex-feedback.s3.ap-south-1.amazonaws.com/hazelnut-mudslide-cone.png",
          packSize: "135 ml",
          mrp: 100,
          description:
            "Premium hazelnut ice cream in a crispy cone, drizzled with a luxurious chocolate mudslide ripple.",
        },
        {
          id: 3,
          name: "Strawberry Cheesecake Cone",
          image:
            "https://supex-feedback.s3.ap-south-1.amazonaws.com/strawberry-cheesecake-cone.png",
          packSize: "135 ml",
          mrp: 90,
          description:
            "Creamy cheesecake-flavoured ice cream blended with real strawberry pieces in a crunchy waffle cone.",
        },
        {
          id: 4,
          name: "Chillo Dark Chocolate Cone",
          image:
            "https://supex-feedback.s3.ap-south-1.amazonaws.com/chillo-dark-chocolate-cone.png",
          packSize: "135 ml",
          mrp: 90,
          description:
            "Intense dark chocolate ice cream in a crisp cone — bold, bittersweet, topped with chocolate drizzle.",
        },
        {
          id: 5,
          name: "Chillo Kesar Pista Cone",
          image:
            "https://supex-feedback.s3.ap-south-1.amazonaws.com/chillo-kesar-pista-cone.png",
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
          image:
            "https://supex-feedback.s3.ap-south-1.amazonaws.com/aamchi-mango-cup.png",
          packSize: "120 ml",
          mrp: 200,
          description:
            "Bold Alphonso mango flavour — tangy-sweet desi mango experience in every bite.",
        },
        {
          id: 7,
          name: "Belgian Choconut Cup",
          image:
            "https://supex-feedback.s3.ap-south-1.amazonaws.com/belgian-choconut-cup.png",
          packSize: "120 ml",
          mrp: 200,
          description:
            "Premium Belgian chocolate and roasted nuts in a convenient cup. Rich and crunchy.",
        },
        {
          id: 8,
          name: "Blueberry Cheesecake Tub",
          image:
            "https://supex-feedback.s3.ap-south-1.amazonaws.com/blueberry-cheesecake-tub.png",
          packSize: "750 ml",
          mrp: 320,
          description:
            "Velvety cheesecake ice cream swirled with luscious blueberry compote. Café-style dessert.",
        },
        {
          id: 9,
          name: "Hazelnut Mudslide Tub",
          image:
            "https://supex-feedback.s3.ap-south-1.amazonaws.com/hazelnut-mudslide-tub.png",
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
  ]
};

const PAST_ORDERS = {
  "6239565852": {
    "2026-06-25": [
      { item: "Cookies & Cream Cone", qty: 50 },
      { item: "Blueberry Cheesecake Tub", qty: 10 }
    ]
  },
  "9414752000": {
    "2026-06-28": [
      { item: "Mango Candy Bar", qty: 100 },
      { item: "Aamchi Mango Cup", qty: 20 }
    ]
  }
};

const tools = [
  {
    type: "function",
    function: {
      name: "fetch_previous_order",
      description: "Fetches the previous order history of the current user. MUST be called when analyzing a planogram/freezer image to compare their past orders with missing stock.",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  }
];


const SYSTEM_PROMPT = `
You are Hocco AI Field Rep — a smart, friendly sales agent for Hocco Ice Cream (India).
You chat with dealers/distributors directly, just like a trusted local field sales rep would.

YOUR PERSONALITY:
- Talk in Hinglish (natural Hindi + English mix) and match whatever language the user replies in, short WhatsApp-style messages
- Be warm, familiar, and proactive — like a rep who knows the dealer personally
- Use dealer's shop name or mobile number to personalize
- Be patient, never rush, always helpful — available 24/7
- Sound human, not like a bot or a form
- Talk like a real salesperson: PITCH specific items and PROPOSE the order, don't ask open-ended "what would you like to order today?" questions. A real field rep leads with "yeh lelo", "aapka usual bhej doon?", "yeh naya item try karo" — not "aap kya order karna chahenge?"

YOUR OPENING MESSAGE (every fresh conversation MUST follow this structure, 3-4 short lines):
1. Warm greeting using shop name/mobile if known
2. Assumptive pitch — DO NOT ask "what do you want to order". Instead directly propose:
   a. Their FAVOURITE REFILL (their previous order, pre-filled, ready to confirm) if history exists — "Aapka usual order tha: 48x Mango Candy + 24x Kesar Pista Cone. Yehi bhej doon?"
   b. If no history, pitch a bestseller directly — "Cookies & Cream Cone abhi sabse zyada bik raha hai, isko try karo"
3. Ask them to snap/upload their freezer photo so you can check the planogram and tell them exactly what's missing — frame this as you doing the work for them, not a request: "Freezer ka ek photo bhej do, main dekh ke bata deta hoon kya kya khatam hone wala hai"
4. End with an easy yes/no style close, not an open question — e.g. "Confirm karoon?" / "Bhej doon?" instead of "Kya order karna hai?"

YOUR CORE JOBS:
1. PROACTIVE ENGAGEMENT — Greet warmly, then immediately pitch: previous order (favourite refill) OR bestseller, and push them to upload a freezer/inventory photo so you can analyze the planogram and suggest a restock plan. Always propose something concrete — never leave the first move to the dealer.
2. ORDER BUILDING — Help dealer add items to order, maintain a running cart in the conversation. Proactively suggest quantities/items rather than only waiting for the dealer to name them.
3. UPSELLING — After initial order, suggest new/trending/seasonal flavors at the right moment — pitch them directly ("Mango season chal raha hai, 24 more Mango Candy add kar loon?") instead of asking generically if they want anything else.
4. PLANOGRAM INTELLIGENCE — If dealer sends a freezer photo, analyze stock shelf by shelf, identify what's missing from Hocco catalog, and directly suggest reorder quantities as a ready-to-confirm proposal.
5. ORDER SUMMARY — Before confirming, show a clean itemized summary (product, qty, pack size, price, total, discount)
6. ORDER CONFIRMATION — Give a mock order number (e.g. #HC-XXXX) and estimated delivery time
7. TRACKING SUPPORT — Answer "where is my order?" with a friendly status update

FAVOURITE REFILLS:
If the dealer has ordered before (check message history), ALWAYS open with their usual items pre-suggested as "Favourite Refills" — framed as a ready order to confirm, not a menu to browse: "Wahi usual bhej doon?"

Hocco Ice Cream Catalog:
${JSON.stringify(HOCCO_CATALOG, null, 2)}

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
- MUST CALL the fetch_previous_order tool to get their past order history. Directly propose restocking missing items from their past order (as a ready order, e.g. "Yeh 3 items khatam ho rahe hain, inhe order mein add kar doon?"). If they have no previous order, pitch famous items (e.g., Cookies & Cream Cone, Mango Candy Bar) the same assumptive way.
- Add missing items to cart if dealer agrees

EXAMPLE TONE:
"Raj bhai! 🙏 Garmi mein cones tezi se bik rahe hain — aapka usual order tha: 48x Mango Candy + 24x Kesar Pista Cone, wahi bhej doon?
200+ units par abhi 10% off bhi chal raha hai. Aur ek freezer photo bhej do, main dekh ke bata deta hoon kya kya kam hai. Confirm karoon? 😊"

RULES:
- Never make up products outside the catalog
- Never ask generic open-ended questions like "aap kya order karna chahenge?" — always propose a specific item/quantity and ask for a yes/no confirm
- Always end with a follow-up question, but make it a confirm-style close, not an open one
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
  const { mobile, message, image } = req.body;

  if (!sessions[mobile]) {
    return res
      .status(404)
      .json({ error: "Session not found. Please login again." });
  }

  const session = sessions[mobile];

  // Add user message to history
  if (image) {
    const content = [];
    if (message) content.push({ type: "text", text: message });
    else content.push({ type: "text", text: "Please analyze this image." });
    
    content.push({ type: "image_url", image_url: { url: image } });
    
    session.messages.push({ role: "user", content });
  } else {
    session.messages.push({ role: "user", content: message });
  }

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    let stream = await openai.chat.completions.create({
      model: "gpt-4o",
      stream: true,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...session.messages,
      ],
      tools: tools
    });

    let initialResponse = "";
    let toolCallId = "";
    let functionName = "";
    let functionArgs = "";

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (delta?.tool_calls) {
        if (delta.tool_calls[0].id) toolCallId = delta.tool_calls[0].id;
        if (delta.tool_calls[0].function?.name) functionName = delta.tool_calls[0].function.name;
        if (delta.tool_calls[0].function?.arguments) functionArgs += delta.tool_calls[0].function.arguments;
      }
      const text = delta?.content || "";
      if (text) {
        initialResponse += text;
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    if (functionName === "fetch_previous_order") {
      session.messages.push({
        role: "assistant",
        content: initialResponse || null,
        tool_calls: [{ id: toolCallId, type: "function", function: { name: functionName, arguments: functionArgs } }]
      });

      const pastOrder = PAST_ORDERS[mobile];
      const toolResult = pastOrder 
        ? `PREVIOUS ORDER HISTORY:\n${JSON.stringify(pastOrder, null, 2)}`
        : "No previous orders found.";

      session.messages.push({
        role: "tool",
        tool_call_id: toolCallId,
        name: functionName,
        content: toolResult
      });

      stream = await openai.chat.completions.create({
        model: "gpt-4o",
        stream: true,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...session.messages,
        ]
      });

      let finalResponse = "";
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || "";
        if (text) {
          finalResponse += text;
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      }
      session.messages.push({ role: "assistant", content: finalResponse });
    } else {
      session.messages.push({ role: "assistant", content: initialResponse });
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    console.error(err);
    res.write(`data: ${JSON.stringify({ error: "Something went wrong" })}\n\n`);
    res.end();
  }
});

export default router;
