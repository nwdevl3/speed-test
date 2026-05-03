const fs = require('fs');
let css = fs.readFileSync('frontend/src/App.css', 'utf8');

// Replace all backgrounds/colors with variables
css = css.replace(/rgba\(255,\s*255,\s*255,\s*0\.0[1-5]\)/g, 'var(--surface)');
css = css.replace(/rgba\(255,\s*255,\s*255,\s*0\.0[6-8]\)/g, 'var(--surface-hover)');
css = css.replace(/rgba\(255,\s*255,\s*255,\s*0\.1[0-9]?\)/g, 'var(--surface-strong)');
css = css.replace(/rgba\(255,\s*255,\s*255,\s*0\.2[0-9]?\)/g, 'var(--border-hover)');
css = css.replace(/rgba\(255,\s*255,\s*255,\s*0\.[3-9][0-9]?\)/g, 'var(--text-secondary)');
css = css.replace(/#ffffff/gi, 'var(--text-primary)');
css = css.replace(/#fff/gi, 'var(--text-primary)');

fs.writeFileSync('frontend/src/App.css', css);
console.log('Fixed CSS!');
