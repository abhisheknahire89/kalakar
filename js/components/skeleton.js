export function getSkeleton(type) {
  if (type === 'feed') {
    return `
      <div class="skeleton-card panel mb-4" style="padding: 16px;">
        <div style="display: flex; gap: 12px; margin-bottom: 12px;">
          <div class="skeleton" style="width: 48px; height: 48px; border-radius: 50%;"></div>
          <div style="flex: 1;">
            <div class="skeleton" style="width: 120px; height: 16px; margin-bottom: 6px;"></div>
            <div class="skeleton" style="width: 80px; height: 12px;"></div>
          </div>
        </div>
        <div class="skeleton" style="width: 100%; height: 400px; border-radius: 12px; margin-bottom: 12px;"></div>
        <div style="display: flex; gap: 16px;">
          <div class="skeleton" style="width: 60px; height: 24px; border-radius: 12px;"></div>
          <div class="skeleton" style="width: 80px; height: 24px; border-radius: 12px;"></div>
        </div>
      </div>
    `;
  }
  
  if (type === 'job') {
    return `
      <div class="skeleton-card panel mb-3" style="padding: 24px;">
        <div class="skeleton" style="width: 200px; height: 20px; margin-bottom: 8px;"></div>
        <div class="skeleton" style="width: 140px; height: 14px; margin-bottom: 16px;"></div>
        <div style="display: flex; gap: 8px;">
          <div class="skeleton" style="width: 80px; height: 24px; border-radius: 12px;"></div>
          <div class="skeleton" style="width: 100px; height: 24px; border-radius: 12px;"></div>
        </div>
      </div>
    `;
  }
  
  if (type === 'talent') {
    return `
      <div class="skeleton-card panel" style="padding: 16px; display: flex; flex-direction: column; gap: 12px; align-items: center; text-align: center;">
        <div class="skeleton" style="width: 100%; height: 100px; border-radius: 8px;"></div>
        <div class="skeleton" style="width: 120px; height: 16px;"></div>
        <div class="skeleton" style="width: 80px; height: 12px;"></div>
        <div class="skeleton" style="width: 60px; height: 20px; border-radius: 10px;"></div>
      </div>
    `;
  }
}
