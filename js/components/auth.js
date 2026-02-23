import { StorageServiceInstance as StorageService, setView } from './core.js';
import { renderStage } from './feed.js';
import { renderJobs } from './jobs.js';

// ONBOARDING WIZARD LOGIC
const obWizard = document.querySelector('#onboarding-wizard');
const obStep1 = document.querySelector('#ob-step-1');
const obStep2 = document.querySelector('#ob-step-2');
const obStep3 = document.querySelector('#ob-step-3');

const obSyncBtn = document.querySelector('#ob-sync-btn');
const obSyncingState = document.querySelector('#ob-syncing-state');
const obRecordBtn = document.querySelector('#ob-record-btn');
const obTaggingState = document.querySelector('#ob-tagging-state');
const obNextToVouch = document.querySelector('#ob-next-to-vouch');
const obFinishBtn = document.querySelector('#ob-finish-btn');

export function checkOnboarding() {
  const hasOnboarded = StorageService.get('kalakar_onboarded');
  if (!hasOnboarded) {
    obWizard.classList.remove('hidden');
  }
}

// Step 1: Sync
if (obSyncBtn) {
  obSyncBtn?.addEventListener('click', () => {
    obSyncBtn.style.display = 'none';
    obSyncingState.classList.remove('hidden');

    // Simulate IMDb scraping
    setTimeout(() => {
      obStep1.classList.add('hidden');
      obStep2.classList.remove('hidden');
    }, 2000);
  });
}

// Step 2: Record
if (obRecordBtn) {
  obRecordBtn?.addEventListener('click', () => {
    if (obRecordBtn.classList.contains('recording')) return;

    obRecordBtn.classList.add('recording');
    obRecordBtn.textContent = 'STOP';

    // Simulate 3 second recording
    setTimeout(() => {
      obRecordBtn.classList.remove('recording');
      obRecordBtn.textContent = 'ACTION';
      obRecordBtn.parentElement.style.display = 'none'; // hide controls

      // Show AI Tagging
      obTaggingState.classList.remove('hidden');

      setTimeout(() => document.querySelector('#tag-1').style.opacity = '1', 500);
      setTimeout(() => document.querySelector('#tag-2').style.opacity = '1', 1000);
      setTimeout(() => document.querySelector('#tag-3').style.opacity = '1', 1500);

      setTimeout(() => obNextToVouch.classList.remove('hidden'), 2500);

    }, 3000);
  });
}

if (obNextToVouch) {
  obNextToVouch?.addEventListener('click', () => {
    obStep2.classList.add('hidden');
    obStep3.classList.remove('hidden');
  });
}

// Step 3: Finish
if (obFinishBtn) {
  obFinishBtn?.addEventListener('click', () => {
    StorageService.set('kalakar_onboarded', true);
    obWizard.classList.add('hidden');

    // Inject the new user into the local database
    const creators = StorageService.get('kalakar_creators') || [];
    const newUser = {
      id: "ob_user_1",
      name: "You (New Artist)",
      role: "Actor",
      reliability: 50, // Starting score
      vouchedBy: "Pending",
      vp: 0,
      verified: true,
      tags: ["Mewari", "Intense"],
      credits: [{ title: "Verified via IMDb", role: "Var", year: 2023 }]
    };

    if (!creators.find(c => c.id === "ob_user_1")) {
      creators.unshift(newUser); // Add to top
      StorageService.set('kalakar_creators', creators);
      renderStage(); // Re-render to show themselves
    }
  });
}
// Phase 31: Supabase Authentication Flow
let currentAuthPhone = '';

document.getElementById('request-otp-btn')?.addEventListener('click', async (e) => {
  const phoneVal = document.getElementById('phone-input').value;
  if (phoneVal.length >= 10) {
    try {
      e.target.textContent = 'Sending OTP...';
      const formattedPhone = phoneVal.startsWith('+91') ? phoneVal : '+91' + phoneVal;
      currentAuthPhone = formattedPhone;

      const { data, error } = await window.supabaseClient.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) throw error;

      e.target.style.display = 'none';
      document.getElementById('otp-verification-step').style.display = 'block';
      document.getElementById('otp-input').focus();
    } catch (err) {
      alert("Supabase Error: Cannot send OTP. Please check project credentials. " + err.message);
      e.target.textContent = 'Continue with OTP';
    }
  } else {
    alert("Please enter a valid 10-digit number.");
  }
});

document.getElementById('verify-otp-btn')?.addEventListener('click', async (e) => {
  const otp = document.getElementById('otp-input').value;
  if (otp.length === 6) {
    try {
      e.target.textContent = 'Verifying...';
      const { data: { session }, error } = await window.supabaseClient.auth.verifyOtp({
        phone: currentAuthPhone,
        token: otp,
        type: 'sms',
      });

      if (error) throw error;

      // Successful Login
      document.getElementById('auth-screen').style.display = 'none';
      document.getElementById('identity-gate-modal').style.display = 'flex';
    } catch (err) {
      alert("Invalid OTP or Credentials. " + err.message);
      e.target.textContent = 'Verify & Login';
    }
  } else {
    alert("Please enter the 6-digit code.");
  }
});

// Identity Gate Logic
document.getElementById('btn-role-talent')?.addEventListener('click', async () => {
  document.getElementById('identity-gate-modal').style.display = 'none';

  // Phase 32: Insert authentic user into Creators table
  const { data: { user } } = await window.supabaseClient.auth.getUser();
  if (user) {
    try {
      await window.supabaseClient.from('creators').insert([{
        id: user.id,
        name: 'New Kalakar',
        role: 'Talent',
        verified: false,
        city: 'Mumbai',
        phone: user.phone
      }]);
    } catch (err) {
      console.warn("Could not insert creator record.", err);
    }
  }

  // Magic Moment: Talent (Trigger 3 step Onboarding Wizard)
  const wizard = document.querySelector('#onboarding-wizard');
  if (wizard) {
    wizard.classList.add('active');
    // Ensure we start at step 1
    document.querySelectorAll('.wizard-step').forEach(s => s.classList.remove('active'));
    document.querySelector('#wizard-step-1').classList.add('active');
  }
});

document.getElementById('btn-role-studio')?.addEventListener('click', () => {
  document.getElementById('identity-gate-modal').style.display = 'none';

  // Phase 33: Open Studio Setup Wizard
  const studioWizard = document.getElementById('studio-onboarding-wizard');
  if (studioWizard) {
    studioWizard.classList.remove('hidden');
    studioWizard.classList.add('active'); // active handles display block for modals
  }
});

// Phase 33: Studio Finalize Setup
document.getElementById('ob-studio-finish-btn')?.addEventListener('click', async (e) => {
  const btn = e.target;
  btn.textContent = 'Configuring Workspace...';

  const companyName = document.getElementById('studio-company-name').value || 'Independent Studio';
  const designation = document.getElementById('studio-designation').value || 'Recruiter';
  const gst = document.getElementById('studio-gst').value || '';

  // Insert into Supabase
  try {
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    if (user) {
      await window.supabaseClient.from('studios').insert([{
        id: user.id, // Primary key links to auth profile
        company_name: companyName,
        designation: designation,
        gst: gst,
        verified: false,
        phone: user.phone
      }]);
    }
  } catch (err) {
    console.warn("Could not insert studio record.", err);
  }

  // Close wizard and route directly to Jobs dashboard
  document.getElementById('studio-onboarding-wizard').classList.remove('active');
  document.getElementById('studio-onboarding-wizard').classList.add('hidden');

  // Set view to Jobs
  setView('jobs');
});
