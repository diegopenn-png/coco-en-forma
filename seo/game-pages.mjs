import {readFileSync} from 'node:fs';
import {games, origin} from './catalog.mjs';

function readCopy(path) {
  return JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
}
export const landingLocales = readCopy('./locales/free-games.json');
export const localeNames = {es:'Español',en:'English',de:'Deutsch',nl:'Nederlands',fr:'Français',it:'Italiano',pl:'Polski',uk:'Українська',ru:'Русский','zh-Hans':'简体中文',ar:'العربية',sv:'Svenska',fi:'Suomi',nb:'Norsk bokmål',da:'Dansk'};
export const tags = Object.keys(localeNames);
export const localizedLandingPath = tag => tag === 'es' ? '/juegos-gratis/' : `/${tag.toLowerCase()}/${landingLocales[tag].slug}/`;
const copy = Object.fromEntries(tags.filter(tag => tag !== 'es').map(tag => [tag,readCopy(`./locales/game-pages/${tag}.json`)]));
export const gameCopy = (game, tag) => tag === 'es' ? game : copy[tag][game.id];
export const gamePath = (game, tag) => tag === 'es' ? game.path : localizedLandingPath(tag) + gameCopy(game, tag).slug + '/';
export const languageLinks = (game, tag) => tags.map(code => `<a href="${gamePath(game,code)}" hreflang="${code}" lang="${code}"${tag === code ? ' aria-current="page"' : ''}>${localeNames[code]}</a>`).join(' ');
export function alternates(game) {
  return [...tags,'x-default'].map(tag => `<link rel="alternate" hreflang="${tag}" href="${origin}${gamePath(game,tag === 'x-default' ? 'es' : tag)}">`).join('\n');
}
export const newGamePaths = () => games.flatMap(game => tags.filter(tag => tag !== 'es').map(tag => gamePath(game,tag)));
