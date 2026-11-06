const intakeDialog = document.querySelector('#intakeDialog');
const portalDialog = document.querySelector('#portalDialog');
const intakeForm = document.querySelector('#intakeForm');
const serviceSelect = document.querySelector('#serviceSelect');
const consultationSelect = document.querySelector('#consultationSelect');
const intakeKicker = document.querySelector('#intakeKicker');
const intakeTitle = document.querySelector('#intakeTitle');
const intakeDescription = document.querySelector('#intakeDescription');
const toast = document.querySelector('#toast');
const caseDialog = document.querySelector('#caseDialog');
const caseDialogImage = document.querySelector('#caseDialogImage');

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
  try { return JSON.parse(localStorage.getItem('bgdProject')) || defaultProject; }
  catch { return defaultProject; }
}

function showToast(message){
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3200);
}

function openIntake(service='', consultation='After you review my request'){
  if(service) serviceSelect.value = service;
  consultationSelect.value = consultation;
  const consultFirst = consultation === 'Before we define the project';
  intakeKicker.textContent = consultFirst ? '15-minute consultation' : 'Project request';
  intakeTitle.textContent = consultFirst ? 'Let’s talk before defining the project.' : 'What decision are you trying to make?';
  intakeDescription.textContent = consultFirst ? 'Share the essentials and your preferred timing. We will confirm a 15-minute conversation by email.' : 'Six short fields. Your request will go directly to our project inbox for review.';
  intakeDialog.showModal();
}

document.querySelectorAll('[data-open-intake]').forEach(button => button.addEventListener('click', () => openIntake()));
document.querySelectorAll('[data-open-consult]').forEach(button => button.addEventListener('click', () => openIntake('', 'Before we define the project')));
document.querySelectorAll('[data-service]').forEach(button => button.addEventListener('click', () => openIntake(button.dataset.service)));
document.querySelectorAll('[data-open-portal]').forEach(button => button.addEventListener('click', () => openPortal()));
document.querySelectorAll('[data-close-intake]').forEach(button => button.addEventListener('click', () => intakeDialog.close()));
document.querySelectorAll('[data-close-portal]').forEach(button => button.addEventListener('click', () => portalDialog.close()));

intakeForm.addEventListener('submit', async event => {
  event.preventDefault();
  const submitButton = intakeForm.querySelector('[type="submit"]');
  const originalLabel = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.textContent = 'Sending request…';
  const data = Object.fromEntries(new FormData(intakeForm).entries());
  localStorage.setItem('bgdProject', JSON.stringify(data));
  const payload = new FormData(intakeForm);
  payload.append('_subject', `[Bison Growth Desk] ${data.company} project request`);
  payload.append('fee_note', 'Fees and scope are negotiable. No payment is collected through the website.');
  try {
    const response = await fetch('https://formspree.io/f/mjkyagly', {
      method: 'POST',
      body: payload,
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) throw new Error('Request could not be sent');
    intakeDialog.close();
    intakeForm.reset();
    showToast('Request received. We will follow up by email to confirm next steps.');
  } catch (error) {
    showToast('The request did not send. Please try again in a moment.');
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

document.querySelectorAll('.score-options button').forEach(button => button.addEventListener('click', () => {
  const question = button.closest('.question');
  const key = question.dataset.question;
  diagnosticScores[key] = Number(button.dataset.score);
  question.querySelectorAll('button').forEach(option => option.classList.toggle('selected', option === button));
  if(diagnosticStep < diagnosticQuestions.length - 1){
    diagnosticQuestions[diagnosticStep].classList.remove('active');
    diagnosticStep += 1;
    diagnosticQuestions[diagnosticStep].classList.add('active');
    updateDiagnosticProgress();
  } else {
    showDiagnosticResult();
  }
}));

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
    question.querySelectorAll('button').forEach(button => button.classList.remove('selected'));
  });
  updateDiagnosticProgress();
});

const pilotInputs = ['pilotBudget','pilotRegistrations','pilotRate'].map(id => document.querySelector(`#${id}`));
function updatePilotEconomics(){
  const budget = Math.max(Number(document.querySelector('#pilotBudget').value) || 0, 0);
  const registrations = Math.max(Number(document.querySelector('#pilotRegistrations').value) || 0, 0);
  const rate = Math.min(Math.max(Number(document.querySelector('#pilotRate').value) || 0, 0), 100);
  const firstGames = registrations * (rate / 100);
  const currency = value => Number.isFinite(value) ? `$${value.toFixed(2)}` : '—';
  document.querySelector('#costPerRegistration').textContent = registrations ? currency(budget / registrations) : '—';
  document.querySelector('#costPerPlayer').textContent = firstGames ? currency(budget / firstGames) : '—';
  document.querySelector('#firstGameCount').textContent = `Assumes ${Math.round(firstGames)} first-game participants.`;
}
pilotInputs.forEach(input => input.addEventListener('input', updatePilotEconomics));
updatePilotEconomics();
