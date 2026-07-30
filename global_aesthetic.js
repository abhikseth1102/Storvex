const fs = require('fs');
const path = require('path');

function replaceClassesSafely(content) {
    // Remove dark: classes safely anywhere
    content = content.replace(/\bdark:[a-zA-Z0-9\-\/:]+\b/g, '');

    // Replace Slate grays with Boutique colors
    content = content.replace(/\bbg-slate-50\b/g, 'bg-brand-cream/50');
    content = content.replace(/\bbg-slate-100\b/g, 'bg-brand-cream');
    content = content.replace(/\bbg-slate-200\b/g, 'bg-brand-cream/80');
    content = content.replace(/\bbg-slate-800\b/g, 'bg-brand-charcoal/90');
    content = content.replace(/\bbg-slate-900\b/g, 'bg-brand-charcoal');
    content = content.replace(/\bbg-slate-950\b/g, 'bg-brand-charcoal');
    
    content = content.replace(/\btext-slate-400\b/g, 'text-brand-charcoal/40');
    content = content.replace(/\btext-slate-500\b/g, 'text-brand-charcoal/50');
    content = content.replace(/\btext-slate-600\b/g, 'text-brand-charcoal/70');
    content = content.replace(/\btext-slate-800\b/g, 'text-brand-charcoal');
    content = content.replace(/\btext-slate-900\b/g, 'text-brand-charcoal');
    
    content = content.replace(/\bborder-slate-100\b/g, 'border-brand-charcoal/5');
    content = content.replace(/\bborder-slate-200\b/g, 'border-brand-charcoal/10');
    content = content.replace(/\bborder-slate-300\b/g, 'border-brand-charcoal/20');
    content = content.replace(/\bborder-slate-700\b/g, 'border-brand-charcoal/20');
    content = content.replace(/\bborder-slate-800\b/g, 'border-brand-charcoal/20');

    // Replace Indigo
    content = content.replace(/\bbg-indigo-600\b/g, 'bg-brand-charcoal');
    content = content.replace(/\bbg-indigo-50\b/g, 'bg-brand-gold/10');
    content = content.replace(/\bhover:bg-indigo-700\b/g, 'hover:bg-black');
    content = content.replace(/\bbg-indigo-50\/50\b/g, 'bg-brand-gold/5');
    
    content = content.replace(/\btext-indigo-400\b/g, 'text-brand-gold');
    content = content.replace(/\btext-indigo-500\b/g, 'text-brand-gold');
    content = content.replace(/\btext-indigo-600\b/g, 'text-brand-gold');
    content = content.replace(/\btext-indigo-700\b/g, 'text-brand-gold');
    content = content.replace(/\btext-indigo-900\b/g, 'text-brand-charcoal');

    content = content.replace(/\bborder-indigo-200\b/g, 'border-brand-gold/30');
    content = content.replace(/\bborder-indigo-600\b/g, 'border-brand-gold');
    content = content.replace(/\bborder-indigo-500\b/g, 'border-brand-gold');
    content = content.replace(/\bring-indigo-500\/20\b/g, 'ring-brand-gold/20');

    // Fix button text colors when bg is charcoal
    content = content.replace(/\btext-white\b/g, 'text-brand-cream');

    // Fix multiple spaces
    content = content.replace(/ +(?= )/g,'');

    return content;
}

function getPageColors(pageName) {
    if (pageName === 'customers') return ['purple-200/30', 'fuchsia-200/20', 'brand-gold/10'];
    if (pageName === 'invoices') return ['blue-200/20', 'emerald-200/20', 'brand-gold/10'];
    if (pageName === 'procurement') return ['orange-200/20', 'yellow-200/20', 'brand-gold/10'];
    if (pageName === 'analytics' || pageName.includes('reports')) return ['indigo-200/20', 'violet-200/20', 'brand-gold/10'];
    if (pageName === 'staff' || pageName === 'accounts') return ['stone-300/30', 'zinc-300/20', 'brand-gold/10'];
    return ['rose-200/20', 'sky-200/20', 'brand-gold/10']; // default
}

function processFile(filePath) {
    const isComponent = filePath.includes('components');
    const isPage = filePath.includes('page.tsx') && !filePath.includes('pos\\page.tsx') && !filePath.includes('inventory\\page.tsx') && !filePath.includes('app\\page.tsx');
    
    if (!isComponent && !isPage) return;

    let content = fs.readFileSync(filePath, 'utf-8');
    
    if (isComponent) {
        content = replaceClassesSafely(content);
    }
    
    if (isPage) {
        // Extract page folder name
        const folderName = path.dirname(filePath).split(path.sep).pop();
        const colors = getPageColors(folderName);
        
        // Let's do string replacement for the wrapper div
        const wrapperStart = '<div className="min-h-screen';
        const newWrapper = `<div 
      className="min-h-screen font-sans pb-12 bg-brand-cream selection:bg-brand-gold/30 relative overflow-hidden z-0"
      style={{
        backgroundImage: \`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cpath d='M0 10 Q 10 5, 20 10 T 40 10 M0 30 Q 10 25, 20 30 T 40 30' fill='none' stroke='rgba(28,28,30,0.08)' stroke-width='1'/%3E%3Cpath d='M10 0 Q 5 10, 10 20 T 10 40 M30 0 Q 25 10, 30 20 T 30 40' fill='none' stroke='rgba(28,28,30,0.08)' stroke-width='1'/%3E%3C/svg%3E")\`,
        backgroundSize: '40px 40px'
      }}
    >
      {/* Artistic Free-form Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-${colors[0]} blur-[120px] mix-blend-multiply"></div>
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] rounded-full bg-${colors[1]} blur-[120px] mix-blend-multiply"></div>
        <div className="absolute -bottom-[10%] left-[20%] w-[60%] h-[50%] rounded-full bg-${colors[2]} blur-[120px] mix-blend-multiply"></div>
      </div>`;
        
        // Find where the wrapper div starts and ends its opening tag
        const wrapperRegex = /<div className="min-h-screen[^>]+>/;
        content = content.replace(wrapperRegex, newWrapper);

        // Replace the header className
        const headerRegex = /<header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800[^>]+>/;
        content = content.replace(headerRegex, '<header className="bg-white/60 backdrop-blur-xl border-b border-brand-charcoal/5 sticky top-0 z-20 transition-colors">');
        
        // Apply class replacements for the rest of the page (which will fix buttons in the header, etc)
        content = replaceClassesSafely(content);

        // Fix the specific title styling in headers (e.g. `Customer CRM`)
        // Storvex <span className="text-brand-gold font-extrabold">Customer CRM</span> -> 
        // Storvex <span className="text-sm font-sans font-extrabold uppercase tracking-widest text-brand-gold bg-brand-gold/10 px-2 py-0.5 rounded-full ml-1">Customer CRM</span>
        content = content.replace(
            /<span className="text-brand-gold font-extrabold">([^<]+)<\/span>/g,
            '<span className="text-sm font-sans font-extrabold uppercase tracking-widest text-brand-gold bg-brand-gold/10 px-2 py-0.5 rounded-full ml-1">$1</span>'
        );
        
        // Change the parent span font
        content = content.replace(
            /<span className="font-bold text-lg text-brand-charcoal">/g,
            '<span className="font-serif text-2xl tracking-wide text-brand-charcoal flex items-center gap-2">'
        );
        
        // KPI Cards Update
        // bg-brand-charcoal p-6 rounded-2xl border border-brand-charcoal/10 shadow-sm transition-colors -> 
        // bg-white/80 backdrop-blur-sm p-6 rounded-3xl border border-brand-charcoal/5 shadow-[0_4px_20px_-4px_rgba(28,28,30,0.05)] transition-all hover:shadow-[0_8px_30px_-4px_rgba(28,28,30,0.08)]
        content = content.replace(
            /className="bg-brand-charcoal p-6 rounded-2xl border border-brand-charcoal\/10 shadow-sm transition-colors"/g,
            'className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl border border-brand-charcoal/5 shadow-[0_4px_20px_-4px_rgba(28,28,30,0.05)] transition-all hover:shadow-[0_8px_30px_-4px_rgba(28,28,30,0.08)]"'
        );

        // Update KPI values text-3xl font-extrabold text-brand-charcoal mt-1 font-mono -> text-3xl font-serif text-brand-charcoal mt-2
        content = content.replace(
            /text-3xl font-extrabold([^>]+)mt-1 font-mono/g,
            'text-3xl font-serif$1mt-2'
        );
    }
    
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated ${filePath}`);
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.tsx')) {
            processFile(fullPath);
        }
    }
}

walkDir(path.join(__dirname, 'app'));
walkDir(path.join(__dirname, 'components'));
