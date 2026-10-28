import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

    // 1. Forward request to FastAPI backend (which runs Safety Interceptor, Gemini & Groq fallback)
    try {
      const backendRes = await fetch(`${backendUrl}/v1/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000),
      });

      if (backendRes.ok) {
        const data = await backendRes.json();
        return NextResponse.json(data, { status: 200 });
      }
    } catch (e) {
      console.warn("Backend chat endpoint unreachable, checking frontend LLM / dynamic engine:", e);
    }

    // 2. High-availability crisis detection
    const cleanMsg = (body.message || "").toLowerCase();
    const isCrisis = /\b(suicide|kill\s*myself|end\s*my\s*life|want\s*to\s*die|self[-\s]?harm|marne\s*ka\s*mann|jaan\s*de|aatmhatya|kudkushi)\b/i.test(cleanMsg);
    const isListen = body.mode === "listen";
    const lang = body.language_preference || "Hinglish";
    const convId = body.conversation_id || crypto.randomUUID();

    const verifiedHelplines = [
      {
        name: "Tele-MANAS (Govt. of India)",
        number: "14416",
        toll_free_alt: "1800-891-4416",
        description: "Ministry of Health & Family Welfare 24/7 Mental Health Helpline (20+ Indian Languages)",
        type: "crisis_mental_health",
        availability: "24/7 Free & Confidential",
      },
      {
        name: "National Emergency Number",
        number: "112",
        toll_free_alt: "112",
        description: "Immediate All-in-one Emergency Dispatch (Police, Medical, Immediate Physical Safety)",
        type: "immediate_emergency",
        availability: "24/7 Immediate Dispatch",
      },
      {
        name: "KIRAN Helpline",
        number: "1800-599-0019",
        toll_free_alt: "1800-599-0019",
        description: "National Mental Health Support Helpline (DEPwD)",
        type: "crisis_mental_health",
        availability: "24/7 Free & Confidential",
      },
      {
        name: "Vandrevala Foundation",
        number: "+91 9999 666 555",
        toll_free_alt: "+91 9999 666 555",
        description: "Free 24/7 Crisis Counseling Support",
        type: "counseling_helpline",
        availability: "24/7 Free & Confidential",
      },
    ];

    if (isCrisis) {
      const crisisText =
        lang === "Hindi"
          ? "मैं समझ सकता हूँ कि आप इस समय बहुत गहरे दर्द से गुजर रहे हैं। आपकी सुरक्षा सबसे महत्वपूर्ण है और आप अकेले नहीं हैं। कृपया तुरंत नीचे दिए गए निःशुल्क 24/7 हेल्पलाइन नंबरों पर बात करें:"
          : lang === "Hinglish"
          ? "Main sun raha hoon aur aap jo dard mehsoos kar rahe hain, use main deeply acknowledge karta hoon. Aapki suraksha sabse pehle aati hai aur aap akele nahi hain. Kripya turant niche diye gaye 24/7 verified helplines par connect karein:"
          : "I hear how much deep pain you are carrying right now. Your safety matters deeply, and you do not have to carry this alone. Please reach out immediately to these free, confidential 24/7 crisis support helplines:";

      return NextResponse.json(
        {
          conversation_id: convId,
          reply: crisisText,
          mode: body.mode || "listen",
          tentative_tags: [
            {
              category: "acute_crisis",
              display_label: "Acute Crisis Support",
              tentative_flag: false,
              confidence: 1.0,
              user_confirmed: true,
            },
          ],
          safety_alert: true,
          resources: verifiedHelplines.map((h) => `${h.name}: ${h.number} (${h.availability})`),
          helpline_details: verifiedHelplines,
          model_used: "deterministic-safety-interceptor",
        },
        { status: 200 }
      );
    }

    // 3. Check for Groq API direct call if GROQ_API_KEY is available in frontend env
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey && !groqKey.startsWith("your-")) {
      try {
        const groqModel = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
        const emotionalContextSnippet = body.emotional_context
          ? `\nReal-Time Consented Facial Affect & Liveness Insight: ${body.emotional_context}\nAttune your empathy, pacing, and tone to this affective state naturally without robotic meta-commentary.`
          : "";
        const systemPrompt = `You are 'Inearly', a warm, confidential, culturally sensitive AI mental wellness companion tailored for India.
Active Mode: ${isListen ? "'Just Listen' (validate emotions, acknowledge specific pain points, no unsolicited advice, 1 gentle question)" : "'Help Me Plan' (empathetic validation, exactly 1-2 realistic coping micro-steps, collaborative check-in)"}.
Language: Respond naturally in '${lang}'. Actively address the user's specific struggle (e.g. career fear, heartbreak, exams, family pressure) without looping repetitive canned phrases.${emotionalContextSnippet}`;

        const recentHistory = Array.isArray(body.history) ? body.history.slice(-8) : [];
        const groqMessages = [
          { role: "system", content: systemPrompt },
          ...recentHistory.map((h: { role: string; content: string }) => ({
            role: h.role === "user" ? "user" : "assistant",
            content: h.content,
          })),
          { role: "user", content: body.message },
        ];

        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: groqModel,
            messages: groqMessages,
            temperature: 0.72,
            max_tokens: 650,
          }),
          signal: AbortSignal.timeout(8000),
        });

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          const groqText = groqData.choices?.[0]?.message?.content?.trim();
          if (groqText && groqText.length > 10) {
            return NextResponse.json({
              conversation_id: convId,
              reply: groqText,
              mode: body.mode || "listen",
              tentative_tags: [
                {
                  category: "general_overwhelm",
                  display_label: "Emotional Support",
                  tentative_flag: true,
                  confidence: 0.85,
                  user_confirmed: false,
                },
              ],
              safety_alert: false,
              resources: [],
              helpline_details: [],
              model_used: `groq-${groqModel}`,
            });
          }
        }
      } catch (e) {
        console.warn("Direct Groq API fallback in Next.js route failed:", e);
      }
    }

    // 4. Dynamic Contextual Empathy Engine (Non-repetitive, topic-aware fallback)
    let priorContext = "";
    if (Array.isArray(body.history) && body.history.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const priorUserMsgs = body.history
        .filter((h: any) => h.role === "user")
        .map((h: any) => (h.content || "").toLowerCase());

      const lastUserMsg = priorUserMsgs[priorUserMsgs.length - 1] || "";
      if (lastUserMsg.includes("exam") || lastUserMsg.includes("padhai") || lastUserMsg.includes("syllabus")) {
        priorContext = "exams & academic pressure";
      } else if (lastUserMsg.includes("career") || lastUserMsg.includes("job") || lastUserMsg.includes("placement")) {
        priorContext = "career uncertainty";
      } else if (lastUserMsg.includes("breakup") || lastUserMsg.includes("heartbreak") || lastUserMsg.includes("ex")) {
        priorContext = "heartbreak and relationship grief";
      } else if (lastUserMsg.includes("sleep") || lastUserMsg.includes("neend") || lastUserMsg.includes("night")) {
        priorContext = "sleep difficulties and overthinking";
      } else if (lastUserMsg.includes("family") || lastUserMsg.includes("parents") || lastUserMsg.includes("gharwale")) {
        priorContext = "family expectations";
      }
    }

    const bridgeHi = priorContext ? `जैसा कि आपने पहले ${priorContext} का जिक्र किया था, ` : "";
    const bridgeHing = priorContext ? `Earlier aapne ${priorContext} share kiya tha—` : "";
    const bridgeEn = priorContext ? `Connecting back to what you mentioned about ${priorContext}, ` : "";

    let reply = "";
    let detectedCategory = "general_overwhelm";
    let detectedLabel = "General Overwhelm";

    // --- THEME: HEARTBREAK & RELATIONSHIPS ---
    if (/\b(breakup|broke up|heartbreak|ex|ghosted|cheated|dumped|chhod|dil toot)\b/i.test(cleanMsg)) {
      detectedCategory = "heartbreak_grief";
      detectedLabel = "Heartbreak & Grief";
      if (isListen) {
        if (lang === "Hindi") {
          reply = `${bridgeHi}किसी अपने से अचानक दूरी बन जाना एक गहरा खालीपन छोड़ जाता है। ऐसा लगता है जैसे मन भीतर से टूट गया हो। इस वक्त आपको सबसे ज्यादा क्या बात परेशान कर रही है?`;
        } else if (lang === "Hinglish") {
          reply = `${bridgeHing}breakup aur heartbreak ka dard sach mein bohot personal aur heavy hota hai. Ek taraf memories ka storm hota hai aur dusri taraf sudden silence. Dil par jo guzar rahi hai, bina filter ke share kar sakte hain—sabse zyada kya hurt kar raha hai?`;
        } else {
          reply = `${bridgeEn}heartbreak has a way of turning everything upside down. The sudden silence and the weight of memories can feel physically exhausting. I'm right here with you—what part of this feels heaviest right now?`;
        }
      } else {
        if (lang === "Hinglish") {
          reply = `${bridgeHing}dil tootne ke dard mein ek saath sab theek nahi hota, par hum 2 gentle micro-steps le sakte hain:\n\n1. Emotional Release (Unsent Note): 5 minute ke liye kisi private blank note par jo bhi gussa, dard ya baatein adhuri reh gayi hain, bina filter ke likh daaliye.\n2. Somatic Pause (Cold Water Reset): Apne chehre par thanda paani splash karein taaki emotional adrenaline calm ho sake.\n\nKya yeh pehla chhota step try karna doable lag raha hai?`;
        } else {
          reply = `${bridgeEn}healing takes patience, but we can take 2 gentle, low-pressure micro-actions:\n\n1. 5-Minute Unsent Note: Pour out whatever unresolved feelings or hurt are looping in your head onto a blank page, then set it aside.\n2. Cold Water Reset: Splash cool water on your face to activate your mammalian dive reflex and ease acute emotional tension.\n\nWould it feel alright to take that first tiny step right now?`;
        }
      }
    }
    // --- THEME: CAREER & PLACEMENTS ---
    else if (/\b(career|job|placement|interview|unplaced|unemployed|naukri|resume|layoff|future)\b/i.test(cleanMsg)) {
      detectedCategory = "career_uncertainty";
      detectedLabel = "Career Uncertainty";
      if (isListen) {
        if (lang === "Hinglish") {
          reply = `${bridgeHing}career aur placement season ka constant pressure sach mein mind ko drain kar deta hai. Jab har koi LinkedIn par updates share kar raha ho, to lagta hai hum peeche chhoot rahe hain. Par aapki worth kisi ek job offer se decide nahi hoti. Sabse bada darr kya sataye ja raha hai?`;
        } else if (lang === "Hindi") {
          reply = `${bridgeHi}कैरियर की अनिश्चितता और साथियों के साथ तुलना का यह दबाव सच में बहुत भारी होता है। इस वक्त आपके मन में क्या चल रहा है?`;
        } else {
          reply = `${bridgeEn}career uncertainty and the constant comparison game during hiring seasons can be deeply draining. It makes complete sense that you're feeling on edge. What's the biggest worry on your mind?`;
        }
      } else {
        if (lang === "Hinglish") {
          reply = `${bridgeHing}chaliye career ke is burden ko 2 focused, actionable micro-steps mein break karte hain:\n\n1. The 10-Minute Single Task Box: Pura career ya 50 job openings mat dekhein—bas agle 10 minute mein ek single resume section ya company shortlist par dhyan dein.\n2. Comparison Detox: Agle 4 ghante ke liye professional social feeds band karein taaki comparison loop break ho sake.\n\nKya yeh 10-minute ka focus box try karna comfortable lagega?`;
        } else {
          reply = `${bridgeEn}let's compartmentalize this career stress into 2 manageable actions:\n\n1. The 10-Minute 'One Task' Window: Disregard the overall backlog. Dedicate just 10 minutes to refining one bullet point or reaching out to one contact.\n2. Comparison Detox: Step away from professional social feeds for the next few hours to protect your mental energy.\n\nHow does taking that single 10-minute step feel to you?`;
        }
      }
    }
    // --- THEME: ACADEMICS & EXAMS ---
    else if (/\b(exam|padhai|study|marks|jee|neet|syllabus|cgpa|backlog)\b/i.test(cleanMsg)) {
      detectedCategory = "academic_stress";
      detectedLabel = "Academic & Exam Stress";
      if (isListen) {
        if (lang === "Hinglish") {
          reply = `${bridgeHing}exams aur syllabus ka pahad jaisa load sach mein exhaust kar deta hai. Aisa lagta hai ki chahe kitna bhi padh lo, kuch na kuch baaki reh jata hai. Main yahan sunne ke liye hoon—sabse zyada pressure kis subject ya exam ka hai?`;
        } else {
          reply = `${bridgeEn}academic pressure and exam timelines can make you feel like you're constantly running against the clock. Take a breath—I'm listening. Which part of the preparation is weighing on you most?`;
        }
      } else {
        if (lang === "Hinglish") {
          reply = `${bridgeHing}is academic panic ko todne ke liye 2 practical micro-steps start karte hain:\n\n1. 2-Minute Box Breathing: 4 counts inhale, 4 counts hold, aur 4 counts smooth exhale karein taaki brain ka fight-or-flight mode calm ho sake.\n2. Micro-Portion Rule: Pura syllabus chhod kar sirf agle 15 minute ke liye 1 topic ya 2 pages padhein.\n\nKya hum is 2-minute breathing reset se shuru karein?`;
        } else {
          reply = `${bridgeEn}let's tackle this academic overwhelm with 2 atomic steps:\n\n1. 2-Minute 4-4-4 Pranayama Breathing: Inhale for 4, hold gently for 4, and exhale for 4 to clear brain fog.\n2. The Micro-Portion Rule: Isolate just 1 atomic concept or 2 practice questions for 15 minutes, ignoring the rest of the syllabus.\n\nWould you be open to trying that 2-minute breathing reset first?`;
        }
      }
    }
    // --- GENERAL / VENTING ---
    else {
      if (isListen) {
        if (lang === "Hindi") {
          reply = `${bridgeHi}मैं आपकी बात बहुत आत्मीयता से सुन रहा हूँ। जो कुछ भी आप अपने भीतर दबाए हुए हैं, उसे बाहर आने दीजिए। यहाँ कोई जल्दबाजी और कोई फैसला नहीं है।`;
        } else if (lang === "Hinglish") {
          reply = `${bridgeHing}main aapki baat poore mann se sun raha hoon. Aisi situation mein dil par itna load mehsus hona bilkul natural hai. Aapko yahan strong banne ki zaroorat nahi hai—jo dil mein ho, keh daaliye.`;
        } else {
          reply = `${bridgeEn}it sounds like you are carrying a lot right now. You don't have to put on a brave face here—take all the time and space you need to express what's hurting.`;
        }
      } else {
        if (lang === "Hinglish") {
          reply = `${bridgeHing}chaliye is overthinking aur heavy feeling ko 2 realistic micro-steps mein break karte hain:\n\n1. 2-Minute Somatic Anchor: Apne dono pair zameen par flat rakhein, 3 gehri saansein lein, aur room mein 3 cheezein notice karein.\n2. One Tiny Choice: Agle 15 minute ke liye koi ek basic task karein (jaise paani peena, stretch karna ya screen band karna).\n\nKya aap is pehle chote kadam ko sath mein try karna chahenge?`;
        } else {
          reply = `${bridgeEn}let's ground this overwhelm into 2 simple, manageable micro-actions:\n\n1. 2-Minute Somatic Anchor: Place both feet flat on the floor, take 3 slow diaphragmatic breaths, and name 3 objects you see.\n2. One Atomic Choice: Choose one tiny physical comfort (drinking a glass of water, stretching your shoulders, or dimming harsh screens).\n\nWould it feel okay to pause and try that small grounding breath right now?`;
        }
      }
    }

    return NextResponse.json(
      {
        conversation_id: convId,
        reply,
        mode: body.mode || "listen",
        tentative_tags: [
          {
            category: detectedCategory,
            display_label: detectedLabel,
            tentative_flag: true,
            confidence: 0.85,
            user_confirmed: false,
          },
        ],
        safety_alert: false,
        resources: [],
        helpline_details: [],
        model_used: "inearly-contextual-engine",
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: "Invalid chat payload", details: error?.message },
      { status: 400 }
    );
  }
}
