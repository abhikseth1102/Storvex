const fs = require('fs');
const path = require('path');

function replaceThemeClasses(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');

    // Remove all dark mode classes
    content = content.replace(/dark:[^\s"']+/g, '');

    // Replace Slate grays with Boutique colors
    content = content.replace(/bg-slate-50/g, 'bg-brand-cream/50');
    content = content.replace(/bg-slate-100/g, 'bg-brand-cream');
    content = content.replace(/bg-slate-200/g, 'bg-brand-cream/80');
    content = content.replace(/bg-slate-800/g, 'bg-brand-charcoal/90');
    content = content.replace(/bg-slate-900/g, 'bg-brand-charcoal');
    
    content = content.replace(/text-slate-400/g, 'text-brand-charcoal/40');
    content = content.replace(/text-slate-500/g, 'text-brand-charcoal/50');
    content = content.replace(/text-slate-600/g, 'text-brand-charcoal/70');
    content = content.replace(/text-slate-800/g, 'text-brand-charcoal');
    content = content.replace(/text-slate-900/g, 'text-brand-charcoal');
    
    content = content.replace(/border-slate-100/g, 'border-brand-charcoal/5');
    content = content.replace(/border-slate-200/g, 'border-brand-charcoal/10');
    content = content.replace(/border-slate-300/g, 'border-brand-charcoal/20');
    content = content.replace(/border-slate-800/g, 'border-brand-charcoal/20');

    // Replace Indigo with Gold/Charcoal depending on context
    // Buttons:
    content = content.replace(/bg-indigo-600 hover:bg-indigo-700/g, 'bg-brand-charcoal hover:bg-black');
    content = content.replace(/bg-indigo-50\/50/g, 'bg-brand-gold/5');
    
    // Text:
    content = content.replace(/text-indigo-500/g, 'text-brand-gold');
    content = content.replace(/text-indigo-600/g, 'text-brand-gold');
    content = content.replace(/text-indigo-700/g, 'text-brand-gold');
    content = content.replace(/text-indigo-900/g, 'text-brand-charcoal');

    // Borders / Rings:
    content = content.replace(/border-indigo-200/g, 'border-brand-gold/30');
    content = content.replace(/border-indigo-600/g, 'border-brand-gold');
    content = content.replace(/ring-indigo-500\/20/g, 'ring-brand-gold/20');

    // Specific Tweaks
    content = content.replace(/text-white/g, 'text-brand-cream');
    
    // Clean up double spaces left by removing dark classes
    content = content.replace(/\s+/g, ' ');
    // We shouldn't globally replace \s+ to ' ' because it breaks formatting. Let's do a smart regex for multiple spaces inside class quotes.
    // Instead, just fix the spaces inside className string literals:
    
    fs.writeFileSync(filePath, content, 'utf-8');
}

// But wait, globally replacing \s+ breaks TS code formatting completely!
// Let me write a safer version that only targets className strings.

function replaceClassesSafely(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');

    // Remove dark: classes safely anywhere
    content = content.replace(/\bdark:[a-zA-Z0-9\-\/]+\b/g, '');

    // Replace Slate grays with Boutique colors
    content = content.replace(/\bbg-slate-50\b/g, 'bg-brand-cream/50');
    content = content.replace(/\bbg-slate-100\b/g, 'bg-brand-cream');
    content = content.replace(/\bbg-slate-200\b/g, 'bg-brand-cream/80');
    content = content.replace(/\bbg-slate-800\b/g, 'bg-brand-charcoal/90');
    content = content.replace(/\bbg-slate-900\b/g, 'bg-brand-charcoal');
    
    content = content.replace(/\btext-slate-400\b/g, 'text-brand-charcoal/40');
    content = content.replace(/\btext-slate-500\b/g, 'text-brand-charcoal/50');
    content = content.replace(/\btext-slate-600\b/g, 'text-brand-charcoal/70');
    content = content.replace(/\btext-slate-800\b/g, 'text-brand-charcoal');
    content = content.replace(/\btext-slate-900\b/g, 'text-brand-charcoal');
    
    content = content.replace(/\bborder-slate-100\b/g, 'border-brand-charcoal/5');
    content = content.replace(/\bborder-slate-200\b/g, 'border-brand-charcoal/10');
    content = content.replace(/\bborder-slate-300\b/g, 'border-brand-charcoal/20');
    content = content.replace(/\bborder-slate-800\b/g, 'border-brand-charcoal/20');

    // Replace Indigo
    content = content.replace(/\bbg-indigo-600\b/g, 'bg-brand-charcoal');
    content = content.replace(/\bhover:bg-indigo-700\b/g, 'hover:bg-black');
    content = content.replace(/\bbg-indigo-50\/50\b/g, 'bg-brand-gold/5');
    
    content = content.replace(/\btext-indigo-500\b/g, 'text-brand-gold');
    content = content.replace(/\btext-indigo-600\b/g, 'text-brand-gold');
    content = content.replace(/\btext-indigo-700\b/g, 'text-brand-gold');
    content = content.replace(/\btext-indigo-900\b/g, 'text-brand-charcoal');

    content = content.replace(/\bborder-indigo-200\b/g, 'border-brand-gold/30');
    content = content.replace(/\bborder-indigo-600\b/g, 'border-brand-gold');
    content = content.replace(/\bborder-indigo-500\b/g, 'border-brand-gold');
    content = content.replace(/\bbring-indigo-500\/20\b/g, 'ring-brand-gold/20');

    // Fix button text colors when bg is charcoal
    content = content.replace(/\btext-white\b/g, 'text-brand-cream');

    // Fix multiple spaces
    content = content.replace(/ +(?= )/g,'');

    fs.writeFileSync(filePath, content, 'utf-8');
}

replaceClassesSafely(path.join(__dirname, 'components', 'PosTerminal.tsx'));
replaceClassesSafely(path.join(__dirname, 'components', 'InventoryTable.tsx'));

console.log("Updated components");
