const GEMINI_MODEL = "gemini-3.5-flash-lite";

// Valid categories & priorities
const VALID_CATEGORIES = [
  "Royalty & Payments",
  "ISBN & Metadata Issues",
  "Printing & Quality",
  "Distribution & Availability",
  "Book Status & Production Updates",
  "General Inquiry",
];

const VALID_PRIORITIES = ["Critical", "High", "Medium", "Low"];

/**
 * Fallback rule-based classifier
 */
export const fallbackClassifier = (subject = "", description = "") => {
  const text = `${subject} ${description}`.toLowerCase();

  let category = "General Inquiry";
  let priority = "Medium";

  if (
    text.includes("royalt") ||
    text.includes("payout") ||
    text.includes("payment") ||
    text.includes("money") ||
    text.includes("bank account") ||
    text.includes("earning") ||
    text.includes("net profit")
  ) {
    category = "Royalty & Payments";
  } else if (
    text.includes("isbn") ||
    text.includes("metadata") ||
    text.includes("imprint") ||
    text.includes("barcode")
  ) {
    category = "ISBN & Metadata Issues";
  } else if (
    text.includes("print") ||
    text.includes("quality") ||
    text.includes("defect") ||
    text.includes("blurry") ||
    text.includes("binding") ||
    text.includes("page") ||
    text.includes("misprint") ||
    text.includes("author copies")
  ) {
    category = "Printing & Quality";
  } else if (
    text.includes("unavailable") ||
    text.includes("out of stock") ||
    text.includes("listing") ||
    text.includes("flipkart") ||
    text.includes("amazon") ||
    text.includes("distribution") ||
    text.includes("store")
  ) {
    category = "Distribution & Availability";
  } else if (
    text.includes("production") ||
    text.includes("typesetting") ||
    text.includes("cover design") ||
    text.includes("proofreading") ||
    text.includes("editing") ||
    text.includes("stage") ||
    text.includes("when will it be published") ||
    text.includes("manuscript")
  ) {
    category = "Book Status & Production Updates";
  }

  if (
    text.includes("haven't received") ||
    text.includes("not received") ||
    text.includes("6 month") ||
    text.includes("months ago") ||
    text.includes("urgent") ||
    text.includes("fraud") ||
    text.includes("legal") ||
    (category === "Royalty & Payments" &&
      (text.includes("never") ||
        text.includes("zero payout") ||
        text.includes("delayed")))
  ) {
    priority = "Critical";
  } else if (
    category === "ISBN & Metadata Issues" ||
    (category === "Printing & Quality" &&
      (text.includes("terrible") ||
        text.includes("damaged") ||
        text.includes("defective"))) ||
    text.includes("wrong book") ||
    text.includes("different isbn")
  ) {
    priority = "High";
  } else if (
    text.includes("bio") ||
    text.includes("author photo") ||
    text.includes("thank you") ||
    text.includes("update description")
  ) {
    priority = "Low";
  } else {
    priority = "Medium";
  }

  return { category, priority };
};

/**
 * Fallback rule-based draft generator
 */
export const fallbackDraftGenerator = ({
  authorName,
  bookTitle,
  subject,
  description,
  category,
  priority,
}) => {
  const firstName = authorName ? authorName.split(" ")[0] : "Author";
  const bookRef =
    bookTitle && bookTitle !== "General / Account Level"
      ? `"${bookTitle}"`
      : "your book";

  if (category === "Royalty & Payments") {
    return `Dear ${firstName},

Thank you for reaching out regarding your royalty query for ${bookRef}. I understand how critical financial transparency is for authors.

As per BookLeaf's author agreement:
• Royalties operate on an 80/20 profit split (80% net author profit share).
• Minimum payout threshold is ₹1,000, processed quarterly within 45 days of the quarter close.
• Payouts are made directly to your registered bank account via NEFT.

I have notified our accounts department to verify your sales statement and bank details. We will provide a complete reconciliation within 24 to 48 hours.

Warm regards,
BookLeaf Author Support Team`;
  }

  if (category === "ISBN & Metadata Issues") {
    return `Dear ${firstName},

Thank you for reporting this ISBN/metadata discrepancy for ${bookRef}. Having accurate bibliographic data across all distribution channels is a top priority.

We have initiated an urgent catalog review to verify the registered ISBN with the National Agency database and trigger an updated metadata feed to external retailers.

We expect this synchronization to be fully reflected within 48 business hours.

Warm regards,
BookLeaf Production & Catalog Support`;
  }

  if (category === "Printing & Quality") {
    return `Dear ${firstName},

We sincerely apologise that your author copies for ${bookRef} arrived with quality defects. BookLeaf guarantees quality benchmarks across all our printing facilities.

If your copies show misprints, faded colors, or binding flaws, BookLeaf provides free replacement reprints. Please attach a few photos showing the issue so our quality assurance team can authorise a reprint order right away.

Warm regards,
BookLeaf Print & Quality Operations`;
  }

  if (category === "Distribution & Availability") {
    return `Dear ${firstName},

Thank you for contacting us regarding the retail availability of ${bookRef}.

When an active title displays as "Currently Unavailable" on Amazon or Flipkart, it typically indicates an automated warehouse inventory re-sync cycle. We have triggered an immediate distribution catalog re-sync with our retail partners, which usually stabilizes within 24–48 hours.

Warm regards,
BookLeaf Distribution Operations`;
  }

  if (category === "Book Status & Production Updates") {
    return `Dear ${firstName},

Thank you for checking in on the production status of ${bookRef}.

Your manuscript is actively being processed by our production team. Standard stages include Editing → Cover Design → Typesetting → Author Proofing → Printing Setup → Live. We will update you on your current stage and next review milestone within 24 hours.

Warm regards,
BookLeaf Publishing Team`;
  }

  return `Dear ${firstName},

Thank you for reaching out to BookLeaf Author Support regarding ${bookRef}.

We have received your query and an operations specialist has been assigned to your ticket. We will review your request and follow up shortly.

Warm regards,
BookLeaf Author Support Team`;
};

/**
 * Call Google Gemini LLM API
 */
const callGeminiApi = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(8000),
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1024,
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `Gemini API HTTP ${response.status}`,
    );
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Empty response from Gemini API");
  }

  return text.trim();
};

/**
 * Auto-classify category and determine priority score using Gemini LLM
 */
export const classifyAndScoreTicket = async (
  subject = "",
  description = "",
) => {
  try {
    const prompt = `You are an AI support classifier for BookLeaf Publishing, an Indian self-publishing platform.
Analyze this author support ticket and classify it into EXACTLY ONE category and assign an urgency priority.

Categories:
- "Royalty & Payments": Unpaid royalties, calculation queries, payment thresholds (₹1,000 min), bank details, 80/20 profit share.
- "ISBN & Metadata Issues": ISBN discrepancies, wrong author name, incorrect book description or cover on retailer platforms.
- "Printing & Quality": Physical book defects, blurry text, cover color mismatch, binding issues, damaged author copies.
- "Distribution & Availability": Book showing "Currently Unavailable" on Amazon/Flipkart, missing retail links, stock re-sync.
- "Book Status & Production Updates": Manuscript status, editing progress, cover design, typesetting, proofing timelines.
- "General Inquiry": Account access, general queries, thank you notes, policy questions.

Priorities:
- "Critical": Long-overdue royalties (>90 days), legal/fraud concerns, complete launch blocker.
- "High": ISBN mismatch, severely defective author copies shipment, book unavailable on launch day.
- "Medium": Standard royalty inquiries, production timeline checks, minor print questions.
- "Low": Minor bio updates, cosmetic adjustments, general feedback.

Ticket Subject: "${subject}"
Ticket Description: "${description}"

Respond ONLY with a valid JSON object with keys "category" and "priority".
Example: {"category": "Royalty & Payments", "priority": "High"}`;

    const rawResponse = await callGeminiApi(prompt);

    // Clean markdown code blocks if any
    const cleaned = rawResponse
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const parsed = JSON.parse(cleaned);

    const category = VALID_CATEGORIES.includes(parsed.category)
      ? parsed.category
      : fallbackClassifier(subject, description).category;

    const priority = VALID_PRIORITIES.includes(parsed.priority)
      ? parsed.priority
      : fallbackClassifier(subject, description).priority;

    return { category, priority };
  } catch (err) {
    console.warn("Gemini classification failed, using fallback:", err.message);
    return fallbackClassifier(subject, description);
  }
};

/**
 * Generate empathetic AI draft response for internal support operations
 */
export const generateAiDraftResponse = async ({
  authorName,
  bookTitle,
  subject,
  description,
  category,
  priority,
}) => {
  try {
    const firstName = authorName ? authorName.split(" ")[0] : "Author";
    const bookRef =
      bookTitle && bookTitle !== "General / Account Level"
        ? `"${bookTitle}"`
        : "your book";

    const prompt = `You are an empathetic, highly professional operations support specialist at BookLeaf Publishing.
Draft an official support response to the author.

BookLeaf Core Policies:
1. Royalty & Payments: 80% net author profit share. Calculated quarterly and disbursed via NEFT within 45 days. Minimum payout threshold is ₹1,000 (amounts below roll over).
2. Printing & Quality: Defective author copies (binding, blurry text, misprints) receive 100% free replacement reprints upon verifying photos. Turnaround is 5-7 business days.
3. Distribution: "Currently Unavailable" on Amazon/Flipkart is usually an inventory sync lag. BookLeaf operations can trigger an immediate warehouse re-sync (takes 24-48 hrs).
4. ISBN: Every title receives a registered ISBN under the publisher imprint. Listing discrepancies are resolved with retail catalog feeds within 48 hrs.
5. Tone: Warm, empathetic, professional, reassuring. Acknowledge frustration, provide concrete action steps and estimated timelines.

Author Details:
- Name: ${authorName || "Author"}
- Book: ${bookRef}
- Category: ${category}
- Priority: ${priority}
- Subject: "${subject}"
- Query: "${description}"

Guidelines:
- Start with a personalized salutation: "Dear ${firstName},"
- Address their specific issue clearly and outline the exact next steps being taken by BookLeaf operations.
- Reassure the author with specific turnaround times.
- Conclude warmly with:
"Warm regards,
BookLeaf Author Support Team"

Draft the response text directly without conversational prefixes or markdown code blocks:`;

    const draft = await callGeminiApi(prompt);
    return (
      draft ||
      fallbackDraftGenerator({
        authorName,
        bookTitle,
        subject,
        description,
        category,
        priority,
      })
    );
  } catch (err) {
    console.warn(
      "Gemini draft generation failed, using fallback:",
      err.message,
    );
    return fallbackDraftGenerator({
      authorName,
      bookTitle,
      subject,
      description,
      category,
      priority,
    });
  }
};
