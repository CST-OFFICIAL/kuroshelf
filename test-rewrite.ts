import { rewriteSynopsis } from './server/aiService';

async function test() {
  const original = `Subaru Natsuki is an ordinary high school student who is lost in an alternate world... (Source: Anime News Network) [Written by MAL Rewrite]`;
  const result = await rewriteSynopsis(original);
  console.log('Original:', original);
  console.log('Rewritten:', result);
}
test();
