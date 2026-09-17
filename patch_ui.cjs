const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const target = `{rankingFilter === 'top100' ? (
                    <div className="flex flex-col gap-3 max-w-4xl mx-auto">`;

const currentYear = new Date().getFullYear();
const replacement = `{rankingFilter === 'top100' ? (
                    <div className="flex flex-col gap-3 max-w-4xl mx-auto">
                      <div className="flex gap-2 mb-2">
                        <select 
                          value={rankingGenre}
                          onChange={(e) => setRankingGenre(e.target.value)}
                          className="bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs rounded-lg px-3 py-2 outline-none focus:border-rose-500"
                        >
                          <option value="all">All Genres</option>
                          <option value="Action">Action</option>
                          <option value="Adventure">Adventure</option>
                          <option value="Comedy">Comedy</option>
                          <option value="Drama">Drama</option>
                          <option value="Fantasy">Fantasy</option>
                          <option value="Romance">Romance</option>
                          <option value="Sci-Fi">Sci-Fi</option>
                          <option value="Slice of Life">Slice of Life</option>
                          <option value="Horror">Horror</option>
                          <option value="Mystery">Mystery</option>
                          <option value="Sports">Sports</option>
                          <option value="Isekai">Isekai</option>
                        </select>
                        <select 
                          value={rankingYear}
                          onChange={(e) => setRankingYear(e.target.value)}
                          className="bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs rounded-lg px-3 py-2 outline-none focus:border-rose-500"
                        >
                          <option value="all">All Time</option>
                          <option value="${currentYear}">${currentYear}</option>
                          <option value="${currentYear - 1}">${currentYear - 1}</option>
                          <option value="${currentYear - 2}">${currentYear - 2}</option>
                          <option value="${currentYear - 3}">${currentYear - 3}</option>
                          <option value="${currentYear - 4}">${currentYear - 4}</option>
                          <option value="${currentYear - 5}">${currentYear - 5}</option>
                        </select>
                      </div>`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/App.tsx', code);
} else {
  console.log("Target not found!");
}
