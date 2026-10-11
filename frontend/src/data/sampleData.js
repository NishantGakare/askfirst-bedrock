/**
 * sampleData.js
 * ---------------------------------------------------------------------------
 * Static sample responses used during Phase 1 (frontend-only).
 * Replace generateChecklist / generateFollowUp with real API calls in Phase 2.
 * ---------------------------------------------------------------------------
 */

export const EXAMPLE_PROMPTS = [
  'Buying a used bicycle',
  'Renting my first flat',
  'Taking my phone for repair',
  'Joining a paid course',
  'Talking to a company about an internship',
]

/** @type {Record<string, import('./types').ChecklistItem[]>} */
const SAMPLE_CHECKLISTS = {
  default: [
    {
      id: 'q1',
      question: 'What is the total cost, including all fees and extras?',
      why: 'Advertised prices often exclude compulsory add-ons. Knowing the full amount lets you compare options fairly.',
      priority: 'Essential',
      status: 'unanswered',
    },
    {
      id: 'q2',
      question: 'What does the cancellation or returns policy look like?',
      why: 'Circumstances change. Understanding exit terms before you commit avoids expensive surprises.',
      priority: 'Essential',
      status: 'unanswered',
    },
    {
      id: 'q3',
      question: 'Who is responsible if something goes wrong?',
      why: 'Knowing who carries liability — and how to reach them — is critical when problems arise.',
      priority: 'Essential',
      status: 'unanswered',
    },
    {
      id: 'q4',
      question: 'How long will this take, and what does the timeline look like?',
      why: 'Unclear timelines lead to missed expectations. A concrete schedule helps you plan around it.',
      priority: 'Optional',
      status: 'unanswered',
    },
    {
      id: 'q5',
      question: 'Are there any reviews, references, or verifiable credentials I can check?',
      why: 'Independent verification reduces the risk of a decision based solely on the other party\'s claims.',
      priority: 'Optional',
      status: 'unanswered',
    },
    {
      id: 'q6',
      question: 'What happens if my needs change after I commit?',
      why: 'Flexibility clauses can save significant cost or stress if your situation shifts unexpectedly.',
      priority: 'Optional',
      status: 'unanswered',
    },
  ],

  bicycle: [
    {
      id: 'q1',
      question: 'Has the bike been in any accidents or had major repairs?',
      why: 'Hidden structural damage can make a bike unsafe to ride even if it looks fine externally.',
      priority: 'Essential',
      status: 'unanswered',
    },
    {
      id: 'q2',
      question: 'Can I see the original purchase receipt or proof of ownership?',
      why: 'Verifying ownership protects you from unknowingly buying stolen property.',
      priority: 'Essential',
      status: 'unanswered',
    },
    {
      id: 'q3',
      question: 'What is the asking price, and is there room to negotiate?',
      why: 'Used bicycle prices are rarely fixed. Knowing market value helps you negotiate fairly.',
      priority: 'Essential',
      status: 'unanswered',
    },
    {
      id: 'q4',
      question: 'When were the brakes, tyres, and chain last replaced?',
      why: 'These wear items are expensive to replace and directly affect safety.',
      priority: 'Optional',
      status: 'unanswered',
    },
    {
      id: 'q5',
      question: 'Does the frame size suit my height and riding style?',
      why: 'A poorly fitted bike causes discomfort and long-term strain, regardless of its condition.',
      priority: 'Optional',
      status: 'unanswered',
    },
    {
      id: 'q6',
      question: 'Is a test ride possible before I commit?',
      why: 'Riding reveals shifting issues, brake feel, and frame flex that a visual check will miss.',
      priority: 'Optional',
      status: 'unanswered',
    },
  ],

  flat: [
    {
      id: 'q1',
      question: 'What is included in the rent — utilities, internet, council tax?',
      why: 'The monthly total can be significantly higher once bills are added. Know the full figure upfront.',
      priority: 'Essential',
      status: 'unanswered',
    },
    {
      id: 'q2',
      question: 'How much is the deposit and under what conditions is it returned?',
      why: 'Deposit disputes are common. Understanding conditions — and using a deposit protection scheme — matters.',
      priority: 'Essential',
      status: 'unanswered',
    },
    {
      id: 'q3',
      question: 'What is the minimum tenancy length and notice period?',
      why: 'Breaking a lease early can be costly. Knowing the exit terms before signing protects you.',
      priority: 'Essential',
      status: 'unanswered',
    },
    {
      id: 'q4',
      question: 'Who handles repairs and how quickly are they addressed?',
      why: 'Slow maintenance can make a property uncomfortable or unsafe. Clarify responsibilities in writing.',
      priority: 'Optional',
      status: 'unanswered',
    },
    {
      id: 'q5',
      question: 'Are pets, guests, or working from home permitted?',
      why: 'Restrictions not mentioned upfront have caused many tenancy disputes.',
      priority: 'Optional',
      status: 'unanswered',
    },
    {
      id: 'q6',
      question: 'What is the neighbourhood like at different times of day?',
      why: 'Visiting once during daytime does not reveal noise, parking, or safety patterns.',
      priority: 'Optional',
      status: 'unanswered',
    },
  ],

  course: [
    {
      id: 'q1',
      question: 'Does the advertised fee include everything — materials, exams, and the certificate?',
      why: 'Many courses charge separately for assessments or certification, significantly raising the real cost.',
      priority: 'Essential',
      status: 'unanswered',
    },
    {
      id: 'q2',
      question: 'Is the qualification recognised by employers or professional bodies in my field?',
      why: 'A certificate that is not respected by employers has limited practical value.',
      priority: 'Essential',
      status: 'unanswered',
    },
    {
      id: 'q3',
      question: 'What is the refund policy if I leave early or the course does not meet expectations?',
      why: 'Many paid courses have strict no-refund terms. Knowing this before paying avoids regret.',
      priority: 'Essential',
      status: 'unanswered',
    },
    {
      id: 'q4',
      question: 'Can I speak to a current or past student before enrolling?',
      why: 'First-hand accounts reveal quality issues that marketing materials will not show.',
      priority: 'Optional',
      status: 'unanswered',
    },
    {
      id: 'q5',
      question: 'How many hours per week does the course require?',
      why: 'Underestimating workload is a common reason students fall behind or drop out.',
      priority: 'Optional',
      status: 'unanswered',
    },
  ],

  internship: [
    {
      id: 'q1',
      question: 'Is this a paid or unpaid internship, and what are the exact terms?',
      why: 'Unpaid internships have legal restrictions in many countries. Know your rights before accepting.',
      priority: 'Essential',
      status: 'unanswered',
    },
    {
      id: 'q2',
      question: 'What will I actually be doing day to day?',
      why: 'Vague role descriptions often mean the intern ends up doing admin rather than meaningful work.',
      priority: 'Essential',
      status: 'unanswered',
    },
    {
      id: 'q3',
      question: 'Who will I report to and how will my work be reviewed?',
      why: 'Clear mentorship and feedback structure is what makes an internship genuinely useful.',
      priority: 'Essential',
      status: 'unanswered',
    },
    {
      id: 'q4',
      question: 'Is there a possibility of a full-time offer at the end?',
      why: 'If this is a goal, it is better to ask now than to assume and be disappointed.',
      priority: 'Optional',
      status: 'unanswered',
    },
    {
      id: 'q5',
      question: 'What tools, systems, or access will I need, and how quickly are they set up?',
      why: 'Slow onboarding wastes the first weeks of a short placement.',
      priority: 'Optional',
      status: 'unanswered',
    },
    {
      id: 'q6',
      question: 'What have previous interns gone on to do?',
      why: 'This reveals whether the company actually invests in its interns or just uses them for short-term tasks.',
      priority: 'Optional',
      status: 'unanswered',
    },
  ],

  repair: [
    {
      id: 'q1',
      question: 'Can you give me a written quote before any work begins?',
      why: 'A verbal estimate is easy to dispute. A written quote protects you from bill inflation.',
      priority: 'Essential',
      status: 'unanswered',
    },
    {
      id: 'q2',
      question: 'What does the repair warranty or guarantee cover?',
      why: 'Repairs without guarantees offer no recourse if the same fault reappears shortly after.',
      priority: 'Essential',
      status: 'unanswered',
    },
    {
      id: 'q3',
      question: 'Do you use genuine parts or third-party components?',
      why: 'Non-genuine parts can void the original manufacturer warranty and sometimes cause new problems.',
      priority: 'Essential',
      status: 'unanswered',
    },
    {
      id: 'q4',
      question: 'How long will the repair take?',
      why: 'Vague timelines make planning around the repair unnecessarily difficult.',
      priority: 'Optional',
      status: 'unanswered',
    },
    {
      id: 'q5',
      question: 'What happens to my data during the repair?',
      why: 'Some repairs require a factory reset. Knowing this in advance gives you time to back up.',
      priority: 'Optional',
      status: 'unanswered',
    },
  ],
}

/** Sample follow-up suggestions keyed by question id + short answer keyword */
const SAMPLE_FOLLOWUPS = {
  q1_extra: {
    question: 'What is the complete amount, including every compulsory fee and the certificate?',
    why: 'Your answer suggests additional costs exist. Getting the exact total now prevents a bigger surprise later.',
  },
  q2_deposit: {
    question: 'Is the deposit held in a government-approved protection scheme?',
    why: 'Deposit protection is a legal requirement in many countries. Confirming this upfront makes disputes easier to resolve.',
  },
  q3_liability: {
    question: 'Do you have a written complaints procedure I can see?',
    why: 'Knowing the formal escalation path before something goes wrong means you are prepared if it does.',
  },
  default_followup: {
    question: 'Can you put that in writing so we both have a clear record?',
    why: 'Written confirmation prevents misremembering and gives you something to refer back to.',
  },
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function classifySituation(situation) {
  const s = situation.toLowerCase()
  if (s.includes('bicycl') || s.includes('bike') || s.includes('cycle')) return 'bicycle'
  if (s.includes('flat') || s.includes('rent') || s.includes('apartment') || s.includes('studio')) return 'flat'
  if (s.includes('course') || s.includes('class') || s.includes('training') || s.includes('bootcamp')) return 'course'
  if (s.includes('intern') || s.includes('placement') || s.includes('job') || s.includes('interview')) return 'internship'
  if (s.includes('repair') || s.includes('fix') || s.includes('phone') || s.includes('laptop') || s.includes('service')) return 'repair'
  return 'default'
}

// ── Public API (mirrors shape the real backend will return) ───────────────────

/**
 * Simulates the backend `prepare` action.
 * Returns a checklist appropriate to the situation.
 */
export function generateChecklist(situation) {
  const key = classifySituation(situation)
  // Deep-clone so mutations don't affect the source data
  return JSON.parse(JSON.stringify(SAMPLE_CHECKLISTS[key]))
}

/**
 * Simulates the backend follow-up suggestion after an answer is recorded.
 * Returns null when no follow-up is warranted.
 */
export function generateFollowUp(questionId, answer) {
  const a = answer.toLowerCase()

  if (questionId === 'q1' && (a.includes('extra') || a.includes('certificate') || a.includes('additional') || a.includes('more'))) {
    return SAMPLE_FOLLOWUPS.q1_extra
  }
  if (questionId === 'q2' && (a.includes('deposit') || a.includes('scheme') || a.includes('protect'))) {
    return SAMPLE_FOLLOWUPS.q2_deposit
  }
  if (questionId === 'q3' && (a.includes('no') || a.includes('unclear') || a.includes('unsure') || a.includes("don't know"))) {
    return SAMPLE_FOLLOWUPS.q3_liability
  }
  // Return a generic follow-up ~30 % of the time so guided mode feels alive
  if (answer.length > 30 && Math.random() < 0.3) {
    return SAMPLE_FOLLOWUPS.default_followup
  }
  return null
}
