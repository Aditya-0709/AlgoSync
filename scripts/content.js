import { platformService } from './services/platformService.js';
import { storageService } from './services/storageService.js';

export { detectPlatform, platforms } from './platforms/index.js';

const currentPlatform = platformService.detectPlatform();
if (currentPlatform) {
  storageService.get([`platform_${currentPlatform.id}_enabled`], (result) => {
    const enabled = result ? result[`platform_${currentPlatform.id}_enabled`] : true;
    if (enabled !== false) {
      console.log(`[AlgoSync] Active coding platform detected: ${currentPlatform.name}`);
      currentPlatform.init();
    } else {
      console.log(`[AlgoSync] Platform ${currentPlatform.name} is disabled by user in AlgoSync settings.`);
    }
  });
} else {
  console.log('[AlgoSync] No matching coding platform detected for URL:', typeof window !== 'undefined' && window.location ? window.location.href : '');
}
