// Matching positions in each list describe the same picture clue. Answers use
// native spelling and are stored with the board so changing the UI is lossless.
(function () {
  const clues = '🐈 🐕 🐟 🐦 🦉 🐸 🦁 🐯 🐼 🦊 🐻 🐘 🐢 🐬 🦋 🐰 🐴 🦒 ☀️ 🌙 ⭐ 🌧️ ☁️ 🌈 🌊 🌳 🌷 🍎 🍋 🍌 🥕 🍇'.split(' ');
  const words = {
    en:'cat dog fish bird owl frog lion tiger panda fox bear elephant turtle dolphin butterfly rabbit horse giraffe sun moon star rain cloud rainbow wave tree tulip apple lemon banana carrot grapes',
    de:'Katze Hund Fisch Vogel Eule Frosch Löwe Tiger Panda Fuchs Bär Elefant Schildkröte Delfin Schmetterling Kaninchen Pferd Giraffe Sonne Mond Stern Regen Wolke Regenbogen Welle Baum Tulpe Apfel Zitrone Banane Karotte Trauben',
    nl:'kat hond vis vogel uil kikker leeuw tijger panda vos beer olifant schildpad dolfijn vlinder konijn paard giraf zon maan ster regen wolk regenboog golf boom tulp appel citroen banaan wortel druiven',
    fr:'chat chien poisson oiseau hibou grenouille lion tigre panda renard ours éléphant tortue dauphin papillon lapin cheval girafe soleil lune étoile pluie nuage arc-en-ciel vague arbre tulipe pomme citron banane carotte raisins',
    it:'gatto cane pesce uccello gufo rana leone tigre panda volpe orso elefante tartaruga delfino farfalla coniglio cavallo giraffa sole luna stella pioggia nuvola arcobaleno onda albero tulipano mela limone banana carota uva',
    pl:'kot pies ryba ptak sowa żaba lew tygrys panda lis niedźwiedź słoń żółw delfin motyl królik koń żyrafa słońce księżyc gwiazda deszcz chmura tęcza fala drzewo tulipan jabłko cytryna banan marchew winogrona',
    uk:'кіт собака риба птах сова жаба лев тигр панда лис ведмідь слон черепаха дельфін метелик кролик кінь жирафа сонце місяць зірка дощ хмара веселка хвиля дерево тюльпан яблуко лимон банан морква виноград',
    ru:'кот собака рыба птица сова лягушка лев тигр панда лиса медведь слон черепаха дельфин бабочка кролик лошадь жираф солнце луна звезда дождь облако радуга волна дерево тюльпан яблоко лимон банан морковь виноград',
    'zh-Hans':'小猫 小狗 小鱼 小鸟 猫头鹰 青蛙 狮子 老虎 熊猫 狐狸 棕熊 大象 乌龟 海豚 蝴蝶 兔子 小马 长颈鹿 太阳 月亮 星星 雨水 白云 彩虹 海浪 大树 郁金香 苹果 柠檬 香蕉 胡萝卜 葡萄',
    ar:'قطة كلب سمكة طائر بومة ضفدع أسد نمر باندا ثعلب دب فيل سلحفاة دلفين فراشة أرنب حصان زرافة شمس قمر نجمة مطر سحابة قوس_قزح موجة شجرة توليب تفاحة ليمون موز جزر عنب',
    sv:'katt hund fisk fågel uggla groda lejon tiger panda räv björn elefant sköldpadda delfin fjäril kanin häst giraff sol måne stjärna regn moln regnbåge våg träd tulpan äpple citron banan morot vindruvor',
    fi:'kissa koira kala lintu pöllö sammakko leijona tiikeri panda kettu karhu norsu kilpikonna delfiini perhonen kani hevonen kirahvi aurinko kuu tähti sade pilvi sateenkaari aalto puu tulppaani omena sitruuna banaani porkkana viinirypäleet',
    nb:'katt hund fisk fugl ugle frosk løve tiger panda rev bjørn elefant skilpadde delfin sommerfugl kanin hest sjiraff sol måne stjerne regn sky regnbue bølge tre tulipan eple sitron banan gulrot druer',
    da:'kat hund fisk fugl ugle frø løve tiger panda ræv bjørn elefant skildpadde delfin sommerfugl kanin hest giraf sol måne stjerne regn sky regnbue bølge træ tulipan æble citron banan gulerod druer'
  };
  function boardWord(value) { return value.normalize('NFC').toUpperCase().replace(/[^\p{L}]/gu,''); }
  function bank(locale) {
    if (!Object.hasOwn(words,locale)) return null;
    return words[locale].split(' ').map((word,index)=>[boardWord(word),clues[index]]);
  }
  window.CocoWordGames=Object.freeze({bank,boardWord});
})();
