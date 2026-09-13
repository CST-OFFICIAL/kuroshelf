import { getImageCandidates } from './src/utils/imageUtils';
import { DatabaseSync } from 'node:sqlite';
const db = new DatabaseSync('data/kuroshelf.db');
const row = db.prepare('SELECT images_json FROM anime WHERE mal_id = 59193').get() as {images_json: string};
console.log(getImageCandidates(JSON.parse(row.images_json)));
