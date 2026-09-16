import fs from 'fs';
let content = fs.readFileSync('src/components/HeroBanner.tsx', 'utf-8');

const target = `          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-1">`;

const replacement = `          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-1">
            <div className="w-full text-xs text-neutral-400 mb-2 font-medium">
              Powered by Jikan API • Full catalog of 25,000+ anime available via search
            </div>`;
content = content.replace(target, replacement);

fs.writeFileSync('src/components/HeroBanner.tsx', content);
