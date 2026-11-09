const intakeDialog = document.querySelector('#intakeDialog');
const portalDialog = document.querySelector('#portalDialog');
const intakeForm = document.querySelector('#intakeForm');
const serviceSelect = document.querySelector('#serviceSelect');
const consultationSelect = document.querySelector('#consultationSelect');
const intakeKicker = document.querySelector('#intakeKicker');
const intakeTitle = document.querySelector('#intakeTitle');
const intakeDescription = document.querySelector('#intakeDescription');
const detailsStep = document.querySelector('[data-intake-step="details"]');
const reviewStep = document.querySelector('[data-intake-step="review"]');
const reviewRequest = document.querySelector('#reviewRequest');
const editRequest = document.querySelector('#editRequest');
const reviewSubject = document.querySelector('#reviewSubject');
const reviewMessage = document.querySelector('#reviewMessage');
const toast = document.querySelector('#toast');
const caseDialog = document.querySelector('#caseDialog');
const caseDialogImage = document.querySelector('#caseDialogImage');
const FORM_ENDPOINT = 'https://formspree.io/f/moeeovbl';
const attributionFields = {
  utm_source: '#utmSource',
  utm_medium: '#utmMedium',
  utm_campaign: '#utmCampaign',
  utm_content: '#utmContent',
  utm_term: '#utmTerm'
};

function captureOutreachAttribution(){
  const params = new URLSearchParams(window.location.search);
  let attribution = {};
  try { attribution = JSON.parse(sessionStorage.getItem('gdlAttribution')) || {}; }
  catch { attribution = {}; }

  Object.keys(attributionFields).forEach(key => {
    const value = params.get(key);
    if(value) attribution[key] = value;
    const input = document.querySelector(attributionFields[key]);
    if(input) input.value = attribution[key] || '';
  });

  attribution.landing_page = attribution.landing_page || window.location.href;
  const landingPage = document.querySelector('#landingPage');
  if(landingPage) landingPage.value = attribution.landing_page;
  try { sessionStorage.setItem('gdlAttribution', JSON.stringify(attribution)); }
  catch { /* Attribution remains available for this page view. */ }
}

captureOutreachAttribution();

const defaultProject = {
  founder: 'Founder',
  company: 'Pilot Project',
  website: 'Not provided',
  industry: 'Founder-led business',
  customer: 'Target customer to be confirmed',
  service: 'Growth Diagnostic',
  problem: 'Clarify the strongest near-term growth opportunity and define the next 30 days of action.',
  competitors: 'To be researched'
};

function getProject(){
  try { return JSON.parse(localStorage.getItem('gdlProject')) || defaultProject; }
  catch { return defaultProject; }
}

function showToast(message, type='status'){
  toast.textContent = message;
  toast.classList.toggle('error', type === 'error');
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), type === 'error' ? 6000 : 4200);
}

function openIntake(service='', consultation='After you review my request'){
  showIntakeStep('details');
  if(service) serviceSelect.value = service;
  consultationSelect.value = consultation;
  const consultFirst = consultation === 'Before we define the project';
  intakeKicker.textContent = consultFirst ? '15-minute consultation' : 'Project request';
  intakeTitle.textContent = consultFirst ? 'Let’s talk before defining the project.' : 'What decision are you trying to make?';
  intakeDescription.textContent = consultFirst ? 'Share the essentials and your preferred timing. We will confirm a 15-minute conversation by email.' : 'A short project brief. Your request will go directly to our project inbox for review.';
  intakeDialog.showModal();
}

function showIntakeStep(step){
  const reviewing = step === 'review';
  detailsStep.classList.toggle('active', !reviewing);
  reviewStep.classList.toggle('active', reviewing);
  intakeForm.classList.toggle('is-reviewing', reviewing);
  intakeKicker.textContent = reviewing ? 'Review email request' : 'Project request';
  intakeTitle.textContent = reviewing ? 'Make it yours before it is sent.' : 'What decision are you trying to make?';
  intakeDescription.textContent = reviewing ? 'This is the exact request our project inbox will receive. Every word remains editable.' : 'A short project brief. Your request will go directly to our project inbox for review.';
}

function buildReviewMessage(data){
  return [
    'Hello Growth Desks Labs team,',
    '',
    `My name is ${data.founder}, and I am reaching out from ${data.company}.`,
    `Website: ${data.website || 'Not provided'}`,
    `Support considered: ${data.service}`,
    '',
    'Decision or growth question:',
    data.problem,
    '',
    `Consultation preference: ${data.consultation}`,
    `Preferred days or times: ${data.availability || 'Not provided'}`,
    '',
    'I understand that scope and fees are negotiable and that no payment is collected through the website.'
  ].join('\n');
}

document.querySelectorAll('[data-open-intake]').forEach(button => button.addEventListener('click', () => openIntake()));
document.querySelectorAll('[data-service]').forEach(button => button.addEventListener('click', () => openIntake(button.dataset.service)));
document.querySelectorAll('[data-open-portal]').forEach(button => button.addEventListener('click', () => openPortal()));
document.querySelectorAll('[data-close-intake]').forEach(button => button.addEventListener('click', () => intakeDialog.close()));
document.querySelectorAll('[data-close-portal]').forEach(button => button.addEventListener('click', () => portalDialog.close()));

reviewRequest.addEventListener('click', () => {
  if(!intakeForm.reportValidity()) return;
  const data = Object.fromEntries(new FormData(intakeForm).entries());
  reviewSubject.value = `[Growth Desks Labs] ${data.company} project request`;
  reviewMessage.value = buildReviewMessage(data);
  showIntakeStep('review');
  reviewSubject.focus();
});

editRequest.addEventListener('click', () => showIntakeStep('details'));

intakeForm.addEventListener('submit', async event => {
  event.preventDefault();
  const submitButton = intakeForm.querySelector('[type="submit"]');
  const originalLabel = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.textContent = 'Sending request…';
  const data = Object.fromEntries(new FormData(intakeForm).entries());
  if(data._gotcha){
    intakeDialog.close();
    intakeForm.reset();
    showIntakeStep('details');
    showToast('Request received. We will follow up by email to confirm next steps.');
    submitButton.disabled = false;
    submitButton.textContent = originalLabel;
    return;
  }
  const payload = new FormData(intakeForm);
  payload.append('_subject', data.review_subject || `[Growth Desks Labs] ${data.company} project request`);
  payload.append('fee_note', 'Fees and scope are negotiable. No payment is collected through the website.');
  try {
    const response = await fetch(FORM_ENDPOINT, {
      method: 'POST',
      body: payload,
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) throw new Error('Request could not be sent');
    const safeProject = {
      company: data.company,
      website: data.website,
      service: data.service,
      problem: data.problem,
      diagnostic: data.diagnostic
    };
    localStorage.setItem('gdlProject', JSON.stringify(safeProject));
    intakeDialog.close();
    intakeForm.reset();
    showIntakeStep('details');
    showToast('Request received. We will follow up by email to confirm next steps.');
  } catch (error) {
    showToast('The request could not be sent. Please try again or book a 15-minute consultation.', 'error');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = originalLabel;
  }
});

function renderPortal(project){
  document.querySelector('#portalCompany').textContent = project.company || 'Pilot Project';
  document.querySelector('#portalHeadline').textContent = `${project.company || 'Your business'}, organized for growth.`;
  document.querySelector('#portalService').textContent = project.service || 'Custom Scope';
  const days = project.service === 'Growth Diagnostic' ? '4 business days' : project.service === 'Campus Launch Lab' ? '21 days' : '10 business days';
  document.querySelector('#portalDelivery').textContent = days;
  const fields = [
    ['Founder', project.founder],
    ['Company', project.company],
    ['Website', project.website || 'Not provided'],
    ['Industry', project.industry],
    ['Target customer', project.customer],
    ['Selected sprint', project.service],
    ['Current growth problem', project.problem, true],
    ['Known competitors', project.competitors || 'None provided', true],
    ...(project.diagnostic ? [['Growth diagnostic', project.diagnostic, true]] : [])
  ];
  document.querySelector('#briefDetails').innerHTML = fields.map(([label,value,wide]) => `<div class="${wide?'wide':''}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value || 'Not provided')}</strong></div>`).join('');
}

function openPortal(){
  renderPortal(getProject());
  activateTab('overview');
  portalDialog.showModal();
}

function activateTab(tab){
  document.querySelectorAll('[data-portal-tab]').forEach(button => button.classList.toggle('active', button.dataset.portalTab === tab));
  document.querySelectorAll('[data-view]').forEach(view => view.classList.toggle('active', view.dataset.view === tab));
}

document.querySelectorAll('[data-portal-tab]').forEach(button => button.addEventListener('click', () => activateTab(button.dataset.portalTab)));

function escapeHtml(value){
  return String(value).replace(/[&<>'"]/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[character]));
}

intakeDialog.addEventListener('click', event => {
  if(event.target === intakeDialog) intakeDialog.close();
});
portalDialog.addEventListener('click', event => {
  if(event.target === portalDialog) portalDialog.close();
});

document.querySelectorAll('[data-scroll-proof]').forEach(button => button.addEventListener('click', () => document.querySelector('#proof').scrollIntoView({behavior:'smooth'})));

document.querySelectorAll('[data-case-image]').forEach(button => button.addEventListener('click', () => {
  caseDialogImage.src = button.dataset.caseImage;
  caseDialog.showModal();
}));
document.querySelector('.case-modal-close').addEventListener('click', () => caseDialog.close());
caseDialog.addEventListener('click', event => { if(event.target === caseDialog) caseDialog.close(); });

const diagnosticQuestions = [...document.querySelectorAll('.question')];
const diagnosticScores = {};
let diagnosticStep = 0;
const diagnosticMap = {
  positioning: {
    title: 'Sharpen what the market should remember',
    explanation: 'Your biggest constraint is positioning. If customers cannot quickly explain your value and difference, more traffic or outreach will amplify confusion rather than growth.',
    actions: ['Write one sentence naming the customer, problem and outcome.','Compare your headline against three direct alternatives.','Use the same value language across the website and outreach.'],
    sprint: 'Growth Diagnostic'
  },
  customer: {
    title: 'Replace the broad audience with evidence',
    explanation: 'Your customer definition needs more precision. Growth becomes expensive when the buyer, trigger, objection and purchase criteria are not clear enough to guide product and outreach decisions.',
    actions: ['List the last five serious buyers and what triggered interest.','Separate users, buyers and influencers.','Document the three objections that repeatedly delay action.'],
    sprint: 'Research Sprint'
  },
  conversion: {
    title: 'Turn attention into a clear next step',
    explanation: 'Your conversion path is the weakest link. The immediate opportunity is to make the offer, proof and next action easier to understand before investing in additional traffic.',
    actions: ['Test whether a new visitor understands the offer in 10 seconds.','Use one primary call to action per page.','Place proof next to the decision it is meant to support.'],
    sprint: 'Growth Diagnostic'
  },
  market: {
    title: 'Choose a position you can credibly own',
    explanation: 'You need a stronger view of the market. Without comparable evidence on competitors and alternatives, it is difficult to know which opportunity is genuinely open or defensible.',
    actions: ['Compare five alternatives using the same criteria.','Separate direct competitors from substitutes and in-house solutions.','Identify the gap supported by your strongest proof—not the broadest claim.'],
    sprint: 'Research Sprint'
  },
  pipeline: {
    title: 'Build a repeatable opportunity system',
    explanation: 'Your strongest near-term opportunity is pipeline discipline. A reliable process for identifying, qualifying and following up with the right accounts can make growth less dependent on chance.',
    actions: ['Define five qualification fields before adding prospects.','Create one source-backed record for every target account.','Set a next action and date for every qualified opportunity.'],
    sprint: 'Prospect Intelligence'
  }
};

document.querySelectorAll('.score-options').forEach(group => group.setAttribute('role', 'radiogroup'));
document.querySelectorAll('.score-options button').forEach(button => {
  button.setAttribute('role', 'radio');
  button.setAttribute('aria-checked', 'false');
  button.addEventListener('click', () => {
  const question = button.closest('.question');
  const key = question.dataset.question;
  diagnosticScores[key] = Number(button.dataset.score);
  question.querySelectorAll('button').forEach(option => {
    const selected = option === button;
    option.classList.toggle('selected', selected);
    option.setAttribute('aria-checked', String(selected));
  });
  if(diagnosticStep < diagnosticQuestions.length - 1){
    diagnosticQuestions[diagnosticStep].classList.remove('active');
    diagnosticStep += 1;
    diagnosticQuestions[diagnosticStep].classList.add('active');
    updateDiagnosticProgress();
  } else {
    showDiagnosticResult();
  }
  });
});

function updateDiagnosticProgress(){
  document.querySelector('#diagnosticStepLabel').textContent = `Question ${diagnosticStep + 1} of ${diagnosticQuestions.length}`;
  document.querySelector('#diagnosticProgress').style.width = `${((diagnosticStep + 1) / diagnosticQuestions.length) * 100}%`;
}

function showDiagnosticResult(){
  diagnosticQuestions.forEach(question => question.classList.remove('active'));
  const weakest = Object.entries(diagnosticScores).sort((a,b) => a[1] - b[1])[0][0];
  const result = diagnosticMap[weakest];
  const total = Object.values(diagnosticScores).reduce((sum,score) => sum + score,0);
  document.querySelector('#diagnosticStepLabel').textContent = 'Diagnostic complete';
  document.querySelector('#diagnosticProgress').style.width = '100%';
  document.querySelector('#resultScore').textContent = `${total}/25`;
  document.querySelector('#resultTitle').textContent = result.title;
  document.querySelector('#resultExplanation').textContent = result.explanation;
  document.querySelector('#resultActions').innerHTML = result.actions.map((action,index) => `<div><b>${index+1}.</b>${escapeHtml(action)}</div>`).join('');
  document.querySelector('#resultSprint').textContent = result.sprint;
  document.querySelector('#diagnosticResult').classList.add('active');
  document.querySelector('#diagnosticInput').value = `${total}/25 — ${result.title}. Recommended: ${result.sprint}.`;
  document.querySelector('#useResult').dataset.sprint = result.sprint;
  document.querySelector('#useResult').dataset.problem = result.title;
}

document.querySelector('#useResult').addEventListener('click', event => {
  const sprint = event.currentTarget.dataset.sprint;
  const problem = event.currentTarget.dataset.problem;
  serviceSelect.value = sprint;
  intakeForm.querySelector('[name="problem"]').value = `My diagnostic identified this priority: ${problem}. I want to validate the finding and turn it into a practical action plan.`;
  openIntake(sprint);
});

document.querySelector('#restartDiagnostic').addEventListener('click', () => {
  Object.keys(diagnosticScores).forEach(key => delete diagnosticScores[key]);
  diagnosticStep = 0;
  document.querySelector('#diagnosticResult').classList.remove('active');
  diagnosticQuestions.forEach((question,index) => {
    question.classList.toggle('active', index === 0);
    question.querySelectorAll('button').forEach(button => {
      button.classList.remove('selected');
      button.setAttribute('aria-checked', 'false');
    });
  });
  updateDiagnosticProgress();
});

const pilotInputs = ['pilotBudget','pilotRegistrations','pilotRate'].map(id => document.querySelector(`#${id}`));
function updatePilotEconomics(){
  const budget = Math.min(Math.max(Number(document.querySelector('#pilotBudget').value) || 0, 0), 10000000);
  const registrations = Math.min(Math.max(Number(document.querySelector('#pilotRegistrations').value) || 0, 0), 10000000);
  const rate = Math.min(Math.max(Number(document.querySelector('#pilotRate').value) || 0, 0), 100);
  const firstGames = registrations * (rate / 100);
  const currency = value => Number.isFinite(value) ? `$${value.toFixed(2)}` : '—';
  document.querySelector('#costPerRegistration').textContent = registrations ? currency(budget / registrations) : '—';
  document.querySelector('#costPerPlayer').textContent = firstGames ? currency(budget / firstGames) : '—';
  document.querySelector('#firstGameCount').textContent = `Assumes ${Math.round(firstGames)} first-game participants.`;
}
pilotInputs.forEach(input => input.addEventListener('input', updatePilotEconomics));
updatePilotEconomics();

const financeInputIds = ['fiCustomers','fiPrice','fiVariableCost','fiFixedCost','fiStartingCash','fiGrowth'];
const financeInputs = financeInputIds.map(id => document.querySelector(`#${id}`));
const money = value => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(value);

function updateFinancialDashboard(){
  const customers = Math.min(Math.max(Number(document.querySelector('#fiCustomers').value) || 0, 0), 1000000);
  const price = Math.min(Math.max(Number(document.querySelector('#fiPrice').value) || 0, 0), 1000000000);
  const variableCost = Math.min(Math.max(Number(document.querySelector('#fiVariableCost').value) || 0, 0), 1000000000);
  const fixedCost = Math.min(Math.max(Number(document.querySelector('#fiFixedCost').value) || 0, 0), 1000000000);
  const startingCash = Math.min(Math.max(Number(document.querySelector('#fiStartingCash').value) || 0, 0), 1000000000);
  const growth = Math.min(Math.max(Number(document.querySelector('#fiGrowth').value) || 0, -100), 100) / 100;
  const contribution = price - variableCost;
  const margin = price ? contribution / price : 0;
  const breakEven = contribution > 0 ? Math.ceil(fixedCost / contribution) : null;
  let cash = startingCash;
  let currentCustomers = customers;
  let firstPositiveMonth = null;
  const cashSeries = [];
  for(let month = 1; month <= 12; month += 1){
    const operatingCash = (currentCustomers * contribution) - fixedCost;
    cash += operatingCash;
    if(firstPositiveMonth === null && operatingCash >= 0) firstPositiveMonth = month;
    cashSeries.push(cash);
    currentCustomers *= (1 + growth);
  }
  document.querySelector('#fiRevenue').textContent = money(customers * price);
  document.querySelector('#fiMargin').textContent = `${(margin * 100).toFixed(1)}%`;
  document.querySelector('#fiBreakEven').textContent = breakEven === null ? 'Not viable' : breakEven.toLocaleString();
  document.querySelector('#fiEndingCash').textContent = money(cash);
  const minCash = Math.min(...cashSeries, 0);
  const maxCash = Math.max(...cashSeries, 1);
  const range = Math.max(maxCash - minCash, 1);
  document.querySelector('#fiChart').innerHTML = cashSeries.map((value,index) => {
    const height = Math.max(8, ((value - minCash) / range) * 100);
    return `<div class="cash-bar"><i style="height:${height}%"></i><span>M${index + 1}</span><b>${money(value)}</b></div>`;
  }).join('');
  const signal = document.querySelector('#fiSignal');
  const detail = document.querySelector('#fiSignalDetail');
  if(contribution <= 0){
    signal.textContent = 'Price does not cover the variable cost per customer.';
    detail.textContent = 'Increase price or reduce variable cost before using growth as the primary lever.';
  } else if(firstPositiveMonth){
    signal.textContent = `The base case reaches monthly operating break-even in month ${firstPositiveMonth}.`;
    detail.textContent = cash < startingCash ? 'The business still finishes below starting cash, so runway remains the priority.' : 'The 12-month base case adds cash, subject to the assumptions shown.';
  } else {
    signal.textContent = 'The base case does not reach monthly operating break-even within 12 months.';
    detail.textContent = 'Test price, contribution margin, fixed cost and customer growth before committing more cash.';
  }
}
financeInputs.forEach(input => input.addEventListener('input', updateFinancialDashboard));
updateFinancialDashboard();
