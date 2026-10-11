# AskFirst — One-Day MVP Build Guide

Version: 1.1 • Updated October 10, 2026 — custom minimal frontend  
Status: agreed direction and proposed implementation; this guide is not a built or tested application.

## 1. Project promise

AskFirst helps people figure out what to ask before a purchase, meeting, interview, rental, service appointment, or other unfamiliar situation. The user explains their situation, receives a small prioritised checklist, and can use a guided conversation mode that adapts to the answers they collect.

Tagline: Know what to ask. Know why it matters.

Audience: people approaching unfamiliar decisions, including students and first-time buyers. Input is open-ended: examples are suggestions, not a restricted set of categories. “Any situation” refers to preparing useful questions, not replacing every kind of AI assistant.

The one-day goal is a working local demo with one real AWS integration, a pleasant guided experience, a few genuine user tests, and an article ready for the AWS weekend challenge.

## 2. The complete user journey

### Start

Show a clear prompt: “What are you getting ready for?”

Provide one text box and example chips:
- Buying a used bicycle.
- Renting my first flat.
- Taking my phone for repair.
- Joining a paid course.
- Talking to a company about an internship.

Optional context can include budget, goals, experience, and the user's biggest concern. Do not require a long form. A filled example should be usable immediately.

### Clarify

Ask up to two short follow-up questions only when the missing information would materially change the checklist. Allow “Skip — use what I shared.” A vague input such as “help” should receive a simple clarifying question rather than a made-up checklist.

### Prepare

Produce five to seven prioritised questions. Each has:
- A stable question ID.
- The exact question the user can ask.
- A one-sentence explanation of why it matters.
- An “Essential” or “Optional” priority.
- An unanswered/answered/could-not-check status.

Show the three essential questions first, with the rest expandable.

### Guide

The main action is “Guide me one question at a time.” This is the signature detail.

Display one question, its explanation, progress, and an answer box. Actions:
- Save answer and continue.
- Could not check.
- Explain simply.
- Back to checklist.

After an answer, the agent can suggest one useful follow-up if the answer leaves an important gap. The user chooses whether to add it. Do not produce an endless interview.

Example:
- Situation: joining a paid course.
- Initial question: “Does the advertised fee include everything?”
- User records: “They said the certificate costs extra.”
- Suggested follow-up: “What is the complete amount, including the certificate and any other compulsory fees?”

This is an illustrative interaction, not a recorded test result.

### Wrap up

The user can finish at any time. Show:
- What the user reported.
- Questions still unanswered.
- Points worth clarifying next.

Use “Based on the answers you entered” so the summary does not imply independent verification. Keep unknown conditions unknown. Provide a downloadable text summary.

## 3. Minimum feature set and acceptance checks

| Feature | MVP behaviour | Acceptance check |
| --- | --- | --- |
| Open-ended input | Accept an unfamiliar situation without selecting a category | Works for a bicycle purchase, rental, and internship conversation |
| Minimal clarification | Ask at most two useful questions; allow skipping | A detailed input reaches a checklist without redundant questions |
| Prioritised checklist | Five to seven questions with plain-language reasons | Output is relevant and does not contain duplicates |
| Guided mode | One question at a time with progress and back navigation | Recorded answers remain visible when navigating |
| Adaptive follow-up | Suggest a specific follow-up based on an answer | The follow-up refers to the actual gap in that answer |
| Session memory | Keep checklist and observations during the current session | Two browser sessions do not share observations |
| Summary and export | Summarise observations and unresolved issues | Could-not-check items remain unresolved |
| Recovery | Preserve current progress if a model request fails | Retry works without recording duplicate answers |

Session memory is temporary. Clearly explain that resetting or losing the session may clear progress; the text download provides a simple takeaway.

## 4. What makes this an agent

The model does more than produce a checklist. It can choose a permitted tool, inspect the result, and decide what to do next.

Use Strands to connect the model to three small Python functions:
1. get_session(): retrieve the situation, checklist, observations, and unresolved items.
2. update_checklist(...): create the initial checklist or add an approved follow-up.
3. record_answer(...): save a user-provided answer or could-not-check status.

Example loop:
The user submits an answer. The agent records it, reads the current session, identifies an unresolved detail, and returns a suggested next question. The UI displays the suggestion and lets the user choose the next action.

Tool validation must enforce valid question IDs, allowed status values, and bounded text lengths. The model must not mark a question answered without user input or invent a seller's reply. Keep each session's state separate and do not use a global shared conversation object.

An optional debug area can show “Answer saved” or “Checklist updated” and actual tool names for the article demonstration. Do not expose internal reasoning, credentials, or sensitive account information.

## 5. Small technical design

The frontend direction is now a custom, minimal React interface. This replaces the initial Streamlit proposal. It adds a small local API connection and a second development process, so it is more work than the original single-process design. Keep the feature set unchanged to preserve the one-day target.

| Part | Choice | Purpose |
| --- | --- | --- |
| Frontend language | JavaScript with JSX | Keep UI code approachable for a fresher |
| Frontend | React with Vite | Build one responsive page with a few reusable components |
| Styling | Tailwind CSS | Control spacing, typography, cards, and responsive layouts |
| Icons | Lucide React | Use a small consistent set of interface icons |
| Backend | Python 3.12 with FastAPI | Receive UI actions and run the agent |
| Agent framework | Strands Agents | Handle the model/tool interaction loop |
| AWS service | Amazon Bedrock, subject to the account and credit check | Run the AI model |
| Storage | Per-session backend memory; React state for the current screen | Keep progress without provisioning a database |
| Export | Plain text download | Let users keep their result |

The browser opens the local React interface. It sends actions to the local FastAPI backend, which invokes Strands and Bedrock. Only requests to the chosen Bedrock model go to AWS. Select one available text model with tool-use support after checking account access, region, eligible credits, and current pricing.

Keep AWS credentials in the backend's local AWS profile or environment. Never put secrets in browser code or Vite-prefixed environment variables. Bind the demo backend locally and allow only the actual local frontend origin. Use an unguessable per-session ID and isolate agent memory for each session; backend restarts clear temporary progress.

Use one small session API, for example POST /api/askfirst, with validated actions such as prepare, answer, and summarize. Return the updated public session state and readable errors. Screen changes and expanding explanations should not invoke the model.

Suggested files:
- frontend/src/App.jsx — screen state and the main flow.
- frontend/src/components/ — SituationInput, Checklist, GuidedQuestion, Summary.
- frontend/src/index.css — theme and small style refinements.
- frontend/src/api.js — one small API helper.
- backend/main.py — FastAPI setup, request validation, session routing.
- backend/agent.py — model configuration and agent setup.
- backend/tools.py — session/checklist tools.
- backend/prompts.py — instructions, response structure, and tone.
- backend/requirements.txt — Python dependencies.
- README.md — setup, usage, screenshots, and limitations.

Use built-in React state, ordinary HTTP requests, and simple CSS transitions. Keep the MVP to one page with three main states plus the completion summary. Two local development processes are sufficient; public deployment is not needed for the proof format in the supplied challenge text.

## 6. Cost constraint: no out-of-pocket spending

No AWS resources have been created or model requests enabled by this guide.

Before the first metered request:
1. Confirm whether the account is on the Free account plan, a Paid plan with credits, or a legacy Free Tier arrangement.
2. Check remaining credits, expiry, eligible services, and existing usage.
3. Confirm that the chosen Bedrock model is available without upgrading the account.
4. Use only credits already available. The challenge prize is not upfront project funding.

AWS states that the Free account plan does not incur charges while the account remains on that plan. Paid plans can incur charges beyond credits or for ineligible services. Budget alerts can be delayed and are not a guaranteed hard spending cap.

For the app, prevent accidental repeated requests: use explicit submit actions, short input/output limits, a bounded tool loop, and a small persisted request allowance. Configure the allowance to count underlying model requests, including tool-loop iterations, rather than only button clicks. Stop and show a useful message when the allowance is reached. These controls limit application activity; they are not a guarantee about account-wide billing.

If the plan or credit eligibility cannot be confirmed, continue local development using the existing Ollama setup, without enabling AWS metered calls. Tool-use compatibility of the local model must be checked. A local fallback by itself is not proof of an AWS integration.

## 7. Interface direction

Design personality: calm, minimal, and a little playful. Use a warm neutral background, dark readable text, restrained violet accents, generous spacing, and simple rounded surfaces. A serif headline can give the opening screen character; use a clean sans-serif for forms and question cards.

Opening screen:
- Small AskFirst wordmark and minimal top navigation.
- Headline: “A better question. A clearer next step.”
- One large situation input with one primary action.
- Three example chips that fill the input, without limiting supported situations.

Checklist screen:
- Restate the user's situation in a compact line.
- Show five to seven questions in a readable list with Essential/Optional labels.
- Expand a question to see why it matters.
- Give guided mode one obvious primary button.

Guided screen:
- One question card, one explanation, and one answer box.
- A small progress indicator, save/continue, could-not-check, and back navigation.
- Show suggested follow-ups only when relevant and let the user choose them.
- Preserve notes on a model error and offer a clear retry action.

Completion:
- Summarise entered answers and keep unchecked details labelled unknown.
- Offer a plain text download.

Support mobile layouts, keyboard navigation, visible focus states, reduced-motion preferences, and readable contrast. Use CSS for short transitions; extra animation frameworks are outside the one-day scope.

A conversation preview illustrates the interface using sample questions and local interactions. It is a design demonstration, not a working AWS agent or evidence of model integration. The production application must replace sample responses with actual backend output before it is shown as challenge proof.

## 8. One-day delivery plan

| Time allowance | Work | What you learn | Completion signal |
| --- | --- | --- | --- |
| 60 minutes | Review account and existing app; set up frontend and backend | Dependencies, local servers, account plans | UI and backend start; AWS remains disabled until checked |
| 60 minutes | Connect one API action to the model; define output structure | HTTP requests, prompts, model responses | A situation produces a readable checklist |
| 90 minutes | Add session state and tools | Functions, tool calls, state | An answer changes the suggested next action |
| 120 minutes | Build and polish the React guided interface | Components, state, forms, API calls | A friend can finish the flow without coaching |
| 45 minutes | Test with three friends and fix one issue | Observation, feedback, iteration | Genuine feedback and an actual improvement recorded |
| 90 minutes | Record demo and write the article | Technical explanation and evidence | Article checklist completed |
| 15 minutes | Buffer | Troubleshooting | Core flow remains complete |

Total target: eight focused hours. The custom frontend makes this a tighter estimate, especially while teaching; installation or account-access issues may push it beyond one day. Keep the guided flow and submission evidence ahead of cosmetic extras if time runs short.

Teaching pattern for every step:
1. Explain the purpose in plain language.
2. Show the smallest necessary code or command.
3. Run it together.
4. Compare the result with the expected output.
5. Fix any issue before adding another concept.

The fresher can own interface copy, checklist review, and test observations while implementing small Python functions alongside you.

## 9. Validation and evidence

Technical checks:
- Three unrelated situations produce relevant questions.
- Vague input produces clarification.
- A recorded answer is not lost during navigation.
- A could-not-check item remains unknown in the summary.
- Model failure preserves current session state.
- A new session starts without another user's answers.
- No model request happens just because the UI re-renders.
- The request allowance stops further model activity when reached.

User test:
Ask three people to compare a full-checklist view with guided mode for the same kind of scenario. Alternate which view they see first where practical. Record:
- Whether they could find the next question without help.
- Which mode they preferred and why.
- One confusing moment.
- One actual change made after feedback.

Report only the results actually observed. Describe the small test as informal feedback, not proof of universal improvement.

Proof:
Record a 45–60 second clip covering input, checklist, one answer, an adaptive follow-up, and summary. Capture screenshots of the initial checklist and guided mode. A genuine tool-call log can support the explanation of agent behaviour.

## 10. AWS weekend challenge mapping

The requirements below come from the challenge text supplied in this conversation. This guide does not independently verify the number of prize slots remaining or guarantee organizer acceptance.

| Supplied requirement | AskFirst evidence |
| --- | --- |
| Working agent and its audience | Open-ended preparation agent for unfamiliar everyday situations |
| How it was built, including AWS services/tools | Explain the actual React UI, FastAPI backend, Strands tool loop, and Bedrock integration used |
| One enjoyable detail and how you know it worked | One-question-at-a-time mode, actual user feedback, and one resulting improvement |
| Proof it works | Screenshot or short clip of the functioning app; repository link if available |
| Article of at least 500 words | Aim for 700–900 original words |
| Article tag | Add the agents tag / #agents on Builder Center |
| Complete Builder Profile | Profile image, country, and About section |
| Publish in the specified window | October 9, 2026 07:00 UTC through October 12, 2026 20:00 UTC |

Deadline conversion: Tuesday, October 13, 2026 at 1:30 AM IST. Aim to publish on October 10 or 11 because credits are limited to the first 100 qualifying articles. Remaining slots are unknown. The backpack drawing is separate and random.

The supplied rules permit a link, screenshot, or short clip as proof. A public deployment is not stated as a requirement in the pasted text. Publishing the article and completing the profile are still necessary.

## 11. Article outline

Suggested title: “AskFirst: Building an agent that helps you know what to ask”

- The problem and intended users: 100–130 words.
- A short user journey: 100–130 words.
- Actual implementation and AWS services: 180–220 words.
- Guided mode and real test feedback: 150–180 words.
- A problem encountered, its fix, and what you learned: 100–130 words.
- Demo evidence and limitations: 70–100 words.

Explain how the weekend work develops the earlier AskFirst idea. Do not imply a pre-existing feature was built this weekend, and do not write successful tests or deployment claims before they happen.

## 12. Finish line

The MVP is complete when a new user can describe an arbitrary situation, get a useful short checklist, record answers in guided mode, receive at least one relevant adaptive follow-up when warranted, and download a truthful summary.

The challenge entry is ready when that working behaviour is evidenced, the actual AWS implementation is documented, the user feedback is real, the article is at least 500 words with #agents, and the Builder Profile is complete.

## Reference links

- React: https://react.dev/learn
- Tailwind CSS with Vite: https://tailwindcss.com/docs/installation/using-vite
- FastAPI: https://fastapi.tiangolo.com/

- AWS account plan behaviour: https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/free-tier-plans.html
- AWS Budgets behaviour and notification delays: https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html
- Amazon Bedrock pricing: https://aws.amazon.com/bedrock/pricing/
- Strands Python quickstart: https://strandsagents.com/docs/user-guide/sdk/quickstart/python/
- Strands Amazon Bedrock provider: https://strandsagents.com/docs/user-guide/sdk/model-providers/amazon-bedrock/

The challenge requirements are based on the article text pasted by the user; no unverified article URL is supplied.

