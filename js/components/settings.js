import { StorageServiceInstance as StorageService } from './core.js';

export function initSettings() {
  const sidebarLinks = document.querySelector('.sidebar-links');
  if(!sidebarLinks) return;

  sidebarLinks.innerHTML = `
    <li id="set-profile" style="cursor: pointer; padding: 12px; border-radius: 8px; transition: background 0.2s;">User Profile Settings</li>
    <li id="set-privacy" style="cursor: pointer; padding: 12px; border-radius: 8px; transition: background 0.2s;">Privacy & Visibility</li>
    <li id="set-notifs" style="cursor: pointer; padding: 12px; border-radius: 8px; transition: background 0.2s;">Notification Preferences</li>
    <li id="set-account" style="cursor: pointer; padding: 12px; border-radius: 8px; transition: background 0.2s;">Account & Security</li>
  `;

  sidebarLinks.querySelectorAll('li').forEach(li => {
    li.addEventListener('mouseenter', () => li.style.background = 'rgba(255,255,255,0.05)');
    li.addEventListener('mouseleave', () => li.style.background = 'transparent');
    li.addEventListener('click', () => {
      if(window.showToast) window.showToast(`Navigating to ${li.textContent}...`, 'info');
    });
  });
}
